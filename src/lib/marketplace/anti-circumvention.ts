import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface CircumventionCheckResult {
  allowed: boolean;
  reason?: string;
  matchedCategory?: "phone" | "email" | "social" | "payment" | "phrase";
  matchedPattern?: string;
}

// 1. Détection des numéros de téléphone (formats locaux et internationaux d'Afrique et globaux, y compris espacés)
const PHONE_PATTERNS = [
  // Format international avec + ou 00
  /(?:\+|00)\s*\d{1,4}[-.\s]*\(?\d{1,4}\)?[-.\s]*\d{1,4}[-.\s]*\d{2,4}[-.\s]*\d{2,4}/i,
  // Numéros à 8, 9 ou 10 chiffres (standard Bénin, CI, Sénégal, Cameroun, France, etc.) même espacés ou séparés par des points
  /\b(?:\d[-.\s]*){8,12}\b/,
  // Numéro épelé ou séparé
  /(?:z[eé]ro|un|deux|trois|quatre|cinq|six|sept|huit|neuf)\s+(?:z[eé]ro|un|deux|trois|quatre|cinq|six|sept|huit|neuf)/i,
];

// 2. Détection des adresses emails (y compris obfusquées)
const EMAIL_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i,
  /\b[A-Za-z0-9._%+-]+\s*(\[|\()?\s*(at|arobase|@)\s*(\]|\))?\s*[A-Za-z0-9.-]+\s*(\[|\()?\s*(dot|point|\.)\s*(\]|\))?\s*[A-Za-z]{2,}\b/i,
];

// 3. Réseaux sociaux et messageries externes
const SOCIAL_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?(?:wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\/\S+/i,
  /\b(?:whats?app|watsapp|wtsp|whapp|wapp)\b/i,
  /(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/\S+/i,
  /\b(?:t[ée]l[ée]gram|signal|viber|wechat|imo)\b/i,
  /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|facebook\.com|fb\.me|m\.me|twitter\.com|x\.com|tiktok\.com|linkedin\.com)\/\S+/i,
  /\b(?:insta(?:gram)?|facebook|fb|messenger|tiktok|snap(?:chat)?)\s*[:=]\s*@?[\w.-]+/i,
];

// 4. Moyens de paiement externes & liens non autorisés
const PAYMENT_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?(?:paypal\.me|pay\.wave\.com)\/\S+/i,
  /\b(?:paypal|crypto|bitcoin|usdt|binance|western\s*union|money\s*gram|ria\s*transfert?)\b/i,
  // Liens HTTP externes génériques (non envolafrica)
  /(?:https?:\/\/)(?!([a-zA-Z0-9-]+\.)*envolafrica\.(?:site|com|vercel\.app))\S+/i,
  /\bwww\.(?!envolafrica\.)\S+/i,
];

// 5. Formules explicites de contournement et de sortie de plateforme
const PHRASE_PATTERNS = [
  /\b(?:en\s+dehors|hors\s+plateforme|hors\s+site|en\s+priv[eé]|en\s+pv|en\s+direct)\b/i,
  /\b(?:payer?\s+(?:en\s+direct|directement|par\s+dehors|hors\s+site))\b/i,
  /\b(?:payons\s+(?:en\s+dehors|directement|en\s+direct))\b/i,
  /\b(?:contacte[rz]?-moi\s+(?:directement|sur|par))\b/i,
  /\b(?:[eé]cris-moi\s+(?:sur|par|au))\b/i,
  /\b(?:mon\s+(?:num[eé]ro|tel|t[eé]l[eé]phone|cellulaire|whatsapp|mail|contact))\b/i,
  /\b(?:appelle[rz]?-moi|appel\s+direct|envoie\s+(?:un\s+message|ton\s+num[eé]ro))\b/i,
];

/**
 * Inspecte un message côté serveur pour détecter toute tentative de contournement.
 * Retourne allowed: false dès qu'un motif interdit est détecté.
 */
export function inspectMarketplaceMessage(text: string): CircumventionCheckResult {
  if (!text || typeof text !== "string") {
    return { allowed: true };
  }

  const clean = text.trim();

  // 1. Vérification emails
  for (const pattern of EMAIL_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        allowed: false,
        reason: "La transmission d'adresses e-mail est strictement interdite dans la messagerie Marketplace pour votre sécurité financière.",
        matchedCategory: "email",
        matchedPattern: pattern.source,
      };
    }
  }

  // 2. Vérification réseaux sociaux / messageries externes
  for (const pattern of SOCIAL_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        allowed: false,
        reason: "Les liens et identifiants de messageries externes (WhatsApp, Telegram, etc.) sont strictement interdits.",
        matchedCategory: "social",
        matchedPattern: pattern.source,
      };
    }
  }

  // 3. Vérification liens externes & paiements non sécurisés
  for (const pattern of PAYMENT_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        allowed: false,
        reason: "Les liens externes et moyens de paiement hors plateforme sont interdits. Tous les règlements doivent s'effectuer via le Marketplace sécurisé.",
        matchedCategory: "payment",
        matchedPattern: pattern.source,
      };
    }
  }

  // 4. Vérification numéros de téléphone
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        allowed: false,
        reason: "La communication de numéros de téléphone est strictement bloquée afin de protéger vos garanties de livraison et de séquestre.",
        matchedCategory: "phone",
        matchedPattern: pattern.source,
      };
    }
  }

  // 5. Vérification formules de contournement
  for (const pattern of PHRASE_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        allowed: false,
        reason: "Les propositions de contournement de la plateforme ou de transaction directe sont interdites par les conditions d'utilisation.",
        matchedCategory: "phrase",
        matchedPattern: pattern.source,
      };
    }
  }

  return { allowed: true };
}

/**
 * Enregistre une tentative de contournement et déclenche une alerte si répétée.
 */
export async function recordCircumventionAttempt(
  userId: string,
  conversationId: string | undefined,
  matchedCategory: string,
  offendingText: string
): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return 1;

  try {
    const { data } = await supabase
      .from("marketplace_bypass_alerts")
      .insert({
        user_id: userId,
        conversation_id: conversationId || null,
        matched_pattern: matchedCategory,
        offending_text: offendingText.slice(0, 500),
      })
      .select("id");

    const { count } = await supabase
      .from("marketplace_bypass_alerts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    return count || 1;
  } catch {
    return 1;
  }
}
