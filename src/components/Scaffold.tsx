import { useReport } from './Fact';

/** Marks unfinished structure. Counts as unresolved, so a release build can never ship it. */
export function Scaffold({ id, what, milestone }: { id: string; what: string; milestone: string }) {
  const text = `Scaffold — ${what} is built in ${milestone}.`;
  useReport({ id, status: 'scaffold', text });
  return (
    <p className="scaffold" data-fact-status="scaffold" data-fact-id={id}>
      {text}
    </p>
  );
}
