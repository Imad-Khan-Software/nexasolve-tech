import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getSession,
  onAuthStateChange,
  signInWithPassword,
  signOut as authSignOut,
  checkIsAdmin,
} from '../services/authService.js';

const AdminAuthContext = createContext(null);

/**
 * status:
 *   'loading'      — session not yet checked (or admin_user lookup in flight)
 *   'authorized'    — authenticated AND present in admin_user
 *   'unauthorized'  — no session, or authenticated but not an admin
 *
 * Collapsing "no session" and "authenticated but not admin" into one
 * 'unauthorized' state (rather than exposing them as different statuses)
 * is deliberate: ProtectedAdminRoute treats both identically (redirect to
 * /admin/login), and it avoids leaking which case applies to any code
 * that isn't the login form itself.
 */
export function AdminAuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [session, setSession] = useState(null);

  const evaluateSession = useCallback(async (nextSession) => {
    setSession(nextSession);
    if (!nextSession) {
      setStatus('unauthorized');
      return;
    }
    try {
      const isAdmin = await checkIsAdmin(nextSession.user.email);
      setStatus(isAdmin ? 'authorized' : 'unauthorized');
    } catch {
      // Fail closed: if we can't confirm admin_user, don't grant access.
      setStatus('unauthorized');
    }
  }, []);

  useEffect(() => {
    let active = true;

    getSession().then((s) => {
      if (active) evaluateSession(s);
    });

    const unsubscribe = onAuthStateChange((s) => {
      if (active) evaluateSession(s);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [evaluateSession]);

  /**
   * Throws on failure with a `reason` so the login page can show the
   * right message without the caller having to inspect Supabase's raw
   * error shape:
   *   reason: 'INVALID_CREDENTIALS' | 'NOT_ADMIN'
   */
  const signIn = useCallback(async (email, password) => {
    let authData;
    try {
      authData = await signInWithPassword(email, password);
    } catch (err) {
      const e = new Error('Invalid email or password.');
      e.reason = 'INVALID_CREDENTIALS';
      e.cause = err;
      throw e;
    }

    const isAdmin = await checkIsAdmin(authData.user.email);
    if (!isAdmin) {
      setStatus('unauthorized');
      const e = new Error("This account doesn't have admin access.");
      e.reason = 'NOT_ADMIN';
      throw e;
    }

    setStatus('authorized');
    setSession(authData.session);
    return authData.user;
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setStatus('unauthorized');
    setSession(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ status, session, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return ctx;
}
