import { createContext, useContext } from 'react';
import { factText, type Fact, type FactStatus } from '../content/schema';
import { StatusTag } from './StatusTag';

export interface UnresolvedEntry {
  readonly id: string;
  readonly status: Exclude<FactStatus, 'known'> | 'scaffold';
  readonly text: string;
  readonly source?: string;
}

/**
 * Present only during the build-time prerender. Every unresolved fact or scaffold note
 * that renders is recorded here, so scripts/check-verify.mjs can block a release build.
 * On the client it is null and nothing is collected.
 */
export const FactCollectorContext = createContext<UnresolvedEntry[] | null>(null);

export function useReport(entry: UnresolvedEntry): void {
  const collector = useContext(FactCollectorContext);
  if (collector) collector.push(entry);
}

function toEntry(id: string, fact: Fact<string | readonly string[]>): UnresolvedEntry | null {
  if (fact.status === 'known') return null;
  return fact.source
    ? { id, status: fact.status, text: factText(fact), source: fact.source }
    : { id, status: fact.status, text: factText(fact) };
}

/** Renders a fact. Unresolved facts carry data-fact-status and a visible status tag. */
export function FactText({ id, fact }: { id: string; fact: Fact<string | readonly string[]> }) {
  const entry = toEntry(id, fact);
  const collector = useContext(FactCollectorContext);
  if (collector && entry) collector.push(entry);

  const text = factText(fact);
  if (fact.status === 'known') return <>{text}</>;
  return (
    <span className="fact-unresolved" data-fact-status={fact.status} data-fact-id={id}>
      {text}
      <StatusTag status={fact.status} />
    </span>
  );
}
