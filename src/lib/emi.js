export const GST_RATE = 0.18;
export const PRECLOSURE_FEE = 0.03;

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

export function buildSchedule(principal, monthlyRate, baseEMI, months) {
  const rows = [];
  let balance = principal;

  for (let month = 1; month <= months; month += 1) {
    const interest = balance * monthlyRate;
    const principalPaid = baseEMI - interest;
    const gst = interest * GST_RATE;
    const totalPaid = baseEMI + gst;
    const closingBalance = Math.max(0, balance - principalPaid);

    rows.push({
      month,
      openingBalance: balance,
      interest,
      principalPaid,
      gst,
      baseEMI,
      totalPaid,
      closingBalance,
    });

    balance = closingBalance;
  }

  if (rows.length > 0) {
    const lastRow = rows.at(-1);

    lastRow.closingBalance = 0;
    lastRow.principalPaid = lastRow.openingBalance;
    lastRow.interest = lastRow.baseEMI - lastRow.principalPaid;
    lastRow.gst = Math.max(0, lastRow.interest) * GST_RATE;
    lastRow.totalPaid = lastRow.baseEMI + lastRow.gst;
  }

  return rows;
}

export function calculateEmiScenario({
  mrp,
  annualRate,
  tenure,
  isNoCost,
  procFee,
  preclosureMonth,
}) {
  const monthlyRate = annualRate / 1200;
  const months = tenure;

  let principal;
  let baseEMI;
  let discount;

  if (isNoCost) {
    const emiTarget = mrp / months;

    principal = calcPV(monthlyRate, months, emiTarget);
    discount = mrp - principal;
    baseEMI = mrp / months;
  } else {
    principal = mrp;
    discount = 0;
    baseEMI = calcEMI(principal, monthlyRate, months);
  }

  const schedule = buildSchedule(principal, monthlyRate, baseEMI, months);
  const totalInterest = schedule.reduce(
    (total, row) => total + row.interest,
    0
  );
  const totalGST = schedule.reduce((total, row) => total + row.gst, 0);
  const totalPaid = schedule.reduce((total, row) => total + row.totalPaid, 0);
  const clampedPreclosureMonth = Math.min(preclosureMonth, months);
  const paidRows = schedule.slice(0, clampedPreclosureMonth);
  const paidSoFar = paidRows.reduce((total, row) => total + row.totalPaid, 0);
  const outstandingPrincipal =
    clampedPreclosureMonth < months
      ? schedule[clampedPreclosureMonth - 1].closingBalance
      : 0;
  const pcFee = outstandingPrincipal * PRECLOSURE_FEE;
  const pcTotalCost = paidSoFar + outstandingPrincipal + pcFee + procFee;
  const pcSavingVsFullTenure = totalPaid + procFee - pcTotalCost;

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
    grandTotal: totalPaid + procFee,
    extraCostAboveMRP: totalPaid + procFee - mrp,
    pcMonth: clampedPreclosureMonth,
    paidSoFar,
    outstandingPrincipal,
    pcFee,
    pcTotalCost,
    pcSavingVsFullTenure,
  };
}
