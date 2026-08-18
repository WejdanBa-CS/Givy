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
});
