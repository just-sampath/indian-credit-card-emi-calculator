import { cn } from "../../lib/cn.js";
import { DAY_COUNT_ACTUAL365, calculateEmiScenario } from "../../lib/emi.js";
import {
  formatAnnualRate,
  formatCurrency,
  formatShare,
} from "../../lib/format.js";
import { describeDifference } from "../../lib/results.js";
import { Card } from "../ui/Card.jsx";
import { ScrollableTable } from "../ui/ScrollableTable.jsx";
import { ShareScenario } from "../ui/ShareScenario.jsx";

const MONEY = "money";
const RATE = "rate";

function formatMetric(value, format) {
  return format === RATE ? formatAnnualRate(value) : formatCurrency(value);
}

function DetailRow({ label, note, sign, strong = false, tone, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#141b26] py-2 text-[13px] last:border-b-0 dense:text-[12px]">
      <dt className="min-w-0 text-text-muted">
        {sign ? (
          <span
            aria-hidden="true"
            className="mr-2 inline-block w-3 text-text-dim"
          >
            {sign}
          </span>
        ) : null}
        <span className={strong ? "font-medium text-text" : undefined}>
          {label}
        </span>
        {note ? (
          <span className="block pl-5 text-[11px] text-text-muted">{note}</span>
        ) : null}
      </dt>
      <dd
        className={cn(
          "shrink-0 text-right tabular-nums",
          strong ? "font-semibold" : "font-medium",
          tone ?? "text-text"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function SummaryTab({
  annualRate,
  calc,
  dayCountConvention,
  firstPeriodDays,
  isNoCost,
  mrp,
  procFee,
  tenure,
}) {
  const shared = {
    mrp,
    annualRate,
    tenure,
    procFee,
    firstPeriodDays,
    dayCountConvention,
  };
  const noCostCalc = calculateEmiScenario({ ...shared, isNoCost: true });
  const regularCalc = calculateEmiScenario({ ...shared, isNoCost: false });
  const isActual365 = dayCountConvention === DAY_COUNT_ACTUAL365;

  const breakdownRows = [
    { label: "Product MRP", value: formatCurrency(mrp) },
    {
      label: "Interest",
      sign: "+",
      tone: "text-gold",
      value: formatCurrency(calc.totalInterest),
    },
    isNoCost
      ? {
          label: "Merchant discount",
          note: "Cancels the interest above",
          sign: "−",
          tone: "text-green",
          value: `−${formatCurrency(calc.discount)}`,
        }
      : null,
    {
      label: "GST on interest (18%)",
      sign: "+",
      tone: "text-red",
      value: formatCurrency(calc.totalGST),
    },
    {
      label: "Processing fee incl. GST",
      note: `${formatCurrency(calc.processingFee)} + ${formatCurrency(
        calc.processingFeeGst
      )} GST`,
      sign: "+",
      value: formatCurrency(calc.processingFeeTotal),
    },
    {
      label: "Total you pay",
      sign: "=",
      strong: true,
      tone: "text-gold-soft",
      value: formatCurrency(calc.grandTotal),
    },
    {
      label: "Extra over MRP",
      note: `${formatShare(calc.extraCostAboveMRP, mrp, 2)} of MRP`,
      tone: "text-red-soft",
      value: formatCurrency(calc.extraCostAboveMRP),
    },
  ].filter(Boolean);

  const loanRows = [
    { label: "Product MRP", value: formatCurrency(mrp) },
    isNoCost
      ? {
          label: "Merchant discount",
          tone: "text-green",
          value: `−${formatCurrency(calc.discount)}`,
        }
      : null,
    { label: "Charged to your card", value: formatCurrency(calc.principal) },
    { label: "Interest rate", value: `${annualRate}% p.a.` },
    { label: "Tenure", value: `${tenure} month${tenure === 1 ? "" : "s"}` },
    {
      label: "First EMI due",
      value: `${firstPeriodDays} days after purchase`,
    },
    {
      label: "Month-1 interest basis",
      value: isActual365 ? "Actual/365" : "30-day month",
    },
    { label: "EMI before GST", value: formatCurrency(calc.baseEMI) },
  ].filter(Boolean);

  const comparisonRows = [
    {
      label: "Charged to your card",
      better: "lower",
      format: MONEY,
      noCost: noCostCalc.principal,
      regular: regularCalc.principal,
    },
    {
      label: "Merchant discount",
      better: "higher",
      format: MONEY,
      noCost: noCostCalc.discount,
      regular: regularCalc.discount,
    },
    {
      label: "EMI before GST",
      better: "lower",
      format: MONEY,
      noCost: noCostCalc.baseEMI,
      regular: regularCalc.baseEMI,
    },
    {
      label: "Total interest",
      better: "lower",
      format: MONEY,
      noCost: noCostCalc.totalInterest,
      regular: regularCalc.totalInterest,
    },
    {
      label: "GST on interest",
      better: "lower",
      format: MONEY,
      noCost: noCostCalc.totalGST,
      regular: regularCalc.totalGST,
    },
    {
      label: "Extra over MRP",
      better: "lower",
      format: MONEY,
      noCost: noCostCalc.extraCostAboveMRP,
      regular: regularCalc.extraCostAboveMRP,
      strong: true,
    },
    {
      label: "Effective annual cost",
      better: "lower",
      format: RATE,
      noCost: noCostCalc.effectiveAnnualRate,
      regular: regularCalc.effectiveAnnualRate,
      strong: true,
    },
  ];

  const pick = (
    <span className="ml-1.5 rounded-sm bg-[color:rgba(212,160,23,0.15)] px-1.5 py-0.5 text-[11px] tracking-normal text-gold normal-case">
      Your pick
    </span>
  );

  return (
    <div className="flex flex-col gap-5">
      <h2 className="sr-only">Full summary</h2>

      <ShareScenario />

      {/* Wide screens: breakdown and loan details on the left, comparison on
          the right. Each column is its own container so its inner layout
          follows the column width. */}
      <div className="flex flex-col gap-5 @min-[72rem]:grid @min-[72rem]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] @min-[72rem]:items-start">
        <div className="@container">
          <div className="grid grid-cols-1 gap-4 @min-[48rem]:grid-cols-2">
            <Card
              as="section"
              aria-labelledby="breakdown-heading"
              className="px-4 py-4 sm:px-5"
            >
              <h3 className="section-label" id="breakdown-heading">
                Cost breakdown
              </h3>
              <dl>
                {breakdownRows.map((row) => (
                  <DetailRow key={row.label} {...row} />
                ))}
              </dl>
            </Card>

            <Card
              as="section"
              aria-labelledby="loan-heading"
              className="px-4 py-4 sm:px-5"
            >
              <h3 className="section-label" id="loan-heading">
                Loan details
              </h3>
              <dl>
                {loanRows.map((row) => (
                  <DetailRow key={row.label} {...row} />
                ))}
              </dl>
            </Card>
          </div>
        </div>

        <div className="@container flex flex-col gap-5">
          <Card
            as="section"
            aria-labelledby="compare-heading"
            className="px-4 py-4 sm:px-5"
          >
            <h3 className="section-label" id="compare-heading">
              No Cost EMI vs Regular EMI
            </h3>
            <p className="mb-3 text-[14px] leading-relaxed text-text-muted dense:text-[12px]">
              Both columns use the same MRP, rate, tenure and fees. Green means
              No Cost EMI is better for you on that line.
            </p>

            {/* Phones: column names once, then one compact block per metric */}
            <div className="@min-[40rem]:hidden">
              <div
                aria-hidden="true"
                className="grid grid-cols-2 gap-2 border-b border-border pb-2 text-[12px]"
              >
                <span className="text-green">
                  No Cost EMI{isNoCost ? " (your pick)" : ""}
                </span>
                <span className="text-gold">
                  Regular EMI{isNoCost ? "" : " (your pick)"}
                </span>
              </div>
              <dl className="flex flex-col">
                {comparisonRows.map((row) => {
                  const difference = describeDifference(row);
                  return (
                    <div
                      key={row.label}
                      className="border-b border-[#141b26] py-2.5 text-[13px] last:border-b-0"
                    >
                      <dt
                        className={cn(
                          row.strong ? "font-medium text-text" : "text-text-dim"
                        )}
                      >
                        {row.label}
                      </dt>
                      <dd className="mt-1 grid grid-cols-2 gap-2 tabular-nums text-text">
                        <span className="min-w-0 truncate">
                          <span className="sr-only">No Cost EMI: </span>
                          {formatMetric(row.noCost, row.format)}
                        </span>
                        <span className="min-w-0 truncate">
                          <span className="sr-only">Regular EMI: </span>
                          {formatMetric(row.regular, row.format)}
                        </span>
                      </dd>
                      <dd className={cn("mt-1", difference.tone)}>
                        No Cost is {difference.text.toLowerCase()}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>

            {/* Larger screens: table */}
            <div className="hidden @min-[40rem]:block">
              <ScrollableTable label="No Cost versus Regular EMI">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Metric</th>
                      <th className="text-green" scope="col">
                        No Cost EMI{isNoCost ? pick : null}
                      </th>
                      <th scope="col">Regular EMI{isNoCost ? null : pick}</th>
                      <th scope="col">No Cost EMI is</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => {
                      const difference = describeDifference(row);
                      return (
                        <tr key={row.label}>
                          <th
                            className={
                              row.strong
                                ? "font-medium text-text"
                                : "text-text-dim"
                            }
                            scope="row"
                          >
                            {row.label}
                          </th>
                          <td className="text-text">
                            {formatMetric(row.noCost, row.format)}
                          </td>
                          <td className="text-text">
                            {formatMetric(row.regular, row.format)}
                          </td>
                          <td className={difference.tone}>{difference.text}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollableTable>
            </div>
          </Card>

          <details className="group rounded-[10px] border border-border bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[10px] px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] sm:px-5 [&::-webkit-details-marker]:hidden">
              <h3 className="section-label mb-0">How this is calculated</h3>
              <span
                aria-hidden="true"
                className="text-[12px] text-gold transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <dl className="flex flex-col gap-3 border-t border-border px-4 py-4 text-[14px] leading-relaxed sm:px-5 dense:text-[12px]">
              {[
                [
                  "Reducing balance",
                  `Each month's interest is the outstanding balance × ${annualRate}% ÷ 12. The rest of the EMI repays principal.`,
                ],
                [
                  "EMI",
                  "EMI = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1). P is the amount charged to your card, r is the monthly rate and n is the number of months.",
                ],
                [
                  "First month",
                  `Month 1 charges interest for the ${firstPeriodDays} days between purchase and the first due date: ${
                    isActual365
                      ? "P × rate% × days ÷ 365"
                      : "P × (rate ÷ 1200) × (days ÷ 30)"
                  }. Later months charge a full month.`,
                ],
                [
                  "GST",
                  "GST of 18% applies to each month's billed interest, the processing fee and any pre-closure charges.",
                ],
                [
                  "No Cost EMI",
                  "The bank still charges interest. The merchant cuts the price by exactly that amount, so your EMIs add up to the MRP. You still pay the GST on that interest and the processing fee.",
                ],
                [
                  "Pre-closure",
                  "To close early, you pay the outstanding principal, the pre-closure fee and its GST, interest for the current cycle and its GST, and any merchant clawback. The processing fee is not refunded.",
                ],
                [
                  "Effective annual cost",
                  "This is the yearly rate at which everything you pay, including GST and fees, is worth the MRP on the day you buy. Like a bank's quoted rate, it is the monthly rate × 12.",
                ],
              ].map(([term, explanation]) => (
                <div key={term}>
                  <dt className="text-text">{term}</dt>
                  <dd className="mt-0.5 text-text-dim">{explanation}</dd>
                </div>
              ))}
            </dl>
          </details>
        </div>
      </div>
    </div>
  );
}
