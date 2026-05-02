import {
  GST_RATE,
  PRECLOSURE_FEE,
  calcEMI,
  calcPV,
  buildSchedule,
  calculateEmiScenario,
  roundMoney,
} from "../../src/lib/emi.js";

describe("emi helpers", () => {
  it("exports the fixed gst and preclosure rates", () => {
    expect(GST_RATE).toBe(0.18);
    expect(PRECLOSURE_FEE).toBe(0.03);
  });

  it("calculates regular EMI for a reducing-balance loan", () => {
    expect(calcEMI(107705, 17 / 1200, 6)).toBeCloseTo(18851.328157429398, 10);
  });

  it("calculates present value for no-cost emi", () => {
    expect(calcPV(17 / 1200, 6, 107705 / 6)).toBeCloseTo(
      102560.12138883195,
      10
    );
  });

  it("builds a schedule that ends at zero closing balance", () => {
    const emi = calcEMI(107705, 17 / 1200, 6);
    const schedule = buildSchedule(107705, 17 / 1200, emi, 6);

    expect(schedule).toHaveLength(6);
    expect(schedule.at(-1).closingBalance).toBe(0);
    expect(schedule.at(-1).principalPaid).toBeCloseTo(
      schedule.at(-1).openingBalance,
      10
    );
  });

  it("includes GST on processing fee in regular-emi totals", () => {
    const result = calculateEmiScenario({
      mrp: 107705,
      annualRate: 17,
      tenure: 6,
      isNoCost: false,
      procFee: 199,
      preclosureMonth: 3,
    });

    expect(result.processingFee).toBe(199);
    expect(result.processingFeeGst).toBe(35.82);
    expect(result.processingFeeTotal).toBe(234.82);
    expect(result.grandTotal).toBe(
      roundMoney(result.totalPaid + result.processingFeeTotal)
    );
    expect(result.extraCostAboveMRP).toBe(
      roundMoney(result.grandTotal - 107705)
    );
  });

  it("matches the standard no-cost-emi discount and GST example", () => {
    const result = calculateEmiScenario({
      mrp: 15000,
      annualRate: 15,
      tenure: 3,
      isNoCost: true,
      procFee: 0,
      preclosureMonth: 1,
    });

    expect(result.principal).toBeCloseTo(14632.67, 2);
    expect(result.discount).toBeCloseTo(367.33, 2);
    expect(result.baseEMI).toBe(5000);
    expect(result.totalInterest).toBeCloseTo(367.33, 2);
    expect(result.totalGST).toBeCloseTo(66.12, 2);
    expect(result.totalPaid).toBeCloseTo(15066.12, 2);
  });

  it("includes fee GST, accrued interest, interest GST, and clawback in preclosure", () => {
    const result = calculateEmiScenario({
      mrp: 107705,
      annualRate: 17,
      tenure: 6,
      isNoCost: true,
      procFee: 199,
      preclosureMonth: 3,
      preclosureInterestMonths: 1,
      merchantClawback: 500,
    });

    expect(result.preclosure.month).toBe(3);
    expect(result.preclosure.preclosureFee).toBe(
      roundMoney(result.preclosure.outstandingPrincipal * PRECLOSURE_FEE)
    );
    expect(result.preclosure.preclosureFeeGst).toBe(
      roundMoney(result.preclosure.preclosureFee * GST_RATE)
    );
    expect(result.preclosure.preclosureInterest).toBe(
      roundMoney(result.preclosure.outstandingPrincipal * result.monthlyRate)
    );
    expect(result.preclosure.preclosureInterestGst).toBe(
      roundMoney(result.preclosure.preclosureInterest * GST_RATE)
    );
    expect(result.preclosure.merchantClawback).toBe(500);
    expect(result.preclosure.totalCost).toBe(
      roundMoney(
        result.preclosure.paidSoFar +
          result.preclosure.outstandingPrincipal +
          result.preclosure.preclosureFee +
          result.preclosure.preclosureFeeGst +
          result.preclosure.preclosureInterest +
          result.preclosure.preclosureInterestGst +
          result.processingFeeTotal +
          result.preclosure.merchantClawback
      )
    );
    expect(result.preclosure.savingVsFullTenure).toBe(
      roundMoney(result.grandTotal - result.preclosure.totalCost)
    );
  });

  it("rounds schedule rows to paise and closes the final principal balance", () => {
    const result = calculateEmiScenario({
      mrp: 107705,
      annualRate: 17,
      tenure: 6,
      isNoCost: true,
      procFee: 199,
      preclosureMonth: 3,
    });

    const isPaiseRounded = (value) =>
      Number.isInteger(Math.round(value * 1000000) / 10000);

    result.schedule.forEach((row) => {
      expect(isPaiseRounded(row.openingBalance)).toBe(true);
      expect(isPaiseRounded(row.interest)).toBe(true);
      expect(isPaiseRounded(row.principalPaid)).toBe(true);
      expect(isPaiseRounded(row.gst)).toBe(true);
      expect(isPaiseRounded(row.baseEMI)).toBe(true);
      expect(isPaiseRounded(row.totalPaid)).toBe(true);
      expect(isPaiseRounded(row.closingBalance)).toBe(true);
    });

    expect(result.schedule.at(-1).closingBalance).toBe(0);
    expect(
      result.schedule.reduce((total, row) => total + row.baseEMI, 0)
    ).toBeCloseTo(107705, 2);
  });
});
