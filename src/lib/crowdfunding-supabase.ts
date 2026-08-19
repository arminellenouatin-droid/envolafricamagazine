import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { CrowdProject } from "@/lib/crowdfunding-db";

export function mapCrowdProject(row: Record<string, unknown>): CrowdProject {
  const repartition = (row.repartition && typeof row.repartition === "object" ? row.repartition : {}) as Record<string, unknown>;
  return {
    id: String(row.id), nom: String(row.nom), secteur: String(row.secteur), description: String(row.description || ""), videos: Array.isArray(row.videos) ? row.videos.map(String) : [], images: Array.isArray(row.images) ? row.images.map(String) : [], pdf: typeof row.pdf === "string" ? row.pdf : "", montantRecherche: Number(row.montant_recherche || 0), montantCollecte: Number(row.montant_collecte || 0), niveauRisque: String(row.niveau_risque) as CrowdProject["niveauRisque"], dureeJours: Number(row.duree_jours || 30), typesFinancement: Array.isArray(row.types_financement) ? row.types_financement as CrowdProject["typesFinancement"] : ["don"], statut: String(row.statut) as CrowdProject["statut"], porteurId: String(row.porteur_id), pays: String(row.pays), tauxInteret: row.taux_interet == null ? undefined : Number(row.taux_interet), pourcentageVendu: row.pourcentage_vendu == null ? undefined : Number(row.pourcentage_vendu), valorisation: row.valorisation == null ? undefined : Number(row.valorisation), createdAt: String(row.created_at), dateFin: String(row.date_fin || ""), vues: Number(row.vues || 0), investisseurs: Number(row.investisseurs || 0), repartition: { dons: Number(repartition.dons || 0), prise_part: Number(repartition.prise_part || 0), pret: Number(repartition.pret || 0) },
  };
}

export async function getCrowdProjects(filters: { secteur?: string | null; pays?: string | null; risque?: string | null; statut?: string | null; id?: string | null; }) {
  const client = getSupabaseAdmin();
  if (!client) return { configured: false as const, projets: [] as CrowdProject[] };
  let query = client.from("crowdfunding_projects").select("*").order("created_at", { ascending: false }).limit(500);
  if (filters.id) query = query.eq("id", filters.id);
  if (filters.secteur && filters.secteur !== "all") query = query.eq("secteur", filters.secteur);
  if (filters.pays && filters.pays !== "all") query = query.eq("pays", filters.pays);
  if (filters.risque && filters.risque !== "all") query = query.eq("niveau_risque", filters.risque);
  if (filters.statut && filters.statut !== "all") query = query.eq("statut", filters.statut);
  const { data, error } = await query;
  if (error) throw error;
  return { configured: true as const, projets: (data || []).map((row) => mapCrowdProject(row as Record<string, unknown>)) };
}
