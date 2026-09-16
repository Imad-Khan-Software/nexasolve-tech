/**
 * Traffic-source detection for the visitor tracking system.
 *
 * Priority order, per visit-detection pass:
 *   1. `?utm_source=...` query param (normalized, case-insensitive)
 *   2. `document.referrer`, matched against a small set of known hosts
 *   3. 'Direct' — used whenever neither of the above yields a usable value
 *
 * The *result* of the first-ever detection for a browser is cached in
 * localStorage (see getOrCaptureTrafficSource) so that a visitor's
 * original acquisition source is preserved across later direct visits,
 * without needing any extra server round-trip to know it.
 */

const TRAFFIC_SOURCE_KEY = 'nexasolve_traffic_source';

// Recognized source keys -> canonical display label. Keys are matched
// case-insensitively against both the utm_source value and the
// referrer's hostname (as a substring, so e.g. "m.facebook.com" and
// "l.facebook.com" both match "facebook").
const KNOWN_SOURCES = {
  facebook: 'Facebook',
  fb: 'Facebook',
  instagram: 'Instagram',
  ig: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  yt: 'YouTube',
  google: 'Google',
};

function normalizeKey(raw) {
  return String(raw).trim().toLowerCase();
}

function titleCase(raw) {
  const s = String(raw).trim();
  if (!s) return 'Other';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Reads utm_source from the current URL, if present, and normalizes it
 * (facebook / Facebook / FACEBOOK all resolve to "Facebook"). Any
 * utm_source value not in the known list is still honored — just
 * title-cased — rather than silently dropped, since the site owner may
 * add new campaign sources later without a code change.
 */
function sourceFromUtm() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = params.get('utm_source');
    if (!utm) return null;
    const key = normalizeKey(utm);
    return KNOWN_SOURCES[key] || titleCase(key);
  } catch {
    return null;
  }
}

/**
 * Best-effort referrer inspection. Only ever returns a value for a
 * small set of known hosts — an unrecognized external referrer is left
 * as null (falls through to 'Direct') rather than guessed at, per the
 * "don't pretend it can always be detected" requirement.
 */
function sourceFromReferrer() {
  try {
    const ref = document.referrer;
    if (!ref) return null;
    const refHost = new URL(ref).hostname.replace(/^www\./, '').toLowerCase();
    if (!refHost || refHost === window.location.hostname) return null;
    const match = Object.keys(KNOWN_SOURCES).find((key) => refHost.includes(key));
    return match ? KNOWN_SOURCES[match] : null;
  } catch {
    return null;
  }
}

/**
 * Detects the traffic source for *this* page load only (no caching).
 * Exposed separately from getOrCaptureTrafficSource for testability.
 */
export function detectTrafficSource() {
  return sourceFromUtm() || sourceFromReferrer() || 'Direct';
}

/**
 * Returns this visitor's original traffic source, detecting and caching
 * it in localStorage the first time it's called for this browser, and
 * simply returning the cached value on every later call/visit — this is
 * what keeps a visitor's first-touch source ("Facebook") from being
 * overwritten by "Direct" on a later, un-tagged visit.
 *
 * Falls back to a fresh (uncached) detection if localStorage is
 * unavailable, same fail-open pattern as the existing visitor id logic
 * in visitorService.js — tracking must never throw.
 */
export function getOrCaptureTrafficSource() {
  try {
    const existing = localStorage.getItem(TRAFFIC_SOURCE_KEY);
    if (existing) return existing;
    const detected = detectTrafficSource();
    localStorage.setItem(TRAFFIC_SOURCE_KEY, detected);
    return detected;
  } catch {
    return detectTrafficSource();
  }
}
