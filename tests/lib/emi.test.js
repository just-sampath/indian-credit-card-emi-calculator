import {
  GST_RATE,
  PRECLOSURE_FEE,
  calcEMI,
  calcPV,
  buildSchedule,
  calculateEmiScenario,
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

  it("matches the current regular-emi reference totals", () => {
    const result = calculateEmiScenario({
      mrp: 107705,
      annualRate: 17,
      tenure: 6,
      isNoCost: false,
      procFee: 199,
      preclosureMonth: 3,
    });

    expect(result.baseEMI).toBeCloseTo(18851.328157429398, 10);
    expect(result.totalInterest).toBeCloseTo(5402.968944576394, 10);
    expect(result.totalGST).toBeCloseTo(972.534410023751, 10);
    expect(result.totalPaid).toBeCloseTo(114080.50335460015, 10);
    expect(result.grandTotal).toBeCloseTo(114279.50335460015, 10);
    expect(result.extraCostAboveMRP).toBeCloseTo(6574.5033546001505, 10);
  });

  it("matches the current no-cost-emi reference totals", () => {
    const result = calculateEmiScenario({
      mrp: 107705,
      annualRate: 17,
      tenure: 6,
      isNoCost: true,
      procFee: 199,
      preclosureMonth: 3,
    });

    expect(result.principal).toBeCloseTo(102560.12138883195, 10);
    expect(result.discount).toBeCloseTo(5144.878611168053, 10);
    expect(result.baseEMI).toBeCloseTo(17950.833333333332, 10);
    expect(result.totalInterest).toBeCloseTo(5144.878611168046, 10);
    expect(result.totalGST).toBeCloseTo(926.0781500102481, 10);
    expect(result.totalPaid).toBeCloseTo(108631.07815001023, 10);
    expect(result.grandTotal).toBeCloseTo(108830.07815001023, 10);
    expect(result.extraCostAboveMRP).toBeCloseTo(1125.0781500102312, 10);
    expect(result.pcTotalCost).toBeCloseTo(108642.09349965073, 10);
    expect(result.pcSavingVsFullTenure).toBeCloseTo(187.98465035950358, 10);
  });
});
