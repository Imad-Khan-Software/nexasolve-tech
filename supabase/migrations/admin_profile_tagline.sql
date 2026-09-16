-- admin_profile.tagline
-- Additive, single-column fix. Run once in the Supabase SQL Editor.
--
-- Confirmed missing via live testing (profileService.js's
-- updateProfileWithSchemaFallback caught a PGRST204 "Could not find the
-- 'tagline' column of 'admin_profile' in the schema cache" error), not
-- assumed. `location`, `email`, and `socials` are NOT touched here —
-- they're already read successfully by the public site
-- (About/Footer/Contact via siteConfig.resolveContactLinks) with no
-- equivalent missing-column error on record, so there's no evidence
-- they're absent. Only add them later if the same PGRST204 pattern
-- shows up for one of them.

alter table public.admin_profile
  add column if not exists tagline text;
