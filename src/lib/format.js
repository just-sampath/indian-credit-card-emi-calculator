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
