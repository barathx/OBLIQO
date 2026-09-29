import { Link } from '@tanstack/react-router';
import { useObliqo } from '@/hooks/use-obliqo';
import { SourceBadge } from '@/components/obligations/shared';
import type { ConnectedSource } from '@/types/obligation';

export function SourceActivity() {
  const { lastScan } = useObliqo();
  const entries = Object.entries(lastScan.bySource) as [ConnectedSource, number][];
  return (
    <section className="border-t border-border pt-5" aria-labelledby="source-activity">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="source-activity" className="text-sm font-semibold">Source activity</h2>
        <Link to="/obligations" className="text-xs text-teal hover:underline">Sources</Link>
      </div>
      <p className="text-xs text-muted-foreground">Last scan · {lastScan.scannedAt}</p>
      <p className="mt-1 text-sm">{lastScan.detected} {lastScan.detected === 1 ? 'obligation' : 'obligations'} detected</p>
      {entries.length > 0 && (
        <ul className="mt-3 space-y-2">
          {entries.map(([source, n]) => (
            <li key={source} className="flex items-center justify-between text-xs">
              <SourceBadge source={source} />
              <span className="text-muted-foreground">{n} new {n === 1 ? 'obligation' : 'obligations'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
