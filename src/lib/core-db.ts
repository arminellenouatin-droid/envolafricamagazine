import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isProductionRuntime } from "@/lib/supabase-admin";
import {
  getArticleBySlug as getJsonArticleBySlug,
  getMagazineById as getJsonMagazineById,
  getUserByEmail as getJsonUserByEmail,
  getUserById as getJsonUserById,
  readDB,
  writeDB,
  type Article,
  type Magazine,
  type Order,
  type User,
} from "@/lib/db";

export class ProductionDatabaseNotConfiguredError extends Error {
  constructor() {
    super("La base de production n’est pas configurée. Définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.");
    this.name = "ProductionDatabaseNotConfiguredError";
  }
}

function getAdminClient() {
  const client = getSupabaseAdmin();
  if (!client && isProductionRuntime()) throw new ProductionDatabaseNotConfiguredError();
  return client;
}

function getPublicClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

function canUseJsonFallback() {
  return !isProductionRuntime();
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    nom: String(row.nom ?? ""),
    prenom: String(row.prenom ?? ""),
    email: String(row.email ?? ""),
    passwordHash: String(row.password_hash ?? row.passwordHash ?? ""),
    role: String(row.role ?? "user"),
    avatar: typeof row.avatar === "string" ? row.avatar : undefined,
    lang: String(row.lang ?? row.preferred_language ?? "fr"),
    currency: String(row.currency ?? row.preferred_currency ?? "XOF"),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    isVerified: Boolean(row.is_verified ?? true),
    twoFactorEnabled: Boolean(row.two_factor_enabled ?? false),
    company: typeof row.company === "string" ? row.company : (typeof row.company_name === "string" ? row.company_name : undefined),
    country: String(row.country ?? "BJ"),
    phone: typeof row.phone === "string" ? row.phone : undefined,
    affiliateCode: String(row.affiliate_code ?? ""),
    affiliateAccepted: Boolean(row.affiliate_accepted ?? false),
    referredBy: typeof row.referred_by === "string" ? row.referred_by : undefined,
    subscription: row.subscription && typeof row.subscription === "object" ? row.subscription as User["subscription"] : undefined,
    favorites: Array.isArray(row.favorites) ? row.favorites.map(String) : [],
    downloads: Array.isArray(row.downloads) ? row.downloads.map(String) : [],
  };
}

function mapArticle(row: Record<string, unknown>): Article {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title ?? ""),
    summary: String(row.summary ?? ""),
    content: String(row.content ?? ""),
    previewLines: Number(row.preview_lines ?? 12),
    category: String(row.category ?? ""),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    author: String(row.author ?? ""),
    authorId: String(row.author_id ?? ""),
    image: String(row.image ?? ""),
    images: Array.isArray(row.images) ? row.images.map(String) : [],
    isPublished: Boolean(row.is_published ?? true),
    isEncrypted: Boolean(row.is_encrypted ?? true),
    isFeatured: Boolean(row.is_featured ?? false),
    isSentinelle: Boolean(row.is_sentinelle ?? false),
    isEssor: Boolean(row.is_essor ?? false),
    isOmbreDouce: Boolean(row.is_ombre_douce ?? false),
    views: Number(row.views ?? 0),
    likes: Number(row.likes ?? 0),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    publishedAt: row.published_at ? String(row.published_at) : undefined,
    language: String(row.language ?? "fr"),
    hasAudio: Boolean(row.has_audio ?? false),
    audioUrl: typeof row.audio_url === "string" ? row.audio_url : undefined,
    readingTime: Number(row.reading_time ?? 5),
    isVideo: Boolean(row.is_video ?? false),
    videoUrl: typeof row.video_url === "string" ? row.video_url : undefined,
  };
}

function mapMagazine(row: Record<string, unknown>): Magazine {
  return {
    id: String(row.id),
    numero: Number(row.numero),
    title: String(row.title ?? ""),
    cover: String(row.cover ?? ""),
    coverBack: typeof row.cover_back === "string" ? row.cover_back : undefined,
    date: row.date ? String(row.date).slice(0, 10) : "",
    year: Number(row.year ?? new Date().getFullYear()),
    description: String(row.description ?? ""),
    previewPages: Number(row.preview_pages ?? 5),
    previewImages: Array.isArray(row.preview_images) ? row.preview_images.map(String) : undefined,
    pdfs: row.pdfs && typeof row.pdfs === "object" ? row.pdfs as Record<string, string> : undefined,
    prices: row.prices && typeof row.prices === "object" ? row.prices as Record<string, number> : undefined,
    formats: Array.isArray(row.formats) ? row.formats.map(String) : [],
    languages: Array.isArray(row.languages) ? row.languages.map(String) : [],
    featured: Boolean(row.featured ?? false),
    priceOverrides: row.price_overrides && typeof row.price_overrides === "object" ? row.price_overrides as Record<string, number> : undefined,
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const client = getAdminClient();
  if (!client) return canUseJsonFallback() ? getJsonUserByEmail(email) ?? null : null;
  const { data, error } = await client.from("users").select("*").ilike("email", email).maybeSingle();
  if (error) throw error;
  return data ? mapUser(data as Record<string, unknown>) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const client = getAdminClient();
  if (!client) return canUseJsonFallback() ? getJsonUserById(id) ?? null : null;
  const { data, error } = await client.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapUser(data as Record<string, unknown>) : null;
}

export async function createUser(input: Omit<User, "id" | "createdAt">): Promise<User> {
  const client = getAdminClient();
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  if (!client) {
    if (!canUseJsonFallback()) throw new ProductionDatabaseNotConfiguredError();
    const db = readDB();
    const newUser: User = { ...input, id, createdAt };
    db.users.push(newUser);
    writeDB(db);
    return newUser;
  }
  const { data, error } = await client.from("users").insert({
    id,
    nom: input.nom,
    prenom: input.prenom,
    email: input.email,
    password_hash: input.passwordHash,
    role: input.role,
    avatar: input.avatar ?? null,
    lang: input.lang,
    currency: input.currency,
    created_at: createdAt,
    is_verified: input.isVerified,
    two_factor_enabled: input.twoFactorEnabled,
    company: input.company ?? null,
    country: input.country,
    phone: input.phone ?? null,
    affiliate_code: input.affiliateCode,
    affiliate_accepted: input.affiliateAccepted ?? false,
    referred_by: input.referredBy ?? null,
    subscription: input.subscription ?? null,
    favorites: input.favorites,
    downloads: input.downloads,
  }).select("*").single();
  if (error) throw error;
  return mapUser(data as Record<string, unknown>);
}

export async function updateUserAvatar(userId: string, avatar: string | null): Promise<User> {
  const client = getAdminClient();
  if (!client) {
    if (!canUseJsonFallback()) throw new ProductionDatabaseNotConfiguredError();
    const db = readDB();
    const user = db.users.find((item) => item.id === userId);
    if (!user) throw new Error("Utilisateur introuvable");
    user.avatar = avatar || undefined;
    writeDB(db);
    return user;
  }
  const { data, error } = await client.from("users").update({ avatar: avatar || null }).eq("id", userId).select("*").single();
  if (error) throw error;
  return mapUser(data as Record<string, unknown>);
}

export async function listPublishedArticles(): Promise<Article[]> {
  const client = getPublicClient();
  if (!client) return canUseJsonFallback() ? readDB().articles.filter((article) => article.isPublished) : [];
  const { data, error } = await client.from("articles").select("*").eq("is_published", true).order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapArticle(row as Record<string, unknown>));
}

export async function findArticleBySlug(slug: string): Promise<Article | null> {
  const client = getPublicClient();
  if (!client) return canUseJsonFallback() ? getJsonArticleBySlug(slug) ?? null : null;
  const { data, error } = await client.from("articles").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? mapArticle(data as Record<string, unknown>) : null;
}

export async function listMagazines(): Promise<Magazine[]> {
  const client = getPublicClient();
  if (!client) return canUseJsonFallback() ? readDB().magazines : [];
  const { data, error } = await client.from("magazines").select("*").order("numero", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapMagazine(row as Record<string, unknown>));
}

export async function findMagazineById(id: string): Promise<Magazine | null> {
  const client = getPublicClient();
  if (!client) return canUseJsonFallback() ? getJsonMagazineById(id) ?? null : null;
  const { data, error } = await client.from("magazines").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapMagazine(data as Record<string, unknown>) : null;
}

export async function createPendingOrder(input: Omit<Order, "createdAt">): Promise<Order> {
  const client = getAdminClient();
  const createdAt = new Date().toISOString();
  if (!client) {
    if (!canUseJsonFallback()) throw new ProductionDatabaseNotConfiguredError();
    const db = readDB();
    const order = { ...input, createdAt };
    db.orders.push(order);
    writeDB(db);
    return order;
  }
  const { data, error } = await client.from("orders").insert({
    id: input.id,
    user_id: input.userId,
    items: input.items,
    total: input.total,
    currency: input.currency,
    status: input.status,
    payment_id: input.paymentId ?? null,
    affiliate_code: input.affiliateCode ?? null,
    shipping_country: input.shippingCountry ?? null,
    shipping_cost: input.shippingCost ?? 0,
    created_at: createdAt,
  }).select("*").single();
  if (error) throw error;
  return { ...input, createdAt: String((data as Record<string, unknown>).created_at ?? createdAt) };
}

export async function findOrderById(id: string): Promise<Order | null> {
  const client = getAdminClient();
  if (!client) return canUseJsonFallback() ? readDB().orders.find((order) => order.id === id) ?? null : null;
  const { data, error } = await client.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id), userId: String(row.user_id), items: Array.isArray(row.items) ? row.items as Order["items"] : [], total: Number(row.total), currency: String(row.currency ?? "XOF"), status: String(row.status ?? "pending") as Order["status"], paymentId: typeof row.payment_id === "string" ? row.payment_id : undefined, affiliateCode: typeof row.affiliate_code === "string" ? row.affiliate_code : undefined, shippingCountry: typeof row.shipping_country === "string" ? row.shipping_country : undefined, shippingCost: Number(row.shipping_cost ?? 0), createdAt: String(row.created_at), paidAt: row.paid_at ? String(row.paid_at) : undefined,
  };
}

export async function attachPaymentToOrder(orderId: string, paymentId: string): Promise<void> {
  const client = getAdminClient();
  if (!client) {
    if (!canUseJsonFallback()) throw new ProductionDatabaseNotConfiguredError();
    const db = readDB();
    const order = db.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("Commande introuvable");
    order.paymentId = paymentId;
    writeDB(db);
    return;
  }
  const { error } = await client.from("orders").update({ payment_id: paymentId }).eq("id", orderId);
  if (error) throw error;
}

export async function updateUserSubscription(userId: string, subscription: NonNullable<User["subscription"]>): Promise<void> {
  const client = getAdminClient();
  if (!client) {
    if (!canUseJsonFallback()) throw new ProductionDatabaseNotConfiguredError();
    const db = readDB();
    const user = db.users.find((item) => item.id === userId);
    if (!user) throw new Error("Utilisateur introuvable");
    user.subscription = subscription;
    if (user.role === "user") user.role = "subscriber";
    writeDB(db);
    return;
  }
  const { error } = await client.from("users").update({ subscription, role: "subscriber" }).eq("id", userId);
  if (error) throw error;
}

export type PaymentConfirmation = { providerRef: string; amount: number; currency: string; payload: Record<string, unknown> };

export async function confirmOrderPayment(order: Order, confirmation: PaymentConfirmation): Promise<Order> {
  if (confirmation.amount !== order.total || confirmation.currency.toUpperCase() !== order.currency.toUpperCase()) {
    throw new Error("Le montant ou la devise du paiement ne correspond pas à la commande");
  }

  const client = getAdminClient();
  const paidAt = new Date().toISOString();
  if (!client) {
    if (!canUseJsonFallback()) throw new ProductionDatabaseNotConfiguredError();
    const db = readDB();
    const writableDb = db as typeof db & { payments?: Array<Record<string, unknown>> };
    const current = db.orders.find((item) => item.id === order.id);
    if (!current) throw new Error("Commande introuvable");
    if (current.status !== "paid") {
      current.status = "paid";
      current.paymentId = confirmation.providerRef;
      current.paidAt = paidAt;
      writableDb.payments = writableDb.payments ?? [];
      const payments = writableDb.payments;
      if (!payments.some((payment) => payment.provider_ref === confirmation.providerRef)) payments.push({ id: uuidv4(), order_id: current.id, provider: "moneroo", provider_ref: confirmation.providerRef, amount: confirmation.amount, currency: confirmation.currency, status: "confirme", webhook_signature_verified: true, raw_webhook_payload: confirmation.payload, created_at: paidAt });
      writeDB(db);
    }
    return current;
  }

  const { data: existingPayment, error: paymentLookupError } = await client.from("payments").select("id,order_id,status").eq("provider_ref", confirmation.providerRef).maybeSingle();
  if (paymentLookupError) throw paymentLookupError;
  if (existingPayment?.status === "confirme") return { ...order, status: "paid", paymentId: confirmation.providerRef, paidAt };

  const paymentPayload = { order_id: order.id, provider: "moneroo", provider_ref: confirmation.providerRef, amount: confirmation.amount, currency: confirmation.currency, status: "confirme", webhook_signature_verified: true, raw_webhook_payload: confirmation.payload };
  const paymentWrite = existingPayment
    ? await client.from("payments").update(paymentPayload).eq("id", existingPayment.id)
    : await client.from("payments").insert({ id: uuidv4(), ...paymentPayload, created_at: paidAt });
  if (paymentWrite.error) throw paymentWrite.error;
  const { error: orderError } = await client.from("orders").update({ status: "paid", payment_id: confirmation.providerRef, paid_at: paidAt }).eq("id", order.id).neq("status", "paid");
  if (orderError) throw orderError;
  return { ...order, status: "paid", paymentId: confirmation.providerRef, paidAt };
}

export async function recordDonation(input: { order: Order; paymentId: string; email?: string }): Promise<void> {
  const donItem = input.order.items.find((item) => item.type === "don");
  if (!donItem) return;
  const client = getAdminClient();
  if (!client) {
    if (!canUseJsonFallback()) throw new ProductionDatabaseNotConfiguredError();
    const db = readDB();
    if (!db.donations.some((donation) => donation.paymentId === input.paymentId)) {
      db.donations.push({ id: uuidv4(), userId: input.order.userId === "guest" ? undefined : input.order.userId, amount: donItem.amount ?? donItem.price, currency: input.order.currency, email: input.email ?? "", status: "paid", createdAt: new Date().toISOString(), paymentId: input.paymentId });
      writeDB(db);
    }
    return;
  }
  const { data: existing } = await client.from("donations").select("id").eq("payment_id", input.paymentId).maybeSingle();
  if (existing) return;
  const { error } = await client.from("donations").insert({ id: uuidv4(), user_id: input.order.userId === "guest" ? null : input.order.userId, amount: donItem.amount ?? donItem.price, currency: input.order.currency, email: input.email ?? null, status: "paid", payment_id: input.paymentId });
  if (error) throw error;
}


export async function findOrderByPaymentId(paymentId: string): Promise<Order | null> {
  const client = getAdminClient();
  if (!client) {
    if (!canUseJsonFallback()) return null;
    return readDB().orders.find((order) => order.paymentId === paymentId) ?? null;
  }
  const { data, error } = await client.from("orders").select("*").eq("payment_id", paymentId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id), userId: String(row.user_id), items: Array.isArray(row.items) ? row.items as Order["items"] : [], total: Number(row.total), currency: String(row.currency ?? "XOF"), status: String(row.status ?? "pending") as Order["status"], paymentId: typeof row.payment_id === "string" ? row.payment_id : undefined, affiliateCode: typeof row.affiliate_code === "string" ? row.affiliate_code : undefined, shippingCountry: typeof row.shipping_country === "string" ? row.shipping_country : undefined, shippingCost: Number(row.shipping_cost ?? 0), createdAt: String(row.created_at), paidAt: row.paid_at ? String(row.paid_at) : undefined,
  };
}

export async function markOrderFailed(orderId: string, paymentId?: string): Promise<void> {
  const client = getAdminClient();
  if (!client) {
    if (!canUseJsonFallback()) throw new ProductionDatabaseNotConfiguredError();
    const db = readDB();
    const order = db.orders.find((item) => item.id === orderId);
    if (!order || order.status === "paid") return;
    order.status = "failed";
    if (paymentId) order.paymentId = paymentId;
    writeDB(db);
    return;
  }
  const { error } = await client.from("orders").update({ status: "failed", payment_id: paymentId ?? undefined }).eq("id", orderId).neq("status", "paid");
  if (error) throw error;
}


export async function listOrders(userId?: string): Promise<Order[]> {
  const client = getAdminClient();
  if (!client) {
    if (!canUseJsonFallback()) throw new ProductionDatabaseNotConfiguredError();
    const orders = readDB().orders.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return userId ? orders.filter((order) => order.userId === userId) : orders;
  }
  let query = client.from("orders").select("*").order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => {
    const item = row as Record<string, unknown>;
    return { id: String(item.id), userId: String(item.user_id), items: Array.isArray(item.items) ? item.items as Order["items"] : [], total: Number(item.total), currency: String(item.currency ?? "XOF"), status: String(item.status ?? "pending") as Order["status"], paymentId: typeof item.payment_id === "string" ? item.payment_id : undefined, affiliateCode: typeof item.affiliate_code === "string" ? item.affiliate_code : undefined, shippingCountry: typeof item.shipping_country === "string" ? item.shipping_country : undefined, shippingCost: Number(item.shipping_cost ?? 0), createdAt: String(item.created_at), paidAt: item.paid_at ? String(item.paid_at) : undefined };
  });
}

export async function updateUserFavorites(userId: string, favorites: string[]): Promise<string[]> {
  const client = getAdminClient();
  const normalized = Array.from(new Set(favorites.map(String))).slice(0, 500);
  if (!client) {
    if (!canUseJsonFallback()) throw new ProductionDatabaseNotConfiguredError();
    const db = readDB();
    const user = db.users.find((item) => item.id === userId);
    if (!user) throw new Error("Utilisateur introuvable");
    user.favorites = normalized;
    writeDB(db);
    return normalized;
  }
  const { data, error } = await client.from("users").update({ favorites: normalized }).eq("id", userId).select("favorites").single();
  if (error) throw error;
  return Array.isArray(data?.favorites) ? data.favorites.map(String) : normalized;
}
