#!/usr/bin/env node
/**
 * Step 5 of `npm run build`.
 *  Preview / dev builds: reports every unresolved claim or placeholder and passes.
 *  Release builds (SITE_RELEASE=1 or VERCEL_ENV=production): fails if anything unresolved would be published.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { listFiles } from './lib/html.mjs';
import { findUnresolvedInHtml, isReleaseBuild, releaseProblems } from './lib/unresolved.mjs';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const report = JSON.parse(readFileSync(join(root, 'dist-ssr', 'facts-report.json'), 'utf8'));

const htmlFindings = {};
for (const page of listFiles(dist, (p) => p.endsWith('.html')).filter((p) => !p.startsWith('dev/'))) {
  const found = findUnresolvedInHtml(readFileSync(join(dist, page), 'utf8'));
  if (found.length) htmlFindings[page] = found;
}
const reportEntries = report.routes.flatMap((r) => r.unresolved.map((e) => ({ ...e, id: `${r.route} ${e.id}` })));
const counts = reportEntries.reduce((c, e) => ((c[e.status] = (c[e.status] ?? 0) + 1), c), {});

console.log(`\nVerification gate — unresolved items rendered: ${reportEntries.length}`, counts);

if (!isReleaseBuild()) {
  console.log('Preview build: placeholders allowed and visibly tagged. A release build would be rejected until these are resolved.');
  process.exit(0);
}

const problems = releaseProblems({
  htmlFindings,
  reportEntries,
  distHasDevFolder: existsSync(join(dist, 'dev')),
});
if (problems.length) {
  console.error(`\nRELEASE BLOCKED — ${problems.length} problem(s):`);
  for (const p of problems.slice(0, 200)) console.error(`  • ${p}`);
  process.exit(1);
}
console.log('Release gate passed: no unresolved claims or placeholders.');
