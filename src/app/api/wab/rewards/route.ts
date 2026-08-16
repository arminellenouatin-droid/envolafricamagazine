import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB } from "@/lib/wab-db";
export async function GET() { const user = await getCurrentUserFromCookie(); if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 }); const rewards = readWabDB().rewards.filter((reward) => reward.userId === user.id); const totals = rewards.reduce<Record<string, number>>((total, reward) => ({ ...total, [reward.status]: (total[reward.status] ?? 0) + reward.amount }), {}); return NextResponse.json({ rewards, totals }); }
