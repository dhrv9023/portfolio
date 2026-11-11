import { describe, expect, it } from 'vitest';
import { render, routes } from '../../src/entries/server';
import { CASE_CHAPTERS } from '../../src/content/projects';

const route = (path: string) => {
  const r = routes.find((x) => x.path === path);
  if (!r) throw new Error(path);
  return r;
};
const opts = { siteUrl: 'https://example.invalid', ogImageExists: false } as const;

describe('prerender', () => {
  it('studio page has one h1, a skip link, a main landmark and all nine chapter sections', () => {
    const { html } = render(route('/'), opts);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('>Dhruv Sehgal</h1>');
    expect(html).toContain('href="#main"');
    expect(html).toMatch(/<main id="main"/);
    for (const id of ['studio', 'gestureiq', 'stockpred', 'pravah', 'kareerist', 'experience', 'toolkit', 'about', 'contact']) {
      expect(html).toContain(`<section id="${id}"`);
    }
  });

  it('marks unresolved facts visibly and reports them', () => {
    const { html, unresolved } = render(route('/'), opts);
    expect(html).toContain('data-fact-status="verify"');
    expect(html).toContain('class="status-tag"');
    expect(unresolved.some((u) => u.id === 'site.positioning' && u.status === 'verify')).toBe(true);
    expect(unresolved.some((u) => u.status === 'scaffold')).toBe(true);
  });

  it('case study renders all eight chapters, back link and pager', () => {
    const { html } = render(route('/work/kareerist'), opts);
    for (const [key] of CASE_CHAPTERS) expect(html).toContain(`<section id="${key}"`);
    expect(html).toContain('href="/#kareerist"');
    expect(html).toContain('← Previous: PRAVAH');
    expect(html).toContain('Back to all work');
    expect(html).not.toContain('Next:');
  });

  it('head has description, canonical, OG basics and Person JSON-LD (no og:image until the file exists)', () => {
    const { head, title } = render(route('/'), opts);
    expect(title).toBe('Dhruv Sehgal — AI Engineer / Backend Engineer');
    expect(head).toContain('<link rel="canonical" href="https://example.invalid/">');
    expect(head).toContain('property="og:title"');
    expect(head).not.toContain('og:image');
    expect(head).toContain('"@type":"Person"');
    expect(head).not.toContain('sameAs'); // links are still VERIFY
  });

  it('404 is noindex and makes no claims', () => {
    const { head, unresolved } = render(route('/404'), opts);
    expect(head).toContain('noindex');
    expect(unresolved).toHaveLength(0);
  });

  it('StockPred pages carry the illustrative-data disclosure', () => {
    expect(render(route('/'), opts).html).toContain('not real market data');
    expect(render(route('/work/stockpred'), opts).html).toContain('not real market data');
  });
});
