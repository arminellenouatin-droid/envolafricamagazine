import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { updateUserAvatar } from "@/lib/core-db";

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

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const fileName = `${user.id}-${Date.now()}.${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));
    const avatar = `/uploads/avatars/${fileName}`;
    const updatedUser = await updateUserAvatar(user.id, avatar);

    return NextResponse.json({ success: true, avatar: updatedUser.avatar });
  } catch (error) {
    console.error("Avatar upload error", error);
    return NextResponse.json({ error: "Impossible d’enregistrer la photo" }, { status: 500 });
  }
}
