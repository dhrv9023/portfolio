import { describe, expect, it } from 'vitest';
import { nextFocusIndex } from '../../src/client/focus';
import { createQualityStore, QUALITY_STORAGE_KEY, type StorageLike } from '../../src/quality/store';

const fakeStorage = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  const s: StorageLike & { data: Record<string, string> } = {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  };
  return s;
};

describe('quality store', () => {
  it('defaults to auto, not remembered', () => {
    expect(createQualityStore(fakeStorage()).get()).toEqual({ choice: 'auto', remember: false });
  });

  it('stores nothing unless the visitor opts in to "Remember"', () => {
    const s = fakeStorage();
    const store = createQualityStore(s);
    store.setChoice('low');
    expect(store.get().choice).toBe('low');
    expect(s.data).toEqual({});
    store.setRemember(true);
    expect(JSON.parse(s.data[QUALITY_STORAGE_KEY] ?? '{}')).toEqual({ choice: 'low' });
    store.setChoice('high');
    expect(JSON.parse(s.data[QUALITY_STORAGE_KEY] ?? '{}')).toEqual({ choice: 'high' });
  });

  it('unticking Remember deletes the stored value but keeps the current choice', () => {
    const s = fakeStorage();
    const store = createQualityStore(s);
    store.setRemember(true);
    store.setChoice('balanced');
    store.setRemember(false);
    expect(s.data).toEqual({});
    expect(store.get()).toEqual({ choice: 'balanced', remember: false });
  });

  it('restores a remembered choice on the next visit', () => {
    const s = fakeStorage({ [QUALITY_STORAGE_KEY]: JSON.stringify({ choice: 'balanced' }) });
    expect(createQualityStore(s).get()).toEqual({ choice: 'balanced', remember: true });
  });

  it('ignores corrupt or unknown stored values', () => {
    for (const bad of ['not json', '{"choice":"ultra"}', '[]', 'null', '{}']) {
      expect(createQualityStore(fakeStorage({ [QUALITY_STORAGE_KEY]: bad })).get()).toEqual({ choice: 'auto', remember: false });
    }
  });

  it('rejects invalid choices', () => {
    const store = createQualityStore(fakeStorage());
    store.setChoice('ultra');
    store.setChoice(42);
    expect(store.get().choice).toBe('auto');
  });

  it('survives missing or throwing storage', () => {
    expect(createQualityStore(null).get().choice).toBe('auto');
    const boom: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('full'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    const store = createQualityStore(boom);
    expect(() => { store.setRemember(true); store.setChoice('low'); }).not.toThrow();
    expect(store.get()).toEqual({ choice: 'low', remember: true });
  });

  it('notifies subscribers only on real changes and supports unsubscribe', () => {
    const store = createQualityStore(null);
    const seen: string[] = [];
    const off = store.subscribe((s) => seen.push(s.choice));
    store.setChoice('high');
    store.setChoice('high');
    off();
    store.setChoice('low');
    expect(seen).toEqual(['high']);
  });
});

describe('focus trap', () => {
  it('wraps forwards and backwards', () => {
    expect(nextFocusIndex(0, 3, false)).toBe(1);
    expect(nextFocusIndex(2, 3, false)).toBe(0);
    expect(nextFocusIndex(0, 3, true)).toBe(2);
    expect(nextFocusIndex(2, 3, true)).toBe(1);
  });
  it('enters the trap from outside and handles empty lists', () => {
    expect(nextFocusIndex(-1, 3, false)).toBe(0);
    expect(nextFocusIndex(-1, 3, true)).toBe(2);
    expect(nextFocusIndex(0, 0, false)).toBe(-1);
  });
});
