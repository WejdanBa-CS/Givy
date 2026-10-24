import {
  Baby,
  Cake,
  Gem,
  GraduationCap,
  Snowflake,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { Occasion } from "@/lib/types";

const ICONS: Record<Occasion, LucideIcon> = {
  birthday: Cake,
  wedding: Gem,
  holiday: Snowflake,
  baby: Baby,
  graduation: GraduationCap,
  creator: Video,
  other: Sparkles,
};

export function OccasionIcon({
  occasion,
  size = 14,
  className,
}: {
  occasion: Occasion;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[occasion] ?? Sparkles;
  return <Icon aria-hidden size={size} strokeWidth={1.75} className={className} />;
}
