import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";

type Props = { children: React.ReactNode; params: Promise<{ code: string }> };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const fallback: Metadata = {
    title: "Shared wishlist",
    description: "A private Givy list. Claim gifts without awkward duplicates.",
  };
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
    const description = `${payload.owner_name ?? "Someone"} shared a ${payload.occasion ?? "gift"} list on Givy.`;
    return {
      title: payload.title,
      description,
      openGraph: {
        title: payload.title,
        description,
        url: `${siteUrl()}/g/${code}`,
        images: ["/givy-hero.jpg"],
      },
    };
  } catch {
    return fallback;
  }
}

export default function SharedListLayout({ children }: Props) {
  return children;
}
