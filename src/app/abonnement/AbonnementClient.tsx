"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { useLocale } from "@/components/LocaleProvider";

export default function AbonnementClient() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [selected, setSelected] = useState<string>("annuel");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>(SUBSCRIPTION_PLANS);
  const { formatPrice } = useLocale();

  useEffect(() => {
    fetch("/api/subscription-plans")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.plans) && data.plans.length) setPlans(data.plans);
      })
      .catch(() => {});
  }, []);

  const startSubscriptionCheckout = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan || loadingPlan) return;
    setSelected(planId);
    setLoadingPlan(planId);
    setCheckoutError(null);
    try {
      const response = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: "XOF",
          items: [{ type: "subscription", planId, billing }],
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkout_url)
        throw new Error(data.error || "Le checkout Moneroo est indisponible");
      window.location.assign(data.checkout_url);
    } catch (error) {
      setLoadingPlan(null);
      setCheckoutError(error instanceof Error ? error.message : "Impossible d’ouvrir le paiement Moneroo");
    }
  };

  return (
    <div className="subscription-page bg-[#fcf9f8] min-h-screen pb-24 text-[#1b1c1c]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 pt-12">
        {/* En-tête éditorial Magazine & Kiosque */}
        <div className="text-center max-w-[760px] mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#f2e8e6] text-[#9e001f] border border-[#e5bdbb] rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-sm">
            ⚡️ Premier mois à partir de {formatPrice(2000)}
          </div>
          <h1 className="font-serif font-black text-[38px] md:text-[56px] leading-[0.95] tracking-tight text-[#1b1c1c] mt-6">
            L&apos;information qui fait <span className="text-[#9e001f]">gagner.</span>
          </h1>
          <p className="text-[15px] md:text-[17px] leading-relaxed text-[#6b5353] mt-5">
            Rejoignez plus de 12 000 décideurs et investisseurs. Analyses exclusives, enquêtes économiques de terrain, accès illimité au Kiosque numérique et 1 magazine offert par mois. Annulable à tout moment en 1 clic.
          </p>

          {/* Sélecteur Mensuel / Annuel */}
          <div className="mt-8 inline-flex bg-white border border-[#e5bdbb] rounded-full p-1 shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all ${
                billing === "monthly"
                  ? "bg-[#9e001f] text-white shadow-md"
                  : "text-[#6b5353] hover:text-[#9e001f]"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all flex items-center gap-1.5 ${
                billing === "yearly"
                  ? "bg-[#9e001f] text-white shadow-md"
                  : "text-[#6b5353] hover:text-[#9e001f]"
              }`}
            >
              <span>Annuel • -30%</span>
              <span className="bg-[#f2e8e6] text-[#9e001f] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                POPULAIRE
              </span>
            </button>
          </div>
        </div>

        {/* Grille des Formules d'Abonnement */}
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1280px] mx-auto">
          {plans.map((plan) => {
            const isPopular = plan.popular;
            const monthlyPrice = Number(plan.monthlyPrice ?? (plan.interval === "month" ? plan.price : 0));
            const annualPrice = Number(
              plan.annualPrice ??
                (plan.interval === "year"
                  ? plan.price
                  : Math.round(monthlyPrice * 12 * (1 - Number(plan.annualDiscountPercent ?? 30) / 100)))
            );
            const annualDiscountPercent = Math.min(100, Math.max(0, Number(plan.annualDiscountPercent ?? 30)));
            const regularMonthlyPrice =
              billing === "monthly" && plan.firstMonthPrice && (plan.id === "mensuel" || plan.id === "entreprise")
                ? Number(plan.firstMonthPrice)
                : monthlyPrice;
            const price = billing === "yearly" ? annualPrice : regularMonthlyPrice;

            return (
              <div
                key={plan.id}
                className={`rounded-[24px] border p-6 md:p-7 bg-white relative flex flex-col justify-between transition-all duration-200 ${
                  isPopular
                    ? "border-2 border-[#9e001f] shadow-[0_20px_50px_rgba(158,0,31,0.12)] scale-[1.02] ring-4 ring-[#9e001f]/10 z-10"
                    : "border-[#e5bdbb]/80 hover:border-[#9e001f]/40 hover:shadow-lg"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#9e001f] text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                    Formule Recommandée
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9e001f] bg-[#f2e8e6] px-2.5 py-0.5 rounded-md">
                      Édition Magazine
                    </span>
                  </div>
                  <h3 className="font-serif font-black text-[22px] text-[#1b1c1c] mt-2">
                    {plan.name}
                  </h3>
                  <div className="text-[12px] text-[#6b5353] mt-1 leading-snug">
                    {plan.description}
                  </div>

                  <div className="mt-6 border-t border-[#f2e8e6] pt-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-serif font-black text-[34px] text-[#9e001f]">
                        {formatPrice(Number(price || 0))}
                      </span>
                      <span className="text-[11px] text-[#6b5353] font-bold">
                        /{billing === "monthly" ? "mois" : "an"}
                      </span>
                    </div>

                    {billing === "yearly" && annualDiscountPercent > 0 && (
                      <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 inline-block mt-2">
                        Économie de {annualDiscountPercent}% • soit {formatPrice(Math.round(annualPrice / 12))} / mois
                      </div>
                    )}

                    {billing === "monthly" && plan.firstMonthPrice && Number(plan.firstMonthPrice) < monthlyPrice && (
                      <div className="text-[11px] text-[#6b5353] mt-1.5">
                        Puis {formatPrice(monthlyPrice)} / mois sans engagement
                      </div>
                    )}

                    {plan.id === "soutien" && (
                      <div className="text-[10px] font-extrabold uppercase tracking-wide text-[#9e001f] bg-[#f2e8e6] border border-[#e5bdbb] rounded-full px-2.5 py-1 inline-block mt-2">
                        Pack Dirigeant Prestige
                      </div>
                    )}
                  </div>

                  <ul className="mt-6 space-y-2.5">
                    {(plan.features || []).map((f: string) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] leading-snug text-[#4a3b3a]">
                        <span className="w-4 h-4 rounded-full bg-[#f2e8e6] text-[#9e001f] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-[#f2e8e6]">
                  <button
                    onClick={() => startSubscriptionCheckout(plan.id)}
                    disabled={loadingPlan !== null}
                    className={`w-full h-12 rounded-full font-bold text-[13px] transition-all disabled:opacity-60 shadow-md ${
                      isPopular
                        ? "bg-[#9e001f] hover:bg-[#c8102e] text-white hover:shadow-xl hover:scale-[1.02]"
                        : "bg-[#1b1c1c] hover:bg-[#9e001f] text-white"
                    }`}
                  >
                    {loadingPlan === plan.id ? "Ouverture de Moneroo…" : `Choisir ${plan.name} →`}
                  </button>
                  <div className="mt-2 text-center text-[10px] text-[#8e7474]">
                    Paiement sécurisé Moneroo • Mobile Money & Cartes
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {checkoutError && (
          <div
            role="alert"
            className="mt-8 max-w-[720px] mx-auto rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-[13px] text-red-800"
          >
            {checkoutError}
          </div>
        )}

        {/* 3 Blocs de réassurance harmonisés avec Magazine & Kiosque */}
        <div className="mt-16 max-w-[1020px] mx-auto grid md:grid-cols-3 gap-5">
          <div className="rounded-[20px] bg-white border border-[#e5bdbb]/80 p-5 flex items-start gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#f2e8e6] text-[#9e001f] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">lock</span>
            </div>
            <div>
              <div className="font-bold text-[13px] font-display text-[#1b1c1c]">
                Lecteur Flipbook Sécurisé
              </div>
              <div className="text-[12px] text-[#6b5353] mt-1 leading-relaxed">
                Le magazine complet haute définition accessible en ligne sur tous vos écrans et téléchargeable en PDF.
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-white border border-[#e5bdbb]/80 p-5 flex items-start gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#f2e8e6] text-[#9e001f] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">bolt</span>
            </div>
            <div>
              <div className="font-bold text-[13px] font-display text-[#1b1c1c]">
                Tarif découverte garanti
              </div>
              <div className="text-[12px] text-[#6b5353] mt-1 leading-relaxed">
                {formatPrice(2000)} le 1er mois sans engagement, résiliable d&apos;un simple clic depuis votre compte.
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-white border border-[#e5bdbb]/80 p-5 flex items-start gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#f2e8e6] text-[#9e001f] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
            <div>
              <div className="font-bold text-[13px] font-display text-[#1b1c1c]">
                Toutes devises & Mobile Money
              </div>
              <div className="text-[12px] text-[#6b5353] mt-1 leading-relaxed">
                MTN, Moov, Orange, Wave et CB. Facturation locale automatique selon votre pays.
              </div>
            </div>
          </div>
        </div>

        {/* Lien de redirection vers le Kiosque */}
        <div className="mt-12 text-center">
          <Link
            href="/kiosque"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#9e001f] hover:underline"
          >
            <span>Ou acheter un numéro à l&apos;unité dans le Kiosque</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
