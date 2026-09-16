import { useMemo } from 'react';
import { Users, Eye } from 'lucide-react';
import { Loading } from '../../components/common/Loading.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { useVisitorTracking } from '../../hooks/useVisitorTracking.js';

function formatLastVisit(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const today = new Date();
  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString();
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-border bg-background-surface p-5">
      <div className="flex items-center gap-2 text-foreground-muted">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

/**
 * One row per (visitor, service) pair — this is the same grain the
 * underlying `visitor_tracking` table uses, so a visitor who viewed
 * multiple services appears as multiple rows (one per service), each
 * with their own visit count, rather than being incorrectly collapsed
 * into one row that could only represent a single service.
 */
export function AdminVisitors() {
  const { visitors, status, error, refetch } = useVisitorTracking();

  const { totalVisitors, totalVisits } = useMemo(() => {
    const uniqueVisitorIds = new Set(visitors.map((v) => v.visitor_id));
    const visits = visitors.reduce((sum, v) => sum + (v.visit_count || 0), 0);
    return { totalVisitors: uniqueVisitorIds.size, totalVisits: visits };
  }, [visitors]);

  // Count *unique visitors* per source, not rows — a visitor who viewed
  // two services has two visitor_tracking rows but should only count
  // once per source in this summary.
  const sourceCounts = useMemo(() => {
    const seenPerSource = new Map(); // source -> Set(visitor_id)
    for (const v of visitors) {
      const source = v.source || 'Direct';
      if (!seenPerSource.has(source)) seenPerSource.set(source, new Set());
      seenPerSource.get(source).add(v.visitor_id);
    }
    return Array.from(seenPerSource.entries())
      .map(([source, ids]) => ({ source, count: ids.size }))
      .sort((a, b) => b.count - a.count);
  }, [visitors]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">Visitors</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Simple visit tracking based on the "View Demo" and "Enquire" actions on your public
          project cards.
        </p>
      </div>

      {status === 'loading' && <Loading label="Loading visitor data…" />}

      {status === 'error' && (
        <ErrorState
          title="Couldn't load visitor data"
          message={error?.message || 'Something went wrong.'}
          onRetry={refetch}
        />
      )}

      {status === 'success' && visitors.length === 0 && (
        <EmptyState
          icon={Users}
          title="No visits recorded yet"
          description='Visits are recorded when someone clicks "View Demo" or "Enquire" on a project.'
        />
      )}

      {status === 'success' && visitors.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard icon={Users} label="Total Visitors" value={totalVisitors} />
            <StatCard icon={Eye} label="Total Visits" value={totalVisits} />
          </div>

          {sourceCounts.length > 0 && (
            <div className="rounded-lg border border-border bg-background-surface p-5">
              <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Traffic Sources
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sourceCounts.map(({ source, count }) => (
                  <li
                    key={source}
                    className="flex items-center justify-between rounded-DEFAULT border border-border px-3 py-2 text-sm"
                  >
                    <span className="text-foreground">{source}</span>
                    <span className="font-medium text-foreground-muted">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background-surface text-xs uppercase tracking-wide text-foreground-subtle">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Visits</th>
                  <th className="px-4 py-3 font-medium">Service / Page</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{v.visitor_name || 'Unknown Visitor'}</td>
                    <td className="px-4 py-3 text-foreground-muted">{v.visit_count}</td>
                    <td className="px-4 py-3 text-foreground-muted">{v.service_name}</td>
                    <td className="px-4 py-3 text-foreground-muted">{v.source || 'Direct'}</td>
                    <td className="px-4 py-3 text-foreground-subtle">{formatLastVisit(v.last_visited_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
