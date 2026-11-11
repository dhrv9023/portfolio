# dhruv-sehgal-portfolio

Cinematic engineering portfolio — "The Revolve". Prerendered multi-page site (Vite + React), progressive 3D (three.js + React Three Fiber, added in M2), static T3 baseline for every visitor.

- Design spec: Stage 02 canvas (rev B)
- Architecture: [docs/stage-03-architecture.md](docs/stage-03-architecture.md)
- Device testing: [docs/device-test-protocol.md](docs/device-test-protocol.md)

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:5173 (pages render client-side; placeholders tagged) |
| `npm run build` | Client build → SSR build → prerender → budget gate → verification gate (preview mode) |
| `SITE_URL=https://<domain> npm run build:release` | Release build: **fails** while any claim is unresolved |
| `npm run preview` | Serves `dist/` on http://localhost:4173 with Vercel-like clean URLs and 404 |
| `npm test` | Typecheck + architecture boundaries + unit tests |
| `npm run test:e2e` | Builds, then Playwright (Chromium + mobile Chromium). `ALL_BROWSERS=1` adds Firefox/WebKit |
| `npm run probe:serve` | Serves the hardware probe to your LAN (see device-test-protocol.md) |

## Content rule
Every publishable claim lives in `src/content/` as a `Fact` (`known` / `assumed` / `verify`). Preview builds show unresolved facts with a visible tag. Release builds (`SITE_RELEASE=1`, or `VERCEL_ENV=production` on Vercel) refuse to build while any remain.

## Blender sources
`.blend` files are kept outside this repository (see `.gitignore`). Only generated, optimised assets are committed.
