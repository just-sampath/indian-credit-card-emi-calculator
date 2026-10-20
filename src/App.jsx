import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "./components/layout/AppHeader.jsx";
import { AppShell } from "./components/layout/AppShell.jsx";
import { InputsSummaryBar } from "./components/layout/InputsSummaryBar.jsx";
import { MobileDrawer } from "./components/layout/MobileDrawer.jsx";
import {
  LiveResultsStrip,
  ResultsHero,
} from "./components/layout/ResultsHero.jsx";
import { Sidebar } from "./components/layout/Sidebar.jsx";
import { PreclosureTab } from "./components/tabs/PreclosureTab.jsx";
import { ScheduleTab } from "./components/tabs/ScheduleTab.jsx";
import { SummaryTab } from "./components/tabs/SummaryTab.jsx";
import { calculateEmiScenario } from "./lib/emi.js";
import { maxPreclosureMonth } from "./lib/inputLimits.js";
import { parseState, serializeState } from "./lib/urlState.js";

/** Same query as the `shell` CSS variant: the inputs column replaces the drawer. */
const SHELL_MEDIA = "(min-width: 768px) and (min-height: 540px)";

function isDesktop() {
  return Boolean(window.matchMedia?.(SHELL_MEDIA).matches);
}

/** True when the current history entry is the one pushed for the drawer. */
function onDrawerEntry() {
  return window.history.state?.inputsDrawer === true;
}

function replaceQuery(query) {
  if (window.location.search !== query) {
    const { pathname, hash } = window.location;
    window.history.replaceState(
      window.history.state,
      "",
      `${pathname}${query}${hash}`
    );
  }
}

const TABS = [
  {
    id: "schedule",
    label: "Amortization Schedule",
    shortLabel: "Schedule",
  },
  {
    id: "preclosure",
    label: "Pre-closure Simulator",
    shortLabel: "Pre-close",
  },
  {
    id: "summary",
    label: "Full Summary",
    shortLabel: "Summary",
  },
];

export default function App() {
  // The URL is the source of truth on load, so reloads, discarded tabs and
  // shared links all reopen the same scenario.
  const [initial] = useState(() => parseState(window.location.search));
  const [mrp, setMrp] = useState(initial.mrp);
  const [annualRate, setAnnualRate] = useState(initial.annualRate);
  const [tenure, setTenure] = useState(initial.tenure);
  const [isNoCost, setIsNoCost] = useState(initial.isNoCost);
  const [procFee, setProcFee] = useState(initial.procFee);
  const [firstPeriodDays, setFirstPeriodDays] = useState(
    initial.firstPeriodDays
  );
  const [dayCountConvention, setDayCountConvention] = useState(
    initial.dayCountConvention
  );
  const [preclosureMonth, setPreclosureMonth] = useState(
    initial.preclosureMonth
  );
  const [preclosureFeeRate, setPreclosureFeeRate] = useState(
    initial.preclosureFeeRate
  );
  const [preclosureInterestMonths, setPreclosureInterestMonths] = useState(
    initial.preclosureInterestMonths
  );
  const [merchantClawback, setMerchantClawback] = useState(
    initial.merchantClawback
  );
  const [activeTab, setActiveTab] = useState(initial.activeTab);
  // Reopen the drawer if the page was reloaded while it was open.
  const [inputsOpen, setInputsOpen] = useState(
    () => onDrawerEntry() && !isDesktop()
  );

  // The drawer gets its own history entry so the phone's back gesture closes
  // it instead of leaving the site. Closing in-app pops that entry again.
  const openInputs = useCallback(() => {
    if (!onDrawerEntry()) {
      window.history.pushState(
        { ...window.history.state, inputsDrawer: true },
        ""
      );
    }
    setInputsOpen(true);
  }, []);

  const closeInputs = useCallback(() => {
    setInputsOpen(false);
    if (onDrawerEntry()) {
      window.history.back();
    }
  }, []);

  // Latest query string, read by the popstate handler below.
  const queryRef = useRef("");

  useEffect(() => {
    const syncWithHistory = () => {
      setInputsOpen(onDrawerEntry() && !isDesktop());
      // Going back lands on the entry from before the drawer opened, which
      // still carries the old inputs in its URL.
      replaceQuery(queryRef.current);
    };
    window.addEventListener("popstate", syncWithHistory);
    return () => window.removeEventListener("popstate", syncWithHistory);
  }, []);

  // Keep dependent inputs inside their new bounds instead of showing "5 of 3".
  const handleTenureChange = useCallback((nextTenure) => {
    setTenure(nextTenure);
    setPreclosureMonth((month) =>
      Math.min(month, maxPreclosureMonth(nextTenure))
    );
  }, []);

  const handleMrpChange = useCallback((nextMrp) => {
    setMrp(nextMrp);
    setMerchantClawback((clawback) => Math.min(clawback, nextMrp));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }
    const media = window.matchMedia(SHELL_MEDIA);
    const closeOnDesktop = () => {
      if (media.matches) {
        closeInputs();
      }
    };
    closeOnDesktop();
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, [closeInputs]);

  const effectivePreclosureMonth = Math.min(
    Math.max(1, preclosureMonth),
    maxPreclosureMonth(tenure)
  );

  const query = serializeState({
    mrp,
    annualRate,
    tenure,
    isNoCost,
    procFee,
    firstPeriodDays,
    dayCountConvention,
    preclosureMonth: effectivePreclosureMonth,
    preclosureFeeRate,
    preclosureInterestMonths,
    merchantClawback,
    activeTab,
  });

  // Mirror every change into the address bar without adding history entries.
  useEffect(() => {
    queryRef.current = query;
    replaceQuery(query);
  }, [query]);

  const calc = useMemo(
    () =>
      calculateEmiScenario({
        mrp,
        annualRate,
        tenure,
        isNoCost,
        procFee,
        preclosureMonth: effectivePreclosureMonth,
        preclosureFeeRate: preclosureFeeRate / 100,
        preclosureInterestMonths,
        merchantClawback,
        firstPeriodDays,
        dayCountConvention,
      }),
    [
      annualRate,
      dayCountConvention,
      effectivePreclosureMonth,
      firstPeriodDays,
      isNoCost,
      merchantClawback,
      mrp,
      preclosureFeeRate,
      preclosureInterestMonths,
      procFee,
      tenure,
    ]
  );

  // Single control tree: rail when drawer closed, drawer when open (never both).
  const sidebar = (
    <Sidebar
      annualRate={annualRate}
      dayCountConvention={dayCountConvention}
      firstPeriodDays={firstPeriodDays}
      isNoCost={isNoCost}
      mrp={mrp}
      onAnnualRateChange={setAnnualRate}
      onDayCountConventionChange={setDayCountConvention}
      onFirstPeriodDaysChange={setFirstPeriodDays}
      onIsNoCostChange={setIsNoCost}
      onMrpChange={handleMrpChange}
      onProcFeeChange={setProcFee}
      onTenureChange={handleTenureChange}
      procFee={procFee}
      tenure={tenure}
    />
  );

  let content = (
    <ScheduleTab
      annualRate={annualRate}
      calc={calc}
      isNoCost={isNoCost}
      mrp={mrp}
    />
  );

  if (activeTab === "preclosure") {
    content = (
      <PreclosureTab
        calc={calc}
        isNoCost={isNoCost}
        merchantClawback={merchantClawback}
        mrp={mrp}
        onMerchantClawbackChange={setMerchantClawback}
        onPreclosureFeeRateChange={setPreclosureFeeRate}
        onPreclosureInterestMonthsChange={setPreclosureInterestMonths}
        onPreclosureMonthChange={setPreclosureMonth}
        preclosureFeeRate={preclosureFeeRate}
        preclosureInterestMonths={preclosureInterestMonths}
        preclosureMonth={effectivePreclosureMonth}
        tenure={tenure}
      />
    );
  }

  if (activeTab === "summary") {
    content = (
      <SummaryTab
        annualRate={annualRate}
        calc={calc}
        dayCountConvention={dayCountConvention}
        firstPeriodDays={firstPeriodDays}
        isNoCost={isNoCost}
        mrp={mrp}
        procFee={procFee}
        tenure={tenure}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-bg text-text shell:flex shell:h-dvh shell:flex-col shell:overflow-hidden">
      <div
        aria-hidden={inputsOpen || undefined}
        className="shell:flex shell:min-h-0 shell:flex-1 shell:flex-col shell:overflow-hidden"
        // Hide background from AT + pointer/keyboard while drawer is open
        inert={inputsOpen || undefined}
      >
        <AppHeader />
        <AppShell
          activeTab={activeTab}
          hero={
            <ResultsHero
              annualRate={annualRate}
              calc={calc}
              isNoCost={isNoCost}
              mrp={mrp}
              tenure={tenure}
            />
          }
          onTabChange={setActiveTab}
          sidebar={inputsOpen ? null : sidebar}
          tabs={TABS}
        >
          {content}
        </AppShell>
        <InputsSummaryBar
          annualRate={annualRate}
          expanded={inputsOpen}
          isNoCost={isNoCost}
          mrp={mrp}
          onEdit={openInputs}
          procFee={procFee}
          tenure={tenure}
        />
      </div>

      <MobileDrawer
        open={inputsOpen}
        onClose={closeInputs}
        summary={<LiveResultsStrip calc={calc} />}
        title="Calculator inputs"
      >
        {sidebar}
      </MobileDrawer>
    </div>
  );
}
