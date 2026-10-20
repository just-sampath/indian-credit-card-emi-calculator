import { CalculatorInputs } from "../controls/CalculatorInputs.jsx";
import { EmiTypeToggle } from "../controls/EmiTypeToggle.jsx";

export function Sidebar({
  annualRate,
  dayCountConvention,
  firstPeriodDays,
  isNoCost,
  mrp,
  onAnnualRateChange,
  onDayCountConventionChange,
  onFirstPeriodDaysChange,
  onIsNoCostChange,
  onMrpChange,
  onProcFeeChange,
  onTenureChange,
  procFee,
  tenure,
}) {
  return (
    <div className="@container flex flex-col gap-5 short:gap-3">
      <EmiTypeToggle isNoCost={isNoCost} onChange={onIsNoCostChange} />

      <CalculatorInputs
        annualRate={annualRate}
        dayCountConvention={dayCountConvention}
        firstPeriodDays={firstPeriodDays}
        mrp={mrp}
        onAnnualRateChange={onAnnualRateChange}
        onDayCountConventionChange={onDayCountConventionChange}
        onFirstPeriodDaysChange={onFirstPeriodDaysChange}
        onMrpChange={onMrpChange}
        onProcFeeChange={onProcFeeChange}
        onTenureChange={onTenureChange}
        procFee={procFee}
        tenure={tenure}
      />
    </div>
  );
}
