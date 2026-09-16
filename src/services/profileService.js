import { supabase } from './supabase.js';

/**
 * Fetches the single admin_profile row — same query as the vanilla app's
 * fetchProfile(). `id`, `name`, `avatar_url` are confirmed-real columns
 * (vanilla's admin panel actually writes them). `socials`, `tagline`,
 * `location`, `email` were only ever *read* in vanilla — never written —
 * so their existence was inferred from usage, not proven; a live test
 * later confirmed `tagline` does not actually exist as a column. `select
 * ('*')` never errors on a genuinely absent column (it's just omitted
 * from the row), which is exactly why this went undetected until a real
 * write was attempted in Phase 7.
 */
export async function fetchProfile() {
  const { data, error } = await supabase
    .from('admin_profile')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Admin profile editing. Vanilla's admin UI only ever wires up editing
 * for `name` (inline click-to-edit) and `avatar_url` (click-to-upload) —
 * verified by reading script.js, and both have actual proven write
 * precedent in the working production app. `tagline`/`location`/`email`/
 * `socials` were only ever *read* in vanilla (footer/contact display) —
 * never written — so their existence as real columns was inferred from
 * frontend usage alone, which turned out to be insufficient evidence:
 * live testing confirmed `tagline` does not exist (PGRST204, "Could not
 * find the 'tagline' column of 'admin_profile' in the schema cache").
 * The other three carry the same unproven risk. See updateProfile()
 * below for how writes now handle that uncertainty defensively.
 */
export async function updateProfile(id, fields) {
  return updateProfileWithSchemaFallback(id, { ...fields });
}

const MISSING_COLUMN_RE = /Could not find the '([^']+)' column/i;

/**
 * Attempts the update; if Postgrest reports a specific column doesn't
 * exist in its schema cache (PGRST204), strips exactly that column and
 * retries — using Supabase's own error to tell us what's real rather
 * than guessing. Bounded to one attempt per field so it can never loop
 * forever. Any other error (RLS denial, network failure, etc.) is
 * re-thrown immediately, unmodified, so it stays visible for debugging.
 */
async function updateProfileWithSchemaFallback(id, payload) {
  const maxAttempts = Object.keys(payload).length + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase
      .from('admin_profile')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (!error) return data;

    const match = error.code === 'PGRST204' && error.message.match(MISSING_COLUMN_RE);
    const missingColumn = match?.[1];
    if (!missingColumn || !(missingColumn in payload)) throw error;

    // eslint-disable-next-line no-console
    console.warn(
      `admin_profile has no '${missingColumn}' column — dropping it from this save and retrying.`,
      error
    );
    const rest = { ...payload };
    delete rest[missingColumn];
    payload = rest;
  }

  throw new Error('Could not save profile: too many unrecognized columns.');
}

/**
 * Uploads a new avatar to the existing `avatars` bucket and returns its
 * public URL. Path format (`admin-${timestamp}.${ext}`, no subfolder) and
 * the `{ upsert: true }` option are copied verbatim from the vanilla
 * app's handleImageUpload(). Does not delete the previous avatar file —
 * vanilla never does either.
 */
export async function uploadAvatar(file) {
  const ext = file.name.split('.').pop();
  const path = `admin-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
