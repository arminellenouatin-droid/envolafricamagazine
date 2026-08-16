"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AffiliationPage() {
  const [user, setUser] = useState<any>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(d=>{
      if (d.user) {
        setUser(d.user);
        fetch("/api/affiliate").then(r=>r.ok ? r.json() : { earnings: [] }).then(e=>setEarnings(e.earnings||[]));
      }
    });
  },[]);

  const affiliateLink = user ? `${window.location.origin}?ref=${user.affiliateCode}` : "Connectez-vous pour obtenir votre lien";
  const total = earnings.reduce((s,e)=>s+e.commission,0);
  const available = earnings.filter(e=>e.status==="available").reduce((s,e)=>s+e.commission,0);
  const canWithdraw = total >= 150000;

  const copy = () => {
    if (!user) return;
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(()=>setCopied(false),2000);
  };

  return (
    <div className="bg-[#FFFCF5] min-h-screen pb-20">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 xl:px-8 pt-10">
        <div className="text-center max-w-[740px] mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#0A1931] text-white rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide">💸 Programme de Parrainage</div>
          <h1 className="font-serif font-black text-[36px] md:text-[52px] leading-[0.9] text-[#0A1931] mt-6">Gagnez jusqu'à <span className="text-[#D4AF37]">25%</span> sur chaque vente</h1>
          <p className="text-[16px] leading-7 text-zinc-600 mt-5">N'importe qui peut devenir affilié. Partagez votre lien personnel. Si quelqu'un s'abonne ou achète via votre lien, vous touchez une commission en temps réel. Tableau de bord + retrait dès 150 000 F CFA.</p>
        </div>

        <div className="mt-12 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[24px] border border-zinc-100 p-6 md:p-7">
              <h3 className="font-bold text-[16px] text-[#0A1931]">Votre lien de parrainage</h3>
              {user ? (
                <>
                  <div className="mt-4 flex gap-2">
                    <div className="flex-1 h-12 rounded-full bg-zinc-50 border border-zinc-200 px-5 flex items-center text-[13px] font-mono truncate">{affiliateLink}</div>
                    <button onClick={copy} className="h-12 px-6 rounded-full bg-[#0A1931] text-white font-bold text-[13px] hover:bg-black">{copied ? "✓ Copié" : "Copier"}</button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href={`https://wa.me/?text=${encodeURIComponent(`Découvre Envol Africa Magazine, le média économique panafricain de référence : ${affiliateLink}`)}`} target="_blank" className="h-9 px-4 rounded-full bg-green-600 text-white text-[12px] font-bold">Partager WhatsApp</a>
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Le magazine économique panafricain qui compte : ${affiliateLink}`)}`} target="_blank" className="h-9 px-4 rounded-full bg-zinc-900 text-white text-[12px] font-bold">Partager X</a>
                    <button className="h-9 px-4 rounded-full border border-zinc-200 text-[12px] font-medium">Générer QR Code</button>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-[14px] bg-amber-50 border border-amber-100 p-4 text-center">
                  <div className="text-[14px] font-bold text-amber-900">Connectez-vous pour obtenir votre lien unique</div>
                  <div className="mt-3 flex justify-center gap-2">
                    <Link href="/auth/login" className="h-10 px-5 rounded-full bg-[#0A1931] text-white text-[13px] font-bold">Se connecter</Link>
                    <Link href="/auth/register" className="h-10 px-5 rounded-full bg-white border border-zinc-200 text-[13px] font-medium">Créer un compte</Link>
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-[18px] bg-white border border-zinc-100 p-5">
                <div className="w-10 h-10 rounded-full bg-[#0A1931] text-white flex items-center justify-center font-bold">10%</div>
                <div className="font-bold text-[14px] mt-3 text-[#0A1931]">Si vous n'êtes pas abonné</div>
                <div className="text-[12px] text-zinc-600 mt-1">Commission sur chaque vente réalisée via votre lien. Visible en temps réel.</div>
              </div>
              <div className="rounded-[18px] bg-[#D4AF37] p-5">
                <div className="w-10 h-10 rounded-full bg-[#0A1931] text-[#D4AF37] flex items-center justify-center font-bold">25%</div>
                <div className="font-bold text-[14px] mt-3 text-[#0A1931]">Si vous êtes abonné</div>
                <div className="text-[12px] text-[#0A1931]/70 mt-1">Le double de commissions dès que vous êtes vous-même abonné. Auto-détecté.</div>
              </div>
              <div className="rounded-[18px] bg-white border border-zinc-100 p-5">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold">↗</div>
                <div className="font-bold text-[14px] mt-3 text-[#0A1931]">Retrait dès 150k F</div>
                <div className="text-[12px] text-zinc-600 mt-1">Mobile Money (MTN, Orange, Wave) ou virement bancaire. Délai 24h.</div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-zinc-100 p-6 md:p-7">
              <h3 className="font-bold text-[16px] text-[#0A1931]">Historique des commissions</h3>
              {earnings.length===0 ? (
                <div className="mt-6 text-center py-10 bg-zinc-50 rounded-[16px] border border-zinc-100">
                  <div className="text-zinc-400 text-sm">Aucune vente pour l'instant • Partagez votre lien pour commencer</div>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {earnings.map((e:any)=>(
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-[12px] bg-zinc-50 border border-zinc-100">
                      <div>
                        <div className="font-medium text-[13px]">Commande {e.orderId.slice(0,8)} • {e.amount.toLocaleString()} F CFA</div>
                        <div className="text-[11px] text-zinc-500">{new Date(e.createdAt).toLocaleDateString('fr-FR')} • Taux {e.rate*100}% • {e.status}</div>
                      </div>
                      <div className="font-black text-[14px] text-green-700">+{e.commission.toLocaleString()} F</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] bg-[#0A1931] p-6 text-white">
              <div className="text-[11px] uppercase tracking-widest font-bold text-[#D4AF37]">Tableau de bord</div>
              <div className="mt-4">
                <div className="text-[13px] text-zinc-400">Gains totaux</div>
                <div className="font-serif font-black text-[32px] leading-none mt-1">{total.toLocaleString()} F</div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-[14px] bg-white/10 border border-white/10 p-3"><div className="text-[11px] text-zinc-400 uppercase font-bold">Disponible</div><div className="font-bold text-[18px] mt-1">{available.toLocaleString()} F</div></div>
                <div className="rounded-[14px] bg-white/10 border border-white/10 p-3"><div className="text-[11px] text-zinc-400 uppercase font-bold">Taux</div><div className="font-bold text-[18px] mt-1">{user?.subscription?.status==="active" ? "25%" : "10%"}</div></div>
              </div>
              <button disabled={!canWithdraw} className="mt-6 w-full h-12 rounded-full bg-[#D4AF37] text-[#0A1931] font-bold text-[14px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F0D878]">
                {canWithdraw ? "Retirer via Mobile Money / Virement" : `Minimum 150 000 F pour retirer (${total.toLocaleString()}/150k)`}
              </button>
              <div className="mt-3 text-[11px] text-zinc-500 text-center">Retraits traités en 24h • Preuve demandée</div>
            </div>

            <div className="rounded-[18px] bg-white border border-zinc-100 p-5">
              <div className="font-bold text-[14px] text-[#0A1931]">Comment ça marche ?</div>
              <ol className="mt-3 space-y-2 text-[13px] text-zinc-600 list-decimal pl-4">
                <li>Créez votre compte (30s)</li>
                <li>Récupérez votre lien unique</li>
                <li>Partagez-le sur WhatsApp, LinkedIn, X, votre blog...</li>
                <li>Touchez 10% ou 25% à chaque vente, en temps réel</li>
                <li>Retirez dès 150k F via Mobile Money</li>
              </ol>
            </div>

            <div className="rounded-[18px] bg-amber-50 border border-amber-100 p-5">
              <div className="font-bold text-[13px] text-amber-900">🎯 Top affiliés ce mois</div>
              <div className="mt-3 space-y-2 text-[12px]">
                <div className="flex justify-between"><span>🥇 Aminata T. (Dakar)</span><span className="font-bold">890k F</span></div>
                <div className="flex justify-between"><span>🥈 Kwame B. (Accra)</span><span className="font-bold">540k F</span></div>
                <div className="flex justify-between"><span>🥉 Fatou S. (Abidjan)</span><span className="font-bold">320k F</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
