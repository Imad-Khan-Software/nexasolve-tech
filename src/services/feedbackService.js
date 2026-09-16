import { supabase } from './supabase.js';

/**
 * Public: submits a new feedback/testimonial. Only these four columns
 * are ever sent — `status` is intentionally omitted so the database
 * default ('pending') applies; the `feedback` table's grants don't even
 * allow anon to specify id/status/created_at/updated_at (see
 * feedback_and_team.sql), so this isn't just a frontend convention.
 */
export async function submitFeedback({ name, email, rating, message }) {
  const payload = {
    name: name.trim(),
    email: email?.trim() || null,
    rating,
    message: message.trim(),
  };

  // Deliberately no .select() here: the SELECT RLS policy only lets
  // anon read rows where status = 'approved', and a fresh submission is
  // always 'pending' — asking for the row back would make PostgREST
  // return zero rows and throw, even though the insert itself succeeded.
  // The caller doesn't need the row back, only confirmation it landed.
  const { error } = await supabase.from('feedback').insert([payload]);
  if (error) throw error;
}

/**
 * Public: approved testimonials only, newest first. RLS restricts this
 * to status = 'approved' rows regardless of what's requested here — this
 * explicit filter is defense in depth / clarity, not the real boundary.
 */
export async function fetchApprovedFeedback({ limit = 9, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

/**
 * Admin: every feedback row regardless of status. Only returns data at
 * all for an authenticated admin session — RLS returns zero rows to
 * anyone else.
 */
export async function fetchAllFeedback() {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateFeedbackStatus(id, status) {
  const { data, error } = await supabase
    .from('feedback')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFeedback(id, fields) {
  const { data, error } = await supabase
    .from('feedback')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFeedback(id) {
  const { error } = await supabase.from('feedback').delete().eq('id', id);
  if (error) throw error;
}