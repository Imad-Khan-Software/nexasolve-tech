/**
 * Per-device tracking-token storage. Ported directly from the vanilla
 * app's localStorage logic (same key name, same shape) so a token saved
 * by the old site would still be recognized here, and vice versa.
 */
const TRACKING_TOKENS_KEY = 'myOrderTrackingTokens';

export function getStoredTokens() {
  try {
    const raw = JSON.parse(localStorage.getItem(TRACKING_TOKENS_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function saveTrackingToken(token, projectTitle) {
  if (!token) return;
  const tokens = getStoredTokens();
  if (!tokens.some((t) => t.token === token)) {
    tokens.unshift({ token, project_title: projectTitle || 'Enquiry', saved_at: Date.now() });
    try {
      localStorage.setItem(TRACKING_TOKENS_KEY, JSON.stringify(tokens));
    } catch {
      // localStorage may be unavailable (private browsing) — fail silently,
      // same as the vanilla app.
    }
  }
}
