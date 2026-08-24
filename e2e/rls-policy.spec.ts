import { test, expect } from '@playwright/test';

test.describe('Supabase RLS Policy Enforcement', () => {
  test('should not allow users to view other users\' lists', async ({ page }) => {
    // This test assumes you have test users set up
    // Sign in as user A
    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', 'user-a@test.com');
    await page.fill('input[type="password"]', 'test-password');
    await page.click('button:has-text("Sign In")');
    
    // Get current user's list ID from the browser
    const userAListId = await page.evaluate(() => localStorage.getItem('userListId'));
    
    // Try to access another user's list via API (simulating unauthorized access)
    const response = await page.request.get(`/api/lists/other-user-list-id`, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Should be forbidden
    expect(response.status()).toBe(403);
  });

  test('should not allow editing items on lists you don\'t own', async ({ page }) => {
    // Sign in
    await page.goto('/auth/signin');
    // ... sign in steps ...
    
    // Try to update an item on someone else's list
    const response = await page.request.patch(`/api/items/other-user-item-id`, {
      data: { name: 'Hacked Item' },
      headers: { 'Content-Type': 'application/json' },
    });
    
    expect(response.status()).toBe(403);
  });

  test('should isolate shipping addresses to list owner only', async ({ page }) => {
    // Anonymous visitor claims a gift
    await page.goto('/g/public-share-code');
    await page.click('button:has-text("Claim")');
    
    // Try to fetch the list with shipping address
    const response = await page.request.get(`/api/lists/public-share-code`);
    const data = await response.json();
    
    // Should not include recipient_address or should be null
    expect(data.recipient_address).toBeNull();
    expect(data.recipient_address).not.toBeDefined();
  });
});
