"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export default function ProjetDetail({ id: propId, initialProjet }: { id?: string; initialProjet?: any }) {
  const { formatPrice } = useLocale();
  const params = useParams();
  const id = (params?.id as string) || propId || initialProjet?.id || "";
  const [projet, setProjet] = useState<any>(initialProjet || null);
  const [tab, setTab] = useState<"don" | "prise_part" | "pret">("don");
  const [montant, setMontant] = useState(10000);
  const [pourcentage, setPourcentage] = useState(1);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "moneroo">("wallet");
  const [wallet, setWallet] = useState<{ availableBalance: number; currency: string } | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(() => {
    if (!initialProjet?.dateFin) return 0;
    return Math.max(0, Math.ceil((new Date(initialProjet.dateFin).getTime() - Date.now()) / 86400000));
  });

  // Charger le projet et le portefeuille de l'utilisateur
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("eam_current_platform", "crowdfunding");
    }

    if (initialProjet && initialProjet.id === id) {
      setProjet(initialProjet);
      setDaysRemaining(Math.max(0, Math.ceil((new Date(initialProjet.dateFin).getTime() - Date.now()) / 86400000)));
    } else {
      fetch(`/api/crowdfunding/projects?id=${id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.projet) {
            setProjet(d.projet);
            setDaysRemaining(Math.max(0, Math.ceil((new Date(d.projet.dateFin).getTime() - Date.now()) / 86400000)));
          }
        });
    }

    // Récupérer le solde du portefeuille Envol Africa
    setWalletLoading(true);
    fetch("/api/wallet")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.wallet) {
          setWallet({
            availableBalance: Number(data.wallet.availableBalance || 0),
            currency: data.wallet.currency || "XOF",
          });
        }
      })
      .catch(() => {})
      .finally(() => setWalletLoading(false));
  }, [id, initialProjet]);

  if (!projet) return <div className="p-10 text-center">Chargement projet...</div>;

  const pct = Math.round((projet.montantCollecte / projet.montantRecherche) * 100);
  const valorisation = projet.valorisation || Math.round(projet.montantRecherche / 0.2);
  const totalEquityOffered = Number(projet.pourcentageTotalOffert || 20);
  const alreadySold = Number(projet.pourcentageVendu || 0);
  const equityAvailable = Math.max(0, Math.round((totalEquityOffered - alreadySold) * 100) / 100);

  // Estimation de la mensualité de prêt
  const dureeMois = Math.max(1, Math.ceil(Number(projet.dureeJours || 365) / 30));
  const tauxMensuel = (Number(projet.tauxInteret || 8) / 100) / 12;
  const mensualiteEstimee =
    tauxMensuel === 0
      ? Math.round(montant / dureeMois)
      : Math.round((montant * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -dureeMois)));

  const startContribution = async (mode: "don" | "prise_part" | "pret", amountToPay: number, pctPart?: number) => {
    if (!Number.isFinite(amountToPay) || amountToPay <= 0 || paying) return;
    setPaying(true);
    setSuccessMessage(null);

    const useWallet = paymentMethod === "wallet" && wallet !== null;

    if (useWallet && wallet.availableBalance < amountToPay) {
      window.alert(
        `Solde insuffisant dans votre portefeuille (${formatPrice(wallet.availableBalance)}). Veuillez recharger votre portefeuille ou choisir le paiement par Mobile Money.`
      );
      setPaying(false);
      return;
    }

    try {
      const response = await fetch("/api/crowdfunding/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          mode,
          amount: amountToPay,
          percentage: pctPart,
          use_wallet: useWallet,
        }),
      });

      const data = await response.json();

      if (data.paidWithWallet) {
        setSuccessMessage(data.message || "Contribution enregistrée avec succès !");
        if (typeof data.walletRemainingBalance === "number") {
          setWallet((prev) => prev ? { ...prev, availableBalance: data.walletRemainingBalance } : null);
        }
        // Recharger les données du projet
        fetch(`/api/crowdfunding/projects?id=${id}`)
          .then((r) => r.json())
          .then((d) => {
            if (d?.projet) setProjet(d.projet);
          });
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        window.alert(data.error || "Paiement indisponible.");
      }
    } catch {
      window.alert("Une erreur est survenue lors de l'initialisation de la contribution.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="bg-[#fcf9f8] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#5c403f]">
          <Link href="/financement" className="hover:text-[#9e001f]">
            Crowdfunding
          </Link>
          <span>›</span>
          <span className="text-black font-bold">{projet.nom}</span>
        </div>

        {successMessage && (
          <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-200 text-green-900 text-[13px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <span className="font-medium">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-green-700 font-bold hover:underline">
              Fermer
            </button>
          </div>
        )}

        <div className="mt-6 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="aspect-video rounded-xl overflow-hidden bg-[#eae7e7]">
              <img src={projet.images?.[0] || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600"} alt="" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-[28px] font-black mt-6 leading-tight" style={{ fontFamily: "Montserrat" }}>
              {projet.nom}
            </h1>
            <div className="flex items-center gap-2 mt-3 text-[11px]">
              <span className="bg-[#ffdad8] text-[#9e001f] px-2 py-1 rounded-full font-bold uppercase">
                {projet.secteur}
              </span>
              <span className="bg-[#f0eded] px-2 py-1 rounded-full">
                {projet.pays} • Risque {projet.niveauRisque}
              </span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                {projet.statut}
              </span>
            </div>
            <p className="text-[15px] leading-7 mt-4 text-[#1b1c1c]">{projet.description}</p>

            <div className="mt-8 border-t border-[#e5bdbb]/30 pt-8">
              <h3 className="font-bold">Documents & Vérifications Officielles</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full bg-[#f6f3f2] border text-[11px]">📄 Carte d'identité vérifiée</span>
                <span className="px-3 py-1.5 rounded-full bg-[#f6f3f2] border text-[11px]">📄 Registre de commerce</span>
                <span className="px-3 py-1.5 rounded-full bg-[#f6f3f2] border text-[11px]">📄 Business plan certifié</span>
                <span className="px-3 py-1.5 rounded-full bg-[#f6f3f2] border text-[11px]">🔒 Compte séquestre EAM</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-[16px] border border-[#e5bdbb] p-6 sticky top-24 shadow-sm">
              <div className="flex justify-between text-[11px] mb-1">
                <span>Progression</span>
                <span className="font-bold">{pct}%</span>
              </div>
              <div className="h-2 bg-[#f0eded] rounded-full overflow-hidden">
                <div className="h-full bg-[#9e001f]" style={{ width: `${Math.min(100, pct)}%` }}></div>
              </div>
              <div className="flex justify-between text-[12px] mt-2">
                <span className="font-bold notranslate" translate="no">{formatPrice(projet.montantCollecte)}</span>
                <span className="text-[#5c403f] notranslate" translate="no">sur {formatPrice(projet.montantRecherche)}</span>
              </div>
              <div className="flex justify-between text-[11px] mt-3 text-[#5c403f]">
                <span>{projet.investisseurs} investisseurs</span>
                <span>{daysRemaining}j restants</span>
              </div>

              {/* SÉLECTEUR DE MÉTHODE DE PAIEMENT */}
              <div className="mt-5 p-3 rounded-xl bg-[#f6f3f2] border border-[#e5bdbb]/50">
                <div className="text-[11px] font-bold text-[#5c403f] mb-2 uppercase tracking-wide">
                  Moyen de règlement
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("wallet")}
                    className={`p-2 rounded-lg font-bold border transition text-left flex flex-col justify-between ${
                      paymentMethod === "wallet"
                        ? "bg-[#9e001f] text-white border-[#9e001f]"
                        : "bg-white text-[#1b1c1c] border-[#e5bdbb]"
                    }`}
                  >
                    <span>💼 Portefeuille EAM</span>
                    {wallet ? (
                      <span className="text-[10px] opacity-90 mt-1 font-normal">
                        Solde: {formatPrice(wallet.availableBalance)}
                      </span>
                    ) : (
                      <span className="text-[10px] opacity-75 mt-1 font-normal">Connexion requise</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("moneroo")}
                    className={`p-2 rounded-lg font-bold border transition text-left flex flex-col justify-between ${
                      paymentMethod === "moneroo"
                        ? "bg-[#9e001f] text-white border-[#9e001f]"
                        : "bg-white text-[#1b1c1c] border-[#e5bdbb]"
                    }`}
                  >
                    <span>📱 Mobile Money / CB</span>
                    <span className="text-[10px] opacity-75 mt-1 font-normal">MTN, Moov, Wave, Carte</span>
                  </button>
                </div>

                {paymentMethod === "wallet" && wallet && (
                  <div className="mt-2 text-[10px] text-[#5c403f] flex justify-between items-center">
                    <span>Vote & investissement instantanés sans redirection</span>
                    <Link href="/compte/wallet" className="text-[#9e001f] font-bold underline">
                      Recharger
                    </Link>
                  </div>
                )}
              </div>

              {/* 3 ONGLETS DE FINANCEMENT */}
              <div className="mt-5 border-t border-[#e5bdbb]/30 pt-5">
                <h4 className="font-bold text-[14px]">3 façons d'aider</h4>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTab("don")}
                    className={`h-10 rounded-full text-[11px] font-bold border ${
                      tab === "don" ? "bg-[#9e001f] text-white border-[#9e001f]" : "bg-white border-[#e5bdbb]"
                    }`}
                  >
                    Don
                  </button>
                  <button
                    onClick={() => setTab("prise_part")}
                    className={`h-10 rounded-full text-[11px] font-bold border ${
                      tab === "prise_part" ? "bg-[#9e001f] text-white border-[#9e001f]" : "bg-white border-[#e5bdbb]"
                    }`}
                  >
                    Part (Equity)
                  </button>
                  <button
                    onClick={() => setTab("pret")}
                    className={`h-10 rounded-full text-[11px] font-bold border ${
                      tab === "pret" ? "bg-[#9e001f] text-white border-[#9e001f]" : "bg-white border-[#e5bdbb]"
                    }`}
                  >
                    Prêt
                  </button>
                </div>

                {tab === "don" && (
                  <div className="mt-4">
                    <p className="text-[12px] text-[#5c403f]">
                      Montant libre ou proposé. Aucun retour financier. Badge Soutien sur votre profil.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setMontant(5000)} className="flex-1 h-9 rounded-full border bg-[#f6f3f2] text-[12px] font-semibold notranslate" translate="no">
                        {formatPrice(5000)}
                      </button>
                      <button onClick={() => setMontant(10000)} className="flex-1 h-9 rounded-full border bg-white text-[12px] font-bold notranslate" translate="no">
                        {formatPrice(10000)}
                      </button>
                      <button onClick={() => setMontant(50000)} className="flex-1 h-9 rounded-full border bg-[#f6f3f2] text-[12px] font-semibold notranslate" translate="no">
                        {formatPrice(50000)}
                      </button>
                    </div>
                    <input
                      type="number"
                      value={montant}
                      onChange={(e) => setMontant(parseInt(e.target.value) || 0)}
                      className="mt-3 w-full h-11 rounded-full border bg-[#f6f3f2] px-4 text-[14px]"
                      placeholder="Montant libre"
                    />
                    <button
                      onClick={() => startContribution("don", montant)}
                      disabled={paying}
                      className="mt-4 w-full h-11 rounded-full bg-[#9e001f] text-white font-bold text-[13px] disabled:opacity-50 hover:bg-[#800019] transition"
                    >
                      {paying
                        ? paymentMethod === "wallet"
                          ? "Débit portefeuille en cours..."
                          : "Redirection Moneroo..."
                        : `Faire un don de ${formatPrice(montant)} →`}
                    </button>
                  </div>
                )}

                {tab === "prise_part" && (
                  <div className="mt-4">
                    <p className="text-[12px] text-[#5c403f]">
                      Achetez des parts de l'entreprise. Valorisation estimée : <span className="font-bold notranslate" translate="no">{formatPrice(valorisation)}</span>. Contrat de cession généré automatiquement.
                    </p>
                    <div className="mt-3 bg-[#f6f3f2] rounded-lg p-3 text-[12px] space-y-1">
                      <div className="flex justify-between">
                        <span>Valorisation globale</span>
                        <span className="font-bold notranslate" translate="no">{formatPrice(valorisation)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Parts offertes au total</span>
                        <span>{totalEquityOffered}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Parts déjà vendues</span>
                        <span>{alreadySold}%</span>
                      </div>
                      <div className="flex justify-between text-green-700 font-bold border-t pt-1">
                        <span>Parts encore disponibles</span>
                        <span>{equityAvailable}%</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="text-[11px] font-bold">Pourcentage souhaité</label>
                      <input
                        type="range"
                        min="0.1"
                        max={Math.max(0.1, Math.min(10, equityAvailable))}
                        step="0.1"
                        value={pourcentage}
                        onChange={(e) => setPourcentage(Number(e.target.value))}
                        className="w-full mt-1"
                      />
                      <div className="text-[11px] text-[#5c403f] mt-1">
                        {pourcentage}% = <span className="font-bold text-[#1b1c1c] notranslate" translate="no">{formatPrice(Math.round((valorisation * pourcentage) / 100))}</span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        startContribution(
                          "prise_part",
                          Math.round((valorisation * pourcentage) / 100),
                          pourcentage
                        )
                      }
                      disabled={paying || equityAvailable <= 0}
                      className="mt-4 w-full h-11 rounded-full bg-[#9e001f] text-white font-bold text-[13px] disabled:opacity-50 hover:bg-[#800019] transition"
                    >
                      {paying
                        ? paymentMethod === "wallet"
                          ? "Débit portefeuille en cours..."
                          : "Redirection Moneroo..."
                        : equityAvailable <= 0
                        ? "Toutes les parts sont épuisées"
                        : `Acquérir ${pourcentage}% pour ${formatPrice(Math.round((valorisation * pourcentage) / 100))} →`}
                    </button>
                  </div>
                )}

                {tab === "pret" && (
                  <div className="mt-4">
                    <p className="text-[12px] text-[#5c403f]">
                      Prêtez avec un taux d'intérêt de <span className="font-bold text-[#1b1c1c]">{projet.tauxInteret}%/an</span> fixé par le porteur. Échéancier mensuel automatique de capital + intérêts.
                    </p>
                    <div className="mt-3 bg-[#f6f3f2] rounded-lg p-3 text-[12px] space-y-1">
                      <div className="flex justify-between">
                        <span>Taux d'intérêt annuel</span>
                        <span className="font-bold">{projet.tauxInteret}% / an</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Durée de remboursement</span>
                        <span>{dureeMois} mois ({projet.dureeJours} jours)</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-bold text-[#9e001f]">
                        <span>Mensualité estimée</span>
                        <span className="notranslate" translate="no">{formatPrice(mensualiteEstimee)} / mois</span>
                      </div>
                    </div>

                    <input
                      type="number"
                      value={montant}
                      onChange={(e) => setMontant(parseInt(e.target.value) || 0)}
                      placeholder="Montant à prêter"
                      className="mt-3 w-full h-11 rounded-full border bg-[#f6f3f2] px-4 text-[14px]"
                    />

                    <button
                      onClick={() => startContribution("pret", montant)}
                      disabled={paying}
                      className="mt-4 w-full h-11 rounded-full bg-[#9e001f] text-white font-bold text-[13px] disabled:opacity-50 hover:bg-[#800019] transition"
                    >
                      {paying
                        ? paymentMethod === "wallet"
                          ? "Débit portefeuille en cours..."
                          : "Redirection Moneroo..."
                        : `Prêter ${formatPrice(montant)} à ${projet.tauxInteret}% →`}
                    </button>
                  </div>
                )}
              </div>

              {/* MESSAGERIE OFFICIELLE DU PROJET */}
              <div className="mt-6 p-4 rounded-xl bg-[#f6f3f2] border">
                <h4 className="font-bold text-[12px]">Messagerie officielle investisseurs</h4>
                <p className="text-[11px] text-[#5c403f] mt-1">
                  Discutez en direct avec le porteur du projet et les investisseurs confirmés · Mises à jour officielles & conventions
                </p>
                <Link
                  href={`/financement/messages?projetId=${encodeURIComponent(id)}`}
                  className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-[#0B2545] text-white text-[11px] font-bold hover:bg-[#134074] transition"
                >
                  <img src="/crowdfunding-message-icon.png" alt="" className="h-4 w-4 object-contain" />
                  <span>Accéder à la salle investisseurs</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
