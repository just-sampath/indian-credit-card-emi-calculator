import {
  GST_RATE,
  PRECLOSURE_FEE,
  DAY_COUNT_ACTUAL365,
  DAY_COUNT_THIRTY,
  calcEMI,
  calcPV,
  calcPVFromPayments,
  calcPVFromPaymentsIrregular,
  periodRate,
  buildBasePayments,
  buildSchedule,
  calculateEmiScenario,
  roundMoney,
} from "../../src/lib/emi.js";

/** Independent GST: banks charge 18% on the billed (rounded) interest line. */
function gstOnInterest(interest) {
  return roundMoney(Math.max(0, interest) * GST_RATE);
}

describe("roundMoney / base payments", () => {
  it("rounds to paise", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(10.004)).toBe(10);
  });

  it("splits MRP into installments that sum exactly to MRP", () => {
    const pays = buildBasePayments(10000, 3);
    expect(pays).toEqual([3333.33, 3333.33, 3333.34]);
    expect(roundMoney(pays.reduce((a, b) => a + b, 0))).toBe(10000);
  });
});

describe("formulas", () => {
  it("calculates reducing-balance EMI", () => {
    // Independent: P=100000, 12% p.a., 12 months → r=0.01
    // EMI = 100000*0.01*(1.01)^12 / ((1.01)^12-1)
    const emi = calcEMI(100000, 0.01, 12);
    // Formula identity: PV of this EMI at 1%/mo for 12 months ≈ principal
    expect(calcPV(0.01, 12, emi)).toBeCloseTo(100000, 6);
    expect(roundMoney(emi)).toBe(8884.88);
  });

  it("calculates present value of level payments", () => {
    expect(calcPV(0.01, 12, 8884.878869738548)).toBeCloseTo(100000, 4);
  });

  it("PV of uneven payments matches sum of discounted cash flows", () => {
    const pays = [3333.33, 3333.33, 3333.34];
    const r = 0.15 / 12;
    const expected =
      pays[0] / (1 + r) + pays[1] / (1 + r) ** 2 + pays[2] / (1 + r) ** 3;
    expect(calcPVFromPayments(r, pays)).toBeCloseTo(expected, 10);
  });
});

describe("first-period day-count", () => {
  it("30-day convention pro-rates monthly rate by days/30", () => {
    const monthlyRate = 0.15 / 12;
    expect(
      periodRate({
        monthlyRate,
        annualRate: 15,
        days: 22,
        convention: DAY_COUNT_THIRTY,
        isFirstPeriod: true,
      })
    ).toBeCloseTo(monthlyRate * (22 / 30), 12);
    expect(
      periodRate({
        monthlyRate,
        annualRate: 15,
        days: 30,
        convention: DAY_COUNT_THIRTY,
        isFirstPeriod: true,
      })
    ).toBeCloseTo(monthlyRate, 12);
  });

  it("actual/365 uses annual rate × days/365", () => {
    expect(
      periodRate({
        monthlyRate: 0.15 / 12,
        annualRate: 15,
        days: 22,
        convention: DAY_COUNT_ACTUAL365,
        isFirstPeriod: true,
      })
    ).toBeCloseTo(0.15 * (22 / 365), 12);
  });

  it("irregular PV discounts first period at first-period rate", () => {
    const pays = [5000, 5000, 5000];
    const monthly = 0.15 / 12;
    const first = monthly * (22 / 30);
    const expected =
      5000 / (1 + first) +
      5000 / ((1 + first) * (1 + monthly)) +
      5000 / ((1 + first) * (1 + monthly) ** 2);
    expect(calcPVFromPaymentsIrregular(pays, first, monthly)).toBeCloseTo(
      expected,
      10
    );
  });

  it("pro-rates month-1 interest and keeps months 2+ on full monthly rate", () => {
    const result = calculateEmiScenario({
      mrp: 15000,
      annualRate: 15,
      tenure: 3,
      isNoCost: true,
      procFee: 0,
      firstPeriodDays: 22,
      dayCountConvention: DAY_COUNT_THIRTY,
    });

    const r = 0.15 / 12;
    const m1 = result.schedule[0];
    const m2 = result.schedule[1];

    expect(m1.periodDays).toBe(22);
    expect(m1.interest).toBe(
      roundMoney(result.principal * r * (22 / 30))
    );
    expect(m1.gst).toBe(gstOnInterest(m1.interest));
    expect(m2.periodDays).toBe(30);
    expect(m2.interest).toBe(roundMoney(m2.openingBalance * r));
    // Shorter first period → higher principal / lower discount than 30-day
    const equal = calculateEmiScenario({
      mrp: 15000,
      annualRate: 15,
      tenure: 3,
      isNoCost: true,
      procFee: 0,
      firstPeriodDays: 30,
    });
    expect(result.principal).toBeGreaterThan(equal.principal);
    expect(result.discount).toBeLessThan(equal.discount);
  });

  it("actual/365 month-1 interest matches P × rate × days/365", () => {
    const result = calculateEmiScenario({
      mrp: 15000,
      annualRate: 15,
      tenure: 3,
      isNoCost: true,
      procFee: 0,
      firstPeriodDays: 22,
      dayCountConvention: DAY_COUNT_ACTUAL365,
    });
    const m1 = result.schedule[0];
    expect(m1.interest).toBe(
      roundMoney(result.principal * 0.15 * (22 / 365))
    );
  });
});

describe("buildSchedule — GST on billed interest", () => {
  it("applies GST to rounded interest, not raw float", () => {
    // Opening such that raw interest is not a clean 2-dp * 0.18 edge
    // bal=9815.58, r=0.15/12 → raw=122.69475 → interest=122.69
    // GST must be round(122.69*0.18)=22.08, NOT round(122.69475*0.18)=22.09
    const schedule = buildSchedule(9815.58, 0.15 / 12, 5000, 2);
    expect(schedule[0].interest).toBe(122.69);
    expect(schedule[0].gst).toBe(22.08);
    expect(schedule[0].gst).toBe(gstOnInterest(schedule[0].interest));
  });

  it("closes regular EMI with adjusted final payment", () => {
    const emi = roundMoney(calcEMI(50000, 0.16 / 12, 6));
    const schedule = buildSchedule(50000, 0.16 / 12, emi, 6);
    expect(schedule.at(-1).closingBalance).toBe(0);
    expect(schedule.at(-1).principalPaid).toBe(schedule.at(-1).openingBalance);
    // Final payment = principal remaining + formula interest
    expect(schedule.at(-1).baseEMI).toBe(
      roundMoney(schedule.at(-1).principalPaid + schedule.at(-1).interest)
    );
  });
});

describe("calculateEmiScenario — regular EMI", () => {
  it("bills principal=MRP, interest reducing, GST+PF correctly", () => {
    const result = calculateEmiScenario({
      mrp: 50000,
      annualRate: 16,
      tenure: 6,
      isNoCost: false,
      procFee: 299,
    });

    expect(result.principal).toBe(50000);
    expect(result.discount).toBe(0);
    expect(result.processingFee).toBe(299);
    expect(result.processingFeeGst).toBe(53.82);
    expect(result.processingFeeTotal).toBe(352.82);

    // Accounting identities
    const sumPrin = roundMoney(
      result.schedule.reduce((a, r) => a + r.principalPaid, 0)
    );
    const sumInt = roundMoney(
      result.schedule.reduce((a, r) => a + r.interest, 0)
    );
    const sumGst = roundMoney(result.schedule.reduce((a, r) => a + r.gst, 0));
    const sumBase = roundMoney(
      result.schedule.reduce((a, r) => a + r.baseEMI, 0)
    );

    expect(sumPrin).toBe(result.principal);
    expect(sumInt).toBe(result.totalInterest);
    expect(sumGst).toBe(result.totalGST);
    expect(sumBase).toBe(result.totalBasePaid);
    expect(result.totalPaid).toBe(roundMoney(sumBase + sumGst));
    expect(result.grandTotal).toBe(
      roundMoney(result.totalPaid + result.processingFeeTotal)
    );
    expect(result.extraCostAboveMRP).toBe(
      roundMoney(result.grandTotal - 50000)
    );

    result.schedule.forEach((row) => {
      expect(row.gst).toBe(gstOnInterest(row.interest));
      expect(roundMoney(row.principalPaid + row.interest)).toBe(row.baseEMI);
      expect(row.totalPaid).toBe(roundMoney(row.baseEMI + row.gst));
    });
  });
});

describe("calculateEmiScenario — no-cost EMI (gateway model)", () => {
  it("matches Razorpay published 15k / 3m / 15% example", () => {
    // https://razorpay.com/docs/payments/offers/no-cost-emi/
    // principal 14632.67, discount 367.33, EMI 5000
    const result = calculateEmiScenario({
      mrp: 15000,
      annualRate: 15,
      tenure: 3,
      isNoCost: true,
      procFee: 0,
    });

    expect(result.principal).toBe(14632.67);
    expect(result.discount).toBe(367.33);
    expect(result.baseEMI).toBe(5000);
    expect(result.totalBasePaid).toBe(15000);
    expect(result.totalInterest).toBe(367.33);

    // Independently computed GST on each billed interest line
    const expectedGst = sumGstFromSchedule(result.schedule);
    expect(result.totalGST).toBe(expectedGst);
    expect(result.totalGST).toBe(66.11); // 32.92 + 22.08 + 11.11
    expect(result.totalPaid).toBe(15066.11);
    expect(result.grandTotal).toBe(15066.11);
    expect(result.extraCostAboveMRP).toBe(66.11);
  });

  it("matches ClearTax no-cost 30k / 3m / 15% month-1 breakdown", () => {
    // ClearTax: interest 365.82, principal 9634.18, GST 65.85, payable 10065.85
    const result = calculateEmiScenario({
      mrp: 30000,
      annualRate: 15,
      tenure: 3,
      isNoCost: true,
      procFee: 0,
    });

    expect(result.principal).toBe(29265.34);
    expect(result.discount).toBe(734.66);
    expect(result.schedule[0]).toMatchObject({
      interest: 365.82,
      principalPaid: 9634.18,
      gst: 65.85,
      baseEMI: 10000,
      totalPaid: 10065.85,
    });
    expect(result.totalGST).toBe(132.24);
  });

  it("keeps no-cost base EMIs summing to MRP with uneven paise split", () => {
    const result = calculateEmiScenario({
      mrp: 10000,
      annualRate: 15,
      tenure: 3,
      isNoCost: true,
      procFee: 299,
    });

    expect(result.basePayments).toEqual([3333.33, 3333.33, 3333.34]);
    expect(result.totalBasePaid).toBe(10000);
    // Must NOT use firstEMI * N
    expect(roundMoney(result.baseEMI * 3)).toBe(9999.99);
    expect(result.totalBasePaid).not.toBe(roundMoney(result.baseEMI * 3));

    expect(result.processingFeeTotal).toBe(352.82);
    expect(result.grandTotal).toBe(
      roundMoney(result.totalPaid + result.processingFeeTotal)
    );
    // True extra above MRP = GST on interest + PF with GST
    expect(result.extraCostAboveMRP).toBe(
      roundMoney(result.totalGST + result.processingFeeTotal)
    );
  });

  it("includes processing fee GST once outside monthly schedule", () => {
    const result = calculateEmiScenario({
      mrp: 15000,
      annualRate: 15,
      tenure: 3,
      isNoCost: true,
      procFee: 299,
    });

    // Monthly totals exclude PF
    expect(result.totalPaid).toBe(roundMoney(15000 + result.totalGST));
    expect(result.grandTotal).toBe(
      roundMoney(result.totalPaid + 299 + roundMoney(299 * 0.18))
    );
  });
});

describe("pre-closure composition", () => {
  it("adds outstanding principal, fee+GST, optional interest+GST, PF, clawback", () => {
    const result = calculateEmiScenario({
      mrp: 50000,
      annualRate: 16,
      tenure: 6,
      isNoCost: true,
      procFee: 299,
      preclosureMonth: 3,
      preclosureFeeRate: PRECLOSURE_FEE,
      preclosureInterestMonths: 1,
      merchantClawback: 400,
    });

    const p = result.preclosure;
    const paidSoFar = roundMoney(
      result.schedule.slice(0, 3).reduce((a, r) => a + r.totalPaid, 0)
    );
    expect(p.paidSoFar).toBe(paidSoFar);
    expect(p.preclosureFee).toBe(
      roundMoney(p.outstandingPrincipal * PRECLOSURE_FEE)
    );
    expect(p.preclosureFeeGst).toBe(gstOnInterest(p.preclosureFee)); // same 18% helper
    expect(p.preclosureInterest).toBe(
      roundMoney(p.outstandingPrincipal * result.monthlyRate)
    );
    expect(p.preclosureInterestGst).toBe(gstOnInterest(p.preclosureInterest));
    expect(p.merchantClawback).toBe(400);
    expect(p.totalCost).toBe(
      roundMoney(
        p.paidSoFar +
          p.outstandingPrincipal +
          p.preclosureFee +
          p.preclosureFeeGst +
          p.preclosureInterest +
          p.preclosureInterestGst +
          result.processingFeeTotal +
          p.merchantClawback
      )
    );
  });
});

describe("stress identities across rates and tenures", () => {
  it("every schedule row has GST on billed interest and prin+int=base", () => {
    const failures = [];
    for (const mrp of [9999, 10000, 15000, 42350, 50000, 107705]) {
      for (const rate of [0, 11.56, 15, 16, 17, 21]) {
        for (const n of [1, 3, 6, 9, 12]) {
          for (const isNoCost of [true, false]) {
            const result = calculateEmiScenario({
              mrp,
              annualRate: rate,
              tenure: n,
              isNoCost,
              procFee: 199,
            });

            const sumPrin = roundMoney(
              result.schedule.reduce((a, r) => a + r.principalPaid, 0)
            );
            if (Math.abs(sumPrin - result.principal) > 0.02) {
              failures.push({ kind: "prin-sum", mrp, rate, n, isNoCost });
            }
            if (isNoCost && Math.abs(result.totalBasePaid - mrp) > 0.02) {
              failures.push({ kind: "base-mrp", mrp, rate, n });
            }

            for (const row of result.schedule) {
              if (Math.abs(row.gst - gstOnInterest(row.interest)) > 0.001) {
                failures.push({
                  kind: "gst",
                  mrp,
                  rate,
                  n,
                  isNoCost,
                  month: row.month,
                  interest: row.interest,
                  gst: row.gst,
                  want: gstOnInterest(row.interest),
                });
              }
              if (
                Math.abs(
                  roundMoney(row.principalPaid + row.interest) - row.baseEMI
                ) > 0.02
              ) {
                failures.push({
                  kind: "split",
                  mrp,
                  rate,
                  n,
                  isNoCost,
                  month: row.month,
                });
              }
            }
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

function sumGstFromSchedule(schedule) {
  return roundMoney(
    schedule.reduce((a, row) => a + gstOnInterest(row.interest), 0)
  );
}
