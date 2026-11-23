import fs from "fs";
import path from "path";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/security-crypto";

export interface AgentKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  createdAt: string;
  createdBy: string;
  lastUsedAt?: string | null;
  isRevoked: boolean;
  revokedAt?: string | null;
  revokedBy?: string | null;
}

// Cache en mémoire pour garantir un fonctionnement sans plantage sur Vercel (read-only filesystem)
let memoryKeysCache: AgentKeyRecord[] = [];

function getLocalKeysFilePath(): string {
  // Sur Vercel ou conteneur serverless, seul /tmp est inscriptible
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === "production") {
    return path.join("/tmp", "agent_keys.json");
  }
  return path.join(process.cwd(), "src", "data", "agent_keys.json");
}

function readLocalKeys(): AgentKeyRecord[] {
  try {
    const filePath = getLocalKeysFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.keys)) {
        memoryKeysCache = parsed.keys;
        return parsed.keys;
      }
    }
  } catch (err) {
    console.warn("[agent-keys] Lecture locale indisponible, utilisation du cache mémoire:", err);
  }
  return memoryKeysCache;
}

function writeLocalKeys(keys: AgentKeyRecord[]): void {
  memoryKeysCache = keys;
  try {
    const filePath = getLocalKeysFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify({ keys }, null, 2), "utf-8");
  } catch (err) {
    console.warn("[agent-keys] Avertissement écriture disque (lecture seule / sandbox), clé préservée en mémoire:", err);
  }
}

/**
 * Liste toutes les clés API existantes (avec métadonnées sécurisées, sans exposer le secret)
 */
export async function listAgentKeys(): Promise<Omit<AgentKeyRecord, "keyHash">[]> {
  const client = getSupabaseAdmin();
  if (client) {
    try {
      const { data, error } = await client
        .from("agent_api_keys")
        .select("id, name, key_prefix, scopes, created_at, created_by, last_used_at, is_revoked, revoked_at, revoked_by")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((row: any) => ({
          id: row.id,
          name: row.name,
          keyPrefix: row.key_prefix,
          scopes: row.scopes || [],
          createdAt: row.created_at,
          createdBy: row.created_by,
          lastUsedAt: row.last_used_at,
          isRevoked: Boolean(row.is_revoked),
          revokedAt: row.revoked_at,
          revokedBy: row.revoked_by,
        }));
      }
    } catch (err) {
      console.warn("[agent-keys] Supabase listAgentKeys warning:", err);
    }
  }

  // Fallback stockage local / mémoire
  const localKeys = readLocalKeys();
  return localKeys.map(({ keyHash, ...safe }) => safe);
}

/**
 * Crée une nouvelle clé d'API pour un agent IA
 */
export async function createAgentKey(input: {
  name: string;
  scopes?: string[];
  createdBy: string;
}): Promise<{
  safeRecord: Omit<AgentKeyRecord, "keyHash">;
  rawSecretKey: string;
  supabaseWarning?: string;
}> {
  const rawSecret = `eam_live_${createOpaqueToken(24)}`;
  const keyPrefix = `${rawSecret.slice(0, 14)}...${rawSecret.slice(-4)}`;
  const keyHash = hashOpaqueToken(rawSecret);
  const now = new Date().toISOString();
  const id = uuidv4();

  const newKey: AgentKeyRecord = {
    id,
    name: input.name.trim(),
    keyPrefix,
    keyHash,
    scopes: input.scopes && input.scopes.length > 0 ? input.scopes : ["all"],
    createdAt: now,
    createdBy: input.createdBy,
    lastUsedAt: null,
    isRevoked: false,
  };

  let supabaseWarning: string | undefined = undefined;
  const client = getSupabaseAdmin();

  if (client) {
    try {
      const { error } = await client.from("agent_api_keys").insert({
        id: newKey.id,
        name: newKey.name,
        key_prefix: newKey.keyPrefix,
        key_hash: newKey.keyHash,
        scopes: newKey.scopes,
        created_at: newKey.createdAt,
        created_by: newKey.createdBy,
        last_used_at: null,
        is_revoked: false,
      });

      if (error) {
        console.warn("[agent-keys] Supabase table inexistante ou erreur:", error.message);
        supabaseWarning = `Table Supabase non migrée (${error.message}). La clé est active en mémoire mais pour une persistance permanente, exécutez la migration 'supabase/agent_api_keys.sql' dans votre console Supabase.`;
      }
    } catch (dbErr: any) {
      console.warn("[agent-keys] Supabase exception:", dbErr?.message);
      supabaseWarning = `Avertissement Supabase: ${dbErr?.message || "Connexion indisponible"}.`;
    }
  } else {
    supabaseWarning = "Supabase Admin non configuré : la clé est enregistrée localement/en mémoire.";
  }

  // Toujours enregistrer en fallback local/mémoire pour garantir que la clé fonctionne immédiatement
  const keys = readLocalKeys();
  keys.unshift(newKey);
  writeLocalKeys(keys);

  const { keyHash: _hash, ...safeRecord } = newKey;
  return {
    safeRecord,
    rawSecretKey: rawSecret,
    supabaseWarning,
  };
}

/**
 * Révoque une clé d'API agent
 */
export async function revokeAgentKey(
  id: string,
  revokedBy: string
): Promise<boolean> {
  const now = new Date().toISOString();
  const client = getSupabaseAdmin();
  let updatedInSupabase = false;

  if (client) {
    try {
      const { error } = await client
        .from("agent_api_keys")
        .update({
          is_revoked: true,
          revoked_at: now,
          revoked_by: revokedBy,
        })
        .eq("id", id);

      if (!error) updatedInSupabase = true;
    } catch (err) {
      console.warn("[agent-keys] Erreur révocation Supabase:", err);
    }
  }

  // Mettre à jour en local
  const keys = readLocalKeys();
  const target = keys.find((k) => k.id === id);
  if (target) {
    target.isRevoked = true;
    target.revokedAt = now;
    target.revokedBy = revokedBy;
    writeLocalKeys(keys);
    return true;
  }

  return updatedInSupabase;
}

/**
 * Valide un jeton secret transmis par un agent IA
 */
export async function verifyAgentToken(
  providedToken: string
): Promise<{ valid: boolean; keyRecord?: Omit<AgentKeyRecord, "keyHash"> }> {
  if (!providedToken || typeof providedToken !== "string") return { valid: false };

  // 1. Vérification clé statique d'environnement
  const envKey = process.env.EAM_AGENT_API_KEY?.trim();
  if (envKey) {
    const bufA = Buffer.from(providedToken, "utf-8");
    const bufB = Buffer.from(envKey, "utf-8");
    if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
      return {
        valid: true,
        keyRecord: {
          id: "env-configured-master-key",
          name: "Master Agent Key (Vercel Environment)",
          keyPrefix: `${envKey.slice(0, 8)}...`,
          scopes: ["all"],
          createdAt: new Date().toISOString(),
          createdBy: "System Admin",
          isRevoked: false,
        },
      };
    }
  }

  // 2. Vérification par hash SHA-256 dans la base de données
  const tokenHash = hashOpaqueToken(providedToken);
  const client = getSupabaseAdmin();

  if (client) {
    try {
      const { data } = await client
        .from("agent_api_keys")
        .select("id, name, key_prefix, scopes, created_at, created_by, is_revoked")
        .eq("key_hash", tokenHash)
        .eq("is_revoked", false)
        .maybeSingle();

      if (data) {
        // Mettre à jour last_used_at en tâche asynchrone non-bloquante
        void client
          .from("agent_api_keys")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", data.id);

        return {
          valid: true,
          keyRecord: {
            id: data.id,
            name: data.name,
            keyPrefix: data.key_prefix,
            scopes: data.scopes || ["all"],
            createdAt: data.created_at,
            createdBy: data.created_by,
            isRevoked: false,
          },
        };
      }
    } catch (err) {
      console.warn("[agent-keys] Erreur vérification Supabase:", err);
    }
  }

  // 3. Fallback vérification locale / mémoire
  const localKeys = readLocalKeys();
  const matched = localKeys.find((k) => k.keyHash === tokenHash && !k.isRevoked);
  if (matched) {
    matched.lastUsedAt = new Date().toISOString();
    writeLocalKeys(localKeys);
    const { keyHash: _h, ...safe } = matched;
    return { valid: true, keyRecord: safe };
  }

  return { valid: false };
}
