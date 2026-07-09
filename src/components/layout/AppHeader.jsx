import { Badge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";

export function AppHeader({ inputsOpen, onInputsClick }) {
  return (
    <header className="shrink-0 border-b border-border bg-surface px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:py-4">
      <div className="flex items-start gap-3 sm:items-center">
        <div className="mt-0.5 h-8 w-2 shrink-0 rounded-xs bg-gold sm:mt-0" />
        <div className="min-w-0 flex-1">
          <div className="display-font text-[16px] font-extrabold tracking-[0.02em] text-gold-soft sm:text-[18px]">
            Credit Card EMI Calculator
          </div>
          <div className="mt-0.5 hidden text-[11px] text-text-muted sm:block">
            Reducing-balance · GST on interest · No Cost EMI · Pre-closure
            analysis
          </div>
          <div className="mt-0.5 text-[10px] text-text-muted sm:hidden">
            Reducing-balance · GST · No Cost EMI
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <Badge tone="gold">RBI Compliant</Badge>
          </div>
          <Button
            aria-controls="inputs-drawer"
            aria-expanded={inputsOpen}
            className="lg:hidden"
            onClick={onInputsClick}
            selected
            variant="tenure"
          >
            Inputs
          </Button>
        </div>
      </div>
    </header>
  );
}
