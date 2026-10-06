import { NextResponse } from "next/server";
import { z } from "zod";
import { HeadObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getR2Client } from "@/lib/storage/client";
import { isValidBinaryContent } from "@/lib/storage/magic-bytes";
import { publicUrl } from "@/lib/storage/resolve-url";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const confirmSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export async function POST(req: Request) {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { id } = parsed.data;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: object, error: dbError } = await supabase
    .from("storage_objects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (dbError || !object) {
    return NextResponse.json({ error: "object_not_found" }, { status: 404 });
  }

  if (object.owner_id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const s3 = getR2Client();

  // 1. Vérification HeadObject (l'objet existe bien sur R2)
  let headRes;
  try {
    headRes = await s3.send(
      new HeadObjectCommand({
        Bucket: object.bucket,
        Key: object.key,
      })
    );
  } catch {
    return NextResponse.json({ error: "file_not_found_in_storage" }, { status: 404 });
  }

  // 2. Vérification de la signature binaire réelle (Magic Bytes) sur les premiers octets
  try {
    const rangeRes = await s3.send(
      new GetObjectCommand({
        Bucket: object.bucket,
        Key: object.key,
        Range: "bytes=0-511",
      })
    );

    const stream = rangeRes.Body;
    const chunks: Uint8Array[] = [];
    if (stream) {
      // @ts-expect-error async iterator
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
    }
    const headerBuffer = Buffer.concat(chunks);

    const isValid = isValidBinaryContent(headerBuffer, object.content_type);
    if (!isValid) {
      // Nettoyage immédiat de l'objet suspect sur R2
      await s3.send(new DeleteObjectCommand({ Bucket: object.bucket, Key: object.key }));
      await supabase
        .from("storage_objects")
        .update({ status: "deleted" })
        .eq("id", id);

      return NextResponse.json(
        { error: "invalid_file_signature", message: "Le contenu réel du fichier ne correspond pas au format déclaré." },
        { status: 422 }
      );
    }
  } catch (err: any) {
    console.error("Erreur vérification binaire :", err.message);
  }

  // 3. Application du Cache-Control immutable sur les objets publics
  if (object.visibility === "public") {
    try {
      await s3.send(
        new CopyObjectCommand({
          Bucket: object.bucket,
          CopySource: `${object.bucket}/${object.key}`,
          Key: object.key,
          MetadataDirective: "REPLACE",
          ContentType: object.content_type,
          CacheControl: "public, max-age=31536000, immutable",
        })
      );
    } catch {
      // Non bloquant si R2 rejette le self-copy
    }
  }

  // 4. Validation finale dans la base
  const actualBytes = headRes.ContentLength || object.bytes;
  await supabase
    .from("storage_objects")
    .update({
      status: "ready",
      bytes: actualBytes,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({
    ok: true,
    id: object.id,
    key: object.key,
    visibility: object.visibility,
    publicUrl: object.visibility === "public" ? publicUrl(object.key) : undefined,
  });
}
