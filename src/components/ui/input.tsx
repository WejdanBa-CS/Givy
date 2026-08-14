import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

const inputVariants = cva(
  "w-full rounded-[0.875rem] border-2 border-line bg-paper px-4 py-[0.85rem] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-soft/60 focus:border-coral focus:ring-2 focus:ring-coral/15 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "py-2 text-sm",
        md: "",
        lg: "py-4 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, type = "text", ...props }, ref) => (
    <input
      type={type}
      className={cn(inputVariants({ size }), className)}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, ...props }, ref) => (
    <textarea
      className={cn(inputVariants({ size }), "min-h-20 resize-y", className)}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-sm font-bold text-ink-soft",
        className,
      )}
      {...props}
    />
  );
}

export { inputVariants };
