"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { normalizeInviteCode } from "@/lib/security";

function InviteLinkInner() {
  const params = useParams();
  const router = useRouter();
  const raw = typeof params.code === "string" ? params.code : null;
  const code = normalizeInviteCode(raw);

  useEffect(() => {
    if (code) {
      router.replace(`/invite?code=${encodeURIComponent(code)}`);
    } else {
      router.replace("/invite");
    }
  }, [code, router]);

  return <div className="shell py-20 text-center text-ink-soft">Loading…</div>;
}

export default function InviteLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="shell py-20 text-center text-ink-soft">Loading…</div>
      }
    >
      <InviteLinkInner />
    </Suspense>
  );
}
