import { test, expect } from '@playwright/test';

test('French home shows the liftoff station and the moon widget', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Levez les yeux' })).toBeVisible();
  const moon = page.locator('[data-station="moon"]');
  await moon.scrollIntoViewIfNeeded();
  await expect(page.getByText('Phase de la Lune').first()).toBeVisible();
});

test('language switch navigates to the English home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(page.getByRole('heading', { name: 'Look up' })).toBeVisible();
});
