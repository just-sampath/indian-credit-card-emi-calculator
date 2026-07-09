import { DAY_COUNT_ACTUAL365 } from "../../lib/emi.js";
import { Card } from "../ui/Card.jsx";
import { formatCurrency } from "../../lib/format.js";

function ScheduleMonthCard({ row, firstPeriodIsShort }) {
  const isShortFirst = row.month === 1 && firstPeriodIsShort;

  return (
    <Card className="px-4 py-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] text-text-muted">
            Month {row.month}
            <span
              className={
                isShortFirst ? " text-gold" : " text-text-muted"
              }
            >
              {" "}
              · {row.periodDays}d
            </span>
          </div>
          <div className="highlight-value mt-1 text-[18px] text-green">
            {formatCurrency(row.totalPaid)}
          </div>
          <div className="mt-0.5 text-[10px] text-text-muted">
            statement debit (base + GST)
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-text-muted">Closing</div>
          <div
            className={`mt-0.5 text-[13px] font-medium ${
              row.closingBalance < 1 ? "text-green" : "text-text"
            }`}
          >
            {row.closingBalance < 1
              ? "₹0.00"
              : formatCurrency(row.closingBalance)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border pt-2 text-[11px]">
        <div className="flex justify-between gap-2">
          <span className="text-text-muted">Interest</span>
          <span className="text-gold">{formatCurrency(row.interest)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-text-muted">Principal</span>
          <span className="text-blue">{formatCurrency(row.principalPaid)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-text-muted">GST</span>
          <span className="text-red">{formatCurrency(row.gst)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-text-muted">Base EMI</span>
          <span className="text-text">{formatCurrency(row.baseEMI)}</span>
        </div>
        <div className="col-span-2 flex justify-between gap-2 border-t border-border/60 pt-1.5">
          <span className="text-text-muted">Opening</span>
          <span className="text-text">{formatCurrency(row.openingBalance)}</span>
        </div>
      </div>
    </Card>
  );
}

export function ScheduleTab({ calc, isNoCost, mrp, tenure }) {
  const firstRow = calc.schedule[0];
  const dayCountLabel =
    calc.dayCountConvention === DAY_COUNT_ACTUAL365
      ? "Actual/365"
      : "30-day pro-rata";
  const firstPeriodIsShort = calc.firstPeriodDays !== 30;

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="text-[10px] text-text-muted">PRINCIPAL AMORTIZED</div>
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

        <Card>
          <div className="text-[10px] text-text-muted">
            BASE EMI BEFORE GST × {tenure}
          </div>
          <div className="mt-1 display-font text-[16px] font-bold text-text">
            {formatCurrency(calc.baseEMI)} × {tenure}
          </div>
          {isNoCost ? (
            <div className="mt-0.5 text-[10px] text-gold">
              sum of installments = {formatCurrency(calc.totalBasePaid)}
            </div>
          ) : null}
        </Card>

        <Card>
          <div className="text-[10px] text-text-muted">
            EMI STATEMENT OUTFLOW
          </div>
          <div className="mt-1 display-font text-[16px] font-bold text-text">
            {formatCurrency(calc.totalPaid)}
          </div>
          <div className="mt-0.5 text-[10px] text-text-muted">
            incl. GST on interest, excl. processing fee
          </div>
        </Card>

        <Card>
          <div className="text-[10px] text-text-muted">FIRST PERIOD</div>
          <div className="mt-1 display-font text-[16px] font-bold text-text">
            {calc.firstPeriodDays} days
          </div>
          <div className="mt-0.5 text-[10px] text-text-muted">
            {dayCountLabel}
            {firstRow
              ? ` · Int₁ ${formatCurrency(firstRow.interest)}`
              : null}
          </div>
        </Card>
      </div>

      <div className="mb-5">
        <div className="mb-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-[10px] text-text-muted">
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
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
          <span className="text-blue">■ Principal</span>
          <span className="text-gold">■ Interest</span>
          <span className="text-red">■ GST (18%)</span>
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="mb-4 flex flex-col gap-2.5 md:hidden">
        {calc.schedule.map((row) => (
          <ScheduleMonthCard
            key={row.month}
            firstPeriodIsShort={firstPeriodIsShort}
            row={row}
          />
        ))}
        <Card className="border-gold px-4 py-3" tone="gold">
          <div className="text-[10px] uppercase tracking-[0.08em] text-gold">
            Totals
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
            <div className="flex justify-between gap-2">
              <span className="text-text-muted">Interest</span>
              <span className="font-semibold text-gold">
                {formatCurrency(calc.totalInterest)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-text-muted">Principal</span>
              <span className="font-semibold text-blue">
                {formatCurrency(calc.principal)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-text-muted">GST</span>
              <span className="font-semibold text-red">
                {formatCurrency(calc.totalGST)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-text-muted">Base EMIs</span>
              <span className="font-semibold text-text">
                {formatCurrency(calc.totalBasePaid)}
              </span>
            </div>
            <div className="col-span-2 flex justify-between gap-2 border-t border-border pt-1.5">
              <span className="text-text-muted">Statement total</span>
              <span className="font-semibold text-green">
                {formatCurrency(calc.totalPaid)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tablet+ table */}
      <div className="hidden overflow-x-auto overscroll-x-contain rounded-lg border border-border md:block">
        <table className="data-table min-w-[720px]">
          <thead>
            <tr>
              <th className="text-center">Month</th>
              <th className="text-center">Days</th>
              <th>Opening Balance</th>
              <th>Interest</th>
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
                <td
                  className={
                    row.month === 1 && firstPeriodIsShort
                      ? "text-gold"
                      : "text-text-muted"
                  }
                >
                  {row.periodDays}
                </td>
                <td className="text-text">
                  {formatCurrency(row.openingBalance)}
                </td>
                <td className="text-gold">{formatCurrency(row.interest)}</td>
                <td className="text-blue">
                  {formatCurrency(row.principalPaid)}
                </td>
                <td className="text-red">{formatCurrency(row.gst)}</td>
                <td>{formatCurrency(row.baseEMI)}</td>
                <td className="font-semibold text-green">
                  {formatCurrency(row.totalPaid)}
                </td>
                <td
                  className={
                    row.closingBalance < 1 ? "text-green" : "text-text"
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
                {formatCurrency(calc.totalBasePaid)}
              </td>
              <td className="font-semibold text-green">
                {formatCurrency(calc.totalPaid)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface px-3 py-3 text-[11px] leading-[1.7] text-text-muted sm:px-4">
        <strong className="text-gold">How it works:</strong> Month 1 interest
        uses your booking → first due date gap ({calc.firstPeriodDays} days,{" "}
        {dayCountLabel}
        ). Months 2+ use a full monthly rate: Opening × (Annual Rate ÷ 1200).
        Principal Paid = Base EMI − Interest. GST (18%) is on billed interest;
        statement debit = Base EMI + GST.
        {isNoCost ? (
          <>
            <br />
            <strong className="text-green">No Cost EMI:</strong> Your card is
            charged {formatCurrency(calc.principal)} (not {formatCurrency(mrp)}
            ). Merchant gives upfront discount of{" "}
            {formatCurrency(calc.discount)}. Base EMIs total{" "}
            {formatCurrency(calc.totalBasePaid)}.
          </>
        ) : null}
      </div>
    </div>
  );
}
