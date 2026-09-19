import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { prisma } from "@/lib/prisma";
import { MAX_DIRECT_REFERRALS, MAX_LEVELS } from "./constants";
import { AffiliateRecord, TreeNode, DownlineMember } from "./types";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Génère un code de parrainage hiérarchique au format EAM-XXXXX
 * en fonction du niveau du parrain :
 * - Niveau 0 (Fondateur / Racine) : tranche 10000 (ex: EAM-10000)
 * - Niveau 1 (Filleuls du fondateur) : tranche 11000 (ex: EAM-11001, EAM-11002...)
 * - Niveau 2 (Génération 2) : tranche 12000 (ex: EAM-12001, EAM-12002...)
 * - Niveau 3 (Génération 3) : tranche 13000 (ex: EAM-13001, EAM-13002...)
 * - Niveau 4 (Génération 4) : tranche 14000 (ex: EAM-14001, EAM-14002...)
 * - Niveau 5 (Génération 5) : tranche 15000 (ex: EAM-15001, EAM-15002...)
 */
export async function generateReferralCodeByLevel(sponsorLevel?: number | null): Promise<string> {
  let baseNumber = 10000;
  if (sponsorLevel !== undefined && sponsorLevel !== null && sponsorLevel >= 0) {
    const childLevel = sponsorLevel + 1;
    baseNumber = 10000 + childLevel * 1000;
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const prefix = `EAM-${baseNumber.toString().slice(0, 2)}`;
    const { data: existing } = await supabase
      .from("affiliates")
      .select("referral_code")
      .like("referral_code", `${prefix}%`);

    let maxNum = baseNumber;
    if (existing && existing.length > 0) {
      for (const row of existing) {
        const numPart = parseInt(row.referral_code.replace("EAM-", ""), 10);
        if (!isNaN(numPart) && numPart >= maxNum && numPart < baseNumber + 1000) {
          maxNum = numPart;
        }
      }
    }

    if (maxNum === baseNumber) {
      const { data: foundExact } = await supabase
        .from("affiliates")
        .select("referral_code")
        .eq("referral_code", `EAM-${baseNumber}`)
        .maybeSingle();

      if (!foundExact) {
        return `EAM-${baseNumber}`;
      }
    }

    const nextNum = maxNum + 1;
    return `EAM-${nextNum}`;
  }

  const randomSuffix = Math.floor(1 + Math.random() * 999);
  return `EAM-${baseNumber + randomSuffix}`;
}

export function generateReferralCode(): string {
  return `EAM-${Math.floor(10000 + Math.random() * 89999)}`;
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
    .select("*, users:user_id(id, nom, prenom, email, phone)")
    .eq("id", rootAffiliateId)
    .single();

  if (!root) return null;

  const rootName = root.users ? `${root.users.prenom} ${root.users.nom}`.trim() : "Fondateur";
  const rootCode = root.referral_code;

  // Fonction récursive pour construire les branches jusqu'à maxDepth
  async function buildSubTree(
    parentId: string,
    currentDepth: number,
    parentName: string,
    parentCode: string
  ): Promise<TreeNode[]> {
    if (currentDepth > maxDepth) return [];

    const { data: children } = await supabase!
      .from("affiliates")
      .select("*, users:user_id(id, nom, prenom, email, phone)")
      .eq("sponsor_id", parentId)
      .order("created_at", { ascending: true })
      .limit(MAX_DIRECT_REFERRALS);

    if (!children || children.length === 0) return [];

    const nodes: TreeNode[] = [];
    for (const child of children) {
      const childName = child.users ? `${child.users.prenom} ${child.users.nom}`.trim() : "Affilié";
      const childCode = child.referral_code;
      const subChildren = await buildSubTree(child.id, currentDepth + 1, childName, childCode);
      nodes.push({
        id: child.id,
        referralCode: childCode,
        level: child.level,
        relativeLevel: currentDepth,
        userName: childName,
        userEmail: child.users?.email || "",
        userPhone: child.users?.phone || "",
        totalEarnings: Number(child.total_earnings || 0),
        directCount: subChildren.length,
        magazineEnrolled: Boolean(child.magazine_enrolled),
        marketplaceEnrolled: Boolean(child.marketplace_enrolled),
        isActive: Boolean(child.is_active),
        isFounder: Boolean(child.is_founder),
        createdAt: child.created_at,
        sponsorName: parentName,
        sponsorCode: parentCode,
        children: subChildren,
      });
    }

    return nodes;
  }

  const childNodes = await buildSubTree(root.id, 1, rootName, rootCode);

  return {
    id: root.id,
    referralCode: root.referral_code,
    level: root.level,
    relativeLevel: 0,
    userName: rootName,
    userEmail: root.users?.email || "",
    userPhone: root.users?.phone || "",
    totalEarnings: Number(root.total_earnings || 0),
    directCount: childNodes.length,
    magazineEnrolled: Boolean(root.magazine_enrolled),
    marketplaceEnrolled: Boolean(root.marketplace_enrolled),
    isActive: Boolean(root.is_active),
    isFounder: Boolean(root.is_founder),
    createdAt: root.created_at,
    children: childNodes,
  };
}

/**
 * Aplatit l'arbre généalogique pour une consultation tabulaire et par niveau
 * permettant de voir chaque filleul, son niveau (1 à 5), sa branche et son parrain direct.
 */
export function flattenDownline(tree: TreeNode): DownlineMember[] {
  const members: DownlineMember[] = [];

  function traverse(node: TreeNode, branchRootName: string, branchRootCode: string) {
    if (!node.children || node.children.length === 0) return;

    for (const child of node.children) {
      const currentBranchRootName = branchRootName || child.userName;
      const currentBranchRootCode = branchRootCode || child.referralCode;

      members.push({
        id: child.id,
        referralCode: child.referralCode,
        level: child.level,
        relativeLevel: child.relativeLevel || 1,
        userName: child.userName,
        userEmail: child.userEmail,
        userPhone: child.userPhone,
        totalEarnings: child.totalEarnings,
        directCount: child.directCount,
        magazineEnrolled: child.magazineEnrolled,
        marketplaceEnrolled: child.marketplaceEnrolled,
        isActive: child.isActive ?? true,
        isFounder: child.isFounder,
        createdAt: child.createdAt,
        sponsorName: child.sponsorName || node.userName,
        sponsorCode: child.sponsorCode || node.referralCode,
        branchRootName: currentBranchRootName,
        branchRootCode: currentBranchRootCode,
      });

      traverse(child, currentBranchRootName, currentBranchRootCode);
    }
  }

  traverse(tree, "", "");
  return members;
}
