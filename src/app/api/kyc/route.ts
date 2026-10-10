import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getKYCProfile, submitKYC } from "@/lib/kyc/kyc-service";
import type { SubmitKYCInput } from "@/lib/kyc/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const profile = await getKYCProfile(user.id);
    return NextResponse.json({
      success: true,
      profile: profile || {
        statut: "non_soumis",
        userId: user.id,
        nom: user.nom || "",
        prenom: user.prenom || "",
        userEmail: user.email,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur KYC" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  const rl = rateLimit(`kyc_submit:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de tentatives de soumission KYC. Patientez." }, { status: 429 });
  }

  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Veuillez vous connecter pour soumettre votre dossier KYC." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as SubmitKYCInput;
    const userFullName = `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;

    const profile = await submitKYC(
      user.id,
      user.email,
      userFullName,
      body,
      ip,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: "Dossier KYC transmis avec succès. Notre équipe de conformité procédera à la vérification sous 24h à 48h.",
      profile,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur de soumission KYC" }, { status: 400 });
  }
}
