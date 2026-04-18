const { test, expect } = require('@playwright/test');

async function skipWizard(page) {
  await page.goto('/');
  await page.click('button.wiz-skip');
  await expect(page.locator('#wizard-overlay')).toBeHidden();
}

async function openBot(page) {
  await skipWizard(page);
  await page.locator('#bot-fab').click();
  await expect(page.locator('#bot-window')).toBeVisible();
}

const MOCK_REPLY = { content: [{ type: 'text', text: 'תשובה לדוגמה מהבוט' }] };
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

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

test.describe('Chatbot', () => {

  test('FAB button is visible after skipping wizard', async ({ page }) => {
    await skipWizard(page);
    await expect(page.locator('#bot-fab')).toBeVisible();
  });

  test('chat window is hidden by default', async ({ page }) => {
    await skipWizard(page);
    await expect(page.locator('#bot-window')).toBeHidden();
  });

  test('clicking FAB opens chat window', async ({ page }) => {
    await skipWizard(page);
    await page.locator('#bot-fab').click();
    await expect(page.locator('#bot-window')).toBeVisible();
  });

  test('opening chat shows welcome message', async ({ page }) => {
    await openBot(page);
    await expect(page.locator('#bot-messages .bot-msg').first()).toBeVisible();
    await expect(page.locator('#bot-messages .bot-bubble').first()).toContainText('שלום');
  });

  test('clicking FAB again closes chat window', async ({ page }) => {
    await openBot(page);
    await page.locator('#bot-fab').click();
    await expect(page.locator('#bot-window')).toBeHidden();
  });

  test('file input accepts images and has no capture attribute', async ({ page }) => {
    await openBot(page);
    const input = page.locator('#bot-file-input');
    await expect(input).toHaveAttribute('accept', 'image/*');
    await expect(input).not.toHaveAttribute('capture');
  });

  test('camera button triggers file input', async ({ page }) => {
    await openBot(page);
    let clicked = false;
    await page.exposeFunction('__onFileInputClick', () => { clicked = true; });
    await page.evaluate(() => {
      document.getElementById('bot-file-input').addEventListener('click', () => window.__onFileInputClick());
    });
    await page.locator('.bot-cam-btn').click();
    expect(clicked).toBe(true);
  });

  test('send button is idle when chat opens', async ({ page }) => {
    await openBot(page);
    await expect(page.locator('#bot-send-btn')).toHaveClass(/idle/);
  });

  test('send button becomes ready when text is typed', async ({ page }) => {
    await openBot(page);
    // pressSequentially fires keydown events which trigger botUpdateSendBtn()
    await page.locator('#bot-textarea').pressSequentially('test');
    await expect(page.locator('#bot-send-btn')).toHaveClass(/ready/);
  });

  test('send button goes idle when text is cleared', async ({ page }) => {
    await openBot(page);
    await page.locator('#bot-textarea').pressSequentially('test');
    await expect(page.locator('#bot-send-btn')).toHaveClass(/ready/);
    // Clear via keyboard and trigger the update
    await page.locator('#bot-textarea').selectText();
    await page.keyboard.press('Backspace');
    await page.evaluate(() => botUpdateSendBtn());
    await expect(page.locator('#bot-send-btn')).toHaveClass(/idle/);
  });

  test('uploading a photo shows image preview', async ({ page }) => {
    await openBot(page);
    await page.locator('#bot-file-input').setInputFiles({
      name: 'starter.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await expect(page.locator('#bot-img-preview')).toBeVisible();
    await expect(page.locator('#bot-img-thumb-img')).toHaveAttribute('src', /^data:image/);
  });

  test('uploading a photo makes send button ready', async ({ page }) => {
    await openBot(page);
    await page.locator('#bot-file-input').setInputFiles({
      name: 'starter.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await expect(page.locator('#bot-send-btn')).toHaveClass(/ready/);
  });

  test('remove button clears image preview and resets send button', async ({ page }) => {
    await openBot(page);
    await page.locator('#bot-file-input').setInputFiles({
      name: 'starter.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await expect(page.locator('#bot-img-preview')).toBeVisible();
    await page.locator('.bot-img-remove').click();
    await expect(page.locator('#bot-img-preview')).toBeHidden();
    await expect(page.locator('#bot-send-btn')).toHaveClass(/idle/);
  });

  test('sending a text message appears in chat and bot replies', async ({ page }) => {
    await page.route('https://sourdough-bot.guyroginski.workers.dev', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPLY) })
    );
    await openBot(page);
    await page.locator('#bot-textarea').fill('מה זה מחמצת?');
    await page.locator('#bot-send-btn').click();

    await expect(page.locator('#bot-messages .bot-msg.user .bot-bubble')).toContainText('מה זה מחמצת?');
    await expect(page.locator('#bot-messages .bot-msg.bot').last().locator('.bot-bubble'))
      .toContainText('תשובה לדוגמה מהבוט', { timeout: 8000 });
  });

  test('textarea is cleared after sending', async ({ page }) => {
    await page.route('https://sourdough-bot.guyroginski.workers.dev', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPLY) })
    );
    await openBot(page);
    await page.locator('#bot-textarea').fill('שאלה');
    await page.locator('#bot-send-btn').click();
    await expect(page.locator('#bot-textarea')).toHaveValue('');
  });

  test('Enter key sends message', async ({ page }) => {
    await page.route('https://sourdough-bot.guyroginski.workers.dev', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPLY) })
    );
    await openBot(page);
    await page.locator('#bot-textarea').fill('שאלה');
    await page.locator('#bot-textarea').press('Enter');
    await expect(page.locator('#bot-messages .bot-msg.user')).toBeVisible();
  });

  test('sending image-only message shows image in chat and bot replies', async ({ page }) => {
    await page.route('https://sourdough-bot.guyroginski.workers.dev', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPLY) })
    );
    await openBot(page);
    await page.locator('#bot-file-input').setInputFiles({
      name: 'bread.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await page.locator('#bot-send-btn').click();

    await expect(page.locator('#bot-messages .bot-msg.user .bot-msg-img')).toBeVisible();
    await expect(page.locator('#bot-messages .bot-msg.bot').last().locator('.bot-bubble'))
      .toContainText('תשובה לדוגמה מהבוט', { timeout: 8000 });
  });

  test('image preview is cleared after sending', async ({ page }) => {
    await page.route('https://sourdough-bot.guyroginski.workers.dev', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_REPLY) })
    );
    await openBot(page);
    await page.locator('#bot-file-input').setInputFiles({
      name: 'bread.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await page.locator('#bot-send-btn').click();
    await expect(page.locator('#bot-img-preview')).toBeHidden();
  });

});
