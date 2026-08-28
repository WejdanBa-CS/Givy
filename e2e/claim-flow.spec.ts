import { test, expect } from '@playwright/test';

test.describe('Gift Claim Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start with demo mode or local auth
    await page.goto('/app');
  });

  test('should create a gift list and finalize for sharing', async ({ page }) => {
    // Navigate to create list
    await page.click('button:has-text("New List")');
    
    // Fill in occasion details
    await page.fill('input[placeholder*="occasion"]', 'Birthday');
    await page.fill('input[type="date"]', '2026-12-25');
    
    // Add a gift item
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="item name"]', 'Wireless Headphones');
    await page.fill('input[type="number"]', '79.99');
    
    // Finalize and get share link
    await page.click('button:has-text("Finalize")');
    
    // Verify share code is generated
    const shareCode = await page.locator('[data-testid="share-code"]').textContent();
    expect(shareCode).toMatch(/^[a-zA-Z0-9]{6,}$/);
  });

  test('should allow anonymous claim without revealing address', async ({ page }) => {
    // Open list from share code
    await page.goto('/g/demo-code-123');
    
    // Should not see shipping address initially
    const addressField = page.locator('[data-testid="recipient-address"]');
    await expect(addressField).not.toBeVisible();
    
    // Claim a gift
    await page.click('button:has-text("Claim")');
    
    // Should still not see address (only owner does)
    await expect(addressField).not.toBeVisible();
    
    // Verify claim confirmation
    const confirmation = page.locator('[data-testid="claim-success"]');
    await expect(confirmation).toBeVisible();
  });

  test('should show celebration animation on claim', async ({ page }) => {
    await page.goto('/g/demo-code-123');
    
    // Enable celebration animation
    await page.click('input[type="checkbox"][aria-label*="celebrate"]');
    await page.click('button:has-text("Claim")');
    
    // Check for animation
    const celebration = page.locator('[data-testid="celebration-animation"]');
    await expect(celebration).toBeVisible();
  });

  test('should prevent duplicate claims on same item', async ({ page }) => {
    const page2 = await page.context().newPage();
    const shareCode = 'test-share-code';
    
    // User 1 claims item
    await page.goto(`/g/${shareCode}`);
    await page.click('button:has-text("Claim")');
    
    // User 2 tries to claim same item
    await page2.goto(`/g/${shareCode}`);
    const claimButton = page2.locator('button:has-text("Claim")').first();
    
    // Button should be disabled or show "Already claimed"
    await expect(claimButton).toBeDisabled();
    
    await page2.close();
  });
});
