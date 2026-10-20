import { formatCurrency } from "./format.js";

/** First and last statement debits, and whether they differ. */
export function monthlyPaymentSummary(calc) {
  const first = calc.schedule[0];
  const last = calc.schedule[calc.schedule.length - 1];
  const varies =
    calc.schedule.length > 1 &&
    Math.abs(last.totalPaid - first.totalPaid) >= 0.01;
  return { first, last, varies };
}

/**
 * How No Cost EMI compares with Regular EMI on one metric.
 * `better` says which direction is good for the buyer on that row, so a
 * bigger discount reads as good and a bigger cost reads as bad.
 *
 * @param {{better: 'lower'|'higher', format: 'money'|'rate', noCost: number|null, regular: number|null}} row
 */
export function describeDifference({ better, format, noCost, regular }) {
  if (noCost === null || regular === null) {
    return { text: "—", tone: "text-text-muted" };
  }
  const gap = Math.abs(noCost - regular);
  if (gap < 0.005) {
    return { text: "Same", tone: "text-text-muted" };
  }
  const isLower = noCost < regular;
  const isBetter = better === "lower" ? isLower : !isLower;
  const amount =
    format === "rate" ? `${gap.toFixed(2)} pts` : formatCurrency(gap);
  return {
    text: `${amount} ${isLower ? "lower" : "higher"}`,
    tone: isBetter ? "text-green" : "text-red-soft",
  };
}
