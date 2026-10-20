import { useRef } from "react";
import { cn } from "../../lib/cn.js";
import { roundMoney } from "../../lib/emi.js";
import {
  formatCurrency,
  formatCurrencyShort,
  formatGrouped,
} from "../../lib/format.js";
import { INPUT_LIMITS, maxPreclosureMonth } from "../../lib/inputLimits.js";
import { NumberInput } from "../controls/NumberInput.jsx";
import { Card } from "../ui/Card.jsx";
import { ScrollableTable } from "../ui/ScrollableTable.jsx";
import { YearGroups } from "../ui/YearGroups.jsx";

const monthsLabel = (count) => `${count} month${count === 1 ? "" : "s"}`;

function differenceTone(delta) {
  if (delta > 0.004) {
    return "text-red-soft";
  }
  if (delta < -0.004) {
    return "text-green";
  }
  return "text-text-muted";
}

function formatDifference(delta) {
  if (Math.abs(delta) < 0.005) {
    return "Same";
  }
  return `${delta > 0 ? "+" : "−"}${formatCurrency(Math.abs(delta))}`;
}

function StepButton({ children, disabled, label, onClick }) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-[20px] leading-none text-gold-soft transition-[background-color,transform] hover:border-border-strong focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:outline-none active:scale-[0.95] active:bg-surface-alt disabled:opacity-35 motion-reduce:active:scale-100"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

function summarizeClosingYear(rows) {
  const costs = rows.map((row) => row.totalCost);
  return (
    <>
      <span className="block">
        From {formatCurrencyShort(Math.min(...costs))}
      </span>
      <span className="block text-text-muted">
        to {formatCurrencyShort(Math.max(...costs))}
      </span>
    </>
  );
}

function SettingField({ children, hint, hintId, id, label }) {
  return (
    <div className="min-w-0">
      <label
        className="mb-1.5 block text-[13px] text-text dense:text-[12px]"
        htmlFor={id}
      >
        {label}
      </label>
      {children}
      <p className="field-hint" id={hintId}>
        {hint}
      </p>
    </div>
  );
}

export function PreclosureTab({
  calc,
  isNoCost,
  merchantClawback,
  mrp,
  onMerchantClawbackChange,
  onPreclosureFeeRateChange,
  onPreclosureInterestMonthsChange,
  onPreclosureMonthChange,
  preclosureFeeRate,
  preclosureInterestMonths,
  preclosureMonth,
  tenure,
}) {
  const resultRef = useRef(null);

  if (tenure < 2) {
    return (
      <div>
        <h2 className="sr-only">Pre-closure simulator</h2>
        <Card className="text-[13px] leading-relaxed text-text-dim">
          A 1-month EMI is repaid in a single statement, so there is nothing to
          pre-close. Pick a tenure of 2 months or more to compare closing early.
        </Card>
      </div>
    );
  }

  const maxMonth = maxPreclosureMonth(tenure);
  const preclosure = calc.preclosure;
  const chargesSummary = [
    `${preclosureFeeRate}% fee`,
    `${monthsLabel(preclosureInterestMonths)} of interest`,
    isNoCost
      ? merchantClawback > 0
        ? `${formatCurrencyShort(merchantClawback)} clawback`
        : "no clawback"
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const rows = calc.preclosureRows.filter((row) => row.month <= maxMonth);
  const delta = roundMoney(preclosure.totalCost - calc.grandTotal);
  const showClawbackColumn = isNoCost && merchantClawback > 0;

  const breakdown = [
    [
      preclosure.month === 1
        ? "EMI paid for month 1 (incl. GST)"
        : `EMIs paid for months 1 to ${preclosure.month} (incl. GST)`,
      preclosure.paidSoFar,
    ],
    ["Outstanding principal", preclosure.outstandingPrincipal],
    [`Pre-closure fee (${preclosureFeeRate}%)`, preclosure.preclosureFee],
    ["GST on pre-closure fee", preclosure.preclosureFeeGst],
    [
      `Interest for ${monthsLabel(preclosureInterestMonths)}`,
      preclosure.preclosureInterest,
    ],
    ["GST on that interest", preclosure.preclosureInterestGst],
    ["Processing fee + GST (not refunded)", calc.processingFeeTotal],
    isNoCost && preclosure.merchantClawback > 0
      ? ["Merchant clawback", preclosure.merchantClawback]
      : null,
  ].filter(Boolean);

  // Picking a month from the comparison list far down the page should show
  // its result, which sits near the top of the tab.
  const selectAndReveal = (month) => {
    onPreclosureMonthChange(month);
    const result = resultRef.current;
    if (!result || typeof result.scrollIntoView !== "function") {
      return;
    }
    const tabs = document.querySelector('[role="tablist"]')?.parentElement;
    const tabsBottom = tabs ? tabs.getBoundingClientRect().bottom : 0;
    const { top } = result.getBoundingClientRect();
    if (top < tabsBottom || top > window.innerHeight * 0.6) {
      const reduceMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      result.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 @min-[70rem]:grid @min-[70rem]:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)] @min-[70rem]:items-start @min-[70rem]:gap-6">
      <h2 className="sr-only">Pre-closure simulator</h2>

      {/* Its own container: on wide screens this becomes a narrow left column,
          so its inner grids follow the column, not the whole page. Where it
          is wide (tablet landscape, 1280px laptops) setup and result sit side
          by side so the answer is visible without scrolling. */}
      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @min-[48rem]:grid-cols-2 @min-[48rem]:items-start">
          <section
            aria-labelledby="pc-scenario-heading"
            className="@container rounded-[10px] border border-border bg-surface p-4 sm:p-5"
          >
            <h3 className="section-label" id="pc-scenario-heading">
              Close the loan early
            </h3>

            <label
              className="block text-[14px] text-text dense:text-[12px]"
              htmlFor="input-preclosure-month"
            >
              Close the loan after month
            </label>
            <div className="mt-2 flex items-center gap-2">
              <StepButton
                disabled={preclosureMonth <= 1}
                label="Previous month"
                onClick={() => onPreclosureMonthChange(preclosureMonth - 1)}
              >
                −
              </StepButton>
              <NumberInput
                className="w-20 shrink-0"
                formatBound={(value) => `month ${value}`}
                id="input-preclosure-month"
                integer
                max={maxMonth}
                min={1}
                onValueChange={onPreclosureMonthChange}
                value={preclosureMonth}
              />
              <StepButton
                disabled={preclosureMonth >= maxMonth}
                label="Next month"
                onClick={() => onPreclosureMonthChange(preclosureMonth + 1)}
              >
                +
              </StepButton>
              <span className="shrink-0 text-[13px] text-text-muted dense:text-[12px]">
                of {tenure}
              </span>
            </div>
            <input
              aria-label="Pre-closure month slider"
              aria-valuetext={`Month ${preclosureMonth} of ${tenure}`}
              className="range-input mt-2"
              max={maxMonth}
              min={1}
              onChange={(event) =>
                onPreclosureMonthChange(Number(event.target.value))
              }
              step={1}
              type="range"
              value={preclosureMonth}
            />

            <details className="group mt-3 rounded-lg border border-border bg-surface-alt/60">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] active:bg-surface [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  <span className="block text-[14px] text-text dense:text-[12px]">
                    Pre-closure charges
                  </span>
                  <span className="block text-[13px] text-text-muted dense:text-[12px]">
                    {chargesSummary}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-[12px] text-gold transition-transform group-open:rotate-180"
                >
                  ▾
                </span>
              </summary>
              <div
                className={cn(
                  "grid grid-cols-1 gap-4 border-t border-border px-3 pt-4 pb-3",
                  "@min-[26rem]:grid-cols-2"
                )}
              >
                <SettingField
                  hint="Charged on the outstanding principal, usually 1 to 3%."
                  hintId="pc-fee-hint"
                  id="input-pc-fee"
                  label="Pre-closure fee (%)"
                >
                  <NumberInput
                    describedBy="pc-fee-hint"
                    formatBound={(value) => `${value}%`}
                    id="input-pc-fee"
                    max={INPUT_LIMITS.preclosureFeeRate.max}
                    min={INPUT_LIMITS.preclosureFeeRate.min}
                    onValueChange={onPreclosureFeeRateChange}
                    step={0.5}
                    suffix="%"
                    value={preclosureFeeRate}
                  />
                </SettingField>
                <SettingField
                  hint="Interest the bank bills for the current cycle. Often 1 month."
                  hintId="pc-interest-hint"
                  id="input-pc-interest-months"
                  label="Extra interest (months)"
                >
                  <NumberInput
                    describedBy="pc-interest-hint"
                    formatBound={monthsLabel}
                    id="input-pc-interest-months"
                    max={INPUT_LIMITS.preclosureInterestMonths.max}
                    min={INPUT_LIMITS.preclosureInterestMonths.min}
                    onValueChange={onPreclosureInterestMonthsChange}
                    step={0.25}
                    suffix="months"
                    value={preclosureInterestMonths}
                  />
                </SettingField>
                {isNoCost ? (
                  <SettingField
                    hint="Discount the merchant takes back, if any."
                    hintId="pc-clawback-hint"
                    id="input-pc-clawback"
                    label="Merchant clawback (₹)"
                  >
                    <NumberInput
                      describedBy="pc-clawback-hint"
                      format={formatGrouped}
                      formatBound={formatCurrencyShort}
                      id="input-pc-clawback"
                      max={mrp}
                      min={0}
                      onValueChange={onMerchantClawbackChange}
                      prefix="₹"
                      value={merchantClawback}
                    />
                  </SettingField>
                ) : null}
              </div>
            </details>
          </section>

          <section
            ref={resultRef}
            aria-labelledby="pc-result-heading"
            className="grid scroll-mt-20 grid-cols-1 gap-3"
          >
            <Card
              className="flex flex-col justify-center px-4 py-4 sm:px-5 sm:py-5"
              tone="gold"
            >
              <h3
                className="text-[11px] tracking-[0.08em] text-gold uppercase"
                id="pc-result-heading"
              >
                Total cost if you close after month {preclosure.month}
              </h3>
              <div className="highlight-value mt-2 text-[26px] leading-tight text-gold-soft sm:text-[32px]">
                {formatCurrency(preclosure.totalCost)}
              </div>
              <p
                className={cn(
                  "mt-2 text-[14px] font-medium",
                  differenceTone(delta)
                )}
              >
                {Math.abs(delta) < 0.005
                  ? "Same as paying the full tenure"
                  : `${formatCurrency(Math.abs(delta))} ${
                      delta > 0 ? "more" : "less"
                    } than paying the full tenure`}
              </p>
              <p className="mt-1 text-[13px] text-text-muted dense:text-[12px]">
                Full tenure costs {formatCurrency(calc.grandTotal)}
              </p>
            </Card>

            <Card className="px-4 py-4 sm:px-5">
              <h3 className="section-label">How that total adds up</h3>
              <dl className="text-[13px] dense:text-[12px]">
                {breakdown.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-3 border-b border-[#141b26] py-1.5"
                  >
                    <dt className="text-text-muted">{label}</dt>
                    <dd className="shrink-0 text-text tabular-nums">
                      {formatCurrency(value)}
                    </dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-3 pt-2">
                  <dt className="font-medium text-gold">Total</dt>
                  <dd className="shrink-0 font-semibold text-gold-soft tabular-nums">
                    {formatCurrency(preclosure.totalCost)}
                  </dd>
                </div>
              </dl>
            </Card>
          </section>
        </div>
      </div>

      <section aria-labelledby="pc-compare-heading">
        <h3 className="section-label" id="pc-compare-heading">
          Compare closing months
        </h3>

        {/* Phones: compact tappable cards, folded by year when long */}
        <div className="flex flex-col gap-2 @min-[44rem]:hidden">
          <YearGroups
            items={rows}
            renderItem={(row) => {
              const isActive = row.month === preclosureMonth;
              const rowDelta = roundMoney(row.totalCost - calc.grandTotal);
              return (
                <li key={row.month}>
                  <button
                    aria-pressed={isActive}
                    className={cn(
                      "w-full rounded-[10px] border px-3.5 py-2.5 text-left transition-[background-color,border-color,transform] focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] focus-visible:outline-none active:scale-[0.99] motion-reduce:active:scale-100",
                      isActive
                        ? "border-gold [background:linear-gradient(135deg,#0f1318_0%,#1a150a_100%)]"
                        : "border-border bg-surface active:border-border-strong"
                    )}
                    onClick={() => selectAndReveal(row.month)}
                    type="button"
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[14px] font-medium text-gold">
                        After month {row.month}
                        {isActive ? (
                          <span className="ml-2 rounded-sm bg-[color:rgba(212,160,23,0.15)] px-1.5 py-0.5 text-[11px] font-normal">
                            Selected
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "highlight-value text-[16px]",
                          isActive ? "text-gold-soft" : "text-text"
                        )}
                      >
                        {formatCurrency(row.totalCost)}
                      </span>
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[13px]">
                      <span className="text-text-muted">
                        Owed{" "}
                        <span className="text-red-soft tabular-nums">
                          {formatCurrency(row.outstandingPrincipal)}
                        </span>
                      </span>
                      <span className={differenceTone(rowDelta)}>
                        {formatDifference(rowDelta)}{" "}
                        <span className="text-text-muted">vs full tenure</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            }}
            summarize={summarizeClosingYear}
          />
          <div className="rounded-[10px] border border-border bg-surface-alt px-3.5 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[14px] font-medium text-text">
                Full tenure (no pre-closure)
              </span>
              <span className="highlight-value text-[16px] text-text">
                {formatCurrency(calc.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Tablet and up: table */}
        <div className="hidden @min-[44rem]:block">
          <ScrollableTable label="Pre-closure cost by month">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">After month</th>
                  <th scope="col">Paid so far</th>
                  <th scope="col">Outstanding principal</th>
                  <th scope="col">Fee + GST</th>
                  <th scope="col">Interest + GST</th>
                  {showClawbackColumn ? <th scope="col">Clawback</th> : null}
                  <th scope="col">Total cost</th>
                  <th scope="col">vs full tenure</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isActive = row.month === preclosureMonth;
                  const rowDelta = roundMoney(row.totalCost - calc.grandTotal);
                  const select = () => selectAndReveal(row.month);
                  return (
                    <tr
                      key={row.month}
                      aria-current={isActive ? "true" : undefined}
                      className={cn("cursor-pointer", isActive && "pc-row")}
                      onClick={select}
                    >
                      <th scope="row">
                        <button
                          aria-pressed={isActive}
                          className={cn(
                            "inline-flex min-h-8 items-center gap-2 rounded px-1 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]",
                            isActive ? "font-medium text-gold" : "text-text-dim"
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            select();
                          }}
                          type="button"
                        >
                          {row.month}
                          {isActive ? <span aria-hidden="true">✓</span> : null}
                          <span className="sr-only">
                            {` Select pre-closure at month ${row.month}`}
                          </span>
                        </button>
                      </th>
                      <td className="text-text">
                        {formatCurrency(row.paidSoFar)}
                      </td>
                      <td className="text-red-soft">
                        {formatCurrency(row.outstandingPrincipal)}
                      </td>
                      <td>
                        {formatCurrency(
                          row.preclosureFee + row.preclosureFeeGst
                        )}
                      </td>
                      <td>
                        {formatCurrency(
                          row.preclosureInterest + row.preclosureInterestGst
                        )}
                      </td>
                      {showClawbackColumn ? (
                        <td>{formatCurrency(row.merchantClawback)}</td>
                      ) : null}
                      <td
                        className={
                          isActive
                            ? "font-semibold text-gold-soft"
                            : "text-text"
                        }
                      >
                        {formatCurrency(row.totalCost)}
                      </td>
                      <td className={differenceTone(rowDelta)}>
                        {formatDifference(rowDelta)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-t-border">
                  <th className="whitespace-normal text-text" scope="row">
                    Full tenure
                  </th>
                  <td className="text-text">
                    {formatCurrency(calc.totalPaid)}
                  </td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  {showClawbackColumn ? <td>—</td> : null}
                  <td className="font-semibold text-text">
                    {formatCurrency(calc.grandTotal)}
                  </td>
                  <td className="text-text-muted">—</td>
                </tr>
              </tfoot>
            </table>
          </ScrollableTable>
        </div>

        <p className="mt-3 text-[14px] leading-relaxed text-text-muted dense:text-[12px]">
          Totals include the processing fee, which is never refunded.
          Pre-closure charges vary by card issuer, so check your card's terms.
        </p>
      </section>
    </div>
  );
}
