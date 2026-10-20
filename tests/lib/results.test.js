import { describeDifference } from "../../src/lib/results.js";

describe("describeDifference", () => {
  it("reads a bigger discount as good for the buyer", () => {
    expect(
      describeDifference({
        better: "higher",
        format: "money",
        noCost: 5144.88,
        regular: 0,
      })
    ).toEqual({ text: "₹5,144.88 higher", tone: "text-green" });
  });

  it("reads a lower cost as good and a higher cost as bad", () => {
    expect(
      describeDifference({
        better: "lower",
        format: "money",
        noCost: 10,
        regular: 30,
      })
    ).toEqual({ text: "₹20.00 lower", tone: "text-green" });
    expect(
      describeDifference({
        better: "lower",
        format: "money",
        noCost: 30,
        regular: 10,
      })
    ).toEqual({ text: "₹20.00 higher", tone: "text-red-soft" });
  });

  it("formats rate gaps in percentage points and handles ties and gaps", () => {
    expect(
      describeDifference({
        better: "lower",
        format: "rate",
        noCost: 3.7,
        regular: 20.82,
      })
    ).toEqual({ text: "17.12 pts lower", tone: "text-green" });
    expect(
      describeDifference({
        better: "lower",
        format: "money",
        noCost: 5,
        regular: 5,
      })
    ).toEqual({ text: "Same", tone: "text-text-muted" });
    expect(
      describeDifference({
        better: "lower",
        format: "rate",
        noCost: null,
        regular: 5,
      })
    ).toEqual({ text: "—", tone: "text-text-muted" });
  });
});
