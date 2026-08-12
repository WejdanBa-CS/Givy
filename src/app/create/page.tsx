"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyCreateRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/create");
  }, [router]);
  return <div className="shell py-20 text-center text-ink-soft">Opening create…</div>;
}
