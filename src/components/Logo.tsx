type LogoProps = {
  size?: "sm" | "md" | "lg" | "hero";
  showWordmark?: boolean;
  className?: string;
};

const SIZES = {
  sm: 28,
  md: 36,
  lg: 48,
  hero: 72,
} as const;

/** Coral gift + leaf bow — brand mark for Givy */
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* box */}
      <rect x="8" y="28" width="48" height="28" rx="10" fill="#E8391E" />
      <rect x="6" y="24" width="52" height="11" rx="5.5" fill="#C92E16" />
      {/* cream ribbon */}
      <rect x="29" y="24" width="6" height="32" rx="2" fill="#FFF7F4" />
      <rect x="8" y="38" width="48" height="6" rx="2" fill="#FFF7F4" />
      {/* bow loops — solid, tilted */}
      <ellipse
        cx="21"
        cy="15.5"
        rx="12"
        ry="7.5"
        fill="#3D6B4F"
        transform="rotate(-22 21 15.5)"
      />
      <ellipse
        cx="43"
        cy="15.5"
        rx="12"
        ry="7.5"
        fill="#3D6B4F"
        transform="rotate(22 43 15.5)"
      />
      {/* knot + gold center */}
      <rect x="26.5" y="13" width="11" height="13" rx="4" fill="#2A4D38" />
      <circle cx="32" cy="19.5" r="2.8" fill="#FFCD3C" />
      {/* short tails */}
      <path d="M29 26l-5 9 5-2.5 3 4.5 3-4.5 5 2.5-5-9H29z" fill="#3D6B4F" />
    </svg>
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
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="logo-mark relative shrink-0 transition-transform duration-300 ease-out group-hover:-rotate-8 group-hover:scale-105">
        <LogoMark size={px} />
      </span>
      {showWordmark && (
        <span
          className={`font-display font-semibold tracking-tight lowercase text-ink ${wordClass}`}
          style={{ letterSpacing: size === "hero" ? "-0.03em" : "-0.02em" }}
        >
          givy
        </span>
      )}
    </span>
  );
}
