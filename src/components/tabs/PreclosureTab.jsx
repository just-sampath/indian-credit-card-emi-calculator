import { Card } from "../ui/Card.jsx";
import { formatCurrency } from "../../lib/format.js";

export function PreclosureTab({
  calc,
  isNoCost,
  mrp,
  onPreclosureMonthChange,
  preclosureMonth,
  procFee,
  tenure,
}) {
  return (
    <div>
      <div className="mb-5">
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
          <span className="text-[12px] text-text-muted">
            of {tenure}
          </span>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Card>
          <div className="text-[10px] text-text-muted">
            EMIs PAID ({calc.pcMonth} months)
          </div>
          <div className="highlight-value mt-1 text-[18px] text-text">
            {formatCurrency(calc.paidSoFar)}
          </div>
          <div className="mt-0.5 text-[10px] text-text-muted">
            incl. GST on interest
          </div>
        </Card>

        <Card tone="red">
          <div className="text-[10px] text-red">
            OUTSTANDING PRINCIPAL
          </div>
          <div className="highlight-value mt-1 text-[18px] text-[#fca5a5]">
            {formatCurrency(calc.outstandingPrincipal)}
          </div>
          <div className="mt-0.5 text-[10px] text-text-muted">
            to be paid on pre-closure
          </div>
        </Card>

        <Card>
          <div className="text-[10px] text-text-dim">
            PRE-CLOSURE CHARGE (3%)
          </div>
          <div className="highlight-value mt-1 text-[18px] text-text">
            {formatCurrency(calc.pcFee)}
          </div>
          <div className="mt-0.5 text-[10px] text-text-muted">
            3% of outstanding principal
          </div>
        </Card>
      </div>

      <Card className="mb-5 px-5 py-5" tone="gold">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1.5 text-[11px] text-gold">
              TOTAL COST IF YOU PRE-CLOSE AT MONTH {calc.pcMonth}
            </div>
            <div className="highlight-value text-[32px] text-gold-soft">
              {formatCurrency(calc.pcTotalCost)}
            </div>
            <div className="mt-1.5 text-[11px] text-text-dim">
              = EMIs paid ({formatCurrency(calc.paidSoFar)}) + Outstanding (
              {formatCurrency(calc.outstandingPrincipal)}) + Pre-closure fee (
              {formatCurrency(calc.pcFee)}) + Proc fee (
              {formatCurrency(procFee)})
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1 text-[10px] text-text-muted">
              VS FULL TENURE
            </div>
            <div
              className={`display-font text-[18px] font-bold ${
                calc.pcSavingVsFullTenure >= 0
                  ? "text-green"
                  : "text-red"
              }`}
            >
              {calc.pcSavingVsFullTenure >= 0 ? "Save " : "Extra "}
              {formatCurrency(Math.abs(calc.pcSavingVsFullTenure))}
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
              <th>Pre-closure Fee (3%)</th>
              <th>Total Cost to Close</th>
              <th>Δ vs MRP</th>
            </tr>
          </thead>
          <tbody>
            {calc.schedule.map((row, index) => {
              const paidUpToHere = calc.schedule
                .slice(0, index + 1)
                .reduce((total, current) => total + current.totalPaid, 0);
              const outstandingHere = row.closingBalance;
              const preclosureFeeHere = outstandingHere * 0.03;
              const totalHere =
                paidUpToHere + outstandingHere + preclosureFeeHere + procFee;
              const delta = totalHere - mrp;
              const isActive = index + 1 === preclosureMonth;

              return (
                <tr
                  key={row.month}
                  className={
                    isActive ? "pc-row cursor-pointer" : "cursor-pointer"
                  }
                  onClick={() => onPreclosureMonthChange(index + 1)}
                >
                  <td>
                    {row.month}
                    {isActive ? " ◄" : ""}
                  </td>
                  <td className="text-text">
                    {formatCurrency(paidUpToHere)}
                  </td>
                  <td className="text-red">
                    {formatCurrency(outstandingHere)}
                  </td>
                  <td className="text-text-dim">
                    {formatCurrency(preclosureFeeHere)}
                  </td>
                  <td
                    className={
                      isActive
                        ? "font-bold text-gold"
                        : "text-text"
                    }
                  >
                    {formatCurrency(totalHere)}
                  </td>
                  <td
                    className={
                      delta <= 0
                        ? "text-green"
                        : "text-red"
                    }
                  >
                    {delta > 0 ? "+" : ""}
                    {formatCurrency(delta)}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-t-border">
              <td className="text-gold">Full Tenure</td>
              <td className="text-green">
                {formatCurrency(calc.totalPaid)}
              </td>
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
        <strong className="text-gold">
          Pre-closure per T&C:
        </strong>{" "}
        3% of outstanding principal balance + any accrued interest from last
        statement to closure date (simplified here as same-month). Proc fee of
        ₹199–₹849 applies regardless. No pre-closure allowed on loan booking
        date or billing/statement date.
        {isNoCost ? (
          <>
            <br />
            <strong className="text-green">Note:</strong> If you
            pre-close a No Cost EMI, the upfront discount given by merchant may
            be clawed back within 120 days per terms.
          </>
        ) : null}
      </div>
    </div>
  );
}
