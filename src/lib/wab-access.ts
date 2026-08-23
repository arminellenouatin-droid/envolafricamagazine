export const WAB_BUSINESS_PLAN_ID = "wab-business";
export const WAB_BUSINESS_MONTHLY_PRICE = 5000;

/** Les rôles de gestion de l’écosystème ne doivent pas être bloqués par un abonnement WAB. */
export const WAB_UNLIMITED_ROLES = ["admin", "gerant", "redacteur_chef"] as const;
export function hasWabUnlimitedRole(role?: string | null): boolean {
  return Boolean(role && WAB_UNLIMITED_ROLES.includes(role as (typeof WAB_UNLIMITED_ROLES)[number]));
}
