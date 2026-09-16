import { supabase } from './supabase.js';

/**
 * Public: only members marked visible, ordered for display. display_order
 * ascending first, then created_at as the documented stable fallback for
 * members sharing (or missing) an explicit order.
 */
export async function fetchVisibleTeamMembers() {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Admin: every team member regardless of visibility, for the management
 * list. RLS returns zero rows to a non-admin caller.
 */
export async function fetchAllTeamMembers() {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

const TEAM_MEMBER_COLUMNS = [
  'name',
  'designation',
  'photo_url',
  'bio',
  'phone',
  'email',
  'whatsapp',
  'facebook_url',
  'linkedin_url',
  'instagram_url',
  'website_url',
  'display_order',
  'is_visible',
];

function pickTeamMemberColumns(fields) {
  const result = {};
  for (const key of TEAM_MEMBER_COLUMNS) {
    if (key in fields) result[key] = fields[key];
  }
  return result;
}

/**
 * Uploads a team member photo to the existing `avatars` bucket (the same
 * bucket profileService.js already uses for the admin's own avatar) under
 * a `team/` prefix, rather than creating a new storage bucket. Returns
 * the public URL, matching profileService.uploadAvatar's behavior.
 */
export async function uploadTeamPhoto(file) {
  const ext = file.name.split('.').pop();
  const path = `team/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file);
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export async function createTeamMember(fields) {
  const { data, error } = await supabase
    .from('team_members')
    .insert([pickTeamMemberColumns(fields)])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTeamMember(id, fields) {
  const { data, error } = await supabase
    .from('team_members')
    .update({ ...pickTeamMemberColumns(fields), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTeamMember(id) {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) throw error;
}
