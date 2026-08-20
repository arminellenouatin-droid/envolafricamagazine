import { getSupabaseAdmin } from "@/lib/supabase-admin";
function generateCalendrierRemboursement(montant: number, tauxAnnuel: number, dureeMois = 12) {
  const calendrier: Array<{ date: string; capital: number; interet: number; total: number; statut: "prevu" }> = [];
  const tauxMensuel = tauxAnnuel / 100 / 12;
  const mensualite = tauxMensuel === 0 ? montant / dureeMois : (montant * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -dureeMois));
  let capitalRestant = montant;
  for (let i = 1; i <= dureeMois; i += 1) {
    const interet = capitalRestant * tauxMensuel;
    const capital = mensualite - interet;
    capitalRestant -= capital;
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    calendrier.push({ date: date.toISOString().split("T")[0], capital: Math.round(capital), interet: Math.round(interet), total: Math.round(mensualite), statut: "prevu" });
  }
  return calendrier;
}

export async function settleAwardVoteSupabase(metadata: Record<string, unknown>, paymentId: string) {
  const client = getSupabaseAdmin();
  if (!client) return { configured: false as const, settled: false };
  const candidateId = String(metadata.candidate_id || "");
  const competitionId = String(metadata.competition_id || "");
  const voterId = String(metadata.user_id || "");
  const points = Math.max(1, Math.min(1000, Number(metadata.points) || 1));
  const amountXof = Math.round(Number(metadata.amount_xof ?? metadata.amount_cents) || 0);
  if (!candidateId || !competitionId || !voterId || voterId === "guest") throw new Error("Métadonnées de vote Awards invalides");
  if (amountXof < 100) throw new Error("Le montant d’un vote Awards doit être au minimum de 100 XOF");
  const [{ data: competition, error: competitionError }, { data: candidate, error: candidateError }, { data: config, error: configError }] = await Promise.all([
    client.from("awards_competitions").select("id,status").eq("id", competitionId).limit(1).maybeSingle(),
    client.from("awards_candidates").select("id,competition_id,status").eq("id", candidateId).limit(1).maybeSingle(),
    client.from("awards_registration_configs").select("voting_start_at,voting_end_at").eq("competition_id", competitionId).limit(1).maybeSingle(),
  ]);
  if (competitionError || candidateError || configError) throw competitionError || candidateError || configError;
  if (!competition || !candidate || candidate.competition_id !== competitionId || candidate.status !== "accepted") throw new Error("Compétition ou nominé Awards invalide");
  if (competition.status !== "voting_open" && competition.status !== "live_running") throw new Error("Les votes Awards ne sont pas ouverts");
  const now = Date.now();
  if (!config || (config.voting_start_at && now < new Date(config.voting_start_at).getTime()) || (config.voting_end_at && now > new Date(config.voting_end_at).getTime())) throw new Error("La période de vote Awards est fermée");
  const { error: profileError } = await client.from("awards_profiles").upsert({ id: voterId, full_name: String(metadata.voter_name || ""), avatar_url: typeof metadata.voter_avatar === "string" ? metadata.voter_avatar : null }, { onConflict: "id", ignoreDuplicates: true });
  if (profileError) throw profileError;

  const { data: payment, error: paymentError } = await client.from("awards_payment_transactions").upsert({
    id: crypto.randomUUID(),
    user_id: voterId,
    moneroo_transaction_id: paymentId,
    type: "vote",
    amount_cents: amountXof,
    currency: String(metadata.currency || "XOF"),
    status: "succeeded",
    metadata,
  }, { onConflict: "moneroo_transaction_id", ignoreDuplicates: true }).select("id").maybeSingle();
  if (paymentError) throw paymentError;
  if (!payment?.id) {
    const existing = await client.from("awards_payment_transactions").select("id").eq("moneroo_transaction_id", paymentId).limit(1).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data?.id) throw new Error("Transaction Awards introuvable après upsert");
    const existingVote = await client.from("awards_votes").select("id").eq("payment_transaction_id", existing.data.id).limit(1).maybeSingle();
    if (existingVote.error) throw existingVote.error;
    if (existingVote.data) return { configured: true as const, settled: true, duplicate: true };
    const paymentIdRow = existing.data.id;
    const { error } = await client.from("awards_votes").insert({ id: crypto.randomUUID(), voter_id: voterId, candidate_id: candidateId, competition_id: competitionId, points, payment_transaction_id: paymentIdRow });
    if (error) throw error;
    return { configured: true as const, settled: true };
  }
  const { error: voteError } = await client.from("awards_votes").insert({ id: crypto.randomUUID(), voter_id: voterId, candidate_id: candidateId, competition_id: competitionId, points, payment_transaction_id: payment.id });
  if (voteError && !String(voteError.message).toLowerCase().includes("duplicate")) throw voteError;
  return { configured: true as const, settled: true, duplicate: Boolean(voteError) };
}

export async function settleCrowdfundingContributionSupabase(metadata: Record<string, unknown>, paymentId: string) {
  const client = getSupabaseAdmin();
  if (!client) return { configured: false as const, settled: false };
  const projectId = String(metadata.project_id || "");
  const contributionId = String(metadata.contribution_id || paymentId);
  const mode = String(metadata.mode || "don");
  const amount = Math.round(Number(metadata.amount_xof) || 0);
  const investorId = String(metadata.user_id || "guest");
  if (!projectId || !amount || !["don", "prise_part", "pret"].includes(mode)) throw new Error("Métadonnées Crowdfunding invalides");

  const { data: existingPayment, error: existingPaymentError } = await client.from("crowdfunding_payment_transactions").select("id,status,contribution_id").eq("provider_ref", paymentId).limit(1).maybeSingle();
  if (existingPaymentError) throw existingPaymentError;
  if (existingPayment?.status === "succeeded") return { configured: true as const, settled: true, duplicate: true };

  const { data: project, error: projectError } = await client.from("crowdfunding_projects").select("id,porteur_id,taux_interet,duree_jours,montant_collecte,investisseurs,repartition").eq("id", projectId).limit(1).maybeSingle();
  if (projectError) throw projectError;
  if (!project) throw new Error("Projet Crowdfunding introuvable dans Supabase");

  const percentage = mode === "prise_part" ? Math.max(0.1, Math.min(10, Number(metadata.percentage) || 1)) : null;
  const calendar = mode === "pret" ? generateCalendrierRemboursement(amount, Number(project.taux_interet || 8), Math.max(1, Math.ceil(Number(project.duree_jours || 30) / 30))) : null;
  const { error: contributionError } = await client.from("crowdfunding_contributions").upsert({ id: contributionId, projet_id: projectId, investisseur_id: investorId, type: mode, montant: amount, pourcentage: percentage, taux_interet: mode === "pret" ? Number(project.taux_interet || 8) : null, calendrier_remboursement: calendar, created_at: new Date().toISOString() }, { onConflict: "id", ignoreDuplicates: true });
  if (contributionError) throw contributionError;

  const repartition = { dons: Number(project.repartition?.dons || 0), prise_part: Number(project.repartition?.prise_part || 0), pret: Number(project.repartition?.pret || 0) };
  repartition[mode === "don" ? "dons" : mode === "prise_part" ? "prise_part" : "pret"] += amount;
  const { error: projectUpdateError } = await client.from("crowdfunding_projects").update({ montant_collecte: Number(project.montant_collecte || 0) + amount, investisseurs: Number(project.investisseurs || 0) + 1, repartition }).eq("id", projectId);
  if (projectUpdateError) throw projectUpdateError;

  const { error: paymentError } = await client.from("crowdfunding_payment_transactions").upsert({ id: existingPayment?.id || crypto.randomUUID(), provider_ref: paymentId, user_id: investorId, project_id: projectId, contribution_id: contributionId, amount, currency: String(metadata.currency || "XOF"), status: "succeeded", metadata }, { onConflict: "provider_ref" });
  if (paymentError) throw paymentError;
  return { configured: true as const, settled: true };
}


async function getAwardsPaymentContext(metadata: Record<string, unknown>, product: string) {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("Base Awards indisponible");
  const competitionId = String(metadata.competition_id || "");
  const userId = String(metadata.user_id || "");
  const amountXof = Math.round(Number(metadata.amount_xof ?? metadata.amount_cents) || 0);
  if (!competitionId || !userId || userId === "guest" || amountXof < 100) throw new Error("Paiement Awards invalide : compte, compétition ou montant minimum manquant");
  const { data: competition, error: competitionError } = await client.from("awards_competitions").select("id,status").eq("id", competitionId).limit(1).maybeSingle();
  if (competitionError) throw competitionError;
  if (!competition) throw new Error("Compétition Awards introuvable");
  if (!["voting_open", "live_running", "registrations_open"].includes(competition.status) && product !== "award_registration_fee") throw new Error("Opération Awards fermée");
  return { client, competitionId, userId, amountXof };
}

export async function settleAwardRegistrationFeeSupabase(metadata: Record<string, unknown>, paymentId: string) {
  const { client, competitionId, userId, amountXof } = await getAwardsPaymentContext(metadata, "award_registration_fee");
  const applicationId = String(metadata.application_id || "");
  if (!applicationId) throw new Error("Candidature de paiement introuvable");
  const { data: config } = await client.from("awards_registration_configs").select("registration_fee_xof").eq("competition_id", competitionId).limit(1).maybeSingle();
  if (!config || Number(config.registration_fee_xof) !== amountXof) throw new Error("Montant des frais d’inscription incohérent");
  const { data: application } = await client.from("awards_applications").select("id,applicant_id,competition_id,status").eq("id", applicationId).limit(1).maybeSingle();
  if (!application || application.applicant_id !== userId || application.competition_id !== competitionId) throw new Error("Candidature Awards invalide");
  const { data: payment, error: paymentError } = await client.from("awards_payment_transactions").upsert({ id: crypto.randomUUID(), user_id: userId, moneroo_transaction_id: paymentId, type: "registration_fee", amount_cents: amountXof, currency: "XOF", status: "succeeded", metadata }, { onConflict: "moneroo_transaction_id", ignoreDuplicates: true }).select("id").maybeSingle();
  if (paymentError) throw paymentError;
  const paymentRowId = payment?.id;
  const { error } = await client.from("awards_applications").update({ status: "soumise", payment_transaction_id: paymentRowId || null, submitted_at: new Date().toISOString() }).eq("id", applicationId).eq("applicant_id", userId);
  if (error) throw error;
  return { configured: true as const, settled: true };
}

export async function settleAwardGiftSupabase(metadata: Record<string, unknown>, paymentId: string) {
  const { client, competitionId, userId, amountXof } = await getAwardsPaymentContext(metadata, "award_gift");
  const candidateId = String(metadata.candidate_id || "");
  const giftId = String(metadata.gift_id || "");
  if (!candidateId || !giftId) throw new Error("Cadeau Awards incomplet");
  const [{ data: candidate }, { data: gift }] = await Promise.all([
    client.from("awards_candidates").select("id,competition_id,status").eq("id", candidateId).limit(1).maybeSingle(),
    client.from("awards_gifts_catalog").select("id,price_cents,points,is_active").eq("id", giftId).limit(1).maybeSingle(),
  ]);
  if (!candidate || candidate.competition_id !== competitionId || candidate.status !== "accepted" || !gift || !gift.is_active || Number(gift.price_cents) !== amountXof) throw new Error("Cadeau ou nominé Awards invalide");
  const { data: payment, error: paymentError } = await client.from("awards_payment_transactions").upsert({ id: crypto.randomUUID(), user_id: userId, moneroo_transaction_id: paymentId, type: "gift", amount_cents: amountXof, currency: "XOF", status: "succeeded", metadata }, { onConflict: "moneroo_transaction_id", ignoreDuplicates: true }).select("id").maybeSingle();
  if (paymentError) throw paymentError;
  if (!payment?.id) return { configured: true as const, settled: true, duplicate: true };
  const { error: giftError } = await client.from("awards_gift_transactions").insert({ sender_id: userId, candidate_id: candidateId, competition_id: competitionId, gift_id: giftId, points: Number(gift.points), payment_transaction_id: payment.id });
  if (giftError && !String(giftError.message).toLowerCase().includes("duplicate")) throw giftError;
  await client.from("awards_live_events").insert({ competition_id: competitionId, event_type: "gift", payload: { candidate_id: candidateId, gift_id: giftId, points: Number(gift.points), amount_xof: amountXof, user_id: userId } });
  return { configured: true as const, settled: true, duplicate: Boolean(giftError) };
}

export async function settleAwardDonationSupabase(metadata: Record<string, unknown>, paymentId: string) {
  const type = ["candidate", "platform", "pot", "capital_angel"].includes(String(metadata.donation_type)) ? String(metadata.donation_type) : "platform";
  const product = type === "candidate" ? "award_donation" : "award_donation";
  const { client, competitionId, userId, amountXof } = await getAwardsPaymentContext(metadata, product);
  const candidateId = typeof metadata.candidate_id === "string" && metadata.candidate_id ? metadata.candidate_id : null;
  const paymentType = type === "candidate" ? "donation_candidate" : type === "pot" ? "donation_pot" : type === "capital_angel" ? "capital_angel" : "donation_platform";
  const { data: payment, error: paymentError } = await client.from("awards_payment_transactions").upsert({ id: crypto.randomUUID(), user_id: userId, moneroo_transaction_id: paymentId, type: paymentType, amount_cents: amountXof, currency: "XOF", status: "succeeded", metadata }, { onConflict: "moneroo_transaction_id", ignoreDuplicates: true }).select("id").maybeSingle();
  if (paymentError) throw paymentError;
  if (!payment?.id) return { configured: true as const, settled: true, duplicate: true };
  const { error: donationError } = await client.from("awards_donations").insert({ donor_id: userId, candidate_id: candidateId, competition_id: competitionId, type, amount_cents: amountXof, currency: "XOF", is_anonymous: Boolean(metadata.is_anonymous), payment_transaction_id: payment.id });
  if (donationError && !String(donationError.message).toLowerCase().includes("duplicate")) throw donationError;
  await client.from("awards_live_events").insert({ competition_id: competitionId, event_type: type === "pot" ? "pot_increase" : "donation", payload: { candidate_id: candidateId, donation_type: type, amount_xof: amountXof, user_id: userId } });
  return { configured: true as const, settled: true, duplicate: Boolean(donationError) };
}
