import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const AWARDS_DB_FILE = path.join(DATA_DIR, 'awards.json');

export interface AwardsCompetition {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  category_id?: string;
  status: 'draft'|'published'|'registrations_open'|'registrations_closed'|'voting_open'|'live_scheduled'|'live_running'|'voting_closed'|'deliberation'|'finished'|'archived';
  vote_price_cents: number;
  points_per_vote: number;
  jury_weight: number;
  public_vote_weight: number;
  cover_image?: string;
  organizer_org_id?: string;
  created_by: string;
  created_at: string;
  starts_at?: string;
  ends_at?: string;
  candidates_count?: number;
  votes_count?: number;
  pot_amount_cents?: number;
}

export interface AwardsCandidate {
  id: string;
  competition_id: string;
  display_name: string;
  bio?: string;
  country?: string;
  photo_url?: string;
  video_url?: string;
  project_description?: string;
  status: 'pending'|'accepted'|'rejected';
  votes: number;
  gifts: number;
  donations: number;
  created_at: string;
}

export interface AwardsRequest {
  id: string;
  organization_id?: string;
  submitted_by: string;
  category: string;
  title: string;
  description: string;
  proposed_rules?: string;
  proposed_calendar?: any;
  proposed_rewards?: string;
  status: 'submitted'|'under_review'|'validated'|'rejected';
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
}

interface AwardsDB {
  competitions: AwardsCompetition[];
  candidates: AwardsCandidate[];
  requests: AwardsRequest[];
  votes: any[];
  applications: any[];
}

const defaultAwardsDB: AwardsDB = {
  competitions: [],
  candidates: [],
  requests: [],
  votes: [],
  applications: [],
};

function ensureAwardsDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(AWARDS_DB_FILE)) {
    fs.writeFileSync(AWARDS_DB_FILE, JSON.stringify(defaultAwardsDB, null, 2));
  }
}

export function readAwardsDB(): AwardsDB {
  ensureAwardsDB();
  try {
    return JSON.parse(fs.readFileSync(AWARDS_DB_FILE, 'utf-8'));
  } catch {
    return defaultAwardsDB;
  }
}

export function writeAwardsDB(db: AwardsDB) {
  ensureAwardsDB();
  fs.writeFileSync(AWARDS_DB_FILE, JSON.stringify(db, null, 2));
}

export function seedAwardsIfEmpty() {
  const db = readAwardsDB();
  let changed = false;
  if (db.competitions.length===0) {
    const cats = ["Awards","Miss","Talent Show","Chant","Danse","Startup","Culture","Sport","Innovation","Entrepreneuriat"];
    for (let i=0;i<6;i++) {
      const id = uuidv4();
      db.competitions.push({
        id,
        slug: `africa-awards-${2024+i}-edition-${i+1}`,
        title: `Africa Awards Édition ${2024+i} - ${cats[i%cats.length]}`,
        description: `La plus grande compétition ${cats[i%cats.length]} d'Afrique - ${i+1}e édition - Cérémonie prestigieuse avec vote public, jury international, cadeaux virtuels et cagnotte en direct.`,
        category: cats[i%cats.length],
        status: i===0 ? 'live_running' : i===1 ? 'voting_open' : i===2 ? 'registrations_open' : 'published',
        vote_price_cents: 100,
        points_per_vote: i===0?10:1,
        jury_weight: i%2===0?30:0,
        public_vote_weight: i%2===0?70:100,
        cover_image: `https://images.unsplash.com/photo-${1486406146926 + i}-c627a92ad1ab?w=800`,
        created_by: "admin",
        created_at: new Date(Date.now()-i*86400000*7).toISOString(),
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now()+30*86400000).toISOString(),
        candidates_count: 12+i*3,
        votes_count: 1500+i*320,
        pot_amount_cents: (500000 + i*100000),
      });
    }
    changed = true;
  }
  if (db.candidates.length===0 && db.competitions.length>0) {
    for (const comp of db.competitions.slice(0,3)) {
      for (let j=0;j<6;j++) {
        db.candidates.push({
          id: uuidv4(),
          competition_id: comp.id,
          display_name: `Candidat ${j+1} - ${comp.category}`,
          bio: `Bio du candidat ${j+1} - Talent africain exceptionnel dans ${comp.category} - Projet innovant...`,
          country: ["BJ","CI","SN","NG","GH","CM"][j%6],
          photo_url: `https://images.unsplash.com/photo-${1573496359142 + j}-b8d87734a5a2?w=400`,
          video_url: "",
          project_description: `Projet du candidat ${j+1} pour ${comp.title}`,
          status: j<4?'accepted':'pending',
          votes: Math.floor(Math.random()*500)+50,
          gifts: Math.floor(Math.random()*20),
          donations: Math.floor(Math.random()*100000),
          created_at: new Date().toISOString(),
        });
      }
    }
    changed = true;
  }
  if (changed) writeAwardsDB(db);
}

seedAwardsIfEmpty();
