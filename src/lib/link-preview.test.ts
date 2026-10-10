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
});
