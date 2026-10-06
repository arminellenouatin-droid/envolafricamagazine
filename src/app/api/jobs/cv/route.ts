import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB } from "@/lib/jobs-db";
import { getR2Client } from "@/lib/storage/client";
import { getR2Config, isR2Configured } from "@/lib/storage/config";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const candidateId = request.nextUrl.searchParams.get("candidateId");
  if (!candidateId) return NextResponse.json({ error: "Candidat manquant." }, { status: 400 });

  const db = readJobsDB();
  const candidate = db.candidates.find((item) => item.id === candidateId);
  if (!candidate?.cvUrl) return NextResponse.json({ error: "CV indisponible." }, { status: 404 });

  const authorised = db.applications.some(
    (application) =>
      application.userId === candidate.createdBy &&
      db.offers.some((offer) => offer.id === application.offerId && offer.createdBy === user.id)
  );

  if (!authorised && user.role !== "admin" && candidate.createdBy !== user.id) {
    return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
  }

  // Si c'est stocké dans R2
  if (isR2Configured() && (candidate.cvUrl.startsWith("dev/") || candidate.cvUrl.startsWith("jobs/"))) {
    try {
      const r2 = getR2Client();
      const config = getR2Config();
      const getCmd = new GetObjectCommand({
        Bucket: config.R2_BUCKET_PRIVATE,
        Key: candidate.cvUrl,
      });
      const signedUrl = await getSignedUrl(r2, getCmd, { expiresIn: 300 });
      return NextResponse.redirect(signedUrl);
    } catch {
      // fallback to Supabase
    }
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return NextResponse.json({ error: "Stockage indisponible." }, { status: 503 });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.storage.from("jobs-cvs").createSignedUrl(candidate.cvUrl, 300);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Impossible d’ouvrir ce CV." }, { status: 502 });

  return NextResponse.redirect(data.signedUrl);
}
