/**
 * Detection of unresolved claims and placeholders in built HTML.
 * Two independent signals, so one can't silently miss what the other catches:
 *   1. data-fact-status="verify|assumed|scaffold" attributes written by <FactText>/<Scaffold>
 *   2. bracketed upper-case placeholders like [EMAIL ADDRESS] or [VERIFY] anywhere in the text
 */

const STATUS_ATTR = /data-fact-status="(verify|assumed|scaffold)"[^>]*?data-fact-id="([^"]+)"/g;
const PLACEHOLDER = /\[[A-Z][A-Z0-9 /·.,'’&+—–-]*[A-Z0-9]\]/g;

/** Executable scripts and styles are not published copy; JSON-LD is, so it stays in. */
const stripNonText = (html) =>
  html
    .replace(/<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

export function findUnresolvedInHtml(html) {
  const found = [];
  for (const m of html.matchAll(STATUS_ATTR)) found.push({ kind: 'status', status: m[1], id: m[2] });
  for (const m of stripNonText(html).matchAll(PLACEHOLDER)) found.push({ kind: 'placeholder', text: m[0] });
  return found;
}

/** Release = production publish. Vercel sets VERCEL_ENV=production for production deploys only. */
export const isReleaseBuild = (env = process.env) => env.SITE_RELEASE === '1' || env.VERCEL_ENV === 'production';

export function releaseProblems({ env = process.env, htmlFindings, reportEntries, distHasDevFolder }) {
  const problems = [];
  const siteUrl = env.SITE_URL ?? '';
  if (!/^https:\/\/[^/]+$/.test(siteUrl.replace(/\/$/, ''))) problems.push('SITE_URL must be set to the https:// origin of the custom domain.');
  if (distHasDevFolder) problems.push('dist/dev (hardware probe) must not be published.');
  for (const e of reportEntries) problems.push(`Unresolved ${e.status} fact "${e.id}": ${e.text}`);
  for (const [file, list] of Object.entries(htmlFindings)) {
    for (const f of list) {
      problems.push(f.kind === 'status' ? `${file}: ${f.status} marker on "${f.id}"` : `${file}: placeholder ${f.text}`);
    }
  }
  return problems;
}
