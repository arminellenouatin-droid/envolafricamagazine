import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const competitionId = new URL(req.url).searchParams.get("competition_id");
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!competitionId && !sessionId) return NextResponse.json({ error: "competition_id ou session_id requis" }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base live Awards temporairement indisponible" }, { status: 503 });
  let sessionQuery = supabase.from("awards_live_sessions").select("id,competition_id,mux_playback_id,status,started_at,ended_at,replay_url,created_at").order("created_at", { ascending: false }).limit(1);
  if (sessionId) sessionQuery = sessionQuery.eq("id", sessionId);
  else sessionQuery = sessionQuery.eq("competition_id", competitionId).in("status", ["scheduled", "live"]);
  const { data: session, error: sessionError } = await sessionQuery.maybeSingle();
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });
  const liveSessionId = session?.id || sessionId;
  const { data: events, error: eventsError } = liveSessionId ? await supabase.from("awards_live_events").select("id,competition_id,live_session_id,event_type,payload,created_at").eq("live_session_id", liveSessionId).order("created_at", { ascending: true }).limit(200) : { data: [], error: null };
  if (eventsError) return NextResponse.json({ error: eventsError.message }, { status: 500 });
  return NextResponse.json({ session, events: events ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user || !["admin", "host"].includes(user.role)) return NextResponse.json({ error: "Seul un administrateur ou un animateur autorisé peut gérer un live" }, { status: 403 });
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const action = String(body.action || "");
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
    const allowed = ["comment", "reaction", "candidate_join", "candidate_leave", "vote", "gift", "donation", "pot_increase"];
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
