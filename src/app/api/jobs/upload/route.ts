import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUserFromCookie } from "@/lib/auth";

const allowed = new Map<string, string>([["application/pdf", "pdf"], ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"]]);

export async function POST(request: NextRequest) {
 const user = await getCurrentUserFromCookie(); if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
 const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY; const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL; if (!serviceKey || !url) return NextResponse.json({ error: "Le stockage CV n’est pas encore configuré." }, { status: 503 });
 const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant." }, { status: 400 }); if (!allowed.has(file.type) || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Seuls les CV PDF ou DOCX de 10 Mo maximum sont acceptés." }, { status: 400 });
 const extension = allowed.get(file.type)!; const path = `${user.id}/${crypto.randomUUID()}.${extension}`; const supabase = createClient(url, serviceKey, { auth: { persistSession: false } }); const { error } = await supabase.storage.from("jobs-cvs").upload(path, file, { contentType: file.type, upsert: false }); if (error) return NextResponse.json({ error: "Impossible d’enregistrer le CV." }, { status: 502 }); return NextResponse.json({ path }, { status: 201 });
}
