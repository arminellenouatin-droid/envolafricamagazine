import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB } from "@/lib/jobs-db";
import { getJobsDashboardData } from "@/lib/jobs-supabase";
import BoostButton from "./BoostButton";
import PaymentVerifier from "./PaymentVerifier";
import JobsNotifications from "./JobsNotifications";

export const metadata: Metadata = {
  title: "Espace Recruteur & Candidat Jobs",
  description: "Gérez vos offres d’emploi, vos candidatures et vos abonnements sur Envol Africa Jobs.",
};

export default async function JobsDashboardPage() {
  const user = await getCurrentUserFromCookie();
  if (!user) redirect("/auth/login?next=/emploi/dashboard");

  const supabaseData = await getJobsDashboardData(user.id);
  let offers: Array<{ id: string; title: string; city: string; country: string; views: number; applications: number; isBoosted: boolean }> = [];
  let candidate: { id: string; desiredRole: string; city: string; country: string; views: number; isBoosted?: boolean } | null = null;
  let unlocksCount = 0;
  let subscriptions: Array<{ id: string; planId: string; status: string }> = [];
  let boostsCount = 0;

  if (supabaseData.configured && supabaseData.data) {
    offers = supabaseData.data.offers;
    candidate = supabaseData.data.candidate;
    unlocksCount = supabaseData.data.unlocksCount;
    subscriptions = supabaseData.data.subscriptions;
    boostsCount = supabaseData.data.boostsCount;
  } else {
    const database = readJobsDB();
    offers = database.offers
      .filter((item) => item.createdBy === user.id)
      .map((item) => ({
        id: item.id,
        title: item.title,
        city: item.city,
        country: item.country,
        views: item.views,
        applications: item.applications,
        isBoosted: item.isBoosted,
      }));
    const rawCand = database.candidates.find((item) => item.createdBy === user.id);
    candidate = rawCand
      ? {
          id: rawCand.id,
          desiredRole: rawCand.desiredRole,
          city: rawCand.city,
          country: rawCand.country,
          views: rawCand.views,
          isBoosted: rawCand.isBoosted,
        }
      : null;
    unlocksCount = database.unlocks.filter((item) => item.userId === user.id && item.status === "paid").length;
    subscriptions = database.subscriptions.filter((item) => item.userId === user.id).map((sub) => ({ id: sub.id, planId: sub.planId, status: sub.status }));
    boostsCount = database.boosts.filter((item) => item.userId === user.id).length;
  }

  const totalViews = offers.reduce((sum, item) => sum + item.views, 0) + (candidate?.views ?? 0);

  return (
    <main className="min-h-screen bg-[#f7f8fa] py-10">
      <div className="mx-auto max-w-6xl px-5">
        <PaymentVerifier />
        <p className="text-xs font-bold uppercase tracking-widest text-[#087e8b]">Espace personnel Jobs</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-[#071b36]">Bonjour {user.prenom}</h1>
            <p className="mt-1 text-slate-600">Pilotez vos publications, accès et candidatures.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/emploi/publier-candidature" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold shadow-sm transition hover:bg-slate-50">
              Ma candidature
            </Link>
            <Link href="/emploi/publier-offre" className="rounded-xl bg-[#087e8b] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#066570]">
              Publier une offre
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            ["Vues", totalViews],
            ["Mes offres", offers.length],
            ["Offres décryptées", unlocksCount],
            ["Boosts actifs", boostsCount],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-extrabold text-[#071b36]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-extrabold text-[#071b36]">Mes offres publiées</h2>
            {offers.length ? (
              <div className="mt-4 space-y-4">
                {offers.map((offer, index) => (
                  <div key={offer.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-[#071b36]">{offer.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {offer.city}, {offer.country} · {offer.views} vues · {offer.applications} candidatures
                        </p>
                      </div>
                      {offer.isBoosted && (
                        <span className="inline-flex h-fit items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-[#a36300]">
                          BOOSTÉE
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <BoostButton targetId={offer.id} targetType="offer" offerPosition={index + 1} />
                      <Link
                        href={`/emploi/dashboard/offres/${offer.id}/candidatures`}
                        className="text-xs font-extrabold text-[#087e8b] transition hover:underline"
                      >
                        Voir les candidatures →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Aucune offre publiée pour l'instant. Vos deux premières publications sont offertes.
              </p>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl font-extrabold text-[#071b36]">Ma candidature</h2>
            {candidate ? (
              <div className="mt-4 rounded-xl border border-slate-100 p-4">
                <h3 className="font-bold text-[#071b36]">{candidate.desiredRole}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {candidate.city}, {candidate.country} · {candidate.views} vues
                </p>
                <div className="mt-4">
                  <BoostButton targetId={candidate.id} targetType="candidate" />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Vous n’avez pas encore publié votre candidature.</p>
            )}

            <h2 className="mt-8 font-display text-xl font-extrabold text-[#071b36]">Mes accès & abonnements</h2>
            {subscriptions.length ? (
              <div className="mt-4 space-y-2">
                {subscriptions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                    <span className="font-medium text-slate-700">{item.planId}</span>
                    <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Aucun abonnement actif.</p>
            )}
          </section>
        </div>

        <JobsNotifications />
      </div>
    </main>
  );
}

