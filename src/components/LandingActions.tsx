"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useGivy } from "@/lib/givy-context";

type LandingCtaProps = {
  className?: string;
  compact?: boolean;
};

export function LandingAccountLink() {
  const { user, ready } = useGivy();
  const signedIn = ready && Boolean(user);
  return (
    <Button asChild variant="ghost" size="sm" className="min-h-11 min-w-11 px-3.5 text-inherit hover:text-white focus-visible:outline-[#fff7f0]">
      <Link href={signedIn ? "/app" : "/login"}>{signedIn ? "My lists" : "Sign in"}</Link>
    </Button>
  );
}

export function LandingCta({ className, compact = false }: LandingCtaProps) {
  const { user, ready } = useGivy();
  const signedIn = ready && Boolean(user);
  const href = signedIn ? "/app" : "/signup";
  const label = signedIn ? "Go to my lists" : compact ? "Start free" : "Create your Givy";
  return (
    <Button asChild size="lg" className={className}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
