import { notFound } from "next/navigation";
import { affiliateOutboundUrl } from "@/lib/affiliate";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { isCloudItemId, safeHttpsUrl } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  if (!isCloudItemId(itemId) || !isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_item_buy_url", {
    p_item_id: itemId,
  });
  if (error || !data) {
    notFound();
  }
  const buy = safeHttpsUrl(String(data));
  if (!buy) {
    notFound();
  }
  // Monetize via Skimlinks when configured; otherwise open the merchant URL.
  const outbound = affiliateOutboundUrl(buy, req.headers.get("referer"));
  return Response.redirect(outbound, 302);
}
