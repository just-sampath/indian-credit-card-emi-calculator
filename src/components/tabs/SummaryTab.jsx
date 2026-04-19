import { calcEMI, calcPV, buildSchedule } from "../../lib/emi.js";
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
  const monthlyRate = annualRate / 1200;
  const noCostEmi = mrp / tenure;
  const noCostPrincipal = calcPV(monthlyRate, tenure, noCostEmi);
  const noCostSchedule = buildSchedule(
    noCostPrincipal,
    monthlyRate,
    noCostEmi,
    tenure
  );
  const noCostInterest = noCostSchedule.reduce(
    (total, row) => total + row.interest,
    0
  );
  const noCostGst = noCostSchedule.reduce((total, row) => total + row.gst, 0);
  const noCostTotal =
    noCostSchedule.reduce((total, row) => total + row.totalPaid, 0) + procFee;
  const regularEmi = calcEMI(mrp, monthlyRate, tenure);
  const regularSchedule = buildSchedule(mrp, monthlyRate, regularEmi, tenure);
  const regularInterest = regularSchedule.reduce(
    (total, row) => total + row.interest,
    0
  );
  const regularGst = regularSchedule.reduce((total, row) => total + row.gst, 0);
  const regularTotal =
    regularSchedule.reduce((total, row) => total + row.totalPaid, 0) + procFee;

  const comparisonRows = [
    ["Principal on Card", noCostPrincipal, mrp],
    ["Upfront Discount", mrp - noCostPrincipal, 0],
    ["Base EMI (per month)", noCostEmi, regularEmi],
    ["Total Interest", noCostInterest, regularInterest],
    ["Total GST on Interest", noCostGst, regularGst],
    ["Total Outflow (incl. proc fee)", noCostTotal, regularTotal],
    ["Extra Above MRP", noCostTotal - mrp, regularTotal - mrp],
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
    ["Processing Fee", formatCurrency(procFee)],
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
    ["Processing Fee", formatCurrency(procFee), "text-[var(--color-text-dim)]"],
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
                  <span className="text-text-muted">
                    {label}
                  </span>
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
                  <td className="text-left text-text-dim">
                    {label}
                  </td>
                  <td className="text-green">
                    {formatCurrency(noCostValue)}
                  </td>
                  <td className="text-gold">
                    {formatCurrency(regularValue)}
                  </td>
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
        <strong className="text-text">
          1. Reducing Balance:
        </strong>{" "}
        Interest is computed monthly on the diminishing outstanding principal —
        not flat rate.
        <br />
        <strong className="text-text">2. GST (18%):</strong>{" "}
        Charged on the <em>interest component only</em>, billed in the next
        month&apos;s statement per T&C.
        <br />
        <strong className="text-text">
          3. No Cost EMI Discount:
        </strong>{" "}
        Merchant/brand gives an upfront discount = MRP − PV(r, n, MRP/n). Card
        is charged the discounted amount. Bank earns interest on discounted
        principal. You pay MRP/n per month (+ GST on interest).
        <br />
        <strong className="text-text">
          4. RBI Mandate (2013):
        </strong>{" "}
        Banks cannot offer zero-interest loans. Interest is always charged,
        offset by merchant subsidy in No Cost EMI.
        <br />
        <strong className="text-text">5. Pre-closure:</strong> 3%
        of outstanding principal + any accrued interest. Merchant discount may
        be clawed back within 120 days.
      </div>
    </div>
  );
}
