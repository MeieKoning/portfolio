import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const formConfigured = !readFileSync('src/config.js', 'utf8').includes("FORMSPREE_ID = 'YOUR_FORM_ID'");

// Collect console errors/warnings and uncaught exceptions for every test.
test.beforeEach(async ({ page }, testInfo) => {
  testInfo.consoleProblems = [];
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type())) testInfo.consoleProblems.push(m.text());
  });
  page.on('pageerror', (e) => testInfo.consoleProblems.push(e.message));
  await page.goto('/');
});

test.afterEach(async ({}, testInfo) => {
  expect(testInfo.consoleProblems, 'console errors or warnings').toEqual([]);
});

const scrollTopOf = (page) => page.evaluate(() => document.getElementById('scroller').scrollTop);
const offsetOf = (page, id) => page.evaluate((id) => document.getElementById(id).offsetTop, id);

test('page loads with hero and key sections', async ({ page }) => {
  await expect(page).toHaveTitle(/Meie Koning/);
  await expect(page.locator('h1')).toContainText('Meie Koning');
  await expect(page.locator('.hero__word')).toHaveCount(3);
  for (const id of ['work', 'experience', 'about', 'services', 'contact']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-image\.png/);
  // no horizontal scroll
  const overflow = await page.evaluate(() => {
    const s = document.getElementById('scroller');
    return s.scrollWidth - s.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const id of ['work', 'about', 'services', 'contact']) {
  test(`nav link scrolls to #${id}`, async ({ page, isMobile }) => {
    if (isMobile) {
      await page.getByRole('button', { name: /menu/i }).click();
      await expect(page.locator('#site-nav')).toBeVisible();
    }
    await page.locator(`#site-nav a[href="#${id}"]`).click();
    const target = await offsetOf(page, id);
    const max = await page.evaluate(() => {
      const s = document.getElementById('scroller');
      return s.scrollHeight - s.clientHeight;
    });
    await expect.poll(() => scrollTopOf(page), { timeout: 10000 }).toBeCloseTo(Math.min(target, max), -1);
    await expect(page.locator(`#${id} h2`)).toBeInViewport();
  });
}

test('hero buttons scroll to projects and services', async ({ page }) => {
  await page.getByRole('link', { name: 'See my work' }).click();
  await expect.poll(() => scrollTopOf(page)).toBeCloseTo(await offsetOf(page, 'work'), -1);
  await page.locator('.scroller').evaluate((s) => (s.scrollTop = 0));
  await page.getByRole('link', { name: 'Work with us' }).click();
  await expect.poll(() => scrollTopOf(page)).toBeCloseTo(await offsetOf(page, 'services'), -1);
});

test('contact form validates empty and invalid input', async ({ page }) => {
  const form = page.locator('#contact-form');
  await form.getByRole('button', { name: /send/i }).click();
  await expect(page.locator('#f-name-error')).toHaveText(/enter your name/i);
  await expect(page.locator('#f-email-error')).toHaveText(/enter your email/i);
  await expect(page.locator('#f-message-error')).toHaveText(/short message/i);
  await expect(page.locator('#f-name')).toBeFocused();

  await page.fill('#f-name', 'Test Recruiter');
  await page.fill('#f-email', 'not-an-email');
  await page.fill('#f-message', 'We have an internship for you.');
  await form.getByRole('button', { name: /send/i }).click();
  await expect(page.locator('#f-name-error')).toBeEmpty();
  await expect(page.locator('#f-email-error')).toHaveText(/does not look right/i);
  await expect(page.locator('#f-email')).toHaveAttribute('aria-invalid', 'true');
});

test('contact toggle changes the placeholders', async ({ page }) => {
  await expect(page.locator('#f-message')).toHaveAttribute('placeholder', /role/i);
  await page.locator('label[for="intent-project"]').click();
  await expect(page.locator('#f-message')).toHaveAttribute('placeholder', /build/i);
});

test('contact form submits to Formspree', async ({ page }) => {
  test.skip(!formConfigured, 'Formspree ID not configured yet');
  await page.route('https://formspree.io/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  );
  await page.fill('#f-name', 'Test Client');
  await page.fill('#f-email', 'client@example.com');
  await page.fill('#f-message', 'I have an idea for an app.');
  await page.getByRole('button', { name: /send/i }).click();
  await expect(page.locator('.form__status')).toHaveText(/thanks/i);
});

test('keyboard: skip link is the first tab stop and jumps to main', async ({ page, browserName }) => {
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('custom cursor only on mouse devices; particle canvas renders', async ({ page, isMobile }) => {
  await expect(page.locator('#particles')).toBeAttached();
  const size = await page.locator('#particles').evaluate((c) => c.width * c.height);
  expect(size).toBeGreaterThan(0);
  await expect(page.locator('.cursor-dot')).toHaveCount(isMobile ? 0 : 1);
});
