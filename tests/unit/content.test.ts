import { describe, expect, it } from 'vitest';
import { chapters } from '../../src/content/chapters';
import { CASE_CHAPTERS, projects } from '../../src/content/projects';
import { routes } from '../../src/content/routes';
import { assumed, factText, isResolved, known, verify } from '../../src/content/schema';
import { site } from '../../src/content/site';

describe('fact schema', () => {
  it('only known facts count as resolved', () => {
    expect(isResolved(known('x', 's'))).toBe(true);
    expect(isResolved(assumed('x'))).toBe(false);
    expect(isResolved(verify('x'))).toBe(false);
  });
  it('joins list facts for display', () => {
    expect(factText(verify(['A', 'B']))).toBe('A · B');
  });
  it('every known fact carries a source', () => {
    const facts = [site.name, site.roles, site.freelance, ...projects.map((p) => p.title)];
    for (const f of facts) expect(f.source, String(f.value)).toBeTruthy();
  });
});

describe('project content stays unverified until Dhruv confirms it', () => {
  it.each(projects.map((p) => [p.id, p]))('%s: every claim except the name is unresolved', (_, p) => {
    const claims = [p.summary, p.role, p.team, p.period, p.status, p.links.github, p.links.live, p.links.video,
      p.caseStudy.problem, p.caseStudy.solution, p.caseStudy.stack, p.caseStudy.contribution,
      p.caseStudy.challenges, p.caseStudy.results, ...p.caseStudy.architecture.nodes.map((n) => n.label)];
    for (const c of claims) expect(c.status, factText(c)).not.toBe('known');
  });
  it('architecture edges only reference existing nodes', () => {
    for (const p of projects) {
      const ids = new Set(p.caseStudy.architecture.nodes.map((n) => n.id));
      for (const [a, b] of p.caseStudy.architecture.edges) {
        expect(ids.has(a) && ids.has(b), `${p.id}: ${a}→${b}`).toBe(true);
      }
    }
  });
  it('StockPred carries the illustrative-data disclosure', () => {
    const sp = projects.find((p) => p.id === 'stockpred');
    expect(sp?.disclosures?.map((d) => d.value).join(' ')).toMatch(/Illustrative series — not real market data and not model output/);
  });
  it('contact details are placeholders (never real personal data in the repo until supplied)', () => {
    for (const f of Object.values(site.contact)) expect(f.status).toBe('verify');
  });
});

describe('structure', () => {
  it('has the nine approved chapters in order', () => {
    expect(chapters.map((c) => c.number)).toEqual(['00', '01', '02', '03', '04', '05', '06', '07', '08']);
    expect(chapters.filter((c) => c.kind === 'station').map((c) => c.projectId)).toEqual(projects.map((p) => p.id));
  });
  it('has six routes with unique paths and files', () => {
    expect(routes).toHaveLength(6);
    expect(new Set(routes.map((r) => r.path)).size).toBe(6);
    expect(new Set(routes.map((r) => r.file)).size).toBe(6);
    expect(routes.filter((r) => r.kind === 'case').map((r) => r.path)).toEqual(projects.map((p) => `/work/${p.id}`));
  });
  it('case study template has the eight approved chapters', () => {
    expect(CASE_CHAPTERS.map(([k]) => k)).toEqual([
      'problem', 'solution', 'architecture', 'stack', 'contribution', 'challenges', 'results', 'links',
    ]);
  });
});
