import { NextRequest, NextResponse } from "next/server";
import { readCrowdDB, writeCrowdDB } from "@/lib/crowdfunding-db";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCrowdProjects, mapCrowdProject } from "@/lib/crowdfunding-supabase";
import type { CrowdProject } from "@/lib/crowdfunding-db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secteur = searchParams.get("secteur");
  const type = searchParams.get("type");
  const pays = searchParams.get("pays");
  const risque = searchParams.get("risque");
  const statut = searchParams.get("statut");
  const id = searchParams.get("id");
  const cursor = searchParams.get("cursor");
  const limit = Number(searchParams.get("limit") || 12);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const result = await getCrowdProjects({ secteur, pays, risque, statut: statut || (id ? null : "active"), type, id, cursor, limit });
    if (id) {
      const projet = result.projets[0];
      if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
      return NextResponse.json({ projet });
    }
    return NextResponse.json({ projets: result.projets, nextCursor: result.nextCursor, boostedIds: result.boostedIds });
  }
  const db = readCrowdDB();
  if (id) {
    const projet = db.projets.find(p=>p.id===id);
    if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    return NextResponse.json({ projet });
  }

  let projets = db.projets;
  if (secteur && secteur!=="all") projets = projets.filter(p=>p.secteur===secteur);
  if (type && type!=="all") projets = projets.filter(p=>p.typesFinancement.includes(type as CrowdProject["typesFinancement"][number]));
  if (pays && pays!=="all") projets = projets.filter(p=>p.pays===pays);
  if (risque && risque!=="all") projets = projets.filter(p=>p.niveauRisque===risque);
  if (statut && statut!=="all") projets = projets.filter(p=>p.statut===statut);

  projets = projets.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ projets });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) return NextResponse.json({ error: "Connexion requise pour créer un projet." }, { status: 401 });
    const body = await req.json();
    const { nom, secteur, description, montantRecherche, niveauRisque, dureeJours, typesFinancement, pays, tauxInteret } = body;
    const requestedStatus = body.statut === "pending_review" ? "pending_review" : "draft";
    if (!nom || !secteur || !description || !montantRecherche) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: existingDraft, error: draftError } = await supabase.from("crowdfunding_projects").select("id,statut").eq("porteur_id", user.id).in("statut", ["draft", "pending_review"]).limit(1).maybeSingle();
      if (draftError) return NextResponse.json({ error: draftError.message }, { status: 500 });
      if (existingDraft) return NextResponse.json({ error: "Un seul brouillon ou projet en validation est autorisé par porteur.", projetId: existingDraft.id }, { status: 409 });
    }
    const newProjet = {
      id: uuidv4(),
      nom,
      secteur,
      description,
      videos: body.videos||[],
      images: body.images||[],
      pdf: body.pdf||"",
      montantRecherche: parseInt(montantRecherche),
      montantCollecte: 0,
      niveauRisque: niveauRisque||"moyen",
      dureeJours: parseInt(dureeJours)||30,
      typesFinancement: typesFinancement||["don"],
      statut: requestedStatus === "pending_review" ? "en_attente_validation" as const : "draft" as const,
      porteurId: user.id,
      pays: pays||"BJ",
      tauxInteret: tauxInteret||8,
      pourcentageVendu: 20,
      valorisation: Math.round(parseInt(montantRecherche) / 0.2),
      createdAt: new Date().toISOString(),
      dateFin: new Date(Date.now()+parseInt(dureeJours||30)*86400000).toISOString(),
      vues: 0,
      investisseurs: 0,
      repartition: { dons: 0, prise_part: 0, pret: 0 }
    };
    if (supabase) {
      const { data, error } = await supabase.from("crowdfunding_projects").insert({ id: newProjet.id, nom: newProjet.nom, secteur: newProjet.secteur, description: newProjet.description, videos: newProjet.videos, images: newProjet.images, pdf: newProjet.pdf, montant_recherche: newProjet.montantRecherche, montant_collecte: 0, niveau_risque: newProjet.niveauRisque, duree_jours: newProjet.dureeJours, types_financement: newProjet.typesFinancement, statut: newProjet.statut, porteur_id: newProjet.porteurId, pays: newProjet.pays, taux_interet: newProjet.tauxInteret, pourcentage_vendu: newProjet.pourcentageVendu, valorisation: newProjet.valorisation, created_at: newProjet.createdAt, date_fin: newProjet.dateFin, vues: 0, investisseurs: 0, repartition: newProjet.repartition }).select("*").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, projet: mapCrowdProject(data as Record<string, unknown>) });
    }
    const db = readCrowdDB();
    if (db.projets.some((project) => project.porteurId === user.id && ["draft", "en_attente_validation"].includes(project.statut))) return NextResponse.json({ error: "Un seul brouillon ou projet en validation est autorisé par porteur." }, { status: 409 });
    db.projets.push(newProjet);
    writeCrowdDB(db);
    return NextResponse.json({ success: true, projet: newProjet });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
