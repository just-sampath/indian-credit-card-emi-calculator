import { calculateEmiScenario } from "../../lib/emi.js";
import { Card } from "../ui/Card.jsx";
import { formatCurrency } from "../../lib/format.js";

export function SummaryTab({
  annualRate,
  calc,
  isNoCost,
  mrp,
  procFee,
  tenure,
}) {
  const noCostCalc = calculateEmiScenario({
    mrp,
    annualRate,
    tenure,
    isNoCost: true,
    procFee,
  });
  const regularCalc = calculateEmiScenario({
    mrp,
    annualRate,
    tenure,
    isNoCost: false,
    procFee,
  });

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
    ["EMI Formula", "P × r × (1+r)ⁿ / ((1+r)ⁿ−1)"],
    ["Base EMI", formatCurrency(calc.baseEMI)],
    isNoCost
      ? [
          "EMI = MRP÷N?",
          `${formatCurrency(mrp)}÷${tenure} = ${formatCurrency(mrp / tenure)} ✓`,
        ]
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
      <div className="mb-5 grid grid-cols-2 gap-4">
        <Card className="px-5 py-5">
          <div className="section-label">Loan Structure</div>
          <div className="mt-3 flex flex-col gap-2.5">
            {loanStructureRows.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between border-b border-b-[#111827] pb-2 text-[12px]"
              >
                <span className="text-text-muted">{label}</span>
                <span
                  className={
                    value.startsWith("−")
                      ? "font-medium text-green"
                      : "font-medium text-text"
                  }
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="px-5 py-5">
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
                  className="flex justify-between border-b border-b-[#111827] pb-2 text-[12px]"
                >
                  <span className="text-text-muted">{label}</span>
                  <span
                    className={`${
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

      <Card className="mb-4 px-5 py-5">
        <div className="section-label">
          No Cost EMI vs Regular EMI — Comparison
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="data-table">
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

      <div className="rounded-lg border border-border bg-surface px-4 py-4 text-[11px] leading-[1.8] text-[#475569]">
        <strong className="mb-1.5 block text-gold">
          Key Mechanics (Indian Banks)
        </strong>
        <strong className="text-text">1. Reducing Balance:</strong> Interest is
        computed monthly on the diminishing outstanding principal — not flat
        rate.
        <br />
        <strong className="text-text">2. GST (18%):</strong> Charged on the{" "}
        <em>interest component</em>, processing fee, and pre-closure charges
        where applicable.
        <br />
        <strong className="text-text">3. No Cost EMI Discount:</strong>{" "}
        Merchant/brand gives an upfront discount = MRP − PV(r, n, MRP/n). Card
        is charged the discounted amount. Bank earns interest on discounted
        principal. You pay the base EMI before GST, then the statement debit
        adds GST on interest.
        <br />
        <strong className="text-text">4. RBI Mandate (2013):</strong> Banks
        cannot offer zero-interest loans. Interest is always charged, offset by
        merchant subsidy in No Cost EMI.
        <br />
        <strong className="text-text">5. Pre-closure:</strong> 3% of outstanding
        principal + GST on the fee + accrued/advance interest + GST on that
        interest. Any merchant clawback is configurable.
      </div>
    </div>
  );
}
