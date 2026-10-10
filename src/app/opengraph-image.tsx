import { OG_SIZE, renderShareCard } from "@/lib/og/share-card";

export const alt = "Givy — private gift wishlists";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function Image() {
  return renderShareCard({
    title: "One list. Zero awkward duplicates.",
    ownerName: "Friends & family",
    occasion: "other",
  });
}
