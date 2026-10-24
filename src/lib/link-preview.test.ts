import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchLinkPreview } from "./link-preview";

describe("fetchLinkPreview", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects non-https and private hosts", async () => {
    expect(await fetchLinkPreview("http://example.com")).toEqual({
      imageUrl: null,
      title: null,
    });
    expect(await fetchLinkPreview("https://127.0.0.1/x")).toEqual({
      imageUrl: null,
      title: null,
    });
  });

  it("extracts og:image from HTML", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `<html><head>
            <meta property="og:title" content="Nice Mug" />
            <meta property="og:image" content="https://cdn.example/mug.jpg" />
          </head></html>`,
          { status: 200, headers: { "content-type": "text/html" } },
        ),
      ),
    );
    await expect(fetchLinkPreview("https://shop.example/mug")).resolves.toEqual({
      imageUrl: "https://cdn.example/mug.jpg",
      title: "Nice Mug",
    });
  });

  it("falls back to JSON-LD Product image", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `<html><head><title>Fallback</title>
            <script type="application/ld+json">{"@type":"Product","name":"Watch","image":"https://cdn.example/watch.png"}</script>
          </head></html>`,
          { status: 200, headers: { "content-type": "text/html" } },
        ),
      ),
    );
    await expect(fetchLinkPreview("https://shop.example/watch")).resolves.toEqual({
      imageUrl: "https://cdn.example/watch.png",
      title: "Fallback",
    });
  });

  it("reads the Amazon landing image when there is no og:image", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `<html><head><title>Amazon.com: MacBook Pro</title></head><body>
            <img id="landingImage" data-old-hires="https://m.media-amazon.com/images/I/61-oTP1X4rL._AC_SL1500_.jpg"
              data-a-dynamic-image="{&quot;https://m.media-amazon.com/images/I/61-oTP1X4rL._AC_SY355_.jpg&quot;:[355,355]}" />
          </body></html>`,
          { status: 200, headers: { "content-type": "text/html" } },
        ),
      ),
    );
    await expect(fetchLinkPreview("https://www.amazon.com/dp/B0DRSWVTMN")).resolves.toEqual({
      imageUrl: "https://m.media-amazon.com/images/I/61-oTP1X4rL._AC_SL1500_.jpg",
      title: "Amazon.com: MacBook Pro",
    });
  });
});
