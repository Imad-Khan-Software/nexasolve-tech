import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Eye, UserPlus, UserCheck, Calendar, CalendarDays, CalendarRange, Clock, Layers } from 'lucide-react';
import { Loading } from '../../components/common/Loading.jsx';
import { ErrorState } from '../../components/common/ErrorState.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import { useAnalytics } from '../../hooks/useAnalytics.js';
import { useEngagementDashboard } from '../../hooks/useEngagementDashboard.js';
import {
  formatDuration,
  totalActiveSeconds,
  uniqueVisitorCount,
  uniqueSessionCount,
  averageSessionDuration,
  averagePerVisitor,
  topEngagedVisitors,
  topEngagedPages,
  dailyBreakdown,
  buildSessionSourceMap,
  engagementBySource,
  buildClientLabels,
} from '../../lib/engagementAnalytics.js';

const DATE_FILTERS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom Range' },
];

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * PART 12/13 — custom date-range picker. Reuses the existing filter
 * architecture (filterKey === 'custom' is just another value already
 * understood by resolveDateRange() in analyticsService.js) rather than
 * introducing a second filter system. `start`/`end` are draft values;
 * nothing is applied — and no extra fetch fires — until "Apply" is
 * pressed, so typing into the date inputs doesn't re-query on every
 * keystroke.
 */
function CustomRangeControls({ customRange, onApply }) {
  const [start, setStart] = useState(customRange?.start || '');
  const [end, setEnd] = useState(customRange?.end || '');
  const [validationError, setValidationError] = useState(null);
  const maxDate = todayIsoDate();

  function handleApply() {
    if (!start || !end) {
      setValidationError('Choose both a start and end date.');
      return;
    }
    if (start > end) {
      setValidationError('Start date must be on or before the end date.');
      return;
    }
    setValidationError(null);
    onApply({ start, end });
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-DEFAULT border border-border bg-background-surface px-3 py-2">
      <label className="flex flex-col text-xs text-foreground-subtle">
        Start
        <input
          type="date"
          value={start}
          max={end || maxDate}
          onChange={(e) => setStart(e.target.value)}
          className="mt-1 rounded-DEFAULT border border-border bg-background px-2 py-1 text-sm text-foreground"
        />
      </label>
      <label className="flex flex-col text-xs text-foreground-subtle">
        End
        <input
          type="date"
          value={end}
          min={start}
          max={maxDate}
          onChange={(e) => setEnd(e.target.value)}
          className="mt-1 rounded-DEFAULT border border-border bg-background px-2 py-1 text-sm text-foreground"
        />
      </label>
      <button
        type="button"
        onClick={handleApply}
        className="rounded-DEFAULT border border-accent bg-accent-muted px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-muted/80"
      >
        Apply
      </button>
      {validationError && <p className="w-full text-xs text-red-500">{validationError}</p>}
      {!validationError && customRange?.start && customRange?.end && (
        <p className="w-full text-xs text-foreground-subtle">
          Showing {customRange.start} to {customRange.end}.
        </p>
      )}
    </div>
  );
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

/** A labeled horizontal bar list — used for sources, pages, and countries. */
function BarList({ title, items, emptyLabel }) {
  const max = items.reduce((m, item) => Math.max(m, item.count), 0) || 1;
  return (
    <div className="rounded-lg border border-border bg-background-surface p-5">
      <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-subtle">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map(({ label, count }) => (
            <li key={label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{label}</span>
                <span className="font-medium text-foreground-muted">{count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-raised">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(4, Math.round((count / max) * 100))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Simple dependency-free SVG bar chart for the "visitors over time" series. */
function TimeSeriesChart({ days }) {
  const max = days.reduce((m, d) => Math.max(m, d.count), 0) || 1;
  const width = 700;
  const height = 160;
  const barGap = 6;
  const barWidth = days.length ? (width - barGap * (days.length - 1)) / days.length : 0;

  return (
    <div className="rounded-lg border border-border bg-background-surface p-5">
      <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Visitors Over Time</h2>
      {days.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-subtle">No visits recorded in this range.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-40 w-full" preserveAspectRatio="none">
            {days.map((d, i) => {
              const barHeight = Math.max(2, Math.round((d.count / max) * (height - 4)));
              const x = i * (barWidth + barGap);
              const y = height - barHeight;
              return (
                <rect
                  key={d.label}
                  x={x}
                  y={y}
                  width={Math.max(1, barWidth)}
                  height={barHeight}
                  rx={2}
                  className="fill-accent"
                >
                  <title>{`${d.label}: ${d.count}`}</title>
                </rect>
              );
            })}
          </svg>
          <div className="mt-2 flex justify-between text-[10px] text-foreground-subtle">
            <span>{days[0]?.label}</span>
            {days.length > 1 && <span>{days[days.length - 1]?.label}</span>}
          </div>
        </>
      )}
    </div>
  );
}

/** Daily active-time bar chart — PART 10/11 (weekly/monthly breakdown). */
function DailyEngagementChart({ days }) {
  const max = days.reduce((m, d) => Math.max(m, d.seconds), 0) || 1;
  const width = 700;
  const height = 160;
  const barGap = 6;
  const barWidth = days.length ? (width - barGap * (days.length - 1)) / days.length : 0;

  return (
    <div className="rounded-lg border border-border bg-background-surface p-5">
      <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
        Active Time by Day
      </h2>
      {days.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-subtle">No engagement recorded in this range.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-40 w-full" preserveAspectRatio="none">
            {days.map((d, i) => {
              const barHeight = Math.max(2, Math.round((d.seconds / max) * (height - 4)));
              const x = i * (barWidth + barGap);
              const y = height - barHeight;
              return (
                <rect key={d.date} x={x} y={y} width={Math.max(1, barWidth)} height={barHeight} rx={2} className="fill-accent">
                  <title>{`${new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}: ${formatDuration(d.seconds)}`}</title>
                </rect>
              );
            })}
          </svg>
          <div className="mt-2 flex justify-between text-[10px] text-foreground-subtle">
            <span>{days[0] ? new Date(days[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
            {days.length > 1 && (
              <span>
                {new Date(days[days.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * PARTS 9-15 — active-time engagement dashboard, appended to the
 * existing analytics page (reuses the same date filter as the page-view
 * stats above, per PART 12: "do not create a separate analytics page").
 */
function EngagementSection({ filterKey, customRange }) {
  const { engagementRows, analyticsRows, directory, status } = useEngagementDashboard(filterKey, customRange);

  const clientLabels = useMemo(() => buildClientLabels(directory), [directory]);
  const tzOffsetMinutes = -new Date().getTimezoneOffset();

  const stats = useMemo(
    () => ({
      totalTime: totalActiveSeconds(engagementRows),
      visitors: uniqueVisitorCount(engagementRows),
      avgVisitorTime: averagePerVisitor(engagementRows),
      sessions: uniqueSessionCount(engagementRows),
      avgSession: averageSessionDuration(engagementRows),
    }),
    [engagementRows]
  );

  const daily = useMemo(() => dailyBreakdown(engagementRows, tzOffsetMinutes), [engagementRows, tzOffsetMinutes]);
  const topVisitors = useMemo(() => topEngagedVisitors(engagementRows, 10), [engagementRows]);
  const topPages = useMemo(() => topEngagedPages(engagementRows, 10), [engagementRows]);
  const sourceTable = useMemo(() => {
    const sessionSourceMap = buildSessionSourceMap(analyticsRows);
    return engagementBySource(engagementRows, sessionSourceMap);
  }, [engagementRows, analyticsRows]);

  if (status === 'loading') return <Loading label="Loading engagement data…" />;
  if (status !== 'success') return null;

  if (engagementRows.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No engagement data in this range"
        description="Active time-on-page will appear here as visitors browse the public site."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} label="Total Active Time" value={formatDuration(stats.totalTime)} />
        <StatCard icon={Clock} label="Avg Visitor Time" value={formatDuration(stats.avgVisitorTime)} />
        <StatCard icon={Layers} label="Sessions" value={stats.sessions} />
        <StatCard icon={Clock} label="Avg Session Duration" value={formatDuration(stats.avgSession)} />
      </div>

      <DailyEngagementChart days={daily} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-background-surface p-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Most Engaged Visitors
          </h2>
          {topVisitors.length === 0 ? (
            <p className="mt-4 text-sm text-foreground-subtle">No visitor engagement yet.</p>
          ) : (
            <ul className="mt-3 space-y-1">
              {topVisitors.map((v, i) => (
                <li key={v.visitorId}>
                  <Link
                    to={`/admin/visitors/${v.visitorId}`}
                    className="flex items-center justify-between rounded-DEFAULT border-b border-border px-1 py-2 text-sm last:border-0 hover:bg-background-raised"
                  >
                    <span className="text-foreground">
                      {i + 1}. {clientLabels.get(v.visitorId) || 'Unknown Client'}
                    </span>
                    <span className="font-medium text-foreground-muted">{formatDuration(v.seconds)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-background-surface p-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Most Engaged Pages
          </h2>
          {topPages.length === 0 ? (
            <p className="mt-4 text-sm text-foreground-subtle">No page engagement yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground-subtle">
                    <th className="py-2 pr-4 font-medium">Page</th>
                    <th className="py-2 pr-4 font-medium">Visits</th>
                    <th className="py-2 pr-4 font-medium">Unique</th>
                    <th className="py-2 pr-4 font-medium">Avg</th>
                    <th className="py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((p) => (
                    <tr key={p.pagePath} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-4 text-foreground">{p.pagePath}</td>
                      <td className="py-2.5 pr-4 text-foreground-muted">{p.visits}</td>
                      <td className="py-2.5 pr-4 text-foreground-muted">{p.uniqueVisitors}</td>
                      <td className="py-2.5 pr-4 text-foreground-muted">{formatDuration(p.avgSeconds)}</td>
                      <td className="py-2.5 text-foreground-muted">{formatDuration(p.seconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background-surface p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          Traffic Source + Time
        </h2>
        {sourceTable.length === 0 ? (
          <p className="mt-4 text-sm text-foreground-subtle">No source data yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground-subtle">
                  <th className="py-2 pr-4 font-medium">Source</th>
                  <th className="py-2 pr-4 font-medium">Visitors</th>
                  <th className="py-2 pr-4 font-medium">Total Time</th>
                  <th className="py-2 font-medium">Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {sourceTable.map((s) => (
                  <tr key={s.source} className="border-b border-border last:border-0">
                    <td className="py-2.5 pr-4 text-foreground">{s.source}</td>
                    <td className="py-2.5 pr-4 text-foreground-muted">{s.visitors}</td>
                    <td className="py-2.5 pr-4 text-foreground-muted">{formatDuration(s.seconds)}</td>
                    <td className="py-2.5 text-foreground-muted">{formatDuration(s.avgSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function dayLabel(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Sums `rows` grouped by a key function, sorted descending, top N. */
function topCounts(rows, keyFn, limit = 8) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row) || 'Unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function AdminAnalytics() {
  const [filterKey, setFilterKey] = useState('last7');
  // Applied custom range only — set once "Apply" is pressed inside
  // CustomRangeControls, not on every keystroke. Cleared when the admin
  // switches away from 'custom' so a stale range can't silently leak
  // into a later re-selection of Custom Range.
  const [customRange, setCustomRange] = useState(null);
  const effectiveCustomRange = filterKey === 'custom' ? customRange : null;
  const { overview, rows, status, error, refetch } = useAnalytics(filterKey, effectiveCustomRange);

  const sources = useMemo(() => topCounts(rows, (r) => r.referrer), [rows]);
  const pages = useMemo(() => topCounts(rows, (r) => r.page_path), [rows]);
  const countries = useMemo(() => topCounts(rows, (r) => r.country), [rows]);
  const cities = useMemo(() => topCounts(rows, (r) => r.city, 10), [rows]);

  const devices = useMemo(() => {
    const counts = topCounts(rows, (r) => r.device_type, 3);
    const total = rows.length || 1;
    return counts.map((d) => ({ ...d, pct: Math.round((d.count / total) * 100) }));
  }, [rows]);

  const timeSeries = useMemo(() => {
    const byDay = new Map();
    for (const row of rows) {
      const key = dayLabel(row.visited_at);
      byDay.set(key, (byDay.get(key) || 0) + 1);
    }
    // rows are newest-first; reverse to chronological order for the chart
    return Array.from(byDay.entries())
      .map(([label, count]) => ({ label, count }))
      .reverse();
  }, [rows]);

  const recent = useMemo(() => rows.slice(0, 25), [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Analytics</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Anonymous, privacy-friendly visitor analytics for your public site. No names, emails, or
            precise locations are collected.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {DATE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterKey(key)}
              className={
                'rounded-DEFAULT border px-3 py-1.5 text-xs font-medium transition-colors ' +
                (filterKey === key
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-border text-foreground-muted hover:border-border-strong hover:text-foreground')
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filterKey === 'custom' && (
        <CustomRangeControls customRange={customRange} onApply={setCustomRange} />
      )}

      {filterKey === 'custom' && !effectiveCustomRange && (
        <p className="text-sm text-foreground-subtle">
          Choose a start and end date above, then press Apply to load this range.
        </p>
      )}

      {/* When Custom Range is selected but not yet applied, skip loading/
          result states entirely — resolveDateRange() falls back to
          "all time" for an unapplied custom range, and rendering that
          full-history result underneath the "choose dates" prompt above
          would be confusing. */}
      {(filterKey !== 'custom' || effectiveCustomRange) && status === 'loading' && (
        <Loading label="Loading analytics…" />
      )}

      {(filterKey !== 'custom' || effectiveCustomRange) && status === 'error' && (
        <ErrorState
          title="Couldn't load analytics"
          message={error?.message || 'Something went wrong.'}
          onRetry={refetch}
        />
      )}

      {(filterKey !== 'custom' || effectiveCustomRange) && status === 'success' && overview && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Users} label="Total Visitors" value={overview.totalVisitors} />
            <StatCard icon={Calendar} label="Today's Visitors" value={overview.todayVisitors} />
            <StatCard icon={CalendarDays} label="Visitors This Week" value={overview.weekVisitors} />
            <StatCard icon={CalendarRange} label="Visitors This Month" value={overview.monthVisitors} />
            <StatCard icon={UserPlus} label="New Visitors" value={overview.newVisitors} />
            <StatCard icon={UserCheck} label="Returning Visitors" value={overview.returningVisitors} />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={Eye}
              title="No visits recorded in this range"
              description="Analytics data will appear here as people visit your public site."
            />
          ) : (
            <>
              <TimeSeriesChart days={timeSeries} />

              <div className="grid gap-6 lg:grid-cols-2">
                <BarList title="Traffic Sources" items={sources} emptyLabel="No source data yet." />
                <BarList title="Top Pages" items={pages} emptyLabel="No page data yet." />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <BarList title="Visitor Locations" items={countries} emptyLabel="No location data yet." />
                <div className="rounded-lg border border-border bg-background-surface p-5">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Devices</h2>
                  {devices.length === 0 ? (
                    <p className="mt-4 text-sm text-foreground-subtle">No device data yet.</p>
                  ) : (
                    <ul className="mt-4 space-y-2.5">
                      {devices.map(({ label, pct, count }) => (
                        <li key={label} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{label}</span>
                            <span className="font-medium text-foreground-muted">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-raised">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {cities.length > 0 && (
                    <div className="mt-5 border-t border-border pt-4">
                      <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                        Top Cities
                      </h3>
                      <ul className="mt-2.5 flex flex-wrap gap-1.5">
                        {cities.map(({ label, count }) => (
                          <li
                            key={label}
                            className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted"
                          >
                            {label} · {count}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background-surface p-5">
                <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Recent Visitors
                </h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground-subtle">
                        <th className="py-2 pr-4 font-medium">Time</th>
                        <th className="py-2 pr-4 font-medium">Country</th>
                        <th className="py-2 pr-4 font-medium">City</th>
                        <th className="py-2 pr-4 font-medium">Device</th>
                        <th className="py-2 pr-4 font-medium">Browser</th>
                        <th className="py-2 pr-4 font-medium">Page</th>
                        <th className="py-2 font-medium">Referrer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((v) => (
                        <tr key={v.id} className="border-b border-border last:border-0">
                          <td className="py-2.5 pr-4 text-foreground-subtle">{formatTime(v.visited_at)}</td>
                          <td className="py-2.5 pr-4 text-foreground-muted">{v.country || 'Unknown'}</td>
                          <td className="py-2.5 pr-4 text-foreground-muted">{v.city || '—'}</td>
                          <td className="py-2.5 pr-4 text-foreground-muted">{v.device_type || '—'}</td>
                          <td className="py-2.5 pr-4 text-foreground-muted">{v.browser || '—'}</td>
                          <td className="py-2.5 pr-4 text-foreground">{v.page_path}</td>
                          <td className="py-2.5 text-foreground-muted">{v.referrer || 'Direct'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > recent.length && (
                  <p className="mt-3 text-xs text-foreground-subtle">
                    Showing the {recent.length} most recent of {rows.length} visits in this range.
                  </p>
                )}
              </div>
            </>
          )}

          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Engagement</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              Active time-on-page, most engaged visitors/pages, and source performance for the
              selected range above.
            </p>
          </div>
          <EngagementSection filterKey={filterKey} customRange={effectiveCustomRange} />
        </>
      )}
    </div>
  );
}
