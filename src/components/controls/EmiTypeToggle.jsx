import { SegmentedToggle } from "./SegmentedToggle.jsx";

const OPTIONS = [
  { value: true, label: "No Cost EMI" },
  { value: false, label: "Regular EMI" },
];

export function EmiTypeToggle({ isNoCost, onChange }) {
  return (
    <div>
      <div className="section-label" id="emi-type-label">
        EMI type
      </div>
      <SegmentedToggle
        labelledBy="emi-type-label"
        onChange={onChange}
        options={OPTIONS}
        value={isNoCost}
      />
      {/* Short laptop/tablet screens: the Schedule tab note says the same. */}
      <p className="field-hint shell:short:hidden">
        {isNoCost
          ? "The merchant discounts the price by the interest, so your EMIs add up to the MRP. You still pay GST on that interest."
          : "You borrow the full MRP and pay interest at the rate below, plus GST on that interest."}
      </p>
    </div>
  );
}
