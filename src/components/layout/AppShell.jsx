import { Button } from "../ui/Button.jsx";

export function AppShell({
  activeTab,
  children,
  keyMetrics,
  onTabChange,
  sidebar,
  tabs,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
      <aside className="hidden min-h-0 flex-col gap-5 overflow-y-auto overscroll-contain border-r border-border bg-surface-alt p-5 lg:flex">
        {sidebar}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {keyMetrics}

        <div className="shrink-0 border-b border-border bg-surface-alt px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="flex gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                aria-label={tab.label}
                aria-pressed={activeTab === tab.id}
                className="shrink-0"
                onClick={() => onTabChange(tab.id)}
                selected={activeTab === tab.id}
                variant="tab"
              >
                <span aria-hidden="true" className="sm:hidden">
                  {tab.shortLabel ?? tab.label}
                </span>
                <span aria-hidden="true" className="hidden sm:inline">
                  {tab.label}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-3 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
