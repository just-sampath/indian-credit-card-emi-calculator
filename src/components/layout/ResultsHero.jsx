import { cn } from "../../lib/cn.js";
import {
  formatAnnualRate,
  formatCurrency,
  formatShare,
} from "../../lib/format.js";
import { monthlyPaymentSummary } from "../../lib/results.js";

const TONES = {
  gold: {
    card: "border-gold [background:linear-gradient(135deg,#0f1318_0%,#1a150a_100%)]",
    label: "text-gold",
    value: "text-gold-soft",
  },
  red: {
    card: "border-[color:rgba(239,68,68,0.35)] [background:linear-gradient(135deg,#0f1318_0%,#1a0a0a_100%)]",
    label: "text-red-soft",
    value: "text-red-soft",
  },
  default: {
    card: "border-border bg-surface",
    label: "text-text-muted",
    value: "text-text",
  },
};

// Each card spans three rows of the parent grid (label / value / details) via
// subgrid, so values line up across a row even when one label wraps.
// The second detail line only shows where there is room both across (four
// cards in a row) and down (not a short laptop or tablet-landscape screen).
const EXTRA_DETAIL = "hidden @min-[48rem]:tall:block";

function Metric({ details, label, primary = false, tone = "default", value }) {
  const styles = TONES[tone];
  return (
    <div
      className={cn(
        "row-span-3 grid min-w-0 grid-rows-subgrid gap-y-1 rounded-[10px] border px-3 py-2.5 sm:px-4 sm:py-3 3xl:px-5 3xl:py-4",
        styles.card
      )}
    >
      <div
        className={cn(
          "self-end text-[11px] leading-tight tracking-[0.08em] uppercase 3xl:text-[12px]",
          styles.label
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "highlight-value self-end leading-tight [overflow-wrap:anywhere]",
          primary
            ? "text-[18px] min-[380px]:text-[21px] @min-[56rem]:text-[26px] @min-[90rem]:text-[30px]"
            : "text-[15px] min-[380px]:text-[16px] @min-[30rem]:text-[18px] @min-[56rem]:text-[21px] @min-[90rem]:text-[24px]",
          styles.value
        )}
      >
        {value}
      </div>
      <div className="flex flex-col gap-0.5 text-[12px] leading-snug text-text-muted 3xl:text-[13px]">
        {details.filter(Boolean).map((detail, index) => (
          <div key={detail} className={index > 0 ? EXTRA_DETAIL : undefined}>
            {detail}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResultsHero({ annualRate, calc, isNoCost, mrp, tenure }) {
  const { first, last, varies } = monthlyPaymentSummary(calc);
  const months = `${tenure} month${tenure === 1 ? "" : "s"}`;

  return (
    <section aria-labelledby="results-heading">
      <h2 className="sr-only" id="results-heading">
        Results
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 @min-[48rem]:grid-cols-4 3xl:gap-4">
        <Metric
          details={[
            `EMI ${formatCurrency(calc.baseEMI)} + GST`,
            varies
              ? `Month ${tenure}: ${formatCurrency(last.totalPaid)}`
              : null,
          ]}
          label={tenure === 1 ? "You pay (1 EMI)" : "You pay per month"}
          primary
          tone="gold"
          value={formatCurrency(first.totalPaid)}
        />
        <Metric
          details={[
            `${formatShare(calc.extraCostAboveMRP, mrp, 2)} of MRP`,
            isNoCost ? "GST on interest + fees" : "Interest, GST + fees",
          ]}
          label="Extra over MRP"
          tone="red"
          value={formatCurrency(calc.extraCostAboveMRP)}
        />
        <Metric
          details={[`Over ${months}`, "Incl. processing fee + GST"]}
          label="Total you pay"
          value={formatCurrency(calc.grandTotal)}
        />
        <Metric
          details={[
            "Incl. GST and fees",
            isNoCost
              ? 'What "No Cost" really costs'
              : `vs ${annualRate}% quoted`,
          ]}
          label="Effective annual cost"
          value={formatAnnualRate(calc.effectiveAnnualRate)}
        />
      </div>
    </section>
  );
}

/** Compact two-figure readout shown inside the mobile inputs drawer. */
export function LiveResultsStrip({ calc }) {
  const { first } = monthlyPaymentSummary(calc);
  return (
    <div
      aria-live="polite"
      className="grid grid-cols-2 gap-2 border-b border-border bg-surface px-4 py-2.5"
    >
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.08em] text-gold">
          Per month
        </div>
        <div className="highlight-value mt-0.5 truncate text-[16px] text-gold-soft">
          {formatCurrency(first.totalPaid)}
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.08em] text-red-soft">
          Extra over MRP
        </div>
        <div className="highlight-value mt-0.5 truncate text-[16px] text-red-soft">
          {formatCurrency(calc.extraCostAboveMRP)}
        </div>
      </div>
    </div>
  );
}
