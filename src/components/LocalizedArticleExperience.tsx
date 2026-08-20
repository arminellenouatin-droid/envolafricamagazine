"use client";

import { useMemo, useState } from "react";
import ArticlePaywall from "@/components/ArticlePaywall";

type Translation = { title?: string; summary?: string; content?: string };
type ArticleInput = { title: string; summary: string; content: string; language: string; translations?: Record<string, Translation>; audioByLanguage?: Record<string, string>; audioUrl?: string; hasAudio?: boolean; isEncrypted?: boolean };

const LANGUAGE_LABELS: Record<string, string> = { fr: "Français", en: "English", es: "Español", sw: "Swahili", fon: "Fongbé", wo: "Wolof", ha: "Hausa", yo: "Yorùbá", ig: "Igbo", ff: "Fulfulde", zu: "isiZulu", ee: "Eʋegbe" };

export default function LocalizedArticleExperience({ article, isSubscriber, preferredLanguage }: { article: ArticleInput; isSubscriber: boolean; preferredLanguage?: string }) {
  const available = useMemo(() => {
    const codes = new Set([article.language || "fr", ...Object.keys(article.translations || {}), ...Object.keys(article.audioByLanguage || {})]);
    return [...codes].filter((code) => LANGUAGE_LABELS[code]);
  }, [article]);
  const [language, setLanguage] = useState(preferredLanguage && available.includes(preferredLanguage) ? preferredLanguage : article.language || "fr");
  const translation = article.translations?.[language];
  const title = translation?.title || article.title;
  const summary = translation?.summary || article.summary;
  const content = translation?.content || article.content;
  const audio = article.audioByLanguage?.[language] || (language === article.language ? article.audioUrl : undefined);
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e5bdbb] bg-[#fffaf8] px-4 py-3"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#9e001f]">Version de lecture</p><p className="mt-1 text-xs text-[#5c403f]">{isSubscriber ? "Votre langue préférée est affichée par défaut." : "Les versions complètes sont réservées aux abonnés."}</p></div><label className="flex items-center gap-2 text-[11px] font-bold text-[#1b1c1c]">Langue<select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-9 rounded-full border border-[#e5bdbb] bg-white px-3 text-[11px]">{available.map((code) => <option key={code} value={code}>{LANGUAGE_LABELS[code]}</option>)}</select></label></div>
    <h1 className="text-[32px] font-bold leading-tight text-[#1b1c1c] md:text-[40px]" style={{ fontFamily: "Montserrat" }}>{title}</h1>
    <p className="mb-8 mt-4 text-[18px] leading-[1.6] italic text-[#5c403f]" style={{ fontFamily: "Source Serif 4" }}>{summary}</p>
    <div className="mb-6 flex items-center justify-between border-y border-[#e5bdbb] py-4"><span className="text-[11px] font-bold uppercase tracking-wider text-[#9e001f]">{LANGUAGE_LABELS[language] || language.toUpperCase()}</span>{isSubscriber && audio ? <audio controls preload="none" src={audio} className="h-9 max-w-[230px]" aria-label={`Écouter l’article en ${LANGUAGE_LABELS[language]}`} /> : <span className="text-[11px] text-[#746665]">Audio réservé aux abonnés</span>}</div>
    <ArticlePaywall summary={summary} isSubscriber={isSubscriber} isEncrypted={article.isEncrypted !== false} fullContent={content} />
  </>;
}
