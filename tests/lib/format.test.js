import { formatCurrency, formatCurrencyShort } from "../../src/lib/format.js";

describe("format helpers", () => {
  it("formats currency with paise in en-IN style", () => {
    expect(formatCurrency(107705)).toBe("₹1,07,705.00");
  });

  it("formats short currency without paise", () => {
    expect(formatCurrencyShort(107705)).toBe("₹1,07,705");
  });
});
