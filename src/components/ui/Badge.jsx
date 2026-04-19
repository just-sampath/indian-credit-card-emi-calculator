import { cn, cva } from "../../lib/cn.js";

const badgeVariants = cva(
  "inline-block rounded-[10px] border px-2 py-[2px] text-[10px] font-semibold tracking-[0.06em]",
  {
    variants: {
      tone: {
        gold: "border-[color:rgba(212,160,23,0.27)] bg-[color:rgba(212,160,23,0.13)] text-[var(--color-gold)]",
        green:
          "border-[color:rgba(34,197,94,0.27)] bg-[color:rgba(34,197,94,0.13)] text-[var(--color-green)]",
        red: "border-[color:rgba(239,68,68,0.27)] bg-[color:rgba(239,68,68,0.13)] text-[var(--color-red)]",
        blue: "border-[color:rgba(59,130,246,0.27)] bg-[color:rgba(59,130,246,0.13)] text-[var(--color-blue)]",
      },
    },
    defaultVariants: {
      tone: "gold",
    },
  }
);

export function Badge({ className, tone, ...props }) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
