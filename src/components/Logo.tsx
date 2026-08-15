import { cn } from "@/lib/cn";

type LogoProps = {
  size?: "sm" | "md" | "lg" | "hero";
  showWordmark?: boolean;
  className?: string;
};

const SIZES = {
  sm: 32,
  md: 40,
  lg: 48,
  hero: 72,
} as const;

/** Trademark gift mark (same asset as the Play / launcher icon). */
export function LogoMark({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- exact brand raster
    <img
      src="/givy-mark.png"
      width={size}
      height={size}
      alt=""
      className={cn("block object-contain", className)}
      aria-hidden
      draggable={false}
    />
  );
}

export function Logo({ size = "md", showWordmark = true, className = "" }: LogoProps) {
  const px = SIZES[size];
  const wordClass =
    size === "hero"
      ? "text-5xl sm:text-6xl md:text-7xl leading-none"
      : size === "lg"
        ? "text-3xl leading-none"
        : size === "sm"
          ? "text-xl leading-none"
          : "text-2xl leading-none";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="logo-mark relative shrink-0 transition-transform duration-300 ease-out group-hover:-rotate-8 group-hover:scale-105">
        <LogoMark size={px} />
      </span>
      {showWordmark && (
        <span
          className={`font-display font-semibold tracking-tight text-ink ${wordClass}`}
          style={{ letterSpacing: size === "hero" ? "-0.03em" : "-0.02em" }}
        >
          Givy
        </span>
      )}
    </span>
  );
}
