-- Visitor/service tracking feature.
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- before the frontend tracking code will work. I cannot run this myself —
-- I have no live access to your Supabase project.

-- 1. Table. One row per (visitor, service) pair — this is what lets a
-- single visitor be associated with multiple services without any of
-- them overwriting each other (Imad: Website Development 5 visits,
-- Pharmacy POS 2 visits → two rows, both visitor_id = the same UUID).
create table if not exists public.visitor_tracking (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  visitor_name text,
  service_name text not null,
  visit_count integer not null default 0,
  last_visited_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (visitor_id, service_name)
);

alter table public.visitor_tracking enable row level security;

-- 2. No direct table-level policies are granted to anon or authenticated
-- for INSERT/UPDATE. All public writes go through the two SECURITY
-- DEFINER functions below instead — the same "narrow RPC, not a broad
-- table policy" pattern this project's existing get_order_thread /
-- client_send_message functions already use. This means a visitor can
-- never read or arbitrarily modify the table directly, only call these
-- two specific, narrow operations.

-- Only an authenticated admin (present in admin_user, same check the
-- app already uses everywhere else) can read the table directly.
create policy "Admins can view visitor tracking"
  on public.visitor_tracking
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_user au
      where au.email = auth.jwt() ->> 'email'
    )
  );

-- 3. Records one visit: creates the (visitor, service) row if it
-- doesn't exist yet, or atomically increments visit_count if it does.
-- SECURITY DEFINER + a narrow GRANT EXECUTE is what makes this safe for
-- anonymous visitors to call without needing any table-level policy.
create or replace function public.record_visit(p_visitor_id uuid, p_service_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.visitor_tracking (visitor_id, service_name, visit_count, last_visited_at)
  values (p_visitor_id, p_service_name, 1, now())
  on conflict (visitor_id, service_name)
  do update set
    visit_count = visitor_tracking.visit_count + 1,
    last_visited_at = now();
end;
$$;

grant execute on function public.record_visit(uuid, text) to anon, authenticated;

-- 4. Attaches a name to every tracking row for a visitor once they
-- submit an enquiry/order and provide one. Also narrow and anon-callable
-- for the same reason as above — it can only ever set visitor_name for
-- rows matching the caller-supplied visitor_id, nothing else.
create or replace function public.record_visitor_name(p_visitor_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.visitor_tracking
  set visitor_name = p_name
  where visitor_id = p_visitor_id;
end;
$$;

grant execute on function public.record_visitor_name(uuid, text) to anon, authenticated;
