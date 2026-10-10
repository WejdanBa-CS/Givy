import { NextResponse } from "next/server";
import { fetchLinkPreview } from "@/lib/link-preview";
import { safeHttpsUrl } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!safeHttpsUrl(raw)) {
    return NextResponse.json({ imageUrl: null, title: null }, { status: 400 });
  }
  const preview = await fetchLinkPreview(raw!);
  return NextResponse.json(preview, {
    headers: {
      "Cache-Control": "private, max-age=300",
    },
  });
}
