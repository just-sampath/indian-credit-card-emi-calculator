import { Card } from "../ui/Card.jsx";
import { formatCurrency } from "../../lib/format.js";

export function PreclosureTab({
  calc,
  isNoCost,
  merchantClawback,
  onMerchantClawbackChange,
  onPreclosureFeeRateChange,
  onPreclosureInterestMonthsChange,
  onPreclosureMonthChange,
  preclosureFeeRate,
  preclosureInterestMonths,
  preclosureMonth,
  tenure,
}) {
  const preclosure = calc.preclosure;

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-4">
        <div>
          <div className="section-label">
            Simulate Pre-closure at end of Month
          </div>
          <div className="mt-2 flex items-center gap-3">
            <input
              className="range-input"
              max={tenure}
              min={1}
              onChange={(event) =>
                onPreclosureMonthChange(Number(event.target.value))
              }
              step={1}
              type="range"
              value={preclosureMonth}
            />
            <input
              className="input-field w-17.5"
              max={tenure}
              min={1}
              onChange={(event) =>
                onPreclosureMonthChange(
                  Math.min(tenure, Math.max(1, Number(event.target.value)))
                )
              }
              type="number"
              value={preclosureMonth}
            />
            <span className="text-[12px] text-text-muted">of {tenure}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="text-[10px] text-text-muted">
            Fee rate (%)
            <input
              className="input-field mt-1"
              min="0"
              onChange={(event) =>
                onPreclosureFeeRateChange(Number(event.target.value))
              }
              step="0.1"
              type="number"
              value={preclosureFeeRate}
            />
          </label>
          <label className="text-[10px] text-text-muted">
            Accrued/advance interest
            <input
              className="input-field mt-1"
              min="0"
              onChange={(event) =>
                onPreclosureInterestMonthsChange(Number(event.target.value))
              }
              step="0.25"
              type="number"
              value={preclosureInterestMonths}
            />
          </label>
          <label className="text-[10px] text-text-muted">
            No Cost clawback
            <input
              className="input-field mt-1"
              disabled={!isNoCost}
              min="0"
              onChange={(event) =>
                onMerchantClawbackChange(Number(event.target.value))
              }
              step="1"
              type="number"
              value={merchantClawback}
            />
          </label>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Card>
          <div className="text-[10px] text-text-muted">
            EMIs PAID ({preclosure.month} months)
          </div>
          <div className="highlight-value mt-1 text-[18px] text-text">
            {formatCurrency(preclosure.paidSoFar)}
          </div>
          <div className="mt-0.5 text-[10px] text-text-muted">
            incl. GST on interest
          </div>
        </Card>

        <Card tone="red">
          <div className="text-[10px] text-red">OUTSTANDING PRINCIPAL</div>
          <div className="highlight-value mt-1 text-[18px] text-[#fca5a5]">
            {formatCurrency(preclosure.outstandingPrincipal)}
          </div>
          <div className="mt-0.5 text-[10px] text-text-muted">
            to be paid on pre-closure
          </div>
        </Card>

        <Card>
          <div className="text-[10px] text-text-dim">PRE-CLOSURE FEE</div>
          <div className="highlight-value mt-1 text-[18px] text-text">
            {formatCurrency(preclosure.preclosureFee)}
          </div>
          <div className="mt-0.5 text-[10px] text-text-muted">
            + GST {formatCurrency(preclosure.preclosureFeeGst)}
          </div>
        </Card>
      </div>

      <Card className="mb-5 px-5 py-5" tone="gold">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1.5 text-[11px] text-gold">
              TOTAL COST IF YOU PRE-CLOSE AT MONTH {preclosure.month}
            </div>
            <div className="highlight-value text-[32px] text-gold-soft">
              {formatCurrency(preclosure.totalCost)}
            </div>
            <div className="mt-1.5 text-[11px] text-text-dim">
              = EMIs paid ({formatCurrency(preclosure.paidSoFar)}) + Outstanding
              ({formatCurrency(preclosure.outstandingPrincipal)}) + Fee (
              {formatCurrency(preclosure.preclosureFee)}) + Fee GST (
              {formatCurrency(preclosure.preclosureFeeGst)}) + Interest (
              {formatCurrency(preclosure.preclosureInterest)}) + Interest GST (
              {formatCurrency(preclosure.preclosureInterestGst)}) + Processing
              fee total ({formatCurrency(calc.processingFeeTotal)})
              {isNoCost && preclosure.merchantClawback > 0
                ? ` + Clawback (${formatCurrency(preclosure.merchantClawback)})`
                : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1 text-[10px] text-text-muted">
              VS FULL TENURE
            </div>
            <div
              className={`display-font text-[18px] font-bold ${
                preclosure.savingVsFullTenure >= 0 ? "text-green" : "text-red"
              }`}
            >
              {preclosure.savingVsFullTenure >= 0 ? "Save " : "Extra "}
              {formatCurrency(Math.abs(preclosure.savingVsFullTenure))}
            </div>
          </div>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Paid (EMI+GST)</th>
              <th>Outstanding Principal</th>
              <th>Pre-closure Fee + GST</th>
              <th>Accrued/advance Interest + GST</th>
              <th>Total Cost to Close</th>
              <th>Δ vs MRP</th>
            </tr>
          </thead>
          <tbody>
            {calc.preclosureRows.map((row) => {
              const feeTotal = row.preclosureFee + row.preclosureFeeGst;
              const interestTotal =
                row.preclosureInterest + row.preclosureInterestGst;
              const isActive = row.month === preclosureMonth;
              return (
                <tr
                  key={row.month}
                  className={
                    isActive ? "pc-row cursor-pointer" : "cursor-pointer"
                  }
                  onClick={() => onPreclosureMonthChange(row.month)}
                >
                  <td>
                    {row.month}
                    {isActive ? " ◄" : ""}
                  </td>
                  <td className="text-text">{formatCurrency(row.paidSoFar)}</td>
                  <td className="text-red">
                    {formatCurrency(row.outstandingPrincipal)}
                  </td>
                  <td className="text-text-dim">{formatCurrency(feeTotal)}</td>
                  <td className="text-text-dim">
                    {formatCurrency(interestTotal)}
                  </td>
                  <td
                    className={isActive ? "font-bold text-gold" : "text-text"}
                  >
                    {formatCurrency(row.totalCost)}
                  </td>
                  <td
                    className={row.deltaVsMRP <= 0 ? "text-green" : "text-red"}
                  >
                    {row.deltaVsMRP > 0 ? "+" : ""}
                    {formatCurrency(row.deltaVsMRP)}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-t-border">
              <td className="text-gold">Full Tenure</td>
              <td className="text-green">{formatCurrency(calc.totalPaid)}</td>
              <td className="text-green">₹0.00</td>
              <td className="text-green">₹0.00</td>
              <td className="text-green">₹0.00</td>
              <td className="font-semibold text-green">
                {formatCurrency(calc.grandTotal)}
              </td>
              <td className="text-red">
                +{formatCurrency(calc.extraCostAboveMRP)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 rounded-lg border border-border bg-surface px-4 py-3 text-[11px] leading-[1.7] text-[#475569]">
        <strong className="text-gold">Pre-closure per T&C:</strong> Outstanding
        principal + configurable pre-closure fee + GST on that fee +
        accrued/advance interest + GST on that interest. Processing fee and GST
        on processing fee apply regardless.
        {isNoCost ? (
          <>
            <br />
            <strong className="text-green">Note:</strong> If you pre-close a No
            Cost EMI, any merchant/cashback clawback is configurable above and
            defaults to zero.
          </>
        ) : null}
      </div>
    </div>
  );
}
