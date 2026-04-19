import { CalculatorInputs } from "../controls/CalculatorInputs.jsx";
import { EmiTypeToggle } from "../controls/EmiTypeToggle.jsx";
import { Card } from "../ui/Card.jsx";
import { formatCurrency } from "../../lib/format.js";

export function Sidebar({
  annualRate,
  calc,
  isNoCost,
  mrp,
  onAnnualRateChange,
  onIsNoCostChange,
  onMrpChange,
  onProcFeeChange,
  onTenureChange,
  procFee,
  tenure,
}) {
  return (
    <>
      <EmiTypeToggle isNoCost={isNoCost} onChange={onIsNoCostChange} />

      <CalculatorInputs
        annualRate={annualRate}
        mrp={mrp}
        onAnnualRateChange={onAnnualRateChange}
        onMrpChange={onMrpChange}
        onProcFeeChange={onProcFeeChange}
        onTenureChange={onTenureChange}
        procFee={procFee}
        tenure={tenure}
      />

      <hr className="divider-line" />

      <div className="flex flex-col gap-2">
        <div className="section-label">Live Summary</div>

        {isNoCost ? (
          <Card tone="green">
            <div className="mb-1 text-[10px] text-green">
              UPFRONT DISCOUNT (Merchant Pays)
            </div>
            <div className="highlight-value text-[22px] text-green">
              {formatCurrency(calc.discount)}
            </div>
            <div className="mt-1 text-[10px] text-text-muted">
              Credit card charged: {formatCurrency(calc.principal)}
            </div>
          </Card>
        ) : null}

        <Card tone="gold">
          <div className="mb-1 text-[10px] text-gold">
            MONTHLY PAYMENT (Base EMI)
          </div>
          <div className="highlight-value text-[22px] text-gold-soft">
            {formatCurrency(calc.baseEMI)}
          </div>
          <div className="mt-1 text-[10px] text-text-muted">
            + GST on interest (varies per month)
          </div>
        </Card>

        <Card>
          <div className="mb-1 text-[10px] text-text-dim">
            TOTAL INTEREST PAID
          </div>
          <div className="highlight-value text-[16px] text-gold-soft">
            {formatCurrency(calc.totalInterest)}
          </div>
        </Card>

        <Card>
          <div className="mb-1 text-[10px] text-text-dim">
            TOTAL GST ON INTEREST
          </div>
          <div className="highlight-value text-[16px] text-gold-soft">
            {formatCurrency(calc.totalGST)}
          </div>
        </Card>

        <Card tone="red">
          <div className="mb-1 text-[10px] text-red">
            TRUE EXTRA COST ABOVE MRP
          </div>
          <div className="highlight-value text-[18px] text-[#fca5a5]">
            {formatCurrency(calc.extraCostAboveMRP)}
          </div>
          <div className="mt-1 text-[10px] text-text-muted">
            = GST on interest + proc fee{!isNoCost ? " + interest" : ""}
          </div>
        </Card>
      </div>
    </>
  );
}
