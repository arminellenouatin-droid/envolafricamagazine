import fs from 'fs';
/* eslint-disable @typescript-eslint/no-explicit-any -- store legacy en cours de typage progressif */
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
  typesFinancement: ('don' | 'angel' | 'donation' | 'reward' | 'prise_part' | 'equity' | 'pret' | 'lending')[];
  statut: 'draft' | 'en_attente_validation' | 'en_cours' | 'objectif_atteint' | 'objectif_depasse' | 'termine_sans_objectif' | 'cloture' | 'en_litige';
  porteurId: string;
  pays: string;
  tauxInteret?: number;
  pourcentageVendu?: number;
  valorisation?: number;
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
  pourcentage?: number;
  tauxInteret?: number;
  calendrierRemboursement?: Array<{ date: string; capital: number; interet: number; total: number; statut: 'prevu'|'paye'|'retard'; retardJours?: number }>;
  contratPdf?: string;
  createdAt: string;
}

export interface CrowdDocument {
  id: string;
  projetId: string;
  userId: string;
  type: 'plan_affaires' | 'comptes_financiers' | 'carte_identite' | 'enregistrement_entreprise' | 'photo' | 'autre';
  nom: string;
  url: string;
  taille: number;
  mimeType: string;
  createdAt: string;
  statut: 'en_attente_verification' | 'verifie' | 'rejete';
}

export interface CrowdMessage {
  id: string;
  projetId: string;
  fromId: string;
  fromNom: string;
  toId: string;
  toNom: string;
  content: string;
  createdAt: string;
  lu: boolean;
}

export interface CrowdRepayment {
  id: string;
  contributionId: string;
  projetId: string;
  investisseurId: string;
  porteurId: string;
  datePrevue: string;
  datePayee?: string;
  capital: number;
  interet: number;
  total: number;
  statut: 'prevu' | 'paye' | 'retard';
  retardJours: number;
  montantRetard?: number;
  emailEnvoye?: boolean;
}

interface CrowdDB {
  projets: CrowdProject[];
  contributions: CrowdContribution[];
  documents: CrowdDocument[];
  messages: CrowdMessage[];
  repayments: CrowdRepayment[];
  retraits: any[];
  cagnottes: any[];
  rapports: Array<{ id: string; projetId: string; porteurId: string; type: 'mensuel'|'trimestriel'; periode: string; contenu: string; documents: string[]; createdAt: string }>;
}

const defaultDB: CrowdDB = {
  projets: [],
  contributions: [],
  documents: [],
  messages: [],
  repayments: [],
  retraits: [],
  cagnottes: [],
  rapports: [],
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
    // Ensure new fields exist for old DBs
    if (!parsed.documents) parsed.documents = [];
    if (!parsed.messages) parsed.messages = [];
    if (!parsed.repayments) parsed.repayments = [];
    if (!parsed.rapports) parsed.rapports = [];
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

// Helpers
export function generateCalendrierRemboursement(montant: number, tauxAnnuel: number, dureeMois: number = 12) {
  const calendrier = [];
  const tauxMensuel = tauxAnnuel / 100 / 12;
  const mensualite = (montant * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -dureeMois));
  let capitalRestant = montant;
  
  for (let i=1; i<=dureeMois; i++) {
    const interet = capitalRestant * tauxMensuel;
    const capital = mensualite - interet;
    capitalRestant -= capital;
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    calendrier.push({
      date: date.toISOString().split('T')[0],
      capital: Math.round(capital),
      interet: Math.round(interet),
      total: Math.round(mensualite),
      statut: 'prevu' as const,
      retardJours: 0
    });
  }
  return calendrier;
}

export function checkRetards() {
  const db = readCrowdDB();
  let changed = false;
  const now = new Date();
  for (const repayment of db.repayments) {
    if (repayment.statut === 'prevu') {
      const datePrevue = new Date(repayment.datePrevue);
      const diffJours = Math.floor((now.getTime() - datePrevue.getTime()) / 86400000);
      if (diffJours > 0) {
        repayment.statut = 'retard';
        repayment.retardJours = diffJours;
        changed = true;
        // Ici on enverrait email automatique via Resend
        console.log(`Retard détecté: remboursement ${repayment.id} en retard de ${diffJours} jours - email auto prévu`);
      }
    }
  }
  if (changed) writeCrowdDB(db);
}
