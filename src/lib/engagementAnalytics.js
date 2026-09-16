/**
 * Pure aggregation helpers over raw visitor_engagement / visitor_analytics
 * rows. No network calls here — this mirrors the client-side aggregation
 * style AdminAnalytics.jsx already uses (topCounts, etc.) rather than
 * introducing a parallel SQL-side aggregation convention.
 */

/** Formats a whole number of seconds as "1h 12m", "12m 34s", or "41s". */
export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Sums duration_seconds across a set of engagement rows. */
export function totalActiveSeconds(rows) {
  return rows.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
}

/** Distinct visitor_id count. */
export function uniqueVisitorCount(rows) {
  return new Set(rows.map((r) => r.visitor_id)).size;
}

/** Distinct session_id count. */
export function uniqueSessionCount(rows) {
  return new Set(rows.map((r) => r.session_id)).size;
}

/**
 * Per-session total active time. Summing engagement rows by session_id
 * (rather than re-deriving from raw timestamps) is what PART 6 means by
 * "do not double-count overlapping page visits" — each row is one
 * page-visit instance's own accounted duration, so summing them per
 * session can never double-count time already attributed to another
 * page.
 */
export function sessionDurations(rows) {
  const bySession = new Map();
  for (const r of rows) {
    bySession.set(r.session_id, (bySession.get(r.session_id) || 0) + (r.duration_seconds || 0));
  }
  return bySession;
}

export function averageSessionDuration(rows) {
  const bySession = sessionDurations(rows);
  if (bySession.size === 0) return 0;
  const total = Array.from(bySession.values()).reduce((a, b) => a + b, 0);
  return total / bySession.size;
}

export function averagePerVisitor(rows) {
  const visitors = uniqueVisitorCount(rows);
  if (visitors === 0) return 0;
  return totalActiveSeconds(rows) / visitors;
}

export function averagePageDuration(rows) {
  if (rows.length === 0) return 0;
  return totalActiveSeconds(rows) / rows.length;
}

/** Top N visitors by total active time, descending. */
export function topEngagedVisitors(rows, limit = 10) {
  const byVisitor = new Map();
  for (const r of rows) {
    byVisitor.set(r.visitor_id, (byVisitor.get(r.visitor_id) || 0) + (r.duration_seconds || 0));
  }
  return Array.from(byVisitor.entries())
    .map(([visitorId, seconds]) => ({ visitorId, seconds }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, limit);
}

/** Top N pages by total active time, with visit count, unique visitors, and avg time. */
export function topEngagedPages(rows, limit = 10) {
  const byPage = new Map();
  for (const r of rows) {
    if (!byPage.has(r.page_path)) {
      byPage.set(r.page_path, { seconds: 0, visits: 0, visitors: new Set() });
    }
    const entry = byPage.get(r.page_path);
    entry.seconds += r.duration_seconds || 0;
    entry.visits += 1;
    entry.visitors.add(r.visitor_id);
  }
  return Array.from(byPage.entries())
    .map(([pagePath, entry]) => ({
      pagePath,
      seconds: entry.seconds,
      visits: entry.visits,
      uniqueVisitors: entry.visitors.size,
      avgSeconds: entry.visits ? entry.seconds / entry.visits : 0,
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, limit);
}

/**
 * Groups active time by local calendar day. `tzOffsetMinutes` is
 * `-new Date().getTimezoneOffset()` from the caller, applied before
 * truncation so "Monday" means the visitor's/admin's local Monday, not
 * UTC Monday (PART 25). Returns entries in chronological order.
 */
export function dailyBreakdown(rows, tzOffsetMinutes = 0) {
  const byDay = new Map();
  for (const r of rows) {
    const local = new Date(new Date(r.entered_at).getTime() + tzOffsetMinutes * 60000);
    const key = local.toISOString().slice(0, 10); // YYYY-MM-DD in shifted time
    byDay.set(key, (byDay.get(key) || 0) + (r.duration_seconds || 0));
  }
  return Array.from(byDay.entries())
    .map(([date, seconds]) => ({ date, seconds }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/**
 * Maps each session_id to a traffic source label, using the *first*
 * (earliest) visitor_analytics row seen for that session — matches the
 * existing first-touch attribution convention already used for
 * visitor_tracking.source (see supabase/migrations/traffic_source.sql).
 * `analyticsRows` must include `session_id` and `referrer` (which stores
 * the classified source label — see analyticsService.recordPageView).
 */
export function buildSessionSourceMap(analyticsRows) {
  const bySession = new Map();
  // analyticsRows are fetched newest-first; iterate in reverse so the
  // EARLIEST row for each session is what ends up stored.
  for (let i = analyticsRows.length - 1; i >= 0; i -= 1) {
    const row = analyticsRows[i];
    if (!bySession.has(row.session_id)) {
      bySession.set(row.session_id, row.referrer || 'Direct');
    }
  }
  return bySession;
}

/**
 * Groups engagement rows by traffic source (via the session→source map
 * above), for PART 15's "Traffic Source + Time" table.
 */
export function engagementBySource(engagementRows, sessionSourceMap) {
  const bySource = new Map();
  for (const r of engagementRows) {
    const source = sessionSourceMap.get(r.session_id) || 'Direct';
    if (!bySource.has(source)) {
      bySource.set(source, { seconds: 0, visitors: new Set() });
    }
    const entry = bySource.get(source);
    entry.seconds += r.duration_seconds || 0;
    entry.visitors.add(r.visitor_id);
  }
  return Array.from(bySource.entries())
    .map(([source, entry]) => ({
      source,
      seconds: entry.seconds,
      visitors: entry.visitors.size,
      avgSeconds: entry.visitors.size ? entry.seconds / entry.visitors.size : 0,
    }))
    .sort((a, b) => b.seconds - a.seconds);
}

/**
 * Builds a stable "Client N" label lookup from the visitor_directory()
 * RPC result (ordered by first_seen ascending) — PART 7.
 */
export function buildClientLabels(directoryRows) {
  const labels = new Map();
  directoryRows.forEach((row, index) => {
    labels.set(row.visitor_id, `Client ${index + 1}`);
  });
  return labels;
}

/** Filters rows to a local calendar day window (today/yesterday) for client-side re-slicing of an already-fetched, wider range. */
export function filterByLocalDay(rows, dateField, daysAgo = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return rows.filter((r) => {
    const t = new Date(r[dateField]).getTime();
    return t >= start.getTime() && t < end.getTime();
  });
}

/** Filters rows to the trailing N days (local time) — used for "this week"/"this month" mini re-slices from an all-time fetch. */
export function filterByTrailingDays(rows, dateField, days) {
  const cutoff = Date.now() - days * 86400000;
  return rows.filter((r) => new Date(r[dateField]).getTime() >= cutoff);
}
