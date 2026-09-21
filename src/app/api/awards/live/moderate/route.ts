import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  if (!["admin", "host", "moderator"].includes(user.role)) {
    return NextResponse.json({ error: "Accès modération réservé au personnel autorisé" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const action = String(body.action || "");
  const sessionId = String(body.session_id || "");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id requis" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Base Awards temporairement indisponible" }, { status: 503 });
  }

  // 1. Suppression / Masquage d'un commentaire
  if (action === "delete_comment" || action === "hide_comment") {
    const commentId = String(body.comment_id || "");
    if (!commentId) return NextResponse.json({ error: "comment_id requis" }, { status: 400 });

    const isDelete = action === "delete_comment";
    const { error } = await supabase
      .from("awards_comments")
      .update({ is_moderated: true, is_banned: isDelete })
      .eq("id", commentId);

    // Enregistrer l'événement modérateur
    await supabase.from("awards_live_events").insert({
      live_session_id: sessionId,
      event_type: "mod_action",
      payload: {
        action,
        comment_id: commentId,
        moderator_id: user.id,
        moderator_name: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email,
      },
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, action, comment_id: commentId });
  }

  // 2. Sanction utilisateur (mute, ban, warn, unban)
  if (["mute", "ban", "warn", "unban"].includes(action)) {
    const targetUserId = String(body.target_user_id || "");
    const targetUserName = String(body.target_user_name || "Utilisateur");
    const reason = String(body.reason || "");

    if (!targetUserId) {
      return NextResponse.json({ error: "target_user_id requis" }, { status: 400 });
    }

    // Enregistrer l'événement de sanction en base
    const { data: event, error } = await supabase.from("awards_live_events").insert({
      live_session_id: sessionId,
      event_type: "mod_action",
      payload: {
        action,
        target_user_id: targetUserId,
        target_user_name: targetUserName,
        reason,
        moderator_id: user.id,
        moderator_name: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email,
        created_at: new Date().toISOString(),
      },
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, sanction: event });
  }

  // 3. Alerte prioritaire envoyée à l'animateur
  if (action === "alert_host") {
    const reason = String(body.reason || "").trim();
    if (!reason) return NextResponse.json({ error: "Motif d’alerte requis" }, { status: 400 });

    const { data: event, error } = await supabase.from("awards_live_events").insert({
      live_session_id: sessionId,
      event_type: "mod_alert",
      payload: {
        alert_reason: reason,
        moderator_id: user.id,
        moderator_name: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email,
        created_at: new Date().toISOString(),
      },
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, alert: event });
  }

  return NextResponse.json({ error: "Action modération non reconnue" }, { status: 400 });
}
