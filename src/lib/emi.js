/**
 * Indian credit-card EMI math (statement-oriented).
 *
 * - Interest: monthly reducing balance; GST 18% on billed (rounded) interest
 * - Processing fee: one-time, GST-exclusive input + 18% GST
 * - Regular EMI: principal = MRP; fixed EMI from standard formula; last EMI clears balance
 * - No-cost EMI: base installments sum to MRP; principal = PV of those payments;
 *   merchant discount = MRP − principal; GST on interest still paid by customer
 * - First EMI day-count (statement-perfect):
 *   Interest from loan booking → first payment due date can be ≠ one full month.
 *   Months 2…N use full monthly rate (PDD → PDD).
 *   Conventions:
 *     - thirty:    open × (annual/1200) × (days/30)   ← common card-EMI pro-rata
 *     - actual365: open × (annual/100) × (days/365)
 *   When days = 30 and convention = thirty, behaviour matches equal monthly periods.
 */

export const GST_RATE = 0.18;
export const PRECLOSURE_FEE = 0.03;
export const DEFAULT_FIRST_PERIOD_DAYS = 30;
/** @typedef {'thirty' | 'actual365'} DayCountConvention */
export const DAY_COUNT_THIRTY = "thirty";
export const DAY_COUNT_ACTUAL365 = "actual365";

/** Round to Indian paise (2 decimal places, half-up via Math.round). */
export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function sumMoney(values) {
  return values.reduce((total, value) => roundMoney(total + value), 0);
}

/**
 * Split a rupee total into N installment amounts that sum exactly to total.
 * First N-1 months get round2(total/N); last month absorbs the remainder.
 */
export function buildBasePayments(totalBasePayment, months) {
  const roundedTotal = roundMoney(totalBasePayment);
  const n = Math.max(1, Math.trunc(months));
  const standardPayment = roundMoney(roundedTotal / n);

  return Array.from({ length: n }, (_, index) => {
    if (index === n - 1) {
      return roundMoney(roundedTotal - standardPayment * (n - 1));
    }
    return standardPayment;
  });
}

/** Standard reducing-balance EMI (unrounded). */
export function calcEMI(principal, monthlyRate, months) {
  if (monthlyRate === 0) {
    return principal / months;
  }

  const r = monthlyRate;
  const n = months;

  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** PV of a level annuity (payment at end of each month). */
export function calcPV(monthlyRate, months, payment) {
  if (monthlyRate === 0) {
    return payment * months;
  }

  const r = monthlyRate;
  const n = months;

  return (payment * (1 - Math.pow(1 + r, -n))) / r;
}

/** PV of an explicit payment series (equal period rate every month). */
export function calcPVFromPayments(monthlyRate, payments) {
  if (monthlyRate === 0) {
    return sumMoney(payments);
  }

  return payments.reduce(
    (total, payment, index) =>
      total + payment / Math.pow(1 + monthlyRate, index + 1),
    0
  );
}

/**
 * Effective interest rate for a single period given day-count rules.
 * Month 1 uses first-period days; later months use full monthly rate.
 */
export function periodRate({
  monthlyRate,
  annualRate,
  days,
  convention,
  isFirstPeriod,
}) {
  if (!isFirstPeriod) {
    return monthlyRate;
  }

  const periodDays = Math.max(0, Number(days) || 0);

  if (convention === DAY_COUNT_ACTUAL365) {
    return (Number(annualRate) || 0) / 100 * (periodDays / 365);
  }

  // Default: 30-day month convention (pro-rata of monthly reducing rate)
  return monthlyRate * (periodDays / 30);
}

/**
 * PV when the first period rate can differ from subsequent monthly rates
 * (statement-perfect no-cost principal with short/long first period).
 */
export function calcPVFromPaymentsIrregular(payments, firstPeriodRate, monthlyRate) {
  let pv = 0;
  let discountFactor = 1;

  for (let index = 0; index < payments.length; index += 1) {
    const rate = index === 0 ? firstPeriodRate : monthlyRate;
    discountFactor *= 1 + rate;
    pv += payments[index] / discountFactor;
  }

  return pv;
}

/**
 * Effective annual cost of a purchase paid over time, quoted the way banks
 * quote card rates (monthly IRR × 12, in percent).
 *
 * Solves  Σ amount / (1 + r)^months  =  amountReceived  for the monthly rate r.
 * Returns null when there is nothing to solve or the rate is off the charts.
 *
 * @param {number} amountReceived - value received today (the product MRP)
 * @param {{months: number, amount: number}[]} cashflows - payments after today
 */
export function calcEffectiveAnnualRate(amountReceived, cashflows) {
  if (!(amountReceived > 0) || cashflows.length === 0) {
    return null;
  }

  const npv = (rate) =>
    cashflows.reduce(
      (total, cashflow) =>
        total + cashflow.amount / Math.pow(1 + rate, cashflow.months),
      0
    ) - amountReceived;

  let low = -0.99;
  let high = 1;

  if (npv(low) < 0 || npv(high) > 0) {
    return null;
  }

  // NPV falls as the rate rises, so bisection converges on the single root.
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const mid = (low + high) / 2;
    if (npv(mid) > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return ((low + high) / 2) * 12 * 100;
}

/**
 * Billed interest for a period (rounded to paise).
 */
export function calcPeriodInterest(openingBalance, rate) {
  return roundMoney(openingBalance * rate);
}

/**
 * Build amortization schedule.
 *
 * @param {number} principal
 * @param {number} monthlyRate - annualRate / 1200
 * @param {number|number[]} baseEMI
 * @param {number} months
 * @param {object} [periodOptions]
 * @param {number} [periodOptions.firstPeriodDays=30]
 * @param {DayCountConvention} [periodOptions.dayCountConvention='thirty']
 * @param {number} [periodOptions.annualRate=0] - percent p.a., needed for actual/365
 */
export function buildSchedule(
  principal,
  monthlyRate,
  baseEMI,
  months,
  periodOptions = {}
) {
  const {
    firstPeriodDays = DEFAULT_FIRST_PERIOD_DAYS,
    dayCountConvention = DAY_COUNT_THIRTY,
    annualRate = 0,
  } = periodOptions;

  const rows = [];
  let balance = roundMoney(principal);
  const hasExplicitPayments = Array.isArray(baseEMI);
  const basePayments = hasExplicitPayments
    ? baseEMI.map((payment) => roundMoney(payment))
    : Array.from({ length: months }, () => roundMoney(baseEMI));

  for (let month = 1; month <= months; month += 1) {
    const isLastMonth = month === months;
    const isFirstPeriod = month === 1;
    const openingBalance = roundMoney(balance);
    const rate = periodRate({
      monthlyRate,
      annualRate,
      days: firstPeriodDays,
      convention: dayCountConvention,
      isFirstPeriod,
    });
    const periodDays = isFirstPeriod
      ? Math.max(0, Number(firstPeriodDays) || 0)
      : 30;
    const formulaInterest = calcPeriodInterest(openingBalance, rate);
    let payment = basePayments[month - 1];
    let interest;
    let principalPaid;
    let closingBalance;

    if (isLastMonth) {
      // Always clear remaining principal on the final installment.
      principalPaid = openingBalance;

      if (hasExplicitPayments) {
        // No-cost: keep fixed installment so sum(base) = MRP.
        // Residual (payment − principal) is the billed interest for the last period.
        interest = roundMoney(payment - principalPaid);
      } else {
        // Regular: final payment = remaining principal + period interest.
        interest = formulaInterest;
        payment = roundMoney(principalPaid + interest);
      }

      closingBalance = 0;
    } else {
      interest = formulaInterest;
      principalPaid = roundMoney(payment - interest);

      // Pathological high-rate / tiny-EMI guard.
      if (principalPaid < 0) {
        principalPaid = 0;
        interest = payment;
      }

      closingBalance = roundMoney(
        Math.max(0, openingBalance - principalPaid)
      );
    }

    // GST on the interest *shown on the statement* (billed interest).
    const gst = roundMoney(Math.max(0, interest) * GST_RATE);
    const totalPaid = roundMoney(payment + gst);

    rows.push({
      month,
      openingBalance,
      interest,
      principalPaid,
      gst,
      baseEMI: payment,
      totalPaid,
      closingBalance,
      periodDays,
      periodRate: rate,
    });

    balance = closingBalance;
  }

  return rows;
}

function buildPreclosureRow({
  row,
  index,
  schedule,
  processingFeeTotal,
  monthlyRate,
  preclosureFeeRate,
  preclosureInterestMonths,
  merchantClawback,
  isNoCost,
  mrp,
}) {
  const paidSoFar = sumMoney(
    schedule.slice(0, index + 1).map((current) => current.totalPaid)
  );
  const outstandingPrincipal = row.closingBalance;
  const hasOutstanding = outstandingPrincipal > 0;
  const preclosureFee = hasOutstanding
    ? roundMoney(outstandingPrincipal * preclosureFeeRate)
    : 0;
  const preclosureFeeGst = hasOutstanding
    ? roundMoney(preclosureFee * GST_RATE)
    : 0;
  const preclosureInterest = hasOutstanding
    ? roundMoney(outstandingPrincipal * monthlyRate * preclosureInterestMonths)
    : 0;
  const preclosureInterestGst = hasOutstanding
    ? roundMoney(preclosureInterest * GST_RATE)
    : 0;
  const effectiveMerchantClawback =
    hasOutstanding && isNoCost ? roundMoney(merchantClawback) : 0;
  const totalCost = roundMoney(
    paidSoFar +
      outstandingPrincipal +
      preclosureFee +
      preclosureFeeGst +
      preclosureInterest +
      preclosureInterestGst +
      processingFeeTotal +
      effectiveMerchantClawback
  );

  return {
    month: row.month,
    paidSoFar,
    outstandingPrincipal,
    preclosureFee,
    preclosureFeeGst,
    preclosureInterest,
    preclosureInterestGst,
    merchantClawback: effectiveMerchantClawback,
    totalCost,
    deltaVsMRP: roundMoney(totalCost - mrp),
  };
}

export function calculateEmiScenario({
  mrp,
  annualRate,
  tenure,
  isNoCost,
  procFee = 0,
  preclosureMonth = 1,
  preclosureFeeRate = PRECLOSURE_FEE,
  preclosureInterestMonths = 1,
  merchantClawback = 0,
  firstPeriodDays = DEFAULT_FIRST_PERIOD_DAYS,
  dayCountConvention = DAY_COUNT_THIRTY,
}) {
  const amount = roundMoney(Math.max(0, Number(mrp) || 0));
  const ratePct = Number(annualRate) || 0;
  const monthlyRate = ratePct / 1200;
  const months = Math.max(1, Math.trunc(Number(tenure) || 1));
  const processingFee = roundMoney(Math.max(0, Number(procFee) || 0));
  const processingFeeGst = roundMoney(processingFee * GST_RATE);
  const processingFeeTotal = roundMoney(processingFee + processingFeeGst);
  const days = Math.min(
    90,
    Math.max(1, Math.trunc(Number(firstPeriodDays) || DEFAULT_FIRST_PERIOD_DAYS))
  );
  const convention =
    dayCountConvention === DAY_COUNT_ACTUAL365
      ? DAY_COUNT_ACTUAL365
      : DAY_COUNT_THIRTY;
  const firstPeriodRate = periodRate({
    monthlyRate,
    annualRate: ratePct,
    days,
    convention,
    isFirstPeriod: true,
  });

  const periodOptions = {
    firstPeriodDays: days,
    dayCountConvention: convention,
    annualRate: ratePct,
  };

  let principal;
  let baseEMI;
  let discount;
  let basePayments;

  if (isNoCost) {
    // Customer-facing installments total MRP; card is charged the PV of those EMIs.
    // First period may use a different rate when day-count ≠ full month.
    basePayments = buildBasePayments(amount, months);
    principal = roundMoney(
      calcPVFromPaymentsIrregular(basePayments, firstPeriodRate, monthlyRate)
    );
    discount = roundMoney(amount - principal);
    baseEMI = basePayments[0];
  } else {
    principal = amount;
    discount = 0;
    // Banks still quote EMI from the standard equal-month formula; only
    // month-1 interest is pro-rated on the statement (last EMI absorbs residual).
    baseEMI = roundMoney(calcEMI(principal, monthlyRate, months));
    basePayments = baseEMI;
  }

  const schedule = buildSchedule(
    principal,
    monthlyRate,
    basePayments,
    months,
    periodOptions
  );
  const totalInterest = sumMoney(schedule.map((row) => row.interest));
  const totalGST = sumMoney(schedule.map((row) => row.gst));
  const totalBasePaid = sumMoney(schedule.map((row) => row.baseEMI));
  const totalPaid = sumMoney(schedule.map((row) => row.totalPaid));
  const grandTotal = roundMoney(totalPaid + processingFeeTotal);
  const extraCostAboveMRP = roundMoney(grandTotal - amount);
  // Processing fee is billed on the first statement alongside EMI 1.
  const firstPaymentMonths =
    convention === DAY_COUNT_ACTUAL365 ? (days * 12) / 365 : days / 30;
  const effectiveAnnualRate = calcEffectiveAnnualRate(
    amount,
    schedule.map((row, index) => ({
      months: firstPaymentMonths + index,
      amount: row.totalPaid + (index === 0 ? processingFeeTotal : 0),
    }))
  );
  const clampedPreclosureMonth = Math.min(
    Math.max(1, preclosureMonth),
    months
  );
  const preclosureRows = schedule.map((row, index) =>
    buildPreclosureRow({
      row,
      index,
      schedule,
      processingFeeTotal,
      monthlyRate,
      preclosureFeeRate,
      preclosureInterestMonths: Math.max(0, preclosureInterestMonths),
      merchantClawback,
      isNoCost,
      mrp: amount,
    })
  );
  const preclosure = preclosureRows[clampedPreclosureMonth - 1];

  preclosure.savingVsFullTenure = roundMoney(
    grandTotal - preclosure.totalCost
  );

  return {
    monthlyRate,
    months,
    principal,
    discount,
    baseEMI,
    basePayments: Array.isArray(basePayments)
      ? basePayments
      : schedule.map((row) => row.baseEMI),
    schedule,
    totalInterest,
    totalGST,
    totalBasePaid,
    totalPaid,
    processingFee,
    processingFeeGst,
    processingFeeTotal,
    grandTotal,
    extraCostAboveMRP,
    effectiveAnnualRate,
    preclosureFeeRate,
    preclosureInterestMonths: Math.max(0, preclosureInterestMonths),
    preclosureRows,
    preclosure,
    firstPeriodDays: days,
    dayCountConvention: convention,
    firstPeriodRate,
  };
}
