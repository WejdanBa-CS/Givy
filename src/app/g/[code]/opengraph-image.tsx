import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import {
  OG_SIZE,
  renderDefaultShareCard,
  renderShareCard,
} from "@/lib/og/share-card";

export const alt = "Givy gift list";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";

type Props = { params: Promise<{ code: string }> };

export default async function Image({ params }: Props) {
  const { code } = await params;
  if (!isSupabaseConfigured() || !code) {
    return renderDefaultShareCard();
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_public_list", {
      p_share_code: code,
    });
    const payload = data as {
      title?: string;
      owner_name?: string;
      occasion?: string;
    } | null;
    if (!payload?.title) return renderDefaultShareCard();
    return renderShareCard({
      title: payload.title,
      ownerName: payload.owner_name,
      occasion: payload.occasion,
    });
  } catch {
    return renderDefaultShareCard();
  }
}
