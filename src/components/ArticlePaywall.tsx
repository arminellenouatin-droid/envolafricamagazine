"use client";
import Link from "next/link";
import { useState } from "react";
import RichTextContent from "@/components/RichTextContent";
import { isRichText, plainTextToRichHtml, sanitizeRichText } from "@/lib/rich-text";

export default function ArticlePaywall({ summary, isSubscriber, isEncrypted, fullContent }: { summary: string; isSubscriber: boolean; isEncrypted: boolean; fullContent: string }) {
  const [liked, setLiked] = useState(false);
  const paragraphs = fullContent.split(/\n\s*\n|\n/).map((part) => part.trim()).filter(Boolean);
  const preview = isRichText(fullContent) ? (fullContent.match(/<(?:p|h[1-6]|li|blockquote)[^>]*>[\s\S]*?<\/(?:p|h[1-6]|li|blockquote)>/gi) ?? []).slice(0, 3).join("") : paragraphs.slice(0, 3).map((paragraph) => `<p>${plainTextToRichHtml(paragraph)}</p>`).join("");

  if (!isEncrypted) {
    return <div className="prose prose-zinc mt-8 max-w-none prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-zinc-800 prose-headings:font-serif prose-headings:font-bold"><RichTextContent value={summary} className="text-[19px] font-medium" /><RichTextContent value={fullContent} /> <div className="mt-8 rounded-[16px] border border-green-100 bg-green-50 p-4 text-[13px] text-green-900">Article librement accessible — merci de soutenir le journalisme panafricain.</div></div>;
  }

  if (isSubscriber) {
    return <div className="prose prose-zinc mt-8 max-w-none prose-p:text-[17px] prose-p:leading-[1.8] prose-text-zinc-800 prose-headings:font-serif prose-headings:font-bold"><RichTextContent value={summary} className="text-[19px] font-medium" /><RichTextContent value={fullContent} /><div className="mt-8 rounded-[16px] bg-green-50 border border-green-100 p-4 text-[13px] text-green-900">Vous lisez cet article en tant qu’abonné. Merci de soutenir le journalisme panafricain.</div></div>;
  }

  return <div className="mt-8"><div className="prose prose-zinc max-w-none prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-zinc-800"><RichTextContent value={summary} className="text-[19px] font-medium" /></div><div className="relative mt-6 overflow-hidden rounded-[20px] border border-[#e5bdbb]"><div className="paywall-blur select-none bg-white px-6 pb-10 pt-4 text-[17px] leading-[1.8] text-zinc-800" aria-hidden="true"><RichTextContent value={sanitizeRichText(preview)} className="mb-5" /></div><div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-6 pt-20"><div className="rounded-[16px] bg-[#0A1931] p-6 text-center text-white shadow-xl"><p className="text-[15px] font-bold">La suite commence ici et est réservée aux abonnés.</p><p className="mt-2 text-[12px] text-zinc-300">Le résumé reste accessible à tous. Abonnez-vous pour continuer la lecture.</p><div className="mt-4 flex flex-wrap justify-center gap-2"><Link href="/compte/abonnement" className="rounded-full bg-[#D4AF37] px-5 py-2 text-[12px] font-bold text-[#0A1931]">S’abonner</Link><Link href="/auth/login" className="rounded-full border border-white/20 px-5 py-2 text-[12px] font-bold text-white">Se connecter</Link></div></div></div></div><div className="mt-5 flex items-center justify-between text-[11px] text-[#746665]"><span>Résumé public · Suite réservée</span><button onClick={() => setLiked(!liked)} className="rounded-full border px-3 py-1">{liked ? "Article apprécié" : "J’aime cet article"}</button></div></div>;
}
