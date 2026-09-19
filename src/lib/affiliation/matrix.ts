import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { prisma } from "@/lib/prisma";
import { MAX_DIRECT_REFERRALS, MAX_LEVELS } from "./constants";
import { AffiliateRecord, TreeNode } from "./types";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Génère un code de parrainage unique, ex: "EAM-7K3PQXWM" */
export function generateReferralCode(): string {
  let code = "EAM-";
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/**
 * Vérifie si un parrain peut encore accepter un filleul direct.
 * Matrice forcée 5x5 : 5 filleuls directs maximum.
 */
export async function canAcceptDirectReferral(sponsorId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { count, error } = await supabase
      .from("affiliates")
      .select("*", { count: "exact", head: true })
      .eq("sponsor_id", sponsorId);

    if (error) {
      console.error("[matrix] Error checking direct referral count:", error);
      return false;
    }
    return (count ?? 0) < MAX_DIRECT_REFERRALS;
  }

  const count = await prisma.affiliate.count({ where: { sponsorId } });
  return count < MAX_DIRECT_REFERRALS;
}

export interface SponsorChainEntry {
  level: number; // 1 = parrain direct, ... 5 = 5e génération
  affiliate: AffiliateRecord;
}

/**
 * Remonte la chaîne des parrains d'un affilié, du niveau 1 (parrain direct)
 * jusqu'au niveau 5 (ou moins si la chaîne est plus courte / niveau incomplet).
 */
export async function getSponsorChain(
  affiliateId: string,
  maxLevels: number = MAX_LEVELS
): Promise<SponsorChainEntry[]> {
  const chain: SponsorChainEntry[] = [];
  const supabase = getSupabaseAdmin();

  if (supabase) {
    let currentId = affiliateId;
    let level = 1;

    // Récupère l'affilié initial pour connaître son sponsor_id
    const { data: initial } = await supabase
      .from("affiliates")
      .select("*")
      .eq("id", currentId)
      .single();

    if (!initial || !initial.sponsor_id) return chain;
    currentId = initial.sponsor_id;

    while (currentId && level <= maxLevels) {
      const { data: sponsor } = await supabase
        .from("affiliates")
        .select("*, users:user_id(id, nom, prenom, email, role)")
        .eq("id", currentId)
        .single();

      if (!sponsor) break;

      const record: AffiliateRecord = {
        id: sponsor.id,
        userId: sponsor.user_id,
        sponsorId: sponsor.sponsor_id,
        referralCode: sponsor.referral_code,
        level: sponsor.level,
        totalEarnings: Number(sponsor.total_earnings || 0),
        withdrawnTotal: Number(sponsor.withdrawn_total || 0),
        isRoot: Boolean(sponsor.is_root),
        isFounder: Boolean(sponsor.is_founder),
        isActive: Boolean(sponsor.is_active),
        magazineEnrolled: Boolean(sponsor.magazine_enrolled),
        marketplaceEnrolled: Boolean(sponsor.marketplace_enrolled),
        createdAt: sponsor.created_at,
        updatedAt: sponsor.updated_at,
        user: sponsor.users
          ? {
              id: sponsor.users.id,
              nom: sponsor.users.nom,
              prenom: sponsor.users.prenom,
              email: sponsor.users.email,
              role: sponsor.users.role,
            }
          : undefined,
      };

      chain.push({ level, affiliate: record });
      currentId = sponsor.sponsor_id;
      level += 1;
    }

    return chain;
  }

  // Fallback Prisma
  let current = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
  });
  if (!current) return chain;

  let level = 1;
  while (current?.sponsorId && level <= maxLevels) {
    const sponsor = await prisma.affiliate.findUnique({
      where: { id: current.sponsorId },
      include: { user: true },
    });
    if (!sponsor) break;

    chain.push({
      level,
      affiliate: {
        id: sponsor.id,
        userId: sponsor.userId,
        sponsorId: sponsor.sponsorId,
        referralCode: sponsor.referralCode,
        level: sponsor.level,
        totalEarnings: Number(sponsor.totalEarnings),
        withdrawnTotal: Number(sponsor.withdrawnTotal),
        isRoot: sponsor.isRoot,
        isFounder: sponsor.isFounder,
        isActive: sponsor.isActive,
        magazineEnrolled: sponsor.magazineEnrolled,
        marketplaceEnrolled: sponsor.marketplaceEnrolled,
        createdAt: sponsor.createdAt.toISOString(),
        updatedAt: sponsor.updatedAt.toISOString(),
        user: sponsor.user
          ? {
              id: sponsor.user.id,
              nom: sponsor.user.nom,
              prenom: sponsor.user.prenom,
              email: sponsor.user.email,
            }
          : undefined,
      },
    });
    current = sponsor;
    level += 1;
  }

  return chain;
}

/**
 * Calcule la profondeur du réseau actif (généalogie descendante) d'un affilié.
 */
export async function getNetworkDepth(
  affiliateId: string,
  maxDepth: number = MAX_LEVELS
): Promise<number> {
  const supabase = getSupabaseAdmin();
  let depth = 0;
  let currentLevelIds = [affiliateId];

  while (currentLevelIds.length > 0 && depth < maxDepth) {
    if (supabase) {
      const { data: children } = await supabase
        .from("affiliates")
        .select("id")
        .in("sponsor_id", currentLevelIds);

      if (!children || children.length === 0) break;
      depth += 1;
      currentLevelIds = children.map((c) => c.id);
    } else {
      const children = await prisma.affiliate.findMany({
        where: { sponsorId: { in: currentLevelIds } },
        select: { id: true },
      });
      if (children.length === 0) break;
      depth += 1;
      currentLevelIds = children.map((c: any) => c.id);
    }
  }

  return depth;
}

/**
 * Construit l'arbre complet descendant 5x5 pour l'inspecteur d'arbre visuel.
 */
export async function getNetworkTree(
  rootAffiliateId: string,
  maxDepth: number = MAX_LEVELS
): Promise<TreeNode | null> {
  const supabase = getSupabaseAdmin();

  if (!supabase) return null;

  // Récupérer le nœud racine
  const { data: root } = await supabase
    .from("affiliates")
    .select("*, users:user_id(id, nom, prenom, email)")
    .eq("id", rootAffiliateId)
    .single();

  if (!root) return null;

  // Fonction récursive pour construire les branches jusqu'à maxDepth
  async function buildSubTree(parentId: string, currentDepth: number): Promise<TreeNode[]> {
    if (currentDepth > maxDepth) return [];

    const { data: children } = await supabase!
      .from("affiliates")
      .select("*, users:user_id(id, nom, prenom, email)")
      .eq("sponsor_id", parentId)
      .order("created_at", { ascending: true })
      .limit(MAX_DIRECT_REFERRALS);

    if (!children || children.length === 0) return [];

    const nodes: TreeNode[] = [];
    for (const child of children) {
      const subChildren = await buildSubTree(child.id, currentDepth + 1);
      nodes.push({
        id: child.id,
        referralCode: child.referral_code,
        level: child.level,
        userName: child.users ? `${child.users.prenom} ${child.users.nom}`.trim() : "Affilié",
        userEmail: child.users?.email || "",
        totalEarnings: Number(child.total_earnings || 0),
        directCount: children.length,
        magazineEnrolled: Boolean(child.magazine_enrolled),
        marketplaceEnrolled: Boolean(child.marketplace_enrolled),
        isFounder: Boolean(child.is_founder),
        children: subChildren,
      });
    }

    return nodes;
  }

  const childNodes = await buildSubTree(root.id, 1);

  return {
    id: root.id,
    referralCode: root.referral_code,
    level: root.level,
    userName: root.users ? `${root.users.prenom} ${root.users.nom}`.trim() : "Fondateur",
    userEmail: root.users?.email || "",
    totalEarnings: Number(root.total_earnings || 0),
    directCount: childNodes.length,
    magazineEnrolled: Boolean(root.magazine_enrolled),
    marketplaceEnrolled: Boolean(root.marketplace_enrolled),
    isFounder: Boolean(root.is_founder),
    children: childNodes,
  };
}
