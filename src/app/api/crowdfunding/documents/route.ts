import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "crowdfunding-documents";
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function extensionFor(file: File) {
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  };
  return byMime[file.type] || "bin";
}

async function canAccessProject(supabase: ReturnType<typeof getSupabaseAdmin>, projectId: string, user: { id: string; role?: string }) {
  if (!supabase) return false;
  if (user.role === "admin") return true;
  const { data: project } = await supabase.from("crowdfunding_projects").select("id,porteur_id").eq("id", projectId).maybeSingle();
  if (!project) return false;
  if (String(project.porteur_id) === String(user.id)) return true;
  const { data: contribution } = await supabase.from("crowdfunding_contributions").select("id").eq("projet_id", projectId).eq("investisseur_id", String(user.id)).limit(1).maybeSingle();
  return Boolean(contribution);
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Stockage indisponible." }, { status: 503 });
  const projetId = req.nextUrl.searchParams.get("projetId");
  if (!projetId) return NextResponse.json({ error: "Projet requis." }, { status: 400 });
  if (!(await canAccessProject(supabase, projetId, user))) return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });

  const { data, error } = await supabase.from("crowdfunding_documents").select("id,projet_id,user_id,type,nom,url,taille,mime_type,created_at,statut").eq("projet_id", projetId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Impossible de charger les documents." }, { status: 502 });
  const documents = await Promise.all((data || []).map(async (document) => {
    const signed = await supabase.storage.from(BUCKET).createSignedUrl(document.url, 300);
    return { ...document, url: signed.data?.signedUrl || null };
  }));
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Stockage indisponible." }, { status: 503 });

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const projetId = String(formData.get("projetId") || "");
    const type = String(formData.get("type") || "autre").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60) || "autre";
    if (!(file instanceof File) || !projetId) return NextResponse.json({ error: "Fichier et projetId requis." }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Format de document non autorisé." }, { status: 415 });
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Le fichier doit peser au maximum 25 Mo." }, { status: 413 });
    if (!(await canAccessProject(supabase, projetId, user))) return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });

    const path = `${user.id}/${projetId}/${type}/${crypto.randomUUID()}.${extensionFor(file)}`;
    const upload = await supabase.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (upload.error) return NextResponse.json({ error: "Impossible d’enregistrer le document sécurisé." }, { status: 502 });

    const { data: document, error } = await supabase.from("crowdfunding_documents").insert({
      id: crypto.randomUUID(),
      projet_id: projetId,
      user_id: String(user.id),
      type,
      nom: file.name,
      url: path,
      taille: file.size,
      mime_type: file.type,
      statut: "en_attente_verification",
    }).select("id,projet_id,user_id,type,nom,url,taille,mime_type,created_at,statut").single();
    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      return NextResponse.json({ error: "Impossible d’enregistrer la référence du document." }, { status: 502 });
    }
    const signed = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
    return NextResponse.json({ success: true, document: { ...document, url: signed.data?.signedUrl || null } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur upload document." }, { status: 500 });
  }
}
