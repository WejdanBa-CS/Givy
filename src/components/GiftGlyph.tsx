"use client";

/** Soft letter tile instead of emoji stickers. */
export function GiftGlyph({
  title,
  hint,
  claimed = false,
}: {
  title?: string;
  hint?: string;
  claimed?: boolean;
}) {
  const letter = (title?.trim()?.[0] || hint?.trim()?.[0] || "G").toUpperCase();
  let hue = 12;
  const seed = title || hint || "g";
  for (let index = 0; index < seed.length; index += 1) {
    hue = (hue + seed.charCodeAt(index) * 17) % 360;
  }

  return (
    <span
      aria-hidden
      className={`grid h-[2.85rem] w-[2.85rem] shrink-0 place-items-center rounded-[.875rem] font-display text-[1.35rem] font-semibold sm:h-[3.25rem] sm:w-[3.25rem] sm:rounded-2xl lg:h-14 lg:w-14 ${claimed ? "opacity-70" : ""}`}
      style={{
        background: claimed
          ? "var(--mist-deep)"
          : `linear-gradient(145deg, hsl(${hue} 42% 92%), hsl(${(hue + 24) % 360} 38% 86%))`,
        color: claimed ? "var(--ink-soft)" : `hsl(${hue} 40% 32%)`,
      }}
    >
      {letter}
    </span>
  );
}
