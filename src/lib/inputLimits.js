/** Shared bounds so every number field and its slider accept the same range. */
export const INPUT_LIMITS = {
  mrp: { min: 1000, max: 1000000 },
  annualRate: { min: 0, max: 50 },
  tenure: { min: 1, max: 60 },
  procFee: { min: 0, max: 99999 },
  firstPeriodDays: { min: 1, max: 60 },
  preclosureFeeRate: { min: 0, max: 10 },
  preclosureInterestMonths: { min: 0, max: 3 },
};

export const TENURE_OPTIONS = [3, 6, 9, 12, 18, 24];

/** Pre-closing in the final month is identical to running the full tenure. */
export function maxPreclosureMonth(tenure) {
  return Math.max(1, tenure - 1);
}
