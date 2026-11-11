/**
 * Every claim that could be published is a Fact.
 *
 *  known   – confirmed by Dhruv (or structural/design copy that makes no claim)
 *  assumed – a design proposal or inference; never true until confirmed
 *  verify  – a placeholder or unconfirmed value that Dhruv must supply or confirm
 *
 * Preview builds render non-known facts with a visible status tag.
 * Release builds (SITE_RELEASE=1 or VERCEL_ENV=production) fail if any non-known
 * fact is rendered — see scripts/check-verify.mjs.
 */
export type FactStatus = 'known' | 'assumed' | 'verify';

export interface Fact<T = string> {
  readonly value: T;
  readonly status: FactStatus;
  /** Where the value came from, so verification is traceable. */
  readonly source?: string;
}

export const known = <T>(value: T, source: string): Fact<T> => ({ value, status: 'known', source });

export const assumed = <T>(value: T, source = 'design proposal — not confirmed'): Fact<T> => ({
  value,
  status: 'assumed',
  source,
});

export const verify = <T>(value: T, source = 'placeholder — awaiting Dhruv'): Fact<T> => ({
  value,
  status: 'verify',
  source,
});

export const isResolved = (fact: Fact<unknown>): boolean => fact.status === 'known';

export const factText = (fact: Fact<string | readonly string[]>): string =>
  typeof fact.value === 'string' ? fact.value : fact.value.join(' · ');
