const STORAGE_KEY = 'nx_admin_device_id';

/**
 * Returns a persistent random UUID for this browser, creating one on
 * first use. This is ONLY ever used as an opaque lookup key for the
 * server-side login-lockout table (admin_login_lockout) — it carries no
 * identity or auth weight by itself, and the failed-attempt counter and
 * lock-until timestamp it points to live in Postgres, not here. See the
 * admin_login_lockout migration for the documented limitation this
 * implies (a cleared localStorage yields a fresh device_id).
 */
export function getDeviceId() {
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back to an
    // in-memory id for this page load only. Lockout still works, it
    // just won't persist across reloads for this visitor.
    return crypto.randomUUID();
  }
}