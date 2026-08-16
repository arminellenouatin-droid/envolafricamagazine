import Link from "next/link";
import { notFound } from "next/navigation";
import { canSeeEmployerDetails, readJobsDB } from "@/lib/jobs-db";
import { getCurrentUserFromCookie } from "@/lib/auth";
import ApplyButton from "./ApplyButton";
import OfferViewTracker from "./OfferViewTracker";

export default async function JobOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = readJobsDB().offers.find((item) => item.id === id && item.status === "published");
  if (!offer) notFound();
  const user = await getCurrentUserFromCookie();
  const unlocked = canSeeEmployerDetails(user?.id, offer.id);

  return <main className="min-h-screen bg-[#f7f8fa] py-10"><OfferViewTracker offerId={offer.id} /><div className="mx-auto max-w-4xl px-5 sm:px-8">
    <Link href="/emploi" className="text-sm font-bold text-[#087e8b]">← Retour aux offres</Link>
    <article className="mt-5 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
      {offer.isBoosted && <span className="rounded-full bg-[#fff1c9] px-3 py-1 text-xs font-extrabold text-[#875600]">★ Offre boostée</span>}
      <p className="mt-5 text-sm font-bold uppercase tracking-wider text-[#087e8b]">{offer.sector} · {offer.contractType}</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-[#071b36] sm:text-4xl">{offer.title}</h1>
      <p className="mt-4 text-slate-600">⌖ {offer.city}, {offer.country} {offer.salary ? ` · ${offer.salary}` : ""}</p>
      <div className="mt-7 border-y border-slate-100 py-7 text-[16px] leading-8 text-slate-700 whitespace-pre-line">{offer.description}</div>
      <section className="mt-7"><h2 className="font-display text-xl font-extrabold">Compétences recherchées</h2><div className="mt-3 flex flex-wrap gap-2">{offer.skills.map((skill) => <span key={skill} className="rounded-full bg-[#e9f7f5] px-3 py-1 text-sm font-semibold text-[#087e8b]">{skill}</span>)}</div></section>
      {unlocked ? <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6"><p className="font-bold text-emerald-900">Informations de l’employeur décryptées</p><p className="mt-2 text-sm text-emerald-800">{offer.companyName} · {offer.address || `${offer.city}, ${offer.country}`}</p><p className="text-sm text-emerald-800">{offer.contactEmail}{offer.contactPhone ? ` · ${offer.contactPhone}` : ""}</p><ApplyButton offerId={offer.id} /></section> : <section className="mt-8 rounded-2xl bg-[#071b36] p-6 text-white"><p className="text-xs font-bold uppercase tracking-wider text-[#8ee0c0]">Informations protégées</p><h2 className="mt-2 font-display text-2xl font-extrabold">Postulez en toute sécurité</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Le nom, les coordonnées et le moyen de soumission de cette entreprise sont volontairement chiffrés. Décryptez cette offre pour 200 XOF ou activez un abonnement candidat.</p><div className="mt-5 flex flex-wrap gap-3"><Link href={`/emploi/offres/${offer.id}/decrypter`} className="rounded-xl bg-[#c91f3b] px-5 py-3 text-sm font-bold">Décrypter pour 200 XOF</Link><Link href="/emploi/abonnements" className="rounded-xl border border-white/30 px-5 py-3 text-sm font-bold">Voir les abonnements</Link></div></section>}
    </article>
  </div></main>;
}
