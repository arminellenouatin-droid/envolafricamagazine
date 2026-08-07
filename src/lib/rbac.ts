import { User } from "./db";

export type Role = 'visitor' | 'user' | 'subscriber' | 'affiliate' | 'client' | 'redacteur' | 'redacteur_chef' | 'gerant' | 'admin';

const ROLE_HIERARCHY: Record<Role, number> = {
  visitor: 0,
  user: 1,
  client: 1,
  affiliate: 1,
  subscriber: 2,
  redacteur: 3,
  redacteur_chef: 4,
  gerant: 5,
  admin: 10,
};

export function hasRole(user: User | null, requiredRole: Role): boolean {
  if (!user) return requiredRole === 'visitor';
  const userLevel = ROLE_HIERARCHY[user.role as Role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}

export function canManageArticles(user: User | null): boolean {
  return hasRole(user, 'redacteur');
}

export function canPublishArticles(user: User | null): boolean {
  return hasRole(user, 'redacteur_chef');
}

export function canModerateComments(user: User | null): boolean {
  return hasRole(user, 'gerant');
}

export function canManageUsers(user: User | null): boolean {
  return hasRole(user, 'admin');
}

export function canManageMagazines(user: User | null): boolean {
  return hasRole(user, 'redacteur_chef');
}

export function canViewOrders(user: User | null, orderUserId: string): boolean {
  if (!user) return false;
  if (user.id === orderUserId) return true;
  return hasRole(user, 'gerant');
}

export function canAccessAdmin(user: User | null): boolean {
  return hasRole(user, 'redacteur');
}

export function requireRole(user: User | null, role: Role): void {
  if (!hasRole(user, role)) {
    throw new Error(`Accès refusé - rôle ${role} requis`);
  }
}
