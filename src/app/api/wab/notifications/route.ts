import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";
export async function GET() { const user = await getCurrentUserFromCookie(); if (!user) return NextResponse.json({ notifications: [] }); const notifications = readWabDB().notifications.filter((item) => item.userId === user.id).slice(0, 30); return NextResponse.json({ notifications }); }
export async function PATCH() { const user = await getCurrentUserFromCookie(); if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 }); const db = readWabDB(); db.notifications.forEach((item) => { if (item.userId === user.id && !item.readAt) item.readAt = new Date().toISOString(); }); writeWabDB(db); return NextResponse.json({ ok: true }); }
