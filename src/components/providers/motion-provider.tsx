"use client";

import { domAnimation, LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { editorialEase } from "@/lib/motion-presets";

/** Lazy-loads motion features + respects prefers-reduced-motion globally. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ ease: editorialEase, duration: 0.5 }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
