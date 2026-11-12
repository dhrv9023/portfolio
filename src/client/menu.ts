import { nextFocusIndex, visibleFocusables } from './focus';

/** Mobile/tablet chapter menu. Progressive enhancement: without this script the primary nav is simply visible. */
export function initMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const panel = document.getElementById('menu-panel');
  if (!toggle || !panel) return;

  const root = document.documentElement;
  const desktop = window.matchMedia('(min-width: 1024px)');
  const isOpen = () => !panel.hidden;

  const stops = () => [toggle, ...visibleFocusables(panel)];

  function setOpen(open: boolean, returnFocus = true): void {
    panel!.hidden = !open;
    toggle!.setAttribute('aria-expanded', String(open));
    toggle!.textContent = open ? 'Close' : 'Menu';
    root.toggleAttribute('data-menu-open', open);
    if (open) visibleFocusables(panel!)[0]?.focus();
    else if (returnFocus) toggle!.focus();
  }

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Tab') {
      const list = stops();
      const at = list.indexOf(document.activeElement as HTMLElement);
      const next = list[nextFocusIndex(at, list.length, e.shiftKey)];
      if (next) {
        e.preventDefault();
        next.focus();
      }
    }
  });

  // Choosing a chapter closes the menu; the browser handles the hash scroll. Focus follows the target section.
  panel.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a[href^="#"]')) setOpen(false, false);
  });

  const onWide = () => {
    if (desktop.matches && isOpen()) setOpen(false, false);
  };
  desktop.addEventListener('change', onWide);
}
