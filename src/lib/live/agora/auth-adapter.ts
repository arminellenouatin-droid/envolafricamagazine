import { getCurrentUserFromCookie } from "@/lib/auth";
import { getServiceClient } from "./db";
import { readWabDB } from "@/lib/wab-db";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPTATEUR D'AUTHENTIFICATION UNIFIÉ : AFRICA AWARDS & WAB LIVES
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

export function extractWabSalonId(liveId: string): string {
  return liveId.startsWith("wab_") ? liveId.slice(4) : liveId;
}

/**
 * Le spectateur a-t-il le droit de regarder ce live ?
 * Par défaut : tout utilisateur connecté peut regarder un live programmé ou en cours s'il n'est pas banni.
 */
export async function canViewLive(user: AuthUser, liveId: string): Promise<boolean> {
  // 1. Vérification WAB Salon si applicable
  try {
    const wabId = extractWabSalonId(liveId);
    const db = readWabDB();
    const salon = db.salons?.find((s) => s.id === wabId || s.id === liveId);
    if (salon) {
      if (salon.status === "ended" || salon.status === "cancelled") return false;
      if (Array.isArray(salon.bannedUserIds) && salon.bannedUserIds.includes(user.id)) return false;
      return true;
    }
  } catch {}

  // 2. Vérification canal Agora standard (Africa Awards)
  const { data } = await getServiceClient()
    .from("agora_live_channels")
    .select("status")
    .eq("live_id", liveId)
    .maybeSingle();
  return !!data && data.status !== "ended";
}

/** Peut créer / démarrer / terminer des sessions et gérer les participants (organisateur / admin / hôte de salon WAB). */
export function canManageLives(user: AuthUser, liveId?: string): boolean {
  if (user.isAdmin || user.role === "host") return true;
  if (liveId) {
    try {
      const wabId = extractWabSalonId(liveId);
      const db = readWabDB();
      const salon = db.salons?.find((s) => s.id === wabId || s.id === liveId);
      if (salon && (salon.hostUserId === user.id || salon.moderatorUserIds?.includes(user.id))) return true;
    } catch {}
  }
  return false;
}
