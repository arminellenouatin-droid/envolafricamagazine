import { NextRequest, NextResponse } from "next/server";
import { authenticateAgentRequest } from "@/lib/agent-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB, writeDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await authenticateAgentRequest(req, "comments:moderate");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "unmoderated"; // "unmoderated" | "all"
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

  const client = getSupabaseAdmin();
  if (client) {
    let query = client
      .from("comments")
      .select("id, article_id, user_id, content, created_at, likes, is_moderated")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filter === "unmoderated") {
      query = query.eq("is_moderated", false);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[agent/comments] Erreur Supabase:", error);
      return NextResponse.json({ error: "Impossible de charger les commentaires" }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data?.length || 0, comments: data || [] });
  }

  const db = readDB();
  let comments = db.comments || [];
  if (filter === "unmoderated") {
    comments = comments.filter((c) => !c.isModerated);
  }
  return NextResponse.json({
    success: true,
    count: comments.slice(0, limit).length,
    comments: comments.slice(0, limit),
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateAgentRequest(req, "comments:moderate");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await req.json();
    const { commentId, action, reason } = body;

    if (!commentId || typeof commentId !== "string") {
      return NextResponse.json({ error: "commentId requis." }, { status: 400 });
    }
    if (!action || !["approve", "hide", "delete"].includes(action)) {
      return NextResponse.json({ error: "Action invalide. Choisissez entre 'approve', 'hide' ou 'delete'." }, { status: 400 });
    }

    const client = getSupabaseAdmin();
    if (client) {
      if (action === "delete") {
        const { error } = await client.from("comments").delete().eq("id", commentId);
        if (error) throw error;
        return NextResponse.json({ success: true, message: `Commentaire ${commentId} supprimé avec succès.` });
      }

      const isModerated = action === "approve";
      const { data, error } = await client
        .from("comments")
        .update({ is_moderated: isModerated })
        .eq("id", commentId)
        .select("*")
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });

      return NextResponse.json({
        success: true,
        message: action === "approve" ? "Commentaire approuvé et visible en ligne." : "Commentaire masqué.",
        comment: data,
        audit: { action, agent: auth.agentName, reason: reason || "Modération par agent IA", timestamp: new Date().toISOString() },
      });
    }

    // Fallback DB locale
    const db = readDB();
    const commentIndex = db.comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });

    if (action === "delete") {
      db.comments.splice(commentIndex, 1);
    } else {
      db.comments[commentIndex].isModerated = action === "approve";
    }
    writeDB(db);

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "Commentaire approuvé." : (action === "hide" ? "Commentaire masqué." : "Commentaire supprimé."),
    });
  } catch (err: any) {
    console.error("[agent/comments] Erreur modération:", err);
    return NextResponse.json({ error: "Erreur lors de la modération du commentaire" }, { status: 500 });
  }
}
