import { test, expect } from '@playwright/test';

test('atlas index lists objects and a detail page opens (FR)', async ({ page }) => {
  await page.goto('/atlas');
  await expect(page.getByRole('heading', { name: /Atlas/, level: 1 })).toBeVisible();
  await page.getByRole('link', { name: /Orion/ }).first().click();
  await expect(page).toHaveURL(/\/atlas\/orion\/?$/);
  await expect(page.getByRole('heading', { name: /Orion/, level: 1 })).toBeVisible();
  await expect(page.getByText('Pour aller plus loin')).toBeVisible();
});

test('gear and glossary pages render (FR)', async ({ page }) => {
  await page.goto('/gear');
  await expect(page.getByRole('heading', { name: /Coin Matériel/, level: 1 })).toBeVisible();
  await page.goto('/glossary');
  await expect(page.getByRole('heading', { name: 'Glossaire', level: 1 })).toBeVisible();
  await expect(page.getByText('Magnitude')).toBeVisible();
});

test('the moon station links to its atlas entry (FR home)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href="/atlas/la-lune"]')).toHaveCount(1);
});

test('English atlas index renders', async ({ page }) => {
  await page.goto('/en/atlas');
  await expect(page.getByRole('heading', { name: 'The Atlas', level: 1 })).toBeVisible();
});
