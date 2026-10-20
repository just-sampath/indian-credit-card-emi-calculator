import { DAY_COUNT_ACTUAL365 } from "../../src/lib/emi.js";
import {
  DEFAULT_STATE,
  parseState,
  serializeState,
} from "../../src/lib/urlState.js";

describe("URL scenario state", () => {
  it("returns the defaults for an empty query", () => {
    expect(parseState("")).toEqual(DEFAULT_STATE);
    expect(serializeState(DEFAULT_STATE)).toBe("");
  });

  it("round-trips every input", () => {
    const state = {
      mrp: 250000,
      annualRate: 15.5,
      tenure: 12,
      isNoCost: false,
      procFee: 499,
      firstPeriodDays: 41,
      dayCountConvention: DAY_COUNT_ACTUAL365,
      preclosureMonth: 7,
      preclosureFeeRate: 2.5,
      preclosureInterestMonths: 0.5,
      merchantClawback: 0,
      activeTab: "summary",
    };
    expect(parseState(serializeState(state))).toEqual(state);
  });

  it("falls back per field when values are missing, invalid or out of range", () => {
    const state = parseState(
      "?mrp=50&rate=nope&tenure=61&days=0&fee=-1&tab=other&basis=x"
    );
    expect(state.mrp).toBe(DEFAULT_STATE.mrp);
    expect(state.annualRate).toBe(DEFAULT_STATE.annualRate);
    expect(state.tenure).toBe(DEFAULT_STATE.tenure);
    expect(state.firstPeriodDays).toBe(DEFAULT_STATE.firstPeriodDays);
    expect(state.procFee).toBe(DEFAULT_STATE.procFee);
    expect(state.activeTab).toBe("schedule");
    expect(state.dayCountConvention).toBe(DEFAULT_STATE.dayCountConvention);
  });

  it("keeps the pre-closure month and clawback inside their dependent limits", () => {
    expect(parseState("?tenure=3&close=5").preclosureMonth).toBe(2);
    expect(parseState("?tenure=12&close=9").preclosureMonth).toBe(9);
    expect(parseState("?tenure=3").preclosureMonth).toBe(2);
    expect(parseState("?mrp=5000&clawback=9000").merchantClawback).toBe(0);
    expect(parseState("?mrp=5000&clawback=900").merchantClawback).toBe(900);
  });
});
