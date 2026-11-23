import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { listAgentKeys, createAgentKey, revokeAgentKey } from "@/lib/agent-keys-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error, status } = await getCurrentUserForAdmin("gerant");
  if (error || !user) {
    return NextResponse.json({ error: error || "Non autorisé" }, { status: status || 403 });
  }

  try {
    const keys = await listAgentKeys();
    return NextResponse.json({ success: true, keys });
  } catch (err: any) {
    console.error("[admin/api-keys] Erreur liste:", err);
    return NextResponse.json({ error: "Impossible de charger les clés d'API" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("admin");
  if (error || !user) {
    return NextResponse.json({ error: error || "Rôle admin requis pour générer une clé API" }, { status: status || 403 });
  }

  try {
    const body = await req.json();
    const { name, scopes = ["all"] } = body;

    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Veuillez donner un nom clair à cette clé d'agent (ex: 'Claude Desktop Rédaction', 'Bot WAB n8n')." },
        { status: 400 }
      );
    }

    const createdBy = `${user.prenom} ${user.nom}`.trim() || user.email;
    const result = await createAgentKey({
      name: name.trim(),
      scopes: Array.isArray(scopes) ? scopes : ["all"],
      createdBy,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Nouvelle clé d'API agent générée avec succès ! Copiez-la maintenant car elle ne sera plus jamais affichée.",
        keyRecord: result.safeRecord,
        rawSecretKey: result.rawSecretKey,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[admin/api-keys] Erreur génération:", err);
    return NextResponse.json({ error: "Erreur lors de la génération de la clé API" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("admin");
  if (error || !user) {
    return NextResponse.json({ error: error || "Rôle admin requis pour révoquer une clé" }, { status: status || 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json({ error: "Identifiant de clé (id) requis." }, { status: 400 });
    }

    const revokedBy = `${user.prenom} ${user.nom}`.trim() || user.email;
    const ok = await revokeAgentKey(keyId, revokedBy);

    if (!ok) {
      return NextResponse.json({ error: "Clé introuvable ou déjà révoquée." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "La clé d'API a été révoquée immédiatement. Tous les accès associés sont désormais bloqués.",
    });
  } catch (err: any) {
    console.error("[admin/api-keys] Erreur révocation:", err);
    return NextResponse.json({ error: "Erreur lors de la révocation de la clé" }, { status: 500 });
  }
}
