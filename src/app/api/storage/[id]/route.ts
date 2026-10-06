import { NextResponse } from "next/server";
import { z } from "zod";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getR2Client } from "@/lib/storage/client";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // RÈGLE ABSOLUE N°8 : Les pièces jointes de la messagerie Marketplace ont valeur légale en cas de litige
  // Elles sont strictement inaltérables et non supprimables.
  if (object.module === "messaging" || (object.module === "marketplace" && object.kind === "attachment")) {
    return NextResponse.json(
      { error: "deletion_forbidden", message: "Les pièces jointes de messagerie ne peuvent pas être supprimées (valeur de preuve légale)." },
      { status: 403 }
    );
  }

  // Seul le propriétaire ou un administrateur peut supprimer
  if (object.owner_id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Suppression sur R2
  const s3 = getR2Client();
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: object.bucket,
        Key: object.key,
      })
    );
  } catch (err: any) {
    console.error("Erreur suppression R2 :", err.message);
  }

  // Marquage 'deleted' en base
  await supabase
    .from("storage_objects")
    .update({ status: "deleted" })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
