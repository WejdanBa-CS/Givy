"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

type Props = {
  open: boolean;
  giftTitle?: string;
  onComplete?: () => void;
};

const ease = [0.22, 1, 0.36, 1] as const;

const SPARKLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  return {
    id: i,
    x: Math.cos(angle) * (72 + (i % 5) * 16),
    y: Math.sin(angle) * (56 + (i % 4) * 14) - 12,
    delay: 0.55 + (i % 5) * 0.035,
    size: 5 + (i % 3) * 2,
    color:
      i % 3 === 0 ? "var(--amber)" : i % 3 === 1 ? "var(--coral)" : "var(--leaf)",
  };
});

/**
 * Short unwrap + sparkle celebration after a guest marks a gift purchased.
 * Additive only — never required for claim success. Honors reduced motion.
 */
export function GiftUnwrapCelebration({
  open,
  giftTitle,
  onComplete,
}: Props) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const ms = reduce ? 450 : 2400;
    const timer = window.setTimeout(() => {
      try {
        onComplete?.();
      } catch {
        /* celebration must never break the claim flow */
      }
    }, ms);
    return () => window.clearTimeout(timer);
  }, [open, reduce, onComplete]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="pointer-events-none fixed inset-0 z-[80] grid place-items-center bg-[radial-gradient(ellipse_55%_45%_at_50%_48%,rgba(254,246,238,0.72),transparent_70%)]"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.2 : 0.35 }}
        >
          <span className="sr-only">
            {giftTitle
              ? `${giftTitle} marked purchased.`
              : "Gift marked purchased."}
          </span>

          <div
            className="relative flex w-[min(220px,70vw)] flex-col items-center gap-4"
            aria-hidden
          >
            {reduce ? (
              <m.div
                className="rounded-2xl border border-line bg-mist/90 px-5 py-3.5 shadow-givy"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease }}
              >
                <p className="font-display text-lg font-semibold tracking-tight text-ink">
                  Marked purchased
                </p>
              </m.div>
            ) : (
              <>
                {/* 1 — lid lift / ribbon reveal */}
                <div className="relative h-[78px] w-[88px] max-[480px]:h-[68px] max-[480px]:w-[76px]">
                  <m.div
                    className="absolute left-0 top-0 z-[2] h-[22px] w-full origin-[20%_100%] rounded-t-[10px] rounded-b-md bg-coral-deep shadow-[0_6px_16px_-8px_rgba(201,46,22,0.55)] max-[480px]:h-5"
                    initial={{ y: 0, rotate: 0 }}
                    animate={{ y: -42, rotate: -12 }}
                    transition={{ duration: 0.55, ease, delay: 0.08 }}
                  >
                    <span className="absolute left-1/2 top-[-10px] ml-[-14px] h-3.5 w-7 rounded-full bg-leaf shadow-[-14px_2px_0_-2px_var(--leaf),14px_2px_0_-2px_var(--leaf)]" />
                  </m.div>
                  <m.div
                    className="absolute left-1 top-[18px] h-[52px] w-20 overflow-hidden rounded-[10px] bg-coral shadow-[0_14px_28px_-16px_rgba(232,57,30,0.55)] max-[480px]:left-[3px] max-[480px]:h-[46px] max-[480px]:w-[70px]"
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 0.7, ease, delay: 0.35 }}
                  >
                    <span className="absolute left-1/2 top-0 ml-[-4px] h-full w-2 rounded-sm bg-[#fff7f4]" />
                    <span className="absolute left-0 top-[48%] mt-[-4px] h-2 w-full rounded-sm bg-[#fff7f4]" />
                  </m.div>
                </div>

                {/* 2 — soft title reveal */}
                <m.p
                  className="m-0 text-center font-display text-[1.15rem] font-semibold tracking-tight text-ink"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease, delay: 0.7 }}
                >
                  Marked purchased
                </m.p>

                {/* 3 — lightweight sparkles */}
                <div className="pointer-events-none absolute left-1/2 top-[42%] h-0 w-0">
                  {SPARKLES.map((s) => (
                    <m.span
                      key={s.id}
                      className="absolute left-0 top-0 rounded-full"
                      style={{
                        width: s.size,
                        height: s.size,
                        background: s.color,
                      }}
                      initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                      animate={{
                        opacity: [0, 1, 0],
                        x: s.x,
                        y: s.y,
                        scale: [0.4, 1.15, 0.2],
                      }}
                      transition={{
                        duration: 0.95,
                        ease,
                        delay: s.delay,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
