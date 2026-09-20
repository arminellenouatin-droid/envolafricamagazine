import { NextRequest, NextResponse } from "next/server";
import { readAwardsDB, writeAwardsDB } from "@/lib/awards-db";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      let query = supabase.from("awards_competition_requests").select("*").order("created_at", { ascending: false });
      if (user.role !== "admin") {
        query = query.eq("submitted_by", user.id);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return NextResponse.json({ requests: data });
      }
    } catch {
      // Fallback to local DB
    }
  }

  const db = readAwardsDB();
  if (user.role === "admin") {
    return NextResponse.json({ requests: db.requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) });
  } else {
    const myRequests = db.requests.filter((r) => r.submitted_by === user.id);
    return NextResponse.json({ requests: myRequests });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Record<string, any> | null;
  if (!body) return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  const { category, title, description, proposed_rules, proposed_calendar, proposed_rewards } = body;
  if (!title || !category) return NextResponse.json({ error: "Titre et catégorie requis" }, { status: 400 });

  const requestId = uuidv4();
  const now = new Date().toISOString();
  const newReq = {
    id: requestId,
    organization_id: undefined,
    submitted_by: user.id,
    category,
    title,
    description: description || "",
    proposed_rules: proposed_rules || "",
    proposed_calendar: proposed_calendar || {},
    proposed_rewards: proposed_rewards || "",
    status: "submitted" as const,
    created_at: now,
  };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { error } = await supabase.from("awards_competition_requests").insert({
        id: requestId,
        submitted_by: user.id,
        category,
        title,
        description: description || "",
        proposed_rules: proposed_rules || "",
        proposed_calendar: proposed_calendar || {},
        proposed_rewards: proposed_rewards || "",
        status: "submitted",
        created_at: now,
      });
      if (!error) {
        return NextResponse.json({ success: true, request: newReq });
      }
    } catch {
      // Fallback
    }
  }

  const db = readAwardsDB();
  db.requests.push(newReq);
  writeAwardsDB(db);
  return NextResponse.json({ success: true, request: newReq });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Seul l'administrateur peut valider ou refuser une demande" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, any> | null;
  if (!body) return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  const { id, status, rejection_reason } = body;
  if (!id || !status) return NextResponse.json({ error: "ID et status requis" }, { status: 400 });
  if (!["under_review", "validated", "rejected"].includes(status)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("awards_competition_requests")
        .update({
          status,
          rejection_reason: rejection_reason || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (!error && data) {
        return NextResponse.json({ success: true, request: data });
      }
    } catch {
      // Fallback
    }
  }

  const db = readAwardsDB();
  const reqItem = db.requests.find((r) => r.id === id);
  if (!reqItem) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  reqItem.status = status as any;
  if (rejection_reason) reqItem.rejection_reason = rejection_reason;
  reqItem.reviewed_at = new Date().toISOString();
  writeAwardsDB(db);
  return NextResponse.json({ success: true, request: reqItem });
}
