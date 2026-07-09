import { cn, cva } from "../../lib/cn.js";

const buttonVariants = cva(
  "mono-font transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        tab: "min-h-9 rounded-[4px] border border-transparent px-3 py-2 text-[11px] uppercase tracking-[0.1em] sm:px-[18px] sm:text-[12px]",
        toggle:
          "min-h-9 rounded-[16px] border border-transparent px-3 py-1.5 text-[12px] sm:px-4",
        tenure:
          "min-h-9 min-w-[2.75rem] flex-1 rounded-[6px] border px-1 py-[7px] text-[12px]",
      },
      selected: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "tab",
        selected: true,
        className:
          "bg-[var(--color-gold)] font-semibold text-[var(--color-bg)]",
      },
      {
        variant: "tab",
        selected: false,
        className:
          "text-[var(--color-text-muted)] hover:text-[var(--color-text-dim)]",
      },
      {
        variant: "toggle",
        selected: true,
        className:
          "bg-[var(--color-gold)] font-semibold text-[var(--color-bg)]",
      },
      {
        variant: "toggle",
        selected: false,
        className: "bg-transparent text-[var(--color-text-muted)]",
      },
      {
        variant: "tenure",
        selected: true,
        className:
          "border-[var(--color-gold)] bg-[color:rgba(212,160,23,0.09)] text-[var(--color-gold)]",
      },
      {
        variant: "tenure",
        selected: false,
        className:
          "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]",
      },
    ],
    defaultVariants: {
      variant: "tab",
      selected: false,
    },
  }
);

export function Button({
  className,
  selected = false,
  type = "button",
  variant,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, selected }), className)}
      {...props}
    />
  );
}
