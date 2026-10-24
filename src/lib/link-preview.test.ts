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

  it("decodes entities and upgrades protocol-relative og:image", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `<meta property="og:image" content="//cdn.shop.example/p.jpg?w=800&amp;h=800" /><title>Lamp &amp; Shade</title>`,
          { status: 200, headers: { "content-type": "text/html" } },
        ),
      ),
    );
    await expect(fetchLinkPreview("https://shop.example/lamp")).resolves.toEqual({
      imageUrl: "https://cdn.shop.example/p.jpg?w=800&h=800",
      title: "Lamp & Shade",
    });
  });

  it("picks the product <img> over logos on pages without meta tags", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `<html><head><title>Ceramic Vase – Studio</title></head><body>
            <img src="/static/logo.png" alt="Studio" width="160" height="40" />
            <img src="/img/icons/cart.png" width="24" height="24" />
            <img class="product-gallery__image" alt="Ceramic vase in sand"
              srcset="/img/vase-400.jpg 400w, /img/vase-1200.jpg 1200w" src="/img/vase-400.jpg" />
            <img src="/img/related-1.jpg" alt="Other thing" />
          </body></html>`,
          { status: 200, headers: { "content-type": "text/html" } },
        ),
      ),
    );
    await expect(fetchLinkPreview("https://studio.example/vase")).resolves.toEqual({
      imageUrl: "https://studio.example/img/vase-1200.jpg",
      title: "Ceramic Vase – Studio",
    });
  });

  it("retries with a browser user agent when the first request is blocked", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const ua = new Headers(init?.headers).get("user-agent") ?? "";
      if (ua.includes("GivyLinkPreview")) return new Response("blocked", { status: 403 });
      return new Response(`<meta property="og:image" content="https://cdn.example/shoe.jpg" />`, {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchLinkPreview("https://shoes.example/x")).resolves.toEqual({
      imageUrl: "https://cdn.example/shoe.jpg",
      title: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
