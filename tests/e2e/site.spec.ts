import { expect, test } from '@playwright/test';

const pages = [
  { path: '/', h1: 'Dhruv Sehgal' },
  { path: '/work/gestureiq', h1: 'GestureIQ' },
  { path: '/work/stockpred', h1: 'StockPred' },
  { path: '/work/pravah', h1: 'PRAVAH' },
  { path: '/work/kareerist', h1: 'Kareerist' },
];

test.describe('prerendered content works with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });
  for (const p of pages) {
    test(p.path, async ({ page }) => {
      const res = await page.goto(p.path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(p.h1);
      await expect(page.locator('main#main')).toBeVisible();
      expect(await page.title()).toContain(p.h1 === 'Dhruv Sehgal' ? 'Dhruv Sehgal —' : p.h1);
      expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy();
    });
  }

  test('unknown URLs get the static 404 page with status 404', async ({ page }) => {
    const res = await page.goto('/no-such-station');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Nothing on this station.');
    await expect(page.locator('script[src]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Back to the studio' })).toHaveAttribute('href', '/');
  });
});

test.describe('initial scripts', () => {
  test('every page loads the same single small script and no React', async ({ page }) => {
    const pending: Promise<number>[] = [];
    page.on('response', (r) => {
      if (r.request().resourceType() !== 'script' || r.status() >= 300) return; // redirects have no body
      pending.push(r.body().then((b) => b.length));
    });
    const srcs: string[][] = [];
    for (const p of ['/', '/work/pravah']) {
      await page.goto(p);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('html')).toHaveAttribute('data-js', '1');
      srcs.push(await page.locator('script[src]').evaluateAll((els) => els.map((e) => (e as HTMLScriptElement).src)));
    }
    // One external script per page, the identical file on both (the second page reuses the cached copy).
    expect(srcs.map((s) => s.length)).toEqual([1, 1]);
    expect(srcs[0]).toEqual(srcs[1]);
    const sizes = await Promise.all(pending);
    expect(sizes).toHaveLength(1);
    expect(sizes[0]).toBeLessThan(5_000);
  });
});

test.describe('load without errors', () => {
  for (const p of pages) {
    test(`${p.path} loads without console errors`, async ({ page }) => {
      const problems: string[] = [];
      page.on('console', (m) => {
        if (m.type() === 'error' || /hydrat/i.test(m.text())) problems.push(m.text());
      });
      page.on('pageerror', (e) => problems.push(e.message));
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');
      expect(problems).toEqual([]);
    });
  }
});

test.describe('motion gate (before first paint)', () => {
  test('full by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
  });
  test('static with prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'static');
  });
});

test.describe('preview builds show placeholders visibly', () => {
  test('unresolved facts carry a VERIFY tag', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-fact-status="verify"]').first()).toBeVisible();
    await expect(page.locator('.status-tag').first()).toHaveText('VERIFY');
  });
});

test.describe('keyboard', () => {
  test('first Tab reaches the skip link, which moves focus to main', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'checked in Chromium for M0');
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });
});

test.describe('hardware probe', () => {
  test('runs offline and produces a JSON report', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (r) => {
      if (!r.url().startsWith('http://localhost:4173')) external.push(r.url());
    });
    // ?quick: 40 frames — headless Chromium renders with SwiftShader (software), so the full test is slow.
    await page.goto('/dev/probe.html?quick');
    await page.getByRole('button', { name: 'Run probe' }).click();
    await expect(page.getByRole('status')).toContainText(/Done\.|Download/, { timeout: 60_000 });
    const json = JSON.parse(await page.locator('#out').inputValue());
    expect(json).toHaveProperty('webgl2Strict.ok');
    expect(json).toHaveProperty('signals.hardwareConcurrency');
    expect(json).toHaveProperty('fillTest');
    expect(json).toHaveProperty('signals.os');
    expect(json).toHaveProperty('provisionalTier.tier');
    // Capability probe only: rendering speed is not measured unless the optional button is pressed.
    expect(json.fillTest.ran).toBe(false);
    expect(external).toEqual([]);
  });

  test('optional fill test is separate and adds its result to the JSON', async ({ page }) => {
    await page.goto('/dev/probe.html?quick');
    await page.getByRole('button', { name: 'Run probe' }).click();
    const fill = page.getByRole('button', { name: 'Run optional fill test' });
    test.skip(await fill.isDisabled(), 'no hardware WebGL2 in this browser');
    await fill.click();
    await expect(page.getByRole('status')).toContainText('Fill test done', { timeout: 60_000 });
    const json = JSON.parse(await page.locator('#out').inputValue());
    expect(json.fillTest.ran).toBe(true);
  });
});
