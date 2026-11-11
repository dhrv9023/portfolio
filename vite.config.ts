import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Injects the motion/data gate (src/head/gate.inline.js) into every HTML template,
 * in dev and in build. It runs before first paint. Its SHA-256 is pinned in vercel.json's CSP;
 * tests/unit/csp.test.ts fails if the two drift apart.
 */
function headGate(): Plugin {
  const gate = () => readFileSync(resolve('src/head/gate.inline.js'), 'utf8').trim();
  return {
    name: 'portfolio:head-gate',
    transformIndexHtml(html) {
      return html.replace('<!--gate-->', `<script>${gate()}</script>`);
    },
  };
}

/**
 * `vite preview` only: mirror Vercel's static behaviour (cleanUrls, trailingSlash: false, 404.html)
 * so local E2E tests see the same URLs as production.
 */
function vercelLikePreview(): Plugin {
  return {
    name: 'portfolio:vercel-like-preview',
    configurePreviewServer(server) {
      const dist = resolve(server.config.build.outDir);
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const path = decodeURIComponent(url.pathname);
        if (path !== '/' && !/\.[a-z0-9]+$/i.test(path)) {
          const dir = join(dist, path.replace(/\/$/, ''), 'index.html');
          if (existsSync(dir)) {
            req.url = `${path.replace(/\/$/, '')}/index.html${url.search}`;
            return next();
          }
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.end(readFileSync(join(dist, '404.html')));
        }
        next();
      });
    },
  };
}

const pages = {
  studio: 'index.html',
  gestureiq: 'work/gestureiq/index.html',
  stockpred: 'work/stockpred/index.html',
  pravah: 'work/pravah/index.html',
  kareerist: 'work/kareerist/index.html',
  notFound: '404.html',
};

export default defineConfig(({ isSsrBuild }) => ({
  appType: 'mpa',
  plugins: [react(), tailwindcss(), headGate(), vercelLikePreview()],
  build: isSsrBuild
    ? {
        outDir: 'dist-ssr',
        emptyOutDir: true,
        target: 'node20',
      }
    : {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2022',
        manifest: true,
        modulePreload: { polyfill: false },
        rolldownOptions: {
          input: Object.fromEntries(Object.entries(pages).map(([k, v]) => [k, resolve(v)])),
        },
      },
}));
