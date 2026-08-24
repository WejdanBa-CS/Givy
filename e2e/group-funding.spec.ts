import { test, expect } from '@playwright/test';

test.describe('Group Funding Feature', () => {
  test('should mark high-value item as group fund', async ({ page }) => {
    await page.goto('/app');
    
    // Create new list
    await page.click('button:has-text("New List")');
    await page.fill('input[placeholder*="occasion"]', 'Wedding');
    
    // Add expensive item
    await page.click('button:has-text("Add Item")');
    await page.fill('input[placeholder*="item name"]', 'Honeymoon Fund');
    await page.fill('input[type="number"]', '5000');
    
    // Enable group funding
    await page.click('input[type="checkbox"][aria-label*="group fund"]');
    
    // Verify fund settings appear
    const fundSettings = page.locator('[data-testid="group-fund-settings"]');
    await expect(fundSettings).toBeVisible();
  });

  test('should allow multiple users to pledge towards group fund', async ({
    page,
    context,
  }) => {
    const shareCode = 'fund-test-code';
    const pledgeAmount = '50';
    
    // User 1 pledges
    await page.goto(`/g/${shareCode}`);
    await page.click('[data-testid="group-fund-item"]');
    await page.click('button:has-text("Pledge")');
    await page.fill('input[type="number"][placeholder*="amount"]', pledgeAmount);
    await page.click('button:has-text("Confirm Pledge")');
    
    // Verify pledge added
    await expect(page.locator('text=You pledged')).toBeVisible();
    
    // User 2 pledges
    const page2 = await context.newPage();
    await page2.goto(`/g/${shareCode}`);
    await page2.click('[data-testid="group-fund-item"]');
    await page2.click('button:has-text("Pledge")');
    await page2.fill('input[type="number"][placeholder*="amount"]', pledgeAmount);
    await page2.click('button:has-text("Confirm Pledge")');
    
    // Verify total is aggregated
    const fundTotal = await page.locator('[data-testid="fund-total"]').textContent();
    expect(fundTotal).toContain('100'); // 50 + 50
    
    await page2.close();
  });

  test('should prevent over-pledging on group fund', async ({ page }) => {
    await page.goto('/g/fund-test-code');
    
    // Fund target is $100
    await page.click('[data-testid="group-fund-item"]');
    await page.click('button:has-text("Pledge")');
    
    // Try to pledge more than remaining
    await page.fill('input[type="number"][placeholder*="amount"]', '150');
    await page.click('button:has-text("Confirm Pledge")');
    
    // Should show error
    await expect(page.locator('text=exceeds remaining')).toBeVisible();
  });
});
