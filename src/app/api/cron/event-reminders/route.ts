import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { runEventReminders } from "@/lib/reminders/run-event-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily cron: friend event reminders (7 days before + day-of).
 * Auth: Authorization: Bearer $CRON_SECRET
 *
 * Example (local):
 *   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/event-reminders
 */
export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase service role is not configured" },
      { status: 503 },
    );
  }

  try {
    const result = await runEventReminders(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Reminder job failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
