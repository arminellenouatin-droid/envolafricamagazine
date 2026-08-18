import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { id } = await params; const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Messagerie indisponible." }, { status: 503 });
  const { data: conversation } = await supabase.from("wab_conversations").select("id,participant_a,participant_b,created_at,updated_at").eq("id", id).or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`).maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  const { data: messages, error } = await supabase.from("wab_messages").select("id,conversation_id,sender_id,body,read_at,created_at").eq("conversation_id", id).order("created_at", { ascending: true }).limit(200);
  if (error) return NextResponse.json({ error: "Messages indisponibles." }, { status: 503 });
  await supabase.from("wab_messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", id).neq("sender_id", user.id).is("read_at", null);
  return NextResponse.json({ conversation, messages: messages ?? [] });
}
