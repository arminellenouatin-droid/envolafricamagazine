import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readAwardsDB } from "@/lib/awards-db";
import { buildShareMetadata } from "@/lib/share-metadata-service";
import VoteClient from "./VoteClient";

async function getCandidateAndCompetition(candidateId: string) {
  let candidate: any = null;
  let competition: any = null;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data: cData } = await supabase
        .from("awards_candidates")
        .select("id, display_name, bio, photo_url, country, competition_id")
        .eq("id", candidateId)
        .maybeSingle();
      if (cData) {
        candidate = cData;
        const { data: compData } = await supabase
          .from("awards_competitions")
          .select("id, title, category, slug")
          .eq("id", cData.competition_id)
          .maybeSingle();
        competition = compData;
      }
    } catch {}
  }

  if (!candidate) {
    const db = readAwardsDB();
    candidate = db.candidates.find((c) => c.id === candidateId);
    if (candidate) {
      competition = db.competitions.find((comp) => comp.id === candidate.competition_id);
    }
  }

  return { candidate, competition };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}): Promise<Metadata> {
  const { candidateId } = await params;
  const { candidate, competition } = await getCandidateAndCompetition(candidateId);

  if (!candidate) {
    return buildShareMetadata({
      type: "vote",
      id: candidateId,
      title: "Voter pour un candidat • Africa Awards | Envol Africa",
      description: "Votez pour votre talent favori et participez au couronnement des leaders de l'Afrique économique.",
      badge: "VOTE OFFICIEL",
    });
  }

  const compTitle = competition?.title ? ` • ${competition.title}` : "";
  const title = `🗳 Votez pour ${candidate.display_name}${compTitle} | Africa Awards`;
  const description =
    candidate.bio ||
    `Soutenez ${candidate.display_name} (${candidate.country || "Afrique"}) aux Africa Awards. Paiement sécurisé par Mobile Money / Carte et classement en temps réel.`;

  return buildShareMetadata({
    type: "vote",
    id: candidateId,
    title,
    description,
    imageUrl: candidate.photo_url,
    badge: "🗳 VOTE OFFICIEL EN DIRECT",
  });
}

export default async function VotePage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  return <VoteClient candidateId={candidateId} />;
}
