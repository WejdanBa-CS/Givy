"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { editorialEase } from "@/lib/motion-presets";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
};

/** Animated expand/collapse — no extra Radix dep; Framer + button trigger. */
export function CollapsiblePanel({
  title,
  description,
  defaultOpen = false,
  className,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  const contentId = useId();
  const triggerId = useId();

  return (
    <div className={cn("panel overflow-hidden", className)}>
      <button
        id={triggerId}
        type="button"
        className="flex w-full items-start justify-between gap-3 p-5 text-left transition-colors hover:bg-mist-deep/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-coral/40"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl text-ink">{title}</span>
          {description && (
            <span className="mt-1 block text-sm font-normal text-ink-soft">
              {description}
            </span>
          )}
        </span>
        <m.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: editorialEase }}
          className="mt-1 shrink-0 text-ink-soft"
        >
          <ChevronDown size={20} aria-hidden />
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: editorialEase }}
            id={contentId}
            role="region"
            aria-labelledby={triggerId}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-5 pb-5 pt-4">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
