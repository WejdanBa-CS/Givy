import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { OG_SIZE } from "@/lib/og/share-card";

export const alt = "Givy, private gift wishlists";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function Image() {
  let mark: string | null = null;
  try {
    const buf = await readFile(join(process.cwd(), "public", "givy-mark.png"));
    mark = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    mark = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background:
            "linear-gradient(145deg, #FEF6EE 0%, #F3E6D8 48%, #FFE8D2 100%)",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#1A120E",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {mark ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mark} width={80} height={80} alt="" style={{ borderRadius: 18 }} />
          ) : null}
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            Givy
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            One list. Zero awkward duplicates.
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#6B5748",
              fontFamily: "system-ui, sans-serif",
              lineHeight: 1.35,
              maxWidth: 900,
            }}
          >
            Share one link. Friends claim gifts privately, so nobody buys the same gift twice.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: 24,
            fontWeight: 700,
            color: "#E8391E",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          givy.gifts
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
