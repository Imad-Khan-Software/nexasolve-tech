import { supabase } from '../services/supabase.js';

/**
 * Thin wrapper around the admin_login_lockout RPCs (see the
 * admin_login_lockout migration). The DB is the source of truth for
 * whether a device is locked and for how long — these calls never
 * compute lock state client-side, only display it.
 *
 * Shape returned by all three: { is_locked, seconds_remaining, failed_count }
 * (register_admin_login_success returns nothing meaningful; callers
 * don't need its return value).
 */

export async function checkLoginLock(deviceId) {
  const { data, error } = await supabase.rpc('check_admin_login_lock', {
    p_device_id: deviceId,
  });
  if (error) throw error;
  return data?.[0] ?? { is_locked: false, seconds_remaining: 0, failed_count: 0 };
}

export async function registerLoginFailure(deviceId) {
  const { data, error } = await supabase.rpc('register_admin_login_failure', {
    p_device_id: deviceId,
  });
  if (error) throw error;
  return data?.[0] ?? { is_locked: false, seconds_remaining: 0, failed_count: 0 };
}

export async function registerLoginSuccess(deviceId) {
  const { error } = await supabase.rpc('register_admin_login_success', {
    p_device_id: deviceId,
  });
  if (error) throw error;
}