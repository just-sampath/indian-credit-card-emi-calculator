import {
  formatAnnualRate,
  formatCurrency,
  formatCurrencyShort,
  formatShare,
} from "../../src/lib/format.js";

describe("format helpers", () => {
  it("formats currency with paise in en-IN style", () => {
    expect(formatCurrency(107705)).toBe("₹1,07,705.00");
  });

  it("formats short currency without paise", () => {
    expect(formatCurrencyShort(107705)).toBe("₹1,07,705");
  });
});

describe("guarded display helpers", () => {
  it("formats a share of a whole and refuses to divide by zero", () => {
    expect(formatShare(25, 200)).toBe("12.5%");
    expect(formatShare(1160.9, 107705, 2)).toBe("1.08%");
    expect(formatShare(10, 0)).toBe("—");
    expect(formatShare(Number.NaN, 100)).toBe("—");
  });

  it("formats an annual rate or a dash when it cannot be computed", () => {
    expect(formatAnnualRate(3.7049)).toBe("3.70% p.a.");
    expect(formatAnnualRate(null)).toBe("—");
    expect(formatAnnualRate(Number.POSITIVE_INFINITY)).toBe("—");
  });
});
