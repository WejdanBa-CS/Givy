"use client";

import { useState } from "react";
import { isGiftImageUrl } from "@/lib/gift-visual";

/** Product photo when available; otherwise the Givy mark. */
export function GiftGlyph({
  hint,
  claimed = false,
  size = "md",
}: {
  title?: string;
  hint?: string;
  claimed?: boolean;
  size?: "md" | "lg" | "card";
}) {
  const [broken, setBroken] = useState(false);
  const remote = hint && isGiftImageUrl(hint) && !broken ? hint.trim() : null;
  const src = remote ?? "/givy-mark.png";
  const box =
    size === "card"
      ? "block aspect-square w-full rounded-none border-b border-line"
      : size === "lg"
        ? "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] rounded-2xl"
        : "h-[2.85rem] w-[2.85rem] sm:h-[3.25rem] sm:w-[3.25rem] lg:h-14 lg:w-14 rounded-[.875rem] sm:rounded-2xl";

  return (
    <span
      aria-hidden
      className={`relative shrink-0 overflow-hidden ${remote ? "bg-white" : "bg-mist-deep"} ${size === "card" ? "" : "block border border-line"} ${box}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- remote product photos */}
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
        className={`h-full w-full object-contain ${
          remote
            ? size === "card"
              ? "p-[9%]"
              : "p-[8%]"
            : "p-[22%] mix-blend-multiply"
        } ${claimed ? "opacity-40 grayscale-[.6]" : ""}`}
      />
    </span>
  );
}
