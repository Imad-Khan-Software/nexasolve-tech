-- orders_visitor_link
-- Connects an enquiry (the existing `orders` table) back to the visitor's
-- existing anonymous analytics identity (visitor_id/session_id from
-- src/lib/pageAnalytics.js — the SAME ids already written to
-- visitor_analytics and visitor_engagement), so the admin can see a
-- customer's browsing engagement alongside their enquiry without
-- creating a second visitor identity or a new tracking table.
--
-- Two nullable columns only. No RLS change: `orders` already accepts
-- anonymous inserts of client-supplied fields (client_name,
-- client_email, project_title, message — see src/services/orderService.js
-- createOrder, which has worked against the live table's existing
-- policies since before this migration). Postgres RLS authorizes at the
-- row level, not per-column; adding nullable columns to an
-- already-insertable table requires no policy change. This migration
-- does not touch any existing policy, function, or column.
--
-- Both columns are optional/best-effort: if a visitor has cookies/local
-- storage disabled, or submits without ever calling
-- getOrCreateAnalyticsVisitorId() first (shouldn't happen in practice,
-- since page-view tracking runs on every public page — see
-- src/hooks/usePageViewTracking.js — before an enquiry could be
-- submitted), these simply stay null and the admin UI falls back to
-- "no engagement data available" rather than erroring.
alter table public.orders
  add column if not exists analytics_visitor_id uuid,
  add column if not exists analytics_session_id uuid;

create index if not exists orders_analytics_visitor_id_idx on public.orders (analytics_visitor_id);
