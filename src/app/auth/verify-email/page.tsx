"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirmation de votre adresse e-mail…");
  useEffect(() => {
    if (!token) { setState("error"); setMessage("Le lien de confirmation est incomplet."); return; }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, { redirect: "manual", cache: "no-store" }).then((response) => {
      if (response.type === "opaqueredirect" || response.status === 307 || response.status === 308 || response.ok) { setState("success"); setMessage("Votre adresse e-mail est confirmée. Vous pouvez maintenant vous connecter."); return; }
      setState("error"); setMessage("Ce lien est invalide, expiré ou déjà utilisé.");
    }).catch(() => { setState("error"); setMessage("La confirmation n’a pas pu être effectuée. Réessayez plus tard."); });
  }, [token]);
  return <main className="grid min-h-screen place-items-center bg-[#fcf9f8] px-5 py-12 text-[#2a211a]"><section className="w-full max-w-md rounded-[28px] border border-[#eadfce] bg-white p-8 text-center shadow-sm"><span className={`material-symbols-outlined text-5xl ${state === "success" ? "text-[#087e8b]" : state === "error" ? "text-[#9e001f]" : "text-[#a36300]"}`}>{state === "success" ? "mark_email_read" : state === "error" ? "error" : "mail"}</span><h1 className="mt-4 font-display text-2xl font-black">Confirmation e-mail</h1><p className="mt-3 text-sm leading-6 text-[#725f4d]">{message}</p>{state !== "loading" && <Link href="/auth/login" className="mt-6 inline-flex rounded-full bg-[#9e001f] px-6 py-3 text-xs font-black text-white">Aller à la connexion</Link>}</section></main>;
}

export default function VerifyEmailPage() { return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#fcf9f8] text-sm text-[#725f4d]">Chargement…</main>}><VerifyEmailContent /></Suspense>; }
