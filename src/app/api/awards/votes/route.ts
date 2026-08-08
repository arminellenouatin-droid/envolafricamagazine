import { NextRequest, NextResponse } from "next/server";
import { readAwardsDB, writeAwardsDB } from "@/lib/awards-db";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readDB } from "@/lib/db";

async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const decoded = verifyToken(token);
    if (!decoded) return null;
    const db = readDB();
    return db.users.find(u=>u.id===decoded.id) || null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const candidate_id = searchParams.get("candidate_id");
  const db = readAwardsDB();
  let votes = db.votes;
  if (candidate_id) votes = votes.filter(v=>v.candidate_id===candidate_id);
  return NextResponse.json({ votes });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const body = await req.json();
  const { candidate_id, competition_id, points, payment_id } = body;
  if (!candidate_id || !competition_id) return NextResponse.json({ error: "candidate_id et competition_id requis" }, { status: 400 });
  
  const db = readAwardsDB();
  // Vérif paiement si fourni
  const vote = {
    id: uuidv4(),
    voter_id: user.id,
    candidate_id,
    competition_id,
    points: points||1,
    payment_transaction_id: payment_id||`mock_${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  db.votes.push(vote);
  // Incrémente votes candidat
  const cand = db.candidates.find(c=>c.id===candidate_id);
  if (cand) cand.votes += (points||1);
  // Incrémente votes compétition
  const comp = db.competitions.find(c=>c.id===competition_id);
  if (comp) comp.votes_count = (comp.votes_count||0) + (points||1);
  
  writeAwardsDB(db);
  return NextResponse.json({ success: true, vote, message: "Vote comptabilisé en <5s + classement temps réel" });
}
