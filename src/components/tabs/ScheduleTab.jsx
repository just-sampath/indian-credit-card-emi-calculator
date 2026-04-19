import { Card } from "../ui/Card.jsx";
import { formatCurrency } from "../../lib/format.js";

export function ScheduleTab({ calc, isNoCost, mrp, tenure }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Card className="flex-1">
          <div className="text-[10px] text-text-muted">
            PRINCIPAL AMORTIZED
          </div>
          <div className="mt-1 display-font text-[16px] font-bold text-text">
            {formatCurrency(calc.principal)}
          </div>
          {isNoCost ? (
            <div className="mt-0.5 text-[10px] text-green">
              ← MRP {formatCurrency(mrp)} minus discount{" "}
              {formatCurrency(calc.discount)}
            </div>
          ) : null}
        </Card>

        <Card className="flex-1">
          <div className="text-[10px] text-text-muted">
            BASE EMI × {tenure}
          </div>
          <div className="mt-1 display-font text-[16px] font-bold text-text">
            {formatCurrency(calc.baseEMI)} × {tenure}
          </div>
          {isNoCost ? (
            <div className="mt-0.5 text-[10px] text-gold">
              = MRP ÷ {tenure} (exact)
            </div>
          ) : null}
        </Card>

        <Card className="flex-1">
          <div className="text-[10px] text-text-muted">
            TOTAL EMI OUTFLOW
          </div>
          <div className="mt-1 display-font text-[16px] font-bold text-text">
            {formatCurrency(calc.totalPaid)}
          </div>
          <div className="mt-0.5 text-[10px] text-text-muted">
            incl. GST on interest
          </div>
        </Card>
      </div>

      <div className="mb-5">
        <div className="mb-1.5 flex justify-between text-[10px] text-text-muted">
          <span>
            Principal: {((calc.principal / calc.totalPaid) * 100).toFixed(1)}%
          </span>
          <span>
            Interest: {((calc.totalInterest / calc.totalPaid) * 100).toFixed(1)}
            %
          </span>
          <span>
            GST: {((calc.totalGST / calc.totalPaid) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-sm">
          <div
            className="bg-blue"
            style={{ width: `${(calc.principal / calc.totalPaid) * 100}%` }}
          />
          <div
            className="bg-gold"
            style={{ width: `${(calc.totalInterest / calc.totalPaid) * 100}%` }}
          />
          <div
            className="bg-red"
            style={{ width: `${(calc.totalGST / calc.totalPaid) * 100}%` }}
          />
        </div>
        <div className="mt-1.5 flex gap-4 text-[10px]">
          <span className="text-blue">■ Principal</span>
          <span className="text-gold">■ Interest</span>
          <span className="text-red">■ GST (18%)</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="data-table">
          <thead>
            <tr>
              <th className="text-center">Month</th>
              <th>Opening Balance</th>
              <th>Interest (r×Bal)</th>
              <th>Principal</th>
              <th>GST on Int.</th>
              <th>Base EMI</th>
              <th className="text-green">Total Monthly</th>
              <th>Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            {calc.schedule.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td className="text-text">
                  {formatCurrency(row.openingBalance)}
                </td>
                <td className="text-gold">
                  {formatCurrency(row.interest)}
                </td>
                <td className="text-blue">
                  {formatCurrency(row.principalPaid)}
                </td>
                <td className="text-red">
                  {formatCurrency(row.gst)}
                </td>
                <td>{formatCurrency(row.baseEMI)}</td>
                <td className="font-semibold text-green">
                  {formatCurrency(row.totalPaid)}
                </td>
                <td
                  className={
                    row.closingBalance < 1
                      ? "text-green"
                      : "text-text"
                  }
                >
                  {row.closingBalance < 1
                    ? "₹0.00"
                    : formatCurrency(row.closingBalance)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-t-gold">
              <td className="font-semibold text-gold">TOTAL</td>
              <td />
              <td className="font-semibold text-gold">
                {formatCurrency(calc.totalInterest)}
              </td>
              <td className="font-semibold text-blue">
                {formatCurrency(calc.principal)}
              </td>
              <td className="font-semibold text-red">
                {formatCurrency(calc.totalGST)}
              </td>
              <td className="font-semibold">
                {formatCurrency(calc.baseEMI * tenure)}
              </td>
              <td className="font-semibold text-green">
                {formatCurrency(calc.totalPaid)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-[11px] leading-[1.7] text-[#475569]">
        <strong className="text-gold">How it works:</strong> Each
        month, Interest = Opening Balance × (Annual Rate ÷ 1200). Principal Paid
        = Base EMI − Interest. GST (18%) is charged on the monthly interest
        component and billed separately. Opening balance for next month =
        previous closing balance.
        {isNoCost ? (
          <>
            <br />
            <strong className="text-green">
              No Cost EMI:
            </strong>{" "}
            Your card is charged {formatCurrency(calc.principal)} (not{" "}
            {formatCurrency(mrp)}). Merchant gives upfront discount of{" "}
            {formatCurrency(calc.discount)}. Your base EMI = ₹{mrp} ÷ {tenure} ={" "}
            {formatCurrency(calc.baseEMI)} exactly.
          </>
        ) : null}
      </div>
    </div>
  );
}
