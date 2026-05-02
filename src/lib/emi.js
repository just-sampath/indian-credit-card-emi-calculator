export const GST_RATE = 0.18;
export const PRECLOSURE_FEE = 0.03;

export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function sumMoney(values) {
  return values.reduce((total, value) => roundMoney(total + value), 0);
}

function buildBasePayments(totalBasePayment, months) {
  const roundedTotal = roundMoney(totalBasePayment);
  const standardPayment = roundMoney(roundedTotal / months);

  return Array.from({ length: months }, (_, index) => {
    if (index === months - 1) {
      return roundMoney(roundedTotal - standardPayment * (months - 1));
    }

    return standardPayment;
  });
}

export function calcEMI(principal, monthlyRate, months) {
  if (monthlyRate === 0) {
    return principal / months;
  }

  const r = monthlyRate;
  const n = months;

  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function calcPV(monthlyRate, months, payment) {
  if (monthlyRate === 0) {
    return payment * months;
  }

  const r = monthlyRate;
  const n = months;

  return (payment * (1 - Math.pow(1 + r, -n))) / r;
}

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

export function buildSchedule(principal, monthlyRate, baseEMI, months) {
  const rows = [];
  let balance = roundMoney(principal);
  const basePayments = Array.isArray(baseEMI)
    ? baseEMI.map((payment) => roundMoney(payment))
    : Array.from({ length: months }, () => roundMoney(baseEMI));
  const hasExplicitPayments = Array.isArray(baseEMI);

  for (let month = 1; month <= months; month += 1) {
    const isLastMonth = month === months;
    const openingBalance = roundMoney(balance);
    const rawInterest = openingBalance * monthlyRate;
    let interest = roundMoney(rawInterest);
    let payment = basePayments[month - 1];
    let principalPaid;
    let closingBalance;

    if (isLastMonth) {
      principalPaid = openingBalance;

      if (hasExplicitPayments) {
        interest = roundMoney(payment - principalPaid);
      } else {
        payment = roundMoney(principalPaid + interest);
      }

      closingBalance = 0;
    } else {
      principalPaid = roundMoney(payment - interest);
      closingBalance = roundMoney(Math.max(0, openingBalance - principalPaid));
    }

    const gst = roundMoney(Math.max(0, rawInterest) * GST_RATE);
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
}) {
  const amount = roundMoney(Math.max(0, Number(mrp) || 0));
  const monthlyRate = (Number(annualRate) || 0) / 1200;
  const months = Math.max(1, Math.trunc(Number(tenure) || 1));
  const processingFee = roundMoney(Math.max(0, Number(procFee) || 0));
  const processingFeeGst = roundMoney(processingFee * GST_RATE);
  const processingFeeTotal = roundMoney(processingFee + processingFeeGst);

  let principal;
  let baseEMI;
  let discount;
  let basePayments;

  if (isNoCost) {
    basePayments = buildBasePayments(amount, months);

    principal = roundMoney(calcPVFromPayments(monthlyRate, basePayments));
    discount = roundMoney(amount - principal);
    baseEMI = basePayments[0];
  } else {
    principal = amount;
    discount = 0;
    baseEMI = roundMoney(calcEMI(principal, monthlyRate, months));
    basePayments = baseEMI;
  }

  const schedule = buildSchedule(principal, monthlyRate, basePayments, months);
  const totalInterest = sumMoney(schedule.map((row) => row.interest));
  const totalGST = sumMoney(schedule.map((row) => row.gst));
  const totalPaid = sumMoney(schedule.map((row) => row.totalPaid));
  const grandTotal = roundMoney(totalPaid + processingFeeTotal);
  const extraCostAboveMRP = roundMoney(grandTotal - amount);
  const clampedPreclosureMonth = Math.min(Math.max(1, preclosureMonth), months);
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

  preclosure.savingVsFullTenure = roundMoney(grandTotal - preclosure.totalCost);

  return {
    monthlyRate,
    months,
    principal,
    discount,
    baseEMI,
    schedule,
    totalInterest,
    totalGST,
    totalPaid,
    processingFee,
    processingFeeGst,
    processingFeeTotal,
    grandTotal,
    extraCostAboveMRP,
    preclosureFeeRate,
    preclosureInterestMonths: Math.max(0, preclosureInterestMonths),
    preclosureRows,
    preclosure,
  };
}
