import { createQualityStore, type QualityChoice, type StorageLike } from '../quality/store';

function localStore(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null; // blocked by privacy settings or a sandbox
  }
}

const label = (c: QualityChoice) => c.charAt(0).toUpperCase() + c.slice(1);

/** Binds every quality control on the page (header popover + menu panel) to one shared store. */
export function initQuality(): void {
  const store = createQualityStore(localStore());
  const root = document.documentElement;
  const radios = Array.from(document.querySelectorAll<HTMLInputElement>('[data-quality-radio]'));
  const remembers = Array.from(document.querySelectorAll<HTMLInputElement>('[data-quality-remember]'));
  const labels = Array.from(document.querySelectorAll<HTMLElement>('[data-quality-label]'));

  const render = () => {
    const s = store.get();
    radios.forEach((r) => (r.checked = r.value === s.choice));
    remembers.forEach((r) => (r.checked = s.remember));
    labels.forEach((l) => (l.textContent = label(s.choice)));
    root.setAttribute('data-quality', s.choice);
  };

  radios.forEach((r) => r.addEventListener('change', () => r.checked && store.setChoice(r.value)));
  remembers.forEach((r) => r.addEventListener('change', () => store.setRemember(r.checked)));
  store.subscribe(render);
  render();

  // Header popover
  const toggle = document.querySelector<HTMLButtonElement>('[data-quality-toggle]');
  const pop = document.getElementById('quality-pop');
  if (!toggle || !pop) return;

  const setOpen = (open: boolean, returnFocus = false) => {
    pop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) (pop.querySelector<HTMLInputElement>('input:checked') ?? pop.querySelector('input'))?.focus();
    else if (returnFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => setOpen(Boolean(pop.hidden)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !pop.hidden) {
      e.preventDefault();
      setOpen(false, true);
    }
  });
  document.addEventListener('click', (e) => {
    if (!pop.hidden && !(e.target as HTMLElement).closest('[data-quality-root]')) setOpen(false);
  });
}
