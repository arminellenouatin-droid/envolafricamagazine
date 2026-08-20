import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB, writeDB } from "@/lib/db";

const LANGUAGES = new Set(["fr", "en", "es", "sw", "fon", "wo", "ha", "yo", "ig", "ff", "zu", "ee"]);
const CURRENCIES = new Set(["XOF", "EUR", "USD", "NGN", "GHS", "KES"]);

export async function PUT(request: Request) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const decoded = token ? verifyToken(token) : null;
  if (!decoded?.id) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const lang = String(body.lang || "").toLowerCase();
  const currency = String(body.currency || "").toUpperCase();
  if (!LANGUAGES.has(lang)) return NextResponse.json({ error: "Langue non prise en charge." }, { status: 400 });
  if (!CURRENCIES.has(currency)) return NextResponse.json({ error: "Devise non prise en charge." }, { status: 400 });
  const client = getSupabaseAdmin();
  if (client) {
    const { data, error } = await client.from("users").update({ lang, preferred_language: lang, currency, preferred_currency: currency }).eq("id", decoded.id).select("id, lang, currency, preferred_language, preferred_currency").single();
    if (error) return NextResponse.json({ error: "Impossible d’enregistrer vos préférences." }, { status: 503 });
    return NextResponse.json({ preferences: data });
  }
  const db = readDB();
  const user = db.users.find((item) => item.id === decoded.id);
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  user.lang = lang; user.currency = currency; writeDB(db);
  return NextResponse.json({ preferences: { lang, currency } });
}
