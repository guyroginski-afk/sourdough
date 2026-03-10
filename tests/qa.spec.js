const { test, expect } = require('@playwright/test');

async function skipWizard(page) {
  await page.goto('/');
  await page.click('button.wiz-skip');
  await expect(page.locator('#wizard-overlay')).toBeHidden();
}

test.describe('Sourdough Calculator', () => {

  test('wizard overlay is visible on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#wizard-overlay')).toBeVisible();
    await expect(page.locator('button.wiz-skip')).toBeVisible();
  });

  test('skip wizard lands on starter tab', async ({ page }) => {
    await skipWizard(page);
    await expect(page.locator('#tab-starter')).toBeVisible();
    await expect(page.locator('#tab-starter')).toHaveClass(/active/);
  });

  test('bread tab shows bread type grid', async ({ page }) => {
    await skipWizard(page);
    await page.locator('.tab-btn').nth(1).click();
    await expect(page.locator('#tab-bread')).toHaveClass(/active/);
    await expect(page.locator('#breadTypesGrid')).toBeVisible();
    await expect(page.locator('.bread-type-btn').first()).toBeVisible();
  });

  test('selecting one bread type shows checkmark and count row', async ({ page }) => {
    await skipWizard(page);
    await page.locator('.tab-btn').nth(1).click();

    const firstBread = page.locator('.bread-type-btn').first();
    await firstBread.click();

    await expect(firstBread).toHaveClass(/active/);
    await expect(firstBread.locator('.bt-check')).toBeVisible();
    await expect(page.locator('#bread-counts-list .bread-count-row')).toHaveCount(1);
  });

  test('selecting two bread types shows both checkmarks and count rows', async ({ page }) => {
    await skipWizard(page);
    await page.locator('.tab-btn').nth(1).click();

    const buttons = page.locator('.bread-type-btn');
    await buttons.nth(0).click();
    await buttons.nth(1).click();

    await expect(buttons.nth(0)).toHaveClass(/active/);
    await expect(buttons.nth(1)).toHaveClass(/active/);
    await expect(buttons.nth(0).locator('.bt-check')).toBeVisible();
    await expect(buttons.nth(1).locator('.bt-check')).toBeVisible();
    await expect(page.locator('#bread-counts-list .bread-count-row')).toHaveCount(2);
  });

  test('clicking calculate shows ingredient results', async ({ page }) => {
    await skipWizard(page);
    await page.locator('.tab-btn').nth(1).click();
    await page.locator('.bread-type-btn').first().click();
    await page.locator('#tab-bread .calc-btn').click();

    const results = page.locator('#bread-results');
    await expect(results).toBeVisible();
    await expect(results.locator('.bread-result-card')).toBeVisible();
    await expect(results.locator('.ingredient-row').first()).toBeVisible();
  });

  test('starter calculator shows results', async ({ page }) => {
    await skipWizard(page);
    await page.locator('#tab-starter .calc-btn').click();
    await expect(page.locator('#starter-results')).toBeVisible();
    await expect(page.locator('#s-nums')).not.toBeEmpty();
  });

});
