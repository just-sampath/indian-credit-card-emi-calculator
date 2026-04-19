import { Badge } from "../ui/Badge.jsx";

export function AppHeader() {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-surface px-6 py-4">
      <div className="h-8 w-2 rounded-xs bg-gold" />
      <div>
        <div className="display-font text-[18px] font-extrabold tracking-[0.02em] text-gold-soft">
          Credit Card EMI Calculator
        </div>
        <div className="mt-0.5 text-[11px] text-text-muted">
          Reducing-balance · GST on interest · No Cost EMI · Pre-closure
          analysis
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Badge tone="gold">RBI Compliant</Badge>
      </div>
    </div>
  );
}
