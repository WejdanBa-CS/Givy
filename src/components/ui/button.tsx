"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[0.875rem] font-bold tracking-tight transition-[transform,background-color,opacity,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mist disabled:pointer-events-none disabled:opacity-50 active:translate-y-0 hover:-translate-y-px",
  {
    variants: {
      variant: {
        primary: "bg-coral text-white hover:bg-coral-deep shadow-[0_10px_24px_-12px_rgba(232,57,30,0.65)]",
        secondary:
          "border-2 border-line bg-paper text-ink hover:bg-mist-deep/50",
        ghost: "bg-transparent text-ink-soft hover:text-ink",
        soft: "bg-mist-deep/80 text-ink hover:bg-mist-deep",
        amber: "bg-amber text-ink hover:opacity-90",
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-[1.35rem] py-[0.85rem] text-base",
        lg: "px-6 py-4 text-base",
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
