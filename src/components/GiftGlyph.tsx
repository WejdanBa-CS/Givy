"use client";

import { useState } from "react";
import {
  giftIllustrationSrc,
  isGiftImageUrl,
  resolveGiftVisualSeed,
} from "@/lib/gift-visual";

/** Product photo when available; otherwise a curated gift illustration. */
export function GiftGlyph({
  title,
  hint,
  claimed = false,
  size = "md",
}: {
  title?: string;
  hint?: string;
  claimed?: boolean;
  size?: "md" | "lg";
}) {
  const [broken, setBroken] = useState(false);
  const remote = hint && isGiftImageUrl(hint) && !broken ? hint.trim() : null;
  const seed = resolveGiftVisualSeed(title, hint);
  const src = remote ?? giftIllustrationSrc(seed);
  const box =
    size === "lg"
      ? "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] rounded-2xl"
      : "h-[2.85rem] w-[2.85rem] sm:h-[3.25rem] sm:w-[3.25rem] lg:h-14 lg:w-14 rounded-[.875rem] sm:rounded-2xl";

  return (
    <span
      aria-hidden
      className={`relative block shrink-0 overflow-hidden bg-mist-deep ${box} ${claimed ? "opacity-70 grayscale-[.35]" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- mixed remote + local SVG */}
      <img
        src={src}
        alt=""
        width={112}
        height={112}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => {
          if (remote) setBroken(true);
        }}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
