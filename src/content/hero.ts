/** Hero copy that is structure or design annotation, not a claim about Dhruv. Claims stay in site.ts as Facts. */
export const hero = {
  eyebrow: '00 — The Studio',
  ctaPrimary: { label: 'Enter the work', href: '#gestureiq' },
  ctaSecondary: { label: 'Contact', href: '#contact' },
  scrollCue: 'Scroll to enter the work',
  stillAlt:
    'Night studio: a cast-iron rotary table under a single pendant lamp, with four scale models on its stations.',
  /** Annotation labels and leader lines, in the 1440×900 coordinates of the approved desktop hero board. */
  annotations: [
    {
      lines: ['PENDANT — ON THE AXIS', 'BAKED 2700K KEY'],
      label: { x: 1096, y: 160, anchor: 'start' },
      leader: [[1004, 214], [1050, 170], [1090, 170]],
    },
    {
      lines: ['THE REVOLVE', '4 STATIONS · 90°'],
      label: { x: 1290, y: 732, anchor: 'start' },
      leader: [[1236, 640], [1262, 742], [1284, 742]],
    },
    {
      lines: ['STATION 01 AT FRONT', 'GESTUREIQ'],
      label: { x: 854, y: 790, anchor: 'end' },
      leader: [[960, 664], [900, 800], [860, 800]],
    },
  ],
} as const;

export const stills = {
  desktop: { src: '/stills/studio/hero-desktop.svg', width: 1440, height: 900, minWidth: 1024 },
  tablet: { src: '/stills/studio/hero-tablet.svg', width: 834, height: 640, minWidth: 600 },
  mobile: { src: '/stills/studio/hero-mobile.svg', width: 390, height: 440 },
} as const;
