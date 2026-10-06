import { NextResponse } from "next/server";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/live/agora/rate-limit";
import { getR2Config } from "@/lib/storage/config";
import { getR2Client } from "@/lib/storage/client";
import { MODULE_RULES, STORAGE_MODULES, STORAGE_KINDS, type StorageModule, type StorageKind } from "@/lib/storage/storage-rules";
import { generateStorageKey } from "@/lib/storage/keys";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const presignSchema = z
  .object({
    module: z.enum(STORAGE_MODULES),
    kind: z.enum(STORAGE_KINDS),
    contentType: z.string().min(3).max(64),
    size: z.number().int().positive().max(200 * 1024 * 1024), // Max 200 Mo absolu
    refType: z.string().max(64).optional(),
    refId: z.string().max(64).optional(),
  })
  .strict();

export async function POST(req: Request) {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Rate limit : 60 présignatures par minute par utilisateur
  if (!rateLimit(`storage-presign:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", details: parsed.error.issues }, { status: 400 });
  }

  const { module, kind, contentType, size, refType, refId } = parsed.data;

  // 1. Validation de la règle du module
  const rule = MODULE_RULES[module as StorageModule]?.[kind as StorageKind];
  if (!rule) {
    return NextResponse.json({ error: "module_kind_not_supported" }, { status: 400 });
  }

  if (!rule.allowedMimes.includes(contentType)) {
    return NextResponse.json({ error: "unsupported_media_type" }, { status: 400 });
  }

  if (size > rule.maxSizeBytes) {
    return NextResponse.json({ error: "file_too_large", maxSizeBytes: rule.maxSizeBytes }, { status: 400 });
  }

  const config = getR2Config();
  const bucket = rule.visibility === "public" ? config.R2_BUCKET_PUBLIC : config.R2_BUCKET_PRIVATE;

  // 2. Vérification du quota global R2
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let objectId = crypto.randomUUID();

  if (supabaseUrl && serviceKey) {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: usage } = await supabase
      .from("storage_objects")
      .select("bytes")
      .in("status", ["pending", "ready"]);

    const currentTotal = (usage ?? []).reduce((acc, row) => acc + Number(row.bytes || 0), 0);
    if (currentTotal + size > config.R2_SOFT_LIMIT_BYTES) {
      return NextResponse.json(
        { error: "storage_quota_exceeded", message: "Le quota de stockage de la plateforme est atteint." },
        { status: 507 }
      );
    }

    // 3. Génération de la clé et enregistrement de l'objet en 'pending'
    const key = generateStorageKey({
      prefix: config.R2_KEY_PREFIX,
      module: module as StorageModule,
      ownerId: user.id,
      contentType,
    });

    const { data: inserted, error: dbError } = await supabase
      .from("storage_objects")
      .insert({
        id: objectId,
        owner_id: user.id,
        module,
        kind,
        visibility: rule.visibility,
        bucket,
        key,
        content_type: contentType,
        bytes: size,
        status: "pending",
        ref_type: refType || null,
        ref_id: refId || null,
      })
      .select("id")
      .single();

    if (dbError) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    objectId = inserted.id;

    // 4. Génération de l'URL présignée PUT (5 minutes)
    const s3 = getR2Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return NextResponse.json({
      id: objectId,
      uploadUrl,
      key,
      visibility: rule.visibility,
      expiresInSeconds: 300,
    });
  }

  // Fallback dev si Supabase n'est pas configuré
  const key = generateStorageKey({
    prefix: config.R2_KEY_PREFIX,
    module: module as StorageModule,
    ownerId: user.id,
    contentType,
  });

  const s3 = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return NextResponse.json({
    id: objectId,
    uploadUrl,
    key,
    visibility: rule.visibility,
    expiresInSeconds: 300,
  });
}
