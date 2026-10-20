import { Button } from "../ui/Button.jsx";

/** Two-or-more option pill where exactly one option is active. */
export function SegmentedToggle({ labelledBy, onChange, options, value }) {
  return (
    <div
      aria-labelledby={labelledBy}
      className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-full border border-border bg-surface p-[3px]"
      role="group"
    >
      {options.map((option) => (
        <Button
          key={String(option.value)}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          selected={value === option.value}
          variant="toggle"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
