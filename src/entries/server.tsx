/**
 * Build-time only. Bundled by `vite build --ssr` and imported by scripts/prerender.mjs.
 * Never shipped to the browser.
 */
import { renderToString } from 'react-dom/server';
import { FactCollectorContext, type UnresolvedEntry } from '../components/Fact';
import { routes, type RouteDef } from '../content/routes';
import { buildHead } from '../head/head';
import { CaseStudyPage } from '../pages/CaseStudyPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { StudioPage } from '../pages/StudioPage';

export { routes };
export type { RouteDef, UnresolvedEntry };

export interface RenderOptions {
  readonly siteUrl: string | undefined;
  readonly ogImageExists: boolean;
}

export interface RenderResult {
  readonly html: string;
  readonly title: string;
  readonly head: string;
  readonly unresolved: readonly UnresolvedEntry[];
}

function pageFor(route: RouteDef) {
  switch (route.kind) {
    case 'studio':
      return <StudioPage />;
    case 'case':
      if (!route.projectId) throw new Error(`Case route without projectId: ${route.path}`);
      return <CaseStudyPage projectId={route.projectId} />;
    case 'notFound':
      return <NotFoundPage />;
  }
}

export function render(route: RouteDef, opts: RenderOptions): RenderResult {
  const unresolved: UnresolvedEntry[] = [];
  const html = renderToString(
    <FactCollectorContext.Provider value={unresolved}>{pageFor(route)}</FactCollectorContext.Provider>,
  );
  const head = buildHead(route, {
    ...opts,
    report: (id, fact) => {
      if (fact.status !== 'known') {
        unresolved.push(
          fact.source
            ? { id, status: fact.status, text: fact.value, source: fact.source }
            : { id, status: fact.status, text: fact.value },
        );
      }
    },
  });
  return { html, title: route.title, head, unresolved };
}
