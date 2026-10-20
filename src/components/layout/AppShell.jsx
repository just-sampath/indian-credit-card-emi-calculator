import { useRef } from "react";
import { Button } from "../ui/Button.jsx";

const TAB_KEYS = ["ArrowLeft", "ArrowRight", "Home", "End"];

export function AppShell({
  activeTab,
  children,
  hero,
  onTabChange,
  sidebar,
  tabs,
}) {
  const mainRef = useRef(null);
  const tabsAnchorRef = useRef(null);
  const tabRefs = useRef({});

  // A new tab should start at its own top, not inherit the previous tab's
  // scroll depth. Only scroll back if the user is already past the results.
  const revealPanelStart = () => {
    const main = mainRef.current;
    const anchor = tabsAnchorRef.current;
    if (!main || !anchor) {
      return;
    }
    const scrollsInside = window.getComputedStyle(main).overflowY !== "visible";
    const containerTop = scrollsInside ? main.getBoundingClientRect().top : 0;
    const offset = anchor.getBoundingClientRect().bottom - containerTop;
    if (offset >= 0) {
      return;
    }
    if (scrollsInside) {
      main.scrollTop += offset;
    } else {
      window.scrollTo(0, window.scrollY + offset);
    }
  };

  const selectTab = (tabId) => {
    if (tabId !== activeTab) {
      onTabChange(tabId);
      revealPanelStart();
    }
  };

  const handleTabKeyDown = (event, index) => {
    if (!TAB_KEYS.includes(event.key)) {
      return;
    }
    event.preventDefault();
    const lastIndex = tabs.length - 1;
    const nextIndex = {
      ArrowLeft: index === 0 ? lastIndex : index - 1,
      ArrowRight: index === lastIndex ? 0 : index + 1,
      Home: 0,
      End: lastIndex,
    }[event.key];
    const nextTab = tabs[nextIndex];
    selectTab(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  };

  return (
    <div className="shell:grid shell:min-h-0 shell:flex-1 shell:max-xl:grid-cols-[272px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] 3xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside
        aria-labelledby="inputs-heading"
        className="hidden min-h-0 overflow-y-auto overscroll-contain border-r border-border bg-surface-alt p-4 shell:block xl:p-5 shell:short:py-4 3xl:p-6"
      >
        <h2 className="sr-only" id="inputs-heading">
          Calculator inputs
        </h2>
        {sidebar}
      </aside>

      <main
        ref={mainRef}
        className="@container min-w-0 shell:min-h-0 shell:overflow-y-auto shell:overscroll-contain"
      >
        <div className="px-3 pt-3 sm:px-5 sm:pt-5 shell:short:pt-3 3xl:px-7">
          {hero}
        </div>

        <div ref={tabsAnchorRef} aria-hidden="true" className="h-3 sm:h-4" />

        <div className="sticky top-0 z-20 border-y border-border bg-surface-alt/95 px-3 py-2 backdrop-blur-sm sm:px-5 3xl:px-7 [@media(max-height:500px)]:py-1">
          <div
            aria-label="Result views"
            className="flex gap-1 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
          >
            {tabs.map((tab, index) => {
              const selected = activeTab === tab.id;
              return (
                <Button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[tab.id] = node;
                  }}
                  aria-controls={selected ? `panel-${tab.id}` : undefined}
                  aria-label={tab.label}
                  aria-selected={selected}
                  id={`tab-${tab.id}`}
                  onClick={() => selectTab(tab.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  role="tab"
                  selected={selected}
                  tabIndex={selected ? 0 : -1}
                  variant="tab"
                >
                  <span aria-hidden="true" className="@min-[36rem]:hidden">
                    {tab.shortLabel ?? tab.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden @min-[36rem]:inline"
                  >
                    {tab.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <div
          aria-labelledby={`tab-${activeTab}`}
          className="px-3 pt-4 pb-28 focus-visible:ring-2 focus-visible:ring-[color:rgba(212,160,23,0.4)] focus-visible:outline-none sm:px-5 sm:pt-5 shell:pb-8 3xl:px-7"
          id={`panel-${activeTab}`}
          role="tabpanel"
          tabIndex={0}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
