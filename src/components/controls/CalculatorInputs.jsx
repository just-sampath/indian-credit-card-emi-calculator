import { Button } from "../ui/Button.jsx";

const TENURE_OPTIONS = [3, 6, 9, 12, 18, 24];

export function CalculatorInputs({
  annualRate,
  mrp,
  onAnnualRateChange,
  onMrpChange,
  onProcFeeChange,
  onTenureChange,
  procFee,
  tenure,
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <div className="section-label">Product MRP (₹)</div>
        <input
          className="input-field"
          min="1000"
          onChange={(event) => onMrpChange(Number(event.target.value))}
          step="100"
          type="number"
          value={mrp}
        />
        <input
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
        <div className="section-label">Annual Interest Rate (%)</div>
        <input
          className="input-field"
          max="60"
          min="0"
          onChange={(event) => onAnnualRateChange(Number(event.target.value))}
          step="0.1"
          type="number"
          value={annualRate}
        />
        <input
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
        <div className="section-label">Tenure (Months)</div>
        <div className="flex flex-wrap gap-1.5">
          {TENURE_OPTIONS.map((option) => (
            <Button
              key={option}
              onClick={() => onTenureChange(option)}
              selected={tenure === option}
              variant="tenure"
            >
              {option}M
            </Button>
          ))}
        </div>
        <input
          className="input-field mt-2"
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
        <div className="section-label">Processing Fee (₹)</div>
        <input
          className="input-field"
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
    </div>
  );
}
