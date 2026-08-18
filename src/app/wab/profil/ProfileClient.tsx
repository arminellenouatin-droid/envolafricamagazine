"use client";

import { useEffect, useState } from "react";
import { AFRICA_COUNTRIES } from "@/lib/africa-context";
import FollowButton from "../FollowButton";

type Profile = { id: string; userId: string; fullName: string; headline: string; about: string; companyName?: string; industry?: string; country: string; city?: string; status: string };

type PublicPost = { id: string; content: string; createdAt: string; likes: number; comments: number; views: number; isBoosted: boolean; media?: Array<{ path: string; mimeType: string; name: string }> };
type PublicData = { profile: Profile | null; author?: string; avatarUrl?: string; postCount?: number; posts?: PublicPost[] };

export default function ProfileClient() {
  const [form, setForm] = useState({ headline: "", about: "", companyName: "", industry: "", country: "", city: "" });
  const [publicData, setPublicData] = useState<PublicData | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [publicMode, setPublicMode] = useState(false);

  useEffect(() => {
    const author = new URLSearchParams(window.location.search).get("author");
    if (author) {
      setPublicMode(true);
      fetch(`/api/wab/profile?author=${encodeURIComponent(author)}`).then((response) => response.json()).then((data: PublicData) => setPublicData(data)).catch(() => setPublicData({ profile: null, author }));
      return;
    }
    fetch("/api/wab/profile").then((response) => response.json()).then((data) => data.profile && setForm({ headline: data.profile.headline ?? "", about: data.profile.about ?? "", companyName: data.profile.companyName ?? "", industry: data.profile.industry ?? "", country: data.profile.country ?? "", city: data.profile.city ?? "" }));
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/wab/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab/profil")}`); return; }
      if (!response.ok) throw new Error(data.error);
      setMessage("Votre profil professionnel WAB est enregistré.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Enregistrement impossible."); }
    finally { setBusy(false); }
  }

  if (publicMode) {
    const profile = publicData?.profile;
    const name = profile?.fullName ?? publicData?.author ?? "Profil WAB";
    return <main className="min-h-screen bg-[#e9f7f5] py-10"><div className="mx-auto max-w-3xl px-5"><a href="/wab" className="text-sm font-bold text-[#006874]">← Retour au fil WAB</a><section className="mt-6 rounded-3xl border border-[#d1e9e6] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-5">{publicData?.avatarUrl ? <img src={publicData.avatarUrl} alt={name} className="h-24 w-24 rounded-full object-cover" /> : <div className="grid h-24 w-24 place-items-center rounded-full bg-[#d7e5e3] text-3xl font-bold text-[#006874]">{name.charAt(0)}</div>}<div><p className="text-xs font-bold uppercase tracking-widest text-[#006874]">Profil professionnel WAB</p><h1 className="mt-1 font-display text-3xl font-extrabold text-[#082843]">{name}</h1><p className="mt-1 text-[#43474d]">{profile?.headline ?? "Membre du réseau WAB"}</p>{profile?.userId && <div className="mt-3 flex items-center gap-3"><FollowButton userId={profile.userId} /><a href={`/wab/messages?userId=${encodeURIComponent(profile.userId)}`} className="rounded-full bg-[#006874] px-3 py-2 text-xs font-bold text-white">Envoyer un message</a></div>}</div></div>{profile ? <><p className="mt-6 leading-7 text-[#111e1d]">{profile.about}</p><div className="mt-6 grid gap-3 rounded-2xl bg-[#eefcfa] p-4 text-sm text-[#43474d] sm:grid-cols-2"><span><strong>Entreprise :</strong> {profile.companyName || "—"}</span><span><strong>Secteur :</strong> {profile.industry || "—"}</span><span><strong>Pays :</strong> {profile.country}</span><span><strong>Ville :</strong> {profile.city || "—"}</span><span><strong>Publications :</strong> {publicData?.postCount ?? 0}</span></div></> : <p className="mt-6 rounded-xl bg-[#fff3dc] p-4 text-sm text-[#875600]">Ce profil public est en cours de création. Vous pouvez tout de même consulter ses publications depuis le fil WAB.</p>}</section><section className="mt-6 space-y-4"><h2 className="font-display text-2xl font-extrabold text-[#082843]">Publications de {name}</h2>{publicData?.posts?.length ? publicData.posts.map((post) => <article key={post.id} className="rounded-3xl border border-[#d1e9e6] bg-white p-5 shadow-sm"><p className="whitespace-pre-line text-sm leading-7 text-[#111e1d]">{post.content}</p><div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-[#43474d]"><span>J’aime {post.likes}</span><span>Commentaires {post.comments}</span><span>Vues {post.views}</span>{post.isBoosted && <span className="rounded-full bg-[#fff0c7] px-2 py-1 text-[#875600]">Boostée</span>}</div></article>) : <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">Aucune publication publique pour le moment.</p>}</section></div></main>;
  }

  const field = "mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-[#087e8b]";
  return <main className="min-h-screen bg-[#f4f7f8] py-10"><div className="mx-auto max-w-3xl px-5"><p className="text-xs font-bold uppercase tracking-widest text-[#087e8b]">World Africa Business</p><h1 className="mt-2 font-display text-3xl font-extrabold text-[#082843]">Mon profil professionnel</h1><p className="mt-3 text-slate-600">Ce profil est propre à WAB. Une mesure de modération WAB n’impactera pas vos autres espaces Envol Africa.</p><form onSubmit={save} className="mt-7 rounded-3xl bg-white p-6 shadow-sm sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><label>Fonction / accroche<input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} required className={field} placeholder="Ex. Fondatrice · AgriTech" /></label><label>Entreprise<input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={field} /></label><label>Secteur<input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className={field} placeholder="Ex. Finance, Agro, Tech" /></label><label>Pays<select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required className={field}><option value="">Choisir</option>{AFRICA_COUNTRIES.map((country) => <option key={country.code}>{country.name}</option>)}</select></label><label>Ville<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={field} /></label></div><label className="mt-5 block">Présentation professionnelle<textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} required rows={7} className={field} placeholder="Votre expertise, votre activité et les opportunités que vous recherchez…" /></label>{message && <p className="mt-5 rounded-xl bg-[#e9f7f5] p-4 text-sm font-bold text-[#087e8b]">{message}</p>}<button disabled={busy} className="mt-6 rounded-xl bg-[#087e8b] px-6 py-3 font-bold text-white disabled:opacity-50">{busy ? "Enregistrement…" : "Enregistrer mon profil"}</button></form></div></main>;
}
