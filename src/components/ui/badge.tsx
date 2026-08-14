import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-mist-deep text-ink-soft",
        coral: "bg-coral/12 text-coral-deep",
        leaf: "bg-leaf/12 text-leaf",
        amber: "bg-amber/30 text-ink",
        outline: "border border-line bg-paper text-ink-soft",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
