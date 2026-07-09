import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/layout/AppHeader.jsx";
import { AppShell } from "./components/layout/AppShell.jsx";
import { KeyMetricsBar } from "./components/layout/KeyMetricsBar.jsx";
import { MobileDrawer } from "./components/layout/MobileDrawer.jsx";
import { Sidebar } from "./components/layout/Sidebar.jsx";
import { PreclosureTab } from "./components/tabs/PreclosureTab.jsx";
import { ScheduleTab } from "./components/tabs/ScheduleTab.jsx";
import { SummaryTab } from "./components/tabs/SummaryTab.jsx";
import {
  DAY_COUNT_THIRTY,
  DEFAULT_FIRST_PERIOD_DAYS,
  calculateEmiScenario,
} from "./lib/emi.js";

/** Tailwind `lg` — close mobile-only drawer so body scroll/focus lock cannot stick. */
const DESKTOP_MEDIA = "(min-width: 1024px)";

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
  const [mrp, setMrp] = useState(107705);
  const [annualRate, setAnnualRate] = useState(17);
  const [tenure, setTenure] = useState(6);
  const [isNoCost, setIsNoCost] = useState(true);
  const [procFee, setProcFee] = useState(199);
  const [firstPeriodDays, setFirstPeriodDays] = useState(
    DEFAULT_FIRST_PERIOD_DAYS
  );
  const [dayCountConvention, setDayCountConvention] =
    useState(DAY_COUNT_THIRTY);
  const [preclosureMonth, setPreclosureMonth] = useState(3);
  const [preclosureFeeRate, setPreclosureFeeRate] = useState(3);
  const [preclosureInterestMonths, setPreclosureInterestMonths] = useState(1);
  const [merchantClawback, setMerchantClawback] = useState(0);
  const [activeTab, setActiveTab] = useState("schedule");
  const [inputsOpen, setInputsOpen] = useState(false);

  const closeInputs = useCallback(() => setInputsOpen(false), []);
  const toggleInputs = useCallback(
    () => setInputsOpen((open) => !open),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }
    const media = window.matchMedia(DESKTOP_MEDIA);
    const closeOnDesktop = () => {
      if (media.matches) {
        setInputsOpen(false);
      }
    };
    closeOnDesktop();
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  const calc = useMemo(
    () =>
      calculateEmiScenario({
        mrp,
        annualRate,
        tenure,
        isNoCost,
        procFee,
        preclosureMonth,
        preclosureFeeRate: preclosureFeeRate / 100,
        preclosureInterestMonths,
        merchantClawback,
        firstPeriodDays,
        dayCountConvention,
      }),
    [
      annualRate,
      dayCountConvention,
      firstPeriodDays,
      isNoCost,
      merchantClawback,
      mrp,
      preclosureFeeRate,
      preclosureInterestMonths,
      preclosureMonth,
      procFee,
      tenure,
    ]
  );

  // Single control tree: rail when drawer closed, drawer when open (never both).
  const sidebar = (
    <Sidebar
      annualRate={annualRate}
      calc={calc}
      dayCountConvention={dayCountConvention}
      firstPeriodDays={firstPeriodDays}
      isNoCost={isNoCost}
      mrp={mrp}
      onAnnualRateChange={setAnnualRate}
      onDayCountConventionChange={setDayCountConvention}
      onFirstPeriodDaysChange={setFirstPeriodDays}
      onIsNoCostChange={setIsNoCost}
      onMrpChange={setMrp}
      onProcFeeChange={setProcFee}
      onTenureChange={setTenure}
      procFee={procFee}
      tenure={tenure}
    />
  );

  let content = (
    <ScheduleTab calc={calc} isNoCost={isNoCost} mrp={mrp} tenure={tenure} />
  );

  if (activeTab === "preclosure") {
    content = (
      <PreclosureTab
        calc={calc}
        isNoCost={isNoCost}
        merchantClawback={merchantClawback}
        onMerchantClawbackChange={setMerchantClawback}
        onPreclosureFeeRateChange={setPreclosureFeeRate}
        onPreclosureInterestMonthsChange={setPreclosureInterestMonths}
        onPreclosureMonthChange={setPreclosureMonth}
        preclosureMonth={preclosureMonth}
        preclosureFeeRate={preclosureFeeRate}
        preclosureInterestMonths={preclosureInterestMonths}
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
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-bg text-text">
      <div
        aria-hidden={inputsOpen || undefined}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        // Hide background from AT + pointer/keyboard while drawer is open
        inert={inputsOpen || undefined}
      >
        <AppHeader inputsOpen={inputsOpen} onInputsClick={toggleInputs} />
        <AppShell
          activeTab={activeTab}
          keyMetrics={<KeyMetricsBar calc={calc} isNoCost={isNoCost} />}
          onTabChange={setActiveTab}
          sidebar={inputsOpen ? null : sidebar}
          tabs={TABS}
        >
          {content}
        </AppShell>
      </div>

      <MobileDrawer
        open={inputsOpen}
        onClose={closeInputs}
        title="Calculator inputs"
      >
        {sidebar}
      </MobileDrawer>
    </div>
  );
}
