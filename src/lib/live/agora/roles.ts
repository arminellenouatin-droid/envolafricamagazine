// Fichier sûr côté client ET serveur (aucun secret ici).
//
// Correspondance avec Africa Awards :
//   host      = animateur (publie audio + vidéo)
//   cohost    = candidat / invité sur scène (publie audio + vidéo)
//   moderator = modérateur (regarde, ne publie pas ; ses pouvoirs de modération restent dans ton système actuel)
//   audience  = spectateur (regarde uniquement)

export const LIVE_ROLES = ["host", "cohost", "moderator", "audience"] as const;
export type LiveRole = (typeof LIVE_ROLES)[number];

export const PRIVILEGED_ROLES = ["host", "cohost", "moderator"] as const;
export type PrivilegedRole = (typeof PRIVILEGED_ROLES)[number];

export const canPublish = (role: LiveRole): boolean => role === "host" || role === "cohost";

/** Plages d'UID Agora : < 1e9 = participants enregistrés en base ; >= 1e9 = spectateurs (aléatoires). */
export const AUDIENCE_UID_MIN = 1_000_000_000;
export const AUDIENCE_UID_MAX = 4_000_000_000;

export type TokenPayload = {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  role: LiveRole;
  expiresAt: number; // timestamp en secondes
};

export type RosterEntry = { uid: number; userId: string; role: PrivilegedRole };
