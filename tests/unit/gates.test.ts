import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkBoundaries } from '../../scripts/lib/boundaries.mjs';
import { gzipSize, initialAssets } from '../../scripts/lib/html.mjs';
import { findUnresolvedInHtml, isReleaseBuild, releaseProblems } from '../../scripts/lib/unresolved.mjs';

describe('verification gate', () => {
  it('finds status markers and bracketed placeholders, ignoring scripts', () => {
    const html =
      '<p><span class="fact-unresolved" data-fact-status="verify" data-fact-id="a.b">x</span></p>' +
      '<p>Mail: [EMAIL ADDRESS]</p><script>const s = "[NOT TEXT]";</script>' +
      '<script type="application/ld+json">{"jobTitle":"[ROLE]"}</script>';
    const found = findUnresolvedInHtml(html);
    expect(found).toContainEqual({ kind: 'status', status: 'verify', id: 'a.b' });
    expect(found).toContainEqual({ kind: 'placeholder', text: '[EMAIL ADDRESS]' });
    expect(found).toContainEqual({ kind: 'placeholder', text: '[ROLE]' });
    expect(found.some((f) => 'text' in f && f.text === '[NOT TEXT]')).toBe(false);
  });

  it('does not flag ordinary text with brackets', () => {
    expect(findUnresolvedInHtml('<p>arrays like [1, 2] and [a] are fine</p>')).toEqual([]);
  });

  it('release is production-only', () => {
    expect(isReleaseBuild({})).toBe(false);
    expect(isReleaseBuild({ VERCEL_ENV: 'preview' })).toBe(false);
    expect(isReleaseBuild({ VERCEL_ENV: 'production' })).toBe(true);
    expect(isReleaseBuild({ SITE_RELEASE: '1' })).toBe(true);
  });

  it('release requires an https SITE_URL, no probe page and zero unresolved items', () => {
    const clean = releaseProblems({ env: { SITE_URL: 'https://example.com' }, htmlFindings: {}, reportEntries: [], distHasDevFolder: false });
    expect(clean).toEqual([]);
    const dirty = releaseProblems({
      env: {},
      htmlFindings: { 'index.html': [{ kind: 'placeholder', text: '[X]' }] },
      reportEntries: [{ id: 'a', status: 'verify', text: 't' }],
      distHasDevFolder: true,
    });
    expect(dirty).toHaveLength(4);
  });
});

describe('budget helpers', () => {
  it('extracts first-view assets from built HTML', () => {
    const html = `<head><script>gate()</script><script type="module" crossorigin src="/assets/a.js"></script>
      <link rel="modulepreload" crossorigin href="/assets/b.js"><link rel="stylesheet" crossorigin href="/assets/c.css">
      <link rel="preload" href="/fonts/f.woff2" as="font" type="font/woff2" crossorigin>
      <script type="application/ld+json">{"a":1}</script></head>`;
    const a = initialAssets(html);
    expect(a.scripts).toEqual(['/assets/a.js', '/assets/b.js']);
    expect(a.styles).toEqual(['/assets/c.css']);
    expect(a.fonts).toEqual(['/fonts/f.woff2']);
    expect(a.inlineScriptBytes).toBe('gate()'.length);
  });
  it('gzip size is smaller than input for repetitive text', () => {
    expect(gzipSize(Buffer.from('a'.repeat(10_000)))).toBeLessThan(100);
  });
});

describe('architecture boundaries', () => {
  it('current source tree has no violations', () => {
    expect(checkBoundaries(resolve(import.meta.dirname, '../..'))).toEqual([]);
  });
  it('catches three.js outside stage, static stage imports, and react inside quality', () => {
    const root = mkdtempSync(join(tmpdir(), 'bounds-'));
    const w = (p: string, s: string) => {
      mkdirSync(join(root, p, '..'), { recursive: true });
      writeFileSync(join(root, p), s);
    };
    w('src/chapters/Hero.tsx', "import * as THREE from 'three';\nimport { X } from '../stage/World';");
    w('src/quality/score.ts', "import { useState } from 'react';");
    w('src/components/Lazy.tsx', "const m = import('../stage/StageHost');");
    w('src/entries/studio.client.tsx', "const m = import('../stage/StageHost');");
    w('src/stage/StageHost.tsx', "import { Canvas } from '@react-three/fiber';");
    const rules = checkBoundaries(root).map((v: { file: string; rule: string }) => `${v.rule} ${v.file}`).sort();
    expect(rules).toEqual([
      'R1 src/chapters/Hero.tsx',
      'R2 src/chapters/Hero.tsx',
      'R3 src/components/Lazy.tsx',
      'R4 src/quality/score.ts',
    ]);
  });
});
