-- feedback_and_team
-- Two new, additive tables for Phase 2 (Public Feedback System +
-- Dynamic Team Management). Nothing existing is touched — no other
-- table, policy, or function is modified.
--
-- Neither `feedback` nor `team_members` existed anywhere in the project
-- prior to this migration (verified: no matching table in any existing
-- migration file, and neither name appears in projectService.js,
-- profileService.js, or authService.js).
--
-- Both tables follow the exact RLS convention already established in
-- visitor_tracking.sql / visitor_analytics.sql: admin access is granted
-- via `exists (select 1 from public.admin_user au where au.email =
-- auth.jwt() ->> 'email')` — the same check AdminAuthContext already
-- performs in the application layer, now also enforced at the database
-- layer so it can't be bypassed by calling PostgREST directly.

-- =========================================================================
-- 1. feedback
-- =========================================================================
-- One row per visitor-submitted testimonial. New submissions always land
-- as 'pending' — enforced below by a WITH CHECK constraint, not just by
-- what the frontend happens to send, so a crafted request can't insert
-- directly as 'approved'.

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  name text not null,
  email text,
  rating smallint not null,
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_rating_range check (rating >= 1 and rating <= 5),
  constraint feedback_status_valid check (status in ('pending', 'approved', 'rejected')),
  constraint feedback_name_not_blank check (length(trim(name)) > 0),
  constraint feedback_message_not_blank check (length(trim(message)) > 0)
);

create index if not exists feedback_status_idx on public.feedback (status);
create index if not exists feedback_created_at_idx on public.feedback (created_at);

alter table public.feedback enable row level security;

-- Table-level grants are the prerequisite for any RLS policy below to
-- apply at all; the policies then narrow what each grant actually
-- allows per-row.
grant select on public.feedback to anon, authenticated;
-- Column-restricted insert: a visitor can only ever set these four
-- fields. id/status/created_at/updated_at are not grantable to anon,
-- so status can never be set to anything but its 'pending' default by a
-- public submission, even before the WITH CHECK below is evaluated.
grant insert (name, email, rating, message) on public.feedback to anon;
grant update, delete on public.feedback to authenticated;

-- Public + admin can both read approved feedback (this is what the
-- public testimonials section queries).
create policy "Public can view approved feedback"
  on public.feedback
  for select
  to anon, authenticated
  using (status = 'approved');

-- Admin can additionally read pending/rejected feedback (moderation
-- queue). Combined with the policy above via OR, so an admin sees
-- everything and a visitor sees only approved rows.
create policy "Admins can view all feedback"
  on public.feedback
  for select
  to authenticated
  using (
    exists (select 1 from public.admin_user au where au.email = auth.jwt() ->> 'email')
  );

-- Any visitor may submit feedback, but only ever as 'pending' — this is
-- the actual enforcement point that prevents a direct PostgREST call
-- from self-approving a submission.
create policy "Public can submit pending feedback"
  on public.feedback
  for insert
  to anon
  with check (status = 'pending');

-- Only admins can change status, edit, or delete feedback.
create policy "Admins can update feedback"
  on public.feedback
  for update
  to authenticated
  using (
    exists (select 1 from public.admin_user au where au.email = auth.jwt() ->> 'email')
  )
  with check (
    exists (select 1 from public.admin_user au where au.email = auth.jwt() ->> 'email')
  );

create policy "Admins can delete feedback"
  on public.feedback
  for delete
  to authenticated
  using (
    exists (select 1 from public.admin_user au where au.email = auth.jwt() ->> 'email')
  );

-- =========================================================================
-- 2. team_members
-- =========================================================================
-- A single dynamic table for every designation (Founder, CEO, Director,
-- Team Member, ...) rather than one table per role — `designation` is
-- just a free-text field the admin fills in per person, per the "prefer
-- one scalable table" requirement.

create table if not exists public.team_members (
  id bigint generated always as identity primary key,
  name text not null,
  designation text not null,
  photo_url text,
  bio text,
  phone text,
  email text,
  whatsapp text,
  facebook_url text,
  linkedin_url text,
  instagram_url text,
  website_url text,
  display_order integer not null default 0,
  is_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_members_name_not_blank check (length(trim(name)) > 0),
  constraint team_members_designation_not_blank check (length(trim(designation)) > 0)
);

create index if not exists team_members_is_visible_idx on public.team_members (is_visible);
create index if not exists team_members_display_order_idx on public.team_members (display_order);

alter table public.team_members enable row level security;

grant select on public.team_members to anon, authenticated;
grant insert, update, delete on public.team_members to authenticated;

-- Public (and admin) can read only visible members — this is what the
-- "Our Leadership" section queries. A person with is_visible = false is
-- invisible to anon at the database level, not just hidden in the UI.
create policy "Public can view visible team members"
  on public.team_members
  for select
  to anon, authenticated
  using (is_visible = true);

-- Admin can additionally read hidden/draft members (for the admin list).
create policy "Admins can view all team members"
  on public.team_members
  for select
  to authenticated
  using (
    exists (select 1 from public.admin_user au where au.email = auth.jwt() ->> 'email')
  );

-- Only admins may create, edit, or delete team members — there is no
-- public submission path for this table at all (unlike feedback).
create policy "Admins can insert team members"
  on public.team_members
  for insert
  to authenticated
  with check (
    exists (select 1 from public.admin_user au where au.email = auth.jwt() ->> 'email')
  );

create policy "Admins can update team members"
  on public.team_members
  for update
  to authenticated
  using (
    exists (select 1 from public.admin_user au where au.email = auth.jwt() ->> 'email')
  )
  with check (
    exists (select 1 from public.admin_user au where au.email = auth.jwt() ->> 'email')
  );

create policy "Admins can delete team members"
  on public.team_members
  for delete
  to authenticated
  using (
    exists (select 1 from public.admin_user au where au.email = auth.jwt() ->> 'email')
  );
