import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { isProjectId } from '../content/projects';
import { CaseStudyPage } from '../pages/CaseStudyPage';

const root = document.getElementById('root');
const projectId = document.documentElement.dataset.project;
if (!root) throw new Error('#root missing');
if (!isProjectId(projectId)) throw new Error(`Unknown project on <html data-project>: ${String(projectId)}`);

const app = (
  <StrictMode>
    <CaseStudyPage projectId={projectId} />
  </StrictMode>
);

if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
