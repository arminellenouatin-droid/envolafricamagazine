import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

function isWithinWindow(start?: string | null, end?: string | null) {
  const now = Date.now();
  if (start && now < new Date(start).getTime()) return false;
  if (end && now > new Date(end).getTime()) return false;
  return true;
}

export async function GET(req: NextRequest) {
  const searchParams = new URL(req.url).searchParams;
  const competitionId = searchParams.get("competition_id");
  const isAdminList = searchParams.get("admin") === "1";
  const admin = isAdminList ? await getCurrentUserFromCookie() : null;
  if (isAdminList) {
    if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return NextResponse.json({ error: "Base Awards temporairement indisponible" }, { status: 503 });
    let query = supabaseAdmin.from("awards_applications").select("id,competition_id,applicant_id,display_name,phone,bio,project_description,video_url,identity_data,business_data,custom_fields,status,submitted_at,reviewed_at").order("submitted_at", { ascending: false }).limit(100);
    if (competitionId) query = query.eq("competition_id", competitionId);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ applications: data ?? [] });
  }
  if (!competitionId) return NextResponse.json({ error: "competition_id requis" }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base Awards temporairement indisponible" }, { status: 503 });
  const [{ data: config, error: configError }, { data: fields, error: fieldsError }] = await Promise.all([
    supabase.from("awards_registration_configs").select("competition_id,form_mode,registration_fee_xof,currency,registrations_start_at,registrations_end_at,voting_start_at,voting_end_at,initial_prize_pool_xof,min_pool_contribution_xof,min_donation_xof").eq("competition_id", competitionId).limit(1).maybeSingle(),
    supabase.from("awards_registration_fields").select("id,field_key,label,field_type,is_required,options,sort_order").eq("competition_id", competitionId).order("sort_order", { ascending: true }).limit(100),
  ]);
  if (configError || fieldsError) return NextResponse.json({ error: configError?.message || fieldsError?.message }, { status: 500 });
  return NextResponse.json({ config, fields: fields ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour déposer une candidature" }, { status: 401 });
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Payload invalide" }, { status: 400 });

  const competitionId = typeof body.competition_id === "string" ? body.competition_id : "";
  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  if (!competitionId || !displayName || !phone) return NextResponse.json({ error: "competition_id, nom et téléphone sont obligatoires" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base Awards temporairement indisponible" }, { status: 503 });

  const { data: competition, error: competitionError } = await supabase.from("awards_competitions").select("id,title,category,status").eq("id", competitionId).limit(1).maybeSingle();
  if (competitionError) return NextResponse.json({ error: competitionError.message }, { status: 500 });
  if (!competition) return NextResponse.json({ error: "Compétition introuvable" }, { status: 404 });
  if (competition.status !== "registrations_open") return NextResponse.json({ error: "Les inscriptions ne sont pas ouvertes pour cette compétition" }, { status: 409 });

  const { data: config, error: configError } = await supabase.from("awards_registration_configs").select("form_mode,registration_fee_xof,registrations_start_at,registrations_end_at").eq("competition_id", competitionId).limit(1).maybeSingle();
  if (configError) return NextResponse.json({ error: configError.message }, { status: 500 });
  if (!config) return NextResponse.json({ error: "La configuration d’inscription n’est pas encore définie par l’administrateur" }, { status: 409 });
  if (!isWithinWindow(config.registrations_start_at, config.registrations_end_at)) return NextResponse.json({ error: "La période d’inscription est fermée" }, { status: 409 });
  const registrationFee = Number(config.registration_fee_xof) || 0;
  if (registrationFee > 0 && registrationFee < 100) return NextResponse.json({ error: "Les frais d’inscription doivent être nuls ou d’au moins 100 XOF" }, { status: 400 });

  const { data: fields, error: fieldsError } = await supabase.from("awards_registration_fields").select("field_key,label,is_required").eq("competition_id", competitionId).order("sort_order", { ascending: true }).limit(100);
  if (fieldsError) return NextResponse.json({ error: fieldsError.message }, { status: 500 });
  const customFields = body.custom_fields && typeof body.custom_fields === "object" ? body.custom_fields as Record<string, unknown> : {};
  const missing = (fields ?? []).filter((field) => field.is_required && (customFields[field.field_key] === undefined || customFields[field.field_key] === null || String(customFields[field.field_key]).trim() === "")).map((field) => field.label);
  if (missing.length) return NextResponse.json({ error: `Champs obligatoires manquants : ${missing.join(", ")}`, missing_fields: missing }, { status: 400 });

  const isEntrepreneurship = config.form_mode === "entrepreneurship" || competition.category.toLowerCase().includes("entrepreneuriat");
  const identityData = body.identity_data && typeof body.identity_data === "object" ? body.identity_data : {};
  const businessData = body.business_data && typeof body.business_data === "object" ? body.business_data : {};
  if (isEntrepreneurship && (!String((businessData as Record<string, unknown>).project_need || "").trim() || !String((businessData as Record<string, unknown>).current_level || "").trim() || !String((businessData as Record<string, unknown>).business_plan || "").trim())) {
    return NextResponse.json({ error: "Pour l’Entrepreneuriat, le besoin du projet, le niveau actuel et le plan d’affaires sont obligatoires" }, { status: 400 });
  }

  const applicationId = uuidv4();
  const { data: application, error: applicationError } = await supabase.from("awards_applications").insert({
    id: applicationId,
    competition_id: competitionId,
    applicant_id: user.id,
    applicant_user_id: user.id,
    display_name: displayName,
    phone,
    bio: typeof body.bio === "string" ? body.bio.trim() : null,
    project_description: typeof body.project_description === "string" ? body.project_description.trim() : null,
    video_url: typeof body.video_url === "string" ? body.video_url.trim() : null,
    identity_data: identityData,
    business_data: businessData,
    custom_fields: customFields,
    status: registrationFee > 0 ? "en_attente_paiement" : "soumise",
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }).select("id,competition_id,status,submitted_at").single();
  if (applicationError) return NextResponse.json({ error: applicationError.message }, { status: 500 });
  if (registrationFee > 0) return NextResponse.json({ success: true, requires_payment: true, application, payment: { product: "award_registration_fee", amount_xof: registrationFee, currency: "XOF" } }, { status: 402 });
  return NextResponse.json({ success: true, application }, { status: 201 });
}


export async function PUT(req: NextRequest) {
  const admin = await getCurrentUserFromCookie();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Seul un administrateur peut valider une candidature" }, { status: 403 });
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const applicationId = typeof body.application_id === "string" ? body.application_id : "";
  const decision = body.decision === "rejected" ? "rejected" : body.decision === "approved" ? "approved" : "";
  if (!applicationId || !decision) return NextResponse.json({ error: "application_id et decision (approved/rejected) sont requis" }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base Awards temporairement indisponible" }, { status: 503 });
  const { data: application, error: applicationError } = await supabase.from("awards_applications").select("id,competition_id,applicant_id,display_name,phone,bio,project_description,video_url,identity_data,business_data,custom_fields,status").eq("id", applicationId).limit(1).maybeSingle();
  if (applicationError) return NextResponse.json({ error: applicationError.message }, { status: 500 });
  if (!application) return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });
  if (decision === "rejected") {
    const { data, error } = await supabase.from("awards_applications").update({ status: "rejetée", reviewed_by: admin.id, reviewed_at: new Date().toISOString() }).eq("id", applicationId).select("id,status,reviewed_at").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, application: data, candidate: null });
  }
  const { data: existingCandidate, error: existingError } = await supabase.from("awards_candidates").select("id,competition_id,display_name,status").eq("application_id", applicationId).limit(1).maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (existingCandidate) {
    await supabase.from("awards_applications").update({ status: "approuvée", reviewed_by: admin.id, reviewed_at: new Date().toISOString() }).eq("id", applicationId);
    return NextResponse.json({ success: true, already_exists: true, application: { id: applicationId, status: "approuvée" }, candidate: existingCandidate });
  }
  const identity = application.identity_data && typeof application.identity_data === "object" ? application.identity_data as Record<string, unknown> : {};
  const custom = application.custom_fields && typeof application.custom_fields === "object" ? application.custom_fields as Record<string, unknown> : {};
  const { data: candidate, error: candidateError } = await supabase.from("awards_candidates").insert({ application_id: applicationId, competition_id: application.competition_id, profile_id: application.applicant_id, display_name: application.display_name, bio: application.bio, country: String(identity.country || custom.country || "Afrique"), photo_url: typeof custom.photo_url === "string" ? custom.photo_url : null, video_url: application.video_url, project_description: application.project_description, status: "accepted", created_at: new Date().toISOString() }).select("id,competition_id,profile_id,display_name,status,photo_url,video_url,project_description,created_at").single();
  if (candidateError) return NextResponse.json({ error: candidateError.message }, { status: 500 });
  const { data: updatedApplication, error: updateError } = await supabase.from("awards_applications").update({ status: "approuvée", reviewed_by: admin.id, reviewed_at: new Date().toISOString() }).eq("id", applicationId).select("id,status,reviewed_at").single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ success: true, application: updatedApplication, candidate }, { status: 201 });
}
