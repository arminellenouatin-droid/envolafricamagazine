import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUserFromCookie } from "@/lib/auth";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const allowed = new Map<string, string>([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/gif", "gif"], ["image/avif", "avif"],
  ["video/mp4", "mp4"], ["video/webm", "webm"], ["video/quicktime", "mov"],
  ["audio/mpeg", "mp3"], ["audio/wav", "wav"], ["audio/ogg", "ogg"], ["audio/mp4", "m4a"], ["audio/webm", "weba"],
  ["application/pdf", "pdf"], ["application/msword", "doc"], ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/vnd.ms-excel", "xls"], ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["application/vnd.ms-powerpoint", "ppt"], ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
  ["text/csv", "csv"],
]);

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
  const extension = allowed.get(file.type);
  if (!extension || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Format non autorisé ou fichier supérieur à 50 Mo." }, { status: 400 });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return NextResponse.json({ error: "Le stockage WAB n’est pas encore configuré." }, { status: 503 });
  const path = `${user.id}/pending/${crypto.randomUUID()}.${extension}`;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.storage.from("wab-media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: "Impossible de téléverser ce média." }, { status: 502 });
  const { data: signed } = await supabase.storage.from("wab-media").createSignedUrl(path, 86400);
  return NextResponse.json({ path, mimeType: file.type, name: file.name, size: file.size, mediaUrl: signed?.signedUrl, requiresReview: true }, { status: 201 });
}
