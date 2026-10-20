export function formatCurrency(value) {
  return (
    "₹" +
    value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatCurrencyShort(value) {
  return (
    "₹" +
    value.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

/** Percentage of a whole, or "—" when the whole is zero/invalid. */
export function formatShare(part, whole, digits = 1) {
  if (!(whole > 0) || !Number.isFinite(part)) {
    return "—";
  }
  return `${((part / whole) * 100).toFixed(digits)}%`;
}

/** Annual rate like "3.71% p.a.", or "—" when it cannot be computed. */
export function formatAnnualRate(rate) {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) {
    return "—";
  }
  return `${rate.toFixed(2)}% p.a.`;
}

/** Indian digit grouping without a symbol, e.g. 107705 → "1,07,705". */
export function formatGrouped(value) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
