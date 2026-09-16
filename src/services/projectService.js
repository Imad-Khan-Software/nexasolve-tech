import { supabase } from './supabase.js';

/**
 * Fetches all public projects, newest first — same query as the vanilla
 * app's fetchProjects(). Columns verified: id, title, category,
 * description, techs (comma-separated string), demo_url, image_url,
 * price (optional string). No github_url or status column exists.
 */
export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('id', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Admin project management — every function here mirrors the vanilla
 * admin's script.js exactly in structure and behavior, verified by
 * reading that code, not guessed:
 *
 * - Insert/update always use exactly these columns: title, category,
 *   description, techs, demo_url, image_url, price. No extra columns
 *   (no status/created_at/featured/slug — none of those exist).
 * - Image upload path format, bucket name, and public-URL retrieval are
 *   copied verbatim from the vanilla upload handler.
 * - Replacing an image does NOT delete the old storage object — the
 *   vanilla app never does this either (old files are simply orphaned),
 *   so this preserves that exact behavior rather than inventing cleanup
 *   logic that could delete a file another row still references.
 * - Deleting a project does NOT delete its storage image, for the same
 *   reason — vanilla's deleteProject() only ever deletes the row.
 */

const PROJECT_COLUMNS = ['title', 'category', 'description', 'techs', 'demo_url', 'image_url', 'price'];

function pickProjectColumns(fields) {
  const result = {};
  for (const key of PROJECT_COLUMNS) {
    result[key] = fields[key] ?? null;
  }
  return result;
}

/**
 * Uploads an image to the existing project-images bucket and returns its
 * public URL. Path format (`projects/${timestamp}-${random}.${ext}`) is
 * identical to the vanilla app's, so files from either app end up in the
 * same place with the same naming convention.
 */
export async function uploadProjectImage(file) {
  const ext = file.name.split('.').pop();
  const path = `projects/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('project-images').upload(path, file);
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('project-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function createProject(fields) {
  const { data, error } = await supabase
    .from('projects')
    .insert([pickProjectColumns(fields)])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(id, fields) {
  const { data, error } = await supabase
    .from('projects')
    .update(pickProjectColumns(fields))
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}
