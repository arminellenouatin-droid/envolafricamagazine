import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type {
  KYCProfile,
  SubmitKYCInput,
  AMLAuditLog,
  AMLMovementType,
} from "./types";

const LOCAL_KYC_FILE = path.join(process.cwd(), "src", "data", "kyc-aml.json");

interface LocalKYCStore {
  profiles: KYCProfile[];
  amlLogs: AMLAuditLog[];
}

function ensureLocalStore(): LocalKYCStore {
  try {
    if (fs.existsSync(LOCAL_KYC_FILE)) {
      const raw = fs.readFileSync(LOCAL_KYC_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
        amlLogs: Array.isArray(parsed.amlLogs) ? parsed.amlLogs : [],
      };
    }
  } catch (err) {
    console.warn("[KYC/AML] Lecture fallback fichier impossible:", err);
  }
  return { profiles: [], amlLogs: [] };
}

function saveLocalStore(store: LocalKYCStore) {
  try {
    const dir = path.dirname(LOCAL_KYC_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_KYC_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("[KYC/AML] Écriture fallback fichier impossible:", err);
  }
}

/**
 * Récupère le profil KYC d'un utilisateur
 */
export async function getKYCProfile(userId: string): Promise<KYCProfile | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("kyc_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        userId: data.user_id,
        userEmail: data.user_email || "",
        userFullName: data.user_full_name || "",
        profileType: data.profile_type || "particulier",
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.date_naissance,
        nationalite: data.nationalite,
        paysResidence: data.pays_residence || "BJ",
        adresse: data.adresse || "",
        telephone: data.telephone || "",
        pieceIdentiteType: data.piece_identite_type || "cni",
        pieceIdentiteNumero: data.piece_identite_numero || "",
        pieceIdentiteUrl: data.piece_identite_url || "",
        selfieUrl: data.selfie_url || "",
        nomEntreprise: data.nom_entreprise,
        numeroRccm: data.numero_rccm,
        numeroIfu: data.numero_ifu,
        adresseSiege: data.adresse_siege,
        representantLegal: data.representant_legal,
        piecesEntrepriseUrls: data.pieces_entreprise_urls || [],
        statut: data.statut || "non_soumis",
        motifRejet: data.motif_rejet,
        dateSoumission: data.date_soumission || data.created_at,
        dateVerification: data.date_verification,
        verifiePar: data.verifie_par,
        ipSoumission: data.ip_soumission,
        userAgentSoumission: data.user_agent_soumission,
        scopes: data.scopes || ["wallet", "affiliate", "awards", "wab_creator", "marketplace_vendor"],
      };
    }
  }

  // Fallback local
  const store = ensureLocalStore();
  const found = store.profiles.find((p) => p.userId === userId);
  return found || null;
}

/**
 * Soumission ou mise à jour du dossier KYC par un utilisateur
 */
export async function submitKYC(
  userId: string,
  userEmail: string,
  userFullName: string,
  input: SubmitKYCInput,
  ip: string,
  userAgent: string
): Promise<KYCProfile> {
  // Validations obligatoires
  if (!input.nom?.trim() || !input.prenom?.trim()) {
    throw new Error("Le nom et le prénom sont obligatoires.");
  }
  if (!input.pieceIdentiteNumero?.trim()) {
    throw new Error("Le numéro de la pièce d'identité est obligatoire.");
  }
  if (!input.pieceIdentiteUrl?.trim()) {
    throw new Error("La copie de votre pièce d'identité est obligatoire.");
  }
  if (!input.selfieUrl?.trim()) {
    throw new Error("Votre selfie avec votre pièce d'identité est obligatoire pour valider votre identité.");
  }

  // Si compte Entreprise (Marketplace ou autre)
  if (input.profileType === "entreprise") {
    if (!input.nomEntreprise?.trim()) {
      throw new Error("La dénomination de l'entreprise est obligatoire pour un compte société.");
    }
    if (!input.numeroRccm?.trim() && !input.numeroIfu?.trim()) {
      throw new Error("Le numéro RCCM ou IFU est obligatoire pour une personne morale.");
    }
    if (!input.piecesEntrepriseUrls || input.piecesEntrepriseUrls.length === 0) {
      throw new Error("Veuillez joindre les statuts ou le registre de commerce (RCCM/IFU) de votre société.");
    }
  }

  const now = new Date().toISOString();
  const profileId = uuidv4();

  const profile: KYCProfile = {
    id: profileId,
    userId,
    userEmail,
    userFullName,
    profileType: input.profileType,
    nom: input.nom.trim(),
    prenom: input.prenom.trim(),
    dateNaissance: input.dateNaissance,
    nationalite: input.nationalite,
    paysResidence: input.paysResidence || "BJ",
    adresse: input.adresse?.trim() || "",
    telephone: input.telephone?.trim() || "",
    pieceIdentiteType: input.pieceIdentiteType || "cni",
    pieceIdentiteNumero: input.pieceIdentiteNumero.trim(),
    pieceIdentiteUrl: input.pieceIdentiteUrl.trim(),
    selfieUrl: input.selfieUrl.trim(),
    nomEntreprise: input.nomEntreprise?.trim(),
    numeroRccm: input.numeroRccm?.trim(),
    numeroIfu: input.numeroIfu?.trim(),
    adresseSiege: input.adresseSiege?.trim(),
    representantLegal: input.representantLegal?.trim(),
    piecesEntrepriseUrls: input.piecesEntrepriseUrls || [],
    statut: "en_attente",
    dateSoumission: now,
    ipSoumission: ip,
    userAgentSoumission: userAgent,
    scopes: input.scopes || ["wallet", "affiliate", "awards", "wab_creator", "marketplace_vendor"],
  };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("kyc_profiles").upsert(
      {
        user_id: userId,
        user_email: userEmail,
        user_full_name: userFullName,
        profile_type: profile.profileType,
        nom: profile.nom,
        prenom: profile.prenom,
        date_naissance: profile.dateNaissance,
        nationalite: profile.nationalite,
        pays_residence: profile.paysResidence,
        adresse: profile.adresse,
        telephone: profile.telephone,
        piece_identite_type: profile.pieceIdentiteType,
        piece_identite_numero: profile.pieceIdentiteNumero,
        piece_identite_url: profile.pieceIdentiteUrl,
        selfie_url: profile.selfieUrl,
        nom_entreprise: profile.nomEntreprise,
        numero_rccm: profile.numeroRccm,
        numero_ifu: profile.numeroIfu,
        adresse_siege: profile.adresseSiege,
        representant_legal: profile.representantLegal,
        pieces_entreprise_urls: profile.piecesEntrepriseUrls,
        statut: "en_attente",
        motif_rejet: null,
        date_soumission: now,
        ip_soumission: ip,
        user_agent_soumission: userAgent,
        scopes: profile.scopes,
        updated_at: now,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.warn("[KYC] Upsert Supabase a échoué, écriture locale de secours:", error.message);
    }
  }

  // Toujours synchroniser le store local
  const store = ensureLocalStore();
  const existingIdx = store.profiles.findIndex((p) => p.userId === userId);
  if (existingIdx >= 0) {
    store.profiles[existingIdx] = profile;
  } else {
    store.profiles.push(profile);
  }
  saveLocalStore(store);

  return profile;
}

/**
 * Validation ou rejet d'un dossier KYC par l'administrateur
 */
export async function adminUpdateKYC(
  userId: string,
  statut: "approuve" | "rejete",
  adminId: string,
  motifRejet?: string
): Promise<KYCProfile> {
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { error } = await supabase
      .from("kyc_profiles")
      .update({
        statut,
        motif_rejet: statut === "rejete" ? motifRejet || "Documents non conformes" : null,
        date_verification: now,
        verifie_par: adminId,
        updated_at: now,
      })
      .eq("user_id", userId);

    if (error) {
      console.warn("[KYC Admin] Update Supabase:", error.message);
    }
  }

  const store = ensureLocalStore();
  const target = store.profiles.find((p) => p.userId === userId);
  if (target) {
    target.statut = statut;
    target.motifRejet = statut === "rejete" ? motifRejet : undefined;
    target.dateVerification = now;
    target.verifiePar = adminId;
    saveLocalStore(store);
    return target;
  }

  throw new Error("Dossier KYC introuvable.");
}

/**
 * Liste des dossiers KYC pour l'administration
 */
export async function listKYCProfiles(filter?: {
  statut?: string;
  type?: string;
}): Promise<KYCProfile[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    let query = supabase.from("kyc_profiles").select("*").order("date_soumission", { ascending: false });
    if (filter?.statut && filter.statut !== "all") query = query.eq("statut", filter.statut);
    if (filter?.type && filter.type !== "all") query = query.eq("profile_type", filter.type);

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        userEmail: d.user_email || "",
        userFullName: d.user_full_name || "",
        profileType: d.profile_type || "particulier",
        nom: d.nom,
        prenom: d.prenom,
        dateNaissance: d.date_naissance,
        nationalite: d.nationalite,
        paysResidence: d.pays_residence || "BJ",
        adresse: d.adresse || "",
        telephone: d.telephone || "",
        pieceIdentiteType: d.piece_identite_type || "cni",
        pieceIdentiteNumero: d.piece_identite_numero || "",
        pieceIdentiteUrl: d.piece_identite_url || "",
        selfieUrl: d.selfie_url || "",
        nomEntreprise: d.nom_entreprise,
        numeroRccm: d.numero_rccm,
        numeroIfu: d.numero_ifu,
        adresseSiege: d.adresse_siege,
        representantLegal: d.representant_legal,
        piecesEntrepriseUrls: d.pieces_entreprise_urls || [],
        statut: d.statut || "non_soumis",
        motifRejet: d.motif_rejet,
        dateSoumission: d.date_soumission || d.created_at,
        dateVerification: d.date_verification,
        verifiePar: d.verifie_par,
        ipSoumission: d.ip_soumission,
        userAgentSoumission: d.user_agent_soumission,
        scopes: d.scopes || [],
      }));
    }
  }

  const store = ensureLocalStore();
  let list = [...store.profiles];
  if (filter?.statut && filter.statut !== "all") list = list.filter((p) => p.statut === filter.statut);
  if (filter?.type && filter.type !== "all") list = list.filter((p) => p.profileType === filter.type);
  return list;
}

/**
 * CONTRÔLE KYC & AML STRICT AVANT TOUT RETRAIT OU REMBOURSEMENT
 * Lève une exception claire et explicite si l'utilisateur n'est pas en règle.
 */
export async function assertKYCVerifiedForWithdrawal(
  userId: string,
  context: {
    movementType: AMLMovementType;
    amount: number;
    isBusiness?: boolean;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<KYCProfile> {
  const profile = await getKYCProfile(userId);

  if (!profile || profile.statut === "non_soumis") {
    // Journaliser le refus AML
    await logAMLMovement({
      userId,
      type: context.movementType,
      montant: context.amount,
      devise: "XOF",
      ipAddress: context.ipAddress || "inconnue",
      userAgent: context.userAgent,
      kycVerified: false,
      statut: "bloque_kyc",
      motif: "Dossier KYC non soumis. Pièce d'identité et selfie obligatoires.",
    });

    throw new Error(
      "Conformité KYC/AML obligatoire : Veuillez d'abord compléter votre dossier d'identification (pièce d'identité et selfie) dans votre profil avant de pouvoir demander un retrait ou remboursement."
    );
  }

  if (profile.statut === "en_attente") {
    await logAMLMovement({
      userId,
      type: context.movementType,
      montant: context.amount,
      devise: "XOF",
      ipAddress: context.ipAddress || "inconnue",
      userAgent: context.userAgent,
      kycVerified: false,
      statut: "bloque_kyc",
      motif: "Dossier KYC en cours d'examen par les services de conformité.",
    });

    throw new Error(
      "Votre dossier KYC est en cours de validation par notre service de conformité. Vos retraits seront activés dès la vérification de vos pièces sous 24h à 48h."
    );
  }

  if (profile.statut === "rejete") {
    await logAMLMovement({
      userId,
      type: context.movementType,
      montant: context.amount,
      devise: "XOF",
      ipAddress: context.ipAddress || "inconnue",
      userAgent: context.userAgent,
      kycVerified: false,
      statut: "bloque_kyc",
      motif: `Dossier KYC rejeté : ${profile.motifRejet || "Documents non recevables"}`,
    });

    throw new Error(
      `Votre dossier KYC a été rejeté (${profile.motifRejet || "documents non conformes"}). Veuillez actualiser vos pièces d'identité valides dans votre profil pour réactiver vos opérations de retrait.`
    );
  }

  // Vérification spéciale Entreprise (Marketplace vendeurs sociétés)
  if (context.isBusiness && profile.profileType === "entreprise") {
    if (!profile.numeroRccm && !profile.numeroIfu) {
      throw new Error(
        "Conformité Entreprise KYC : Le numéro RCCM ou IFU ainsi que les statuts de la société sont requis pour débloquer les virements professionnels."
      );
    }
  }

  return profile;
}

/**
 * Journalisation légale AML (Anti-Money Laundering) avec traçabilité IP
 */
export async function logAMLMovement(entry: {
  userId: string;
  userEmail?: string;
  userName?: string;
  type: AMLMovementType;
  montant: number;
  devise: string;
  ipAddress: string;
  userAgent?: string;
  kycVerified: boolean;
  statut: "succes" | "echec" | "bloque_kyc" | "en_attente";
  motif?: string;
  referenceExterne?: string;
  details?: Record<string, unknown>;
}): Promise<AMLAuditLog> {
  const item: AMLAuditLog = {
    id: uuidv4(),
    ...entry,
    timestamp: new Date().toISOString(),
  };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("aml_audit_logs").insert({
      id: item.id,
      user_id: item.userId,
      user_email: item.userEmail,
      user_name: item.userName,
      movement_type: item.type,
      montant: item.montant,
      devise: item.devise,
      ip_address: item.ipAddress,
      user_agent: item.userAgent,
      kyc_verified: item.kycVerified,
      statut: item.statut,
      motif: item.motif,
      reference_externe: item.referenceExterne,
      details: item.details,
      created_at: item.timestamp,
    });

    if (error) {
      console.warn("[AML Audit] Insert Supabase:", error.message);
    }
  }

  const store = ensureLocalStore();
  store.amlLogs.unshift(item);
  // Garder les 1000 derniers logs localement
  if (store.amlLogs.length > 1000) store.amlLogs = store.amlLogs.slice(0, 1000);
  saveLocalStore(store);

  return item;
}

/**
 * Récupère les logs AML pour l'administration et les audits
 */
export async function listAMLLogs(limit: number = 50): Promise<AMLAuditLog[]> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase
      .from("aml_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        userEmail: d.user_email,
        userName: d.user_name,
        type: d.movement_type,
        montant: Number(d.montant || 0),
        devise: d.devise || "XOF",
        ipAddress: d.ip_address || "inconnue",
        userAgent: d.user_agent,
        kycVerified: Boolean(d.kyc_verified),
        statut: d.statut,
        motif: d.motif,
        referenceExterne: d.reference_externe,
        details: d.details,
        timestamp: d.created_at,
      }));
    }
  }

  const store = ensureLocalStore();
  return store.amlLogs.slice(0, limit);
}
