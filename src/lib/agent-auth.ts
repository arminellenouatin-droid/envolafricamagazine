import { NextRequest } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { verifyAgentToken } from "@/lib/agent-keys-service";

export type AgentScope =
  | "articles:read"
  | "articles:write"
  | "magazines:read"
  | "magazines:write"
  | "social:read"
  | "analytics:read"
  | "media_kit:read"
  | "media_kit:write"
  | "wab:publish"
  | "comments:moderate";

export interface AgentAuthResult {
  authorized: boolean;
  agentId?: string;
  agentName?: string;
  scopes?: string[];
  error?: string;
  status?: number;
}

/**
 * Valide l'authentification d'un agent IA pour les routes /api/agent/*
 */
export async function authenticateAgentRequest(
  req: NextRequest,
  _requiredScope?: AgentScope
): Promise<AgentAuthResult> {
  // 1. Extraction du token depuis l'en-tête x-agent-api-key ou Authorization: Bearer
  const headerKey = req.headers.get("x-agent-api-key")?.trim();
  const authHeader = req.headers.get("authorization")?.trim();
  const bearerKey = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;
  const providedKey = headerKey || bearerKey;

  // 2. Vérification par clé API d'agent (Statique ou Clé dynamique générée par l'admin)
  if (providedKey) {
    const verification = await verifyAgentToken(providedKey);
    if (verification.valid && verification.keyRecord) {
      return {
        authorized: true,
        agentId: verification.keyRecord.id,
        agentName: verification.keyRecord.name,
        scopes: verification.keyRecord.scopes,
      };
    }

    // Fallback de dev sans clé configurée
    if (process.env.NODE_ENV !== "production" && providedKey === "eam-dev-agent-key-secret") {
      return {
        authorized: true,
        agentId: "dev-test-agent",
        agentName: "Dev Agent (Test Key)",
        scopes: ["all"],
      };
    }

    return {
      authorized: false,
      error: "Clé d'API agent invalide ou révoquée.",
      status: 401,
    };
  }

  // 3. Fallback utilisateur administrateur connecté dans la session navigateur
  const sessionUser = await getCurrentUserFromCookie();
  if (sessionUser && hasRole(sessionUser, "redacteur")) {
    return {
      authorized: true,
      agentId: sessionUser.id,
      agentName: `${sessionUser.prenom} ${sessionUser.nom} (Session Admin)`,
      scopes: ["all"],
    };
  }

  return {
    authorized: false,
    error: "Authentification agent requise. Transmettez votre clé via l'en-tête 'x-agent-api-key' ou 'Authorization: Bearer <clé>'.",
    status: 401,
  };
}
