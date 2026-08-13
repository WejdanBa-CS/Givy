"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Calendar lives on the main Home screen now. */
export default function CalendarRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app");
  }, [router]);
  return (
    <div className="py-16 text-center text-ink-soft">Opening calendar…</div>
  );
}
