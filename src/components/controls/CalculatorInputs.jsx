import {
  DAY_COUNT_ACTUAL365,
  DAY_COUNT_THIRTY,
} from "../../lib/emi.js";
import { Button } from "../ui/Button.jsx";

const TENURE_OPTIONS = [3, 6, 9, 12, 18, 24];

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
  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <label className="section-label" htmlFor="input-mrp">
          Product MRP (₹)
        </label>
        <input
          className="input-field"
          id="input-mrp"
          min="1000"
          onChange={(event) => onMrpChange(Number(event.target.value))}
          step="100"
          type="number"
          value={mrp}
        />
        <input
          aria-label="Product MRP slider"
          className="range-input mt-1.5"
          max="500000"
          min="5000"
          onChange={(event) => onMrpChange(Number(event.target.value))}
          step="1000"
          type="range"
          value={mrp}
        />
      </div>

      <div>
        <label className="section-label" htmlFor="input-annual-rate">
          Annual Interest Rate (%)
        </label>
        <input
          className="input-field"
          id="input-annual-rate"
          max="60"
          min="0"
          onChange={(event) => onAnnualRateChange(Number(event.target.value))}
          step="0.1"
          type="number"
          value={annualRate}
        />
        <input
          aria-label="Annual interest rate slider"
          className="range-input mt-1.5"
          max="36"
          min="0"
          onChange={(event) => onAnnualRateChange(Number(event.target.value))}
          step="0.5"
          type="range"
          value={annualRate}
        />
        <div className="mt-1 text-[10px] text-text-muted">
          Monthly rate: {(annualRate / 12).toFixed(4)}%
        </div>
      </div>

      <div>
        <div className="section-label" id="tenure-label">
          Tenure (Months)
        </div>
        <div
          aria-labelledby="tenure-label"
          className="flex flex-wrap gap-1.5"
          role="group"
        >
          {TENURE_OPTIONS.map((option) => (
            <Button
              key={option}
              aria-pressed={tenure === option}
              onClick={() => onTenureChange(option)}
              selected={tenure === option}
              variant="tenure"
            >
              {option}M
            </Button>
          ))}
        </div>
        <label className="sr-only" htmlFor="input-tenure">
          Tenure in months
        </label>
        <input
          className="input-field mt-2"
          id="input-tenure"
          max="60"
          min="1"
          onChange={(event) =>
            onTenureChange(Math.max(1, Number(event.target.value)))
          }
          type="number"
          value={tenure}
        />
      </div>

      <div>
        <label className="section-label" htmlFor="input-proc-fee">
          Processing Fee (₹)
        </label>
        <input
          className="input-field"
          id="input-proc-fee"
          min="0"
          onChange={(event) => onProcFeeChange(Number(event.target.value))}
          step="1"
          type="number"
          value={procFee}
        />
        <div className="mt-1 text-[10px] text-text-muted">
          Enter GST-exclusive fee; 18% GST is added in totals.
        </div>
      </div>

      <div>
        <label className="section-label" htmlFor="input-first-period-days">
          Days to first payment due date
        </label>
        <input
          className="input-field"
          id="input-first-period-days"
          max="90"
          min="1"
          onChange={(event) =>
            onFirstPeriodDaysChange(
              Math.min(90, Math.max(1, Number(event.target.value) || 1))
            )
          }
          step="1"
          type="number"
          value={firstPeriodDays}
        />
        <input
          aria-label="Days to first payment due date slider"
          className="range-input mt-1.5"
          max="60"
          min="1"
          onChange={(event) =>
            onFirstPeriodDaysChange(Number(event.target.value))
          }
          step="1"
          type="range"
          value={firstPeriodDays}
        />
        <div className="mt-1 text-[10px] leading-normal text-text-muted">
          From EMI booking / purchase date to first EMI payment due date on
          your statement. Month 1 interest is pro-rated; months 2+ use a full
          monthly period. Default 30 = equal-month model.
        </div>
      </div>

      <div>
        <div className="section-label" id="day-count-label">
          First-period day-count
        </div>
        <div
          aria-labelledby="day-count-label"
          className="toggle-pill"
          role="group"
        >
          <Button
            aria-pressed={dayCountConvention === DAY_COUNT_THIRTY}
            onClick={() => onDayCountConventionChange(DAY_COUNT_THIRTY)}
            selected={dayCountConvention === DAY_COUNT_THIRTY}
            variant="toggle"
          >
            30-day (banks)
          </Button>
          <Button
            aria-pressed={dayCountConvention === DAY_COUNT_ACTUAL365}
            onClick={() => onDayCountConventionChange(DAY_COUNT_ACTUAL365)}
            selected={dayCountConvention === DAY_COUNT_ACTUAL365}
            variant="toggle"
          >
            Actual/365
          </Button>
        </div>
        <div className="mt-1 text-[10px] leading-normal text-text-muted">
          {dayCountConvention === DAY_COUNT_ACTUAL365
            ? "Interest₁ = Principal × (rate% ÷ 100) × (days ÷ 365)"
            : "Interest₁ = Principal × (rate ÷ 1200) × (days ÷ 30) — typical card EMI pro-rata"}
        </div>
      </div>
    </div>
  );
}
