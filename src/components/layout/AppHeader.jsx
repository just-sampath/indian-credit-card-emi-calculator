export function AppHeader() {
  return (
    <header className="shrink-0 border-b border-border bg-surface px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-6 sm:pb-4 shell:short:pt-2.5 shell:short:pb-2.5 3xl:px-7 [@media(max-height:500px)]:pb-2">
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="hidden h-10 w-1.5 shrink-0 rounded-xs bg-gold sm:block"
        />
        <div className="min-w-0">
          <h1 className="display-font text-[15px] leading-tight font-extrabold text-gold-soft sm:text-[19px] sm:tracking-[0.01em]">
            Credit Card EMI Calculator
          </h1>
          <p className="mt-0.5 text-[12px] leading-snug text-text-muted [@media(max-height:500px)]:hidden">
            The true cost of No Cost and regular EMIs
            <span className="hidden sm:inline">
              : interest, GST, fees and pre-closure
            </span>
          </p>
        </div>
      </div>
    </header>
  );
}
