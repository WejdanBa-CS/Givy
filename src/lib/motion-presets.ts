/** Shared Framer Motion presets — Warm Editorial easing. */

export const editorialEase = [0.22, 1, 0.36, 1] as const;

export const springs = {
  soft: { type: "spring" as const, stiffness: 260, damping: 26 },
  snappy: { type: "spring" as const, stiffness: 420, damping: 32 },
  gentle: { type: "spring" as const, stiffness: 180, damping: 22 },
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: editorialEase },
  },
} as const;

export const fadeUpReduced = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
} as const;

export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
} as const;

export const scaleTap = {
  whileTap: { scale: 0.98 },
  whileHover: { scale: 1.01 },
  transition: springs.snappy,
} as const;
