import { supabase } from './supabase.js';

import {
  getOrCreateSessionId,
  getOrCreateAnalyticsVisitorId,
  getSessionReferrerSource,
  detectDeviceType,
  detectBrowser,
  detectOperatingSystem,
  fetchApproxLocation,
} from '../lib/pageAnalytics.js';

/**
 * Records one page view via the record_page_view RPC.
 * Tracking errors are caught so analytics never breaks the public website.
 */
export async function recordPageView(pagePath) {
  if (!pagePath) return;

  try {
    const location = await fetchApproxLocation();
    const source = getSessionReferrerSource();

    const { error } = await supabase.rpc('record_page_view', {
      p_session_id: getOrCreateSessionId(),
      p_visitor_id: getOrCreateAnalyticsVisitorId(),
      p_page_path: pagePath,
      p_referrer: source,
      p_country: location.country,
      p_city: location.city,
      p_region: location.region,
      p_device_type: detectDeviceType(),
      p_browser: detectBrowser(),
      p_operating_system: detectOperatingSystem(),
      p_screen_width: window.screen?.width ?? null,
      p_screen_height: window.screen?.height ?? null,
    });

    if (error) throw error;
  } catch (err) {
    // Analytics must never break the public website.
    console.error(
      'recordPageView failed (tracking only, site is unaffected):',
      err
    );
  }
}

// ---------------------------------------------------------------------
// Admin analytics
// ---------------------------------------------------------------------

const MAX_ROWS_FOR_BREAKDOWN = 5000;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Resolves a date filter into a since/until range.
 *
 * `customRange` is only consulted when filterKey === 'custom' — it is
 * `{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }` as typed into the Custom
 * Range inputs (see AdminAnalytics.jsx). Both bounds are parsed as
 * LOCAL calendar dates (not UTC) via `new Date(y, m-1, d)`, matching
 * `startOfToday()`'s own local-midnight convention, so "Aug 1 to Aug 23"
 * means the admin's local Aug 1 00:00 through the end of their local
 * Aug 23 — not a UTC-shifted day. `until` is exclusive and set to the
 * local midnight *after* the end date so the entire end day is
 * included, the same way the existing 'yesterday' case already does.
 */
export function resolveDateRange(filterKey, customRange) {
  const today = startOfToday();

  switch (filterKey) {
    case 'today':
      return {
        since: today,
        until: null,
      };

    case 'yesterday': {
      const start = new Date(today);
      start.setDate(start.getDate() - 1);

      return {
        since: start,
        until: today,
      };
    }

    case 'custom': {
      if (!customRange?.start || !customRange?.end) {
        // No valid range chosen yet — fall back to "all time" rather
        // than throwing, so the UI can render something reasonable
        // while the admin is still picking dates.
        return { since: null, until: null };
      }
      const [sy, sm, sd] = customRange.start.split('-').map(Number);
      const [ey, em, ed] = customRange.end.split('-').map(Number);
      const since = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const until = new Date(ey, em - 1, ed, 0, 0, 0, 0);
      until.setDate(until.getDate() + 1); // exclusive upper bound, includes the full end day
      return { since, until };
    }

    case 'last7':
      return {
        since: new Date(today.getTime() - 7 * 86400000),
        until: null,
      };

    case 'last30':
      return {
        since: new Date(today.getTime() - 30 * 86400000),
        until: null,
      };

    case 'all':
    default:
      return {
        since: null,
        until: null,
      };
  }
}

function applyRange(query, since, until) {
  let q = query;

  if (since) {
    q = q.gte('visited_at', since.toISOString());
  }

  if (until) {
    q = q.lt('visited_at', until.toISOString());
  }

  return q;
}

async function fetchUniqueVisitorCounts(since, until) {
  const { data, error } = await supabase.rpc('analytics_overview', {
    p_since: since ? since.toISOString() : null,
    p_until: until ? until.toISOString() : null,
  });

  if (error) throw error;

  const row = data?.[0] || {
    total_visitors: 0,
    new_visitors: 0,
    returning_visitors: 0,
  };

  return {
    total: Number(row.total_visitors) || 0,
    newVisitors: Number(row.new_visitors) || 0,
    returningVisitors: Number(row.returning_visitors) || 0,
  };
}

/**
 * Analytics overview cards.
 */
export async function fetchAnalyticsOverview() {
  const today = startOfToday();

  const weekStart = new Date(
    today.getTime() - 7 * 86400000
  );

  const monthStart = new Date(
    today.getTime() - 30 * 86400000
  );

  const [
    allTime,
    todayCounts,
    week,
    month,
  ] = await Promise.all([
    fetchUniqueVisitorCounts(null, null),
    fetchUniqueVisitorCounts(today, null),
    fetchUniqueVisitorCounts(weekStart, null),
    fetchUniqueVisitorCounts(monthStart, null),
  ]);

  return {
    totalVisitors: allTime.total,
    todayVisitors: todayCounts.total,
    weekVisitors: week.total,
    monthVisitors: month.total,
    newVisitors: allTime.newVisitors,
    returningVisitors: allTime.returningVisitors,
  };
}

/**
 * Fetches analytics rows for the selected date range. `customRange` is
 * only used when filterKey === 'custom' — see resolveDateRange().
 */
export async function fetchAnalyticsRows(filterKey, customRange) {
  const { since, until } = resolveDateRange(filterKey, customRange);

  let query = supabase
    .from('visitor_analytics')
    .select(
      [
        'id',
        'visited_at',
        'page_path',
        'referrer',
        'country',
        'city',
        'region',
        'device_type',
        'browser',
        'operating_system',
        'is_new_visitor',
      ].join(', ')
    )
    .order('visited_at', {
      ascending: false,
    })
    .limit(MAX_ROWS_FOR_BREAKDOWN);

  query = applyRange(query, since, until);

  const { data, error } = await query;

  if (error) throw error;

  return data ?? [];
}

/**
 * All-time visitor_analytics rows for a single visitor (used by the
 * visitor detail page and the admin enquiry panel to show device/
 * browser/location/source context alongside engagement time). Bounded
 * to one visitor_id, newest-first, so callers can read [0] for "latest"
 * and [length-1] for "earliest" (first-touch) without re-sorting.
 */
export async function fetchAnalyticsRowsForVisitor(visitorId) {
  if (!visitorId) return [];

  const { data, error } = await supabase
    .from('visitor_analytics')
    .select(
      [
        'id',
        'visited_at',
        'session_id',
        'page_path',
        'referrer',
        'country',
        'city',
        'region',
        'device_type',
        'browser',
        'operating_system',
        'is_new_visitor',
      ].join(', ')
    )
    .eq('visitor_id', visitorId)
    .order('visited_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Every distinct visitor_id ever seen in visitor_analytics, with their
 * first/last-seen timestamps, via the visitor_directory() RPC (see
 * supabase/migrations/visitor_engagement.sql). Ordered oldest-first so
 * `buildClientLabels()` in lib/engagementAnalytics.js can assign stable
 * "Client 1 / Client 2 / ..." labels that never change as new visitors
 * arrive.
 */
export async function fetchVisitorDirectory() {
  const { data, error } = await supabase.rpc('visitor_directory');
  if (error) throw error;
  return data ?? [];
}