import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { AFRICA_COUNTRIES } from "@/lib/africa-context";

export type JobsOfferRow = {
  id: string; title: string; description: string; country_name: string; city: string; sector: string; contract_type: string;
  salary_text: string | null; skills: string[] | null; published_at: string; expires_at: string; is_boosted: boolean; views_count: number; applications_count: number;
};

export async function getPublishedJobsOfferForPayment(offerId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, offer: null };
  const { data, error } = await supabase.from("jobs_offers").select("id,title").eq("id", offerId).eq("status", "published").maybeSingle();
  if (error) return { configured: true as const, offer: null, error };
  return { configured: true as const, offer: data };
}

export async function listPublishedJobsOffers() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, offers: null };
  const { data, error } = await supabase.from("jobs_offers").select("id,title,description,country_name,city,sector,contract_type,salary_text,skills,published_at,expires_at,is_boosted,views_count,applications_count").eq("status", "published");
  if (error) return { configured: true as const, offers: null, error };
  return { configured: true as const, offers: (data as JobsOfferRow[]).map((row) => ({ id: row.id, title: row.title, description: row.description, country: row.country_name, city: row.city, sector: row.sector, contractType: row.contract_type, salary: row.salary_text ?? undefined, skills: row.skills ?? [], publishedAt: row.published_at, expiresAt: row.expires_at, isBoosted: row.is_boosted, views: row.views_count, applications: row.applications_count })) };
}

export type CreateJobsOfferInput = { userId: string; title: string; description: string; companyName: string; companyLogo?: string; contactEmail: string; contactPhone?: string; address?: string; country: string; city: string; region?: string; sector: string; contractType: "CDI" | "CDD" | "Stage" | "Freelance" | "Remote"; salary?: string; skills: string[]; expiresAt: string };
export async function createJobsOfferInSupabase(input: CreateJobsOfferInput) { const supabase = getSupabaseAdmin(); if (!supabase) return { configured: false as const, offer: null }; const matchedCountry = AFRICA_COUNTRIES.find((item) => item.name === input.country); if (!matchedCountry) return { configured: true as const, offer: null, error: new Error("Pays Jobs invalide") }; const { count, error: countError } = await supabase.from("jobs_offers").select("id", { count: "exact", head: true }).eq("created_by", input.userId); if (countError) return { configured: true as const, offer: null, error: countError }; if ((count ?? 0) >= 2) return { configured: true as const, offer: null, quotaReached: true as const }; const { data, error } = await supabase.from("jobs_offers").insert({ created_by: input.userId, title: input.title, description: input.description, company_name: input.companyName, company_logo_url: input.companyLogo, contact_email: input.contactEmail, contact_phone: input.contactPhone, address: input.address, country_code: matchedCountry.code, country_name: matchedCountry.name, city: input.city, region: input.region, sector: input.sector, contract_type: input.contractType, salary_text: input.salary, skills: input.skills, expires_at: input.expiresAt }).select().single(); if (error) return { configured: true as const, offer: null, error }; return { configured: true as const, offer: data }; }

export type CreateJobsCandidateInput = { userId: string; firstName: string; lastName: string; contactEmail: string; contactPhone?: string; description: string; skills: string[]; desiredRole: string; country: string; city: string; availability: string; cvPath?: string };
export async function upsertJobsCandidateInSupabase(input: CreateJobsCandidateInput) { const supabase = getSupabaseAdmin(); if (!supabase) return { configured: false as const, candidate: null }; const matchedCountry = AFRICA_COUNTRIES.find((item) => item.name === input.country); if (!matchedCountry) return { configured: true as const, candidate: null, error: new Error("Pays Jobs invalide") }; const { data, error } = await supabase.from("jobs_candidates").upsert({ created_by: input.userId, first_name: input.firstName, last_name: input.lastName, contact_email: input.contactEmail, contact_phone: input.contactPhone, description: input.description, skills: input.skills, desired_role: input.desiredRole, country_code: matchedCountry.code, country_name: matchedCountry.name, city: input.city, availability: input.availability, cv_path: input.cvPath, status: "published" }, { onConflict: "created_by" }).select().single(); if (error) return { configured: true as const, candidate: null, error }; return { configured: true as const, candidate: data }; }

export async function listJobsCandidates() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, candidates: null };
  const { data, error } = await supabase.from("jobs_candidates").select("*").eq("status", "published");
  if (error) return { configured: true as const, candidates: null, error };
  return { configured: true as const, candidates: data };
}


export async function createJobsApplicationInSupabase(userId: string, offerId: string, message?: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, application: null };
  const [{ data: offer, error: offerError }, { data: candidate, error: candidateError }, { data: unlock }, { data: subscription }] = await Promise.all([
    supabase.from("jobs_offers").select("id,status,applications_count").eq("id", offerId).single(),
    supabase.from("jobs_candidates").select("id").eq("created_by", userId).single(),
    supabase.from("jobs_unlocks").select("id").eq("user_id", userId).eq("offer_id", offerId).eq("status", "paid").maybeSingle(),
    supabase.from("jobs_subscriptions").select("id").eq("user_id", userId).eq("audience", "candidate").eq("status", "active").or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`).maybeSingle(),
  ]);
  if (offerError || !offer || offer.status !== "published") return { configured: true as const, application: null, reason: "offer" as const };
  if (candidateError || !candidate) return { configured: true as const, application: null, reason: "candidate" as const };
  if (!unlock && !subscription) return { configured: true as const, application: null, reason: "access" as const };
  const { data, error } = await supabase.from("jobs_applications").insert({ offer_id: offerId, candidate_id: candidate.id, user_id: userId, message: message?.slice(0, 2000), status: "sent" }).select().single();
  if (error) return { configured: true as const, application: null, error };
  await supabase.from("jobs_offers").update({ applications_count: (offer.applications_count ?? 0) + 1 }).eq("id", offerId);
  return { configured: true as const, application: data };
}

export async function createPendingJobsBoost(userId: string, targetType: "offer" | "candidate", targetId: string, durationDays: number, amount: number, paymentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, boost: null };
  const { data, error } = await supabase.from("jobs_boosts").insert({
    user_id: userId,
    target_type: targetType,
    target_id: targetId,
    duration_days: durationDays,
    amount_xof: amount,
    provider_payment_id: paymentId,
    status: "pending"
  }).select().single();
  if (error) return { configured: true as const, boost: null, error };
  return { configured: true as const, boost: data };
}

export async function activateJobsBoostByPayment(userId: string, paymentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, activated: false };
  const now = new Date();
  
  const { data: boost, error } = await supabase.from("jobs_boosts")
    .update({ 
      status: "active", 
      starts_at: now.toISOString(),
      ends_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString() // Temporaire
    })
    .eq("user_id", userId)
    .eq("provider_payment_id", paymentId)
    .in("status", ["pending", "active"])
    .select()
    .maybeSingle();

  if (error || !boost) return { configured: true as const, activated: false, error };

  const duration = boost.duration_days || 7;
  const endsAtReal = new Date(now.getTime() + 1000 * 60 * 60 * 24 * duration);
  await supabase.from("jobs_boosts").update({ ends_at: endsAtReal.toISOString() }).eq("id", boost.id);

  if (boost.target_type === "offer") {
    await supabase.from("jobs_offers").update({ is_boosted: true, boost_ends_at: endsAtReal.toISOString() }).eq("id", boost.target_id);
  } else if (boost.target_type === "candidate") {
    await supabase.from("jobs_candidates").update({ is_boosted: true, boost_ends_at: endsAtReal.toISOString() }).eq("id", boost.target_id);
  }

  return { configured: true as const, activated: true, boost };
}

export async function getJobsBoostById(userId: string, id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, boost: null };
  const { data, error } = await supabase.from("jobs_boosts").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) return { configured: true as const, boost: null, error };
  return { configured: true as const, boost: data };
}

export async function createJobsNotification(userId: string, type: string, title: string, body: string, href?: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const };
  await supabase.from("jobs_notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    href: href || null
  });
  return { configured: true as const };
}

export async function getJobsOfferByIdAndUser(id: string, userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, offer: null };
  const { data, error } = await supabase.from("jobs_offers").select("*").eq("id", id).eq("created_by", userId).maybeSingle();
  if (error) return { configured: true as const, offer: null, error };
  return { configured: true as const, offer: data };
}

export async function getJobsCandidateByIdAndUser(id: string, userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, candidate: null };
  const { data, error } = await supabase.from("jobs_candidates").select("*").eq("id", id).eq("created_by", userId).maybeSingle();
  if (error) return { configured: true as const, candidate: null, error };
  return { configured: true as const, candidate: data };
}

export async function updateJobsApplicationStatus(applicationId: string, userId: string, status: "seen" | "shortlisted" | "rejected" | "sent") {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, application: null };

  // 1. Lire la candidature et l'offre associÃ©e
  const { data: application, error: readError } = await supabase
    .from("jobs_applications")
    .select("*, jobs_offers(created_by)")
    .eq("id", applicationId)
    .maybeSingle();

  if (readError || !application) return { configured: true as const, application: null, error: readError || new Error("Candidature introuvable") };

  // 2. VÃ©rifier si l'utilisateur connectÃ© est le crÃ©ateur de l'offre
  const offerCreatedBy = (application.jobs_offers as { created_by?: string } | null)?.created_by;
  if (offerCreatedBy !== userId) {
    return { configured: true as const, application: null, unauthorized: true };
  }

  // 3. Mettre Ã  jour le statut
  const { data, error } = await supabase
    .from("jobs_applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .select()
    .single();

  if (error) return { configured: true as const, application: null, error };
  return { configured: true as const, application: data };
}


