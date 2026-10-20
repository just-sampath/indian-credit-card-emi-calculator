import {
  DAY_COUNT_ACTUAL365,
  DAY_COUNT_THIRTY,
  DEFAULT_FIRST_PERIOD_DAYS,
} from "./emi.js";
import { INPUT_LIMITS, maxPreclosureMonth } from "./inputLimits.js";

export const TAB_IDS = ["schedule", "preclosure", "summary"];

export const DEFAULT_STATE = {
  mrp: 107705,
  annualRate: 17,
  tenure: 6,
  isNoCost: true,
  procFee: 199,
  firstPeriodDays: DEFAULT_FIRST_PERIOD_DAYS,
  dayCountConvention: DAY_COUNT_THIRTY,
  preclosureMonth: 3,
  preclosureFeeRate: 3,
  preclosureInterestMonths: 1,
  merchantClawback: 0,
  activeTab: "schedule",
};

function readNumber(params, key, { min, max }, fallback, integer = false) {
  if (!params.has(key)) {
    return fallback;
  }
  const number = Number(params.get(key));
  if (!Number.isFinite(number) || number < min || number > max) {
    return fallback;
  }
  return integer ? Math.round(number) : Math.round(number * 100) / 100;
}

/**
 * Read a scenario from a query string. Anything missing or out of range falls
 * back to the default, so a hand-edited or stale link never breaks the page.
 */
export function parseState(search) {
  const params = new URLSearchParams(search);
  const state = { ...DEFAULT_STATE };

  state.mrp = readNumber(params, "mrp", INPUT_LIMITS.mrp, state.mrp, true);
  state.annualRate = readNumber(
    params,
    "rate",
    INPUT_LIMITS.annualRate,
    state.annualRate
  );
  state.tenure = readNumber(
    params,
    "tenure",
    INPUT_LIMITS.tenure,
    state.tenure,
    true
  );
  state.isNoCost = params.get("type") !== "regular";
  state.procFee = readNumber(
    params,
    "fee",
    INPUT_LIMITS.procFee,
    state.procFee
  );
  state.firstPeriodDays = readNumber(
    params,
    "days",
    INPUT_LIMITS.firstPeriodDays,
    state.firstPeriodDays,
    true
  );
  state.dayCountConvention =
    params.get("basis") === "365" ? DAY_COUNT_ACTUAL365 : DAY_COUNT_THIRTY;
  state.preclosureMonth = readNumber(
    params,
    "close",
    { min: 1, max: maxPreclosureMonth(state.tenure) },
    Math.min(state.preclosureMonth, maxPreclosureMonth(state.tenure)),
    true
  );
  state.preclosureFeeRate = readNumber(
    params,
    "closefee",
    INPUT_LIMITS.preclosureFeeRate,
    state.preclosureFeeRate
  );
  state.preclosureInterestMonths = readNumber(
    params,
    "closeint",
    INPUT_LIMITS.preclosureInterestMonths,
    state.preclosureInterestMonths
  );
  state.merchantClawback = readNumber(
    params,
    "clawback",
    { min: 0, max: state.mrp },
    state.merchantClawback
  );
  state.activeTab = TAB_IDS.includes(params.get("tab"))
    ? params.get("tab")
    : state.activeTab;

  return state;
}

/** Query string holding only the values that differ from the defaults. */
export function serializeState(state) {
  const params = new URLSearchParams();
  const put = (key, value, fallback) => {
    if (value !== fallback) {
      params.set(key, String(value));
    }
  };

  put("type", state.isNoCost ? "nocost" : "regular", "nocost");
  put("mrp", state.mrp, DEFAULT_STATE.mrp);
  put("rate", state.annualRate, DEFAULT_STATE.annualRate);
  put("tenure", state.tenure, DEFAULT_STATE.tenure);
  put("fee", state.procFee, DEFAULT_STATE.procFee);
  put("days", state.firstPeriodDays, DEFAULT_STATE.firstPeriodDays);
  put(
    "basis",
    state.dayCountConvention === DAY_COUNT_ACTUAL365 ? "365" : "30",
    "30"
  );
  put("close", state.preclosureMonth, DEFAULT_STATE.preclosureMonth);
  put("closefee", state.preclosureFeeRate, DEFAULT_STATE.preclosureFeeRate);
  put(
    "closeint",
    state.preclosureInterestMonths,
    DEFAULT_STATE.preclosureInterestMonths
  );
  put("clawback", state.merchantClawback, DEFAULT_STATE.merchantClawback);
  put("tab", state.activeTab, DEFAULT_STATE.activeTab);

  const query = params.toString();
  return query ? `?${query}` : "";
}
