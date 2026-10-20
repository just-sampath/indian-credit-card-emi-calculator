import { cn } from "../../lib/cn.js";
import {
  formatCurrency,
  formatCurrencyShort,
  formatShare,
} from "../../lib/format.js";
import { ScrollableTable } from "../ui/ScrollableTable.jsx";
import { YearGroups } from "../ui/YearGroups.jsx";

function balanceLabel(value) {
  return value < 1 ? "₹0.00" : formatCurrency(value);
}

function Amount({ className, label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] text-text-muted dense:text-[11px]">
        {label}
      </div>
      <div className={cn("truncate text-[13px] tabular-nums", className)}>
        {value}
      </div>
    </div>
  );
}

function ScheduleMonthCard({ row, showPeriodDays, standardEmi }) {
  const adjustedEmi = Math.abs(row.baseEMI - standardEmi) >= 0.01;
  return (
    <li className="rounded-[10px] border border-border bg-surface px-3.5 py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[14px] font-medium text-text">
          Month {row.month}
          {showPeriodDays ? (
            <span className="ml-1.5 text-[12px] font-normal text-gold">
              {row.periodDays} days
            </span>
          ) : null}
        </h3>
        <div className="highlight-value text-[17px] leading-tight text-green">
          {formatCurrency(row.totalPaid)}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2">
        <Amount
          className="text-gold"
          label="Interest"
          value={formatCurrency(row.interest)}
        />
        <Amount
          className="text-blue"
          label="Principal"
          value={formatCurrency(row.principalPaid)}
        />
        <Amount
          className="text-red"
          label="GST"
          value={formatCurrency(row.gst)}
        />
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2 text-[13px] text-text-muted">
        <span>{adjustedEmi ? `EMI ${formatCurrency(row.baseEMI)}` : null}</span>
        <span className="tabular-nums">
          <span
            className={row.closingBalance < 1 ? "text-green" : "text-text-dim"}
          >
            {balanceLabel(row.closingBalance)}
          </span>{" "}
          left
        </span>
      </div>
    </li>
  );
}

function summarizeYear(rows) {
  const paid = rows.reduce((total, row) => total + row.totalPaid, 0);
  const left = rows[rows.length - 1].closingBalance;
  return (
    <>
      <span className="block">{formatCurrencyShort(paid)} paid</span>
      <span className="block text-text-muted">
        {left < 1 ? "₹0" : formatCurrencyShort(left)} left
      </span>
    </>
  );
}

export function ScheduleTab({ annualRate, calc, isNoCost, mrp }) {
  const firstPeriodIsIrregular = calc.firstPeriodDays !== 30;
  const segments = [
    {
      label: "Principal",
      value: calc.principal,
      bar: "bg-blue",
      text: "text-blue",
    },
    {
      label: "Interest",
      value: calc.totalInterest,
      bar: "bg-gold",
      text: "text-gold",
    },
    {
      label: "GST on interest",
      value: calc.totalGST,
      bar: "bg-red",
      text: "text-red",
    },
  ];
  const hasPayments = calc.totalPaid > 0;

  return (
    <div className="flex flex-col gap-5 @min-[70rem]:grid @min-[70rem]:grid-cols-[minmax(18rem,23rem)_minmax(0,1fr)] @min-[70rem]:items-start @min-[70rem]:gap-6">
      <h2 className="sr-only">Amortization schedule</h2>

      <section
        aria-labelledby="split-heading"
        className="shell:short:@max-[70rem]:order-last [@media(max-height:500px)]:order-last @min-[70rem]:sticky @min-[70rem]:top-20"
      >
        <h3 className="section-label" id="split-heading">
          Where your EMI payments go
        </h3>
        <div
          aria-hidden="true"
          className="flex h-2.5 w-full overflow-hidden rounded-sm bg-border"
        >
          {hasPayments
            ? segments.map((segment) => (
                <div
                  key={segment.label}
                  className={segment.bar}
                  style={{
                    width: `${(segment.value / calc.totalPaid) * 100}%`,
                  }}
                />
              ))
            : null}
        </div>
        <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] dense:text-[12px]">
          {segments.map((segment) => (
            <li key={segment.label} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn("size-2.5 rounded-xs", segment.bar)}
              />
              <span className="text-text-dim">{segment.label}</span>
              <span className={cn("tabular-nums", segment.text)}>
                {formatCurrency(segment.value)}
              </span>
              <span className="text-text-muted">
                ({formatShare(segment.value, calc.totalPaid)})
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[14px] leading-relaxed text-text-dim dense:text-[12px]">
          {isNoCost ? (
            <>
              <strong className="font-medium text-green">No Cost EMI:</strong>{" "}
              the merchant's {formatCurrency(calc.discount)} discount cancels
              the {formatCurrency(calc.totalInterest)} interest, so your EMIs
              add up to the MRP of {formatCurrency(mrp)}. GST on that interest (
              {formatCurrency(calc.totalGST)}) is still yours to pay.
            </>
          ) : (
            <>
              <strong className="font-medium text-gold">Regular EMI:</strong>{" "}
              interest at {annualRate}% p.a. adds{" "}
              {formatCurrency(calc.totalInterest)}, and 18% GST on that interest
              adds {formatCurrency(calc.totalGST)}.
            </>
          )}
          {firstPeriodIsIrregular
            ? ` Month 1 covers ${calc.firstPeriodDays} days, so its interest is ${
                calc.firstPeriodDays > 30 ? "higher" : "lower"
              } than in a regular month.`
            : null}
        </p>
      </section>

      <section aria-labelledby="months-heading">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="section-label mb-0" id="months-heading">
            Month by month
          </h3>
          <p className="text-[13px] text-text-muted dense:text-[12px]">
            Statement debit = EMI + 18% GST on that month's interest
          </p>
        </div>

        {/* Phones: one compact card per month, folded by year when long */}
        <div className="@min-[44rem]:hidden">
          <YearGroups
            items={calc.schedule}
            renderItem={(row) => (
              <ScheduleMonthCard
                key={row.month}
                row={row}
                showPeriodDays={row.month === 1 && firstPeriodIsIrregular}
                standardEmi={calc.baseEMI}
              />
            )}
            summarize={summarizeYear}
          />
        </div>

        {/* Tablet and up: table */}
        <div className="hidden @min-[44rem]:block">
          <ScrollableTable label="Month-by-month schedule">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Opening balance</th>
                  <th scope="col">Interest</th>
                  <th scope="col">Principal</th>
                  <th scope="col">GST on interest</th>
                  <th className="text-green" scope="col">
                    Statement debit
                    <span className="block text-[11px] tracking-[0.02em] text-text-muted normal-case">
                      EMI + GST
                    </span>
                  </th>
                  <th scope="col">Closing balance</th>
                </tr>
              </thead>
              <tbody>
                {calc.schedule.map((row) => (
                  <tr key={row.month}>
                    <th className="font-normal text-text-muted" scope="row">
                      {row.month}
                      {row.month === 1 && firstPeriodIsIrregular ? (
                        <span className="block text-[11px] text-gold normal-case">
                          {row.periodDays} days
                        </span>
                      ) : null}
                    </th>
                    <td className="text-text">
                      {formatCurrency(row.openingBalance)}
                    </td>
                    <td className="text-gold">
                      {formatCurrency(row.interest)}
                    </td>
                    <td className="text-blue">
                      {formatCurrency(row.principalPaid)}
                    </td>
                    <td className="text-red">{formatCurrency(row.gst)}</td>
                    <td className="font-semibold text-green">
                      {formatCurrency(row.totalPaid)}
                    </td>
                    <td
                      className={
                        row.closingBalance < 1 ? "text-green" : "text-text"
                      }
                    >
                      {balanceLabel(row.closingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-t-gold">
                  <th className="font-semibold text-gold" scope="row">
                    Total
                  </th>
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
                  <td className="font-semibold text-green">
                    {formatCurrency(calc.totalPaid)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </ScrollableTable>
        </div>
      </section>
    </div>
  );
}
