"use client";
import { useState } from "react";
import Link from "next/link";
import { MIN_PAYMENT_AMOUNT_XOF } from "@/lib/payment-policy";
import { useLocale } from "@/components/LocaleProvider";

const amounts = [5000,10000,25000,50000,100000];

export default function DonPage() {
  const [amount, setAmount] = useState<number>(10000);
  const [custom, setCustom] = useState<string>("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { formatPrice } = useLocale();

  const finalAmount = custom ? parseInt(custom) : amount;

  const handleDon = async () => {
    if (!Number.isInteger(finalAmount) || finalAmount < MIN_PAYMENT_AMOUNT_XOF) { alert(`Le montant minimum accepté est de ${formatPrice(MIN_PAYMENT_AMOUNT_XOF)}.`); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ donAmount: finalAmount, currency:"XOF", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.checkout_url;
    } catch (e:any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFCF5] min-h-screen pb-20">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 xl:px-8 pt-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-100 text-pink-700 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide">❤️ Soutenir Envol Africa</div>
          <h1 className="font-serif font-black text-[36px] md:text-[48px] leading-[0.9] text-[#0A1931] mt-6">Votre don finance le journalisme qui compte.</h1>
          <p className="text-[16px] leading-7 text-zinc-600 mt-5 max-w-[640px] mx-auto">Envol Africa est indépendant. Vos dons financent nos enquêtes, nos correspondants dans 25 pays, et notre capacité à dire non aux pressions. Transparent, traçable, impact mesurable.</p>
        </div>

        <div className="mt-12 grid md:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="bg-white rounded-[24px] border border-zinc-100 p-6 md:p-8">
            <h3 className="font-bold text-[16px] text-[#0A1931]">Choisissez un montant</h3>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {amounts.map(a=>(
                <button key={a} onClick={()=>{setAmount(a); setCustom("");}} className={`h-12 rounded-full border font-bold text-[14px] transition-all ${amount===a && !custom ? "bg-[#0A1931] border-[#0A1931] text-white" : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"}`}>
                  {formatPrice(a)}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="text-[12px] font-semibold uppercase tracking-wide text-zinc-600">Montant personnalisé (montant de référence XOF)</label>
              <input type="number" min={MIN_PAYMENT_AMOUNT_XOF} value={custom} onChange={e=>setCustom(e.target.value)} placeholder={`Minimum ${formatPrice(MIN_PAYMENT_AMOUNT_XOF)}`} className="mt-2 w-full h-12 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-[15px] focus:bg-white focus:border-[#0A1931] outline-none" />
              <p className="mt-2 text-[12px] text-zinc-500">Le montant minimum accepté est de {formatPrice(MIN_PAYMENT_AMOUNT_XOF)}.</p>
            </div>

            <div className="mt-8">
              <h3 className="font-bold text-[14px] text-[#0A1931]">Vos informations</h3>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email pour reçu fiscal" className="mt-3 w-full h-12 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-[14px]" />
              <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message d'encouragement (optionnel)" className="mt-3 w-full h-24 rounded-[18px] border border-zinc-200 bg-zinc-50 p-4 text-[14px] resize-none" />
            </div>

            <button onClick={handleDon} disabled={loading} className="mt-8 w-full h-13 py-3.5 rounded-full bg-[#0A1931] text-white font-bold text-[15px] hover:bg-black disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? "Redirection..." : <>Faire un don de {formatPrice(Number(finalAmount || 0))} → <span className="text-[11px] bg-white/15 rounded-full px-2 py-0.5">via Moneroo</span></>}
            </button>
            <div className="mt-3 text-center text-[11px] text-zinc-500">Don sécurisé • Reçu instantané • Mobile Money & Carte</div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[18px] bg-[#0A1931] p-6 text-white">
              <div className="text-[13px] font-bold uppercase tracking-wide text-[#D4AF37]">Impact de votre don</div>
              <ul className="mt-4 space-y-3 text-[13px] leading-5 text-zinc-300">
                <li className="flex gap-2"><span className="text-[#D4AF37]">•</span> {formatPrice(10000)} = 1 journée de reportage terrain</li>
                <li className="flex gap-2"><span className="text-[#D4AF37]">•</span> {formatPrice(25000)} = Traduction en 3 langues africaines</li>
                <li className="flex gap-2"><span className="text-[#D4AF37]">•</span> {formatPrice(100000)} = 1 enquête complète financée</li>
                <li className="flex gap-2"><span className="text-[#D4AF37]">•</span> {formatPrice(500000)} = Bourse pour 1 jeune journaliste</li>
              </ul>
            </div>
            <div className="rounded-[18px] bg-white border border-zinc-100 p-6">
              <div className="font-bold text-[14px] text-[#0A1931]">Transparence totale</div>
              <p className="text-[13px] text-zinc-600 mt-2 leading-5">Nous publions chaque trimestre l'usage des dons. 85% va directement à la production éditoriale. <Link href="#" className="text-[#0A1931] font-semibold underline">Voir le rapport 2025</Link></p>
            </div>
            <div className="rounded-[18px] bg-amber-50 border border-amber-100 p-6">
              <div className="font-bold text-[13px] text-amber-900">💡 Alternative ?</div>
              <p className="text-[13px] text-amber-800 mt-1 leading-5">Devenez affilié et financez-nous sans dépenser : partagez votre lien, touchez 10-25% de commission.</p>
              <Link href="/affiliation" className="mt-3 inline-block text-[12px] font-bold bg-[#0A1931] text-white px-4 py-2 rounded-full">Devenir affilié →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
