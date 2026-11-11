import type { Fact } from '../schema';

export type ProjectId = 'gestureiq' | 'stockpred' | 'pravah' | 'kareerist';

export interface ArchitectureNode {
  readonly id: string;
  /** Solid in diagrams only when status is 'known'; dashed otherwise. */
  readonly label: Fact;
}

export interface CaseStudy {
  readonly problem: Fact;
  readonly solution: Fact;
  readonly architecture: {
    readonly nodes: readonly ArchitectureNode[];
    readonly edges: readonly (readonly [string, string])[];
  };
  readonly stack: Fact<readonly string[]>;
  readonly contribution: Fact;
  readonly challenges: Fact;
  readonly results: Fact;
}

export interface Project {
  readonly id: ProjectId;
  readonly number: '01' | '02' | '03' | '04';
  readonly title: Fact;
  /** Design name of the 3D environment — not a claim about the project. */
  readonly world: string;
  readonly summary: Fact;
  readonly role: Fact;
  readonly team: Fact;
  readonly period: Fact;
  readonly status: Fact;
  readonly links: { readonly github: Fact; readonly live: Fact; readonly video: Fact };
  readonly caseStudy: CaseStudy;
  /** Disclosures that must accompany the project wherever its data is shown. */
  readonly disclosures?: readonly Fact[];
}

export const CASE_CHAPTERS = [
  ['problem', 'Problem'],
  ['solution', 'Solution'],
  ['architecture', 'Architecture'],
  ['stack', 'Tech stack'],
  ['contribution', 'My contribution'],
  ['challenges', 'Technical challenges'],
  ['results', 'Results & evidence'],
  ['links', 'Links'],
] as const;
