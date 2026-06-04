import { test, expect } from '@playwright/test';

const STATION_IDS = ['liftoff', 'moon', 'solar-system', 'stars', 'nebulae', 'galaxies'];

test('every station reveals its content as you scroll the French journey', async ({ page }) => {
  await page.goto('/');
  for (const id of STATION_IDS) {
    const section = page.locator(`[data-station="${id}"]`);
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByText('Station', { exact: false }).first()).toBeVisible();
  }
});

test('reduced-motion shows every station statically (no stuck content)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const n of [0, 1, 2, 3, 4, 5]) {
    await expect(page.getByText(`Station ${n}`, { exact: false }).first()).toBeVisible();
  }
  await expect(page.getByRole('heading', { name: 'Le vertige du cosmos' })).toBeVisible();
});

test('English journey reveals the deep-sky station on scroll', async ({ page }) => {
  await page.goto('/en/');
  const section = page.locator('[data-station="galaxies"]');
  await section.scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'The vertigo of the cosmos' })).toBeVisible();
});
