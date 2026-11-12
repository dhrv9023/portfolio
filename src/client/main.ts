/**
 * The only script every page loads. Plain TypeScript — no React, no three.js (enforced by scripts/lib/boundaries.mjs, rule R5).
 * The HTML is fully prerendered and works without this file; this adds progressive enhancement only.
 * Later milestones add: chapter observer, motion scheduler, and the lazy import() of the 3D stage (the only place it is allowed).
 */
import { initMenu } from './menu';
import { initQuality } from './quality-ui';

document.documentElement.setAttribute('data-js', '1');
initQuality();
initMenu();
