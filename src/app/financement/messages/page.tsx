import { Suspense } from "react";
import type { Metadata } from "next";
import CrowdfundingMessagesClient from "./CrowdfundingMessagesClient";

export const metadata: Metadata = {
  title: "Messagerie Investisseurs & Porteurs — AfricaCrowdFunding Envol Africa",
  description: "Salle de discussion officielle isolée réservée aux porteurs de projet et investisseurs confirmés.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CrowdfundingMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#071322] text-amber-400">
          <div className="text-center">
            <span className="material-symbols-outlined animate-spin text-4xl mb-3">progress_activity</span>
            <p className="text-xs text-slate-300">Connexion à la salle des investisseurs...</p>
          </div>
        </div>
      }
    >
      <CrowdfundingMessagesClient />
    </Suspense>
  );
}
