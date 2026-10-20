/** Slider resolution for logarithmic ranges. */
export const LOG_SLIDER_STEPS = 1000;

/** Round to steps that read naturally for rupee prices at each magnitude. */
function roundPrice(value) {
  const step = value < 10000 ? 100 : value < 100000 ? 500 : 1000;
  return Math.round(value / step) * step;
}

/** Slider position (0 to LOG_SLIDER_STEPS) for a value on a log scale. */
export function logPosition(value, min, max) {
  const clamped = Math.min(max, Math.max(min, value));
  return Math.round(
    (Math.log(clamped / min) / Math.log(max / min)) * LOG_SLIDER_STEPS
  );
}

/** Value for a slider position on a log scale, rounded to a tidy price. */
export function logValue(position, min, max) {
  const raw = min * Math.pow(max / min, position / LOG_SLIDER_STEPS);
  return Math.min(max, Math.max(min, roundPrice(raw)));
}
