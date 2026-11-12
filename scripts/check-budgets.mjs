#!/usr/bin/env node
/** Step 4 of `npm run build`: fails the build if any Performance-board budget is exceeded. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { budgets } from './budgets.config.mjs';
import { gzipSize, initialAssets, listFiles, readDist } from './lib/html.mjs';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

const pages = listFiles(dist, (p) => p.endsWith('.html')).filter((p) => !p.startsWith('dev/'));
const allJs = listFiles(join(dist, 'assets'), (p) => p.endsWith('.js')).map((f) => `/assets/${f}`);
const size = (url) => gzipSize(readDist(dist, url));

const results = [];
const check = (page, name, value, limit) => results.push({ page, name, value, limit, ok: value <= limit });

const perPage = new Map();
for (const page of pages) {
  const html = readFileSync(join(dist, page), 'utf8');
  perPage.set(page, initialAssets(html));
}
const studioScripts = new Set(perPage.get('index.html')?.scripts ?? []);
const firstViewScripts = new Set([...perPage.values()].flatMap((a) => a.scripts));

for (const [page, a] of perPage) {
  const htmlGz = gzipSize(readFileSync(join(dist, page)));
  const cssGz = a.styles.reduce((s, u) => s + size(u), 0);
  const fontBytes = a.fonts.reduce((s, u) => s + readDist(dist, u).length, 0);
  const jsGz = a.scripts.reduce((s, u) => s + size(u), 0) + a.inlineScriptBytes;
  // Preloaded stills are alternatives chosen by media query: one loads per device, so count the largest.
  const stillGz = a.images.reduce((m, u) => Math.max(m, size(u)), 0);
  if (a.images.length) check(page, `hero still (largest of ${a.images.length})`, stillGz, budgets.heroStill);

  check(page, 'html', htmlGz, budgets.html);
  check(page, 'css', cssGz, budgets.css);
  check(page, 'fonts (preloaded)', fontBytes, budgets.fonts);
  if (page === 'index.html') check(page, 'initial JS', jsGz, budgets.initialJs);
  if (page.startsWith('work/')) {
    const own = a.scripts.filter((u) => !studioScripts.has(u)).reduce((s, u) => s + size(u), 0);
    check(page, 'initial JS', jsGz, budgets.initialJs);
    check(page, 'page-specific JS', own, budgets.caseOwnJs);
  }
  const externalJs = a.scripts.reduce((s, u) => s + size(u), 0);
  check(page, 'inline JS (head gate)', a.inlineScriptBytes, budgets.inlineJs);
  if (page === '404.html') check(page, 'JS files', externalJs, budgets.notFoundJs);
  check(page, 'first view total', htmlGz + cssGz + fontBytes + jsGz + stillGz, budgets.firstView);
}

const deferred = allJs.filter((u) => !firstViewScripts.has(u));
check('(lazy chunks)', `deferred JS (${deferred.length} chunks)`, deferred.reduce((s, u) => s + size(u), 0), budgets.deferredJs);

console.log('\nBudget check (gzip transfer; fonts raw woff2)');
for (const r of results) {
  console.log(`${r.ok ? ' ok ' : 'FAIL'}  ${r.page.padEnd(28)} ${r.name.padEnd(28)} ${kb(r.value).padStart(9)} / ${kb(r.limit)}`);
}
writeFileSync(join(root, 'dist-ssr', 'budget-report.json'), JSON.stringify(results, null, 2));

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error(`\n${failed.length} budget(s) exceeded.`);
  process.exit(1);
}
console.log('\nAll budgets met.');
