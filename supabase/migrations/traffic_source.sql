-- Traffic-source tracking. Additive on top of visitor_tracking.sql —
-- run this once in the Supabase SQL Editor *after* that migration has
-- already been applied. Does not touch any other table.

-- 1. One nullable column on the existing table. This is deliberately
-- the visitor's *first-touch* source, not "most recent source" — see
-- the record_visit change below for how that's enforced.
alter table public.visitor_tracking
  add column if not exists source text;

-- 2. Replace record_visit with a version that also accepts a source.
-- Adding a trailing default parameter keeps this the *same* function
-- (same name + existing arg types/order), so the existing
-- `grant execute ... to anon, authenticated` from visitor_tracking.sql
-- still applies — re-granted below anyway, defensively.
--
-- coalesce(visitor_tracking.source, excluded.source) is what preserves
-- the original source: on first insert `source` is whatever the caller
-- passed; on every later conflict (same visitor_id + service_name) the
-- existing stored value wins over whatever is passed this time, so a
-- visitor first tagged "Facebook" stays "Facebook" even after a later
-- direct/untagged visit.
create or replace function public.record_visit(
  p_visitor_id uuid,
  p_service_name text,
  p_source text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.visitor_tracking (visitor_id, service_name, visit_count, last_visited_at, source)
  values (p_visitor_id, p_service_name, 1, now(), p_source)
  on conflict (visitor_id, service_name)
  do update set
    visit_count = visitor_tracking.visit_count + 1,
    last_visited_at = now(),
    source = coalesce(visitor_tracking.source, excluded.source);
end;
$$;

grant execute on function public.record_visit(uuid, text, text) to anon, authenticated;
