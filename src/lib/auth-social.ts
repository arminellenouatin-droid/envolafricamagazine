import { createUser, findUserByEmail, findUserById } from "@/lib/core-db";
import { generateAffiliateCode, type User } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type SocialProfileInput = {
  provider: "google" | "social";
  email: string;
  prenom?: string;
  nom?: string;
  avatar?: string;
  providerId?: string;
};

/**
 * Fonction serveur unifiée et robuste pour récupérer ou créer un compte utilisateur
 * lors d'une authentification sociale (Google OAuth, Google One Tap, etc.).
 *
 * Garantit :
 * - Normalisation de l'email
 * - Détection des comptes existants (par email ou ID)
 * - Création robuste pour les nouveaux comptes avec toutes les contraintes de base (role='user', code affilié unique, etc.)
 * - Aucun échec silencieux
 */
export async function getOrCreateSocialUser(input: SocialProfileInput): Promise<User> {
  const email = (input.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("Adresse e-mail invalide ou absente du profil social.");
  }

  const prenom = (input.prenom || "Envol").trim();
  const nom = (input.nom || "Utilisateur").trim();
  const avatar = input.avatar && typeof input.avatar === "string" && input.avatar.startsWith("http")
    ? input.avatar
    : undefined;
  const providerId = input.providerId || `social_${email}`;

  // 1. Rechercher si un compte existe déjà (par email en priorité, puis par ID fournisseur si c'est un UUID valide)
  let existingUser = await findUserByEmail(email);
  if (!existingUser && input.providerId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.providerId);
    if (isUuid) {
      existingUser = await findUserById(input.providerId);
    }
  }

  if (existingUser) {
    // Si l'utilisateur existant n'avait pas d'avatar et que Google en fournit un, mettre à jour discrètement
    if (!existingUser.avatar && avatar) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase
          .from("users")
          .update({ avatar })
          .eq("id", existingUser.id);
      }
      existingUser.avatar = avatar;
    }
    return existingUser;
  }

  // 2. Créer un nouveau compte utilisateur avec toutes les colonnes et contraintes obligatoires
  const affiliateCode = generateAffiliateCode(prenom, nom);

  const newUser = await createUser({
    id: input.providerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.providerId)
      ? input.providerId
      : undefined,
    nom,
    prenom,
    email,
    passwordHash: `${input.provider}:${providerId}`,
    role: "user",
    avatar,
    lang: "fr",
    currency: "XOF",
    isVerified: true,
    twoFactorEnabled: false,
    country: "BJ",
    affiliateCode,
    affiliateAccepted: false,
    referredBy: undefined,
    subscription: undefined,
    favorites: [],
    downloads: [],
  });

  return newUser;
}
