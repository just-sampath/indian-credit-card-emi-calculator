import { formatCurrency } from "../../lib/format.js";

export function KeyMetricsBar({ calc, isNoCost }) {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-surface/95 px-3 py-2 backdrop-blur-sm lg:hidden">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface-alt px-3 py-2">
          <div className="text-[9px] uppercase tracking-[0.08em] text-gold">
            Base EMI
          </div>
          <div className="highlight-value mt-0.5 truncate text-[14px] text-gold-soft sm:text-[15px]">
            {formatCurrency(calc.baseEMI)}
          </div>
        </div>

        <div className="rounded-lg border border-[color:rgba(239,68,68,0.27)] bg-[linear-gradient(135deg,#0f1318_0%,#1a0a0a_100%)] px-3 py-2">
          <div className="text-[9px] uppercase tracking-[0.08em] text-red">
            Extra vs MRP
          </div>
          <div className="highlight-value mt-0.5 truncate text-[14px] text-[#fca5a5] sm:text-[15px]">
            {formatCurrency(calc.extraCostAboveMRP)}
          </div>
        </div>

        <div className="col-span-2 rounded-lg border border-border bg-surface-alt px-3 py-2 sm:col-span-1">
          <div className="text-[9px] uppercase tracking-[0.08em] text-text-muted">
            {isNoCost ? "Card principal" : "Statement EMIs"}
          </div>
          <div className="highlight-value mt-0.5 truncate text-[14px] text-text sm:text-[15px]">
            {formatCurrency(isNoCost ? calc.principal : calc.totalPaid)}
          </div>
        </div>
      </div>
    </div>
  );
}
