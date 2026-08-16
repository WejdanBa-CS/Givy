import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * After a successful claim, email the list owner (if Resend + service role set).
 * Caller’s session must own the claim row for this item.
 */
export async function POST(req: Request) {
  let body: { itemId?: string };
  try {
    body = (await req.json()) as { itemId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";
  if (!itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data: claim, error: claimErr } = await supabase
    .from("claims")
    .select("item_id, list_id")
    .eq("item_id", itemId)
    .eq("claimer_id", user.id)
    .maybeSingle();

  if (claimErr || !claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  const admin = createServiceClient();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!admin || !resendKey) {
    return NextResponse.json({
      ok: true,
      emailed: false,
      reason: !admin ? "service_role_not_configured" : "resend_not_configured",
    });
  }

  const { data: item } = await admin
    .from("items")
    .select("title, list_id")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) {
    return NextResponse.json({ ok: true, emailed: false });
  }

  const { data: list } = await admin
    .from("lists")
    .select("title, owner_id")
    .eq("id", item.list_id)
    .maybeSingle();

  if (!list) {
    return NextResponse.json({ ok: true, emailed: false });
  }

  const { data: owner } = await admin
    .from("profiles")
    .select("email, display_name")
    .eq("id", list.owner_id)
    .maybeSingle();

  const to = owner?.email?.trim();
  if (!to) {
    return NextResponse.json({
      ok: true,
      emailed: false,
      reason: "no_owner_email",
    });
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "Givy <onboarding@resend.dev>";
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://givy.onrender.com";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Someone claimed a gift on “${list.title}”`,
      text: [
        `Hi ${owner?.display_name || "there"},`,
        ``,
        `Good news — someone marked “${item.title}” as taken on your Givy list “${list.title}”.`,
        `Claims stay anonymous; we won’t tell you who it was.`,
        ``,
        `Open your list: ${site}/app/${claim.list_id}`,
        ``,
        `— Givy`,
      ].join("\n"),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json(
      {
        ok: false,
        emailed: false,
        error: "email_failed",
        detail: detail.slice(0, 200),
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, emailed: true });
}
