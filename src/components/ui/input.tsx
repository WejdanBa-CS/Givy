import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

const inputVariants = cva(
  "w-full rounded-xl border border-line bg-paper px-3.5 py-3 text-[15px] text-ink shadow-[inset_0_1px_2px_rgba(28,17,8,.04)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-soft/55 hover:border-ink/20 focus:border-coral/70 focus:ring-4 focus:ring-coral/10 disabled:cursor-not-allowed disabled:opacity-50",
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
        "mb-1.5 block text-[13px] font-medium text-ink/75",
        className,
      )}
      {...props}
    />
  );
}

export { inputVariants };
