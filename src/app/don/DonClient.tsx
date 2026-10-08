"use client";

import { useState } from "react";
import Link from "next/link";
import { MIN_PAYMENT_AMOUNT_XOF } from "@/lib/payment-policy";
import { useLocale } from "@/components/LocaleProvider";

const amounts = [5000, 10000, 25000, 50000, 100000];

const ecosystemVolets = [
  {
    title: "Magazine & Journalisme d'Impact",
    badge: "Information & Enquêtes",
    description: "Un journalisme économique rigoureux, indépendant et constructif pour documenter les réussites, éclairer les décideurs et combattre la désinformation.",
    icon: "📰",
  },
  {
    title: "Africa Awards",
    badge: "Excellence & Mérite",
    description: "Célébrer, primer et propulser les entrepreneurs, innovateurs et bâtisseurs qui transforment concrètement le paysage économique africain.",
    icon: "🏆",
  },
  {
    title: "Africa Crowdfunding",
    badge: "Financement Participatif",
    description: "Mobiliser l'épargne panafricaine et de la diaspora pour financer directement en don, capital ou prêt les startups et PME à fort potentiel.",
    icon: "🌱",
  },
  {
    title: "Marketplace & Commerce Panafricain",
    badge: "Débouchés & ZLECAf",
    description: "Faciliter les échanges transfrontaliers et promouvoir les produits et technologies « Made in Africa » auprès de millions d'acheteurs.",
    icon: "🛍️",
  },
  {
    title: "Emploi & Formations Certifiées (Jobs Bank)",
    badge: "Talents & Compétences",
    description: "Accompagner l'insertion professionnelle et relier la jeunesse aux compétences d'avenir et aux meilleures opportunités de recrutement du continent.",
    icon: "💼",
  },
  {
    title: "World Africa Business (WAB)",
    badge: "Média Vidéo & Réseau d'Affaires",
    description: "Un espace multimédia connecté et d'influence pour porter la voix authentique de l'Afrique et fédérer sa diaspora économique mondiale.",
    icon: "📺",
  },
];

export default function DonClient() {
  const [amount, setAmount] = useState<number>(10000);
  const [custom, setCustom] = useState<string>("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { formatPrice } = useLocale();

  const finalAmount = custom ? parseInt(custom, 10) : amount;

  const handleDon = async () => {
    if (!Number.isInteger(finalAmount) || finalAmount < MIN_PAYMENT_AMOUNT_XOF) {
      alert(`Le montant minimum accepté est de ${formatPrice(MIN_PAYMENT_AMOUNT_XOF)}.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donAmount: finalAmount, currency: "XOF", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'initialiser le paiement du don");
      window.location.href = data.checkout_url;
    } catch (e: any) {
      alert(e.message || "Une erreur est survenue lors de l'initialisation du don.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="don-page bg-[#fcf9f8] min-h-screen pb-24 text-[#2b2525]">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 xl:px-8 pt-12">
        {/* En-tête éditorial Magazine & Kiosque */}
        <div className="text-center max-w-[840px] mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#f2e8e6] text-[#9e001f] border border-[#e5bdbb] rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-sm">
            ❤️ Mécénat & Soutien Indépendant
          </div>
          <h1 className="font-serif font-black text-[36px] md:text-[52px] leading-[1.02] text-[#2b2525] mt-6 tracking-tight">
            Votre don aide dans notre combat pour <span className="text-[#9e001f]">l&apos;envol de l&apos;Afrique</span>
          </h1>
          <p className="text-[16px] md:text-[18px] leading-relaxed text-[#746665] mt-5 max-w-[760px] mx-auto font-medium">
            Envol Africa n&apos;est pas qu&apos;un média : c&apos;est un écosystème intégré au service de la souveraineté économique, de l&apos;innovation et de l&apos;émancipation de la jeunesse africaine. Vos contributions soutiennent directement l&apos;ensemble de nos piliers d&apos;action.
          </p>
        </div>

        {/* Présentation de l'écosystème Envol Africa et du but de chaque volet */}
        <div className="mt-12 rounded-[28px] border border-[#e5bdbb]/70 bg-gradient-to-b from-[#fff5f3] to-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#e5bdbb]/50 pb-5">
            <div>
              <span className="editorial-kicker text-[#9e001f]">Notre Raison d&apos;Être</span>
              <h2 className="font-serif font-black text-2xl md:text-3xl text-[#2b2525] mt-1">
                L&apos;Écosystème Envol Africa : Le but de chaque volet
              </h2>
            </div>
            <span className="font-sans text-xs font-semibold text-[#746665]">
              6 leviers d&apos;action pour un continent souverain et prospère
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ecosystemVolets.map((volet) => (
              <div
                key={volet.title}
                className="flex flex-col justify-between rounded-[20px] border border-[#ebd8d6] bg-white p-5 shadow-sm transition hover:border-[#9e001f]/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xl">{volet.icon}</span>
                    <span className="rounded-full bg-[#fbeeed] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9e001f]">
                      {volet.badge}
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-bold text-[#2b2525]">
                    {volet.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#746665]">
                    {volet.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grille principale : formulaire + cartes d'impact */}
        <div className="mt-12 grid md:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          {/* Bloc Formulaire */}
          <div className="bg-white rounded-[28px] border border-[#e5bdbb]/80 p-6 md:p-8 shadow-sm">
            <h3 className="font-serif font-black text-[18px] text-[#2b2525]">Choisissez un montant</h3>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {amounts.map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    setAmount(a);
                    setCustom("");
                  }}
                  className={`h-12 rounded-full border font-bold text-[14px] transition-all active:scale-95 ${
                    amount === a && !custom
                      ? "bg-[#9e001f] border-[#9e001f] text-white shadow-md scale-[1.02]"
                      : "bg-[#fcf9f8] border-[#e5bdbb] text-[#2b2525] hover:border-[#9e001f] hover:bg-[#fff0ef]"
                  }`}
                >
                  {formatPrice(a)}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-[#746665]">
                Ou saisissez un montant personnalisé (XOF)
              </label>
              <input
                type="number"
                min={MIN_PAYMENT_AMOUNT_XOF}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={`Minimum ${formatPrice(MIN_PAYMENT_AMOUNT_XOF)}`}
                className="mt-2 w-full h-12 rounded-full border border-[#e5bdbb] bg-[#fcf9f8] px-5 text-[15px] text-[#2b2525] focus:bg-white focus:border-[#9e001f] focus:ring-2 focus:ring-[#9e001f]/20 outline-none transition font-medium"
              />
              <p className="mt-2 text-[12px] text-[#746665]">
                Le montant minimum accepté est de {formatPrice(MIN_PAYMENT_AMOUNT_XOF)}.
              </p>
            </div>

            <div className="mt-8 border-t border-[#f4ecea] pt-6">
              <h3 className="font-serif font-black text-[16px] text-[#2b2525]">Vos coordonnées</h3>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email (pour le reçu de don)"
                className="mt-3 w-full h-12 rounded-full border border-[#e5bdbb] bg-[#fcf9f8] px-5 text-[14px] text-[#2b2525] focus:bg-white focus:border-[#9e001f] focus:ring-2 focus:ring-[#9e001f]/20 outline-none transition"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message d'encouragement à l'équipe éditoriale (optionnel)"
                className="mt-3 w-full h-24 rounded-[20px] border border-[#e5bdbb] bg-[#fcf9f8] p-4 text-[14px] text-[#2b2525] focus:bg-white focus:border-[#9e001f] focus:ring-2 focus:ring-[#9e001f]/20 outline-none resize-none transition"
              />
            </div>

            <button
              onClick={handleDon}
              disabled={loading}
              className="mt-8 w-full h-14 rounded-full bg-[#9e001f] text-white font-black text-[15px] hover:bg-[#7f0019] shadow-md hover:shadow-lg disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Redirection sécurisée..."
              ) : (
                <>
                  <span>Faire un don de {formatPrice(Number(finalAmount || 0))}</span>
                  <span className="text-[11px] bg-white/20 rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider">
                    via Moneroo
                  </span>
                </>
              )}
            </button>
            <div className="mt-3 text-center text-[12px] text-[#746665]">
              🔒 Don 100% sécurisé • Reçu instantané • Mobile Money (MTN, Moov, Orange, Wave) & Carte Bancaire
            </div>
          </div>

          {/* Colonne latérale : Impact & Transparence */}
          <div className="space-y-4">
            {/* Carte Impact */}
            <div className="rounded-[24px] bg-gradient-to-br from-[#2b2525] via-[#3a1d22] to-[#2b2525] p-6 md:p-7 text-white shadow-md border border-[#522930]">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#ffdad8]">
                Impact concret de votre soutien
              </div>
              <h4 className="font-serif font-black text-xl text-white mt-1">
                À quoi sert chaque franc ?
              </h4>
              <ul className="mt-4 space-y-3.5 text-[13px] leading-snug text-white/85">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#f0b27e] font-black text-base leading-none">•</span>
                  <span><strong className="text-[#ffdad8] font-mono">{formatPrice(10000)}</strong> = 1 journée de reportage et enquête de terrain</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#f0b27e] font-black text-base leading-none">•</span>
                  <span><strong className="text-[#ffdad8] font-mono">{formatPrice(25000)}</strong> = Traduction et diffusion en langues africaines</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#f0b27e] font-black text-base leading-none">•</span>
                  <span><strong className="text-[#ffdad8] font-mono">{formatPrice(100000)}</strong> = Financement complet d&apos;un grand dossier économique</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#f0b27e] font-black text-base leading-none">•</span>
                  <span><strong className="text-[#ffdad8] font-mono">{formatPrice(500000)}</strong> = Bourse d&apos;investigation pour un jeune reporter panafricain</span>
                </li>
              </ul>
            </div>

            {/* Carte Transparence */}
            <div className="rounded-[24px] bg-white border border-[#e5bdbb]/80 p-6 shadow-sm">
              <div className="font-serif font-black text-[16px] text-[#2b2525]">Transparence totale</div>
              <p className="text-[13px] text-[#746665] mt-2 leading-relaxed">
                Nous publions chaque trimestre l&apos;usage certifié des fonds reçus. Plus de 85% des dons vont directement à la production éditoriale et au travail des correspondants.
              </p>
              <div className="mt-3">
                <Link href="/kiosque" className="text-[12px] font-bold text-[#9e001f] hover:underline inline-flex items-center gap-1">
                  Découvrir les numéros publiés ↗
                </Link>
              </div>
            </div>

            {/* Carte Alternative Affiliation */}
            <div className="rounded-[24px] bg-[#fff8f3] border border-[#f0b27e]/60 p-6 shadow-sm text-[#2b2525]">
              <div className="font-serif font-black text-[15px] text-[#944400] flex items-center gap-1.5">
                <span>💡</span> Alternative : Devenez Ambassadeur
              </div>
              <p className="text-[13px] text-[#746665] mt-1.5 leading-relaxed">
                Soutenez Envol Africa sans dépenser un franc : recommandez nos éditions et abonnements à vos proches et percevez des gratifications sur 5 générations.
              </p>
              <Link
                href="/affiliation"
                className="mt-3.5 inline-flex items-center gap-1 text-[12px] font-bold bg-[#9e001f] hover:bg-[#7f0019] text-white px-5 py-2.5 rounded-full shadow-sm transition active:scale-95"
              >
                Rejoindre le Programme Ambassadeur →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
