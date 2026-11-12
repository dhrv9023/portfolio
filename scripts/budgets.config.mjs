/**
 * Budgets from the Stage 02 Performance board, rev B. Sizes are gzip transfer bytes.
 * These are targets; they become measured numbers in Stage 06.
 */
const KB = 1024;

export const budgets = {
  /** Every page: HTML document (gzip). */
  html: 12 * KB,
  /** Every page: all stylesheets (gzip). */
  css: 15 * KB,
  /** Every page: preloaded fonts (woff2 is already compressed — raw bytes). */
  fonts: 160 * KB,
  /**
   * JS requested before interaction (entry + modulepreloads + inline), every page.
   * Stage 03 decision (2026-11-12): vanilla "islands" — React lives only in the deferred 3D chunk.
   * The Stage 02 ceiling was 70 KB; the real target is ≤ 15 KB, so the gate is held at 25 KB to catch regressions.
   */
  initialJs: 25 * KB,
  /** Case-study pages: JS specific to the page, excluding chunks shared with the studio page. */
  caseOwnJs: 15 * KB,
  /** Largest preloaded hero still on any page (one variant loads per device). Stage 02: ≤ 90 KB desktop. */
  heroStill: 90 * KB,
  /** First view total for any page (HTML + CSS + initial JS + preloaded fonts; hero still added in M1). */
  firstView: 350 * KB,
  /**
   * All chunks not requested at first view (lazy 3D: React, three, R3F, scene code, worlds).
   * Stage 02 said ≈ 300 KB; React (≈ 69 KB gzip) now lives here, so the ceiling is 365 KB.
   */
  deferredJs: 365 * KB,
  /** 404 must load no JavaScript files (the inline head gate is allowed). */
  notFoundJs: 0,
  /** Inline <script> bytes per page — only the head gate (motion/data policy) is expected. */
  inlineJs: 512,
};
