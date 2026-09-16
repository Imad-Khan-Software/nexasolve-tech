import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, CalendarDays, CalendarRange, Layers, Eye } from 'lucide-react';
import { Loading } from '../../components/common/Loading.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { useVisitorDetail } from '../../hooks/useVisitorDetail.js';
import {
  formatDuration,
  totalActiveSeconds,
  uniqueSessionCount,
  sessionDurations,
  averageSessionDuration,
  averagePageDuration,
  topEngagedPages,
  buildClientLabels,
  filterByLocalDay,
  filterByTrailingDays,
} from '../../lib/engagementAnalytics.js';

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

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-foreground-subtle">{label}</span>
      <span className="font-medium text-foreground">{value ?? '—'}</span>
    </div>
  );
}

/**
 * PART 7/8 — individual visitor/client analytics. `visitorId` in the URL
 * is the existing anonymous analytics visitor_id from
 * lib/pageAnalytics.js — no new identity is introduced here.
 */
export function VisitorDetail() {
  const { visitorId } = useParams();
  const navigate = useNavigate();
  const { engagementRows, analyticsRows, directory, status, error, refetch } = useVisitorDetail(visitorId);

  const clientLabel = useMemo(() => {
    const labels = buildClientLabels(directory);
    return labels.get(visitorId) || 'Unknown Client';
  }, [directory, visitorId]);

  const overview = useMemo(() => {
    const todayRows = filterByLocalDay(engagementRows, 'entered_at', 0);
    const weekRows = filterByTrailingDays(engagementRows, 'entered_at', 7);
    const monthRows = filterByTrailingDays(engagementRows, 'entered_at', 30);

    return {
      total: totalActiveSeconds(engagementRows),
      today: totalActiveSeconds(todayRows),
      week: totalActiveSeconds(weekRows),
      month: totalActiveSeconds(monthRows),
      sessions: uniqueSessionCount(engagementRows),
      pageViews: analyticsRows.length,
      avgSession: averageSessionDuration(engagementRows),
      avgPage: averagePageDuration(engagementRows),
    };
  }, [engagementRows, analyticsRows]);

  const pages = useMemo(() => topEngagedPages(engagementRows, 25), [engagementRows]);

  const sessions = useMemo(() => {
    const durations = sessionDurations(engagementRows);
    const firstSeenBySession = new Map();
    for (const row of engagementRows) {
      const t = new Date(row.entered_at).getTime();
      if (!firstSeenBySession.has(row.session_id) || t < firstSeenBySession.get(row.session_id)) {
        firstSeenBySession.set(row.session_id, t);
      }
    }
    return Array.from(durations.entries())
      .map(([sessionId, seconds]) => ({
        sessionId,
        seconds,
        date: firstSeenBySession.get(sessionId),
      }))
      .sort((a, b) => b.date - a.date);
  }, [engagementRows]);

  // Visitor info card: most recent row for device/browser/location
  // (these can legitimately change visit to visit), earliest row for
  // "source" (first-touch attribution, matching the convention already
  // used for visitor_tracking.source).
  const latest = analyticsRows[0]; // fetched newest-first
  const earliest = analyticsRows[analyticsRows.length - 1];
  const firstVisit = directory.find((d) => d.visitor_id === visitorId)?.first_seen;
  const lastVisit = directory.find((d) => d.visitor_id === visitorId)?.last_seen;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/admin/visitors')}
        className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Visitors
      </button>

      <div>
        <h1 className="font-display text-xl font-semibold text-foreground">{clientLabel}</h1>
        <p className="mt-1 text-sm text-foreground-muted">Individual visitor engagement and activity.</p>
      </div>

      {status === 'loading' && <Loading label="Loading visitor…" />}
      {status === 'error' && (
        <ErrorState title="Couldn't load visitor" message={error?.message || 'Something went wrong.'} onRetry={refetch} />
      )}

      {status === 'success' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Clock} label="Total Active Time" value={formatDuration(overview.total)} />
            <StatCard icon={Calendar} label="Today's Time" value={formatDuration(overview.today)} />
            <StatCard icon={CalendarDays} label="This Week" value={formatDuration(overview.week)} />
            <StatCard icon={CalendarRange} label="This Month" value={formatDuration(overview.month)} />
            <StatCard icon={Layers} label="Sessions" value={overview.sessions} />
            <StatCard icon={Eye} label="Page Views" value={overview.pageViews} />
            <StatCard icon={Clock} label="Avg Session" value={formatDuration(overview.avgSession)} />
            <StatCard icon={Clock} label="Avg Page Time" value={formatDuration(overview.avgPage)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-background-surface p-5">
              <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Visitor</h2>
              <div className="mt-2">
                <InfoRow label="Country" value={latest?.country || 'Unknown'} />
                <InfoRow label="City" value={latest?.city} />
                <InfoRow label="Device" value={latest?.device_type} />
                <InfoRow label="Browser" value={latest?.browser} />
                <InfoRow label="Operating System" value={latest?.operating_system} />
                <InfoRow label="Source" value={earliest?.referrer || 'Direct'} />
                <InfoRow label="First Visit" value={firstVisit ? new Date(firstVisit).toLocaleDateString() : '—'} />
                <InfoRow label="Last Visit" value={lastVisit ? new Date(lastVisit).toLocaleDateString() : '—'} />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background-surface p-5">
              <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Sessions</h2>
              {sessions.length === 0 ? (
                <p className="mt-4 text-sm text-foreground-subtle">No session activity recorded yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {sessions.slice(0, 15).map((s) => (
                    <li key={s.sessionId} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
                      <span className="text-foreground-muted">
                        {s.date ? new Date(s.date).toLocaleDateString() : 'Unknown date'}
                      </span>
                      <span className="font-medium text-foreground">{formatDuration(s.seconds)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background-surface p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Pages</h2>
            {pages.length === 0 ? (
              <p className="mt-4 text-sm text-foreground-subtle">No page engagement recorded yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground-subtle">
                      <th className="py-2 pr-4 font-medium">Page</th>
                      <th className="py-2 pr-4 font-medium">Visits</th>
                      <th className="py-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((p) => (
                      <tr key={p.pagePath} className="border-b border-border last:border-0">
                        <td className="py-2.5 pr-4 text-foreground">{p.pagePath}</td>
                        <td className="py-2.5 pr-4 text-foreground-muted">{p.visits}</td>
                        <td className="py-2.5 text-foreground-muted">{formatDuration(p.seconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
