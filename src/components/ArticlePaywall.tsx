"use client";

import Link from "next/link";
import RichTextContent from "@/components/RichTextContent";

interface ArticlePaywallProps {
  summary: string;
  isSubscriber: boolean;
  isEncrypted: boolean;
  fullContent: string;
}

export default function ArticlePaywall({
  summary,
  isSubscriber,
  isEncrypted,
  fullContent,
}: ArticlePaywallProps) {
  // 1. Article en accès libre
  if (!isEncrypted) {
    return (
      <div className="prose prose-zinc mt-8 max-w-none prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-zinc-800 prose-headings:font-serif prose-headings:font-bold">
        <RichTextContent value={fullContent} />
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-[13px] font-medium text-emerald-900 shadow-sm flex items-center gap-2.5">
          <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
          <span>Article librement accessible — merci de soutenir le journalisme panafricain d&apos;investigation.</span>
        </div>
      </div>
    );
  }

  // 2. Utilisateur abonné : affichage direct du contenu complet
  if (isSubscriber) {
    return (
      <div className="prose prose-zinc mt-8 max-w-none prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-zinc-800 prose-headings:font-serif prose-headings:font-bold">
        <RichTextContent value={fullContent} />
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-[13px] font-medium text-emerald-900 shadow-sm flex items-center gap-2.5">
          <span className="material-symbols-outlined text-emerald-600 text-lg">workspace_premium</span>
          <span>Vous lisez cet article en accès intégral en tant qu’abonné. Merci de soutenir l&apos;indépendance de notre rédaction.</span>
        </div>
      </div>
    );
  }

  // 3. Article protégé / Visiteur non abonné : Paywall éditorial d'exception harmonisé Magazine & Kiosque
  return (
    <section
      className="mt-10 mb-12"
      aria-label="Article réservé aux abonnés"
    >
      {/* Simulation de texte en fondu progressif pour souligner la coupure éditoriale */}
      <div className="relative select-none overflow-hidden max-h-32 opacity-40 blur-[2.5px] pointer-events-none text-[#5c403f] font-serif text-[17px] leading-relaxed">
        <p>
          Au cœur des mutations économiques et industrielles de l&apos;Afrique contemporaine, les stratégies de financement
          et de compétitivité redéfinissent les équilibres régionaux. L&apos;analyse approfondie des données sectorielles
          met en lumière des trajectoires d&apos;investissement inédites, portées par les leaders émergents et les nouveaux corridors commerciaux...
        </p>
        <p className="mt-3">
          Ces dynamiques structurelles imposent aux décideurs et entrepreneurs d&apos;anticiper les cycles de croissance et les évolutions réglementaires...
        </p>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fffcfb]/60 to-[#fffcfb]" />
      </div>

      {/* Carte Paywall Prestige Envol Africa Magazine */}
      <div className="relative -mt-10 overflow-hidden rounded-[28px] border-2 border-[#d4af37]/45 bg-gradient-to-br from-[#6d0015] via-[#9e001f] to-[#40000a] p-6 text-white shadow-[0_24px_60px_rgba(158,0,31,0.28)] sm:p-10 text-center">
        {/* Halo doré ambiant */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-[#d4af37]/20 blur-3xl"
        />

        {/* Badge d'exclusivité */}
        <div className="relative inline-flex items-center gap-2 rounded-full border border-[#d4af37]/50 bg-black/35 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#f7d984] backdrop-blur-md">
          <span className="material-symbols-outlined text-[15px] text-[#f7d984]">lock</span>
          <span>Édition Réservée aux Abonnés</span>
        </div>

        {/* Titre agrandi, mis en valeur et en gras */}
        <h3
          className="relative mt-5 text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl leading-tight"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          La suite de cet article est réservée aux abonnés.
        </h3>

        {/* Sous-titre valorisant */}
        <p
          className="relative mt-3.5 text-base sm:text-lg text-white/95 font-medium max-w-2xl mx-auto leading-relaxed"
          style={{ fontFamily: "Source Serif 4, Georgia, serif" }}
        >
          Abonnez-vous pour lire tout le contenu et les autres articles d’Envol Africa Magazine.
        </p>

        {/* Points forts de l'abonnement */}
        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-semibold text-white/90">
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur-sm border border-white/15">
            <span className="text-[#f7d984]">✓</span>
            <span>Enquêtes économiques & dossiers exclusifs</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur-sm border border-white/15">
            <span className="text-[#f7d984]">✓</span>
            <span>Accès complet au Kiosque numérique</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur-sm border border-white/15">
            <span className="text-[#f7d984]">✓</span>
            <span>Écoute audio multilingue en 12 langues</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur-sm border border-white/15">
            <span className="text-[#f7d984]">✓</span>
            <span>Sans engagement de durée</span>
          </div>
        </div>

        {/* Boutons d'action clairs et percutants */}
        <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          {/* Bouton principal : Découvrez nos abonnements */}
          <Link
            href="/abonnement"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#e8c764] via-[#d4af37] to-[#be9322] px-8 py-4 text-base font-black text-[#261502] shadow-[0_10px_25px_rgba(212,175,55,0.45)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_12px_30px_rgba(212,175,55,0.6)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#f7d984] focus:ring-offset-2 focus:ring-offset-[#6d0015]"
          >
            <span>Découvrez nos abonnements</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>

          {/* Bouton secondaire : Se connecter pour abonnés existants */}
          <Link
            href="/auth/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-4 text-sm sm:text-base font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:border-white/60 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#6d0015]"
          >
            <span>Déjà abonné ? Se connecter</span>
          </Link>
        </div>

        {/* Réassurance de bas de carte */}
        <p className="relative mt-6 text-xs text-white/70">
          Activation instantanée • Paiement sécurisé par Mobile Money &amp; Carte bancaire via Moneroo • Annulable à tout moment
        </p>
      </div>

      <p className="mt-3.5 text-center text-xs text-[#746665]">
        Résumé et titre publics · Contenu intégral, graphiques et version audio réservés aux abonnés
      </p>
    </section>
  );
}
