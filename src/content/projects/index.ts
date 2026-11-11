import { gestureiq } from './gestureiq';
import { kareerist } from './kareerist';
import { pravah } from './pravah';
import { stockpred } from './stockpred';
import type { Project, ProjectId } from './types';

export type { Project, ProjectId } from './types';
export { CASE_CHAPTERS } from './types';

/** Station order on the Revolve: front → right → back → left. */
export const projects: readonly Project[] = [gestureiq, stockpred, pravah, kareerist];

export const projectById = (id: ProjectId): Project => {
  const p = projects.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown project: ${id}`);
  return p;
};

export const isProjectId = (v: unknown): v is ProjectId =>
  typeof v === 'string' && projects.some((p) => p.id === v);
