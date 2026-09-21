"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NetworkExplorer from "@/components/affiliation/NetworkExplorer";
import GratificationPolicy from "@/components/affiliation/GratificationPolicy";

type Tab = "dashboard" | "network" | "link" | "commissions" | "payout" | "policy";

export default function AffiliationPage() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [networkData, setNetworkData] = useState<any>(null);
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [activating, setActivating] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [mmProvider, setMmProvider] = useState("MTN");
  const [mmNumber, setMmNumber] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  useEffect(() => {
    // Vérifier paramètre d'URL tab
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab") as Tab | null;
      if (urlTab && ["dashboard", "network", "link", "commissions", "payout", "policy"].includes(urlTab)) {
        setTab(urlTab);
      }
    }

    setLoadingUser(true);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        if (data.user) {
          fetch("/api/affiliate")
            .then((r) => (r.ok ? r.json() : { earnings: [] }))
            .then((d) => setEarnings(d.earnings || []));

          setLoadingNetwork(true);
          fetch("/api/affiliate/me/network")
            .then((r) => (r.ok ? r.json() : null))
            .then((net) => {
              if (net) setNetworkData(net);
            })
            .finally(() => setLoadingNetwork(false));
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoadingUser(false));
  }, []);

  const isAffiliate =
    Boolean(user?.affiliateAccepted) ||
    ["admin", "gerant", "redacteur", "redacteur_chef"].includes(user?.role);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://www.envolafrica.site";
  const affiliateLink = user?.affiliateCode ? `${siteUrl}?ref=${user.affiliateCode}` : "";
  const total = useMemo(
    () => earnings.reduce((sum, item) => sum + Number(item.commission || 0), 0),
    [earnings]
  );
  const available = useMemo(
    () =>
      earnings
        .filter((item) => item.status === "available")
        .reduce((sum, item) => sum + Number(item.commission || 0), 0),
    [earnings]
  );

  async function activate() {
    if (!policyAccepted) {
      setNotice("Veuillez cocher la case d'acceptation de la Politique de Gratification pour continuer.");
      return;
    }
    setActivating(true);
    setNotice("");
    const response = await fetch("/api/affiliate/activate", { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      setNotice(data.error || "Impossible d’activer l’affiliation.");
    } else {
      setUser(data.user);
      setNotice("Félicitations ! Votre compte Ambassadeur est activé avec succès.");
      setTab("network");
      // Recharger le réseau
      fetch("/api/affiliate/me/network")
        .then((r) => (r.ok ? r.json() : null))
        .then((net) => {
          if (net) setNetworkData(net);
        });
    }
    setActivating(false);
  }

  async function requestPayout() {
    const amt = Number(withdrawAmount) || available;
    if (amt < 10000) {
      setNotice("Le montant minimum de retrait est de 10 000 F CFA.");
      return;
    }
    if (!mmNumber.trim()) {
      setNotice("Veuillez renseigner votre numéro Mobile Money.");
      return;
    }
    const response = await fetch("/api/affiliate/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amt,
        mobileMoneyProvider: mmProvider,
        mobileMoneyNumber: mmNumber.trim(),
      }),
    });
    const data = await response.json();
    setNotice(
      response.ok
        ? data.message || "Votre demande de paiement a été enregistrée avec succès."
        : data.error || "Impossible d’enregistrer la demande."
    );
    if (response.ok) {
      setWithdrawAmount("");
      setMmNumber("");
    }
  }

  async function copyLink() {
    if (!affiliateLink) return;
    await navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // CHARGEMENT INITIAL
  if (loadingUser) {
    return (
      <main className="min-h-screen bg-[#FFFCF5] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0A1931] border-r-transparent align-[-0.125em]" />
          <p className="font-serif text-sm font-bold text-[#0A1931]">Chargement de votre espace...</p>
        </div>
      </main>
    );
  }

  // ÉCRAN 1 : Visiteur NON connecté (pas encore de compte)
  if (!user) {
    return (
      <main className="min-h-screen bg-[#FFFCF5] px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* En-tête d'accueil */}
          <div className="rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <span className="inline-block rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-4 py-1 text-xs font-black uppercase tracking-wider text-[#0A1931]">
              Programme Partenaire & Ambassadeurs
            </span>
            <h1 className="mt-4 font-serif text-3xl md:text-4xl font-black text-[#0A1931]">
              Devenez Ambassadeur Envol Africa
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Rejoignez notre réseau exclusif 5×5, recommandez l’excellence éditoriale et générez des revenus récurrents sur 5 générations complètes sur les ventes de magazines et abonnements.
            </p>

            {/* Piliers du programme */}
            <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-100 bg-[#FFFCF5] p-5 shadow-xs">
                <span className="material-symbols-outlined text-[28px] text-[#D4AF37]">account_tree</span>
                <h3 className="mt-2 text-sm font-black text-[#0A1931]">Matrice MLM 5×5</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  5 filleuls directs max. Le débordement profite à toute votre équipe descendante.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-100 bg-[#FFFCF5] p-5 shadow-xs">
                <span className="material-symbols-outlined text-[28px] text-[#0A1931]">payments</span>
                <h3 className="mt-2 text-sm font-black text-[#0A1931]">15% Reversement Global</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  70% reversés sur 5 niveaux (40%, 25%, 15%, 12%, 8%), 10% prime annuelle, 20% cérémonie.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-100 bg-[#FFFCF5] p-5 shadow-xs">
                <span className="material-symbols-outlined text-[28px] text-[#16a34a]">phone_iphone</span>
                <h3 className="mt-2 text-sm font-black text-[#0A1931]">Retraits Mobile Money</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  Paiements rapides dès 10 000 XOF (MTN, Moov, Orange, Wave). 0 frais d’adhésion.
                </p>
              </div>
            </div>
          </div>

          {/* Politique Intégrale de Gratification */}
          <GratificationPolicy />

          {/* Bloc Inscription & Connexion */}
          <div className="rounded-[28px] border border-[#e5bdbb] bg-white p-8 md:p-10 text-center shadow-lg space-y-5">
            <span className="inline-block rounded-full bg-[#9e001f]/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#9e001f]">
              Adhésion 100% Gratuite
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-black text-[#0A1931]">
              Inscrivez-vous pour rejoindre le réseau
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-zinc-600">
              Pour obtenir votre lien d'affiliation officiel, créer votre descendance 5×5 et percevoir vos commissions, créez un compte en 1 minute ou connectez-vous.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/auth/register?redirect=/affiliation"
                className="w-full sm:w-auto rounded-full bg-[#0A1931] hover:bg-black px-8 py-4 text-sm font-black text-white shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Créer mon compte & M'affilier</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <Link
                href="/auth/login?redirect=/affiliation"
                className="w-full sm:w-auto rounded-full border border-zinc-300 hover:bg-zinc-50 px-8 py-4 text-sm font-bold text-[#0A1931] transition"
              >
                Déjà un compte ? Se connecter
              </Link>
            </div>

            <p className="text-xs text-zinc-400">
              Aucun frais d’entrée • Vente réelle de magazines et abonnements uniquement
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ÉCRAN 2 : Utilisateur connecté mais NON encore affilié (Onboarding & Activation)
  if (user && !isAffiliate) {
    return (
      <main className="min-h-screen bg-[#FFFCF5] px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* En-tête d'accueil */}
          <div className="rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <span className="inline-block rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-4 py-1 text-xs font-black uppercase tracking-wider text-[#0A1931]">
              Programme Partenaire & Ambassadeurs
            </span>
            <h1 className="mt-4 font-serif text-3xl md:text-4xl font-black text-[#0A1931]">
              Rejoindre le Réseau d'Ambassadeurs Envol Africa
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Développez votre communauté, parrainez jusqu'à 5 partenaires directs et percevez des
              gratifications sur 5 générations complètes sur les ventes de magazines et abonnements.
            </p>
          </div>

          {/* Intégration complète de la Politique de Gratification avec case d'acceptation */}
          <GratificationPolicy
            accepted={policyAccepted}
            onAcceptedChange={setPolicyAccepted}
          />

          {/* Bouton d'adhésion */}
          <div className="rounded-[24px] bg-white border p-6 text-center shadow-sm space-y-4">
            {notice && (
              <p className={`text-sm font-bold ${notice.includes("Félicitations") ? "text-emerald-700" : "text-amber-800"}`}>
                {notice}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={activate}
                disabled={!policyAccepted || activating}
                className="w-full sm:w-auto rounded-full bg-[#0A1931] hover:bg-black px-8 py-4 text-sm font-black text-white shadow-md disabled:cursor-not-allowed disabled:opacity-40 transition"
              >
                {activating ? "Activation en cours..." : "✓ Oui, j'accepte et je m'affilie"}
              </button>
              <Link
                href="/"
                className="w-full sm:w-auto rounded-full border border-zinc-300 px-6 py-4 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition"
              >
                Pas maintenant
              </Link>
            </div>
            {!policyAccepted && (
              <p className="text-xs text-zinc-400">
                (Veuillez cocher la case d'acceptation de la charte ci-dessus pour débloquer le bouton)
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ÉCRAN ESPACE AFFILIÉ ACTIF
  const tabs: Array<[Tab, string, string]> = [
    ["dashboard", "Dashboard", "📊"],
    ["network", "Mon Réseau 5×5", "🌳"],
    ["link", "Lien affilié", "🔗"],
    ["commissions", "Commissions", "💰"],
    ["payout", "Retraits Mobile Money", "💸"],
    ["policy", "Politique de Gratification", "📜"],
  ];

  return (
    <main className="min-h-screen bg-[#FFFCF5] px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* En-tête principal */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
              Programme Partenaire & Ambassadeurs
            </p>
            <h1 className="mt-2 font-serif text-3xl md:text-4xl font-black text-[#0A1931]">
              Votre Espace Ambassadeur
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Code Officiel : <strong className="font-mono text-[#D4AF37] bg-[#0A1931] px-2 py-0.5 rounded text-xs">{user?.affiliateCode || "En cours..."}</strong> • Suivez votre descendance et vos gains.
            </p>
          </div>
          <Link
            href="/compte"
            className="rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-[#0A1931] hover:bg-zinc-50 shadow-sm"
          >
            ← Retour à mon compte
          </Link>
        </div>

        {/* Barre d'onglets principale */}
        <div className="flex gap-2 overflow-x-auto border-b border-zinc-200 pb-1">
          {tabs.map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs md:text-sm font-bold transition flex items-center gap-1.5 ${
                tab === key
                  ? "border-[#0A1931] text-[#0A1931] font-black"
                  : "border-transparent text-zinc-500 hover:text-[#0A1931]"
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              {key === "network" && networkData?.totalNetworkCount > 0 && (
                <span className="ml-1 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-black text-[#0A1931]">
                  {networkData.totalNetworkCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {notice && (
          <p className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium">
            {notice}
          </p>
        )}

        {/* 1. ONGLET : DASHBOARD */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl bg-[#0A1931] p-6 text-white shadow-sm">
                <p className="text-xs text-white/60 uppercase font-bold tracking-wider">
                  Commissions Cumulées
                </p>
                <p className="mt-2 text-3xl font-black">{total.toLocaleString("fr-FR")} F</p>
                <p className="mt-1 text-xs text-white/60">Gains totaux Magazine & Marketplace</p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm border">
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">
                  Disponible au Retrait
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-700">
                  {available.toLocaleString("fr-FR")} F
                </p>
                <p className="mt-1 text-xs text-zinc-400">Seuil de retrait : 10 000 F CFA</p>
              </div>

              <div className="rounded-2xl bg-[#D4AF37] p-6 shadow-sm">
                <p className="text-xs text-[#0A1931]/70 uppercase font-bold tracking-wider">
                  Taille du Réseau
                </p>
                <p className="mt-2 text-3xl font-black text-[#0A1931]">
                  {networkData?.totalNetworkCount ?? 0} Membre(s)
                </p>
                <p className="mt-1 text-xs text-[#0A1931]/80">
                  {networkData?.directCount ?? 0} / 5 filleuls directs
                </p>
              </div>
            </div>

            {/* Raccourci vers Mon Réseau */}
            <div className="rounded-2xl bg-gradient-to-r from-[#0A1931] to-[#162F59] p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#D4AF37] tracking-wider">
                  Arbre Matriciel 5×5
                </span>
                <h3 className="text-xl font-serif font-black mt-1">
                  Explorez Toute Votre Descendance (N1 à N5)
                </h3>
                <p className="text-xs text-zinc-300 mt-1 max-w-xl">
                  Consultez chaque branche, chaque niveau de parrainage et visualisez les filleuls de vos
                  filleuls jusqu'à la 5ᵉ génération.
                </p>
              </div>
              <button
                onClick={() => setTab("network")}
                className="rounded-full bg-[#D4AF37] hover:bg-amber-400 text-[#0A1931] font-black text-xs px-6 py-3 shadow transition shrink-0"
              >
                Ouvrir Mon Réseau 5×5 →
              </button>
            </div>
          </div>
        )}

        {/* 2. ONGLET : MON RÉSEAU 5×5 */}
        {tab === "network" && (
          <div className="space-y-4">
            <NetworkExplorer data={networkData} loading={loadingNetwork} />
          </div>
        )}

        {/* 3. ONGLET : LIEN AFFILIÉ */}
        {tab === "link" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm border space-y-4">
            <div>
              <h2 className="text-xl font-black text-[#0A1931]">Votre Lien d'Affiliation Officiel</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Partagez ce lien officiel pour parrainer vos filleuls directs ou recommander les abonnements et le kiosque.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="min-w-0 flex-1 rounded-xl bg-zinc-50 border border-zinc-200 px-5 py-3 font-mono text-sm text-zinc-700 select-all">
                {affiliateLink}
              </div>
              <button
                onClick={copyLink}
                className="rounded-xl bg-[#0A1931] px-6 py-3 text-sm font-bold text-white hover:bg-black transition shrink-0"
              >
                {copied ? "Copié !" : "Copier le lien"}
              </button>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Découvrez Envol Africa Magazine et rejoignez mon réseau : ${affiliateLink}`
                )}`}
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Partager sur WhatsApp
              </a>
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  affiliateLink
                )}`}
                className="rounded-full bg-[#0A1931] px-4 py-2 text-xs font-bold text-white hover:bg-black"
              >
                Partager sur LinkedIn
              </a>
            </div>
          </section>
        )}

        {/* 4. ONGLET : COMMISSIONS */}
        {tab === "commissions" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm border">
            <h2 className="text-xl font-black text-[#0A1931]">Historique des Commissions</h2>
            {earnings.length === 0 ? (
              <p className="mt-6 rounded-xl bg-zinc-50 p-8 text-center text-sm text-zinc-500">
                Aucune commission pour le moment. Partagez votre lien officiel pour commencer.
              </p>
            ) : (
              <div className="mt-5 space-y-2">
                {earnings.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 border p-4"
                  >
                    <div>
                      <p className="text-sm font-bold">Commande #{String(item.orderId).slice(0, 8)}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(item.createdAt).toLocaleDateString("fr-FR")} · Statut : {item.status}
                      </p>
                    </div>
                    <strong className="text-emerald-700 font-mono text-base">
                      +{Number(item.commission).toLocaleString("fr-FR")} F
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 5. ONGLET : RETRAITS MOBILE MONEY */}
        {tab === "payout" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm border space-y-4">
            <div>
              <h2 className="text-xl font-black text-[#0A1931]">Demande de Retrait Mobile Money</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Retrait de vos gains d'affiliation dès <strong>10 000 F CFA</strong> via MTN, Moov, Orange
                ou Wave.
              </p>
            </div>

            <div className="rounded-xl bg-zinc-50 border p-5 space-y-4">
              <p className="text-sm">
                Montant actuellement disponible au retrait :{" "}
                <strong className="text-emerald-700 text-lg font-black">
                  {available.toLocaleString("fr-FR")} F CFA
                </strong>
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Opérateur Mobile Money *
                  </label>
                  <select
                    value={mmProvider}
                    onChange={(e) => setMmProvider(e.target.value)}
                    className="w-full h-10 px-3 text-xs border rounded-xl bg-white font-bold"
                  >
                    <option value="MTN">MTN Mobile Money</option>
                    <option value="MOOV">Moov Money</option>
                    <option value="ORANGE">Orange Money</option>
                    <option value="WAVE">Wave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Numéro de Téléphone *
                  </label>
                  <input
                    type="tel"
                    placeholder="ex: 0197000000"
                    value={mmNumber}
                    onChange={(e) => setMmNumber(e.target.value)}
                    className="w-full h-10 px-3 text-xs border rounded-xl bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1">
                    Montant souhaité (XOF)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    max={available}
                    placeholder={`Max : ${available}`}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full h-10 px-3 text-xs border rounded-xl bg-white"
                  />
                </div>
              </div>

              <button
                onClick={requestPayout}
                disabled={available < 10000}
                className="mt-2 rounded-full bg-[#0A1931] hover:bg-black px-6 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 transition"
              >
                {available >= 10000
                  ? "Demander le retrait Mobile Money"
                  : "Seuil minimum de 10 000 F non atteint"}
              </button>
            </div>
          </section>
        )}

        {/* 6. ONGLET : POLITIQUE DE GRATIFICATION */}
        {tab === "policy" && (
          <div className="space-y-4">
            <GratificationPolicy />
          </div>
        )}
      </div>
    </main>
  );
}
