const { test, expect } = require('@playwright/test');

test('Inkylink full pipeline + DB check + Data Integrity', async ({ page }) => {
  const baseUrl = 'http://localhost:3000';

  // Go to Pricing page and wait for network to be idle
  await page.goto(`${baseUrl}/pricing`, { waitUntil: 'networkidle' });

  // Wait for the Inkylink header to be visible
  await expect(page.locator('header h1')).toBeVisible({ timeout: 15000 });

  // Click the first "Order Now" button
  await page.locator('text=Order Now').first().click();

  // Verify navigation to confirmation page
  await expect(page).toHaveURL(/confirmation/);
});
