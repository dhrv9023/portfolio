import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles } from './html.mjs';

/**
 * Architecture rules (docs/stage-03-architecture.md §1):
 *  R1  Only src/stage/** may statically import three or @react-three/*.
 *  R2  Nothing outside src/stage/** may statically import from src/stage/**.
 *  R3  src/stage/** may be loaded with import() only from src/entries/studio.client.tsx.
 *  R4  src/motion/** and src/quality/** may not import react, three or @react-three/*.
 */
const IMPORT_RE =
  /(?:^|[;\n])\s*(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

const isThree = (s) => s === 'three' || s.startsWith('three/') || s.startsWith('@react-three/');
const isReact = (s) => s === 'react' || s.startsWith('react/') || s === 'react-dom' || s.startsWith('react-dom/');
const pointsIntoStage = (file, spec) => {
  if (!spec.startsWith('.')) return false;
  const parts = join(file, '..', spec).split(/[\\/]/);
  return parts.includes('stage') && parts[parts.indexOf('stage') - 1] === 'src';
};

export function checkBoundaries(root) {
  const srcDir = join(root, 'src');
  const files = listFiles(srcDir, (p) => /\.(ts|tsx|js|jsx|mjs)$/.test(p)).map((f) => `src/${f}`);
  const violations = [];

  for (const file of files) {
    const code = readFileSync(join(root, file), 'utf8');
    const inStage = file.startsWith('src/stage/');
    const pure = file.startsWith('src/motion/') || file.startsWith('src/quality/');
    for (const m of code.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2];
      const dynamic = Boolean(m[2]);
      if (!spec) continue;
      if (!inStage && !dynamic && isThree(spec)) violations.push({ file, spec, rule: 'R1' });
      if (!inStage && pointsIntoStage(file, spec)) {
        if (!dynamic) violations.push({ file, spec, rule: 'R2' });
        else if (file !== 'src/entries/studio.client.tsx') violations.push({ file, spec, rule: 'R3' });
      }
      if (pure && (isReact(spec) || isThree(spec))) violations.push({ file, spec, rule: 'R4' });
    }
  }
  return violations;
}
