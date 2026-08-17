"use client";
import { useState } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

export default function AbonnementPage() {
  const [billing, setBilling] = useState<"monthly"|"yearly">("monthly");
  const [selected, setSelected] = useState<string>("annuel");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const startSubscriptionCheckout = async (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find(p=>p.id===planId);
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
      if (!response.ok || !data.checkout_url) throw new Error(data.error || "Le checkout Moneroo est indisponible");
      window.location.assign(data.checkout_url);
    } catch (error) {
      setLoadingPlan(null);
      setCheckoutError(error instanceof Error ? error.message : "Impossible d’ouvrir le paiement Moneroo");
    }
  };

  return (
    <div className="bg-[#FFFCF5] min-h-screen pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 pt-10">
        <div className="text-center max-w-[720px] mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#0A1931] text-white rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide">⚡️ Premier mois à partir de 2 000 F CFA</div>
          <h1 className="font-serif font-black text-[36px] md:text-[54px] leading-[0.9] tracking-tight text-[#0A1931] mt-6">L'information qui fait <span className="text-[#D4AF37]">gagner.</span></h1>
          <p className="text-[16px] leading-7 text-zinc-600 mt-5">Rejoignez 12 000 décideurs. Analyses exclusives, enquêtes terrain, 1 magazine offert par mois, audio en 12 langues. Sans engagement, annulable à tout moment.</p>

          <div className="mt-8 inline-flex bg-white border border-zinc-200 rounded-full p-1">
            <button onClick={()=>setBilling("monthly")} className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${billing==="monthly" ? "bg-[#0A1931] text-white shadow" : "text-zinc-600"}`}>Mensuel</button>
            <button onClick={()=>setBilling("yearly")} className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${billing==="yearly" ? "bg-[#0A1931] text-white shadow" : "text-zinc-600"}`}>Annuel • -30% <span className="bg-[#D4AF37] text-[#0A1931] text-[10px] px-1.5 py-0.5 rounded-full ml-1">POPULAIRE</span></button>
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-[1280px] mx-auto">
          {SUBSCRIPTION_PLANS.map(plan=>{
            const isPopular = plan.popular;
            const price = billing==="monthly" && (plan as any).firstMonthPrice && (plan.id==="mensuel" || plan.id==="entreprise") ? (plan as any).firstMonthPrice : plan.price;
            const fullPrice = plan.price;
            return (
              <div key={plan.id} className={`rounded-[24px] border p-6 md:p-7 bg-white relative flex flex-col ${isPopular ? "border-[#D4AF37] shadow-[0_20px_60px_rgba(212,175,55,0.15)] scale-[1.02] z-10" : "border-zinc-200"} ${selected===plan.id ? "ring-2 ring-[#0A1931]/10" : ""}`}>
                {isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#0A1931] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Le plus choisi</div>}
                <h3 className="font-serif font-black text-[20px] text-[#0A1931]">{plan.name}</h3>
                <div className="text-[12px] text-zinc-500 mt-1">{plan.description}</div>
                <div className="mt-6">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif font-black text-[36px] text-[#0A1931]">{price.toLocaleString()}</span>
                    <span className="text-[13px] font-bold text-zinc-600">F CFA</span>
                    <span className="text-[11px] text-zinc-500">/{billing==="monthly" ? "mois" : "an"}</span>
                  </div>
                  {price!==fullPrice && <div className="text-[12px] text-zinc-500 mt-1">Puis {fullPrice.toLocaleString()} F CFA • Sans action de votre part</div>}
                  {plan.id==="annuel" && billing==="monthly" && <div className="text-[12px] font-semibold text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-1 inline-block mt-2">Soit 3 500 F CFA / mois</div>}
                  {plan.id==="soutien" && <div className="text-[11px] font-bold uppercase tracking-wide text-[#D4AF37] bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1 inline-block mt-2">Pack Prestige inclus</div>}
                </div>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map(f=>(
                    <li key={f} className="flex items-start gap-2 text-[13px] leading-5 text-zinc-700"><span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">✓</span>{f}</li>
                  ))}
                </ul>
                <button onClick={()=>startSubscriptionCheckout(plan.id)} disabled={loadingPlan!==null} className={`mt-7 w-full h-12 rounded-full font-bold text-[14px] transition-colors disabled:opacity-60 ${isPopular ? "bg-[#0A1931] text-white hover:bg-black" : "bg-zinc-900 text-white hover:bg-black"}`}>{loadingPlan===plan.id ? "Ouverture de Moneroo…" : `Choisir ${plan.name} →`}</button>
                <div className="mt-3 text-center text-[11px] text-zinc-500">Paiement Moneroo • Mobile Money & Carte</div>
              </div>
            );
          })}
        </div>

        {checkoutError && <div role="alert" className="mt-8 max-w-[720px] mx-auto rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-800">{checkoutError}</div>}

        <div className="mt-16 max-w-[960px] mx-auto grid md:grid-cols-3 gap-4">
          <div className="rounded-[18px] bg-white border border-zinc-100 p-5 flex gap-3"><div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">🔒</div><div><div className="font-bold text-[13px] text-[#0A1931]">Mur payant inviolable</div><div className="text-[12px] text-zinc-600 mt-1">Le contenu complet n'est jamais envoyé au navigateur sans abonnement. Sécurité serveur.</div></div></div>
          <div className="rounded-[18px] bg-white border border-zinc-100 p-5 flex gap-3"><div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">⚡️</div><div><div className="font-bold text-[13px] text-[#0A1931]">Premier mois réduit auto</div><div className="text-[12px] text-zinc-600 mt-1">2 000 F CFA le 1er mois, puis 5 000 F CFA automatiquement. Pas besoin de se souvenir.</div></div></div>
          <div className="rounded-[18px] bg-white border border-zinc-100 p-5 flex gap-3"><div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">🌍</div><div><div className="font-bold text-[13px] text-[#0A1931]">12 langues • 5 devises</div><div className="text-[12px] text-zinc-600 mt-1">Fongbé, Wolof, Swahili, Mina, Zulu, etc. Paiement local.</div></div></div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/kiosque" className="text-[13px] font-medium text-zinc-600 hover:text-[#0A1931]">Ou acheter un numéro à l'unité à partir de 5 000 F CFA →</Link>
        </div>
      </div>
    </div>
  );
}
