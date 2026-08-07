import { createClient } from '@supabase/supabase-js';

// Support both old and new key formats
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rtfjwpytiuvoekomevpu.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_a0s486xyTpd9OdTYjcMR9g_jN0upwoA";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

function getSupabaseClient(useServiceRole = false) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Return null if not configured, fallback to JSON file
    return null;
  }
  const key = useServiceRole && SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  return createClient(SUPABASE_URL, key);
}

export const supabase = getSupabaseClient(false);
export const supabaseAdmin = getSupabaseClient(true) || getSupabaseClient(false);

// Helpers
export async function getArticlesFromSupabase() {
  const client = supabase;
  if (!client) return null;
  const { data, error } = await client.from('articles').select('*').eq('is_published', true).order('published_at', { ascending: false });
  if (error) {
    console.error("Supabase articles error", error);
    return null;
  }
  return data;
}

export async function getMagazinesFromSupabase() {
  const client = supabase;
  if (!client) return null;
  const { data, error } = await client.from('magazines').select('*').order('numero', { ascending: false });
  if (error) {
    console.error("Supabase magazines error", error);
    return null;
  }
  return data;
}

export async function getUserByEmailSupabase(email: string) {
  const client = supabaseAdmin;
  if (!client) return null;
  const { data, error } = await client.from('users').select('*').ilike('email', email).single();
  if (error) return null;
  return data;
}

// Check if Supabase is configured
export function isSupabaseConfigured() {
  return !!(SUPABASE_URL && (SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY));
}
