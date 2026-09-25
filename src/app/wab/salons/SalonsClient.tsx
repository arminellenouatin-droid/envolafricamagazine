"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Salon {
  id: string;
  host: string;
  hostUserId?: string;
  title: string;
  description: string;
  startsAt: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  participants: number;
}

export default function SalonsClient() {
  const router = useRouter();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedLiveCount, setFollowedLiveCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "live" | "scheduled">("all");

  // Modal Lancer un Salon (Live)
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLiveNow, setIsLiveNow] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadSalons = async () => {
    try {
      const res = await fetch("/api/wab/salons");
      const data = await res.json();
      if (data.salons) {
        setSalons(data.salons);
        setFollowedLiveCount(data.followedLiveCount || 0);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadSalons();
    const timer = setInterval(loadSalons, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleCreateSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 3) {
      setErrorMsg("Veuillez renseigner un titre d'au moins 3 caractères.");
      return;
    }

    setCreating(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/wab/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          isLiveNow,
          startsAt: isLiveNow ? new Date().toISOString() : startsAt,
          status: isLiveNow ? "live" : "scheduled",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/wab/salons")}`);
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.error || "Impossible de lancer le Salon.");
        setCreating(false);
        return;
      }

      // Rediriger immédiatement vers le live
      if (data.salon?.id) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`eam_live_host_${data.salon.id}`, "true");
        }
        router.push(`/wab/salons/${data.salon.id}`);
      } else {
        loadSalons();
        setShowLaunchModal(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur de connexion.");
    } finally {
      setCreating(false);
    }
  };

  const activeLives = salons.filter((s) => s.status === "live");
  const upcomingSalons = salons.filter((s) => s.status === "scheduled");

  return (
    <main className="min-h-screen bg-[#f4f7f8] py-8 px-4 md:px-8 pb-24 text-[#082843]">
      <div className="mx-auto max-w-6xl">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#006874]">
              <Link href="/wab" className="hover:underline">
                World Africa Business
              </Link>
              <span>›</span>
              <span>Salons & Directs</span>
            </div>
            <h1 className="mt-2 font-display text-3xl md:text-4xl font-black text-[#082843]">
              Salons Professionnels & Lives
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              Participez à des échanges vidéo en direct, posez vos questions aux leaders économiques et lancez vos propres salons façon TikTok Live.
            </p>
          </div>

          {/* Bouton Lancer un Live */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLaunchModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9e001f] to-[#e63946] px-6 py-3.5 text-xs font-black text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-lg">videocam</span>
              Lancer un direct (Salon)
            </button>
          </div>
        </div>

        {/* Badge comptes suivis en direct */}
        {followedLiveCount > 0 && (
          <div className="mt-6 flex items-center justify-between bg-gradient-to-r from-red-600 to-[#9e001f] text-white px-5 py-3 rounded-2xl shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="text-xs font-bold">
                {followedLiveCount} compte{followedLiveCount > 1 ? "s" : ""} que vous suivez {followedLiveCount > 1 ? "sont" : "est"} actuellement en direct !
              </span>
            </div>
            <button
              onClick={() => setActiveTab("live")}
              className="text-[11px] font-black underline hover:no-underline"
            >
              Voir les directs →
            </button>
          </div>
        )}

        {/* Filtres Onglets */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              activeTab === "all"
                ? "bg-[#082843] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tous ({salons.length})
          </button>
          <button
            onClick={() => setActiveTab("live")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === "live"
                ? "bg-red-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            En direct maintenant ({activeLives.length})
          </button>
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              activeTab === "scheduled"
                ? "bg-[#082843] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            À venir ({upcomingSalons.length})
          </button>
        </div>

        {/* SECTION 1 : Les Directs Actifs (Grille TikTok Live) */}
        {(activeTab === "all" || activeTab === "live") && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-black text-xl text-[#082843] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                Salons en Direct (Lives)
              </h2>
            </div>

            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500">Chargement des lives...</div>
            ) : activeLives.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">videocam_off</span>
                <p className="font-bold text-sm text-slate-700">Aucun Salon en direct pour le moment.</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">Soyez le premier à lancer un live pour votre communauté !</p>
                <button
                  type="button"
                  onClick={() => setShowLaunchModal(true)}
                  className="bg-[#9e001f] text-white px-5 py-2.5 rounded-full text-xs font-bold"
                >
                  Lancer mon direct
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeLives.map((salon) => (
                  <Link
                    key={salon.id}
                    href={`/wab/salons/${salon.id}`}
                    className="group relative flex flex-col justify-between rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 to-black text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 h-[380px]"
                  >
                    {/* Background image preview */}
                    <div className="absolute inset-0 z-0 opacity-60 group-hover:opacity-80 transition-opacity">
                      <img
                        src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&auto=format&fit=crop"
                        alt={salon.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    </div>

                    {/* Top Chips */}
                    <div className="relative z-10 p-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white font-black text-[10px] uppercase tracking-wider shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        EN DIRECT
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        {salon.participants || 120}
                      </span>
                    </div>

                    {/* Bottom Info */}
                    <div className="relative z-10 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs ring-2 ring-emerald-400">
                          {salon.host.slice(0, 1)}
                        </div>
                        <span className="text-xs font-bold text-emerald-300 drop-shadow">
                          {salon.host}
                        </span>
                      </div>

                      <h3 className="font-display font-black text-base md:text-lg text-white leading-snug line-clamp-2 drop-shadow mb-1">
                        {salon.title}
                      </h3>

                      <p className="text-xs text-white/80 line-clamp-2 leading-relaxed mb-4">
                        {salon.description}
                      </p>

                      <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-300 group-hover:translate-x-1 transition-transform">
                        <span>Rejoindre le direct</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION 2 : Les Salons Programmés */}
        {(activeTab === "all" || activeTab === "scheduled") && (
          <section className="mt-12">
            <h2 className="font-display font-black text-xl text-[#082843] mb-4">
              Salons Programmés & Débats à venir
            </h2>

            {upcomingSalons.length === 0 ? (
              <p className="text-xs text-slate-500 bg-white rounded-2xl p-6 text-center border border-slate-200">
                Aucun salon programmé pour les prochains jours.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingSalons.map((salon) => (
                  <div
                    key={salon.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="font-bold text-[#006874] bg-[#eefcfa] px-2.5 py-0.5 rounded-full">
                          Programmé
                        </span>
                        <span>{new Date(salon.startsAt).toLocaleString("fr-FR")}</span>
                      </div>

                      <h3 className="font-display font-black text-lg text-[#082843] mb-1">
                        {salon.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                        {salon.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-700">
                        Animé par {salon.host}
                      </span>
                      <Link
                        href={`/wab/salons/${salon.id}`}
                        className="bg-[#082843] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#006874] transition-colors"
                      >
                        Voir le Salon
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL LANCER UN LIVE (SALON)                             */}
      {/* ======================================================== */}
      {showLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowLaunchModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="mb-6">
              <span className="px-2.5 py-1 rounded bg-red-100 text-red-700 text-[10px] font-extrabold uppercase tracking-wider">
                Studio de Direct WAB
              </span>
              <h3 className="text-xl font-black font-display text-[#082843] mt-2">
                Lancer un Salon en Direct
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Activez votre caméra et interagissez en temps réel avec votre communauté professionnelle.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSalon} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Titre du direct / Sujet du débat *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Retour d'expérience sur notre levée de fonds..."
                  className="w-full rounded-xl border border-slate-300 p-3 focus:border-[#9e001f] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Description & Thématiques abordées
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Présentez les enjeux, les opportunités, invitez les participants à poser leurs questions..."
                  className="w-full rounded-xl border border-slate-300 p-3 focus:border-[#9e001f] focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Démarrer en direct immédiatement</span>
                  <span className="text-[11px] text-slate-500">Votre caméra s'activera dès la validation</span>
                </div>
                <input
                  type="checkbox"
                  checked={isLiveNow}
                  onChange={(e) => setIsLiveNow(e.target.checked)}
                  className="w-5 h-5 accent-[#9e001f] rounded cursor-pointer"
                />
              </div>

              {!isLiveNow && (
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Date et heure du direct</label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLaunchModal(false)}
                  className="flex-1 border py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-gradient-to-r from-[#9e001f] to-red-600 hover:from-[#c8102e] hover:to-red-700 text-white py-3 rounded-xl font-bold shadow-md disabled:opacity-50"
                >
                  {creating ? "Lancement..." : isLiveNow ? "Démarrer le Live 🔴" : "Programmer le Salon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
