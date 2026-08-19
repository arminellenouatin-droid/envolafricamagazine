import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "./auth";
import { readDB } from "./db";
import { findUserById } from "./core-db";
import { isProductionRuntime } from "./supabase-admin";
import { hasRole, Role } from "./rbac";

export async function getCurrentUserForAdmin(requiredRole: Role = 'redacteur') {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return { user: null, error: "Non authentifié", status: 401 };
  const decoded = verifyToken(token);
  if (!decoded) return { user: null, error: "Token invalide", status: 401 };
  let db: ReturnType<typeof readDB> | undefined;
  try {
    db = isProductionRuntime() ? undefined : readDB();
    const user = (await findUserById(decoded.id)) || db?.users.find(u=>u.id===decoded.id) || null;
    if (!user) return { user: null, error: "Utilisateur introuvable", status: 404 };
    if (!hasRole(user, requiredRole)) {
      return { user: null, error: `Rôle ${requiredRole} requis`, status: 403 };
    }
    return { user, db };
  } catch (error) {
    console.error("[admin-auth] Base de production indisponible", error);
    return { user: null, error: "Base de données indisponible", status: 503 };
  }

}
