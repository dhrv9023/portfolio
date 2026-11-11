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
  /** Studio page: JS requested before interaction (entry + modulepreloads + inline). */
  initialJs: 70 * KB,
  /** Case-study pages: JS specific to the page, excluding chunks shared with the studio page. */
  caseOwnJs: 15 * KB,
  /** First view total for any page (HTML + CSS + initial JS + preloaded fonts; hero still added in M1). */
  firstView: 350 * KB,
  /** All chunks not requested at first view (lazy 3D: three, R3F, scene code, worlds). */
  deferredJs: 300 * KB,
  /** 404 must load no JavaScript files (the inline head gate is allowed). */
  notFoundJs: 0,
  /** Inline <script> bytes per page — only the head gate (motion/data policy) is expected. */
  inlineJs: 512,
};
