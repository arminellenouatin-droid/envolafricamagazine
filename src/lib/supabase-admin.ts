import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase réservé aux routes serveur.
 * Il n'a volontairement aucun fallback vers une clé anonyme : une écriture
 * métier ne doit jamais être exécutée avec des privilèges insuffisants.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceRole) return null;
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function isProductionRuntime() {
  // Vercel peut exposer NODE_ENV différemment selon le contexte de build/runtime.
  // Toute fonction Vercel doit néanmoins être traitée comme non-inscriptible sur disque.
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}
