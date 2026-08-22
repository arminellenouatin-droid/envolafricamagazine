"use client";

import { useMemo, useState } from "react";
import ArticlePaywall from "@/components/ArticlePaywall";
import RichTextContent from "@/components/RichTextContent";

type Translation = { title?: string; summary?: string; content?: string };
type ArticleInput = { title: string; summary: string; content: string; language: string; translations?: Record<string, Translation>; audioByLanguage?: Record<string, string>; audioUrl?: string; hasAudio?: boolean; isEncrypted?: boolean };

const LANGUAGE_LABELS: Record<string, string> = { fr: "Français", en: "English", es: "Español", sw: "Swahili", fon: "Fongbé", wo: "Wolof", ha: "Hausa", yo: "Yorùbá", ig: "Igbo", ff: "Fulfulde", zu: "isiZulu", ee: "Eʋegbe" };

export default function LocalizedArticleExperience({ article, isSubscriber, preferredLanguage }: { article: ArticleInput; isSubscriber: boolean; preferredLanguage?: string }) {
  const available = useMemo(() => {
    const codes = new Set([article.language || "fr", ...Object.keys(article.translations || {}), ...Object.keys(article.audioByLanguage || {})]);
    return [...codes].filter((code) => LANGUAGE_LABELS[code]);
  }, [article]);
  const [language, setLanguage] = useState(preferredLanguage && available.includes(preferredLanguage) ? preferredLanguage : article.language || "fr");
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const translation = article.translations?.[language];
  const title = translation?.title || article.title;
  const summary = translation?.summary || article.summary;
  const content = translation?.content || article.content;
  const audio = article.audioByLanguage?.[language] || (language === article.language ? article.audioUrl : undefined);
  return <>
    <div className="mb-5 flex flex-nowrap items-center gap-3 overflow-visible rounded-2xl bg-[#9e001f] px-3 py-3 text-white shadow-[0_10px_28px_rgba(158,0,31,0.18)] sm:px-4"><div className="relative shrink-0"><button type="button" onClick={() => setLanguageMenuOpen((open) => !open)} aria-expanded={languageMenuOpen} aria-haspopup="listbox" aria-label={`Choisir la langue : ${LANGUAGE_LABELS[language] || language}`} className="inline-flex h-9 max-w-[145px] items-center gap-2 whitespace-nowrap rounded-xl border border-white/35 bg-white px-3 text-[11px] font-black text-[#9e001f] shadow-sm transition hover:bg-[#fff5f5]"><span className="truncate">{LANGUAGE_LABELS[language] || language.toUpperCase()}</span><span className="material-symbols-outlined text-[16px]">{languageMenuOpen ? "expand_less" : "expand_more"}</span></button>{languageMenuOpen && <div role="listbox" aria-label="Versions linguistiques disponibles" className="absolute left-0 top-[calc(100%+0.45rem)] z-40 min-w-[180px] rounded-xl border border-[#e5bdbb] bg-white p-2 text-[#242020] shadow-xl">{available.map((code) => <button type="button" role="option" aria-selected={language === code} key={code} onClick={() => { setLanguage(code); setLanguageMenuOpen(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-[11px] font-bold ${language === code ? "bg-[#f0eded] text-[#9e001f]" : "hover:bg-[#f6f3f2]"}`}>{LANGUAGE_LABELS[code]}</button>)}</div>}</div>{isSubscriber && audio ? <audio controls preload="none" src={audio} className="h-9 min-w-0 flex-1" aria-label={`Écouter l’article en ${LANGUAGE_LABELS[language]}`} /> : <span className="min-w-0 flex-1 text-[11px] font-semibold text-white/85">{isSubscriber ? "Aucun audio dans cette langue" : "Audio réservé aux abonnés"}</span>}</div>
    <h1 className="text-[32px] font-bold leading-tight text-[#1b1c1c] md:text-[40px]" style={{ fontFamily: "Montserrat" }}>{title}</h1>
    <div className="mb-8 mt-4 text-[18px] leading-[1.6] italic text-[#5c403f]" style={{ fontFamily: "Source Serif 4" }}><RichTextContent value={summary} /></div>
    <ArticlePaywall summary={summary} isSubscriber={isSubscriber} isEncrypted={article.isEncrypted !== false} fullContent={content} />
  </>;
}
