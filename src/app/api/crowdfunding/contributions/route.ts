import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readCrowdDB } from "@/lib/crowdfunding-db";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const db = readCrowdDB();
  const contributions = db.contributions.filter((contribution) => contribution.investisseurId === user.id);
  const projects = new Map(db.projets.map((project) => [project.id, project]));
  return NextResponse.json({ contributions: contributions.map((contribution) => ({ ...contribution, projet: projects.get(contribution.projetId)?.nom || "Projet introuvable" })) });
}
