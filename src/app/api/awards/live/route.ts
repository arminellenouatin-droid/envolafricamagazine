import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const competitionId = new URL(req.url).searchParams.get("competition_id");
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!competitionId && !sessionId) return NextResponse.json({ error: "competition_id ou session_id requis" }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base live Awards temporairement indisponible" }, { status: 503 });
  const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  let targetCompId = competitionId;
  if (competitionId && !isUuid(competitionId)) {
    const { data: comp } = await supabase
      .from("awards_competitions")
      .select("id")
      .eq("slug", competitionId)
      .limit(1)
      .maybeSingle();
    if (!comp) {
      return NextResponse.json({ session: null, events: [], participants: [] });
    }
    targetCompId = comp.id;
  }

  let sessionQuery = supabase.from("awards_live_sessions").select("id,competition_id,mux_playback_id,status,started_at,ended_at,replay_url,created_at").order("created_at", { ascending: false }).limit(1);
  if (sessionId) {
    if (!isUuid(sessionId)) {
      return NextResponse.json({ session: null, events: [], participants: [] });
    }
    sessionQuery = sessionQuery.eq("id", sessionId);
  } else if (targetCompId) {
    sessionQuery = sessionQuery.eq("competition_id", targetCompId).in("status", ["scheduled", "live"]);
  }
  const { data: session, error: sessionError } = await sessionQuery.maybeSingle();
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });
  const liveSessionId = session?.id || sessionId;
  const { data: events, error: eventsError } = liveSessionId ? await supabase.from("awards_live_events").select("id,competition_id,live_session_id,event_type,payload,created_at").eq("live_session_id", liveSessionId).order("created_at", { ascending: true }).limit(200) : { data: [], error: null };
  if (eventsError) return NextResponse.json({ error: eventsError.message }, { status: 500 });
  const { data: participants, error: participantsError } = liveSessionId ? await supabase.from("awards_live_participants").select("id,live_session_id,competition_id,candidate_id,user_id,role,state,joined_at,left_at,updated_at").eq("live_session_id", liveSessionId).order("updated_at", { ascending: false }).limit(100) : { data: [], error: null };
  if (participantsError) return NextResponse.json({ error: participantsError.message }, { status: 500 });
  return NextResponse.json({ session, events: events ?? [], participants: participants ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour gérer un live" }, { status: 401 });
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const action = String(body.action || "");
  if (action === "participant") {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "Base live Awards temporairement indisponible" }, { status: 503 });
    const sessionId = String(body.session_id || "");
    const participantAction = String(body.participant_action || "");
    if (!sessionId || !["join", "leave", "request_stage", "remove"].includes(participantAction)) return NextResponse.json({ error: "session_id et action participant valides requis" }, { status: 400 });
    const { data: session } = await supabase.from("awards_live_sessions").select("id,competition_id,status").eq("id", sessionId).limit(1).maybeSingle();
    if (!session || session.status !== "live") return NextResponse.json({ error: "Live non actif" }, { status: 409 });
    const candidateId = typeof body.candidate_id === "string" ? body.candidate_id : null;
    if (candidateId) {
      const { data: candidate } = await supabase.from("awards_candidates").select("id,profile_id,status,competition_id").eq("id", candidateId).eq("competition_id", session.competition_id).eq("status", "accepted").limit(1).maybeSingle();
      if (!candidate || (candidate.profile_id !== user.id && !["admin", "host"].includes(user.role))) return NextResponse.json({ error: "Candidat non autorisé pour ce live" }, { status: 403 });
    } else if (!["admin", "host"].includes(user.role)) return NextResponse.json({ error: "Un candidat accepté est requis" }, { status: 400 });
    const state = participantAction === "join" ? "waiting" : participantAction === "request_stage" ? "on_stage" : participantAction === "remove" ? "removed" : "left";
    const { data: participant, error } = await supabase.from("awards_live_participants").upsert({ live_session_id: sessionId, competition_id: session.competition_id, candidate_id: candidateId, user_id: user.id, role: candidateId ? "candidate" : user.role === "host" ? "host" : "viewer", state, left_at: state === "left" || state === "removed" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }, { onConflict: "live_session_id,user_id" }).select("id,live_session_id,competition_id,candidate_id,user_id,role,state,joined_at,left_at,updated_at").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ participant }, { status: 201 });
  }
  if (!["admin", "host"].includes(user.role)) return NextResponse.json({ error: "Seul un administrateur ou un animateur autorisé peut gérer un live" }, { status: 403 });
  const competitionId = String(body.competition_id || "");
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base live Awards temporairement indisponible" }, { status: 503 });
  if (!competitionId && action !== "event") return NextResponse.json({ error: "competition_id requis" }, { status: 400 });
  if (action === "start") {
    const { data: existing } = await supabase.from("awards_live_sessions").select("id,status").eq("competition_id", competitionId).in("status", ["scheduled", "live"]).limit(1).maybeSingle();
    if (existing) return NextResponse.json({ session: existing, already_exists: true });
    const { data: session, error } = await supabase.from("awards_live_sessions").insert({ competition_id: competitionId, status: "live", started_at: new Date().toISOString() }).select("id,competition_id,status,started_at,ended_at,replay_url").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabase.from("awards_competitions").update({ status: "live_running" }).eq("id", competitionId);
    return NextResponse.json({ session }, { status: 201 });
  }
  if (action === "end") {
    const sessionId = String(body.session_id || "");
    if (!sessionId) return NextResponse.json({ error: "session_id requis" }, { status: 400 });
    const { data: session, error } = await supabase.from("awards_live_sessions").update({ status: "ended", ended_at: new Date().toISOString(), replay_url: typeof body.replay_url === "string" ? body.replay_url : null }).eq("id", sessionId).eq("status", "live").select("id,competition_id,status,started_at,ended_at,replay_url").maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!session) return NextResponse.json({ error: "Session live active introuvable" }, { status: 404 });
    await supabase.from("awards_competitions").update({ status: "voting_open" }).eq("id", session.competition_id).eq("status", "live_running");
    return NextResponse.json({ session });
  }
  if (action === "event") {
    const sessionId = String(body.session_id || "");
    const eventType = String(body.event_type || "");
    const allowed = [
      "comment", "reaction", "candidate_join", "candidate_leave", "vote",
      "gift", "donation", "pot_increase", "announcement", "pin_comment",
      "mod_alert", "speaker_change", "mod_action"
    ];
    if (!sessionId || !allowed.includes(eventType)) return NextResponse.json({ error: "session_id et type d’événement valides requis" }, { status: 400 });
    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
    if (eventType === "comment" && (!String((payload as Record<string, unknown>).content || "").trim() || String((payload as Record<string, unknown>).content).length > 500)) return NextResponse.json({ error: "Commentaire vide ou trop long" }, { status: 400 });
    const { data: session } = await supabase.from("awards_live_sessions").select("id,competition_id,status").eq("id", sessionId).limit(1).maybeSingle();
    if (!session || session.status !== "live") return NextResponse.json({ error: "Live non actif" }, { status: 409 });
    const { data: event, error } = await supabase.from("awards_live_events").insert({ competition_id: session.competition_id, live_session_id: sessionId, event_type: eventType, payload: { ...(payload as Record<string, unknown>), user_id: user.id } }).select("id,competition_id,live_session_id,event_type,payload,created_at").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ event }, { status: 201 });
  }
  return NextResponse.json({ error: "Action live inconnue" }, { status: 400 });
}
