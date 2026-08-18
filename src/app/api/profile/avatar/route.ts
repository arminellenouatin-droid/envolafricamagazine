import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { updateUserAvatar } from "@/lib/core-db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image trop volumineuse (5 Mo maximum)" }, { status: 400 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "Stockage de profil temporairement indisponible" }, { status: 503 });
    const bucket = "avatars";
    await supabase.storage.createBucket(bucket, { public: true }).catch(() => undefined);
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;
    const upload = await supabase.storage.from(bucket).upload(filePath, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true });
    if (upload.error) throw upload.error;
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const updatedUser = await updateUserAvatar(user.id, publicData.publicUrl);

    return NextResponse.json({ success: true, avatar: updatedUser.avatar });
  } catch (error) {
    console.error("Avatar upload error", error);
    return NextResponse.json({ error: "Impossible d’enregistrer la photo" }, { status: 500 });
  }
}
