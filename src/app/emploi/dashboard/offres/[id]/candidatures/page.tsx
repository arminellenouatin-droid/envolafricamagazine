import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB } from "@/lib/jobs-db";
import { getOfferApplicationsForEmployer } from "@/lib/jobs-supabase";
import ApplicationStatus from "./ApplicationStatus";

export default async function OfferApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  if (!user) redirect("/auth/login");
  const { id } = await params;

  let offerTitle = "";
  let applications: Array<{
    id: string;
    status: string;
    message?: string | null;
    candidate: {
      id: string;
      firstName: string;
      lastName: string;
      desiredRole: string;
      city: string;
      country: string;
      description: string;
      skills: string[];
      contactEmail: string;
      contactPhone?: string | null;
      cvUrl?: string | null;
    } | null;
  }> = [];

  const supabaseRes = await getOfferApplicationsForEmployer(id, user.id);
  if (supabaseRes.configured) {
    if (!supabaseRes.offer) notFound();
    offerTitle = supabaseRes.offer.title;
    applications = supabaseRes.applications;
  } else {
    const db = readJobsDB();
    const offer = db.offers.find((item) => item.id === id && item.createdBy === user.id);
    if (!offer) notFound();
    offerTitle = offer.title;
    const dbApps = db.applications.filter((item) => item.offerId === id);
    applications = dbApps.map((app) => {
      const c = db.candidates.find((item) => item.createdBy === app.userId);
      return {
        id: app.id,
        status: app.status,
        message: app.message,
        candidate: c
          ? {
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              desiredRole: c.desiredRole,
              city: c.city,
              country: c.country,
              description: c.description,
              skills: c.skills,
              contactEmail: c.contactEmail,
              contactPhone: c.contactPhone,
              cvUrl: c.cvUrl,
            }
          : null,
      };
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] py-10">
      <div className="mx-auto max-w-4xl px-5">
        <Link href="/emploi/dashboard" className="text-sm font-bold text-[#087e8b] transition hover:underline">
          ← Tableau de bord Jobs
        </Link>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-[#071b36]">
          Candidatures : {offerTitle}
        </h1>
        <p className="mt-2 text-slate-600">{applications.length} candidature(s) reçue(s)</p>

        <div className="mt-7 space-y-4">
          {applications.map((application) => {
            const candidate = application.candidate;
            return (
              <article key={application.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-[#071b36]">
                      {candidate ? `${candidate.firstName} ${candidate.lastName}` : "Profil indisponible"}
                    </h2>
                    {candidate && (
                      <p className="mt-1 text-sm font-semibold text-[#087e8b]">
                        {candidate.desiredRole} · {candidate.city}, {candidate.country}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {application.status}
                  </span>
                </div>

                {candidate && (
                  <>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{candidate.description}</p>
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {candidate.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[#e9f7f5] px-3 py-1 text-xs font-semibold text-[#087e8b]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      {candidate.contactEmail}
                      {candidate.contactPhone ? ` · ${candidate.contactPhone}` : ""}
                    </p>
                    {candidate.cvUrl && (
                      <a
                        href={`/api/jobs/cv?candidateId=${candidate.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm font-bold text-[#087e8b] transition hover:underline"
                      >
                        Voir le CV ↗
                      </a>
                    )}
                  </>
                )}

                {application.message && (
                  <blockquote className="mt-4 border-l-4 border-[#087e8b] pl-3 text-sm italic text-slate-600">
                    {application.message}
                  </blockquote>
                )}

                <ApplicationStatus applicationId={application.id} initialStatus={application.status} />
              </article>
            );
          })}

          {!applications.length && (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-500">
              Aucune candidature reçue pour le moment.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
