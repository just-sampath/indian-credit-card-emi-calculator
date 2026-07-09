/**
 * Independent deep audit of EMI math vs what Indian cards typically bill.
 * Does not trust unit tests — re-derives and checks identities.
 */
import { writeFileSync } from "node:fs";
import {
  calculateEmiScenario,
  roundMoney,
  calcEMI,
  calcPVFromPayments,
  buildSchedule,
  GST_RATE,
} from "../src/lib/emi.js";

const findings = [];

function note(level, id, message, detail = null) {
  findings.push({ level, id, message, detail });
}

function basePays(total, months) {
  const roundedTotal = roundMoney(total);
  const standardPayment = roundMoney(roundedTotal / months);
  return Array.from({ length: months }, (_, i) =>
    i === months - 1
      ? roundMoney(roundedTotal - standardPayment * (months - 1))
      : standardPayment
  );
}

/** Bank-typical schedule: interest = round(bal*r), GST on that interest; last EMI adjusted. */
function bankStyleRegular(principal, monthlyRate, months) {
  const emi = roundMoney(calcEMI(principal, monthlyRate, months));
  let bal = roundMoney(principal);
  const rows = [];
  for (let m = 1; m <= months; m += 1) {
    const open = bal;
    const interest = roundMoney(open * monthlyRate);
    let payment;
    let prin;
    if (m === months) {
      prin = open;
      payment = roundMoney(prin + interest);
    } else {
      payment = emi;
      prin = roundMoney(payment - interest);
    }
    const close = m === months ? 0 : roundMoney(Math.max(0, open - prin));
    const gst = roundMoney(Math.max(0, interest) * GST_RATE);
    rows.push({
      month: m,
      open,
      interest,
      prin,
      payment,
      gst,
      total: roundMoney(payment + gst),
      close,
    });
    bal = close;
  }
  return { emi, rows };
}

/**
 * No-cost bank style:
 * - Base EMIs fixed to sum to MRP (last month absorbs paise)
 * - Interest each month = round(open * r)  [billed interest]
 * - Principal = baseEMI - interest
 * - Last month: principal = remaining; if baseEMI != prin+int, residual goes to interest
 *   (keeps sum(base) = MRP — what merchant/no-cost promises)
 * - GST on billed (rounded) interest
 */
function bankStyleNoCost(mrp, monthlyRate, months) {
  const payments = basePays(mrp, months);
  const principal = roundMoney(calcPVFromPayments(monthlyRate, payments));
  let bal = principal;
  const rows = [];
  for (let m = 1; m <= months; m += 1) {
    const open = bal;
    const formulaInterest = roundMoney(open * monthlyRate);
    let payment = payments[m - 1];
    let interest;
    let prin;
    if (m === months) {
      prin = open;
      // Keep fixed no-cost installment; residual interest closes the books
      interest = roundMoney(payment - prin);
      bal = 0;
    } else {
      interest = formulaInterest;
      prin = roundMoney(payment - interest);
      bal = roundMoney(Math.max(0, open - prin));
    }
    const gst = roundMoney(Math.max(0, interest) * GST_RATE);
    rows.push({
      month: m,
      open,
      interest,
      formulaInterest,
      prin,
      payment,
      gst,
      total: roundMoney(payment + gst),
      close: bal,
    });
  }
  return {
    principal,
    discount: roundMoney(mrp - principal),
    payments,
    rows,
  };
}

function sum(rows, key) {
  return roundMoney(rows.reduce((a, r) => a + r[key], 0));
}

// --- Compare app vs bank-style GST-on-billed-interest ---
function compareCase(label, opts) {
  const app = calculateEmiScenario(opts);
  const monthlyRate = (opts.annualRate || 0) / 1200;
  const months = opts.tenure;

  let expected;
  if (opts.isNoCost) {
    expected = bankStyleNoCost(opts.mrp, monthlyRate, months);
  } else {
    expected = bankStyleRegular(opts.mrp, monthlyRate, months);
  }

  const appRows = app.schedule;
  const expRows = expected.rows;
  const rowDiffs = [];

  for (let i = 0; i < months; i += 1) {
    const a = appRows[i];
    const e = expRows[i];
    const fields = [
      ["interest", "interest"],
      ["gst", "gst"],
      ["baseEMI", "payment"],
      ["totalPaid", "total"],
      ["principalPaid", "prin"],
      ["openingBalance", "open"],
      ["closingBalance", "close"],
    ];
    for (const [ak, ek] of fields) {
      if (Math.abs(a[ak] - e[ek]) > 0.005) {
        rowDiffs.push({
          month: i + 1,
          field: ak,
          app: a[ak],
          expected: e[ek],
          delta: roundMoney(a[ak] - e[ek]),
        });
      }
    }
  }

  // GST identity: each month gst should equal round(interest * 0.18)
  const gstOnBilledIssues = appRows
    .map((row) => {
      const want = roundMoney(Math.max(0, row.interest) * GST_RATE);
      return Math.abs(want - row.gst) > 0.005
        ? { month: row.month, interest: row.interest, gst: row.gst, want }
        : null;
    })
    .filter(Boolean);

  // prin + interest = baseEMI each month
  const splitIssues = appRows
    .map((row) => {
      const s = roundMoney(row.principalPaid + row.interest);
      return Math.abs(s - row.baseEMI) > 0.015
        ? { month: row.month, sum: s, base: row.baseEMI }
        : null;
    })
    .filter(Boolean);

  const sumPrin = sum(appRows.map((r) => ({ v: r.principalPaid })), "v");
  // fix sum helper usage
  const sumPrincipal = roundMoney(
    appRows.reduce((a, r) => a + r.principalPaid, 0)
  );
  const sumInterest = roundMoney(appRows.reduce((a, r) => a + r.interest, 0));
  const sumBase = roundMoney(appRows.reduce((a, r) => a + r.baseEMI, 0));
  const sumGst = roundMoney(appRows.reduce((a, r) => a + r.gst, 0));

  if (gstOnBilledIssues.length) {
    note(
      "error",
      `${label}:gst-on-billed`,
      "GST is not 18% of billed (rounded) interest — banks bill GST on the interest line",
      gstOnBilledIssues
    );
  }
  if (splitIssues.length) {
    note(
      "error",
      `${label}:split`,
      "Principal + Interest does not equal Base EMI",
      splitIssues
    );
  }
  if (Math.abs(sumPrincipal - app.principal) > 0.02) {
    note(
      "error",
      `${label}:principal-sum`,
      `Sum of principal paid ${sumPrincipal} != loan principal ${app.principal}`
    );
  }
  if (opts.isNoCost && Math.abs(sumBase - opts.mrp) > 0.02) {
    note(
      "error",
      `${label}:mrp-sum`,
      `No-cost base EMIs sum ${sumBase} != MRP ${opts.mrp}`
    );
  }
  if (opts.isNoCost && Math.abs(sumInterest - app.discount) > 0.1) {
    note(
      "warn",
      `${label}:interest-discount`,
      `Total interest ${sumInterest} vs discount ${app.discount} (rounding drift)`
    );
  }
  if (rowDiffs.length) {
    note(
      "error",
      `${label}:vs-bank-style`,
      `App schedule differs from bank-style reference (${rowDiffs.length} field diffs)`,
      rowDiffs.slice(0, 30)
    );
  } else {
    note("ok", `${label}:match`, "Matches bank-style reference exactly");
  }

  return {
    label,
    opts,
    app: {
      principal: app.principal,
      discount: app.discount,
      baseEMI: app.baseEMI,
      totalInterest: app.totalInterest,
      totalGST: app.totalGST,
      totalPaid: app.totalPaid,
      processingFeeTotal: app.processingFeeTotal,
      grandTotal: app.grandTotal,
      schedule: app.schedule,
    },
    expected: opts.isNoCost
      ? {
          principal: expected.principal,
          discount: expected.discount,
          rows: expected.rows,
        }
      : { emi: expected.emi, rows: expected.rows },
    sumPrincipal,
    sumInterest,
    sumBase,
    sumGst,
    rowDiffs,
    gstOnBilledIssues,
    splitIssues,
  };
}

const cases = [
  compareCase("razorpay-15k-3m-15pct", {
    mrp: 15000,
    annualRate: 15,
    tenure: 3,
    isNoCost: true,
    procFee: 0,
  }),
  compareCase("hdfc-like-no-cost", {
    mrp: 107705,
    annualRate: 17,
    tenure: 6,
    isNoCost: true,
    procFee: 199,
  }),
  compareCase("uneven-10000-no-cost", {
    mrp: 10000,
    annualRate: 15,
    tenure: 3,
    isNoCost: true,
    procFee: 299,
  }),
  compareCase("regular-50k-16pct", {
    mrp: 50000,
    annualRate: 16,
    tenure: 6,
    isNoCost: false,
    procFee: 299,
  }),
  compareCase("regular-107705-17pct", {
    mrp: 107705,
    annualRate: 17,
    tenure: 6,
    isNoCost: false,
    procFee: 199,
  }),
  compareCase("zero-rate-no-cost", {
    mrp: 15000,
    annualRate: 0,
    tenure: 3,
    isNoCost: true,
    procFee: 199,
  }),
  compareCase("one-month-regular", {
    mrp: 10000,
    annualRate: 15,
    tenure: 1,
    isNoCost: false,
    procFee: 99,
  }),
  compareCase("one-month-no-cost", {
    mrp: 10000,
    annualRate: 15,
    tenure: 1,
    isNoCost: true,
    procFee: 99,
  }),
];

// Stress: many combos for GST-on-billed and identities
let stressFails = 0;
const stressSamples = [];
for (const mrp of [9999, 10000, 15000, 29999, 42350, 50000, 107705]) {
  for (const rate of [0, 11.56, 15, 16, 17, 21]) {
    for (const n of [1, 3, 6, 9, 12]) {
      for (const isNoCost of [true, false]) {
        const app = calculateEmiScenario({
          mrp,
          annualRate: rate,
          tenure: n,
          isNoCost,
          procFee: 199,
        });
        for (const row of app.schedule) {
          const wantGst = roundMoney(Math.max(0, row.interest) * GST_RATE);
          const split = roundMoney(row.principalPaid + row.interest);
          if (
            Math.abs(wantGst - row.gst) > 0.005 ||
            Math.abs(split - row.baseEMI) > 0.02 ||
            row.interest < -0.05
          ) {
            stressFails += 1;
            if (stressSamples.length < 25) {
              stressSamples.push({
                mrp,
                rate,
                n,
                isNoCost,
                month: row.month,
                interest: row.interest,
                gst: row.gst,
                wantGst,
                split,
                base: row.baseEMI,
              });
            }
          }
        }
      }
    }
  }
}

// Preclosure double-count / composition check
const pre = calculateEmiScenario({
  mrp: 50000,
  annualRate: 16,
  tenure: 6,
  isNoCost: true,
  procFee: 299,
  preclosureMonth: 3,
  preclosureFeeRate: 0.03,
  preclosureInterestMonths: 1,
  merchantClawback: 0,
});
const paidSoFar = roundMoney(
  pre.schedule.slice(0, 3).reduce((a, r) => a + r.totalPaid, 0)
);
const out = pre.preclosure.outstandingPrincipal;
const fee = roundMoney(out * 0.03);
const feeGst = roundMoney(fee * 0.18);
const pInt = roundMoney(out * pre.monthlyRate * 1);
const pIntGst = roundMoney(pInt * 0.18);
const expectedPreTotal = roundMoney(
  paidSoFar + out + fee + feeGst + pInt + pIntGst + pre.processingFeeTotal
);

if (Math.abs(pre.preclosure.totalCost - expectedPreTotal) > 0.01) {
  note("error", "preclosure:composition", "Preclosure total composition wrong", {
    app: pre.preclosure.totalCost,
    expected: expectedPreTotal,
  });
} else {
  note("ok", "preclosure:composition", "Preclosure composition consistent");
}

// PV vs amortization interest consistency for no-cost
// After rounding amort, total interest may not equal theoretical discount if last month residual differs
const nc = calculateEmiScenario({
  mrp: 42350,
  annualRate: 17,
  tenure: 12,
  isNoCost: true,
  procFee: 0,
});
note(
  "info",
  "pv-vs-amort",
  "No-cost discount vs amortized interest (paise-level)",
  {
    discount: nc.discount,
    totalInterest: nc.totalInterest,
    delta: roundMoney(nc.totalInterest - nc.discount),
  }
);

// Document first-period limitation
note(
  "limitation",
  "first-emi-daycount",
  "Model assumes equal monthly periods (1/12 year). Real cards often charge first EMI interest from booking date to first payment due date (can be ≠ 30 days)."
);

// Processing fee not in monthly schedule (correct — one-time)
note(
  "info",
  "processing-fee-timing",
  "Processing fee is added only to grandTotal, not spread into monthly schedule. Real cards usually bill PF+GST in first statement separately — totals match if you add them once."
);

// Razorpay published numbers
const rz = calculateEmiScenario({
  mrp: 15000,
  annualRate: 15,
  tenure: 3,
  isNoCost: true,
  procFee: 0,
});
const razorpayOk =
  Math.abs(rz.principal - 14632.67) < 0.02 &&
  Math.abs(rz.discount - 367.33) < 0.02 &&
  rz.baseEMI === 5000;
note(
  razorpayOk ? "ok" : "error",
  "razorpay-published",
  razorpayOk
    ? "Matches Razorpay published principal/discount/EMI"
    : "Does NOT match Razorpay published example",
  {
    principal: rz.principal,
    discount: rz.discount,
    baseEMI: rz.baseEMI,
    totalGST: rz.totalGST,
    totalPaid: rz.totalPaid,
  }
);

// ClearTax-style: 30000 / 3 months — reverse engineer rate from their interest 734.66
// principal = 30000 - 734.66 = 29265.34; EMI = 10000
// Find r such that PV of 3x10000 ≈ 29265.34
let bestRate = null;
let bestErr = Infinity;
for (let bp = 1000; bp <= 3000; bp += 1) {
  const rate = bp / 100;
  const pv = roundMoney(calcPVFromPayments(rate / 1200, [10000, 10000, 10000]));
  const err = Math.abs(pv - 29265.34);
  if (err < bestErr) {
    bestErr = err;
    bestRate = rate;
  }
}
const ct = calculateEmiScenario({
  mrp: 30000,
  annualRate: bestRate,
  tenure: 3,
  isNoCost: true,
  procFee: 0,
});
note("info", "cleartax-reverse-rate", "ClearTax 30k/3m example reverse-engineered", {
  publishedInterest: 734.66,
  bestRate,
  bestErr,
  appPrincipal: ct.principal,
  appInterest: ct.totalInterest,
  appGst: ct.totalGST,
  appMonth1: ct.schedule[0],
});

// Schedule total must use sum of installments, not firstEMI × N
const uneven = calculateEmiScenario({
  mrp: 10000,
  annualRate: 15,
  tenure: 3,
  isNoCost: true,
  procFee: 0,
});
const footerWrong = roundMoney(uneven.baseEMI * 3);
const footerRight = uneven.totalBasePaid;
if (Math.abs(footerRight - 10000) > 0.001) {
  note(
    "error",
    "ui:totalBasePaid",
    `totalBasePaid=${footerRight} should equal MRP 10000`,
    { payments: uneven.schedule.map((r) => r.baseEMI) }
  );
} else if (Math.abs(footerWrong - footerRight) > 0.001) {
  note(
    "ok",
    "ui:totalBasePaid",
    `totalBasePaid correctly sums installments (${footerRight}); firstEMI×N would wrongly show ${footerWrong}`,
    { payments: uneven.schedule.map((r) => r.baseEMI) }
  );
}

// Negative interest trap: if principal PV rounds high, last residual can go weird
// Force check when PV slightly inconsistent
const edge = calculateEmiScenario({
  mrp: 10001,
  annualRate: 17,
  tenure: 12,
  isNoCost: true,
  procFee: 0,
});
const last = edge.schedule.at(-1);
const formulaLast = roundMoney(last.openingBalance * edge.monthlyRate);
note("info", "last-month-residual", "Last no-cost month residual vs formula interest", {
  residualInterest: last.interest,
  formulaInterest: formulaLast,
  delta: roundMoney(last.interest - formulaLast),
  gst: last.gst,
  gstOnResidual: roundMoney(Math.max(0, last.interest) * 0.18),
  gstOnFormula: roundMoney(Math.max(0, formulaLast) * 0.18),
});

const report = {
  summary: {
    errors: findings.filter((f) => f.level === "error").length,
    warns: findings.filter((f) => f.level === "warn").length,
    oks: findings.filter((f) => f.level === "ok").length,
    stressCellFailures: stressFails,
  },
  findings,
  stressSamples,
  cases: cases.map((c) => ({
    label: c.label,
    rowDiffCount: c.rowDiffs.length,
    gstIssues: c.gstOnBilledIssues.length,
    splitIssues: c.splitIssues.length,
    appGrand: c.app.grandTotal,
    appGst: c.app.totalGST,
    appInterest: c.app.totalInterest,
    firstDiffs: c.rowDiffs.slice(0, 8),
  })),
};

writeFileSync("math-audit-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));
console.log(
  findings
    .map((f) => `[${f.level}] ${f.id}: ${f.message}`)
    .join("\n")
);
console.log("stress fails", stressFails);
if (stressSamples.length) console.log("sample", JSON.stringify(stressSamples[0]));
