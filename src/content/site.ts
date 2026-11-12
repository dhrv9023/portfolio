import { known, verify } from './schema';

const STAGE03 = 'Stage 03 decisions, 2026-11-11';

export const site = {
  name: known('Dhruv Sehgal', 'project owner'),
  /** Provisional positioning chosen by Dhruv (Stage 01 refinement). */
  roles: known('AI Engineer / Backend Engineer', 'provisional positioning, Stage 01 refinement'),
  /** Hero sentence drafted in Stage 02; confirmed by Dhruv on 2026-11-12. */
  positioning: known(
    'AI Engineer and Backend Engineer. I build intelligent systems and the backends that keep them dependable.',
    'drafted in Stage 02; confirmed by Dhruv 2026-11-12',
  ),
  description: verify(
    'Portfolio of Dhruv Sehgal, AI Engineer and Backend Engineer.',
    'meta description draft — confirm',
  ),
  freelance: known('Open to selected international freelance projects.', `${STAGE03} (#7: yes, selectively, secondary)`),
  contact: {
    email: verify('[EMAIL ADDRESS]'),
    github: verify('[GITHUB URL]'),
    linkedin: verify('[LINKEDIN URL]'),
    cv: verify('[CV PDF]'),
    availability: verify('[AVAILABILITY]'),
  },
} as const;
