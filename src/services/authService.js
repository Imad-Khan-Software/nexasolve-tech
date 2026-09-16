import { supabase } from './supabase.js';

/**
 * Admin authentication + authorization, ported directly from the vanilla
 * app's checkSession()/login handler in script.js. Two distinct steps,
 * exactly as the vanilla app does it:
 *   1. Supabase Auth confirms the person IS who they say they are
 *      (signInWithPassword / getSession).
 *   2. A lookup against `admin_user` confirms that authenticated email is
 *      actually allowed to use the admin panel — being a valid Supabase
 *      Auth user is not sufficient by itself. This mirrors the vanilla
 *      app's `.from('admin_user').select('email').eq('email', ...)
 *      .maybeSingle()` check exactly.
 *
 * No custom passwords, no manual JWT handling, no separate auth system —
 * this file only wraps calls already made elsewhere in the app.
 */

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Subscribes to Supabase Auth state changes. Returns an unsubscribe
 * function. The vanilla app only checks the session once on page load;
 * this additionally reacts to sign-in/sign-out/token-refresh events,
 * which is safe, additive behavior appropriate for a longer-lived SPA
 * session (not a change to the underlying auth architecture).
 */
export function onAuthStateChange(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => subscription.unsubscribe();
}

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Same query as the vanilla app: is this email present in admin_user?
 */
export async function checkIsAdmin(email) {
  if (!email) return false;
  const { data, error } = await supabase
    .from('admin_user')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
