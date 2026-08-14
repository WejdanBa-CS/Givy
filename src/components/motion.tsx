"use client";

import { motion, type HTMLMotionProps, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  editorialEase,
  fadeUp,
  fadeUpReduced,
  springs,
  staggerContainer,
} from "@/lib/motion-presets";

export function FadeIn({
  className,
  delay = 0,
  y = 18,
  children,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      initial={reduce ? false : { opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: editorialEase }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  className,
  children,
  delay = 0,
}: {
  className?: string;
  children: ReactNode;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduce ? 0 : 0.08,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      variants={reduce ? fadeUpReduced : fadeUp}
    >
      {children}
    </motion.div>
  );
}

/** Subtle press feedback for cards and list rows. */
export function Pressable({
  className,
  children,
  disabled,
  ...props
}: HTMLMotionProps<"div"> & { disabled?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn(className)}
      whileTap={reduce || disabled ? undefined : { scale: 0.985 }}
      whileHover={reduce || disabled ? undefined : { y: -1 }}
      transition={springs.soft}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionList({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.ul
      className={cn(className)}
      initial="hidden"
      animate="show"
      variants={reduce ? { hidden: {}, show: {} } : staggerContainer}
    >
      {children}
    </motion.ul>
  );
}

export function MotionListItem({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.li className={cn(className)} variants={reduce ? fadeUpReduced : fadeUp}>
      {children}
    </motion.li>
  );
}

export const MotionLi = motion.li;
