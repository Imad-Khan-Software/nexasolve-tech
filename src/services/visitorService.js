import { supabase } from './supabase.js';
import { getOrCaptureTrafficSource } from '../lib/trafficSource.js';

const VISITOR_ID_KEY = 'nexasolve_visitor_id';

function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (older browsers).
  // Not cryptographically strong, but this is just an anonymous counter
  // id, not a security token.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * A per-browser anonymous identifier, generated once and reused from
 * localStorage — never an IP address, never anything from a third-party
 * service. If localStorage is unavailable (private browsing), a fresh id
 * is generated per call, which just means that visitor's visits won't be
 * counted as "the same visitor" across reloads — never breaks tracking,
 * just makes it less persistent.
 */
export function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = generateUuid();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return generateUuid();
  }
}

/**
 * Records one visit to a service via the record_visit RPC (atomic
 * upsert+increment server-side — see supabase/migrations/visitor_tracking.sql).
 * Deliberately fire-and-forget from the caller's perspective: tracking
 * must never block or break the public site, so every failure is caught
 * and logged, never re-thrown.
 *
 * Also passes this visitor's traffic source (UTM param / referrer /
 * "Direct" — see lib/trafficSource.js). The value is cached client-side
 * after the first detection, and the RPC only ever *sets* it if the row
 * doesn't already have one, so a visitor's original acquisition source
 * is preserved even once the UTM param or referrer is no longer present
 * on later visits.
 */
export async function recordVisit(serviceName) {
  if (!serviceName) return;
  try {
    const { error } = await supabase.rpc('record_visit', {
      p_visitor_id: getVisitorId(),
      p_service_name: serviceName,
      p_source: getOrCaptureTrafficSource(),
    });
    if (error) throw error;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('recordVisit failed (tracking only, site is unaffected):', err);
  }
}

/**
 * Attaches a name to this visitor's tracking rows once they've provided
 * one via an existing form (the enquiry modal). Same fire-and-forget
 * safety as recordVisit.
 */
export async function recordVisitorName(name) {
  if (!name) return;
  try {
    const { error } = await supabase.rpc('record_visitor_name', {
      p_visitor_id: getVisitorId(),
      p_name: name,
    });
    if (error) throw error;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('recordVisitorName failed (tracking only, site is unaffected):', err);
  }
}

/**
 * Admin-only read of the full tracking table. Only reachable because the
 * caller is an authenticated admin — see the RLS policy in the migration
 * file, which is the actual enforcement, not this function.
 */
export async function fetchVisitorTracking() {
  const { data, error } = await supabase
    .from('visitor_tracking')
    .select('*')
    .order('last_visited_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
