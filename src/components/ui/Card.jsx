import { cn, cva } from "../../lib/cn.js";

const cardVariants = cva("rounded-[10px] border px-5 py-4", {
  variants: {
    tone: {
      default: "bg-[var(--color-surface)] border-[var(--color-border)]",
      gold: "border-[var(--color-gold)] [background:linear-gradient(135deg,#0f1318_0%,#1a150a_100%)]",
      green:
        "border-[color:rgba(34,197,94,0.27)] [background:linear-gradient(135deg,#0f1318_0%,#0a1a0e_100%)]",
      red: "border-[color:rgba(239,68,68,0.27)] [background:linear-gradient(135deg,#0f1318_0%,#1a0a0a_100%)]",
    },
  },
  defaultVariants: {
    tone: "default",
  },
});

export function Card({ as: Component = "div", className, tone, ...props }) {
  return (
    <Component className={cn(cardVariants({ tone }), className)} {...props} />
  );
}
