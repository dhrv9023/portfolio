#!/usr/bin/env node
import { resolve } from 'node:path';
import { checkBoundaries } from './lib/boundaries.mjs';

const violations = checkBoundaries(resolve(import.meta.dirname, '..'));
if (violations.length) {
  console.error('Architecture boundary violations:');
  for (const v of violations) console.error(`  ${v.rule}  ${v.file}  imports  ${v.spec}`);
  process.exit(1);
}
console.log('Architecture boundaries: ok');
