-- Privacy-friendly page-view analytics. Additive — does not touch
-- visitor_tracking (that table tracks "View Demo"/"Enquire" clicks per
-- service; this one tracks page views/sessions, a different grain and a
-- different question, so it's a new table rather than a duplicate).
-- Run this once in the Supabase SQL Editor.

-- 1. Table. One row per page view. `visitor_id` and `session_id` are
-- both anonymous, client-generated UUIDs (see src/lib/pageAnalytics.js)
-- — never an IP address, name, or anything identifying. No raw IP is
-- ever stored: geolocation is resolved client-side against a free IP
-- geolocation API and only the resulting country/region/city strings
-- are sent here.
create table if not exists public.visitor_analytics (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  visitor_id uuid not null,
  visited_at timestamptz not null default now(),
  page_path text not null,
  referrer text,
  country text,
  city text,
  region text,
  device_type text,
  browser text,
  operating_system text,
  screen_width integer,
  screen_height integer,
  is_new_visitor boolean not null default false
);

-- 2. Indexes for the admin dashboard's common query shapes: date-range
-- filters, "top pages", "top countries", and per-session/visitor lookups.
create index if not exists visitor_analytics_visited_at_idx on public.visitor_analytics (visited_at);
create index if not exists visitor_analytics_page_path_idx on public.visitor_analytics (page_path);
create index if not exists visitor_analytics_country_idx on public.visitor_analytics (country);
create index if not exists visitor_analytics_session_id_idx on public.visitor_analytics (session_id);
create index if not exists visitor_analytics_visitor_id_idx on public.visitor_analytics (visitor_id);

alter table public.visitor_analytics enable row level security;

-- 3. Same "narrow RPC, not a broad table policy" pattern as
-- visitor_tracking.sql: no INSERT/UPDATE/DELETE policy is granted to
-- anyone. Visitors can only ever call record_page_view() below, which
-- can do nothing except append one row. Only an authenticated admin
-- (present in admin_user) can read the table at all — visitors, and any
-- other authenticated-but-non-admin user, get zero rows back.
create policy "Admins can view visitor analytics"
  on public.visitor_analytics
  for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_user au
      where au.email = auth.jwt() ->> 'email'
    )
  );

-- 4. Records one page view. `is_new_visitor` is computed server-side
-- (never trusted from the client) and is true for every page view
-- within a visitor's very first session, then false from their second
-- session onward — i.e. it's evaluated per SESSION, not per page view,
-- so a first-time visitor who looks at three pages in one visit isn't
-- miscounted as "returning" partway through that same first visit.
create or replace function public.record_page_view(
  p_session_id uuid,
  p_visitor_id uuid,
  p_page_path text,
  p_referrer text default null,
  p_country text default null,
  p_city text default null,
  p_region text default null,
  p_device_type text default null,
  p_browser text default null,
  p_operating_system text default null,
  p_screen_width integer default null,
  p_screen_height integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_new boolean;
begin
  select not exists (
    select 1 from public.visitor_analytics
    where visitor_id = p_visitor_id and session_id <> p_session_id
  ) into v_is_new;

  insert into public.visitor_analytics (
    session_id, visitor_id, page_path, referrer, country, city, region,
    device_type, browser, operating_system, screen_width, screen_height,
    is_new_visitor
  )
  values (
    p_session_id, p_visitor_id, p_page_path, p_referrer, p_country, p_city, p_region,
    p_device_type, p_browser, p_operating_system, p_screen_width, p_screen_height,
    v_is_new
  );
end;
$$;

grant execute on function public.record_page_view(
  uuid, uuid, text, text, text, text, text, text, text, text, integer, integer
) to anon, authenticated;

-- 5. Overview aggregation for the admin dashboard's summary cards.
-- Returns *unique visitor* counts (not raw page-view row counts) for a
-- given date range — a real `count(distinct ...)` query, which the
-- Supabase JS client can't express directly, hence the RPC.
--
-- security invoker (the default for SQL functions) is deliberate: this
-- function only ever sees the rows the *calling* role is allowed to see
-- under the "Admins can view visitor analytics" policy above — a
-- non-admin caller gets zeros back, not an error, with no separate
-- admin check to keep in sync.
create or replace function public.analytics_overview(
  p_since timestamptz default null,
  p_until timestamptz default null
)
returns table (
  total_visitors bigint,
  new_visitors bigint,
  returning_visitors bigint
)
language sql
stable
set search_path = public
as $$
  select
    count(distinct visitor_id) as total_visitors,
    count(distinct visitor_id) filter (where is_new_visitor) as new_visitors,
    count(distinct visitor_id) filter (where not is_new_visitor) as returning_visitors
  from public.visitor_analytics
  where (p_since is null or visited_at >= p_since)
    and (p_until is null or visited_at < p_until);
$$;

grant execute on function public.analytics_overview(timestamptz, timestamptz) to authenticated;
