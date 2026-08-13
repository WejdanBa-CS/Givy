"use client";

/** Soft letter tile instead of emoji stickers */
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
  for (let i = 0; i < seed.length; i++) hue = (hue + seed.charCodeAt(i) * 17) % 360;

  return (
    <span
      aria-hidden
      className={`wish-glyph ${claimed ? "is-claimed" : ""}`}
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
