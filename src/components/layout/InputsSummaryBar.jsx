import { useId } from "react";
import { formatCurrencyShort } from "../../lib/format.js";

function SlidersIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

/**
 * Mobile/tablet: shows the scenario the results describe. The whole bar is one
 * button, so tapping the summary opens the inputs as readily as tapping Edit.
 */
export function InputsSummaryBar({
  annualRate,
  expanded,
  isNoCost,
  mrp,
  onEdit,
  procFee,
  tenure,
}) {
  const summaryId = useId();
  const months = `${tenure} month${tenure === 1 ? "" : "s"}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur-sm shell:hidden">
      <button
        aria-controls="inputs-drawer"
        aria-describedby={summaryId}
        aria-expanded={expanded}
        aria-haspopup="dialog"
        aria-label="Edit inputs"
        className="mx-auto flex w-full max-w-3xl items-center gap-3 pt-2.5 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(0.625rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] text-left transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:outline-none focus-visible:ring-inset active:bg-surface-alt [@media(max-height:500px)]:pt-1.5 [@media(max-height:500px)]:pb-[max(0.375rem,env(safe-area-inset-bottom))]"
        onClick={onEdit}
        type="button"
      >
        <span
          className="min-w-0 flex-1 text-[13px] leading-snug"
          id={summaryId}
        >
          <span className="block truncate text-text">
            {isNoCost ? "No Cost EMI" : "Regular EMI"} · {months}
            <span className="hidden [@media(max-height:500px)]:inline">
              {" "}
              · {formatCurrencyShort(mrp)} at {annualRate}%
            </span>
          </span>
          <span className="block text-text-muted [@media(max-height:500px)]:hidden">
            {formatCurrencyShort(mrp)} · {annualRate}% p.a. ·{" "}
            <span className="whitespace-nowrap">
              fee {formatCurrencyShort(procFee)}
            </span>
          </span>
        </span>
        <span
          aria-hidden="true"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md bg-gold px-4 text-[12px] font-semibold tracking-[0.08em] text-bg uppercase [@media(max-height:500px)]:min-h-10"
        >
          <SlidersIcon />
          Edit
        </span>
      </button>
    </div>
  );
}
