import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin } from "./supabase-admin";
import { readCrowdDB } from "./crowdfunding-db";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const MESSAGES_FILE = path.join(DATA_DIR, "crowdfunding-messages.json");

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

function initDataStore(): MessagesDataStore {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    const empty: MessagesDataStore = {
      spaces: [],
      participants: [],
      messages: [],
      attachments: [],
      calls: [],
      settings: {},
      reports: [],
    };
    try {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(empty, null, 2), "utf-8");
    } catch {}
    return empty;
  }
  try {
    const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      spaces: [],
      participants: [],
      messages: [],
      attachments: [],
      calls: [],
      settings: {},
      reports: [],
    };
  }
}

function writeDataStore(data: MessagesDataStore) {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write crowdfunding-messages.json:", err);
  }
}

/**
 * Synchronise les espaces avec les projets et contributions existants.
 * Crée un espace pour chaque projet s'il n'existe pas encore.
 * Intègre le porteur et tous les investisseurs confirmés.
 */
export async function syncSpacesAndContributions(): Promise<MessagesDataStore> {
  const store = initDataStore();
  const crowdDB = readCrowdDB();

  for (const project of crowdDB.projets) {
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

    // Ajouter le porteur s'il n'est pas encore participant
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

    // Ajouter les investisseurs confirmés depuis crowdDB.contributions
    const projectContributions = crowdDB.contributions.filter(
      (c) => c.projetId === project.id
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
      } else if (existing.status === "revoque") {
        // Reste révoqué si expressément marqué
      } else {
        // Met à jour le montant si besoin
        existing.investedAmount = Math.max(existing.investedAmount, contrib.montant || 0);
      }
    }
  }

  writeDataStore(store);
  return store;
}

/**
 * Récupère les espaces accessibles pour un utilisateur donné.
 * RÈGLE D'ACTIVATION CONDITIONNELLE STRICTE :
 * L'utilisateur n'a accès qu'aux espaces où il est participant actif (porteur ou investisseur confirmé).
 */
export async function getSpacesForUser(userId: string, role?: string): Promise<CrowdfundingSpace[]> {
  const store = await syncSpacesAndContributions();
  const crowdDB = readCrowdDB();
  const projectMap = new Map(crowdDB.projets.map((p) => [p.id, p]));

  // Trouver tous les espaces où l'utilisateur est participant actif (ou admin)
  const activeParticipations = store.participants.filter(
    (p) => p.userId === userId && p.status === "actif"
  );
  const accessibleSpaceIds = new Set(activeParticipations.map((p) => p.spaceId));

  // Les administrateurs ont accès de supervision
  const isAdmin = role === "admin";

  const accessibleSpaces = store.spaces.filter((s) => isAdmin || accessibleSpaceIds.has(s.id));

  // Enrichir avec les données du projet et les derniers messages
  return accessibleSpaces.map((space) => {
    const proj = projectMap.get(space.projetId);
    const spaceMessages = store.messages.filter((m) => m.spaceId === space.id);
    const sorted = [...spaceMessages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastMsg = sorted[0];

    const unread = spaceMessages.filter(
      (m) => m.senderId !== userId && !m.readBy.includes(userId)
    ).length;

    const participantsCount = store.participants.filter(
      (p) => p.spaceId === space.id && p.status === "actif"
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
      investisseursCount: participantsCount,
      unreadCount: unread,
      lastMessage: lastMsg
        ? {
            content: lastMsg.content,
            senderName: lastMsg.senderName,
            createdAt: lastMsg.createdAt,
            isUpdate: lastMsg.isUpdate,
          }
        : undefined,
    };
  });
}

/**
 * Vérifie l'éligibilité d'un utilisateur à un espace de projet.
 * Renvoie le participant ou null si non autorisé.
 */
export async function checkAccess(spaceId: string, userId: string, isAdmin = false): Promise<CrowdfundingParticipant | null> {
  const store = await syncSpacesAndContributions();
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
 * Récupère un espace spécifique avec ses métadonnées complètes.
 */
export async function getSpaceDetails(spaceId: string, userId: string, isAdmin = false) {
  const participant = await checkAccess(spaceId, userId, isAdmin);
  if (!participant) return null;

  const store = initDataStore();
  const space = store.spaces.find((s) => s.id === spaceId);
  if (!space) return null;

  const crowdDB = readCrowdDB();
  const project = crowdDB.projets.find((p) => p.id === space.projetId);
  const settings = store.settings[space.projetId] || {
    projetId: space.projetId,
    showAmountsToInvestors: false,
    allowInvestorCalls: true,
  };

  return {
    space,
    project,
    participant,
    settings,
  };
}

/**
 * Récupère les messages d'un espace.
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

  const store = initDataStore();
  let msgs = store.messages.filter((m) => m.spaceId === spaceId);

  // Marquer comme lus par l'utilisateur
  let modified = false;
  for (const m of msgs) {
    if (!m.readBy.includes(userId)) {
      m.readBy.push(userId);
      modified = true;
    }
  }
  if (modified) writeDataStore(store);

  if (filter === "updates") {
    msgs = msgs.filter((m) => m.isUpdate);
  }

  if (search && search.trim()) {
    const q = search.toLowerCase();
    msgs = msgs.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        (m.updateTitle && m.updateTitle.toLowerCase().includes(q)) ||
        m.attachments.some((a) => a.name.toLowerCase().includes(q))
    );
  }

  return msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/**
 * Envoie un message dans un espace (texte, mise à jour, pièces jointes combinées).
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

  // Seul le porteur ou l'admin peut poster une mise à jour officielle de campagne
  const isActualUpdate = Boolean(isUpdate && (participant.role === "porteur" || participant.role === "admin"));

  const store = initDataStore();
  const messageId = uuidv4();
  const now = new Date().toISOString();

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
  store.attachments.push(...formattedAttachments);

  // Mettre à jour la date de l'espace
  const space = store.spaces.find((s) => s.id === spaceId);
  if (space) space.updatedAt = now;

  writeDataStore(store);

  return newMsg;
}

/**
 * Épingle ou désépingle un message (réservé au porteur du projet ou admin).
 */
export async function togglePinMessage(spaceId: string, messageId: string, userId: string): Promise<boolean> {
  const participant = await checkAccess(spaceId, userId);
  if (!participant || (participant.role !== "porteur" && participant.role !== "admin")) {
    return false;
  }

  const store = initDataStore();
  const msg = store.messages.find((m) => m.id === messageId && m.spaceId === spaceId);
  if (!msg) return false;

  msg.isPinned = !msg.isPinned;
  writeDataStore(store);
  return true;
}

/**
 * Récupère les participants d'un espace avec application de la confidentialité sur les montants.
 */
export async function getParticipants(spaceId: string, userId: string): Promise<CrowdfundingParticipant[]> {
  const currentParticipant = await checkAccess(spaceId, userId);
  if (!currentParticipant) return [];

  const store = initDataStore();
  const space = store.spaces.find((s) => s.id === spaceId);
  if (!space) return [];

  const settings = store.settings[space.projetId] || {
    projetId: space.projetId,
    showAmountsToInvestors: false,
    allowInvestorCalls: true,
  };

  const isPorteurOrAdmin = currentParticipant.role === "porteur" || currentParticipant.role === "admin";

  const participants = store.participants.filter(
    (p) => p.spaceId === spaceId && p.status === "actif"
  );

  // Masquer les montants pour les investisseurs si le porteur n'a pas autorisé l'affichage
  return participants.map((p) => {
    if (isPorteurOrAdmin || p.userId === userId || settings.showAmountsToInvestors) {
      return p;
    }
    return {
      ...p,
      investedAmount: 0,
      percentage: undefined,
    };
  });
}

/**
 * Met à jour les paramètres de confidentialité de la campagne (porteur uniquement).
 */
export async function updateCampaignSettings(
  projetId: string,
  userId: string,
  newSettings: { showAmountsToInvestors?: boolean; allowInvestorCalls?: boolean }
): Promise<boolean> {
  const crowdDB = readCrowdDB();
  const project = crowdDB.projets.find((p) => p.id === projetId);
  if (!project || project.porteurId !== userId) {
    return false;
  }

  const store = initDataStore();
  store.settings[projetId] = {
    projetId,
    showAmountsToInvestors: Boolean(newSettings.showAmountsToInvestors),
    allowInvestorCalls: newSettings.allowInvestorCalls !== false,
  };
  writeDataStore(store);
  return true;
}

/**
 * Crée une session d'appel audio/vidéo (1:1 ou de groupe).
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

  const store = initDataStore();
  const call: CrowdfundingCallSession = {
    id: uuidv4(),
    spaceId: params.spaceId,
    initiatorId: params.initiatorId,
    initiatorName: params.initiatorName,
    callType: params.callType,
    isGroup: params.isGroup,
    status: "active",
    participants: params.participants,
    durationSeconds: 0,
    createdAt: new Date().toISOString(),
  };

  store.calls.push(call);
  writeDataStore(store);
  return call;
}

/**
 * Termine un appel et poste un message système dans le fil.
 */
export async function endCallSession(callId: string, durationSeconds: number): Promise<boolean> {
  const store = initDataStore();
  const call = store.calls.find((c) => c.id === callId);
  if (!call) return false;

  call.status = "ended";
  call.durationSeconds = durationSeconds;
  call.endedAt = new Date().toISOString();

  // Insérer un message système dans le fil
  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  const timeStr = `${mins > 0 ? `${mins} min ` : ""}${secs} sec`;
  const callDesc = call.isGroup
    ? `🎥 Réunion d'information investisseurs terminée — Durée : ${timeStr} (${call.participants.length} participants)`
    : `📞 Appel ${call.callType === "video" ? "vidéo" : "audio"} terminé — Durée : ${timeStr}`;

  const sysMsg: CrowdfundingMessage = {
    id: uuidv4(),
    spaceId: call.spaceId,
    senderId: "system",
    senderRole: "system",
    senderName: "Système Envol Africa",
    content: callDesc,
    isUpdate: false,
    isPinned: false,
    mentions: [],
    readBy: [],
    createdAt: new Date().toISOString(),
    attachments: [],
  };
  store.messages.push(sysMsg);

  writeDataStore(store);
  return true;
}

/**
 * Signale un abus sur un message, un participant ou l'espace.
 */
export async function reportAbuse(params: {
  spaceId: string;
  reporterId: string;
  targetType: "message" | "participant" | "space";
  targetId: string;
  reason: string;
}): Promise<boolean> {
  const participant = await checkAccess(params.spaceId, params.reporterId);
  if (!participant) return false;

  const store = initDataStore();
  const report: CrowdfundingReport = {
    id: uuidv4(),
    spaceId: params.spaceId,
    reporterId: params.reporterId,
    targetType: params.targetType,
    targetId: params.targetId,
    reason: params.reason,
    status: "en_attente",
    createdAt: new Date().toISOString(),
  };

  store.reports.push(report);
  writeDataStore(store);
  return true;
}

/**
 * Exclut un participant de l'espace de messagerie (porteur uniquement, soumis à audit).
 */
export async function kickParticipant(
  spaceId: string,
  porteurId: string,
  targetUserId: string,
  reason: string
): Promise<boolean> {
  const store = initDataStore();
  const space = store.spaces.find((s) => s.id === spaceId);
  if (!space || space.porteurId !== porteurId) return false;

  const participant = store.participants.find(
    (p) => p.spaceId === spaceId && p.userId === targetUserId
  );
  if (!participant) return false;

  participant.status = "revoque";
  participant.revokedAt = new Date().toISOString();

  // Log système
  const sysMsg: CrowdfundingMessage = {
    id: uuidv4(),
    spaceId,
    senderId: "system",
    senderRole: "system",
    senderName: "Modération",
    content: `Un participant a été exclu de la messagerie par le porteur (Motif : ${reason}).`,
    isUpdate: false,
    isPinned: false,
    mentions: [],
    readBy: [],
    createdAt: new Date().toISOString(),
    attachments: [],
  };
  store.messages.push(sysMsg);

  writeDataStore(store);
  return true;
}
