import { cn, cva } from "../../lib/cn.js";

const buttonVariants = cva(
  "mono-font inline-flex items-center justify-center whitespace-nowrap transition-[color,background-color,border-color,transform] active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        tab: "min-h-10 shrink-0 rounded-md border border-transparent px-3 text-[12px] uppercase tracking-[0.08em] pointer-coarse:min-h-11 sm:px-4 3xl:px-5 3xl:text-[13px]",
        toggle:
          "min-h-9 min-w-0 rounded-full px-3 text-[12px] pointer-coarse:min-h-11 pointer-coarse:text-[13px] 3xl:text-[13px]",
        chip: "min-h-10 min-w-0 rounded-md border px-1 text-[13px] pointer-coarse:min-h-11",
        outline:
          "min-h-10 gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-[12px] uppercase tracking-[0.08em] text-[var(--color-gold-soft)] hover:border-[var(--color-gold)] active:bg-[var(--color-surface-alt)]",
        primary:
          "min-h-11 gap-2 rounded-md bg-[var(--color-gold)] px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-bg)] hover:bg-[#e0b12a] active:bg-[#b8890f]",
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
          "text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text)] active:bg-[var(--color-surface)]",
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
        className:
          "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:bg-[var(--color-surface-alt)]",
      },
      {
        variant: "chip",
        selected: true,
        className:
          "border-[var(--color-gold)] bg-[color:rgba(212,160,23,0.12)] font-semibold text-[var(--color-gold)]",
      },
      {
        variant: "chip",
        selected: false,
        className:
          "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)] active:border-[var(--color-gold)]",
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
