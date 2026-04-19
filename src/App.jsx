import { useMemo, useState } from "react";
import { AppHeader } from "./components/layout/AppHeader.jsx";
import { AppShell } from "./components/layout/AppShell.jsx";
import { Sidebar } from "./components/layout/Sidebar.jsx";
import { PreclosureTab } from "./components/tabs/PreclosureTab.jsx";
import { ScheduleTab } from "./components/tabs/ScheduleTab.jsx";
import { SummaryTab } from "./components/tabs/SummaryTab.jsx";
import { calculateEmiScenario } from "./lib/emi.js";

const TABS = [
  { id: "schedule", label: "Amortization Schedule" },
  { id: "preclosure", label: "Pre-closure Simulator" },
  { id: "summary", label: "Full Summary" },
];

export default function App() {
  const [mrp, setMrp] = useState(107705);
  const [annualRate, setAnnualRate] = useState(17);
  const [tenure, setTenure] = useState(6);
  const [isNoCost, setIsNoCost] = useState(true);
  const [procFee, setProcFee] = useState(199);
  const [preclosureMonth, setPreclosureMonth] = useState(3);
  const [activeTab, setActiveTab] = useState("schedule");

  const calc = useMemo(
    () =>
      calculateEmiScenario({
        mrp,
        annualRate,
        tenure,
        isNoCost,
        procFee,
        preclosureMonth,
      }),
    [annualRate, isNoCost, mrp, preclosureMonth, procFee, tenure]
  );

  let content = (
    <ScheduleTab calc={calc} isNoCost={isNoCost} mrp={mrp} tenure={tenure} />
  );

  if (activeTab === "preclosure") {
    content = (
      <PreclosureTab
        calc={calc}
        isNoCost={isNoCost}
        mrp={mrp}
        onPreclosureMonthChange={setPreclosureMonth}
        preclosureMonth={preclosureMonth}
        procFee={procFee}
        tenure={tenure}
      />
    );
  }

  if (activeTab === "summary") {
    content = (
      <SummaryTab
        annualRate={annualRate}
        calc={calc}
        isNoCost={isNoCost}
        mrp={mrp}
        procFee={procFee}
        tenure={tenure}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <AppHeader />
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sidebar={
          <Sidebar
            annualRate={annualRate}
            calc={calc}
            isNoCost={isNoCost}
            mrp={mrp}
            onAnnualRateChange={setAnnualRate}
            onIsNoCostChange={setIsNoCost}
            onMrpChange={setMrp}
            onProcFeeChange={setProcFee}
            onTenureChange={setTenure}
            procFee={procFee}
            tenure={tenure}
          />
        }
        tabs={TABS}
      >
        {content}
      </AppShell>
    </div>
  );
}
