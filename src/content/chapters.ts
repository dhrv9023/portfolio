import type { ProjectId } from './projects';

/** Structure of the studio page — design, not claims. Milestone = when the chapter is built. */
export interface Chapter {
  readonly id: string;
  readonly number: string;
  readonly label: string;
  readonly kind: 'hero' | 'station' | 'section';
  readonly projectId?: ProjectId;
  readonly milestone: string;
}

export const chapters: readonly Chapter[] = [
  { id: 'studio', number: '00', label: 'Studio', kind: 'hero', milestone: 'M1' },
  { id: 'gestureiq', number: '01', label: 'GestureIQ', kind: 'station', projectId: 'gestureiq', milestone: 'M3' },
  { id: 'stockpred', number: '02', label: 'StockPred', kind: 'station', projectId: 'stockpred', milestone: 'M4' },
  { id: 'pravah', number: '03', label: 'PRAVAH', kind: 'station', projectId: 'pravah', milestone: 'M5' },
  { id: 'kareerist', number: '04', label: 'Kareerist', kind: 'station', projectId: 'kareerist', milestone: 'M6' },
  { id: 'experience', number: '05', label: 'Experience', kind: 'section', milestone: 'M7' },
  { id: 'toolkit', number: '06', label: 'Toolkit', kind: 'section', milestone: 'M7' },
  { id: 'about', number: '07', label: 'About', kind: 'section', milestone: 'M7' },
  { id: 'contact', number: '08', label: 'Contact', kind: 'section', milestone: 'M7' },
];

export const primaryNav = [
  { href: '/#gestureiq', label: 'Work' },
  { href: '/#experience', label: 'Experience' },
  { href: '/#toolkit', label: 'Toolkit' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
] as const;
