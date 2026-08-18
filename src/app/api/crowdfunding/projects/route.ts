import { NextRequest, NextResponse } from "next/server";
import { readCrowdDB, writeCrowdDB } from "@/lib/crowdfunding-db";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secteur = searchParams.get("secteur");
  const type = searchParams.get("type");
  const pays = searchParams.get("pays");
  const risque = searchParams.get("risque");
  const statut = searchParams.get("statut");
  const id = searchParams.get("id");

  const db = readCrowdDB();
  if (id) {
    const projet = db.projets.find(p=>p.id===id);
    if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    return NextResponse.json({ projet });
  }

  let projets = db.projets;
  if (secteur && secteur!=="all") projets = projets.filter(p=>p.secteur===secteur);
  if (type && type!=="all") projets = projets.filter(p=>p.typesFinancement.includes(type as any));
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
    if (!nom || !secteur || !description || !montantRecherche) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    const db = readCrowdDB();
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
      statut: "en_attente_validation" as const,
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
    db.projets.push(newProjet);
    writeCrowdDB(db);
    return NextResponse.json({ success: true, projet: newProjet });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
