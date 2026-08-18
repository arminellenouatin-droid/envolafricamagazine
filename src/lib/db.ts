import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  passwordHash: string;
  role: string;
  avatar?: string;
  lang: string;
  currency: string;
  createdAt: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  company?: string;
  country: string;
  phone?: string;
  affiliateCode: string;
  affiliateAccepted?: boolean;
  referredBy?: string;
  subscription?: {
    planId: string;
    status: 'active' | 'expired' | 'cancelled' | 'pending';
    startDate: string;
    endDate: string;
    firstMonth: boolean;
  };
  favorites: string[];
  downloads: string[];
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string; // full
  previewLines: number; // 12
  category: string;
  tags: string[];
  author: string;
  authorId: string;
  image: string;
  images?: string[];
  isPublished: boolean;
  isFeatured: boolean;
  isSentinelle?: boolean;
  isEssor?: boolean;
  isOmbreDouce?: boolean;
  views: number;
  likes: number;
  createdAt: string;
  publishedAt?: string;
  language: string;
  hasAudio: boolean;
  audioUrl?: string;
  readingTime: number;
  isVideo?: boolean;
  videoUrl?: string;
}

export interface Magazine {
  id: string;
  numero: number;
  title: string;
  cover: string;
  coverBack?: string;
  date: string;
  year: number;
  periode?: string; // Ex: "Mars-Avril 2024" ou "Mars 2024"
  category?: string; // Catégorie magazine: Economie, Finance, etc.
  description: string;
  previewPages: number;
  previewImages?: string[]; // URLs des 10 premières pages pour flipbook aperçu
  formats: string[];
  languages: string[];
  featured: boolean;
  // Nouveaux champs pour version corrigée
  pdfs?: Record<string, string>; // { fr: "/uploads/magazines/pdf/...", en: "...", es: "..." }
  audios?: Record<string, string>; // { fr: "/uploads/...", en: "...", sw: "...", ha: "...", etc. 12 langues }
  prices?: Record<string, number>; // { numerique: 10000, papier: 16000, cd_audio: 5000, audio_pdf: 12000, audio_papier: 18000 }
  priceOverrides?: Record<string, number>;
  sommaire?: string[]; // Liste points au sommaire
}

export interface Order {
  id: string;
  userId: string;
  items: Array<{
    type: 'magazine' | 'subscription' | 'don';
    magazineId?: string;
    format?: string;
    language?: string;
    planId?: string;
    amount?: number;
    price: number;
  }>;
  total: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'shipped';
  paymentId?: string;
  affiliateCode?: string;
  shippingCountry?: string;
  shippingCost?: number;
  createdAt: string;
  paidAt?: string;
}

export interface AffiliateEarning {
  id: string;
  affiliateId: string;
  orderId: string;
  amount: number;
  commission: number;
  rate: number;
  status: 'pending' | 'available' | 'paid';
  createdAt: string;
}

export interface Donation {
  id: string;
  userId?: string;
  amount: number;
  currency: string;
  email: string;
  message?: string;
  paymentId?: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  content: string;
  createdAt: string;
  likes: number;
  isModerated: boolean;
}

interface DB {
  users: User[];
  articles: Article[];
  magazines: Magazine[];
  orders: Order[];
  affiliateEarnings: AffiliateEarning[];
  donations: Donation[];
  comments: Comment[];
  settings: any;
}

const defaultDB: DB = {
  users: [],
  articles: [],
  magazines: [],
  orders: [],
  affiliateEarnings: [],
  donations: [],
  comments: [],
  settings: {
    homeSections: {},
    ads: [],
    serviceRequests: [],
    withdrawRequests: [],
    shippingRates: {
      BJ: 2000, CI: 2500, SN: 3000, TG: 2000, CM: 3500, NG: 4000, GH: 3500, FR: 8000, US: 12000, GB: 10000, default: 5000
    },
  }
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
  }
}

export function readDB(): DB {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DB;
    // ensure settings defaults for new fields
    if (!parsed.settings) parsed.settings = defaultDB.settings as any;
    if (!parsed.settings.serviceRequests) parsed.settings.serviceRequests = [];
    if (!parsed.settings.withdrawRequests) parsed.settings.withdrawRequests = [];
    if (!parsed.settings.shippingRates) parsed.settings.shippingRates = (defaultDB.settings as any).shippingRates;
    if (!parsed.settings.homeSections) parsed.settings.homeSections = {};
    if (!parsed.settings.ads) parsed.settings.ads = [];
    return parsed;
  } catch (e) {
    return defaultDB;
  }
}

export function writeDB(db: DB) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// helpers
export function getUserByEmail(email: string): User | undefined {
  const db = readDB();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string): User | undefined {
  const db = readDB();
  return db.users.find(u => u.id === id);
}

export function generateAffiliateCode(prenom: string, nom: string) {
  return `${prenom.substring(0,3).toUpperCase()}${nom.substring(0,3).toUpperCase()}${Math.floor(1000 + Math.random()*9000)}`;
}

export function getArticleBySlug(slug: string): Article | undefined {
  const db = readDB();
  return db.articles.find(a => a.slug === slug);
}

export function getMagazineById(id: string): Magazine | undefined {
  const db = readDB();
  return db.magazines.find(m => m.id === id);
}

// init with seed if empty
export function seedIfEmpty() {
  const db = readDB();
  let changed = false;

  if (db.articles.length === 0) {
    const sampleAuthors = [
      { name: "Aïssata Diop", id: "auth1" },
      { name: "Kwame Nkrumah Jr.", id: "auth2" },
      { name: "Fatou Sow", id: "auth3" },
      { name: "Jean-Marc Koffi", id: "auth4" },
    ];
    const categories = ["Economie", "Finance", "Entrepreneuriat", "Énergie", "Tech", "Agro", "Interview", "Analyse"];
    const sampleContents = [
      `L'Afrique de l'Ouest connaît une transformation économique sans précédent. Les investissements directs étrangers ont augmenté de 15% cette année, portés par les secteurs de l'énergie et de la technologie. Cette dynamique s'explique par une jeunesse de plus en plus qualifiée, une urbanisation rapide et une classe moyenne émergente qui redéfinit les codes de la consommation.\n\nAu Nigeria, la réforme du secteur pétrolier commence à porter ses fruits. Les autorités ont mis en place un cadre réglementaire plus transparent, attirant ainsi de nouveaux investisseurs. Le Ghana, de son côté, se positionne comme un hub technologique, avec Accra qui accueille désormais plusieurs incubateurs de renommée internationale.\n\nLa Côte d'Ivoire confirme son statut de locomotive économique régionale, avec une croissance soutenue par le cacao et l'anacarde, mais aussi par une diversification vers les services. Les experts s'accordent à dire que la Zone de libre-échange continentale africaine (ZLECAf) va accélérer cette intégration économique, offrant un marché de 1,3 milliard de consommateurs.\n\nPourtant, des défis subsistent. L'accès au financement reste un frein majeur pour les PME, qui représentent 90% du tissu économique. Les infrastructures, bien qu'en amélioration, nécessitent encore des investissements colossaux. C'est précisément là qu'interviennent les innovations en matière de financement participatif et de fintech, qui démocratisent l'accès au capital.\n\nL'avenir de l'Afrique se joue aujourd'hui dans sa capacité à transformer ses matières premières sur place, à investir dans le capital humain et à créer des chaînes de valeur locales. Les prochains mois seront décisifs, avec plusieurs élections majeures et des réformes structurelles attendues dans la plupart des pays de la région.`,
      `Le marché des capitaux africains est en pleine ébullition. La BRVM a enregistré une hausse de 12% depuis le début de l'année, tandis que la bourse de Nairobi attire de plus en plus d'investisseurs internationaux. Cette performance s'explique par une meilleure gouvernance des entreprises cotées et par l'arrivée de nouvelles valeurs technologiques.\n\nLes obligations vertes font également leur apparition, avec le Maroc et l'Afrique du Sud en tête de file. Ces instruments financiers permettent de financer la transition énergétique tout en offrant des rendements attractifs. Les investisseurs soucieux de leur impact environnemental y trouvent un moyen concret de soutenir le développement durable du continent.\n\nMais au-delà des marchés traditionnels, c'est la finance décentralisée qui pourrait révolutionner l'accès aux services bancaires. Avec un taux de bancarisation qui reste faible dans de nombreuses régions, le mobile money s'est imposé comme une alternative crédible, traitant désormais plus de transactions que les banques traditionnelles dans certains pays.\n\nLes régulateurs tentent de s'adapter à cette nouvelle donne, en mettant en place des bacs à sable réglementaires pour tester les innovations sans mettre en danger la stabilité financière. Un équilibre délicat mais nécessaire pour ne pas freiner l'innovation tout en protégeant les consommateurs.\n\nLes perspectives pour 2026-2027 restent optimistes, avec une croissance attendue autour de 4,2% pour l'ensemble du continent, selon la BAD. Les secteurs porteurs restent l'agroalimentaire, les énergies renouvelables et l'économie numérique, qui pourraient créer des millions d'emplois si les conditions sont réunies.`,
      `Portrait d'une entrepreneure qui bouscule les codes. À 32 ans, Aminata Traoré a créé la plus grande plateforme de e-commerce de produits cosmétiques bio en Afrique francophone. Partie d'un petit atelier à Dakar, son entreprise emploie aujourd'hui 150 personnes et livre dans 15 pays.\n\nSon secret ? Une connaissance intime des besoins des femmes africaines et une chaîne d'approvisionnement qui valorise les productrices locales de karité et d'huile de baobab. "Nous ne voulons pas seulement vendre des produits, nous voulons raconter l'histoire de celles qui les fabriquent", explique-t-elle dans son bureau baigné de lumière.\n\nSon parcours n'a pas été sans embûches. Levée de fonds difficile, préjugés, logistique complexe... Elle a dû faire preuve d'une résilience à toute épreuve. Mais son succès inspire aujourd'hui toute une génération de jeunes femmes qui voient en elle un modèle.\n\nAminata est également engagée dans la formation, avec une académie qui a déjà formé plus de 500 jeunes entrepreneures. "L'Afrique regorge de talents, il suffit de leur donner les moyens et la confiance", affirme-t-elle. Son prochain défi : conquérir le marché européen, où la demande pour des produits éthiques et africains explose.\n\nCette success story illustre parfaitement le potentiel du continent, où l'innovation frugale et l'impact social peuvent rimer avec rentabilité. Une leçon pour tous les investisseurs qui cherchent le prochain joyau africain.`
    ];

    const titles = [
      "ZLECAf : le grand tournant de l'intégration africaine",
      "Nigeria : pourquoi Lagos attire les licornes de la Tech",
      "Cacao ivoirien : vers une transformation locale à 50%",
      "Énergie solaire : le pari gagnant du Sahel",
      "Fintech : comment le Mobile Money redessine la banque",
      "Portrait - Aminata Traoré, la reine du bio africain",
      "Maroc : le nouveau hub automobile du continent",
      "Startups : Dakar et Kigali dans le top 10 mondial",
      "Agrobusiness : le retour gagnant du fonio",
      "Dette africaine : les solutions qui fonctionnent",
      "Interview exclusive : le patron de la BAD se confie",
      "Rwanda : le miracle économique décrypté",
      "Pétrole sénégalais : les premiers barils changent tout",
      "Femmes entrepreneures : elles lèvent 200M$ en 2025",
      "Bourse : la BRVM bat tous les records"
    ];

    const images = [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
      "https://images.unsplash.com/photo-1497366811353-524cc3f3968e?w=800",
      "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800",
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800",
    ];

    const now = new Date();
    titles.forEach((title, i) => {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g,'') + `-${i}`;
      const contentIdx = i % sampleContents.length;
      db.articles.push({
        id: uuidv4(),
        slug,
        title,
        summary: sampleContents[contentIdx].split('\n')[0].substring(0, 180) + "...",
        content: sampleContents[contentIdx],
        previewLines: 12,
        category: categories[i % categories.length],
        tags: ["Afrique", "Economie", categories[i % categories.length]],
        author: sampleAuthors[i % sampleAuthors.length].name,
        authorId: sampleAuthors[i % sampleAuthors.length].id,
        image: images[i % images.length],
        isPublished: true,
        isFeatured: i < 5,
        isSentinelle: i < 3,
        isEssor: i >=3 && i < 6,
        isOmbreDouce: i >=6 && i < 9,
        views: Math.floor(Math.random()*5000)+500,
        likes: Math.floor(Math.random()*400)+20,
        createdAt: new Date(now.getTime() - i*86400000).toISOString(),
        publishedAt: new Date(now.getTime() - i*86400000).toISOString(),
        language: "fr",
        hasAudio: true,
        audioUrl: "/audio/sample.mp3",
        readingTime: 5 + (i%5),
      });
    });
    changed = true;
  }

  if (db.magazines.length === 0) {
    for (let n=25; n>=1; n--) {
      const year = n>12 ? 2025 : (n>6 ? 2025 : 2026);
      const month = ((n-1) % 12)+1;
      db.magazines.push({
        id: uuidv4(),
        numero: n,
        title: `Envol Africa N°${n} - ${n===25 ? "Spécial Investissements 2026" : "L'Afrique qui gagne"}`,
        cover: `https://images.unsplash.com/photo-${n%2===0 ? "1543002588-bfa74002ed7e" : "1551288049-bebda4e38f71"}?w=600`,
        date: `${year}-${String(month).padStart(2,'0')}-01`,
        year,
        description: `Dans ce numéro ${n}, retrouvez notre grand dossier sur les transformations économiques du continent, des interviews exclusives et nos analyses pointues.`,
        previewPages: 5,
        formats: ["numerique","papier","cd_audio","audio_pdf","audio_papier"],
        languages: ["fr","en","es"],
        featured: n===25,
      });
    }
    changed = true;
  }

  if (changed) writeDB(db);
}

// initialize
seedIfEmpty();
