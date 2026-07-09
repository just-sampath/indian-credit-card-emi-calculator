import { Button } from "../ui/Button.jsx";

export function EmiTypeToggle({ isNoCost, onChange }) {
  return (
    <div>
      <div className="section-label" id="emi-type-label">
        EMI Type
      </div>
      <div
        aria-labelledby="emi-type-label"
        className="toggle-pill"
        role="group"
      >
        <Button
          aria-pressed={isNoCost}
          onClick={() => onChange(true)}
          selected={isNoCost}
          variant="toggle"
        >
          No Cost EMI
        </Button>
        <Button
          aria-pressed={!isNoCost}
          onClick={() => onChange(false)}
          selected={!isNoCost}
          variant="toggle"
        >
          Regular EMI
        </Button>
      </div>
      {isNoCost ? (
        <div className="mt-2 text-[10px] leading-normal text-text-muted">
          Merchant absorbs interest as upfront discount. Base EMIs total MRP;
          statement debit also includes GST on interest.
        </div>
      ) : null}
    </div>
  );
}
