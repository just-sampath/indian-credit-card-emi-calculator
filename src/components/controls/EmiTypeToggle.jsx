import { Button } from "../ui/Button.jsx";

export function EmiTypeToggle({ isNoCost, onChange }) {
  return (
    <div>
      <div className="section-label">EMI Type</div>
      <div className="toggle-pill">
        <Button
          onClick={() => onChange(true)}
          selected={isNoCost}
          variant="toggle"
        >
          No Cost EMI
        </Button>
        <Button
          onClick={() => onChange(false)}
          selected={!isNoCost}
          variant="toggle"
        >
          Regular EMI
        </Button>
      </div>
      {isNoCost ? (
        <div className="mt-2 text-[10px] leading-normal text-text-muted">
          Merchant absorbs interest as upfront discount. You pay MRP/N per
          month, bank charges interest on discounted principal.
        </div>
      ) : null}
    </div>
  );
}
