import { NextResponse } from "next/server";
import { z } from "zod";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getR2Client } from "@/lib/storage/client";
import { canReadObject } from "@/lib/storage/storage-policy";
import { publicUrl } from "@/lib/storage/resolve-url";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET(req: Request) {
  const user = await getCurrentUserFromCookie();
  const urlParams = new URL(req.url).searchParams;
  const id = urlParams.get("id");

  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400, headers: noStore });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "server_error" }, { status: 500, headers: noStore });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: object, error: dbError } = await supabase
    .from("storage_objects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (dbError || !object || object.status === "deleted") {
    return NextResponse.json({ error: "not_found" }, { status: 404, headers: noStore });
  }

  // Si l'objet est public, renvoyer l'URL publique directe
  if (object.visibility === "public") {
    return NextResponse.json({ url: publicUrl(object.key) }, { headers: noStore });
  }

  // Pour un objet privé : vérification stricte des droits
  const allowed = await canReadObject(user, object);
  if (!allowed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });
  }

  // Génération de l'URL signée temporaire (5 minutes)
  const s3 = getR2Client();
  const command = new GetObjectCommand({
    Bucket: object.bucket,
    Key: object.key,
    ResponseContentDisposition: "inline",
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return NextResponse.json(
    {
      url: signedUrl,
      expiresAt: Math.floor(Date.now() / 1000) + 300,
    },
    { headers: noStore }
  );
}
