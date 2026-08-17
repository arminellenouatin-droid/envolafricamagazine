"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { validateDocumentUrl } from "@/lib/internal-browser";

function extensionOf(name: string, url: string) {
  const source = `${name} ${url}`.toLowerCase().split(/[?#]/)[0];
  return source.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|m4v|mp3|wav|ogg)(?:$|\s)/)?.[1] || "";
}

function ReaderContent() {
  const router = useRouter();
  const params = useSearchParams();
  const rawUrl = params.get("url") || "";
  const fileName = params.get("name") || "Document EAM";
  const mimeType = params.get("type") || "";
  const url = useMemo(() => validateDocumentUrl(rawUrl), [rawUrl]);
  const extension = extensionOf(fileName, rawUrl);
  const kind = mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension) ? "image" : mimeType.startsWith("video/") || ["mp4", "webm", "mov", "m4v"].includes(extension) ? "video" : mimeType.startsWith("audio/") || ["mp3", "wav", "ogg"].includes(extension) ? "audio" : extension === "pdf" || mimeType === "application/pdf" ? "pdf" : ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension) ? "office" : "other";
  const canUseOfficeViewer = Boolean(url?.startsWith("https://") && kind === "office");
  const officeViewerUrl = canUseOfficeViewer ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url || "")}` : "";

  if (!url) {
    return <main className="min-h-[65vh] bg-[#fcf9f8] px-5 py-20"><div className="mx-auto max-w-2xl rounded-3xl border border-[#e5bdbb] bg-white p-8 text-center shadow-sm"><span className="material-symbols-outlined text-5xl text-[#9e001f]">description</span><h1 className="mt-4 font-display text-2xl font-black text-[#303030]">Document indisponible</h1><p className="mt-3 text-sm leading-6 text-[#5c403f]">Le lien du fichier est invalide ou n’est plus accessible.</p><Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-[#303030] px-6 text-sm font-bold text-white">Retour à l’accueil</Link></div></main>;
  }

  return <main className="min-h-[70vh] bg-[#eef2f4]"><div className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-8"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3"><button type="button" onClick={() => router.back()} aria-label="Retour" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100"><span className="material-symbols-outlined">arrow_back</span></button><Link href="/" className="font-display text-lg font-black text-[#9e001f]">EAM</Link><div className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />{fileName}</div><a href={url} download className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100"><span className="material-symbols-outlined text-[17px]">download</span>Télécharger</a></div></div><div className="mx-auto max-w-[1440px] px-4 py-4 md:px-8"><div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900"><span className="material-symbols-outlined text-[18px]">verified_user</span><p><strong>Lecteur sécurisé EAM :</strong> le fichier est affiché sans exécuter de macro ni de contenu actif. Pour Word, PowerPoint et Excel, l’aperçu dépend d’un service de rendu compatible et le téléchargement officiel reste disponible.</p></div><section className="mt-4 flex min-h-[560px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{kind === "image" && <img src={url} alt={fileName} className="max-h-[calc(100vh-250px)] max-w-full object-contain" />}{kind === "video" && <video src={url} controls playsInline className="max-h-[calc(100vh-250px)] max-w-full" />}{kind === "audio" && <audio src={url} controls className="w-[min(90%,560px)]" />}{kind === "pdf" && <iframe title={fileName} src={url} className="h-[calc(100vh-250px)] min-h-[560px] w-full" />}{kind === "office" && canUseOfficeViewer && <iframe title={`Aperçu ${fileName}`} src={officeViewerUrl} className="h-[calc(100vh-250px)] min-h-[560px] w-full" />}{kind === "office" && !canUseOfficeViewer && <div className="max-w-xl p-8 text-center"><span className="material-symbols-outlined text-5xl text-[#087e8b]">description</span><h2 className="mt-4 font-display text-2xl font-black text-slate-900">Aperçu Office indisponible pour ce fichier privé</h2><p className="mt-3 text-sm leading-6 text-slate-600">Les fichiers Word, PowerPoint et Excel privés ne sont pas envoyés à un service tiers. Utilisez le bouton de téléchargement pour les ouvrir avec votre application habituelle.</p></div>}{kind === "other" && <div className="max-w-xl p-8 text-center"><span className="material-symbols-outlined text-5xl text-slate-400">insert_drive_file</span><h2 className="mt-4 font-display text-2xl font-black text-slate-900">Format non prévisualisable</h2><p className="mt-3 text-sm leading-6 text-slate-600">Le fichier est disponible au téléchargement, mais son format n’est pas rendu directement dans le navigateur.</p></div>}</section></div></main>;
}

export default function DocumentReaderPage() { return <Suspense fallback={<main className="min-h-[70vh] bg-[#eef2f4] p-8"><div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-center text-sm text-slate-600">Chargement du lecteur…</div></main>}><ReaderContent /></Suspense>; }
