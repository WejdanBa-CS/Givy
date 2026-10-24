import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Occasion } from "@/lib/types";
import { OCCASION_LABELS } from "@/lib/types";
import { sharePreviewCopy } from "@/lib/share-preview";

export const OG_SIZE = { width: 1200, height: 630 } as const;

async function loadMarkDataUrl(): Promise<string | null> {
  try {
    const buf = await readFile(join(process.cwd(), "public", "givy-mark.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderShareCard(input: {
  title: string;
  ownerName?: string | null;
  occasion?: string | null;
}): Promise<ImageResponse> {
  const { description, occasion } = sharePreviewCopy(input);
  const occasionLabel = OCCASION_LABELS[occasion as Occasion] ?? "Gift list";
  const owner = (input.ownerName?.trim() || "Someone").slice(0, 40);
  const mark = await loadMarkDataUrl();
  const headline = (input.title.trim() || "Shared wishlist").slice(0, 56);

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          {mark ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mark}
              width={72}
              height={72}
              alt=""
              style={{ borderRadius: 16 }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                background: "#E8391E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FEF6EE",
                fontSize: 36,
                fontWeight: 700,
              }}
            >
              G
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 42,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              Givy
            </div>
            <div
              style={{
                fontSize: 22,
                color: "#3D6B4F",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {occasionLabel}
            </div>
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
            {headline}
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
            {description.slice(0, 120)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 24,
              color: "#6B5748",
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                background: "#E8391E",
                color: "#FEF6EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {owner
                .split(/\s+/)
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "G"}
            </div>
            Shared by {owner}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#E8391E",
            }}
          >
            givy.gifts
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}

export async function renderDefaultShareCard(): Promise<ImageResponse> {
  return renderShareCard({
    title: "Shared wishlist",
    ownerName: "Someone",
    occasion: "other",
  });
}
