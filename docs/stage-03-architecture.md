# Stage 03 — Implementation Architecture & Development Plan

Status: **draft for approval** · 2026-11-11
Design source of truth: Stage 02 canvas rev B (33 boards). Nothing here changes the approved visual direction, layouts, camera system, navigation or performance budgets.

Decisions locked for this stage:

| # | Decision | Value |
|---|---|---|
| 1 | Authored 3D | Blender, with scripted procedural generation wherever practical |
| 2 | Texture compression | KTX2 (ETC1S) on T1 only, with a WebP fallback when no compressed format is available |
| 3 | Site architecture | Prerendered multi-page site (MPA): one real HTML file per URL |
| 4 | Scene framework | React Three Fiber, kept, with all 3D code deferred |
| 5 | StockPred data | Illustrative, labelled as such everywhere it appears |
| 6 | Analytics | None |
| 7 | Freelance | Offered selectively, kept secondary in the copy |
| 8 | Portrait | Not in the hero; optional in About, and no layout depends on it |
| 9 | Hosting | Vercel, static output, custom domain |
| 10 | Test hardware | Victus (RTX 2050 + Radeon 760M), i5-4210U with HD Graphics 4400 (8 GB), low-end Android to be confirmed |

**Decision update 2026-11-12 — vanilla "islands", React deferred.** Choosing for the widest compatibility and the smallest download: the HTML is prerendered by React at *build time* only. Pages ship **no React**: the one script every page loads (`src/client/main.ts`) is plain TypeScript (≈ 0.1 KB gzip today, target ≤ 15 KB). React, three.js and R3F load only inside the deferred 3D stage, and only on devices that pass the WebGL2 probe. Interactive UI (menu, accordions, quality control) is small vanilla controllers over the prerendered markup, and every control works as plain HTML first. Consequences: initial JS gate 70 → 25 KB (real target ≤ 15 KB), deferred gate 300 → 365 KB (React moved there), build target ES2020, no hydration step, enforced by boundary rule R5.

**Core principle: T3 is the baseline, and T1/T2 are progressive enhancement.**
Every page first paints as prerendered HTML with T3 stills. WebGL is only attempted after first paint, and only once a WebGL2 probe succeeds. If the probe fails, nothing 3D is ever downloaded. The HD 4400 is never assumed to support WebGL2: the probe decides on the real OS and browser.

---

## 1. Folder and component architecture

```
portfolio/
├─ index.html                     # template: studio (chapters 00–08)
├─ work/
│  ├─ gestureiq/index.html        # template: case study (shared layout)
│  ├─ stockpred/index.html
│  ├─ pravah/index.html
│  └─ kareerist/index.html
├─ 404.html                       # static, no JS
├─ public/                        # shipped as-is, content-hashed by the asset build
│  ├─ fonts/                      # Archivo variable (subset), Plex Mono 400/500 (woff2)
│  ├─ stills/<chapter>/<shot>[-<state>]-<w>.avif     # T3 renders; 780w, 1440w, 1920w
│  ├─ og/<route>.jpg              # 1200×630 JPEG (crawlers don't read AVIF)
│  ├─ models/<env>.<t1|t2>.glb    # meshopt-compressed geometry, no embedded textures
│  ├─ textures/<env>/<atlas>.t1.ktx2 | <atlas>.t2.webp | <atlas>.t1.webp (fallback)
│  ├─ basis/                      # transcoder copied from three/examples (T1 only)
│  ├─ cv/dhruv-sehgal-cv.pdf
│  └─ dev/probe.html              # standalone WebGL capability probe (dev only, no deps)
├─ src/
│  ├─ content/                    # ALL copy and facts; typed; the single source of truth
│  │  ├─ schema.ts                # Fact<T> = { value, status: 'known'|'assumed'|'verify', source? }
│  │  ├─ site.ts                  # name, positioning, contact, links, freelance line
│  │  ├─ projects/<id>.ts         # station copy + full 8-chapter case study + architecture graph
│  │  ├─ experience.ts · toolkit.ts · about.ts
│  │  └─ routes.ts                # route table: path, title, description, OG image, template
│  ├─ client/
│  │  └─ main.ts                  # the ONE script every page loads: vanilla TS, no React/three (rule R5)
│  ├─ entries/
│  │  ├─ server.tsx               # SSR entry used only at build time by the prerender step
│  │  └─ dev.client.tsx           # `vite dev` only: renders the React tree client-side; stripped from builds
│  ├─ pages/
│  │  ├─ StudioPage.tsx           # composes chapters 00–08
│  │  └─ CaseStudyPage.tsx        # 8-chapter template driven by content/projects/<id>
│  ├─ chapters/                   # semantic HTML sections; no three.js imports allowed
│  │  ├─ Hero/ · Station/ (shared by all 4; takes a project + shot list)
│  │  └─ Experience/ · Toolkit/ · About/ · Contact/
│  ├─ components/                 # UI primitives
│  │  ├─ Header/ · MobileMenu/ · QualityControl/ · IndexDial/ · SkipLink/ · LiveRegion/
│  │  ├─ SpecPlate/ · Annotation/ (leader + label) · Button/ · StatusTag/ (KNOWN/ASSUMED/VERIFY)
│  │  ├─ Still/                   # <picture> T3 renderer: srcset, preload of neighbours, instant swap
│  │  └─ ArchitectureDiagram/     # HTML/CSS diagram from a graph in content; solid = known, dashed = assumed
│  ├─ chapters-state/
│  │  └─ chapterStore.ts          # one IntersectionObserver → { chapter, shot }; replaceState on the hash
│  ├─ motion/                     # pure TS, no three.js import; unit-tested
│  │  ├─ spring.ts                # critically damped spring, retargetable, velocity-preserving
│  │  ├─ indexProfile.ts          # jerk-limited 90° index + single ≤0.5° settle
│  │  ├─ scheduler.ts             # the only rAF owner; calls invalidate() while anything moves
│  │  └─ policy.ts                # 'full' | 'static' (static under reduced motion, whatever the tier)
│  ├─ quality/                    # pure TS + tiny DOM probe; unit-tested
│  │  ├─ gate.ts                  # sync: reduced motion, Save-Data / reduced-data → static
│  │  ├─ probe.ts                 # WebGL2 probe on a throwaway canvas (see §5)
│  │  ├─ score.ts                 # signals → { tier, dpr, flags }; pure function with fixtures
│  │  ├─ profiles.ts              # T1 / T2 / T3 profile tables (DPR, LOD, textures, MSAA, density)
│  │  ├─ governor.ts              # frame sampler, hysteresis, cooldown, step-down ladder
│  │  ├─ store.ts                 # external store + useSyncExternalStore hook
│  │  └─ persistence.ts           # opt-in "Remember", try/catch localStorage
│  ├─ stage/                      # EVERYTHING here is behind one dynamic import() boundary
│  │  ├─ StageHost.tsx            # client-only; mounts <Canvas frameloop="demand">
│  │  ├─ studio/ (Room · Revolve · Pendant)
│  │  ├─ worlds/<id>/World.tsx    # one lazy chunk per world
│  │  ├─ materials/BakedMaterial.ts   # MeshBasicMaterial + dual-atlas blend + matcap variant
│  │  ├─ loaders/ (gltf.ts · textures.ts · queue.ts)  # priority queue with AbortController
│  │  ├─ camera/ (CameraRig.tsx · poses.generated.ts · splines.ts)
│  │  ├─ overlay/HotspotProjector.ts  # projects anchors → HTML overlay, only when the camera moves
│  │  ├─ residency.ts             # which worlds stay loaded; dispose rules (§4)
│  │  └─ devtools/ (perf overlay · GPU memory ledger)   # stripped from production builds
│  ├─ a11y/ (focus.ts · announce.ts)
│  └─ styles/ (tokens.css · base.css · tailwind.css)
├─ assets-src/                    # NOT shipped. Source of truth for 3D; see §2
│  ├─ blender/ (library.blend · studio.blend · worlds/<id>.blend)
│  ├─ bpy/                        # Blender Python: build_*, bake.py, export.py, render_stills.py, export_cameras.py
│  └─ data/                       # inputs to the generators (JSON): see §2.2
├─ scripts/                       # Node, plain .mjs, no extra dependencies
│  ├─ prerender.mjs · build-assets.mjs · check-budgets.mjs · check-verify.mjs
├─ tests/ (unit · e2e · a11y · fixtures)
├─ docs/ (this file · device-test-protocol.md · blender-pipeline.md)
└─ vercel.json · vite.config.ts · tsconfig.json · package.json
```

**Hard boundaries, enforced by lint rules and import checks:**
- `src/client/` never imports React, three or `stage/` statically (R5); it may `import()` the stage once.
- `chapters/`, `components/` and `pages/` never import `three`, `@react-three/fiber` or anything under `stage/`.
- `stage/` is reached only through one `import()` in `StageHost`.
- `motion/` and `quality/` never import React or three, so they unit-test without a DOM or GPU.

### Dependencies (final)

| Package | Kind | Why |
|---|---|---|
| react, react-dom | build-time SSR now; runtime only inside the deferred 3D stage | Prerender the HTML (no React in initial page JS) |
| three | runtime (deferred) | Renderer. GLTFLoader, MeshoptDecoder and KTX2Loader come from `three/examples` |
| @react-three/fiber | runtime (deferred) | Declarative scene (your decision #4) |
| vite, @vitejs/plugin-react, typescript, @types/react, @types/react-dom, @types/three | dev | Build, Fast Refresh, types |
| tailwindcss, @tailwindcss/vite | dev | Styling (brief) |
| gltfpack | dev | meshopt compression and quantisation |
| sharp | dev | AVIF, WebP and JPEG encoding of stills, OG images and T2 textures (one tool instead of three CLIs) |
| vitest, jsdom, @testing-library/react | dev | Unit and component tests |
| @playwright/test, @axe-core/playwright | dev | End-to-end, JS-off, WebGL-off and automated accessibility checks |
| @lhci/cli | dev | Lighthouse CI with budgets |

External tools, not npm packages: **Blender** (current LTS, exact version pinned in `docs/blender-pipeline.md`), **KTX-Software `toktx`** (T1 textures), **fonttools `pyftsubset`** (one-off font subsetting).
Not used: drei, GSAP, smooth-scroll libraries, state libraries, routers, postprocessing, icon packs, analytics.

---

## 2. Asset pipeline and Blender workflow

### 2.1 Pipeline stages

```
assets-src/data/*.json ──► [B] bpy generators ──► .blend scenes ◄── [A] hand-authored detail
                                                      │
                     ┌────────────────────────────────┼─────────────────────────┐
                     ▼                                ▼                         ▼
             [C] Cycles bake                  [D] glTF export           [F] batch still renders
          (table + world atlases)        (T1 + T2 LOD, named nodes,       (same CAM_* cameras)
                     │                      cameras, hotspots JSON)              │
                     ▼                                ▼                         ▼
                 [E] build-assets.mjs: gltfpack · toktx · sharp · hashing · manifest
                                                      │
                                    public/ + src/stage/*.generated.ts
                                                      │
                                       [G] check-budgets.mjs (fails the build)
```

| Stage | What happens | Who |
|---|---|---|
| **A · Author** | Hand-made detail only: plaster hand sculpt (3 shape keys), surface wear, material tuning, composition passes | You, in Blender |
| **B · Generate** | `bpy/build_*.py` builds geometry from JSON with fixed seeds: Revolve, room shell, plinths, StockPred ribs/rails, PRAVAH contour layers + scatter, Kareerist modules + walkways, GestureIQ landmark pins. Re-running after a data change rebuilds only that environment | Scripts I write; you run them |
| **C · Bake** | Cycles bake of combined colour × light into atlases (OIDN denoise, 16 px margin). Each world gets two atlases with the same UV layout: a **table bake** (pendant on the rotation axis only) and a **world bake** (its own lighting). The studio gets one atlas. Bakes are made at 2048, and T2 is a downscale of the same bake | Script (`bake.py`) on the Victus RTX 2050 |
| **D · Export** | glTF 2.0 binary, one per environment per tier. Textures are external so tiers can swap them. `CAM_*` cameras and `HOTSPOT_*` empties are exported to JSON (position, target, focal length, shot id, device variant) | Script (`export.py`, `export_cameras.py`) |
| **E · Optimise** | `gltfpack` (meshopt, quantised, named nodes kept, GPU instancing). `toktx` → ETC1S KTX2 with mipmaps (T1). `sharp` → WebP 1024 (T2 and the T1 fallback) and AVIF stills. Content hashes, then `manifest.generated.ts` with every path, byte size, camera and hotspot | `scripts/build-assets.mjs` |
| **F · Render stills** | Cycles renders of every shot × device variant × state from the same `CAM_*` cameras as WebGL, so T3 matches T1. Hero only: a separate foreground layer with alpha for the two-layer CSS parallax | Script (`render_stills.py`), batch, overnight-friendly |
| **G · Gate** | Budgets on the Performance board are checked against the manifest. The build fails if any is exceeded | `scripts/check-budgets.mjs` |

Outputs in `public/` are committed. CI and Vercel never run Blender.

### 2.2 Blender conventions (the reusable part)

- **One library file** (`library.blend`) holds the shared materials (hammertone enamel, blackened walnut, plaster, basswood, card, moss felt) and repeated parts (plinth, scale figure, pin, pendant). Scenes **link** these, never copy them, so changing a material once updates every environment.
- **Collection naming drives export:** `EXPORT_T1_*`, `EXPORT_T2_*`, `PROXY_*` (the stations that aren't in front), `MATCAP_*` (brass, kept out of the bake), `EMISSIVE_*` (lamp mouths, unlit).
- **Empties:** `CAM_<chapter>_<shot>[_mobile]` (camera + look-at target), `HOTSPOT_<id>` (annotation anchors), `STATION_<n>` (mount points on the platen).
- **Units:** metres, real scale. Worlds are modelled at model scale on their station mount, which is what makes the descent continuous. Camera near/far planes switch per pose instead of using a logarithmic depth buffer, which would cost performance.
- **Rotational-symmetry rule:** the studio key light sits exactly on the platen's rotation axis. `bake.py` refuses to bake if it doesn't.
- **Data inputs** (`assets-src/data/`):
  - `stockpred.series.illustrative.json`, flagged `illustrative: true`
  - `pravah.layers.json`, with placeholder layer names
  - `kareerist.architecture.json`, with nodes marked `assumed` until verified
  - `gestureiq.landmarks.json`
  - Replacing any of these with verified data means one regeneration run.

### 2.3 Still render inventory (estimate ≈ 55–60, two widths each)
Hero (plus a foreground layer) · 4 worlds × 3 shots · state variants (GestureIQ +2 poses, StockPred +3 rail isolations, PRAVAH +5 layer states, Kareerist +1 per module) · experience overhead · sections backdrop · contact · 404 · 5 OG images. Each still has desktop and mobile camera variants, where the mobile camera is recomposed rather than cropped.

### 2.4 KTX2 fallback path (decision #2)
`KTX2Loader.detectSupport(renderer)`:
- **If no ETC1S target (BC1/BC3, ETC1/ETC2, ASTC) is available:** Basis would transcode to uncompressed RGBA32 (≈ 21 MB per 2048 atlas), so the loader instead fetches the `<atlas>.t1.webp` set at 1024. The visitor keeps T1 geometry and motion with lighter textures.
- **The transcoder is fetched only on T1,** so T2 never pays its ≈ 200 KB.

**GPU memory is measured, not just estimated:**
- **Dev ledger:** a development-build ledger records the bytes of every texture and buffer upload, by format and size.
- **Cross-check:** it is checked against the tab's **GPU memory** column in Chrome's Task Manager and `chrome://gpu`.
- **Record:** both numbers go into the device test sheet for each tier.

---

## 3. Routing and prerendering

- **Routes:** `/`, `/work/gestureiq`, `/work/stockpred`, `/work/pravah`, `/work/kareerist`, plus the 404. Each is a Vite `build.rollupOptions.input` entry. Moving between pages is ordinary navigation, with no client router.
- **Prerender (no extra dependencies):**
  1. `vite build`: client bundles for all entries.
  2. `vite build --ssr src/entries/server.tsx`: a Node bundle of the same React tree.
  3. `scripts/prerender.mjs` renders each route with `react-dom/server`, injects the result into its template, and writes the per-route `<title>`, meta description, canonical URL, Open Graph and Twitter tags (JPEG OG image), plus JSON-LD `Person` on `/` (job title marked provisional).
  4. It also writes `sitemap.xml` and `robots.txt`.
- **No hydration:** the prerendered HTML is final. `src/client/main.ts` attaches small vanilla controllers to it. React runs in the browser only inside the deferred 3D stage, which is never server-rendered: it mounts on the client after the gate (§4).
- **Works without JavaScript:** all text, links, navigation and T3 stills. Only the interactions need JS.
- **Inline `<head>` script (< 0.5 KB):** sets `data-motion="static"` on `<html>` for reduced motion and Save-Data before first paint, so CSS never animates for those visitors.
- **Case study → studio:** the "Back" link points to `/#<station>`, and a cold hash load opens that chapter at its rest pose. The browser Back button relies on the back/forward cache, so no `unload` handlers are allowed. On `pageshow` with `persisted`, the scene is invalidated once.
- **Prefetch:** a Speculation Rules block prefetches case-study pages when their links are hovered. It's a browser feature, not a dependency, and is ignored where unsupported.
- **Vercel (`vercel.json`):**
  - Static output (`dist/`), `cleanUrls`.
  - Caching: `immutable` for hashed assets, `max-age=0, must-revalidate` for HTML.
  - Correct `Content-Type` for `.glb` (`model/gltf-binary`) and `.ktx2` (`image/ktx2`).
  - Security headers: CSP with `'wasm-unsafe-eval'` for the transcoder only, `Permissions-Policy` with camera/mic/geolocation off, `Referrer-Policy`, `X-Content-Type-Options`.
  - Vercel serves `404.html` for unknown paths.
  - To verify on the first deploy: whether Vercel compresses `.glb` responses. If it doesn't, the budget uses the uncompressed meshopt size (already listed as the transfer figure).
- **Custom domain:** you add it in the Vercel project, then point DNS at your registrar. Every branch gets a preview URL.

---

## 4. 3D loading and unloading

### 4.1 First load (home page)
1. **Paint:** prerendered HTML, CSS and fonts, plus the hero T3 still (`fetchpriority="high"`, preloaded). This is the LCP. First view ≤ 350 KB.
2. **Enhance:** `src/client/main.ts` runs (initial JS ≤ 25 KB gate, ≈ 15 KB target).
3. **Gate:** if `data-motion="static"`, **stop here**. The visitor stays on T3 permanently, and nothing 3D is requested.
4. **Probe:** after `load` and an idle callback (or a `setTimeout` fallback). See §5. If it fails, **stop**: T3, with no 3D download.
5. **Fetch in parallel, at low priority:** the stage chunk (three + R3F + scene code), the studio GLB, studio textures for the chosen tier, and the transcoder (T1 only).
6. **Warm up hidden:** mount the Canvas invisibly, upload textures (`initTexture`), compile shaders asynchronously (`compileAsync`, with parallel compile where available), and render one frame.
7. **Swap:** crossfade from the still to the canvas at whatever chapter is current, since the still and the live camera share a pose. The lamp warm-up then doubles as the benchmark window for the governor.

### 4.2 Residency while scrolling
- **Resident set** = studio + current world + next world (in scroll direction).
- **Prefetch:** when chapter N becomes current, world N+1's chunk, GLB and textures are fetched at low priority, decoded off the main thread (KTX2 worker / `createImageBitmap`), and uploaded in idle frames. Never during a transition.
- **Dispose:** a world two stations behind the current one has its geometries, materials and textures disposed and is removed from the scene. Its HTTP cache entry stays, so coming back only costs a re-decode.
- **Fast scrolling:** the loader queue re-prioritises to the current target, and in-flight fetches for skipped worlds are aborted with `AbortController`. The transition system retargets in the meantime (camera spring, table profile).
- **Sections 05–08:** only the studio stays resident, with the lamp dimmed.
- **Case-study pages:** no 3D at all. Static still + HTML, ≤ 15 KB of JS.
- **Context loss:** show the matching still immediately, attempt one restore by re-uploading from cache, and stay on T3 after a second loss.
- **Hidden tab or canvas out of view:** zero frames. The scheduler stops `invalidate()`.

### 4.3 Render loop
`frameloop="demand"`. `motion/scheduler.ts` is the only rAF owner. It runs only while a spring, index profile, crossfade or parallax is active, and calls `invalidate()` once per tick. Components read motion values in `useFrame`. Hotspot overlay positions update only on frames where the camera moved.

---

## 5. Adaptive quality architecture

```
[head inline gate] → static?  ── yes ──► T3 forever
        │ no
[probe.ts] WebGL2 OK? ── no ──► T3, no 3D requested
        │ yes
[score.ts] signals → provisional tier + DPR
        │
[store.ts] ◄── manual choice (QualityControl) ── persistence.ts (only if "Remember")
        │
[profiles.ts] → stage applies DPR / LOD / textures / MSAA / density
        │
[governor.ts] ◄── frame samples from scheduler (rendered frames during motion only)
        └─► step down: DPR → optional detail → tier (≤ 2 changes, 10 s cooldown, never auto-up)
```

- **Probe:**
  1. `canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true })` on a detached canvas. It records the max texture size, compressed texture extensions, and the renderer string (`WEBGL_debug_renderer_info` when exposed), then releases the context through `WEBGL_lose_context`.
  2. A null result, or a software renderer (SwiftShader, llvmpipe), means T3.
  3. The result is cached in `sessionStorage` for the visit.
  4. This is the only WebGL call ever made on a device that ends up on T3. It's a few lines of code with no library behind it.
- **Score (pure, fixture-tested):**
  - device memory ≤ 4 GB or threads ≤ 4 → cap at T2, DPR 1. The i5-4210U (2 cores / 4 threads) lands here.
  - max texture size < 4096 → T2.
  - drawing buffer above 4.5 MP → lower DPR.
  - unknown values never count as high.
- **Profiles:** one table per tier: DPR cap, GLB variant, texture set (`t1.ktx2` / `t1.webp` fallback / `t2.webp`), MSAA (only at DPR ≤ 1.25), instance density, which animations run, parallax on/off.
- **Switching at runtime, without a reload:**
  - T1 ↔ T2: load the new set for resident worlds, swap, dispose the old one.
  - Live → T3: unmount the Canvas and show the matching still.
  - T3 → live (manual only): mount the stage fresh.
- **Motion policy is independent of tier.** Reduced motion means static even if the visitor picks High.
- **Development only:** a perf overlay (p50/p90/max, draw calls, triangles, GPU memory ledger, chosen tier and the reason) behind `?debug` in dev builds. It's stripped from production. No production telemetry.

---

## 6. Testing and deployment workflow

### 6.1 Automated

| Layer | Tool | Covers |
|---|---|---|
| Unit | vitest | Springs and index profile (continuity under interruption, ≤ 0.5° settle), score fixtures (HD 4400, no WebGL2, SwiftShader, Safari with no `deviceMemory`), governor with synthetic frame streams (no oscillation), chapter and hash logic, content schema |
| Component | Testing Library | Header, menu (focus trap, Esc), quality radiogroup, experience accordion, copy-email live region, StockPred slider keys |
| End-to-end | Playwright: Chromium, Firefox, WebKit | Every route with **JS disabled** (content present); deep links; Back from a case study; **reduced motion** (no 3D request, `getAnimations()` empty); **WebGL disabled** via launch flag (T3, network log free of 3D); 404 |
| Accessibility | @axe-core/playwright | Every chapter state, the 4 routes and the 404: 0 serious or critical issues |
| Visual | Playwright screenshots | T3 layouts at 390 / 834 / 1440 / 844×390 landscape. Live WebGL frames aren't snapshot-compared, because output varies by GPU |
| Budgets | check-budgets.mjs | Initial JS, deferred JS, per-chapter assets, first view. Fails the build |
| Content | check-verify.mjs | **Production builds fail if any rendered fact is `verify` or `assumed`**. Preview builds show them as visible tags |
| Performance | @lhci/cli | Lighthouse mobile median of 3, default and reduced-motion runs, with budget assertions |

### 6.2 Manual device protocol (`docs/device-test-protocol.md`)
- **Step 0, before any 3D code:** open `/dev/probe.html` on each device and browser. Record the WebGL2 result, renderer string, extensions, max texture size and compressed formats. **The HD 4400 result decides whether that laptop is a T2 or a T3 test device.**
- **At each milestone:** on the Victus RTX, Victus 760M, HD 4400 and low-end Android (to be confirmed), record OS, browser, renderer string, tier chosen and why, p50/p90/max for index / descent / inside moves (10 runs), draw calls, triangles, the GPU memory ledger plus the Chrome Task Manager GPU memory column, idle frame count, and keyboard and screen-reader spot checks.

### 6.3 Deploy
- **Git:** `main` deploys to production on the custom domain. Feature branches get Vercel preview URLs.
- **Vercel build command:** `npm run build`, which runs client build → SSR build → prerender → budget gate → verify gate. A failed gate blocks the deploy.
- **Tests:** Playwright and Lighthouse CI run in GitHub Actions on pull requests (needs a GitHub repo; see §7), or locally before pushing if you'd rather not use Actions.
- **Large source files:** `.blend` files go through Git LFS, or stay out of git with a separate backup (your choice, §7). Built assets in `public/` are small enough for normal git.

### 6.4 Milestones (one at a time, each validated before the next)

| M | Scope | Exit criteria |
|---|---|---|
| **M0** | Scaffold, tokens, fonts, prerender pipeline, `probe.html`, budget and verify gates, Vercel preview | Probe results from your devices recorded; empty pages prerender; gates run in the build |
| **M1** | Hero and header in HTML/T3: still renderer, quality control UI, mobile menu, reduced-motion gate | Hero matches the canvas at 390 / 834 / 1440; LCP and CLS checked; works with JS off |
| **M2** | Studio + Revolve in 3D: scripted Blender blockout → bake → export → stage host, camera rig, index motion, governor | First live frame matches the T3 still; budgets met; measured on all devices |
| M3 | GestureIQ world + descent | — |
| M4–M6 | StockPred, PRAVAH, Kareerist worlds | — |
| M7 | Chapters 05–08 | — |
| M8 | Case-study routes | — |
| M9 | Full QA (Stage 06), then launch | — |

We start with M0–M2 only.

**Status**
- **M0** — done 2026-11-11.
- **M1** — built 2026-11-12: header (dial, nav, quality control, mobile menu), hero at 390 / 834 / 1440, phone-landscape layout, JS-off and reduced-motion paths, vanilla controllers, quality store with opt-in persistence. Hero stills are **placeholder SVGs** generated from the approved plate (`scripts/gen-placeholder-stills.mjs`); Blender renders replace them in M2. Quality choices are stored but have no effect until M2 builds the live scene. Not yet done from the M1 exit criteria: Lighthouse and throttled LCP (needs `@lhci/cli`; local unthrottled LCP/CLS are measured in the e2e tests), axe audit (needs `@axe-core/playwright`), Firefox and WebKit runs.

---

## 7. What I need from you before implementation

**Before M0 (scaffold):**
1. **Git:** may I `git init` the folder? GitHub repo name, and public or private? (`main` will be the production branch.)
2. **Node:** installed version (needs ≥ 20 LTS). npm is assumed unless you prefer pnpm.
3. **Blender:** installed version, and whether bakes run on the RTX 2050 (CUDA/OptiX) on Linux or Windows.
4. **KTX-Software (`toktx`):** installed on the Victus (needed from M2).
5. **`.blend` storage:** Git LFS, or kept out of git with a separate backup.

**Right after M0 (blocks the tier decisions):**
6. **Probe results:** run `/dev/probe.html` on the Victus with the RTX selected, the Victus on the Radeon 760M, the **HD 4400 laptop (which OS? which browser and version?)**, and the Android phone once you've chosen one. Paste the output back to me.

**Before M1 (hero):**
7. **Hero copy:** confirm or edit "AI Engineer and Backend Engineer. I build intelligent systems and the backends that keep them dependable." Until you confirm it, it ships to preview marked VERIFY.
8. **Public links:** contact email, GitHub URL, LinkedIn URL.
9. **CV:** the PDF (can come later, but the link stays disabled until it arrives).
10. **Domain:** the domain name and registrar. Needed for canonical URLs and OG tags; previews work without it.
11. **Favicon:** a monogram is my default unless you have a mark.

**Before M2 (Revolve):**
12. Approval of the scripted blockout. I write the `bpy` scripts; you run them in Blender and send renders or screenshots back.
13. Your Blender comfort level: bake and export only, or do you also want to refine materials and wear by hand?

**Later, per world (unchanged from the readiness board):** every project fact, the architecture, contribution, results, links and media; experience; bio and principles; the GestureIQ hand model (your sculpt, or a CC0/CC-BY model with attribution); the real PRAVAH layers and Kareerist service split. All stay **VERIFY** until you supply them.
