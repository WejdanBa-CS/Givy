import { expect, test } from "@playwright/test";

test.describe("security smoke", () => {
  test("unauthenticated /app redirects to login", async ({ request }) => {
    const res = await request.get("/app", { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(res.status());
    const location = res.headers().location ?? "";
    expect(location).toMatch(/\/login/);
  });

  test("open-redirect next= stays on-site after login page load", async ({
    page,
  }) => {
    await page.goto("/login?next=https://evil.example", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    // Client should sanitize before OAuth; ensure evil host is not linked
    await expect(page.locator('a[href*="evil.example"]')).toHaveCount(0);
    await expect(page.locator('form[action*="evil.example"]')).toHaveCount(0);
  });

  test("unknown share code does not leak shipping address UI", async ({
    page,
  }) => {
    await page.goto("/g/does-not-exist-xyz", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText(/no givy here|couldn.?t open/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/ship to:/i)).toHaveCount(0);
  });

  test("does not expose env or git metadata", async ({ request }) => {
    const env = await request.get("/.env");
    expect(env.status()).toBeGreaterThanOrEqual(400);
    const git = await request.get("/.git/config");
    expect(git.status()).toBeGreaterThanOrEqual(400);
  });

  test("auth callback without code returns to login error", async ({
    request,
  }) => {
    const res = await request.get("/auth/callback", { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(res.status());
    const location = res.headers().location ?? "";
    expect(location).toMatch(/\/login/);
  });

  test("protocol-relative next= is not used as a link target", async ({
    page,
  }) => {
    await page.goto("/login?next=//evil.example/phish", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.locator('a[href*="evil.example"]')).toHaveCount(0);
    await expect(page.locator('[href^="//evil"]')).toHaveCount(0);
  });

  test("landing page loads without console crash", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /givy/i }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /one list/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /guest view/i })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("signup route opens the create-account form", async ({ page }) => {
    const res = await page.goto("/signup", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/signup/);
    await expect(
      page.getByRole("heading", { name: /create your givy/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeVisible();
  });

  test("Start free on the landing page opens signup", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /start free/i }).first().click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(
      page.getByRole("heading", { name: /create your givy/i }),
    ).toBeVisible();
  });

  test("landing preview shows group-fund contribute copy", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("tab", { name: /guest view/i })).toBeVisible();
    await expect(page.getByText("Contribute now")).toBeVisible();
    await page.getByRole("tab", { name: /your view/i }).click();
    await expect(page.getByRole("tab", { name: /your view/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("privacy and terms pages load", async ({ page }) => {
    await page.goto("/privacy", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /^privacy$/i })).toBeVisible();
    await page.goto("/terms", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /^terms$/i })).toBeVisible();
    await expect(
      page.getByText(/does not yet process card payments/i),
    ).toBeVisible();
  });

  test("invalid shop redirect is a 404, not a 500", async ({ request }) => {
    const bad = await request.get("/go/not-a-uuid", { maxRedirects: 0 });
    expect(bad.status()).toBeGreaterThanOrEqual(400);
    expect(bad.status()).toBeLessThan(500);

    const localId = await request.get("/go/gift_localdemo", { maxRedirects: 0 });
    expect(localId.status()).toBeGreaterThanOrEqual(400);
    expect(localId.status()).toBeLessThan(500);
  });

  test("notify-owner rejects cross-site POST", async ({ request }) => {
    const res = await request.post("/api/claims/notify-owner", {
      headers: {
        "Content-Type": "application/json",
        origin: "https://evil.example",
      },
      data: { itemId: "11111111-2222-4333-a444-555555555555" },
    });
    expect(res.status()).toBe(403);
  });

  test("guest testers can pledge on a shared demo list", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const guest = page.getByRole("button", { name: /continue as guest/i });
    if (!(await guest.isVisible())) {
      test.skip(true, "Guest mode is off in this environment");
      return;
    }
    await guest.click();
    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 });
    await page.getByRole("link", { name: /shared view/i }).click();
    await expect(page).toHaveURL(/\/g\//);
    const confirm = page.getByRole("button", { name: /yes — this is/i });
    if (await confirm.isVisible()) {
      await confirm.click();
    }
    await expect(
      page.getByText(/ensure you received this link/i).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: /contribute now/i }).click();
    await expect(page.getByText(/nothing is charged here/i)).toBeVisible();
    await page.getByLabel(/amount \(usd\)/i).fill("10");
    await page.getByRole("button", { name: /^contribute now$/i }).last().click();
    await expect(page.getByText(/pledge recorded/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe("mobile landing", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("hero and Start free stay usable on a phone", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /one list/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /start free/i }).first(),
    ).toBeVisible();
  });
});
