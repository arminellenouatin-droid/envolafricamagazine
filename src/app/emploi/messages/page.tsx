import { Suspense } from "react";
import type { Metadata } from "next";
import JobsMessagesClient from "./JobsMessagesClient";

export const metadata: Metadata = {
  title: "Messagerie Recrutement & Emploi — Envol Africa Jobs",
  description: "Messagerie professionnelle sécurisée réservée aux abonnés actifs du volet Emploi (Candidats et Recruteurs).",
  robots: {
    index: false,
    follow: false,
  },
};

export default function JobsMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#071b36] text-[#8ee0c0]">
          <div className="text-center">
            <span className="material-symbols-outlined animate-spin text-4xl mb-3">work</span>
            <p className="text-xs text-slate-300">Connexion à la messagerie Jobs...</p>
          </div>
        </div>
      }
    >
      <JobsMessagesClient />
    </Suspense>
  );
}
