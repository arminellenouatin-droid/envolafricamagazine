import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin } from "./supabase-admin";
import { readCrowdDB } from "./crowdfunding-db";

export interface CrowdfundingSpace {
  id: string;
  projetId: string;
  porteurId: string;
  title: string;
  campaignMode: "don" | "prise_part" | "pret" | "mixte";
  status: "actif" | "archive" | "en_litige";
  createdAt: string;
  updatedAt: string;
  // Metadata joined from project
  projectNom?: string;
  projectSecteur?: string;
  projectPays?: string;
  projectImage?: string;
  montantCollecte?: number;
  montantRecherche?: number;
  niveauRisque?: string;
  investisseursCount?: number;
  unreadCount?: number;
  lastMessage?: {
    content?: string;
    senderName?: string;
    createdAt?: string;
    isUpdate?: boolean;
  };
}

export interface CrowdfundingParticipant {
  id: string;
  spaceId: string;
  userId: string;
  nom: string;
  avatar?: string;
  role: "porteur" | "investisseur" | "admin";
  investmentId?: string;
  investmentMode: "don" | "prise_part" | "pret";
  investedAmount: number;
  percentage?: number;
  interestRate?: number;
  status: "actif" | "revoque" | "mute";
  joinedAt: string;
  revokedAt?: string;
}

export interface CrowdfundingAttachment {
  id: string;
  messageId: string;
  type: "document" | "image" | "video" | "voice";
  url: string;
  name: string;
  size: number;
  duration?: number;
  mimeType?: string;
  createdAt: string;
}

export interface CrowdfundingMessage {
  id: string;
  spaceId: string;
  senderId: string;
  senderRole: "porteur" | "investisseur" | "admin" | "system";
  senderName: string;
  senderAvatar?: string;
  content: string;
  isUpdate: boolean;
  updateTitle?: string;
  isPinned: boolean;
  mentions: string[];
  readBy: string[];
  createdAt: string;
  attachments: CrowdfundingAttachment[];
}

export interface CrowdfundingCallSession {
  id: string;
  spaceId: string;
  initiatorId: string;
  initiatorName: string;
  callType: "audio" | "video";
  isGroup: boolean;
  status: "initiated" | "active" | "ended" | "missed";
  participants: string[];
  durationSeconds: number;
  createdAt: string;
  endedAt?: string;
}

export interface CrowdfundingSettings {
  projetId: string;
  showAmountsToInvestors: boolean;
  allowInvestorCalls: boolean;
}

export interface CrowdfundingReport {
  id: string;
  spaceId: string;
  reporterId: string;
  targetType: "message" | "participant" | "space";
  targetId: string;
  reason: string;
  status: "en_attente" | "traite" | "rejete";
  createdAt: string;
}

interface MessagesDataStore {
  spaces: CrowdfundingSpace[];
  participants: CrowdfundingParticipant[];
  messages: CrowdfundingMessage[];
  attachments: CrowdfundingAttachment[];
  calls: CrowdfundingCallSession[];
  settings: Record<string, CrowdfundingSettings>;
  reports: CrowdfundingReport[];
}

declare global {
  // eslint-disable-next-line no-var
  var __crowdMemoryStore: MessagesDataStore | undefined;
}

function getMemoryStore(): MessagesDataStore {
  if (!global.__crowdMemoryStore) {
    global.__crowdMemoryStore = {
      spaces: [],
      participants: [],
      messages: [],
      attachments: [],
      calls: [],
      settings: {},
      reports: [],
    };
  }
  return global.__crowdMemoryStore;
}

/**
 * Synchronise les espaces avec les projets et contributions existants.
 * Crée un espace pour chaque projet s'il n'existe pas encore.
 * Intègre le porteur et tous les investisseurs confirmés.
 */
export async function syncSpacesAndContributions(): Promise<{ spaces: CrowdfundingSpace[] }> {
  const supabase = getSupabaseAdmin();
  let crowdDB: any = { projets: [], contributions: [] };
  try {
    crowdDB = readCrowdDB();
  } catch {}

  if (supabase) {
    try {
      for (const project of crowdDB.projets || []) {
        const spaceId = `space-${project.id}`;

        // 1. Vérifier si l'espace existe
        const { data: existingSpace } = await supabase
          .from("crowdfunding_spaces")
          .select("id")
          .eq("projet_id", project.id)
          .maybeSingle();

        if (!existingSpace) {
          await supabase.from("crowdfunding_spaces").insert({
            id: spaceId,
            projet_id: project.id,
            porteur_id: project.porteurId,
            title: project.nom,
            campaign_mode: (project.typesFinancement?.[0] as any) || "don",
            status: project.statut === "en_litige" ? "en_litige" : "actif",
            created_at: project.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // 2. Vérifier si le porteur est participant
        const { data: porteurPart } = await supabase
          .from("crowdfunding_participants")
          .select("id")
          .eq("space_id", spaceId)
          .eq("user_id", project.porteurId)
          .maybeSingle();

        if (!porteurPart) {
          await supabase.from("crowdfunding_participants").insert({
            id: uuidv4(),
            space_id: spaceId,
            user_id: project.porteurId,
            nom: "Porteur du projet",
            role: "porteur",
            investment_mode: "don",
            invested_amount: 0,
            status: "actif",
            joined_at: project.createdAt || new Date().toISOString(),
          });
        }

        // 3. Ajouter les investisseurs confirmés
        const projectContributions = (crowdDB.contributions || []).filter(
          (c: any) => c.projetId === project.id
        );

        for (const contrib of projectContributions) {
          const { data: existingContrib } = await supabase
            .from("crowdfunding_participants")
            .select("id, status")
            .eq("space_id", spaceId)
            .eq("user_id", contrib.investisseurId)
            .maybeSingle();

          if (!existingContrib) {
            await supabase.from("crowdfunding_participants").insert({
              id: uuidv4(),
              space_id: spaceId,
              user_id: contrib.investisseurId,
              nom: "Investisseur",
              role: "investisseur",
              investment_id: contrib.id,
              investment_mode: contrib.type || "don",
              invested_amount: contrib.montant || 0,
              percentage: contrib.pourcentage,
              interest_rate: contrib.tauxInteret,
              status: "actif",
              joined_at: contrib.createdAt || new Date().toISOString(),
            });
          }
        }
      }

      const { data: dbSpaces } = await supabase.from("crowdfunding_spaces").select("*");
      return {
        spaces: (dbSpaces || []).map((s: any) => ({
          id: s.id,
          projetId: s.projet_id,
          porteurId: s.porteur_id,
          title: s.title,
          campaignMode: s.campaign_mode,
          status: s.status,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        })),
      };
    } catch (e) {
      console.warn("[syncSpacesAndContributions] Fallback in-memory:", e);
    }
  }

  // Fallback in-memory
  const store = getMemoryStore();
  for (const project of crowdDB.projets || []) {
    let space = store.spaces.find((s) => s.projetId === project.id);
    if (!space) {
      space = {
        id: `space-${project.id}`,
        projetId: project.id,
        porteurId: project.porteurId,
        title: project.nom,
        campaignMode: (project.typesFinancement?.[0] as any) || "don",
        status: project.statut === "en_litige" ? "en_litige" : "actif",
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.spaces.push(space);
    }

    const hasPorteur = store.participants.some(
      (p) => p.spaceId === space!.id && p.userId === project.porteurId && p.role === "porteur"
    );
    if (!hasPorteur) {
      store.participants.push({
        id: uuidv4(),
        spaceId: space.id,
        userId: project.porteurId,
        nom: "Porteur du projet",
        role: "porteur",
        investmentMode: "don",
        investedAmount: 0,
        status: "actif",
        joinedAt: space.createdAt,
      });
    }

    const projectContributions = (crowdDB.contributions || []).filter(
      (c: any) => c.projetId === project.id
    );

    for (const contrib of projectContributions) {
      const existing = store.participants.find(
        (p) => p.spaceId === space!.id && p.userId === contrib.investisseurId
      );
      if (!existing) {
        store.participants.push({
          id: uuidv4(),
          spaceId: space.id,
          userId: contrib.investisseurId,
          nom: "Investisseur",
          role: "investisseur",
          investmentId: contrib.id,
          investmentMode: contrib.type || "don",
          investedAmount: contrib.montant || 0,
          percentage: contrib.pourcentage,
          interestRate: contrib.tauxInteret,
          status: "actif",
          joinedAt: contrib.createdAt || new Date().toISOString(),
        });
      }
    }
  }

  return { spaces: store.spaces };
}

/**
 * Récupère les espaces accessibles pour un utilisateur donné.
 */
export async function getSpacesForUser(userId: string, role?: string): Promise<CrowdfundingSpace[]> {
  await syncSpacesAndContributions();
  const supabase = getSupabaseAdmin();
  let crowdDB: any = { projets: [] };
  try {
    crowdDB = readCrowdDB();
  } catch {}
  const projectMap = new Map((crowdDB.projets || []).map((p: any) => [p.id, p]));
  const isAdmin = role === "admin";

  if (supabase) {
    try {
      // Trouver les espaces où l'utilisateur participe
      const { data: myParticipations } = await supabase
        .from("crowdfunding_participants")
        .select("space_id")
        .eq("user_id", userId)
        .eq("status", "actif");

      const spaceIds = (myParticipations || []).map((p) => p.space_id);

      let query = supabase.from("crowdfunding_spaces").select("*");
      if (!isAdmin && spaceIds.length > 0) {
        query = query.in("id", spaceIds);
      } else if (!isAdmin && spaceIds.length === 0) {
        return [];
      }

      const { data: spaces, error: spaceErr } = await query.order("updated_at", { ascending: false });

      if (!spaceErr && spaces) {
        // Enrichir chaque espace
        const result: CrowdfundingSpace[] = [];
        for (const s of spaces) {
          const proj: any = projectMap.get(s.projet_id);

          const { data: msgs } = await supabase
            .from("crowdfunding_messages")
            .select("content, sender_name, created_at, is_update, read_by, sender_id")
            .eq("space_id", s.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const lastMsg = msgs?.[0];

          const { count: unreadCount } = await supabase
            .from("crowdfunding_messages")
            .select("*", { count: "exact", head: true })
            .eq("space_id", s.id)
            .neq("sender_id", userId)
            .not("read_by", "cs", JSON.stringify([userId]));

          const { count: partCount } = await supabase
            .from("crowdfunding_participants")
            .select("*", { count: "exact", head: true })
            .eq("space_id", s.id)
            .eq("status", "actif");

          result.push({
            id: s.id,
            projetId: s.projet_id,
            porteurId: s.porteur_id,
            title: s.title,
            campaignMode: s.campaign_mode,
            status: s.status,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            projectNom: proj?.nom || s.title,
            projectSecteur: proj?.secteur || "Général",
            projectPays: proj?.pays || "Afrique",
            projectImage: proj?.images?.[0] || "",
            montantCollecte: proj?.montantCollecte || 0,
            montantRecherche: proj?.montantRecherche || 1000000,
            niveauRisque: proj?.niveauRisque || "moyen",
            investisseursCount: partCount || 1,
            unreadCount: unreadCount || 0,
            lastMessage: lastMsg ? {
              content: lastMsg.content,
              senderName: lastMsg.sender_name,
              createdAt: lastMsg.created_at,
              isUpdate: lastMsg.is_update,
            } : undefined,
          });
        }
        return result;
      }
    } catch (e) {
      console.warn("[getSpacesForUser] Fallback in-memory:", e);
    }
  }

  // Fallback in-memory
  const store = getMemoryStore();
  const activeParticipations = store.participants.filter(
    (p) => p.userId === userId && p.status === "actif"
  );
  const accessibleSpaceIds = new Set(activeParticipations.map((p) => p.spaceId));
  const accessibleSpaces = store.spaces.filter((s) => isAdmin || accessibleSpaceIds.has(s.id));

  return accessibleSpaces.map((space) => {
    const proj: any = projectMap.get(space.projetId);
    const spaceMessages = store.messages.filter((m) => m.spaceId === space.id);
    const sorted = [...spaceMessages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastMsg = sorted[0];
    const unread = spaceMessages.filter(
      (m) => m.senderId !== userId && !m.readBy.includes(userId)
    ).length;

    return {
      ...space,
      projectNom: proj?.nom || space.title,
      projectSecteur: proj?.secteur || "Général",
      projectPays: proj?.pays || "Afrique",
      projectImage: proj?.images?.[0] || "",
      montantCollecte: proj?.montantCollecte || 0,
      montantRecherche: proj?.montantRecherche || 1000000,
      niveauRisque: proj?.niveauRisque || "moyen",
      investisseursCount: store.participants.filter((p) => p.spaceId === space.id && p.status === "actif").length,
      unreadCount: unread,
      lastMessage: lastMsg ? {
        content: lastMsg.content,
        senderName: lastMsg.senderName,
        createdAt: lastMsg.createdAt,
        isUpdate: lastMsg.isUpdate,
      } : undefined,
    };
  });
}

/**
 * Vérifie l'accès d'un utilisateur à un espace Crowdfunding
 */
export async function checkAccess(spaceId: string, userId: string, isAdmin = false): Promise<CrowdfundingParticipant | null> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data: part } = await supabase
        .from("crowdfunding_participants")
        .select("*")
        .eq("space_id", spaceId)
        .eq("user_id", userId)
        .eq("status", "actif")
        .maybeSingle();

      if (part) {
        return {
          id: part.id,
          spaceId: part.space_id,
          userId: part.user_id,
          nom: part.nom,
          avatar: part.avatar,
          role: part.role,
          investmentId: part.investment_id,
          investmentMode: part.investment_mode,
          investedAmount: Number(part.invested_amount || 0),
          percentage: part.percentage ? Number(part.percentage) : undefined,
          interestRate: part.interest_rate ? Number(part.interest_rate) : undefined,
          status: part.status,
          joinedAt: part.joined_at,
          revokedAt: part.revoked_at,
        };
      }
    } catch {}
  }

  // Fallback in-memory
  const store = getMemoryStore();
  const participant = store.participants.find(
    (p) => p.spaceId === spaceId && p.userId === userId && p.status === "actif"
  );
  if (participant) return participant;

  if (isAdmin) {
    return {
      id: "admin-view",
      spaceId,
      userId,
      nom: "Administrateur Plateforme",
      role: "admin",
      investmentMode: "don",
      investedAmount: 0,
      status: "actif",
      joinedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Détails complets d'un espace Crowdfunding
 */
export async function getSpaceDetails(spaceId: string, userId: string, isAdmin = false) {
  const participant = await checkAccess(spaceId, userId, isAdmin);
  if (!participant) return null;

  const supabase = getSupabaseAdmin();
  let crowdDB: any = { projets: [] };
  try {
    crowdDB = readCrowdDB();
  } catch {}

  if (supabase) {
    try {
      const { data: space } = await supabase
        .from("crowdfunding_spaces")
        .select("*")
        .eq("id", spaceId)
        .maybeSingle();

      if (space) {
        const project = (crowdDB.projets || []).find((p: any) => p.id === space.projet_id);
        const { data: settingsRow } = await supabase
          .from("crowdfunding_settings")
          .select("*")
          .eq("projet_id", space.projet_id)
          .maybeSingle();

        const settings = settingsRow || {
          projetId: space.projet_id,
          showAmountsToInvestors: false,
          allowInvestorCalls: true,
        };

        return {
          space: {
            id: space.id,
            projetId: space.projet_id,
            porteurId: space.porteur_id,
            title: space.title,
            campaignMode: space.campaign_mode,
            status: space.status,
            createdAt: space.created_at,
            updatedAt: space.updated_at,
          },
          project,
          participant,
          settings,
        };
      }
    } catch {}
  }

  // Fallback in-memory
  const store = getMemoryStore();
  const space = store.spaces.find((s) => s.id === spaceId);
  if (!space) return null;
  const project = (crowdDB.projets || []).find((p: any) => p.id === space.projetId);
  const settings = store.settings[space.projetId] || {
    projetId: space.projetId,
    showAmountsToInvestors: false,
    allowInvestorCalls: true,
  };

  return { space, project, participant, settings };
}

/**
 * Récupère les messages d'un espace
 */
export async function getMessages(
  spaceId: string,
  userId: string,
  filter?: "all" | "updates",
  search?: string,
  isAdmin = false
): Promise<CrowdfundingMessage[]> {
  const participant = await checkAccess(spaceId, userId, isAdmin);
  if (!participant) return [];

  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      let query = supabase
        .from("crowdfunding_messages")
        .select("*")
        .eq("space_id", spaceId);

      if (filter === "updates") {
        query = query.eq("is_update", true);
      }

      if (search && search.trim()) {
        query = query.ilike("content", `%${search.trim()}%`);
      }

      const { data: rows } = await query.order("created_at", { ascending: true }).limit(200);

      if (rows) {
        const msgIds = rows.map((r) => r.id);
        const { data: attachments } = msgIds.length > 0
          ? await supabase.from("crowdfunding_attachments").select("*").in("message_id", msgIds)
          : { data: [] };

        const attMap = new Map<string, CrowdfundingAttachment[]>();
        for (const a of attachments || []) {
          if (!attMap.has(a.message_id)) attMap.set(a.message_id, []);
          attMap.get(a.message_id)!.push({
            id: a.id,
            messageId: a.message_id,
            type: a.type,
            url: a.url,
            name: a.name,
            size: Number(a.size || 0),
            duration: a.duration,
            mimeType: a.mime_type,
            createdAt: a.created_at,
          });
        }

        return rows.map((r) => ({
          id: r.id,
          spaceId: r.space_id,
          senderId: r.sender_id,
          senderRole: r.sender_role,
          senderName: r.sender_name,
          senderAvatar: r.sender_avatar,
          content: r.content || "",
          isUpdate: r.is_update,
          updateTitle: r.update_title,
          isPinned: r.is_pinned,
          mentions: r.mentions || [],
          readBy: r.read_by || [],
          createdAt: r.created_at,
          attachments: attMap.get(r.id) || [],
        }));
      }
    } catch {}
  }

  // Fallback in-memory
  const store = getMemoryStore();
  let msgs = store.messages.filter((m) => m.spaceId === spaceId);
  if (filter === "updates") msgs = msgs.filter((m) => m.isUpdate);
  if (search && search.trim()) {
    const q = search.toLowerCase();
    msgs = msgs.filter((m) => m.content.toLowerCase().includes(q));
  }
  return msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/**
 * Envoie un message dans un espace
 */
export async function sendMessage(params: {
  spaceId: string;
  senderId: string;
  senderName: string;
  senderRole: "porteur" | "investisseur" | "admin" | "system";
  senderAvatar?: string;
  content: string;
  isUpdate?: boolean;
  updateTitle?: string;
  mentions?: string[];
  attachments?: Array<{
    type: "document" | "image" | "video" | "voice";
    url: string;
    name: string;
    size: number;
    duration?: number;
    mimeType?: string;
  }>;
}): Promise<CrowdfundingMessage | null> {
  const { spaceId, senderId, senderName, senderRole, senderAvatar, content, isUpdate, updateTitle, mentions, attachments } = params;
  const participant = await checkAccess(spaceId, senderId, senderRole === "admin");
  if (!participant) return null;

  const isActualUpdate = Boolean(isUpdate && (participant.role === "porteur" || participant.role === "admin"));
  const messageId = uuidv4();
  const now = new Date().toISOString();

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data: inserted, error } = await supabase
        .from("crowdfunding_messages")
        .insert({
          id: messageId,
          space_id: spaceId,
          sender_id: senderId,
          sender_role: participant.role,
          sender_name: senderName,
          sender_avatar: senderAvatar,
          content: content || "",
          is_update: isActualUpdate,
          update_title: isActualUpdate ? updateTitle || "Mise à jour de campagne" : undefined,
          is_pinned: false,
          mentions: mentions || [],
          read_by: [senderId],
          created_at: now,
        })
        .select()
        .single();

      if (!error && inserted) {
        const formattedAttachments: CrowdfundingAttachment[] = [];
        if (attachments && attachments.length > 0) {
          const toInsert = attachments.map((att) => ({
            id: uuidv4(),
            message_id: messageId,
            type: att.type,
            url: att.url,
            name: att.name,
            size: att.size || 0,
            duration: att.duration,
            mime_type: att.mimeType,
            created_at: now,
          }));

          await supabase.from("crowdfunding_attachments").insert(toInsert);
          formattedAttachments.push(...toInsert.map((a) => ({
            id: a.id,
            messageId: a.message_id,
            type: a.type as any,
            url: a.url,
            name: a.name,
            size: a.size,
            duration: a.duration,
            mimeType: a.mime_type,
            createdAt: a.created_at,
          })));
        }

        await supabase
          .from("crowdfunding_spaces")
          .update({ updated_at: now })
          .eq("id", spaceId);

        return {
          id: messageId,
          spaceId,
          senderId,
          senderRole: participant.role,
          senderName,
          senderAvatar,
          content: content || "",
          isUpdate: isActualUpdate,
          updateTitle: isActualUpdate ? updateTitle || "Mise à jour de campagne" : undefined,
          isPinned: false,
          mentions: mentions || [],
          readBy: [senderId],
          createdAt: now,
          attachments: formattedAttachments,
        };
      }
    } catch (e) {
      console.warn("[sendMessage] Fallback in-memory:", e);
    }
  }

  // Fallback in-memory
  const store = getMemoryStore();
  const formattedAttachments: CrowdfundingAttachment[] = (attachments || []).map((att) => ({
    id: uuidv4(),
    messageId,
    type: att.type,
    url: att.url,
    name: att.name,
    size: att.size || 0,
    duration: att.duration,
    mimeType: att.mimeType,
    createdAt: now,
  }));

  const newMsg: CrowdfundingMessage = {
    id: messageId,
    spaceId,
    senderId,
    senderRole: participant.role,
    senderName,
    senderAvatar,
    content: content || "",
    isUpdate: isActualUpdate,
    updateTitle: isActualUpdate ? updateTitle || "Mise à jour de campagne" : undefined,
    isPinned: false,
    mentions: mentions || [],
    readBy: [senderId],
    createdAt: now,
    attachments: formattedAttachments,
  };

  store.messages.push(newMsg);
  return newMsg;
}

/**
 * Épingle ou désépingle un message
 */
export async function togglePinMessage(spaceId: string, messageId: string, userId: string): Promise<boolean> {
  const participant = await checkAccess(spaceId, userId);
  if (!participant || (participant.role !== "porteur" && participant.role !== "admin")) return false;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data: msg } = await supabase
        .from("crowdfunding_messages")
        .select("is_pinned")
        .eq("id", messageId)
        .eq("space_id", spaceId)
        .maybeSingle();

      if (msg) {
        await supabase
          .from("crowdfunding_messages")
          .update({ is_pinned: !msg.is_pinned })
          .eq("id", messageId);
        return true;
      }
    } catch {}
  }

  const store = getMemoryStore();
  const msg = store.messages.find((m) => m.id === messageId && m.spaceId === spaceId);
  if (!msg) return false;
  msg.isPinned = !msg.isPinned;
  return true;
}

/**
 * Participants d'un espace avec respect de la confidentialité des montants
 */
export async function getParticipants(spaceId: string, userId: string): Promise<CrowdfundingParticipant[]> {
  const currentParticipant = await checkAccess(spaceId, userId);
  if (!currentParticipant) return [];

  const supabase = getSupabaseAdmin();
  const isPorteurOrAdmin = currentParticipant.role === "porteur" || currentParticipant.role === "admin";

  if (supabase) {
    try {
      const { data: space } = await supabase
        .from("crowdfunding_spaces")
        .select("projet_id")
        .eq("id", spaceId)
        .maybeSingle();

      const { data: settingsRow } = space
        ? await supabase.from("crowdfunding_settings").select("*").eq("projet_id", space.projet_id).maybeSingle()
        : { data: null };

      const showAmounts = Boolean(settingsRow?.show_amounts_to_investors);

      const { data: participants } = await supabase
        .from("crowdfunding_participants")
        .select("*")
        .eq("space_id", spaceId)
        .eq("status", "actif");

      if (participants) {
        return participants.map((p) => {
          const canSee = isPorteurOrAdmin || p.user_id === userId || showAmounts;
          return {
            id: p.id,
            spaceId: p.space_id,
            userId: p.user_id,
            nom: p.nom,
            avatar: p.avatar,
            role: p.role,
            investmentId: p.investment_id,
            investmentMode: p.investment_mode,
            investedAmount: canSee ? Number(p.invested_amount || 0) : 0,
            percentage: canSee && p.percentage ? Number(p.percentage) : undefined,
            interestRate: canSee && p.interest_rate ? Number(p.interest_rate) : undefined,
            status: p.status,
            joinedAt: p.joined_at,
            revokedAt: p.revoked_at,
          };
        });
      }
    } catch {}
  }

  // Fallback in-memory
  const store = getMemoryStore();
  return store.participants.filter((p) => p.spaceId === spaceId && p.status === "actif");
}

/**
 * Met à jour les paramètres de confidentialité de la campagne
 */
export async function updateCampaignSettings(
  projetId: string,
  userId: string,
  newSettings: { showAmountsToInvestors?: boolean; allowInvestorCalls?: boolean }
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from("crowdfunding_settings").upsert({
        id: uuidv4(),
        projet_id: projetId,
        show_amounts_to_investors: Boolean(newSettings.showAmountsToInvestors),
        allow_investor_calls: newSettings.allowInvestorCalls !== false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "projet_id" });
      return true;
    } catch {}
  }

  const store = getMemoryStore();
  store.settings[projetId] = {
    projetId,
    showAmountsToInvestors: Boolean(newSettings.showAmountsToInvestors),
    allowInvestorCalls: newSettings.allowInvestorCalls !== false,
  };
  return true;
}

/**
 * Crée une session d'appel audio/vidéo Crowdfunding
 */
export async function createCallSession(params: {
  spaceId: string;
  initiatorId: string;
  initiatorName: string;
  callType: "audio" | "video";
  isGroup: boolean;
  participants: string[];
}): Promise<CrowdfundingCallSession | null> {
  const participant = await checkAccess(params.spaceId, params.initiatorId);
  if (!participant) return null;

  const callId = uuidv4();
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data: call } = await supabase
        .from("crowdfunding_calls")
        .insert({
          id: callId,
          space_id: params.spaceId,
          initiator_id: params.initiatorId,
          initiator_name: params.initiatorName,
          call_type: params.callType,
          is_group: Boolean(params.isGroup),
          status: "active",
          participants: params.participants,
          duration_seconds: 0,
          created_at: now,
        })
        .select()
        .single();

      if (call) {
        return {
          id: call.id,
          spaceId: call.space_id,
          initiatorId: call.initiator_id,
          initiatorName: call.initiator_name,
          callType: call.call_type,
          isGroup: call.is_group,
          status: call.status,
          participants: call.participants || [],
          durationSeconds: 0,
          createdAt: call.created_at,
        };
      }
    } catch {}
  }

  const call: CrowdfundingCallSession = {
    id: callId,
    spaceId: params.spaceId,
    initiatorId: params.initiatorId,
    initiatorName: params.initiatorName,
    callType: params.callType,
    isGroup: params.isGroup,
    status: "active",
    participants: params.participants,
    durationSeconds: 0,
    createdAt: now,
  };
  getMemoryStore().calls.push(call);
  return call;
}

/**
 * Termine un appel et poste un message système
 */
export async function endCallSession(callId: string, durationSeconds: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      const { data: call } = await supabase
        .from("crowdfunding_calls")
        .update({ status: "ended", duration_seconds: durationSeconds, ended_at: now })
        .eq("id", callId)
        .select()
        .single();

      if (call) {
        const mins = Math.floor(durationSeconds / 60);
        const secs = durationSeconds % 60;
        const timeStr = `${mins > 0 ? `${mins} min ` : ""}${secs} sec`;
        const callDesc = call.is_group
          ? `🎥 Réunion d'information investisseurs terminée — Durée : ${timeStr}`
          : `📞 Appel ${call.call_type === "video" ? "vidéo" : "audio"} terminé — Durée : ${timeStr}`;

        await sendMessage({
          spaceId: call.space_id,
          senderId: "system",
          senderRole: "system",
          senderName: "Système Envol Africa",
          content: callDesc,
        });
        return true;
      }
    } catch {}
  }

  return true;
}

/**
 * Signale un abus
 */
export async function reportAbuse(params: {
  spaceId: string;
  reporterId: string;
  targetType: "message" | "participant" | "space";
  targetId: string;
  reason: string;
}): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from("crowdfunding_reports").insert({
        id: uuidv4(),
        space_id: params.spaceId,
        reporter_id: params.reporterId,
        target_type: params.targetType,
        target_id: params.targetId,
        reason: params.reason,
        status: "en_attente",
        created_at: new Date().toISOString(),
      });
      return true;
    } catch {}
  }
  return true;
}

/**
 * Exclut un participant de l'espace (porteur uniquement)
 */
export async function kickParticipant(
  spaceId: string,
  porteurId: string,
  targetUserId: string,
  reason: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data: space } = await supabase
        .from("crowdfunding_spaces")
        .select("porteur_id")
        .eq("id", spaceId)
        .maybeSingle();

      if (!space || space.porteur_id !== porteurId) return false;

      await supabase
        .from("crowdfunding_participants")
        .update({ status: "revoque", revoked_at: new Date().toISOString() })
        .eq("space_id", spaceId)
        .eq("user_id", targetUserId);

      await sendMessage({
        spaceId,
        senderId: "system",
        senderRole: "system",
        senderName: "Modération",
        content: `Un participant a été exclu de la messagerie par le porteur (Motif : ${reason}).`,
      });
      return true;
    } catch {}
  }
  return true;
}
