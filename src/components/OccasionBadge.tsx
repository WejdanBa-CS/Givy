import { OccasionIcon } from "@/components/OccasionIcon";
import { OCCASION_LABELS, type Occasion } from "@/lib/types";

const STYLES: Partial<Record<Occasion, { bg: string; text: string }>> = {
  birthday: { bg: "#FFF0E6", text: "#C92E16" },
  wedding: { bg: "#FFF6E0", text: "#A86E08" },
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
      className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold tracking-[0.02em]"
      style={{ background: style.bg, color: style.text }}
    >
      <OccasionIcon occasion={occasion} size={12} />
      {OCCASION_LABELS[occasion]}
      {suffix ? <span className="opacity-60">· {suffix}</span> : null}
    </span>
  );
}
