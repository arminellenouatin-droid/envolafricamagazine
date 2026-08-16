import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

type FixtureUser = {
  nom: string; prenom: string; email: string; passwordHash: string; role: string; lang: string; currency: string;
  isVerified: boolean; twoFactorEnabled: boolean; country: string; affiliateCode: string; favorites: string[]; downloads: string[];
};
type FixtureArticle = Record<string, unknown>;
type FixtureMagazine = Record<string, unknown>;

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis");

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const fixturePath = path.join(process.cwd(), "src", "data", "db.json");
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as { articles: FixtureArticle[]; magazines: FixtureMagazine[] };

const testEmail = process.env.EAM_TEST_EMAIL || "audit.qa@envolafrica.test";
const configuredTestPassword = process.env.EAM_TEST_PASSWORD || "";
if (configuredTestPassword.length < 8) throw new Error("EAM_TEST_PASSWORD (8 caractères minimum) est requis");

async function main() {
  const articles = fixtures.articles.map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    content: article.content,
    preview_lines: article.previewLines ?? 12,
    category: article.category,
    tags: article.tags ?? [],
    author: article.author,
    author_id: article.authorId,
    image: article.image,
    images: article.images ?? [],
    is_published: article.isPublished ?? true,
    is_featured: article.isFeatured ?? false,
    is_sentinelle: article.isSentinelle ?? false,
    is_essor: article.isEssor ?? false,
    is_ombre_douce: article.isOmbreDouce ?? false,
    views: article.views ?? 0,
    likes: article.likes ?? 0,
    created_at: article.createdAt,
    published_at: article.publishedAt ?? article.createdAt,
    language: article.language ?? "fr",
    has_audio: article.hasAudio ?? false,
    audio_url: article.audioUrl ?? null,
    reading_time: article.readingTime ?? 5,
    is_video: article.isVideo ?? false,
    video_url: article.videoUrl ?? null,
  }));
  const magazines = fixtures.magazines.map((magazine) => ({
    id: magazine.id,
    numero: magazine.numero,
    title: magazine.title,
    cover: magazine.cover,
    date: magazine.date,
    year: magazine.year,
    description: magazine.description,
    preview_pages: magazine.previewPages ?? 5,
    formats: magazine.formats ?? [],
    languages: magazine.languages ?? [],
    featured: magazine.featured ?? false,
    price_overrides: magazine.priceOverrides ?? null,
  }));

  const { error: articlesError } = await supabase.from("articles").upsert(articles, { onConflict: "id" });
  if (articlesError) throw articlesError;
  const { error: magazinesError } = await supabase.from("magazines").upsert(magazines, { onConflict: "id" });
  if (magazinesError) throw magazinesError;

  const { data: existing, error: existingError } = await supabase.from("users").select("id,email").eq("email", testEmail).maybeSingle();
  if (existingError) throw existingError;
  let testUserId = existing?.id;
  if (!existing) {
    const now = new Date().toISOString();
    const user: FixtureUser = {
      nom: "QA",
      prenom: "EAM",
      email: testEmail,
      passwordHash: bcrypt.hashSync(configuredTestPassword, 10),
      role: "user",
      lang: "fr",
      currency: "XOF",
      isVerified: true,
      twoFactorEnabled: false,
      country: "BJ",
      affiliateCode: `QA${crypto.randomInt(100000, 999999)}`,
      favorites: [],
      downloads: [],
    };
    testUserId = crypto.randomUUID();
    const { error: userError } = await supabase.from("users").insert({ id: testUserId, nom: user.nom, prenom: user.prenom, email: user.email, password_hash: user.passwordHash, role: user.role, lang: user.lang, currency: user.currency, created_at: now, is_verified: user.isVerified, two_factor_enabled: user.twoFactorEnabled, country: user.country, affiliate_code: user.affiliateCode, favorites: user.favorites, downloads: user.downloads });
    if (userError) throw userError;
  }

  console.log(JSON.stringify({ seeded: { articles: articles.length, magazines: magazines.length }, testUser: { id: testUserId, email: testEmail, status: existing ? "already-existing" : "created" } }, null, 2));
}

void main();
