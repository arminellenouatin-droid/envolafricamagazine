import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCurrentUserFromCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { target_type?: string; target_id?: string };
  const targetType = typeof body.target_type === "string" && body.target_type.length <= 40 ? body.target_type : "general";
  const shortCode = `AW${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  return NextResponse.json({ link: { id: crypto.randomUUID(), short_code: shortCode, target_type: targetType, target_id: body.target_id || null, clicks: 0, conversions: 0, owner_id: user.id } }, { status: 201 });
}
