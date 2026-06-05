import { test, expect } from '@playwright/test';

test('home exposes canonical, hreflang and Open Graph meta', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /nocturne\.pages\.dev\/$/);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/?$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.png$/);
});

test('the mobile menu toggles open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Menu' });
  await expect(toggle).toBeVisible();
  const atlasLink = page.getByRole('navigation').getByRole('link', { name: /Atlas/ });
  await expect(atlasLink).toBeHidden();
  await toggle.click();
  await expect(atlasLink).toBeVisible();
});
