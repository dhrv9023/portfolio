import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

/** gzip level 9 — close to what a CDN serves; brotli would be a little smaller. */
export const gzipSize = (buf) => gzipSync(buf, { level: 9 }).length;

/** Recursively list files under dir (relative paths, forward slashes). */
export function listFiles(dir, filter = () => true) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (filter(p)) out.push(relative(dir, p).split('\\').join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4]) : undefined;
};

/**
 * Assets a page requests before first interaction: module scripts, modulepreloads,
 * stylesheets and preloaded fonts. Inline scripts are reported by byte length.
 */
export function initialAssets(html) {
  const scripts = [];
  const styles = [];
  const fonts = [];
  let inlineScriptBytes = 0;

  for (const tag of html.match(/<script\b[^>]*>/gi) ?? []) {
    const src = attr(tag, 'src');
    if (src) scripts.push(src);
  }
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const open = `<script${m[1]}>`;
    const type = attr(open, 'type');
    if (!attr(open, 'src') && (!type || type === 'module' || type === 'text/javascript')) {
      inlineScriptBytes += Buffer.byteLength(m[2]);
    }
  }
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attr(tag, 'rel') ?? '').toLowerCase();
    const href = attr(tag, 'href');
    if (!href) continue;
    if (rel === 'modulepreload') scripts.push(href);
    else if (rel === 'stylesheet') styles.push(href);
    else if (rel === 'preload' && attr(tag, 'as') === 'font') fonts.push(href);
  }
  return { scripts: [...new Set(scripts)], styles: [...new Set(styles)], fonts: [...new Set(fonts)], inlineScriptBytes };
}

export const readDist = (distDir, url) => readFileSync(join(distDir, url.replace(/^\//, '')));
