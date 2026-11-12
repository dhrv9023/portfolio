/**
 * Visitor's rendering-quality choice. Pure TypeScript (no DOM, React or three) so it unit-tests in Node.
 * Persistence is opt-in ("Remember on this device") and fully guarded: storage can be missing, blocked or full.
 */
export const QUALITY_CHOICES = ['auto', 'high', 'balanced', 'low'] as const;
export type QualityChoice = (typeof QUALITY_CHOICES)[number];

export interface QualityState {
  readonly choice: QualityChoice;
  /** True only if the visitor ticked "Remember"; then the choice is stored. */
  readonly remember: boolean;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const QUALITY_STORAGE_KEY = 'portfolio:quality:v1';

export const isQualityChoice = (v: unknown): v is QualityChoice =>
  typeof v === 'string' && (QUALITY_CHOICES as readonly string[]).includes(v);

function load(storage: StorageLike | null): QualityState {
  try {
    const raw = storage?.getItem(QUALITY_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      const choice = typeof parsed === 'object' && parsed !== null ? (parsed as { choice?: unknown }).choice : undefined;
      if (isQualityChoice(choice)) return { choice, remember: true };
    }
  } catch {
    /* unreadable storage or corrupt value: fall through to the default */
  }
  return { choice: 'auto', remember: false };
}

export function createQualityStore(storage: StorageLike | null) {
  let state = load(storage);
  const listeners = new Set<(s: QualityState) => void>();

  const persist = () => {
    try {
      if (state.remember) storage?.setItem(QUALITY_STORAGE_KEY, JSON.stringify({ choice: state.choice }));
      else storage?.removeItem(QUALITY_STORAGE_KEY);
    } catch {
      /* quota exceeded or blocked: the choice still applies for this visit */
    }
  };
  const update = (next: QualityState) => {
    state = next;
    persist();
    listeners.forEach((l) => l(state));
  };

  return {
    get: (): QualityState => state,
    setChoice(choice: unknown): void {
      if (isQualityChoice(choice) && choice !== state.choice) update({ ...state, choice });
    },
    setRemember(remember: boolean): void {
      if (remember !== state.remember) update({ ...state, remember });
    },
    subscribe(listener: (s: QualityState) => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type QualityStore = ReturnType<typeof createQualityStore>;
