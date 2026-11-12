/**
 * Development server only. Production pages are prerendered and ship no React (see src/client/main.ts).
 * `vite dev` has no prerender step, so this renders the same React tree client-side to keep the pages visible.
 * A Vite plugin (vite.config.ts) injects it in dev and removes it from builds.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { isProjectId } from '../content/projects';
import { CaseStudyPage } from '../pages/CaseStudyPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { StudioPage } from '../pages/StudioPage';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
const { page, project } = document.documentElement.dataset;

let view;
if (page === 'case' && isProjectId(project)) view = <CaseStudyPage projectId={project} />;
else if (page === '404') view = <NotFoundPage />;
else view = <StudioPage />;

createRoot(root).render(<StrictMode>{view}</StrictMode>);
