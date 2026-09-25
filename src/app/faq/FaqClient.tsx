"use client";

import { useState } from "react";
import Link from "next/link";

interface FaqItem {
  id: string;
  category: string;
  categoryLabel: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  // Magazine & Kiosque
  {
    id: "mag-1",
    category: "kiosque",
    categoryLabel: "Magazine & Kiosque",
    question: "Comment fonctionne la lecture des magazines dans le Kiosque ?",
    answer: "Le Kiosque Envol Africa intègre un lecteur Flipbook interactif haute fidélité. Les premières pages de chaque numéro sont accessibles gratuitement en prévisualisation (jusqu'à la page 8). Pour lire l'intégralité du magazine et le télécharger, vous pouvez l'acheter à l'unité ou souscrire un abonnement mensuel ou annuel.",
  },
  {
    id: "mag-2",
    category: "kiosque",
    categoryLabel: "Magazine & Kiosque",
    question: "Quels sont les avantages d'un abonnement Envol Africa ?",
    answer: "L'abonnement vous donne un accès illimité à l'ensemble des numéros actuels et aux archives complètes du magazine, aux dossiers d'enquêtes économiques exclusives, au téléchargement PDF pour une lecture hors-ligne, ainsi qu'à des invitations prioritaires à nos salons professionnels.",
  },
  {
    id: "mag-3",
    category: "kiosque",
    categoryLabel: "Magazine & Kiosque",
    question: "Puis-je recevoir le magazine papier à mon domicile ou bureau ?",
    answer: "Oui, notre formule d'abonnement Intégral (Papier + Numérique) assure la livraison postale de chaque nouvelle édition dans plus de 18 pays d'Afrique et à l'international.",
  },

  // Jobs & Emploi
  {
    id: "jobs-1",
    category: "jobs",
    categoryLabel: "Jobs & Recrutement",
    question: "Comment postuler aux offres d'emploi sur Envol Africa Jobs ?",
    answer: "Créez votre profil candidat gratuit, importez votre CV et vos compétences clés. Vous pouvez postuler directement en un clic aux offres publiées par les entreprises partenaires et suivre l'avancement de vos candidatures en temps réel.",
  },
  {
    id: "jobs-2",
    category: "jobs",
    categoryLabel: "Jobs & Recrutement",
    question: "Comment une entreprise peut-elle recruter ou diffuser une offre ?",
    answer: "Les recruteurs disposent d'un espace dédié pour enregistrer leur entreprise, publier des offres d'emploi ciblées, accéder à la CVthèque panafricaine et lancer des campagnes sponsorisées pour attirer les meilleurs profils.",
  },

  // Marketplace
  {
    id: "market-1",
    category: "marketplace",
    categoryLabel: "Marketplace Panafricaine",
    question: "Comment ouvrir une boutique vendeur sur la Marketplace ?",
    answer: "Rendez-vous dans la section Marketplace et cliquez sur 'Devenir vendeur'. Après vérification de vos informations et validation de votre compte, vous pourrez publier vos produits, gérer vos stocks, définir vos tarifs et recevoir vos paiements en toute sécurité.",
  },
  {
    id: "market-2",
    category: "marketplace",
    categoryLabel: "Marketplace Panafricaine",
    question: "Comment sont sécurisés les paiements et livraisons sur la Marketplace ?",
    answer: "Chaque transaction est sécurisée via notre passerelle Moneroo (Mobile Money et CB). Les fonds sont conservés sous séquestre jusqu'à confirmation de l'expédition et de la conformité du produit avant versement au vendeur.",
  },

  // Crowdfunding
  {
    id: "crowd-1",
    category: "crowdfunding",
    categoryLabel: "Crowdfunding & Financement",
    question: "Quels types de projets sont éligibles au financement participatif ?",
    answer: "Nous accueillons des projets d'entrepreneuriat, de technologie, d'agro-industrie, d'artisanat, d'impact social et culturel portés par des fondateurs africains ou de la diaspora. Chaque dossier est audité par notre comité de sélection avant sa mise en ligne.",
  },
  {
    id: "crowd-2",
    category: "crowdfunding",
    categoryLabel: "Crowdfunding & Financement",
    question: "Comment financer un projet ou investir ?",
    answer: "Sur la fiche du projet sélectionné, choisissez le montant de votre contribution ou la contrepartie souhaitée. Le règlement s'effectue instantanément via Mobile Money (MTN, Moov, Orange, Wave) ou carte bancaire.",
  },

  // Africa Awards
  {
    id: "awards-1",
    category: "awards",
    categoryLabel: "Africa Awards",
    question: "Comment inscrire une candidature aux Africa Awards ?",
    answer: "Les créateurs, entrepreneurs et leaders peuvent soumettre leur candidature dans les catégories ouvertes. Une fois validée par le jury, la candidature est mise en avant pour le vote du public et les délibérations officielles.",
  },
  {
    id: "awards-2",
    category: "awards",
    categoryLabel: "Africa Awards",
    question: "Comment fonctionne le système de vote et de soutien ?",
    answer: "Le vote est ouvert au public selon les règles de chaque catégorie. Les utilisateurs peuvent attribuer leurs votes et soutenir financièrement leurs nominés favoris grâce à une vérification anti-fraude stricte garantissant l'intégrité des résultats.",
  },

  // World Africa Business (WAB) & Live
  {
    id: "wab-1",
    category: "wab",
    categoryLabel: "World Africa Business (WAB)",
    question: "Qu'est-ce que WAB et en quoi diffère-t-il d'autres réseaux sociaux ?",
    answer: "WAB est le premier réseau professionnel panafricain inspiré des standards internationaux, dédié aux opportunités d'affaires concrètes en Afrique. Il réunit des fonctionnalités de fil d'actualité professionnel, de messagerie directe, de Salons audio/vidéo en direct, de Stories et de Réels business.",
  },
  {
    id: "wab-2",
    category: "wab",
    categoryLabel: "World Africa Business (WAB)",
    question: "Comment participer ou animer un Salon Live sur WAB ?",
    answer: "Les Salons WAB permettent de lancer des diffusions en direct avec vidéo interactive, chat flottant et réactions en temps réel façon TikTok Live. Les créateurs vérifiés peuvent lancer un direct en un clic depuis leur mobile ou ordinateur, et les participants peuvent interagir, poser des questions et envoyer des cadeaux virtuels.",
  },

  // Moyens de paiement & Sécurité
  {
    id: "pay-1",
    category: "paiement",
    categoryLabel: "Paiements & Devises",
    question: "Quels moyens de paiement sont acceptés sur la plateforme ?",
    answer: "Nous acceptons l'ensemble des réseaux Mobile Money africains (MTN Mobile Money, Moov Money, Orange Money, Wave, Celtiis, Airtel Money) ainsi que les cartes bancaires internationales (Visa, Mastercard) via notre partenaire agréé Moneroo. Les devises sont automatiquement détectées selon votre pays.",
  },
  {
    id: "pay-2",
    category: "paiement",
    categoryLabel: "Paiements & Devises",
    question: "Mes transactions financières et données personnelles sont-elles sécurisées ?",
    answer: "Absolument. Toutes les transactions financières s'exécutent avec chiffrement TLS de niveau bancaire, vérification de signature cryptographique HMAC côté serveur, contrôle d'idempotence et double authentification (2FA). Aucune donnée bancaire sensible n'est stockée sur nos serveurs.",
  },

  // Programme d'affiliation
  {
    id: "aff-1",
    category: "affiliation",
    categoryLabel: "Affiliation & Parrainage",
    question: "Comment générer des revenus avec le Programme d'Affiliation ?",
    answer: "Chaque utilisateur dispose d'un lien de parrainage unique dans son espace 'Mon Compte > Affiliation'. En partageant nos articles, magazines, abonnements ou produits de la Marketplace, vous touchez des commissions en numéraire sur chaque vente générée. Les retraits s'effectuent directement vers votre compte Mobile Money.",
  },
];

export default function FaqClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["mag-1", "wab-1", "pay-1"]));

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categories = [
    { id: "all", label: "Toutes les rubriques" },
    { id: "kiosque", label: "Magazine & Kiosque" },
    { id: "wab", label: "WAB & Lives" },
    { id: "jobs", label: "Jobs" },
    { id: "marketplace", label: "Marketplace" },
    { id: "crowdfunding", label: "Crowdfunding" },
    { id: "awards", label: "Africa Awards" },
    { id: "paiement", label: "Paiements" },
    { id: "affiliation", label: "Affiliation" },
  ];

  const filteredItems = FAQ_DATA.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1b1c1c] pb-24">
      {/* Hero Header */}
      <section className="bg-[#1b1c1c] text-white py-14 px-6 md:px-12 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9e001f]/20 border border-[#9e001f]/40 text-[#ffdad8] text-xs font-bold uppercase tracking-wider mb-4">
            Centre d'Aide & Questions Fréquentes
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-white mb-4">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="max-w-xl mx-auto text-sm md:text-base text-[#e4e2e1] leading-relaxed mb-8">
            Retrouvez rapidement des réponses claires sur le fonctionnement de chaque service de l'écosystème Envol Africa.
          </p>

          {/* Barre de recherche */}
          <div className="max-w-xl mx-auto relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une question (ex: abonnement, live, mobile money, retrait...)"
              className="w-full bg-white text-[#1b1c1c] pl-12 pr-4 py-3.5 rounded-full text-xs md:text-sm font-medium shadow-xl focus:outline-none focus:ring-2 focus:ring-[#9e001f]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Catégories de filtres */}
      <section className="max-w-5xl mx-auto px-6 pt-10">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? "bg-[#9e001f] text-white shadow-md"
                  : "bg-white border border-[#e5bdbb] text-[#6b5353] hover:bg-[#fff5f3]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Accordéon FAQ */}
      <section className="max-w-4xl mx-auto px-6 pt-10">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e5bdbb] p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-[#9e001f] mb-3">help_outline</span>
            <h3 className="text-lg font-bold font-display text-[#1b1c1c]">Aucune question trouvée</h3>
            <p className="text-xs text-[#6b5353] mt-1 mb-6">
              Votre recherche "{searchQuery}" n'a donné aucun résultat. Essayez d'autres mots-clés ou contactez notre support.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-[#9e001f] text-white px-5 py-2.5 rounded-full text-xs font-bold"
            >
              Contacter l'Assistance
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const isOpen = openIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#e5bdbb]/70 overflow-hidden transition-all duration-200 shadow-sm hover:shadow"
                >
                  <button
                    type="button"
                    onClick={() => toggleOpen(item.id)}
                    className="w-full text-left p-5 md:p-6 flex items-start justify-between gap-4 focus:outline-none"
                  >
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#f2e8e6] text-[#9e001f] mb-2">
                        {item.categoryLabel}
                      </span>
                      <h3 className="text-sm md:text-base font-bold font-display text-[#1b1c1c] leading-snug">
                        {item.question}
                      </h3>
                    </div>
                    <span
                      className={`material-symbols-outlined text-xl text-[#9e001f] transition-transform duration-200 shrink-0 mt-1 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 md:px-6 pb-6 pt-0 border-t border-[#f2e8e6]/60">
                      <p className="text-xs md:text-sm text-[#544141] leading-relaxed mt-3">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bloc d'aide supplémentaire */}
        <div className="mt-12 bg-white rounded-3xl border border-[#e5bdbb] p-8 text-center shadow-md">
          <h3 className="text-xl font-bold font-display text-[#1b1c1c] mb-2">
            Vous ne trouvez pas la réponse à votre question ?
          </h3>
          <p className="text-xs text-[#6b5353] max-w-md mx-auto mb-6">
            Notre équipe d'assistance dédiée est disponible pour vous accompagner du lundi au samedi de 8h à 20h GMT.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-[#9e001f] hover:bg-[#c8102e] text-white px-6 py-3 rounded-full text-xs font-bold transition-all shadow"
            >
              <span className="material-symbols-outlined text-base">support_agent</span>
              Ouvrir un ticket d'assistance
            </Link>
            <a
              href="https://wa.me/2290154888888"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-6 py-3 rounded-full text-xs font-bold transition-all shadow"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              Assistance WhatsApp direct
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
