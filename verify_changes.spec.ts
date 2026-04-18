import { test, expect } from '@playwright/test';

test('verify branding and terminology', async ({ page }) => {
  await page.goto('http://localhost:8080/');

  // Verify branding on landing
  await expect(page.locator('text=StackVault').first()).toBeVisible();
  await expect(page.locator('text=DreamEra')).not.toBeVisible();

  // Verify LTD mentions
  const bodyText = await page.innerText('body');
  expect(bodyText).toContain('LTD');
  expect(bodyText).not.toContain('AppSumo');

  // Go to Auth page
  await page.goto('http://localhost:8080/auth');
  await expect(page.locator('text=Welcome to StackVault')).toBeVisible();

  await page.screenshot({ path: '/home/jules/verification/landing_v2.png' });

  // Try to find if LTD is in any badge if we can trigger some demo tools
  // But that might be hard without being logged in.
});
