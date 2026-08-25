import { describe, expect, it } from "vitest";
import { scrubSentryEvent, scrubSentryUrl } from "@/lib/sentry-privacy";

describe("scrubSentryUrl", () => {
  it("redacts invite codes and strips query/hash data from absolute URLs", () => {
    expect(
      scrubSentryUrl(
        "https://www.givy.gifts/invite/BETA-SECRET?source=email#accept",
      ),
    ).toBe("https://www.givy.gifts/invite/[code]");
  });

  it("strips query and hash data from relative application paths", () => {
    expect(scrubSentryUrl("/app/profile?tab=security#password")).toBe(
      "/app/profile",
    );
  });
});

describe("scrubSentryEvent", () => {
  it("removes sensitive invite telemetry while retaining useful route context", () => {
    const event = scrubSentryEvent({
      type: undefined,
      request: {
        url: "https://www.givy.gifts/invite/BETA-SECRET?source=email",
        headers: {
          referer: "https://mail.example/invite/BETA-SECRET",
          "content-type": "application/json",
        },
        data: { invite: "BETA-SECRET" },
      },
      transaction: "/invite/BETA-SECRET?source=email",
      breadcrumbs: [
        {
          category: "fetch",
          data: {
            url: "https://www.givy.gifts/invite/BETA-SECRET?source=email",
            from: "/invite/BETA-SECRET",
          },
        },
      ],
    });

    expect(event.request?.url).toBe("https://www.givy.gifts/invite/[code]");
    expect(event.request?.headers).toEqual({
      "content-type": "application/json",
    });
    expect(event.request?.data).toBeUndefined();
    expect(event.transaction).toBe("/invite/[code]");
    expect(event.breadcrumbs?.[0]?.data).toEqual({
      url: "https://www.givy.gifts/invite/[code]",
      from: "/invite/[code]",
    });
  });
});
