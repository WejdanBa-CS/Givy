"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold tracking-[-0.01em] transition-[transform,background-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/35 focus-visible:ring-offset-2 focus-visible:ring-offset-mist disabled:pointer-events-none disabled:opacity-40 active:scale-[0.985]",
  {
    variants: {
      variant: {
        primary:
          "bg-coral text-white shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_1px_2px_rgba(120,30,10,.25),0_6px_14px_-8px_rgba(232,57,30,.7)] hover:bg-coral-deep",
        secondary:
          "border border-line bg-paper text-ink shadow-[0_1px_2px_rgba(28,17,8,.05)] hover:border-ink/20 hover:bg-mist/60",
        ghost: "bg-transparent text-ink-soft hover:text-ink",
        soft: "bg-mist-deep/80 text-ink hover:bg-mist-deep",
        amber: "bg-amber text-ink hover:brightness-95",
      },
      size: {
        sm: "h-9 px-3.5 text-[13px]",
        md: "h-11 px-5 text-[15px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
