"use client";
import Link from "next/link";
import { useState } from "react";

export default function ArticlePaywall({ preview, blur, rest, isSubscriber, isEncrypted, fullContent, articleId }: { preview: string, blur: string, rest: string, isSubscriber: boolean, isEncrypted: boolean, fullContent: string, articleId: string }) {
  const [liked, setLiked] = useState(false);

  if (!isEncrypted) {
    return <div className="prose prose-zinc mt-8 max-w-none prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-zinc-800 prose-headings:font-serif prose-headings:font-bold"><p>{fullContent}</p><div className="mt-8 rounded-[16px] border border-green-100 bg-green-50 p-4 text-[13px] text-green-900">Article librement accessible — merci de soutenir le journalisme panafricain.</div></div>;
  }

  if (isSubscriber) {
    return (
      <div className="prose prose-zinc max-w-none mt-8 prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-zinc-800 prose-headings:font-serif prose-headings:font-bold">
        <p>{preview}</p>
        <p>{blur}</p>
        <p>{rest || fullContent.split(' ').slice(15*14).join(' ')}</p>
        <div className="mt-8 rounded-[16px] bg-green-50 border border-green-100 p-4 flex items-center gap-3 text-[13px] text-green-900">
          <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">✓</span>
          Vous lisez cet article en tant qu'abonné • Merci de soutenir le journalisme panafricain
          <button className="ml-auto text-[11px] font-bold uppercase tracking-wide bg-white border border-green-200 rounded-full px-3 py-1">Écouter en audio 🔊</button>
        </div>
      </div>
    );
  }

  // Non subscriber view: 12 lines visible, 3 blurred, then paywall CTA (rest NOT sent from server)
  return (
    <div className="mt-8">
      <div className="prose prose-zinc max-w-none prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-zinc-800">
        <p>{preview}</p>
        <p className="paywall-blur select-none">{blur}</p>
      </div>

      <div className="relative -mt-16 pt-20">
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white to-transparent"></div>
        <div className="relative rounded-[24px] bg-[#0A1931] p-7 md:p-8 text-white overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#D4AF37]/20 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase text-[#F0D878]">
              🔒 Contenu réservé aux abonnés
            </div>
            <h3 className="font-serif font-black text-[22px] md:text-[26px] leading-tight mt-4 max-w-[520px]">
              Cet article continue avec 5 minutes d'analyse exclusive et des données terrain.
            </h3>
            <p className="text-[14px] leading-6 text-zinc-300 mt-3 max-w-[520px]">
              Rejoignez 12 000 décideurs qui lisent Envol Africa chaque jour. Premier mois à 2 000 F CFA, sans engagement. Le reste de l'article n'a jamais été envoyé à votre navigateur — c'est notre garantie anti-triche.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/abonnement" className="h-12 px-7 rounded-full bg-[#D4AF37] text-[#0A1931] font-bold text-[14px] flex items-center gap-2 hover:bg-[#F0D878]">S'abonner pour lire la suite →</Link>
              <Link href="/auth/login" className="h-12 px-7 rounded-full bg-white/10 border border-white/15 text-white font-semibold text-[14px] flex items-center gap-2 hover:bg-white/15">J'ai déjà un abonnement</Link>
            </div>
            <div className="mt-6 flex items-center gap-4 text-[12px] text-zinc-400">
              <span>✓ Annulable à tout moment</span>
              <span>✓ 12 langues</span>
              <span>✓ Audio inclus</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-3 gap-3">
        <div className="rounded-[14px] bg-zinc-50 border border-zinc-100 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Ce que vous manquez</div>
          <div className="text-[13px] font-medium mt-1">• 3 données exclusives sur la ZLECAf<br/>• Interview d'un ministre<br/>• Graphiques et projections</div>
        </div>
        <div className="rounded-[14px] bg-amber-50 border border-amber-100 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-800">Pourquoi s'abonner ?</div>
          <div className="text-[13px] font-medium mt-1 text-amber-900">• Accès illimité<br/>• 1 magazine offert/mois<br/>• Support 100% Afrique</div>
        </div>
        <div className="rounded-[14px] bg-[#0A1931] p-4 text-white">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#D4AF37]">Offre parrainée</div>
          <div className="text-[13px] font-medium mt-1">Utilisez un lien de parrainage et économisez 10% supplémentaire</div>
        </div>
      </div>
    </div>
  );
}
