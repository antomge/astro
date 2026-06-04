import { test, expect } from '@playwright/test';

test('French home shows the liftoff station and the moon widget', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Levez les yeux' })).toBeVisible();
  await expect(page.getByText('Phase de la Lune')).toBeVisible();
});

test('language switch navigates to the English home', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(page.getByRole('heading', { name: 'Look up' })).toBeVisible();
});
