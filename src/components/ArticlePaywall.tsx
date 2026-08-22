"use client";
import Link from "next/link";
import RichTextContent from "@/components/RichTextContent";

export default function ArticlePaywall({ isSubscriber, isEncrypted, fullContent }: { summary: string; isSubscriber: boolean; isEncrypted: boolean; fullContent: string }) {
  if (!isEncrypted) {
    return <div className="prose prose-zinc mt-8 max-w-none prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-zinc-800 prose-headings:font-serif prose-headings:font-bold"><RichTextContent value={fullContent} /> <div className="mt-8 rounded-[16px] border border-green-100 bg-green-50 p-4 text-[13px] text-green-900">Article librement accessible — merci de soutenir le journalisme panafricain.</div></div>;
  }

  if (isSubscriber) {
    return <div className="prose prose-zinc mt-8 max-w-none prose-p:text-[17px] prose-p:leading-[1.8] prose-text-zinc-800 prose-headings:font-serif prose-headings:font-bold"><RichTextContent value={fullContent} /><div className="mt-8 rounded-[16px] bg-green-50 border border-green-100 p-4 text-[13px] text-green-900">Vous lisez cet article en tant qu’abonné. Merci de soutenir le journalisme panafricain.</div></div>;
  }

  return <section className="mt-8 rounded-[20px] border border-[#e5bdbb] bg-[#fffafa] p-4 sm:p-6" aria-label="Article réservé aux abonnés"><div className="rounded-[16px] bg-[#0A1931] p-6 text-center text-white shadow-xl sm:p-8"><p className="text-[15px] font-bold">La suite de cet article est réservée aux abonnés.</p><p className="mt-2 text-[12px] leading-5 text-zinc-300">Le titre et le résumé restent accessibles. Abonnez-vous pour lire le contenu complet.</p><div className="mt-5 flex flex-wrap justify-center gap-3"><Link href="/compte/abonnement" className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-[12px] font-bold text-[#0A1931] transition hover:bg-[#e4c65d] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#0A1931]">S’abonner</Link><Link href="/auth/login" className="rounded-full border border-white/30 px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0A1931]">Se connecter</Link></div></div><p className="mt-4 text-center text-[11px] text-[#746665]">Résumé public · contenu complet réservé</p></section>;
}
