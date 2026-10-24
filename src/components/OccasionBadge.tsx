import { OCCASION_EMOJI, OCCASION_LABELS, type Occasion } from "@/lib/types";

const STYLES: Partial<Record<Occasion, { bg: string; text: string }>> = {
  birthday: { bg: "#FFF0E6", text: "#E8391E" },
  wedding: { bg: "#FFF6E0", text: "#C9840A" },
  holiday: { bg: "#EEF5FF", text: "#2265C3" },
  baby: { bg: "#F5EEFF", text: "#6B4BA1" },
  graduation: { bg: "#EEF5FF", text: "#2265C3" },
  creator: { bg: "#F0FAF0", text: "#2A7A2A" },
  other: { bg: "#F5EDE4", text: "#8A6F5E" },
};

export function OccasionBadge({
  occasion,
  suffix,
}: {
  occasion: Occasion;
  suffix?: string;
}) {
  const style = STYLES[occasion] ?? STYLES.other!;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: style.bg, color: style.text }}
    >
      {OCCASION_EMOJI[occasion]} {OCCASION_LABELS[occasion]}
      {suffix ? ` · ${suffix}` : ""}
    </span>
  );
}
