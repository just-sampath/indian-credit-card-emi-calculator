/** Splits month-ordered items into consecutive runs of 12. */
function byYear(items) {
  const years = [];
  for (let index = 0; index < items.length; index += 12) {
    years.push(items.slice(index, index + 12));
  }
  return years;
}

/**
 * Long month lists on phones: up to a year shows as a plain list; longer ones
 * fold into one disclosure per year (the first open) so 60 months is a few
 * rows instead of a dozen screens.
 */
export function YearGroups({ items, renderItem, summarize }) {
  if (items.length <= 12) {
    return <ol className="flex flex-col gap-2">{items.map(renderItem)}</ol>;
  }

  return (
    <div className="flex flex-col gap-2">
      {byYear(items).map((group, index) => {
        const firstMonth = group[0].month;
        const lastMonth = group[group.length - 1].month;
        return (
          <details
            key={firstMonth}
            className="group/year rounded-[10px] border border-border bg-surface-alt"
            open={index === 0}
          >
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-[10px] px-4 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-gold)] active:bg-surface [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="block text-[14px] font-medium text-text">
                  Year {index + 1}
                </span>
                <span className="block text-[13px] text-text-muted">
                  {firstMonth === lastMonth
                    ? `Month ${firstMonth}`
                    : `Months ${firstMonth} to ${lastMonth}`}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-right text-[13px] text-text-dim">
                  {summarize(group)}
                </span>
                <span
                  aria-hidden="true"
                  className="text-[12px] text-gold transition-transform group-open/year:rotate-180"
                >
                  ▾
                </span>
              </span>
            </summary>
            <ol className="flex flex-col gap-2 border-t border-border p-2">
              {group.map(renderItem)}
            </ol>
          </details>
        );
      })}
    </div>
  );
}
