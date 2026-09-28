import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB } from "@/lib/jobs-db";
import { checkUserJobsSubscription } from "@/lib/jobs-messages-db";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    const jobsData = readJobsDB();

    // Candidats
    const candidates = (jobsData.candidates || [])
      .filter((c) => c.id !== user.id)
      .map((c) => ({
        id: c.id,
        fullName: `${c.firstName} ${c.lastName}`,
        headline: c.desiredRole,
        role: "candidate" as const,
        location: `${c.city}, ${c.country}`,
        avatarUrl: c.photo,
        skills: c.skills,
      }));

    // Offreurs / Recruteurs (dérivés des offres)
    const recruitersMap = new Map<string, any>();
    (jobsData.offers || []).forEach((o) => {
      const recId = o.createdBy || `recruiter-${o.id}`;
      if (recId !== user.id && !recruitersMap.has(recId)) {
        recruitersMap.set(recId, {
          id: recId,
          fullName: o.companyName || "Recruteur Confidentiel",
          headline: `Recrute: ${o.title}`,
          role: "employer" as const,
          location: `${o.city}, ${o.country}`,
          companyName: o.companyName,
          jobOfferId: o.id,
          jobOfferTitle: o.title,
        });
      }
    });

    const recruiters = Array.from(recruitersMap.values());
    const allContacts = [...recruiters, ...candidates];

    const filtered = query
      ? allContacts.filter(
          (c) =>
            c.fullName.toLowerCase().includes(query) ||
            c.headline.toLowerCase().includes(query) ||
            c.location.toLowerCase().includes(query)
        )
      : allContacts;

    // Enrichir avec statut d'abonnement
    const enriched = await Promise.all(
      filtered.slice(0, 30).map(async (c) => {
        const sub = await checkUserJobsSubscription(c.id);
        return {
          ...c,
          isSubscriptionActive: sub.active,
        };
      })
    );

    return NextResponse.json({ contacts: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur serveur." }, { status: 500 });
  }
}
