const HINT_EMOJI: Record<string, string> = {
  hat: "🧢",
  socks: "🧦",
  snacks: "🍿",
  watch: "⌚",
  card: "🎁",
  default: "✨",
};

export function GiftGlyph({ hint }: { hint?: string }) {
  const emoji = HINT_EMOJI[hint ?? ""] ?? HINT_EMOJI.default;
  return (
    <span
      aria-hidden
      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mist-deep text-xl"
    >
      {emoji}
    </span>
  );
}
