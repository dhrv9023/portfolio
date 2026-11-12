import { expect, test, type Page } from '@playwright/test';

/**
 * M1: header + hero at the three approved sizes, the menu, the quality control, and load stability.
 * These tests set their own viewports, so they run once (desktop Chromium project).
 */
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'sets its own viewports');
});

const sizes = [
  { name: 'mobile 390', w: 390, h: 844, still: 'hero-mobile.svg' },
  { name: 'tablet 834', w: 834, h: 1112, still: 'hero-tablet.svg' },
  { name: 'desktop 1440', w: 1440, h: 900, still: 'hero-desktop.svg' },
  { name: 'wide 1920', w: 1920, h: 1080, still: 'hero-desktop.svg' },
  { name: 'phone landscape 844x390', w: 844, h: 390, still: 'hero-tablet.svg' },
];

async function open(page: Page, w: number, h: number) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('html')).toHaveAttribute('data-js', '1');
}

test.describe('hero layout', () => {
  for (const s of sizes) {
    test(`${s.name}: fits, loads the right still, tappable controls`, async ({ page }) => {
      await open(page, s.w, s.h);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);

      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText('Dhruv Sehgal');
      const box = await h1.boundingBox();
      expect((box?.x ?? -1) + (box?.width ?? 0)).toBeLessThanOrEqual(s.w);

      const img = page.locator('.hero__stage img');
      await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
      expect(await img.evaluate((i: HTMLImageElement) => i.currentSrc)).toContain(s.still);

      for (const link of await page.locator('.hero__cta a').all()) {
        expect((await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
    });
  }

  test('desktop: first view shows the whole hero (name, lead, calls to action) without scrolling', async ({ page }) => {
    await open(page, 1440, 900);
    for (const sel of ['h1', '.hero .lead', '.hero__cta']) await expect(page.locator(sel)).toBeInViewport({ ratio: 1 });
  });

  // Annotations are shown only for aspect 8:5–9:5 at ≥1200px wide; elsewhere they are omitted.
  for (const [w, h] of [[1024, 768], [1200, 800], [2560, 1080], [2400, 1200]] as const) {
    test(`desktop ${w}x${h}: annotations are omitted (outside the composition's safe range)`, async ({ page }) => {
      await open(page, w, h);
      await expect(page.locator('.hero__annotations')).toBeHidden();
      await expect(page.locator('h1')).toBeInViewport();
    });
  }
  for (const [w, h] of [[1280, 720], [1366, 768], [1440, 900], [1600, 900], [1920, 1080], [2560, 1440]] as const) {
    test(`desktop ${w}x${h}: annotation labels stay on screen and clear of the chapter index`, async ({ page }) => {
      await open(page, w, h);
      await expect(page.locator('.hero__annotations')).toBeVisible();
      const r = await page.evaluate(() => {
        const nav = document.querySelector('.hero__foot nav')!.getBoundingClientRect();
        const tspans = Array.from(document.querySelectorAll('.hero__annotations tspan')).map((e) => e.getBoundingClientRect());
        const cue = document.querySelector('.hero__cue')!.getBoundingClientRect();
        const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        return {
          overlapNav: tspans.filter((t) => hit(t, nav)).length,
          overlapCue: tspans.filter((t) => hit(t, cue)).length,
          offscreen: tspans.filter((t) => t.right > window.innerWidth || t.left < 0 || t.bottom > window.innerHeight || t.top < 0).length,
        };
      });
      expect(r).toEqual({ overlapNav: 0, overlapCue: 0, offscreen: 0 });
    });
  }

  test('phone landscape: name, lead and buttons are all in the first screen', async ({ page }) => {
    await open(page, 844, 390);
    for (const sel of ['h1', '.hero .lead', '.hero__cta']) await expect(page.locator(sel)).toBeInViewport({ ratio: 1 });
  });

  test('annotations are decorative and desktop-only', async ({ page }) => {
    await open(page, 1440, 900);
    await expect(page.locator('.hero__annotations')).toBeVisible();
    await expect(page.locator('.hero__annotations')).toHaveAttribute('aria-hidden', 'true');
    await open(page, 834, 1112);
    await expect(page.locator('.hero__annotations')).toBeHidden();
  });
});

test.describe('load stability', () => {
  for (const s of sizes.slice(0, 3)) {
    test(`${s.name}: no layout shift; LCP is the hero still or the name`, async ({ page }) => {
      await page.setViewportSize({ width: s.w, height: s.h });
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const m = await page.evaluate(
        () =>
          new Promise<{ cls: number; lcp: number; lcpTag: string }>((resolve) => {
            let cls = 0, lcp = 0, lcpTag = '';
            new PerformanceObserver((l) => {
              for (const e of l.getEntries() as unknown as { hadRecentInput: boolean; value: number }[]) if (!e.hadRecentInput) cls += e.value;
            }).observe({ type: 'layout-shift', buffered: true });
            new PerformanceObserver((l) => {
              for (const e of l.getEntries() as unknown as { startTime: number; element?: Element }[]) { lcp = e.startTime; lcpTag = e.element?.tagName ?? ''; }
            }).observe({ type: 'largest-contentful-paint', buffered: true });
            setTimeout(() => resolve({ cls, lcp, lcpTag }), 1500);
          }),
      );
      console.log(`${s.name}: CLS ${m.cls.toFixed(4)} · LCP ${m.lcp.toFixed(0)} ms (${m.lcpTag}) — local, unthrottled`);
      expect(m.cls).toBeLessThan(0.01);
      expect(['IMG', 'H1', 'P']).toContain(m.lcpTag);
    });
  }
});

test.describe('menu (below 1024px)', () => {
  test('opens, traps focus, closes with Escape and returns focus', async ({ page }) => {
    await open(page, 390, 844);
    const toggle = page.getByRole('button', { name: 'Menu' });
    const panel = page.locator('#menu-panel');
    await expect(page.locator('.primary-nav')).toBeHidden();
    await expect(panel).toBeHidden();

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(panel).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close' })).toHaveAttribute('aria-expanded', 'true');
    await expect(panel.getByRole('link', { name: /Studio/ })).toBeFocused();

    // Tab around more times than there are stops: focus never leaves the dialog or its toggle.
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const a = document.activeElement;
        return Boolean(a?.closest('#menu-panel') || a?.matches('[data-menu-toggle]'));
      });
      expect(inside).toBe(true);
    }
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('#menu-panel, [data-menu-toggle]')))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
    await expect(page.locator('html')).not.toHaveAttribute('data-menu-open', /.*/);
  });

  test('lists all nine chapters and closes when one is chosen', async ({ page }) => {
    await open(page, 390, 844);
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('#menu-panel nav[aria-label="Chapters"] li')).toHaveCount(9);
    await page.locator('#menu-panel').getByRole('link', { name: /About/ }).click();
    await expect(page.locator('#menu-panel')).toBeHidden();
    await expect(page).toHaveURL(/#about$/);
    await expect(page.locator('#about')).toBeInViewport();
  });

  test('the quality control is inside the menu on phones and works there', async ({ page }) => {
    await open(page, 390, 844);
    await expect(page.locator('.quality')).toBeHidden();
    await page.getByRole('button', { name: 'Menu' }).click();
    const group = page.locator('#menu-panel').getByRole('group', { name: 'Rendering quality' });
    await expect(group.getByRole('radio')).toHaveCount(4);
    await group.getByRole('radio', { name: 'low' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-quality', 'low');
  });

  test('a menu left open is closed when the window grows to desktop width', async ({ page }) => {
    await open(page, 834, 1112);
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('#menu-panel')).toBeHidden();
    await expect(page.locator('html')).not.toHaveAttribute('data-menu-open', /.*/);
  });
});

test.describe('quality control (tablet and desktop)', () => {
  test('keyboard: open, choose with arrows, Escape returns focus; nothing is stored by default', async ({ page }) => {
    await open(page, 1440, 900);
    const toggle = page.getByRole('button', { name: /^Quality/ });
    await expect(toggle).toContainText('Auto');
    await toggle.click();
    const group = page.locator('#quality-pop').getByRole('group', { name: 'Rendering quality' });
    await expect(group).toBeVisible();
    await expect(group.getByRole('radio', { name: 'auto' })).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(group.getByRole('radio', { name: 'high' })).toBeChecked();
    await expect(toggle).toContainText('High');
    await expect(page.locator('html')).toHaveAttribute('data-quality', 'high');
    expect(await page.evaluate(() => localStorage.length)).toBe(0);

    await page.keyboard.press('Escape');
    await expect(page.locator('#quality-pop')).toBeHidden();
    await expect(toggle).toBeFocused();

    await page.reload();
    await expect(page.getByRole('button', { name: /^Quality/ })).toContainText('Auto'); // not remembered
  });

  test('"Remember on this device" stores the choice and restores it; unticking forgets it', async ({ page }) => {
    await open(page, 1440, 900);
    await page.getByRole('button', { name: /^Quality/ }).click();
    const pop = page.locator('#quality-pop');
    await pop.getByRole('radio', { name: 'balanced' }).check();
    await pop.getByLabel('Remember on this device').check();
    expect(await page.evaluate(() => localStorage.getItem('portfolio:quality:v1'))).toBe('{"choice":"balanced"}');

    await page.reload();
    await expect(page.getByRole('button', { name: /^Quality/ })).toContainText('Balanced');
    await page.getByRole('button', { name: /^Quality/ }).click();
    await expect(page.locator('#quality-pop').getByLabel('Remember on this device')).toBeChecked();
    await page.locator('#quality-pop').getByLabel('Remember on this device').uncheck();
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
  });

  test('clicking elsewhere closes the popover', async ({ page }) => {
    await open(page, 834, 1112);
    await page.getByRole('button', { name: /^Quality/ }).click();
    await expect(page.locator('#quality-pop')).toBeVisible();
    await page.locator('h1').click();
    await expect(page.locator('#quality-pop')).toBeHidden();
  });

  test('works when storage is blocked', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
    });
    await open(page, 1440, 900);
    await page.getByRole('button', { name: /^Quality/ }).click();
    await page.locator('#quality-pop').getByRole('radio', { name: 'low' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-quality', 'low');
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const [w, h] of [[390, 844], [1440, 900]] as const) {
    test(`${w}px: hero, primary nav and chapter links are usable; JS-only controls are absent`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('/');
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.primary-nav')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Contact', exact: true }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /Menu|Quality/ })).toHaveCount(0);
      await expect(page.locator('#menu-panel')).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('reduced motion', () => {
  test('page is fully static', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 1440, 900);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'static');
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});

test.describe('accessibility basics', () => {
  test('landmarks, one h1, labelled sections, alt text, current chapter marked', async ({ page }) => {
    await open(page, 1440, 900);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Chapter index' })).toBeVisible();
    await expect(page.locator('.hero__stage img')).toHaveAttribute('alt', /Night studio/);
    await expect(page.locator('#studio')).toHaveAttribute('aria-labelledby', 'h-studio');
    await expect(page.locator('.hero__foot a[aria-current]')).toHaveText('00 Studio');
  });

  test('focus ring is visible and not hidden under the sticky header after a jump', async ({ page }) => {
    await open(page, 1440, 900);
    await page.getByRole('link', { name: 'Enter the work' }).click();
    await expect(page).toHaveURL(/#gestureiq$/);
    const top = await page.locator('#gestureiq').evaluate((e) => e.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(0); // scroll-padding keeps the section header below the sticky header
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
    expect(outline).toBe('solid');
  });
});
