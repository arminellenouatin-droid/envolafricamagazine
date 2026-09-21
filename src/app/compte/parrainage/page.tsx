"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ParrainageCompte(){
  const [earnings, setEarnings] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      setUser(d.user);
      if (d.user) {
        fetch("/api/affiliate").then((r) => r.ok ? r.json() : { earnings: [] }).then((e) => setEarnings(e.earnings || []));
      }
    });
  }, []);

  const total = earnings.reduce((s, e) => s + Number(e.commission || 0), 0);
  const available = earnings.filter((e) => e.status === "available").reduce((s, e) => s + Number(e.commission || 0), 0);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://www.envolafrica.site";
  const affiliateLink = user?.affiliateCode ? `${siteUrl}?ref=${user.affiliateCode}` : "";

  const copyLink = async () => {
    if (!affiliateLink) return;
    await navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-black text-[24px] text-[#0A1931]">Parrainage & gains</h1>
          <p className="text-xs text-zinc-500 mt-1">Partagez votre lien officiel et recevez vos commissions en direct.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/affiliation?tab=policy"
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
          >
            📜 Politique de Gratification
          </Link>
          <Link
            href="/affiliation?tab=network"
            className="rounded-full bg-[#0A1931] text-white px-4 py-2 text-xs font-bold hover:bg-black transition shadow-sm"
          >
            🌳 Voir Mon Réseau 5×5 (N1 à N5) →
          </Link>
        </div>
      </div>

      {affiliateLink && (
        <div className="rounded-[20px] bg-white border p-5 shadow-sm space-y-2">
          <div className="text-[12px] uppercase font-bold text-zinc-500">Votre lien d'affiliation officiel</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 bg-zinc-50 rounded-xl px-4 py-2.5 font-mono text-sm text-[#0A1931] border border-zinc-200 select-all truncate">
              {affiliateLink}
            </div>
            <button
              onClick={copyLink}
              className="h-10 px-5 rounded-xl bg-[#0A1931] text-white font-bold text-xs hover:bg-[#0A1931]/90 transition shrink-0"
            >
              {copied ? "Copié !" : "Copier le lien"}
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-[18px] bg-[#0A1931] p-5 text-white">
          <div className="text-[11px] uppercase font-bold text-[#D4AF37]">Gains totaux</div>
          <div className="font-black text-[24px] mt-1">{total.toLocaleString("fr-FR")} F CFA</div>
        </div>
        <div className="rounded-[18px] bg-white border p-5">
          <div className="text-[11px] uppercase font-bold text-zinc-500">Disponible</div>
          <div className="font-black text-[20px] mt-1 text-emerald-700">{available.toLocaleString("fr-FR")} F</div>
        </div>
        <div className="rounded-[18px] bg-white border p-5">
          <div className="text-[11px] uppercase font-bold text-zinc-500">Taux actuel</div>
          <div className="font-black text-[20px] mt-1 text-[#0A1931]">{user?.subscription?.status === "active" ? "25%" : "10%"}</div>
          <div className="text-[11px] text-zinc-500 mt-1">{user?.subscription?.status === "active" ? "Boost abonné actif" : "Devenez abonné pour 25%"}</div>
        </div>
      </div>

      <div className="bg-white rounded-[20px] border p-6">
        <h3 className="font-bold text-[#0A1931]">Mes commissions</h3>
        <div className="mt-4 space-y-2">
          {earnings.length === 0 ? (
            <div className="text-sm text-zinc-500 py-8 text-center">
              Aucune commission pour l'instant • Partagez votre lien : <strong className="font-mono text-[#0A1931]">{affiliateLink || "..."}</strong>
            </div>
          ) : (
            earnings.map((e: any) => (
              <div key={e.id} className="flex justify-between p-3 rounded-[12px] bg-zinc-50 border">
                <span className="text-[13px]">Commande {String(e.orderId).slice(0, 8)} • {Number(e.amount || 0).toLocaleString("fr-FR")} F • {Number(e.rate || 0) * 100}%</span>
                <span className="font-bold text-emerald-700">+{Number(e.commission || 0).toLocaleString("fr-FR")} F</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-[#D4AF37] rounded-[18px] p-5 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="font-bold text-[#0A1931] text-[14px]">Retrait dès 10 000 F CFA</div>
          <div className="text-[12px] text-[#0A1931]/80 mt-1">Mobile Money (MTN, Moov, Orange, Wave) ou virement bancaire. Traitement rapide.</div>
        </div>
        <Link
          href="/affiliation"
          className="h-11 px-6 rounded-full bg-[#0A1931] text-white font-bold text-[13px] flex items-center justify-center hover:bg-[#0A1931]/90 transition"
        >
          Gérer mes retraits
        </Link>
      </div>
    </div>
  );
}
