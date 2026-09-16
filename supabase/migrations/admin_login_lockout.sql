-- admin_login_lockout
-- New, additive table + RPCs for progressive admin login lockout.
-- Nothing existing (admin_user, auth.*, RLS on other tables) is touched.
--
-- Design:
--   * State lives server-side in `admin_login_lockout`, keyed by a
--     per-browser device_id (a random UUID the client generates once and
--     persists in localStorage). The row is the source of truth for the
--     failed-attempt count and lock-until timestamp — the client only
--     ever reads it back through check_admin_login_lock(), it never
--     writes counters itself.
--   * The table has RLS enabled with NO policies, so anon/authenticated
--     roles cannot select/insert/update it directly via PostgREST. The
--     only access path is the three SECURITY DEFINER functions below,
--     which is what makes "block this device" actually enforceable
--     server-side rather than being a React-state / localStorage trick.
--   * Known limitation (documented, not hidden): lockout is scoped to
--     device_id, which the client controls the *value* of (though not
--     the counters). A visitor who clears localStorage gets a fresh
--     device_id and a fresh allowance. This matches the spec's literal
--     "block login on that device" behavior. It is not a substitute for
--     Supabase Auth's own rate limiting / CAPTCHA if attacker-controlled
--     device IDs turn out to be a real concern for this deployment.

create table if not exists public.admin_login_lockout (
  device_id uuid primary key,
  failed_count integer not null default 0,
  locked_until timestamptz,
  last_attempt_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_login_lockout enable row level security;
-- Intentionally no policies: table is reachable only via the
-- SECURITY DEFINER functions below, never directly through PostgREST.

create index if not exists admin_login_lockout_locked_until_idx
  on public.admin_login_lockout (locked_until)
  where locked_until is not null;

-- Returns whether p_device_id is currently locked, and if so, the
-- server-computed number of seconds remaining (never trust a
-- client-computed countdown for the authoritative value — the frontend
-- timer is UX only, this is what actually gates the login attempt).
create or replace function public.check_admin_login_lock(p_device_id uuid)
returns table (is_locked boolean, seconds_remaining integer, failed_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.admin_login_lockout;
begin
  select * into v_row from public.admin_login_lockout where device_id = p_device_id;

  if v_row.device_id is null then
    return query select false, 0, 0;
    return;
  end if;

  if v_row.locked_until is not null and v_row.locked_until > now() then
    return query select
      true,
      greatest(0, ceil(extract(epoch from (v_row.locked_until - now())))::integer),
      v_row.failed_count;
  else
    return query select false, 0, v_row.failed_count;
  end if;
end;
$$;

-- Records a failed attempt. Locks for 60 seconds once failed_count
-- reaches 3 (counting resets to 0 on lock, so the pattern repeats
-- indefinitely: 3 fails -> 60s lock -> counter resets -> 3 more fails
-- -> 60s lock -> ...). If called while already locked, extends nothing
-- and just reports the existing lock (defense in depth in case the
-- frontend calls this despite the pre-check).
create or replace function public.register_admin_login_failure(p_device_id uuid)
returns table (is_locked boolean, seconds_remaining integer, failed_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.admin_login_lockout;
  v_new_count integer;
  v_new_lock timestamptz;
begin
  insert into public.admin_login_lockout (device_id, failed_count, last_attempt_at, updated_at)
  values (p_device_id, 0, now(), now())
  on conflict (device_id) do nothing;

  select * into v_row from public.admin_login_lockout where device_id = p_device_id;

  -- Already locked: don't add to the count, just return current state.
  if v_row.locked_until is not null and v_row.locked_until > now() then
    return query select true,
      greatest(0, ceil(extract(epoch from (v_row.locked_until - now())))::integer),
      v_row.failed_count;
    return;
  end if;

  v_new_count := v_row.failed_count + 1;

  if v_new_count >= 3 then
    v_new_lock := now() + interval '60 seconds';
    v_new_count := 0; -- reset for the next cycle once this lock expires
  else
    v_new_lock := null;
  end if;

  update public.admin_login_lockout
  set failed_count = v_new_count,
      locked_until = v_new_lock,
      last_attempt_at = now(),
      updated_at = now()
  where device_id = p_device_id;

  if v_new_lock is not null then
    return query select true, 60, 0;
  else
    return query select false, 0, v_new_count;
  end if;
end;
$$;

-- Resets the counter/lock on a successful login.
create or replace function public.register_admin_login_success(p_device_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_login_lockout (device_id, failed_count, locked_until, last_attempt_at, updated_at)
  values (p_device_id, 0, null, now(), now())
  on conflict (device_id)
  do update set failed_count = 0, locked_until = null, last_attempt_at = now(), updated_at = now();
end;
$$;

grant execute on function public.check_admin_login_lock(uuid) to anon, authenticated;
grant execute on function public.register_admin_login_failure(uuid) to anon, authenticated;
grant execute on function public.register_admin_login_success(uuid) to anon, authenticated;