import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { StudioPage } from '../pages/StudioPage';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

const app = (
  <StrictMode>
    <StudioPage />
  </StrictMode>
);

// Prerendered in builds → hydrate. Empty in `vite dev` → render.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
