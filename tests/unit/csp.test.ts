import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const gate = readFileSync(resolve(root, 'src/head/gate.inline.js'), 'utf8').trim();
const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));

describe('head gate and CSP', () => {
  it('gate script is under 512 bytes', () => {
    expect(Buffer.byteLength(gate)).toBeLessThan(512);
  });

  it("vercel.json CSP pins the gate script's sha256 (update the hash whenever the gate changes)", () => {
    const hash = `'sha256-${createHash('sha256').update(gate).digest('base64')}'`;
    const csp = vercel.headers
      .flatMap((h: { headers: { key: string; value: string }[] }) => h.headers)
      .find((h: { key: string }) => h.key === 'Content-Security-Policy')?.value as string;
    expect(csp).toContain(hash);
    expect(csp).not.toContain("'unsafe-inline' 'self'; script");
    expect(csp).toMatch(/script-src 'self' 'sha256-/);
    expect(csp).toContain("object-src 'none'");
  });

  it('gate sets static for reduced motion, reduced data and Save-Data, else full', () => {
    const run = (q: Record<string, boolean>, saveData = false) => {
      const attrs: Record<string, string> = {};
      const document = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } };
      const window = { matchMedia: (s: string) => ({ matches: Boolean(q[s]) }) };
      const navigator = { connection: { saveData } };
      new Function('window', 'navigator', 'document', gate)(window, navigator, document);
      return attrs['data-motion'];
    };
    expect(run({})).toBe('full');
    expect(run({ '(prefers-reduced-motion: reduce)': true })).toBe('static');
    expect(run({ '(prefers-reduced-data: reduce)': true })).toBe('static');
    expect(run({}, true)).toBe('static');
  });
});
