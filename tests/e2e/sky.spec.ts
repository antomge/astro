import { test, expect } from '@playwright/test';

test('French sky map loads with the canvas and featured-object buttons', async ({ page }) => {
  await page.goto('/sky');
  await expect(page.getByRole('heading', { name: 'La Carte du ciel' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Carte du ciel interactive' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Orion' })).toBeVisible();
});

test('selecting a featured object opens and closes the info panel', async ({ page }) => {
  await page.goto('/sky');
  const orion = page.getByRole('button', { name: 'Orion' });
  // Retry the click until React (client:load) has hydrated and the dialog opens.
  await expect(async () => {
    await orion.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(page.getByRole('dialog').getByText('Pour aller plus loin')).toBeVisible();
  await page.getByRole('button', { name: 'Fermer' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('English sky map renders and lists the featured objects', async ({ page }) => {
  await page.goto('/en/sky');
  await expect(page.getByRole('heading', { name: 'The Sky Map' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Orion' })).toBeVisible();
});
