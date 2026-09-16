/**
 * Active time-on-page engagement engine.
 *
 * Reuses the existing anonymous visitor_id/session_id from
 * lib/pageAnalytics.js — no new visitor identity is created here.
 *
 * Responsibilities:
 * - Track "active" time on the current page (mouse/keyboard/click/
 *   scroll/touch counts as activity).
 * - Pause counting while the tab is hidden (Page Visibility API).
 * - Pause counting after a configurable period of inactivity, even if
 *   the tab stays visible.
 * - Send periodic (not per-second) heartbeats, plus a best-effort final
 *   update on page exit (route change, refresh, tab close).
 *
 * This module has no React dependency — see hooks/useEngagementTracking.js
 * for the thin React wrapper that starts/stops it on route change.
 */

import {
  getOrCreateSessionId,
  getOrCreateAnalyticsVisitorId,
} from './pageAnalytics.js';
import { supabase } from '../services/supabase.js';

/* =========================================================
   CONFIG — change timings here, in one place.
========================================================= */

// Tab visible + user active for this long with no interaction ⇒ pause.
export const INACTIVITY_TIMEOUT_MS = 60_000;

// How often to persist an in-progress page visit's duration while the
// visitor is actively engaged. Deliberately NOT per-second — see
// PART 23 (performance) in the project brief.
export const HEARTBEAT_INTERVAL_MS = 20_000;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

/* =========================================================
   SUPABASE REST CONFIG (for the unload-safe "beacon" path)
========================================================= */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Sends the engagement upsert. Normal supabase-js RPC call is used for
 * in-page heartbeats. On unload/hide we need delivery to survive the
 * page tearing down — `navigator.sendBeacon()` can't be used here
 * because it cannot attach the `apikey`/`Authorization` headers
 * Supabase's PostgREST endpoint requires (it only supports a handful of
 * simple content types and no custom headers), so the well-known
 * substitute is `fetch(..., { keepalive: true })`, which Chrome/Firefox/
 * Safari all keep alive past page unload for small payloads (this one
 * is a single, tiny JSON body). This is a documented, deliberate
 * deviation from a literal `sendBeacon()` call — noted here rather than
 * silently swapped in.
 */
function sendEngagementBeacon(payload) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  try {
    const body = JSON.stringify({
      p_client_engagement_id: payload.clientEngagementId,
      p_visitor_id: payload.visitorId,
      p_session_id: payload.sessionId,
      p_page_path: payload.pagePath,
      p_entered_at: payload.enteredAt,
      p_last_activity_at: payload.lastActivityAt,
      p_duration_seconds: payload.durationSeconds,
      p_left_at: payload.leftAt || null,
    });

    fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_page_engagement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body,
      keepalive: true,
    }).catch(() => {
      // Best-effort only — engagement tracking must never surface an
      // error to the visitor.
    });
  } catch {
    // Swallow — see above.
  }
}

async function sendEngagementUpdate(payload) {
  try {
    const { error } = await supabase.rpc('upsert_page_engagement', {
      p_client_engagement_id: payload.clientEngagementId,
      p_visitor_id: payload.visitorId,
      p_session_id: payload.sessionId,
      p_page_path: payload.pagePath,
      p_entered_at: payload.enteredAt,
      p_last_activity_at: payload.lastActivityAt,
      p_duration_seconds: payload.durationSeconds,
      p_left_at: payload.leftAt || null,
    });
    if (error) throw error;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Engagement update failed (tracking only, site is unaffected):', err);
  }
}

/**
 * Tracks active time for a single page visit ("session" in the
 * PART 2-5 sense — one instance of one page being open). Call `stop()`
 * when navigating away; a new PageEngagementTracker is created per page.
 */
class PageEngagementTracker {
  constructor(pagePath) {
    this.clientEngagementId = generateUuid();
    this.visitorId = getOrCreateAnalyticsVisitorId();
    this.sessionId = getOrCreateSessionId();
    this.pagePath = pagePath;
    this.enteredAt = new Date();
    this.lastActivityAt = this.enteredAt;

    this.activeMs = 0; // accumulated active time, excluding hidden/inactive periods
    this.running = false; // whether the active-time clock is currently counting
    this.stopped = false;

    this._lastTickAt = null;
    this._heartbeatTimer = null;
    this._inactivityTimer = null;

    this._onActivity = this._onActivity.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    this._onPageHide = this._onPageHide.bind(this);

    this._start();
  }

  _start() {
    const isVisible = typeof document === 'undefined' || document.visibilityState !== 'hidden';
    if (isVisible) this._resume();

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, this._onActivity, { passive: true })
    );
    document.addEventListener('visibilitychange', this._onVisibilityChange);
    window.addEventListener('pagehide', this._onPageHide);
    window.addEventListener('beforeunload', this._onPageHide);

    this._heartbeatTimer = setInterval(() => this._heartbeat(), HEARTBEAT_INTERVAL_MS);
    this._resetInactivityTimer();
  }

  _resume() {
    if (this.running || this.stopped) return;
    this.running = true;
    this._lastTickAt = Date.now();
  }

  _pause() {
    if (!this.running) return;
    this._accumulate();
    this.running = false;
  }

  _accumulate() {
    if (this.running && this._lastTickAt) {
      this.activeMs += Math.max(0, Date.now() - this._lastTickAt);
      this._lastTickAt = Date.now();
    }
  }

  _resetInactivityTimer() {
    if (this._inactivityTimer) clearTimeout(this._inactivityTimer);
    this._inactivityTimer = setTimeout(() => {
      this._pause();
    }, INACTIVITY_TIMEOUT_MS);
  }

  _onActivity() {
    if (this.stopped) return;
    this.lastActivityAt = new Date();
    if (document.visibilityState !== 'hidden') {
      this._resume();
    }
    this._resetInactivityTimer();
  }

  _onVisibilityChange() {
    if (this.stopped) return;
    if (document.visibilityState === 'hidden') {
      this._pause();
    } else {
      this._resume();
      this._resetInactivityTimer();
    }
  }

  _onPageHide() {
    this.stop();
  }

  _durationSeconds() {
    this._accumulate();
    return Math.round(this.activeMs / 1000);
  }

  _heartbeat() {
    if (this.stopped) return;
    sendEngagementUpdate({
      clientEngagementId: this.clientEngagementId,
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      pagePath: this.pagePath,
      enteredAt: this.enteredAt.toISOString(),
      lastActivityAt: this.lastActivityAt.toISOString(),
      durationSeconds: this._durationSeconds(),
    });
  }

  /** Final flush — call on route change or page exit. Idempotent. */
  stop() {
    if (this.stopped) return;
    this.stopped = true;
    this._accumulate();

    ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, this._onActivity));
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    window.removeEventListener('pagehide', this._onPageHide);
    window.removeEventListener('beforeunload', this._onPageHide);
    if (this._heartbeatTimer) clearInterval(this._heartbeatTimer);
    if (this._inactivityTimer) clearTimeout(this._inactivityTimer);

    const payload = {
      clientEngagementId: this.clientEngagementId,
      visitorId: this.visitorId,
      sessionId: this.sessionId,
      pagePath: this.pagePath,
      enteredAt: this.enteredAt.toISOString(),
      lastActivityAt: this.lastActivityAt.toISOString(),
      durationSeconds: this._durationSeconds(),
      leftAt: new Date().toISOString(),
    };

    // Use the unload-safe path always on stop() — it's cheap, and it's
    // the only path guaranteed to survive an actual tab close, which is
    // indistinguishable from a route change at the moment stop() is
    // called from a `pagehide` listener.
    sendEngagementBeacon(payload);
  }
}

let currentTracker = null;

/**
 * Starts tracking a new page visit, stopping (and flushing) whatever
 * page was being tracked before. Safe to call on every route change.
 */
export function trackPageEngagement(pagePath) {
  if (currentTracker) currentTracker.stop();
  currentTracker = new PageEngagementTracker(pagePath);
  return currentTracker;
}

/** Flushes and stops tracking without starting a new page. */
export function stopPageEngagement() {
  if (currentTracker) {
    currentTracker.stop();
    currentTracker = null;
  }
}
