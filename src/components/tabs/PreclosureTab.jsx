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
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="section-label" htmlFor="input-preclosure-month">
            Simulate Pre-closure at end of Month
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              aria-label="Pre-closure month slider"
              aria-valuemax={tenure}
              aria-valuemin={1}
              aria-valuenow={preclosureMonth}
              className="range-input min-w-0 flex-1"
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
              className="input-field w-16 shrink-0 sm:w-17.5"
              id="input-preclosure-month"
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
            <span className="shrink-0 text-[12px] text-text-muted">
              of {tenure}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="text-[10px] text-text-muted" htmlFor="input-pc-fee">
            Fee rate (%)
            <input
              className="input-field mt-1"
              id="input-pc-fee"
              min="0"
              onChange={(event) =>
                onPreclosureFeeRateChange(Number(event.target.value))
              }
              step="0.1"
              type="number"
              value={preclosureFeeRate}
            />
          </label>
          <label
            className="text-[10px] text-text-muted"
            htmlFor="input-pc-interest-months"
          >
            Accrued/advance interest
            <input
              className="input-field mt-1"
              id="input-pc-interest-months"
              min="0"
              onChange={(event) =>
                onPreclosureInterestMonthsChange(Number(event.target.value))
              }
              step="0.25"
              type="number"
              value={preclosureInterestMonths}
            />
          </label>
          <label
            className="text-[10px] text-text-muted"
            htmlFor="input-pc-clawback"
          >
            No Cost clawback
            <input
              className="input-field mt-1"
              disabled={!isNoCost}
              id="input-pc-clawback"
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

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
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

      <Card className="mb-5 px-4 py-4 sm:px-5 sm:py-5" tone="gold">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1.5 text-[11px] text-gold">
              TOTAL COST IF YOU PRE-CLOSE AT MONTH {preclosure.month}
            </div>
            <div className="highlight-value text-[28px] text-gold-soft sm:text-[32px]">
              {formatCurrency(preclosure.totalCost)}
            </div>
            <div className="mt-1.5 text-[11px] leading-relaxed text-text-dim">
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
          <div className="shrink-0 border-t border-border pt-3 text-left sm:border-t-0 sm:pt-0 sm:text-right">
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

      {/* Mobile cards */}
      <div className="mb-3 flex flex-col gap-2.5 md:hidden">
        {calc.preclosureRows.map((row) => {
          const feeTotal = row.preclosureFee + row.preclosureFeeGst;
          const interestTotal =
            row.preclosureInterest + row.preclosureInterestGst;
          const isActive = row.month === preclosureMonth;
          return (
            <button
              key={row.month}
              aria-pressed={isActive}
              className={`w-full rounded-[10px] border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] ${
                isActive
                  ? "border-gold bg-[linear-gradient(135deg,#0f1318_0%,#1a150a_100%)]"
                  : "border-border bg-surface"
              }`}
              onClick={() => onPreclosureMonthChange(row.month)}
              type="button"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-gold">
                  Month {row.month}
                  {isActive ? " ◄" : ""}
                </span>
                <span
                  className={`text-[14px] font-bold ${
                    isActive ? "text-gold" : "text-text"
                  }`}
                >
                  {formatCurrency(row.totalCost)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <div className="flex justify-between gap-2">
                  <span className="text-text-muted">Paid</span>
                  <span className="text-text">
                    {formatCurrency(row.paidSoFar)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-text-muted">Outstanding</span>
                  <span className="text-red">
                    {formatCurrency(row.outstandingPrincipal)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-text-muted">Fee+GST</span>
                  <span className="text-text-dim">
                    {formatCurrency(feeTotal)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-text-muted">Int+GST</span>
                  <span className="text-text-dim">
                    {formatCurrency(interestTotal)}
                  </span>
                </div>
                <div className="col-span-2 flex justify-between gap-2 border-t border-border/60 pt-1">
                  <span className="text-text-muted">Δ vs MRP</span>
                  <span
                    className={
                      row.deltaVsMRP <= 0 ? "text-green" : "text-red"
                    }
                  >
                    {row.deltaVsMRP > 0 ? "+" : ""}
                    {formatCurrency(row.deltaVsMRP)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
        <Card className="px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gold">
              Full Tenure
            </span>
            <span className="text-[14px] font-bold text-green">
              {formatCurrency(calc.grandTotal)}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-text-muted">Δ vs MRP</span>
            <span className="text-red">
              +{formatCurrency(calc.extraCostAboveMRP)}
            </span>
          </div>
        </Card>
      </div>

      <div className="hidden overflow-x-auto overscroll-x-contain rounded-lg border border-border md:block">
        <table className="data-table min-w-[680px]">
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
                  aria-current={isActive ? "true" : undefined}
                  className={isActive ? "pc-row" : undefined}
                >
                  <td className="text-center">
                    <button
                      aria-pressed={isActive}
                      className="inline-flex min-h-9 min-w-10 items-center justify-center rounded px-2 font-medium text-inherit transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
                      onClick={() => onPreclosureMonthChange(row.month)}
                      type="button"
                    >
                      {row.month}
                      {isActive ? " ◄" : ""}
                      <span className="sr-only">
                        {` Select pre-closure at month ${row.month}`}
                      </span>
                    </button>
                  </td>
                  <td
                    className="cursor-pointer text-text"
                    onClick={() => onPreclosureMonthChange(row.month)}
                  >
                    {formatCurrency(row.paidSoFar)}
                  </td>
                  <td
                    className="cursor-pointer text-red"
                    onClick={() => onPreclosureMonthChange(row.month)}
                  >
                    {formatCurrency(row.outstandingPrincipal)}
                  </td>
                  <td
                    className="cursor-pointer text-text-dim"
                    onClick={() => onPreclosureMonthChange(row.month)}
                  >
                    {formatCurrency(feeTotal)}
                  </td>
                  <td
                    className="cursor-pointer text-text-dim"
                    onClick={() => onPreclosureMonthChange(row.month)}
                  >
                    {formatCurrency(interestTotal)}
                  </td>
                  <td
                    className={`cursor-pointer ${
                      isActive ? "font-bold text-gold" : "text-text"
                    }`}
                    onClick={() => onPreclosureMonthChange(row.month)}
                  >
                    {formatCurrency(row.totalCost)}
                  </td>
                  <td
                    className={`cursor-pointer ${
                      row.deltaVsMRP <= 0 ? "text-green" : "text-red"
                    }`}
                    onClick={() => onPreclosureMonthChange(row.month)}
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

      <div className="mt-3 rounded-lg border border-border bg-surface px-3 py-3 text-[11px] leading-[1.7] text-text-muted sm:px-4">
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
