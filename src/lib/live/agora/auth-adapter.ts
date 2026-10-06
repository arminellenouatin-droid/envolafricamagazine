import { getCurrentUserFromCookie } from "@/lib/auth";
import { getServiceClient } from "./db";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPTATEUR D'AUTHENTIFICATION AFRICA AWARDS
 *  Connecté à l'auth réelle du projet (eam_token JWT + base de données)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type AuthUser = { id: string; isAdmin: boolean; role?: string };

/** Retourne l'utilisateur connecté (validé côté serveur via JWT eam_token & DB) ou null. */
export async function getAuthUser(): Promise<AuthUser | null> {
  const user = await getCurrentUserFromCookie();
  if (!user) return null;
  const isAdmin = user.role === "admin";
  return { id: user.id, isAdmin, role: user.role };
}

/**
 * Le spectateur a-t-il le droit de regarder ce live ?
 * Par défaut : tout utilisateur connecté peut regarder un live programmé ou en cours.
 */
export async function canViewLive(_user: AuthUser, liveId: string): Promise<boolean> {
  const { data } = await getServiceClient()
    .from("agora_live_channels")
    .select("status")
    .eq("live_id", liveId)
    .maybeSingle();
  return !!data && data.status !== "ended";
}

/** Peut créer / démarrer / terminer des sessions et gérer les participants (organisateur / admin). */
export function canManageLives(user: AuthUser): boolean {
  return user.isAdmin || user.role === "host";
}
