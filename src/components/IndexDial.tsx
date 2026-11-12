/** Decorative dial from the approved header: four station ticks and the vermilion index mark. */
export function IndexDial() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeOpacity=".35" />
      <g stroke="currentColor" strokeOpacity=".5">
        <line x1="14" y1="2" x2="14" y2="6" />
        <line x1="26" y1="14" x2="22" y2="14" />
        <line x1="2" y1="14" x2="6" y2="14" />
      </g>
      <line x1="14" y1="26" x2="14" y2="19" stroke="var(--color-vermilion)" strokeWidth="2" />
    </svg>
  );
}
