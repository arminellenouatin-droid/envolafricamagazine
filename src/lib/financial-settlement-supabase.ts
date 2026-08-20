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
  if (!candidateId || !competitionId || !voterId || voterId === "guest") throw new Error("Métadonnées de vote Awards invalides");
  const { error: profileError } = await client.from("awards_profiles").upsert({ id: voterId, full_name: String(metadata.voter_name || ""), avatar_url: typeof metadata.voter_avatar === "string" ? metadata.voter_avatar : null }, { onConflict: "id", ignoreDuplicates: true });
  if (profileError) throw profileError;

  const { data: payment, error: paymentError } = await client.from("awards_payment_transactions").upsert({
    id: crypto.randomUUID(),
    user_id: voterId,
    moneroo_transaction_id: paymentId,
    type: "vote",
    amount_cents: Math.max(0, Number(metadata.amount_cents) || 0),
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
