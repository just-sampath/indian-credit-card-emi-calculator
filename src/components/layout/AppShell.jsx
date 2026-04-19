import { Button } from "../ui/Button.jsx";

export function AppShell({ activeTab, children, onTabChange, sidebar, tabs }) {
  return (
    <div className="grid min-h-[calc(100vh-65px)] grid-cols-[300px_minmax(0,1fr)]">
      <div className="flex flex-col gap-5 border-r border-border bg-surface-alt p-5">
        {sidebar}
      </div>
      <div className="flex min-w-0 flex-col overflow-hidden">
        <div className="flex gap-1 border-b border-border bg-surface-alt px-5 py-3">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              aria-pressed={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              selected={activeTab === tab.id}
              variant="tab"
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}
