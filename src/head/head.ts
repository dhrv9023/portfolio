import type { RouteDef } from '../content/routes';
import { site } from '../content/site';
import type { Fact } from '../content/schema';

export interface HeadOptions {
  /** Absolute origin, e.g. https://example.com. Required for release builds. */
  readonly siteUrl: string | undefined;
  readonly ogImageExists: boolean;
  readonly report: (id: string, fact: Fact) => void;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** JSON inside <script type="application/ld+json"> must not be able to close the tag. */
const jsonForScript = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

export function buildHead(route: RouteDef, opts: HeadOptions): string {
  opts.report(`head.${route.path}.description`, route.description);

  const origin = opts.siteUrl?.replace(/\/$/, '');
  const url = origin ? `${origin}${route.path === '/' ? '/' : route.path}` : undefined;
  const tags: string[] = [`<meta name="description" content="${esc(route.description.value)}">`];

  if (!route.indexable) tags.push('<meta name="robots" content="noindex">');
  if (url && route.indexable) tags.push(`<link rel="canonical" href="${esc(url)}">`);

  tags.push(
    `<meta property="og:type" content="${route.kind === 'case' ? 'article' : 'website'}">`,
    `<meta property="og:title" content="${esc(route.title)}">`,
    `<meta property="og:description" content="${esc(route.description.value)}">`,
    `<meta name="twitter:card" content="${opts.ogImageExists ? 'summary_large_image' : 'summary'}">`,
  );
  if (url) tags.push(`<meta property="og:url" content="${esc(url)}">`);
  if (origin && opts.ogImageExists) tags.push(`<meta property="og:image" content="${esc(origin + route.ogImage)}">`);

  if (route.kind === 'studio') {
    const sameAs = [site.contact.github, site.contact.linkedin]
      .filter((f) => f.status === 'known')
      .map((f) => f.value);
    const person: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: site.name.value,
      jobTitle: site.roles.value,
    };
    if (url) person.url = url;
    if (sameAs.length) person.sameAs = sameAs;
    tags.push(`<script type="application/ld+json">${jsonForScript(person)}</script>`);
  }

  return tags.join('\n    ');
}
