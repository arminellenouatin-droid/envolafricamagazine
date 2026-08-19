import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import { isProductionRuntime } from "@/lib/supabase-admin";

const DATA_FILE = path.join(process.cwd(), "src", "data", "jobs.json");

export const JOB_SEEKER_PLANS = [
  { id: "jobs-candidate-24h", label: "Accès 24 heures", price: 500, durationHours: 24 },
  { id: "jobs-candidate-week", label: "Accès 7 jours", price: 2000, durationHours: 168 },
  { id: "jobs-candidate-month", label: "Accès 30 jours", price: 5000, durationHours: 720 },
] as const;

export const EMPLOYER_PLANS = [
  { id: "jobs-employer-post", label: "Une publication", price: 1000, durationDays: 0 },
  { id: "jobs-employer-week", label: "Accès entreprise 7 jours", price: 7000, durationDays: 7 },
  { id: "jobs-employer-month", label: "Accès entreprise 30 jours + Magazine numérique", price: 22000, durationDays: 30 },
] as const;

export interface JobOffer {
  id: string;
  title: string;
  description: string;
  companyName: string;
  companyLogo?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  country: string;
  city: string;
  region?: string;
  sector: string;
  contractType: "CDI" | "CDD" | "Stage" | "Freelance" | "Remote";
  salary?: string;
  skills: string[];
  publishedAt: string;
  expiresAt: string;
  status: "published" | "draft" | "closed";
  isBoosted: boolean;
  boostEndsAt?: string;
  views: number;
  applications: number;
  createdBy?: string;
}

export interface CandidateProfile {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string;
  cvUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  description: string;
  skills: string[];
  desiredRole: string;
  country: string;
  city: string;
  availability: string;
  status: "published" | "draft" | "pending_review" | "hidden" | "archived";
  isBoosted: boolean;
  boostEndsAt?: string;
  views: number;
  createdAt: string;
  createdBy?: string;
}

export interface JobUnlock {
  id: string;
  userId: string;
  offerId: string;
  amount: number;
  paymentId?: string;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
}

export interface JobApplication {
  id: string;
  offerId: string;
  userId: string;
  message?: string;
  status: "sent" | "seen" | "shortlisted" | "rejected";
  createdAt: string;
}

export interface JobBoost {
  id: string;
  userId: string;
  targetType: "offer" | "candidate";
  targetId: string;
  days: number;
  amount: number;
  paymentId?: string;
  status: "pending" | "active" | "cancelled" | "expired";
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

export interface JobEvent {
  id: string;
  userId?: string;
  visitorId?: string;
  type: "search" | "offer_view" | "candidate_view";
  query?: string;
  targetId?: string;
  country?: string;
  city?: string;
  createdAt: string;
}

export interface JobSubscription {
  id: string;
  userId: string;
  audience: "candidate" | "employer";
  planId: string;
  amount: number;
  paymentId?: string;
  status: "pending" | "active" | "cancelled" | "expired";
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

export interface JobsDatabase {
  offers: JobOffer[];
  candidates: CandidateProfile[];
  unlocks: JobUnlock[];
  applications: JobApplication[];
  subscriptions: JobSubscription[];
  boosts: JobBoost[];
  events: JobEvent[];
}

const seedOffers: JobOffer[] = [
  { id: "job-bj-finance", title: "Responsable administratif et financier", description: "Pilotez la fonction financière, le reporting et le contrôle de gestion d'une entreprise en croissance. Vous travaillez avec la direction et les équipes opérationnelles.", companyName: "Confidentiel", contactEmail: "recrutement@confidentiel.africa", country: "Bénin", city: "Cotonou", sector: "Finance", contractType: "CDI", salary: "Selon profil", skills: ["Finance", "Reporting", "Excel"], publishedAt: "2026-08-14T09:00:00.000Z", expiresAt: "2026-09-14T09:00:00.000Z", status: "published", isBoosted: true, boostEndsAt: "2026-08-28T09:00:00.000Z", views: 1240, applications: 28 },
  { id: "job-ci-product", title: "Product Manager — Mobile Money", description: "Concevez des produits de paiement simples et accessibles. Vous coordonnez les priorités produit, la recherche utilisateur et les lancements.", companyName: "Confidentiel", contactEmail: "talents@confidentiel.africa", country: "Côte d’Ivoire", city: "Abidjan", sector: "Tech", contractType: "CDI", salary: "2,5 à 4 M FCFA", skills: ["Product", "Fintech", "Agile"], publishedAt: "2026-08-13T09:00:00.000Z", expiresAt: "2026-09-13T09:00:00.000Z", status: "published", isBoosted: true, boostEndsAt: "2026-08-25T09:00:00.000Z", views: 987, applications: 34 },
  { id: "job-sn-agro", title: "Responsable développement commercial", description: "Développez le portefeuille B2B et les partenariats d'une entreprise agroalimentaire présente en Afrique de l'Ouest.", companyName: "Confidentiel", contactEmail: "jobs@confidentiel.africa", country: "Sénégal", city: "Dakar", sector: "Commerce", contractType: "CDI", salary: "Selon profil", skills: ["Vente B2B", "Négociation", "Agroalimentaire"], publishedAt: "2026-08-12T09:00:00.000Z", expiresAt: "2026-09-12T09:00:00.000Z", status: "published", isBoosted: false, views: 654, applications: 19 },
  { id: "job-ke-data", title: "Data Analyst — Impact & Inclusion", description: "Analysez les indicateurs d'impact et transformez les données en décisions utiles pour des programmes régionaux.", companyName: "Confidentiel", contactEmail: "apply@confidentiel.africa", country: "Kenya", city: "Nairobi", sector: "Data", contractType: "Remote", salary: "Competitive", skills: ["SQL", "Power BI", "Analyse"], publishedAt: "2026-08-11T09:00:00.000Z", expiresAt: "2026-09-11T09:00:00.000Z", status: "published", isBoosted: false, views: 521, applications: 17 },
  { id: "job-ng-marketing", title: "Growth Marketing Lead", description: "Accélérez l'acquisition et la fidélisation sur plusieurs marchés africains avec une approche pilotée par la donnée.", companyName: "Confidentiel", contactEmail: "careers@confidentiel.africa", country: "Nigeria", city: "Lagos", sector: "Marketing", contractType: "CDI", salary: "Competitive", skills: ["Growth", "Acquisition", "Analytics"], publishedAt: "2026-08-10T09:00:00.000Z", expiresAt: "2026-09-10T09:00:00.000Z", status: "published", isBoosted: false, views: 712, applications: 25 },
];

const emptyDatabase = (): JobsDatabase => ({ offers: seedOffers, candidates: [], unlocks: [], applications: [], subscriptions: [], boosts: [], events: [] });

function reconcileJobsDatabase(database: JobsDatabase): JobsDatabase {
  const now = Date.now();
  database.subscriptions.forEach((subscription) => { if (subscription.status === "active" && subscription.endsAt && Date.parse(subscription.endsAt) <= now) subscription.status = "expired"; });
  database.boosts.forEach((boost) => { if (boost.status === "active" && boost.endsAt && Date.parse(boost.endsAt) <= now) boost.status = "expired"; });
  database.offers.forEach((offer) => { if (offer.isBoosted && offer.boostEndsAt && Date.parse(offer.boostEndsAt) <= now) offer.isBoosted = false; });
  database.candidates.forEach((candidate) => { if (candidate.isBoosted && candidate.boostEndsAt && Date.parse(candidate.boostEndsAt) <= now) candidate.isBoosted = false; });
  return database;
}

export function readJobsDB(): JobsDatabase {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      if (isProductionRuntime()) throw new Error("Stockage Jobs local indisponible en production.");
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(emptyDatabase(), null, 2));
    }
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as Partial<JobsDatabase>;
    return reconcileJobsDatabase({ offers: parsed.offers ?? seedOffers, candidates: parsed.candidates ?? [], unlocks: parsed.unlocks ?? [], applications: parsed.applications ?? [], subscriptions: parsed.subscriptions ?? [], boosts: parsed.boosts ?? [], events: parsed.events ?? [] });
  } catch {
    if (isProductionRuntime()) throw new Error("Persistance Jobs Supabase non configurée en production.");
    return emptyDatabase();
  }
}

export function writeJobsDB(database: JobsDatabase) {
  if (isProductionRuntime()) throw new Error("Écriture du stockage Jobs JSON local désactivée en production. Configurez la persistance Supabase.");
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(database, null, 2));
}

export function createOffer(input: Omit<JobOffer, "id" | "publishedAt" | "views" | "applications" | "status" | "isBoosted">): JobOffer {
  const database = readJobsDB();
  const offer: JobOffer = { ...input, id: uuid(), publishedAt: new Date().toISOString(), status: "published", isBoosted: false, views: 0, applications: 0 };
  database.offers.unshift(offer);
  writeJobsDB(database);
  return offer;
}

export function canSeeEmployerDetails(userId: string | undefined, offerId: string): boolean {
  if (!userId) return false;
  const database = readJobsDB();
  return database.unlocks.some((unlock) => unlock.userId === userId && unlock.offerId === offerId && unlock.status === "paid");
}
