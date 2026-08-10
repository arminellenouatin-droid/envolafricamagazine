import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const CROWD_DB_FILE = path.join(DATA_DIR, 'crowdfunding.json');

export interface CrowdProject {
  id: string;
  nom: string;
  secteur: string;
  description: string;
  videos?: string[];
  images?: string[];
  pdf?: string;
  montantRecherche: number;
  montantCollecte: number;
  niveauRisque: 'faible' | 'moyen' | 'élevé';
  dureeJours: number;
  typesFinancement: ('don' | 'prise_part' | 'pret')[];
  statut: 'en_attente_validation' | 'en_cours' | 'objectif_atteint' | 'objectif_depasse' | 'termine_sans_objectif' | 'cloture' | 'en_litige';
  porteurId: string;
  pays: string;
  tauxInteret?: number; // pour prêt
  pourcentageVendu?: number; // pour prise de part
  valorisation?: number; // calculée auto
  createdAt: string;
  dateFin: string;
  vues: number;
  investisseurs: number;
  repartition: { dons: number; prise_part: number; pret: number };
}

export interface CrowdContribution {
  id: string;
  projetId: string;
  investisseurId: string;
  type: 'don' | 'prise_part' | 'pret';
  montant: number;
  pourcentage?: number; // pour prise de part
  tauxInteret?: number; // pour prêt
  calendrierRemboursement?: Array<{ date: string; capital: number; interet: number; total: number; statut: 'prevu'|'paye'|'retard' }>;
  contratPdf?: string;
  createdAt: string;
}

interface CrowdDB {
  projets: CrowdProject[];
  contributions: CrowdContribution[];
  retraits: any[];
  cagnottes: any[];
}

const defaultDB: CrowdDB = {
  projets: [],
  contributions: [],
  retraits: [],
  cagnottes: [],
};

let inMemory: CrowdDB | null = null;

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(CROWD_DB_FILE)) fs.writeFileSync(CROWD_DB_FILE, JSON.stringify(defaultDB, null, 2));
  } catch {}
}

export function readCrowdDB(): CrowdDB {
  ensureDir();
  try {
    const raw = fs.readFileSync(CROWD_DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    inMemory = parsed;
    return parsed;
  } catch {
    if (inMemory) return inMemory;
    return defaultDB;
  }
}

export function writeCrowdDB(db: CrowdDB) {
  inMemory = db;
  try {
    ensureDir();
    fs.writeFileSync(CROWD_DB_FILE, JSON.stringify(db, null, 2));
  } catch {
    console.warn("writeCrowdDB failed, in-memory only (Vercel)");
  }
}

export function seedCrowdIfEmpty() {
  try {
    const db = readCrowdDB();
    if (db.projets.length>0) return;
    const secteurs = ["Agroalimentaire","Tech","Énergie","Éducation","Santé","Artisanat","Environnement","Commerce"];
    const pays = ["BJ","CI","SN","NG","GH","CM","RW","KE"];
    for (let i=0;i<8;i++) {
      const id = uuidv4();
      const montant = [500000, 2000000, 10000000, 5000000, 3000000, 1500000, 8000000, 1200000][i];
      const collecte = Math.floor(montant * (0.2 + Math.random()*0.9));
      db.projets.push({
        id,
        nom: `Projet ${["AgroBio","TechVillage","Solar Power","EduKids","MediCare","Artisanat d'Art","Green Future","MarketPlace"][i]} - ${secteurs[i]}`,
        secteur: secteurs[i],
        description: `Projet innovant dans le secteur ${secteurs[i]} au ${pays[i]}. Objectif: ${montant.toLocaleString()} F CFA. Porteur de projet passionné avec plan d'affaires solide, vidéos d'explication et documents justificatifs.`,
        videos: [],
        images: [`https://images.unsplash.com/photo-${1486406146926 + i}-c627a92ad1ab?w=600`],
        pdf: "",
        montantRecherche: montant,
        montantCollecte: collecte,
        niveauRisque: (["faible","moyen","élevé"] as any)[i%3],
        dureeJours: 30 + i*5,
        typesFinancement: (i%3===0?["don","prise_part","pret"]:i%3===1?["don","pret"]:["don","prise_part"]) as any,
        statut: (["en_cours","objectif_atteint","en_cours","objectif_depasse","en_cours","termine_sans_objectif","en_cours","en_attente_validation"] as any)[i],
        porteurId: "porteur_"+i,
        pays: pays[i],
        tauxInteret: 8 + i,
        pourcentageVendu: 10 + i*5,
        valorisation: Math.round(montant / ((10+i*5)/100)),
        createdAt: new Date(Date.now()-i*86400000*3).toISOString(),
        dateFin: new Date(Date.now()+(30+i*5)*86400000).toISOString(),
        vues: Math.floor(Math.random()*2000)+100,
        investisseurs: Math.floor(Math.random()*50)+5,
        repartition: { dons: Math.floor(Math.random()*40), prise_part: Math.floor(Math.random()*40), pret: Math.floor(Math.random()*40) }
      });
    }
    writeCrowdDB(db);
  } catch {}
}

try { seedCrowdIfEmpty(); } catch {}
