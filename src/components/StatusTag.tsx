import type { FactStatus } from '../content/schema';

export function StatusTag({ status }: { status: Exclude<FactStatus, 'known'> }) {
  return (
    <span className="status-tag" data-status={status}>
      {status === 'verify' ? 'VERIFY' : 'ASSUMED'}
    </span>
  );
}
