import { supabase } from './supabase.js';
import { resolveDateRange } from './analyticsService.js';

const MAX_ROWS_FOR_BREAKDOWN = 10000;

const ENGAGEMENT_ROW_COLUMNS = [
  'id',
  'visitor_id',
  'session_id',
  'page_path',
  'entered_at',
  'last_activity_at',
  'left_at',
  'duration_seconds',
].join(', ');

function applyRange(query, since, until) {
  let q = query;
  if (since) q = q.gte('entered_at', since.toISOString());
  if (until) q = q.lt('entered_at', until.toISOString());
  return q;
}

/**
 * Fetches raw engagement (active-time) rows for the selected date
 * range, admin-only (see the "Admins can view visitor engagement" RLS
 * policy in supabase/migrations/visitor_engagement.sql). Aggregation
 * (totals, top visitors, top pages, daily breakdown) happens client-side
 * in lib/engagementAnalytics.js — the same "fetch filtered raw rows,
 * aggregate in the browser" convention already used by
 * analyticsService.fetchAnalyticsRows / AdminAnalytics.jsx's topCounts().
 */
export async function fetchEngagementRows(filterKey, customRange) {
  const { since, until } = resolveDateRange(filterKey, customRange);

  let query = supabase
    .from('visitor_engagement')
    .select(ENGAGEMENT_ROW_COLUMNS)
    .order('entered_at', { ascending: false })
    .limit(MAX_ROWS_FOR_BREAKDOWN);

  query = applyRange(query, since, until);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * All-time engagement rows for a single visitor (visitor detail page —
 * PART 8). Bounded to one visitor.
 */
export async function fetchEngagementRowsForVisitor(visitorId) {
  if (!visitorId) return [];
  const { data, error } = await supabase
    .from('visitor_engagement')
    .select(ENGAGEMENT_ROW_COLUMNS)
    .eq('visitor_id', visitorId)
    .order('entered_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
