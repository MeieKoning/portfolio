import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const formConfigured = !readFileSync('src/config.js', 'utf8').includes("FORMSPREE_ID = 'YOUR_FORM_ID'");

// Collect console errors/warnings and uncaught exceptions for every test.
test.beforeEach(async ({ page }, testInfo) => {
  testInfo.consoleProblems = [];
  page.on('console', (m) => {
    // Headless Chromium renders WebGL in software and logs GPU driver notices
    // ("GPU stall due to ReadPixels"). They come from the test browser, not the site.
    if (m.text().includes('GL Driver Message')) return;
    if (['error', 'warning'].includes(m.type())) testInfo.consoleProblems.push(m.text());
  });
  page.on('pageerror', (e) => testInfo.consoleProblems.push(e.message));
  await page.goto('/');
  // Font swaps change section heights; interact once the layout is final.
  await page.evaluate(() =>
    Promise.all([document.fonts.load('700 16px "Space Grotesk Variable"'), document.fonts.load('12px "Space Mono"')]),
  );
  await page.waitForTimeout(300); // let the layout and scroll triggers settle
});

test.afterEach(async ({}, testInfo) => {
  expect(testInfo.consoleProblems, 'console errors or warnings').toEqual([]);
});

// Where a section's top sits relative to the top of the scroll container (0 = at the top).
const topInView = (page, id) =>
  page.evaluate((id) => {
    const sc = document.getElementById('scroller');
    const el = document.getElementById(id);
    const max = sc.scrollHeight - sc.clientHeight;
    // The last section may not reach the top when the page ends first.
    if (Math.abs(sc.scrollTop - max) < 2) return 0;
    return Math.round(el.getBoundingClientRect().top - sc.getBoundingClientRect().top);
  }, id);
const expectSectionAtTop = (page, id) =>
  expect.poll(() => topInView(page, id), { timeout: 10000 }).toBeGreaterThanOrEqual(-2).then(() =>
    expect.poll(() => topInView(page, id), { timeout: 10000 }).toBeLessThanOrEqual(80),
  );

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
  test(`nav link scrolls to #${id} and marks it active`, async ({ page, isMobile }) => {
    if (isMobile) {
      await page.getByRole('button', { name: /menu/i }).click();
      await expect(page.locator('#site-nav')).toBeVisible();
    }
    await page.locator(`#site-nav a[href="#${id}"]`).click();
    await expectSectionAtTop(page, id);
    await expect(page.locator(`#${id} h2`)).toBeInViewport();
    await expect(page.locator(`#site-nav a[href="#${id}"]`)).toHaveAttribute('aria-current', 'true');
  });
}

test('hero buttons scroll to projects and services', async ({ page }) => {
  await page.getByRole('link', { name: 'See my work' }).click();
  await expectSectionAtTop(page, 'work');
  await page.locator('.logo').click();
  await expect.poll(() => page.evaluate(() => document.getElementById('scroller').scrollTop), { timeout: 10000 }).toBe(0);
  await page.getByRole('link', { name: 'Work with us' }).click();
  await expectSectionAtTop(page, 'services');
});

test('scrolling back up restores the hero', async ({ page }) => {
  await page.locator('#site-nav a[href="#about"]').dispatchEvent('click');
  await expectSectionAtTop(page, 'about');
  await page.locator('.logo').dispatchEvent('click');
  await expect.poll(() => page.evaluate(() => document.getElementById('scroller').scrollTop), { timeout: 10000 }).toBe(0);
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.querySelector('.hero__words')).opacity))
    .toBe('1');
  await expect(page.locator('.hero__lead')).toBeInViewport();
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

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no smooth scrolling, no pinning, content still reachable', async ({ page }) => {
    await expect(page.locator('#scroller')).not.toHaveClass(/lenis/);
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await page.locator('a[href="#contact"]').first().dispatchEvent('click');
    await expectSectionAtTop(page, 'contact');
    await expect(page.locator('#contact h2')).toBeVisible();
  });
});
