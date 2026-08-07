/**
 * Migrate JSON db (src/data/db.json) to Supabase Postgres via REST
 * Usage:
 *   SUPABASE_URL=https://rtfjwpytiuvoekomevpu.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
 *   node scripts/migrate-to-supabase.js
 * 
 * This script reads src/data/db.json and upserts into Supabase tables.
 * Run it from local machine with internet, or from Vercel build (with env).
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL || "https://rtfjwpytiuvoekomevpu.supabase.co";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!SERVICE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY manquant. Récupère-le dans Supabase Dashboard > Settings > API Keys > secret key (sb_secret_...)");
    process.exit(1);
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const dbPath = path.join(__dirname, '../src/data/db.json');
  if (!fs.existsSync(dbPath)) {
    console.error("❌ db.json introuvable", dbPath);
    process.exit(1);
  }
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  console.log(`📦 Migration de ${db.users.length} users, ${db.articles.length} articles, ${db.magazines.length} magazines, ${db.orders.length} orders...`);

  // Users
  if (db.users.length) {
    const usersForSupabase = db.users.map(u => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      password_hash: u.passwordHash,
      role: u.role,
      lang: u.lang,
      currency: u.currency,
      created_at: u.createdAt,
      is_verified: u.isVerified,
      two_factor_enabled: u.twoFactorEnabled,
      country: u.country,
      phone: u.phone,
      affiliate_code: u.affiliateCode,
      referred_by: u.referredBy || null,
      subscription: u.subscription || null,
      favorites: u.favorites || [],
      downloads: u.downloads || [],
    }));
    const { error } = await supabase.from('users').upsert(usersForSupabase, { onConflict: 'id' });
    if (error) console.error("users error", error);
    else console.log("✅ users migrés");
  }

  // Articles
  if (db.articles.length) {
    const arts = db.articles.map(a => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      content: a.content,
      preview_lines: a.previewLines,
      category: a.category,
      tags: a.tags,
      author: a.author,
      author_id: a.authorId,
      image: a.image,
      images: a.images || [],
      is_published: a.isPublished,
      is_featured: a.isFeatured,
      is_sentinelle: a.isSentinelle,
      is_essor: a.isEssor,
      is_ombre_douce: a.isOmbreDouce,
      views: a.views,
      likes: a.likes,
      created_at: a.createdAt,
      published_at: a.publishedAt,
      language: a.language,
      has_audio: a.hasAudio,
      audio_url: a.audioUrl,
      reading_time: a.readingTime,
      is_video: a.isVideo || false,
      video_url: a.videoUrl || null,
    }));
    const { error } = await supabase.from('articles').upsert(arts, { onConflict: 'id' });
    if (error) console.error("articles error", error);
    else console.log("✅ articles migrés");
  }

  // Magazines
  if (db.magazines.length) {
    const mags = db.magazines.map(m => ({
      id: m.id,
      numero: m.numero,
      title: m.title,
      cover: m.cover,
      date: m.date,
      year: m.year,
      description: m.description,
      preview_pages: m.previewPages,
      formats: m.formats,
      languages: m.languages,
      featured: m.featured,
      price_overrides: m.priceOverrides || null,
    }));
    const { error } = await supabase.from('magazines').upsert(mags, { onConflict: 'id' });
    if (error) console.error("magazines error", error);
    else console.log("✅ magazines migrés");
  }

  // Orders
  if (db.orders.length) {
    const orders = db.orders.map(o => ({
      id: o.id,
      user_id: o.userId,
      items: o.items,
      total: o.total,
      currency: o.currency,
      status: o.status,
      payment_id: o.paymentId || null,
      affiliate_code: o.affiliateCode || null,
      shipping_country: o.shippingCountry || null,
      shipping_cost: o.shippingCost || 0,
      created_at: o.createdAt,
      paid_at: o.paidAt || null,
    }));
    const { error } = await supabase.from('orders').upsert(orders, { onConflict: 'id' });
    if (error) console.error("orders error", error);
    else console.log("✅ orders migrés");
  }

  // Affiliate earnings
  if (db.affiliateEarnings.length) {
    const earns = db.affiliateEarnings.map(e => ({
      id: e.id,
      affiliate_id: e.affiliateId,
      order_id: e.orderId,
      amount: e.amount,
      commission: e.commission,
      rate: e.rate,
      status: e.status,
      created_at: e.createdAt,
    }));
    const { error } = await supabase.from('affiliate_earnings').upsert(earns, { onConflict: 'id' });
    if (error) console.error("affiliate error", error);
    else console.log("✅ affiliate earnings migrés");
  }

  // Donations
  if (db.donations.length) {
    const dons = db.donations.map(d => ({
      id: d.id,
      user_id: d.userId,
      amount: d.amount,
      currency: d.currency,
      email: d.email,
      message: d.message || null,
      payment_id: d.paymentId || null,
      status: d.status,
      created_at: d.createdAt,
    }));
    const { error } = await supabase.from('donations').upsert(dons, { onConflict: 'id' });
    if (error) console.error("donations error", error);
    else console.log("✅ donations migrés");
  }

  console.log("🎉 Migration terminée !");
}

main().catch(e => { console.error(e); process.exit(1); });
