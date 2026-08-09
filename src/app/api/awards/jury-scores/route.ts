import { NextRequest, NextResponse } from "next/server";
import { readAwardsDB, writeAwardsDB } from "@/lib/awards-db";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const competition_id = searchParams.get("competition_id");
  const db = readAwardsDB();
  // @ts-ignore jury_scores not in default type, use any
  const scores = (db as any).jury_scores || [];
  let filtered = scores;
  if (competition_id) filtered = scores.filter((s:any)=>s.competition_id===competition_id);
  return NextResponse.json({ scores: filtered });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { competition_id, candidate_id, score, comment, jury_id } = body;
  if (!competition_id || !candidate_id || score===undefined) return NextResponse.json({ error: "competition_id, candidate_id, score requis" }, { status: 400 });
  const db = readAwardsDB();
  if (!(db as any).jury_scores) (db as any).jury_scores = [];
  const existing = (db as any).jury_scores.find((s:any)=>s.competition_id===competition_id && s.candidate_id===candidate_id && s.jury_id===(jury_id||"mock_jury"));
  if (existing) {
    existing.score = score;
    existing.comment = comment||"";
    existing.updated_at = new Date().toISOString();
  } else {
    (db as any).jury_scores.push({
      id: uuidv4(),
      competition_id,
      jury_id: jury_id||"mock_jury",
      candidate_id,
      score,
      comment: comment||"",
      created_at: new Date().toISOString(),
    });
  }
  writeAwardsDB(db);
  return NextResponse.json({ success: true });
}
