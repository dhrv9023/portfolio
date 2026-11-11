#!/usr/bin/env node
/**
 * Step 3 of `npm run build`: renders every route with the SSR bundle and writes the final HTML.
 *   dist/        — client build output (templates contain <!--app--> and <!--head-->)
 *   dist-ssr/    — server bundle (never deployed); facts-report.json is written here
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isReleaseBuild } from './lib/unresolved.mjs';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const ssr = join(root, 'dist-ssr');
const { routes, render } = await import(pathToFileURL(join(ssr, 'server.js')).href);

const siteUrl = process.env.SITE_URL?.replace(/\/$/, '') || undefined;
const release = isReleaseBuild();
const report = [];
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const route of routes) {
  const file = join(dist, route.file);
  if (!existsSync(file)) throw new Error(`Template missing in dist: ${route.file}`);
  const template = readFileSync(file, 'utf8');
  if (!template.includes('<!--app-->') || !template.includes('<!--head-->')) {
    throw new Error(`${route.file}: <!--app--> or <!--head--> placeholder missing`);
  }

  const ogImageExists = existsSync(join(root, 'public', route.ogImage.replace(/^\//, '')));
  const out = render(route, { siteUrl, ogImageExists });
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(out.title)}</title>`)
    .replace('<!--head-->', out.head)
    .replace('<!--app-->', out.html);

  writeFileSync(file, html);
  report.push({ route: route.path, file: route.file, unresolved: out.unresolved });
  console.log(`prerendered ${route.path.padEnd(18)} → dist/${route.file}  (${out.unresolved.length} unresolved)`);
}

if (release && existsSync(join(dist, 'dev'))) {
  rmSync(join(dist, 'dev'), { recursive: true, force: true });
  console.log('release build: removed dist/dev (hardware probe)');
}

writeFileSync(join(ssr, 'facts-report.json'), JSON.stringify({ release, siteUrl: siteUrl ?? null, routes: report }, null, 2));
