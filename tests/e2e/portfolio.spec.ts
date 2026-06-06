import { test, expect } from '@playwright/test';

test('the footer is present with the About and source links (FR home)', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'À propos' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Code source' })).toBeVisible();
});

test('the About page renders (FR and EN)', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'À propos', level: 1 })).toBeVisible();
  await expect(page.getByRole('main').getByText('Antoine Megange')).toBeVisible();
  await page.goto('/en/about');
  await expect(page.getByRole('heading', { name: 'About', level: 1 })).toBeVisible();
});

test('the home shows a scroll cue', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#scroll-cue')).toBeVisible();
});
