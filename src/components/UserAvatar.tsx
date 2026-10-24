"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  name: string;
  hue?: number;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  title?: string;
};

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-xs lg:h-10 lg:w-10",
  lg: "h-16 w-16 text-lg",
} as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Photo when the provider gives one; warm initial tile otherwise. */
export function UserAvatar({
  name,
  hue = 180,
  src,
  size = "sm",
  className = "",
  title,
}: Props) {
  const [broken, setBroken] = useState(false);
  const showPhoto = Boolean(src) && !broken;

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold text-white",
        SIZES[size],
        className,
      )}
      style={showPhoto ? undefined : { background: `hsl(${hue} 55% 42%)` }}
      title={title ?? name}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element -- OAuth CDN avatars
        <img
          src={src!}
          alt=""
          width={64}
          height={64}
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span aria-hidden>{initials(name) || "G"}</span>
      )}
    </span>
  );
}
