import {
  LOG_SLIDER_STEPS,
  logPosition,
  logValue,
} from "../../src/lib/sliderScale.js";

const MIN = 1000;
const MAX = 1000000;

describe("log slider scale", () => {
  it("maps the ends of the track to the ends of the range", () => {
    expect(logPosition(MIN, MIN, MAX)).toBe(0);
    expect(logPosition(MAX, MIN, MAX)).toBe(LOG_SLIDER_STEPS);
    expect(logValue(0, MIN, MAX)).toBe(MIN);
    expect(logValue(LOG_SLIDER_STEPS, MIN, MAX)).toBe(MAX);
  });

  it("gives everyday prices most of the track", () => {
    const start = logPosition(5000, MIN, MAX);
    const end = logPosition(200000, MIN, MAX);
    expect((end - start) / LOG_SLIDER_STEPS).toBeGreaterThan(0.5);
  });

  it("rounds slider values to tidy prices and lands near the original", () => {
    const value = logValue(logPosition(107705, MIN, MAX), MIN, MAX);
    expect(value % 1000).toBe(0);
    expect(Math.abs(value - 107705) / 107705).toBeLessThan(0.01);
    expect(logValue(250, MIN, MAX) % 100).toBe(0);
  });
});
