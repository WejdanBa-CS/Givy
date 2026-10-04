import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  token?: string;
  platform?: "android" | "ios" | "web";
};

/** Register / refresh an FCM device token for the signed-in user. */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  const platform = body.platform ?? "android";
  if (token.length < 10 || token.length > 512) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  if (!["android", "ios", "web"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Unique on token: reassign to current user if the device signed into another account.
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: user.id,
      token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
