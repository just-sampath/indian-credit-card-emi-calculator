import { useId } from "react";
import {
  LOG_SLIDER_STEPS,
  logPosition,
  logValue,
} from "../../lib/sliderScale.js";
import { NumberInput } from "./NumberInput.jsx";

/**
 * Labelled number field paired with a slider over the exact same range.
 * `scale="log"` spreads wide ranges (₹1,000 to ₹10,00,000) so everyday values
 * get most of the track instead of a sliver at one end.
 */
export function SliderField({
  decimals,
  format,
  formatBound,
  hint,
  id,
  integer = false,
  label,
  labelNote,
  max,
  min,
  onChange,
  prefix,
  scale = "linear",
  sliderLabel,
  sliderStep,
  step,
  suffix,
  value,
}) {
  const hintId = useId();
  const noteId = useId();
  const isLog = scale === "log";
  const describedBy =
    [labelNote ? noteId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label className="section-label" htmlFor={id}>
          {label}
        </label>
        {labelNote ? (
          <span
            className="mb-2 text-[12px] text-text-muted short:mb-1.5 dense:text-[11px]"
            id={noteId}
          >
            {labelNote}
          </span>
        ) : null}
      </div>
      <NumberInput
        decimals={decimals}
        describedBy={describedBy}
        format={format}
        formatBound={formatBound}
        id={id}
        integer={integer}
        max={max}
        min={min}
        onValueChange={onChange}
        prefix={prefix}
        step={step}
        suffix={suffix}
        value={value}
      />
      <input
        aria-label={sliderLabel}
        aria-valuetext={formatBound ? formatBound(value) : undefined}
        className="range-input mt-2 short:mt-1"
        max={isLog ? LOG_SLIDER_STEPS : max}
        min={isLog ? 0 : min}
        onChange={(event) => {
          const position = Number(event.target.value);
          onChange(isLog ? logValue(position, min, max) : position);
        }}
        step={isLog ? 1 : sliderStep}
        type="range"
        value={isLog ? logPosition(value, min, max) : value}
      />
      {hint ? (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
