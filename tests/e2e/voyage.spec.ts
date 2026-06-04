import { test, expect } from '@playwright/test';

test('all six station kickers are present on the French journey', async ({ page }) => {
  await page.goto('/');
  for (const n of [0, 1, 2, 3, 4, 5]) {
    await expect(page.getByText(`Station ${n}`, { exact: false }).first()).toBeVisible();
  }
});

test('reduced-motion shows every station statically (no stuck content)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  // Le contenu doit être lisible sans animation : les 6 kickers visibles.
  for (const n of [0, 1, 2, 3, 4, 5]) {
    await expect(page.getByText(`Station ${n}`, { exact: false }).first()).toBeVisible();
  }
  // La dernière station est atteignable et son titre est rendu.
  await expect(page.getByRole('heading', { name: 'Le vertige du cosmos' })).toBeVisible();
});

test('English journey renders the deep-sky station', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.getByRole('heading', { name: 'The vertigo of the cosmos' })).toBeVisible();
});
