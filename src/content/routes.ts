import { known, type Fact } from './schema';
import { projects, type ProjectId } from './projects';
import { site } from './site';

export interface RouteDef {
  /** Public URL path (clean, no trailing slash). */
  readonly path: string;
  /** Built HTML file, relative to dist/. */
  readonly file: string;
  readonly kind: 'studio' | 'case' | 'notFound';
  readonly projectId?: ProjectId;
  readonly title: string;
  readonly description: Fact;
  /** Path under public/ — only emitted in <head> if the file exists at build time. */
  readonly ogImage: string;
  readonly indexable: boolean;
}

const caseRoutes: RouteDef[] = projects.map((p) => ({
  path: `/work/${p.id}`,
  file: `work/${p.id}/index.html`,
  kind: 'case',
  projectId: p.id,
  title: `${p.title.value} — case study · ${site.name.value}`,
  description: p.summary,
  ogImage: `/og/${p.id}.jpg`,
  indexable: true,
}));

export const routes: readonly RouteDef[] = [
  {
    path: '/',
    file: 'index.html',
    kind: 'studio',
    title: `${site.name.value} — ${site.roles.value}`,
    description: site.description,
    ogImage: '/og/studio.jpg',
    indexable: true,
  },
  ...caseRoutes,
  {
    path: '/404',
    file: '404.html',
    kind: 'notFound',
    title: `Not found · ${site.name.value}`,
    description: known('This page does not exist.', 'design copy'),
    ogImage: '/og/studio.jpg',
    indexable: false,
  },
];
