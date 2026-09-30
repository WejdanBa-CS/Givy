import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import {
  buildShareMetadata,
  fallbackShareMetadata,
} from "@/lib/share-preview";

type Props = { children: React.ReactNode; params: Promise<{ code: string }> };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const fallback = fallbackShareMetadata();
  if (!isSupabaseConfigured() || !code) return fallback;
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
    if (!payload?.title) return fallback;
    return buildShareMetadata({
      title: payload.title,
      ownerName: payload.owner_name,
      occasion: payload.occasion,
      shareCode: code,
    });
  } catch {
    return fallback;
  }
}

export default function SharedListLayout({ children }: Props) {
  return children;
}
