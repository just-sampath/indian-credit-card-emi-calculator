import {
  DAY_COUNT_ACTUAL365,
  calculateEmiScenario,
} from "../../lib/emi.js";
import { Card } from "../ui/Card.jsx";
import { formatCurrency } from "../../lib/format.js";

export function SummaryTab({
  annualRate,
  calc,
  dayCountConvention,
  firstPeriodDays,
  isNoCost,
  mrp,
  procFee,
  tenure,
}) {
  const shared = {
    mrp,
    annualRate,
    tenure,
    procFee,
    firstPeriodDays,
    dayCountConvention,
  };
  const noCostCalc = calculateEmiScenario({
    ...shared,
    isNoCost: true,
  });
  const regularCalc = calculateEmiScenario({
    ...shared,
    isNoCost: false,
  });
  const dayCountLabel =
    dayCountConvention === DAY_COUNT_ACTUAL365
      ? "Actual/365"
      : "30-day pro-rata";

  const comparisonRows = [
    ["Principal on Card", noCostCalc.principal, regularCalc.principal],
    ["Upfront Discount", noCostCalc.discount, regularCalc.discount],
    ["Base EMI before GST", noCostCalc.baseEMI, regularCalc.baseEMI],
    ["Total Interest", noCostCalc.totalInterest, regularCalc.totalInterest],
    ["Total GST on Interest", noCostCalc.totalGST, regularCalc.totalGST],
    [
      "GST on Processing Fee",
      noCostCalc.processingFeeGst,
      regularCalc.processingFeeGst,
    ],
    ["Total Outflow", noCostCalc.grandTotal, regularCalc.grandTotal],
    [
      "Extra Above MRP",
      noCostCalc.extraCostAboveMRP,
      regularCalc.extraCostAboveMRP,
    ],
  ];

  const loanStructureRows = [
    ["Product MRP", formatCurrency(mrp)],
    isNoCost ? ["Upfront Discount", `−${formatCurrency(calc.discount)}`] : null,
    ["Principal Charged to Card", formatCurrency(calc.principal)],
    ["Annual Interest Rate", `${annualRate}%`],
    ["Monthly Interest Rate", `${(annualRate / 12).toFixed(4)}%`],
    ["Tenure", `${tenure} months`],
    ["Days to first due date", `${firstPeriodDays} days`],
    ["First-period day-count", dayCountLabel],
    [
      "Month-1 interest formula",
      dayCountConvention === DAY_COUNT_ACTUAL365
        ? "P × (rate/100) × (days/365)"
        : "P × (rate/1200) × (days/30)",
    ],
    ["EMI Formula (quoted)", "P × r × (1+r)ⁿ / ((1+r)ⁿ−1)"],
    ["Base EMI", formatCurrency(calc.baseEMI)],
    isNoCost
      ? ["Base installments sum", formatCurrency(calc.totalBasePaid)]
      : null,
    ["Processing Fee", formatCurrency(calc.processingFee)],
    ["GST on Processing Fee", formatCurrency(calc.processingFeeGst)],
    ["Processing Fee Total", formatCurrency(calc.processingFeeTotal)],
  ].filter(Boolean);

  const totalCostRows = [
    [
      "Principal Repaid",
      formatCurrency(calc.principal),
      "text-[var(--color-blue)]",
    ],
    [
      "Total Interest Paid",
      formatCurrency(calc.totalInterest),
      "text-[var(--color-gold)]",
    ],
    [
      "Total GST on Interest (18%)",
      formatCurrency(calc.totalGST),
      "text-[var(--color-red)]",
    ],
    [
      "Processing Fee",
      formatCurrency(calc.processingFee),
      "text-[var(--color-text-dim)]",
    ],
    [
      "GST on Processing Fee",
      formatCurrency(calc.processingFeeGst),
      "text-[var(--color-red)]",
    ],
    null,
    [
      "TOTAL OUTFLOW",
      formatCurrency(calc.grandTotal),
      "text-[var(--color-gold-soft)]",
    ],
    ["Product MRP", formatCurrency(mrp), "text-[var(--color-text-dim)]"],
    [
      "Extra Cost Above MRP",
      formatCurrency(calc.extraCostAboveMRP),
      "text-[var(--color-red)]",
    ],
    [
      "Effective Annual Cost (%)",
      `${((calc.extraCostAboveMRP / mrp) * (12 / tenure) * 100).toFixed(2)}% p.a.`,
      "text-[var(--color-gold)]",
    ],
  ];

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="section-label">Loan Structure</div>
          <div className="mt-3 flex flex-col gap-2.5">
            {loanStructureRows.map(([label, value]) => (
              <div
                key={label}
                className="flex flex-col gap-0.5 border-b border-b-[#111827] pb-2 text-[12px] sm:flex-row sm:justify-between sm:gap-3"
              >
                <span className="shrink-0 text-text-muted">{label}</span>
                <span
                  className={
                    value.startsWith("−")
                      ? "break-all font-medium text-green sm:text-right"
                      : "break-all font-medium text-text sm:text-right"
                  }
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="section-label">Total Cost Breakdown</div>
          <div className="mt-3 flex flex-col gap-2.5">
            {totalCostRows.map((row, index) => {
              if (!row) {
                return <hr key={index} className="divider-line my-1" />;
              }

              const [label, value, valueClassName] = row;

              return (
                <div
                  key={label}
                  className="flex flex-col gap-0.5 border-b border-b-[#111827] pb-2 text-[12px] sm:flex-row sm:justify-between sm:gap-3"
                >
                  <span className="shrink-0 text-text-muted">{label}</span>
                  <span
                    className={`break-all sm:text-right ${
                      label.startsWith("TOTAL") ? "font-bold" : "font-medium"
                    } ${valueClassName}`}
                  >
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mb-4 px-4 py-4 sm:px-5 sm:py-5">
        <div className="section-label">
          No Cost EMI vs Regular EMI — Comparison
        </div>
        <div className="mt-3 overflow-x-auto overscroll-x-contain">
          <table className="data-table min-w-[520px]">
            <thead>
              <tr>
                <th className="text-left">Metric</th>
                <th className="text-green">No Cost EMI</th>
                <th className="text-gold">Regular EMI</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([label, noCostValue, regularValue]) => (
                <tr key={label}>
                  <td className="text-left text-text-dim">{label}</td>
                  <td className="text-green">{formatCurrency(noCostValue)}</td>
                  <td className="text-gold">{formatCurrency(regularValue)}</td>
                  <td
                    className={
                      noCostValue < regularValue
                        ? "text-green"
                        : noCostValue > regularValue
                          ? "text-red"
                          : "text-text-muted"
                    }
                  >
                    {noCostValue < regularValue
                      ? "↓ Save "
                      : noCostValue > regularValue
                        ? "↑ Extra "
                        : "="}
                    {noCostValue !== regularValue
                      ? formatCurrency(Math.abs(regularValue - noCostValue))
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="rounded-lg border border-border bg-surface px-3 py-4 text-[11px] leading-[1.8] text-text-muted sm:px-4">
        <strong className="mb-1.5 block text-gold">
          Key Mechanics (Indian Banks)
        </strong>
        <strong className="text-text">1. Reducing Balance:</strong> Interest is
        computed on the diminishing outstanding principal — not flat rate.
        <br />
        <strong className="text-text">2. First EMI day-count:</strong> Month 1
        uses booking → first due date ({firstPeriodDays} days, {dayCountLabel}
        ). Months 2+ use full monthly periods (PDD → PDD).
        <br />
        <strong className="text-text">3. GST (18%):</strong> Charged on the{" "}
        <em>billed interest</em>, processing fee, and pre-closure charges where
        applicable.
        <br />
        <strong className="text-text">4. No Cost EMI Discount:</strong>{" "}
        Merchant/brand discount = MRP − PV of installments (first period rate
        can differ when days ≠ 30). You still pay GST on interest + processing
        fee.
        <br />
        <strong className="text-text">5. Pre-closure:</strong> Outstanding
        principal + fee% + GST + optional accrued interest + GST. Merchant
        clawback is configurable.
      </div>
    </div>
  );
}
