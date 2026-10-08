"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import NetworkExplorer from "@/components/affiliation/NetworkExplorer";
import GratificationPolicy from "@/components/affiliation/GratificationPolicy";
import { useLocale } from "@/components/LocaleProvider";

type Tab = "dashboard" | "network" | "link" | "commissions" | "payout" | "policy";

export default function AffiliationPage() {
  const { formatPrice } = useLocale();
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
      setNotice(`Le montant minimum de retrait est de ${formatPrice(10000)}.`);
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
      <main className="affiliation-page min-h-screen bg-[#fcf9f8] flex items-center justify-center p-6 text-[#2b2525]">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#9e001f] border-r-transparent align-[-0.125em]" />
          <p className="font-serif text-sm font-bold text-[#2b2525]">Chargement de votre espace...</p>
        </div>
      </main>
    );
  }

  // ÉCRAN 1 : Visiteur NON connecté (pas encore de compte)
  if (!user) {
    return (
      <main className="affiliation-page min-h-screen bg-[#fcf9f8] px-4 py-12 text-[#2b2525]">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* En-tête d'accueil éditorial */}
          <div className="rounded-[28px] border border-[#e5bdbb]/80 bg-white p-8 md:p-10 text-center shadow-sm">
            <span className="inline-block rounded-full bg-[#f2e8e6] border border-[#e5bdbb] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#9e001f]">
              Programme Partenaire & Ambassadeurs
            </span>
            <h1 className="mt-4 font-serif text-3xl md:text-5xl font-black text-[#2b2525]">
              Devenez Ambassadeur <span className="text-[#9e001f]">Envol Africa</span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm md:text-base leading-relaxed text-[#746665]">
              Rejoignez notre réseau exclusif 5×5, recommandez l’excellence éditoriale et générez des revenus récurrents sur 5 générations complètes sur les ventes de magazines et abonnements.
            </p>

            {/* Piliers du programme */}
            <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
              <div className="rounded-2xl border border-[#e5bdbb]/80 bg-[#fcf9f8] p-5 shadow-xs hover:border-[#9e001f]/40 transition">
                <span className="material-symbols-outlined text-[28px] text-[#9e001f]">account_tree</span>
                <h3 className="mt-2 text-sm font-black text-[#2b2525]">Matrice MLM 5×5</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#746665]">
                  5 filleuls directs max. Le débordement profite à toute votre équipe descendante.
                </p>
              </div>
              <div className="rounded-2xl border border-[#e5bdbb]/80 bg-[#fcf9f8] p-5 shadow-xs hover:border-[#9e001f]/40 transition">
                <span className="material-symbols-outlined text-[28px] text-[#9e001f]">payments</span>
                <h3 className="mt-2 text-sm font-black text-[#2b2525]">15% Reversement Global</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#746665]">
                  70% reversés sur 5 niveaux (40%, 25%, 15%, 12%, 8%), 10% prime annuelle, 20% cérémonie.
                </p>
              </div>
              <div className="rounded-2xl border border-[#e5bdbb]/80 bg-[#fcf9f8] p-5 shadow-xs hover:border-[#9e001f]/40 transition">
                <span className="material-symbols-outlined text-[28px] text-emerald-700">phone_iphone</span>
                <h3 className="mt-2 text-sm font-black text-[#2b2525]">Retraits Mobile Money</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#746665]">
                  Paiements rapides dès 10 000 XOF (MTN, Moov, Orange, Wave). 0 frais d’adhésion.
                </p>
              </div>
            </div>
          </div>

          {/* Politique Intégrale de Gratification */}
          <GratificationPolicy />

          {/* Bloc Inscription & Connexion */}
          <div className="rounded-[28px] border border-[#e5bdbb] bg-white p-8 md:p-10 text-center shadow-md space-y-5">
            <span className="inline-block rounded-full bg-[#f2e8e6] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#9e001f] border border-[#e5bdbb]">
              Adhésion 100% Gratuite
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-black text-[#2b2525]">
              Inscrivez-vous pour rejoindre le réseau
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#746665]">
              Pour obtenir votre lien d&apos;affiliation officiel, créer votre descendance 5×5 et percevoir vos commissions, créez un compte en 1 minute ou connectez-vous.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/auth/register?redirect=/affiliation"
                className="w-full sm:w-auto rounded-full bg-[#9e001f] hover:bg-[#7f0019] px-8 py-4 text-sm font-black text-white shadow-md transition flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Créer mon compte & M&apos;affilier</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <Link
                href="/auth/login?redirect=/affiliation"
                className="w-full sm:w-auto rounded-full border border-[#e5bdbb] bg-white hover:bg-[#fff0ef] hover:border-[#9e001f] px-8 py-4 text-sm font-bold text-[#2b2525] transition active:scale-95"
              >
                Déjà un compte ? Se connecter
              </Link>
            </div>

            <p className="text-xs text-[#746665]">
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
      <main className="affiliation-page min-h-screen bg-[#fcf9f8] px-4 py-12 text-[#2b2525]">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* En-tête d'accueil */}
          <div className="rounded-[28px] border border-[#e5bdbb]/80 bg-white p-8 text-center shadow-sm">
            <span className="inline-block rounded-full bg-[#f2e8e6] border border-[#e5bdbb] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#9e001f]">
              Programme Partenaire & Ambassadeurs
            </span>
            <h1 className="mt-4 font-serif text-3xl md:text-4xl font-black text-[#2b2525]">
              Rejoindre le Réseau d&apos;Ambassadeurs Envol Africa
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#746665]">
              Développez votre communauté, parrainez jusqu&apos;à 5 partenaires directs et percevez des
              gratifications sur 5 générations complètes sur les ventes de magazines et abonnements.
            </p>
          </div>

          {/* Intégration complète de la Politique de Gratification avec case d'acceptation */}
          <GratificationPolicy
            accepted={policyAccepted}
            onAcceptedChange={setPolicyAccepted}
          />

          {/* Bouton d'adhésion */}
          <div className="rounded-[24px] bg-white border border-[#e5bdbb]/80 p-6 md:p-8 text-center shadow-sm space-y-4">
            {notice && (
              <p className={`text-sm font-bold ${notice.includes("Félicitations") ? "text-emerald-700" : "text-[#9e001f]"}`}>
                {notice}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={activate}
                disabled={!policyAccepted || activating}
                className="w-full sm:w-auto rounded-full bg-[#9e001f] hover:bg-[#7f0019] px-8 py-4 text-sm font-black text-white shadow-md disabled:cursor-not-allowed disabled:opacity-40 transition active:scale-95"
              >
                {activating ? "Activation en cours..." : "✓ Oui, j'accepte et je m'affilie"}
              </button>
              <Link
                href="/"
                className="w-full sm:w-auto rounded-full border border-[#e5bdbb] bg-white px-6 py-4 text-sm font-bold text-[#746665] hover:bg-[#fff0ef] hover:border-[#9e001f] transition"
              >
                Pas maintenant
              </Link>
            </div>
            {!policyAccepted && (
              <p className="text-xs text-[#746665]">
                (Veuillez cocher la case d&apos;acceptation de la charte ci-dessus pour débloquer le bouton)
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
    <main className="affiliation-page min-h-screen bg-[#fcf9f8] px-4 py-10 text-[#2b2525]">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* En-tête principal éditorial */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#9e001f]">
              Programme Partenaire & Ambassadeurs
            </p>
            <h1 className="mt-2 font-serif text-3xl md:text-4xl font-black text-[#2b2525]">
              Votre Espace Ambassadeur
            </h1>
            <p className="mt-1 text-sm text-[#746665]">
              Code Officiel : <strong className="font-mono text-[#9e001f] bg-[#f2e8e6] border border-[#e5bdbb] px-2.5 py-0.5 rounded text-xs font-black">{user?.affiliateCode || "En cours..."}</strong> • Suivez votre descendance et vos gains.
            </p>
          </div>
          <Link
            href="/compte"
            className="rounded-full border border-[#e5bdbb] bg-white px-5 py-2.5 text-xs font-bold text-[#2b2525] hover:bg-[#fff0ef] hover:border-[#9e001f] shadow-sm transition"
          >
            ← Retour à mon compte
          </Link>
        </div>

        {/* Barre d'onglets principale */}
        <div className="flex gap-2 overflow-x-auto border-b border-[#e5bdbb] pb-1 custom-scrollbar">
          {tabs.map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs md:text-sm font-bold transition flex items-center gap-1.5 ${
                tab === key
                  ? "border-[#9e001f] text-[#9e001f] font-black"
                  : "border-transparent text-[#746665] hover:text-[#2b2525] hover:border-[#e5bdbb]"
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              {key === "network" && networkData?.totalNetworkCount > 0 && (
                <span className="ml-1 rounded-full bg-[#f2e8e6] border border-[#e5bdbb] px-2 py-0.5 text-[10px] font-black text-[#9e001f]">
                  {networkData.totalNetworkCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {notice && (
          <p className="rounded-xl bg-[#fff0ef] border border-[#e5bdbb] px-4 py-3 text-sm text-[#9e001f] font-medium">
            {notice}
          </p>
        )}

        {/* 1. ONGLET : DASHBOARD */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-[24px] bg-[#9e001f] p-6 text-white shadow-md border border-[#800019]">
                <p className="text-xs text-white/80 uppercase font-bold tracking-wider">
                  Commissions Cumulées
                </p>
                <p className="mt-2 text-3xl font-serif font-black notranslate" translate="no">{formatPrice(total)}</p>
                <p className="mt-1 text-xs text-white/80">Gains totaux Magazine & Marketplace</p>
              </div>

              <div className="rounded-[24px] bg-white p-6 shadow-sm border border-[#e5bdbb]/80">
                <p className="text-xs text-[#746665] uppercase font-bold tracking-wider">
                  Disponible au Retrait
                </p>
                <p className="mt-2 text-3xl font-serif font-black text-emerald-700 notranslate" translate="no">
                  {formatPrice(available)}
                </p>
                <p className="mt-1 text-xs text-[#746665]">Seuil de retrait : {formatPrice(10000)}</p>
              </div>

              <div className="rounded-[24px] bg-[#f4ecea] p-6 shadow-sm border border-[#e5bdbb] text-[#2b2525]">
                <p className="text-xs text-[#746665] uppercase font-bold tracking-wider">
                  Taille du Réseau
                </p>
                <p className="mt-2 text-3xl font-serif font-black text-[#2b2525]">
                  {networkData?.totalNetworkCount ?? 0} Membre(s)
                </p>
                <p className="mt-1 text-xs text-[#746665]">
                  {networkData?.directCount ?? 0} / 5 filleuls directs
                </p>
              </div>
            </div>

            {/* Raccourci vers Mon Réseau */}
            <div className="rounded-[24px] bg-gradient-to-r from-[#2b2525] to-[#421c22] p-6 md:p-8 text-white shadow-md border border-[#522930] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#ffdad8] tracking-wider bg-[#9e001f]/50 border border-[#ffdad8]/30 px-2.5 py-0.5 rounded-full">
                  Arbre Matriciel 5×5
                </span>
                <h3 className="text-xl md:text-2xl font-serif font-black mt-2 text-white">
                  Explorez Toute Votre Descendance (N1 à N5)
                </h3>
                <p className="text-xs text-white/80 mt-1 max-w-xl leading-relaxed">
                  Consultez chaque branche, chaque niveau de parrainage et visualisez les filleuls de vos
                  filleuls jusqu&apos;à la 5ᵉ génération.
                </p>
              </div>
              <button
                onClick={() => setTab("network")}
                className="rounded-full bg-[#9e001f] hover:bg-[#7f0019] text-white font-black text-xs px-6 py-3.5 shadow-md transition shrink-0 active:scale-95"
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
          <section className="rounded-[24px] bg-white p-6 md:p-8 shadow-sm border border-[#e5bdbb]/80 space-y-4">
            <div>
              <h2 className="text-xl font-serif font-black text-[#2b2525]">Votre Lien d&apos;Affiliation Officiel</h2>
              <p className="mt-1 text-sm text-[#746665]">
                Partagez ce lien officiel pour parrainer vos filleuls directs ou recommander les abonnements et le kiosque.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="min-w-0 flex-1 rounded-xl bg-[#fcf9f8] border border-[#e5bdbb] px-5 py-3 font-mono text-sm text-[#2b2525] select-all">
                {affiliateLink}
              </div>
              <button
                onClick={copyLink}
                className="rounded-xl bg-[#9e001f] px-6 py-3 text-sm font-bold text-white hover:bg-[#7f0019] transition shrink-0 shadow-sm active:scale-95"
              >
                {copied ? "Copié !" : "Copier le lien"}
              </button>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Découvrez Envol Africa Magazine et rejoignez mon réseau :\n\n${affiliateLink}`
                )}`}
                className="rounded-full bg-[#25D366] hover:bg-[#20ba59] px-4 py-2 text-xs font-bold text-white shadow-sm transition"
              >
                Partager sur WhatsApp
              </a>
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  affiliateLink
                )}`}
                className="rounded-full bg-[#0077b5] hover:bg-[#005f93] px-4 py-2 text-xs font-bold text-white shadow-sm transition"
              >
                Partager sur LinkedIn
              </a>
            </div>
          </section>
        )}

        {/* 4. ONGLET : COMMISSIONS */}
        {tab === "commissions" && (
          <section className="rounded-[24px] bg-white p-6 md:p-8 shadow-sm border border-[#e5bdbb]/80">
            <h2 className="text-xl font-serif font-black text-[#2b2525]">Historique des Commissions</h2>
            {earnings.length === 0 ? (
              <p className="mt-6 rounded-xl bg-[#fcf9f8] border border-[#e5bdbb] p-8 text-center text-sm text-[#746665]">
                Aucune commission pour le moment. Partagez votre lien officiel pour commencer.
              </p>
            ) : (
              <div className="mt-5 space-y-2">
                {earnings.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fcf9f8] border border-[#e5bdbb]/80 p-4 hover:border-[#9e001f]/40 transition"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#2b2525]">Commande #{String(item.orderId).slice(0, 8)}</p>
                      <p className="text-xs text-[#746665]">
                        {new Date(item.createdAt).toLocaleDateString("fr-FR")} · Statut : {item.status}
                      </p>
                    </div>
                    <strong className="text-[#9e001f] font-mono text-base font-bold">
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
          <section className="rounded-[24px] bg-white p-6 md:p-8 shadow-sm border border-[#e5bdbb]/80 space-y-4">
            <div>
              <h2 className="text-xl font-serif font-black text-[#2b2525]">Demande de Retrait Mobile Money</h2>
              <p className="mt-1 text-sm text-[#746665]">
                Retrait de vos gains d&apos;affiliation dès <strong>{formatPrice(10000)}</strong> via MTN, Moov, Orange
                ou Wave.
              </p>
            </div>

            <div className="rounded-xl bg-[#fcf9f8] border border-[#e5bdbb] p-5 space-y-4">
              <p className="text-sm text-[#2b2525]">
                Montant actuellement disponible au retrait :{" "}
                <strong className="text-emerald-700 text-lg font-serif font-black notranslate" translate="no">
                  {formatPrice(available)}
                </strong>
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-[#746665] mb-1">
                    Opérateur Mobile Money *
                  </label>
                  <select
                    value={mmProvider}
                    onChange={(e) => setMmProvider(e.target.value)}
                    className="w-full h-10 px-3 text-xs border border-[#e5bdbb] rounded-xl bg-white font-bold text-[#2b2525] focus:border-[#9e001f] outline-none"
                  >
                    <option value="MTN">MTN Mobile Money</option>
                    <option value="MOOV">Moov Money</option>
                    <option value="ORANGE">Orange Money</option>
                    <option value="WAVE">Wave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#746665] mb-1">
                    Numéro de Téléphone *
                  </label>
                  <input
                    type="tel"
                    placeholder="ex: 0197000000"
                    value={mmNumber}
                    onChange={(e) => setMmNumber(e.target.value)}
                    className="w-full h-10 px-3 text-xs border border-[#e5bdbb] rounded-xl bg-white font-mono text-[#2b2525] focus:border-[#9e001f] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#746665] mb-1">
                    Montant souhaité (XOF)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    max={available}
                    placeholder={`Max : ${available}`}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full h-10 px-3 text-xs border border-[#e5bdbb] rounded-xl bg-white text-[#2b2525] focus:border-[#9e001f] outline-none"
                  />
                </div>
              </div>

              <button
                onClick={requestPayout}
                disabled={available < 10000}
                className="mt-2 rounded-full bg-[#9e001f] hover:bg-[#7f0019] px-7 py-3.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 shadow-md transition active:scale-95"
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
