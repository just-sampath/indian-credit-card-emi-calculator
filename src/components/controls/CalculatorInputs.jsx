import { DAY_COUNT_ACTUAL365, DAY_COUNT_THIRTY } from "../../lib/emi.js";
import { formatCurrencyShort, formatGrouped } from "../../lib/format.js";
import { INPUT_LIMITS, TENURE_OPTIONS } from "../../lib/inputLimits.js";
import { Button } from "../ui/Button.jsx";
import { NumberInput } from "./NumberInput.jsx";
import { SegmentedToggle } from "./SegmentedToggle.jsx";
import { SliderField } from "./SliderField.jsx";

const DAY_COUNT_OPTIONS = [
  { value: DAY_COUNT_THIRTY, label: "30-day" },
  { value: DAY_COUNT_ACTUAL365, label: "Actual/365" },
];

const formatRupees = (value) => formatCurrencyShort(value);
const plural = (unit) => (value) => `${value} ${unit}${value === 1 ? "" : "s"}`;

export function CalculatorInputs({
  annualRate,
  dayCountConvention,
  firstPeriodDays,
  mrp,
  onAnnualRateChange,
  onDayCountConventionChange,
  onFirstPeriodDaysChange,
  onMrpChange,
  onProcFeeChange,
  onTenureChange,
  procFee,
  tenure,
}) {
  const dayCountLabel =
    dayCountConvention === DAY_COUNT_ACTUAL365 ? "Actual/365" : "30-day basis";

  return (
    <div className="flex flex-col gap-5 short:gap-3">
      <SliderField
        format={formatGrouped}
        formatBound={formatRupees}
        id="input-mrp"
        integer
        label={
          <>
            Product MRP<span className="sr-only"> (₹)</span>
          </>
        }
        max={INPUT_LIMITS.mrp.max}
        min={INPUT_LIMITS.mrp.min}
        onChange={onMrpChange}
        prefix="₹"
        scale="log"
        sliderLabel="Product MRP slider"
        step={1000}
        value={mrp}
      />

      <SliderField
        formatBound={(value) => `${value}%`}
        labelNote={`${(annualRate / 12).toFixed(4)}% a month`}
        id="input-annual-rate"
        label={
          <>
            Interest rate<span className="sr-only"> (% per year)</span>
          </>
        }
        max={INPUT_LIMITS.annualRate.max}
        min={INPUT_LIMITS.annualRate.min}
        onChange={onAnnualRateChange}
        sliderLabel="Annual interest rate slider"
        sliderStep={0.1}
        step={0.5}
        suffix="% p.a."
        value={annualRate}
      />

      <div>
        <div className="section-label" id="tenure-label">
          Tenure
        </div>
        <div
          aria-labelledby="tenure-label"
          className="grid grid-cols-3 gap-1.5 pointer-coarse:gap-2 @min-[16rem]:pointer-fine:grid-cols-6 @min-[20rem]:grid-cols-6"
          role="group"
        >
          {TENURE_OPTIONS.map((option) => (
            <Button
              key={option}
              aria-label={`${option} months`}
              aria-pressed={tenure === option}
              onClick={() => onTenureChange(option)}
              selected={tenure === option}
              variant="chip"
            >
              {option}M
            </Button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <label
            className="shrink-0 text-[13px] text-text-muted dense:text-[12px]"
            htmlFor="input-tenure"
          >
            Or enter<span className="sr-only"> tenure in months</span>
          </label>
          <NumberInput
            className="flex-1"
            formatBound={plural("month")}
            id="input-tenure"
            integer
            max={INPUT_LIMITS.tenure.max}
            min={INPUT_LIMITS.tenure.min}
            onValueChange={onTenureChange}
            suffix="months"
            value={tenure}
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label className="section-label" htmlFor="input-proc-fee">
            Processing fee<span className="sr-only"> (₹)</span>
          </label>
          <span
            className="mb-2 text-[12px] text-text-muted short:mb-1.5 dense:text-[11px]"
            id="proc-fee-hint"
          >
            before 18% GST
          </span>
        </div>
        <NumberInput
          describedBy="proc-fee-hint"
          format={formatGrouped}
          formatBound={formatRupees}
          id="input-proc-fee"
          max={INPUT_LIMITS.procFee.max}
          min={INPUT_LIMITS.procFee.min}
          onValueChange={onProcFeeChange}
          prefix="₹"
          step={1}
          value={procFee}
        />
      </div>

      <details className="group rounded-lg border border-border bg-surface/60">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-[14px] text-text dense:text-[12px]">
              First EMI timing
            </span>
            <span className="block text-[13px] text-text-muted dense:text-[12px]">
              Due {firstPeriodDays} days after purchase · {dayCountLabel}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="text-[12px] text-gold transition-transform group-open:rotate-180"
          >
            ▾
          </span>
        </summary>
        <div className="flex flex-col gap-5 border-t border-border px-3 pt-4 pb-3">
          <SliderField
            formatBound={plural("day")}
            hint="From the purchase date to your first EMI due date. Leave at 30 if unsure."
            id="input-first-period-days"
            integer
            label="Days to first EMI due date"
            max={INPUT_LIMITS.firstPeriodDays.max}
            min={INPUT_LIMITS.firstPeriodDays.min}
            onChange={onFirstPeriodDaysChange}
            sliderLabel="Days to first EMI due date slider"
            sliderStep={1}
            suffix="days"
            value={firstPeriodDays}
          />

          <div>
            <div className="section-label" id="day-count-label">
              Month-1 interest basis
            </div>
            <SegmentedToggle
              labelledBy="day-count-label"
              onChange={onDayCountConventionChange}
              options={DAY_COUNT_OPTIONS}
              value={dayCountConvention}
            />
            <p className="field-hint">
              {dayCountConvention === DAY_COUNT_ACTUAL365
                ? "Month-1 interest uses the exact number of days out of 365."
                : "Most card issuers pro-rate month 1 on a 30-day month."}
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}
