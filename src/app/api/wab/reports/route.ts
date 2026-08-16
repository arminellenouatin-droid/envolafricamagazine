import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function POST(request: NextRequest) { const user = await getCurrentUserFromCookie(); if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 }); const { targetType, targetId, reason } = await request.json(); if (!["post", "profile"].includes(targetType) || typeof targetId !== "string" || typeof reason !== "string" || !reason.trim()) return NextResponse.json({ error: "Signalement invalide." }, { status: 400 }); const db = readWabDB(); db.reports.push({ id: uuid(), targetType, targetId, reporterId: user.id, reason: reason.trim().slice(0, 500), status: "open", createdAt: new Date().toISOString() }); writeWabDB(db); return NextResponse.json({ ok: true }, { status: 201 }); }
