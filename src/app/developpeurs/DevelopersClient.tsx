"use client";

import React, { useState } from "react";
import Link from "next/link";

interface EndpointDoc {
  id: string;
  category: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  scope: string;
  title: string;
  description: string;
  headers: Record<string, string>;
  params?: Array<{ name: string; type: string; required: boolean; desc: string }>;
  body?: Record<string, any>;
  responseExample: Record<string, any>;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    id: "articles-get",
    category: "Articles & Rédaction",
    method: "GET",
    path: "/api/agent/articles",
    scope: "articles:read",
    title: "Lister et rechercher les articles",
    description: "Permet à l'agent de récupérer les articles publiés ou en brouillon, avec filtres par catégorie, mot-clé ou statut.",
    headers: { "x-agent-api-key": "eam_live_votre_cle_secrete" },
    params: [
      { name: "status", type: "string", required: false, desc: "'all' | 'published' | 'draft' (défaut: 'all')" },
      { name: "category", type: "string", required: false, desc: "Ex: 'Economie', 'Entrepreneuriat', 'Tech'" },
      { name: "search", type: "string", required: false, desc: "Mots-clés de recherche dans le titre" },
      { name: "limit", type: "number", required: false, desc: "Nombre maximum d'articles (1 à 100, défaut: 30)" },
    ],
    responseExample: {
      success: true,
      count: 2,
      articles: [
        {
          id: "art-101",
          title: "L'Intelligence Artificielle en Afrique : Le Bénin montre la voie",
          slug: "intelligence-artificielle-benin-strategie-nationale",
          category: "Tech",
          isPublished: true,
          views: 3420,
          likes: 215,
          summary: "Analyse approfondie de la feuille de route numérique et de la souveraineté des données.",
        },
      ],
    },
  },
  {
    id: "articles-post",
    category: "Articles & Rédaction",
    method: "POST",
    path: "/api/agent/articles",
    scope: "articles:write",
    title: "Rédiger et publier un article",
    description: "Crée un nouvel article. L'agent peut le sauvegarder en brouillon (`isPublished: false`) ou le publier immédiatement avec option de republication automatique sur le réseau social WAB.",
    headers: {
      "Content-Type": "application/json",
      "x-agent-api-key": "eam_live_votre_cle_secrete",
    },
    body: {
      title: "Transition énergétique au Sahel : Le triomphe du solaire",
      summary: "Comment les micro-centrales photovoltaïques transforment l'économie rurale.",
      content: "<p>L'essor de l'énergie solaire au Sahel redéfinit les modèles de distribution...</p>",
      category: "Economie",
      tags: ["Solaire", "Sahel", "Energie", "Innovation"],
      isPublished: true,
      publishToWab: true,
      wabPostContent: "☀️ Nouvelle analyse exclusive : Comment l'énergie solaire révolutionne l'économie sahélienne. À lire sur Envol Africa !",
    },
    responseExample: {
      success: true,
      message: "Article publié avec succès et diffusé sur le réseau WAB",
      articleId: "e9f2c1b4-7d5a-4e8c-9a1b-3f2d5e6a7b8c",
      slug: "transition-energetique-au-sahel-le-triomphe-du-solaire",
      wabPostId: "wab-post-88912",
    },
  },
  {
    id: "social-snippets",
    category: "Réseaux Sociaux",
    method: "GET",
    path: "/api/agent/social-snippets",
    scope: "social:read",
    title: "Générer du contenu réseaux sociaux (Punchlines & Posts)",
    description: "Extrait automatiquement la citation marquante d'un article et génère des versions pré-formatées adaptées aux algorithmes LinkedIn, Twitter/X, WAB, Facebook et Instagram.",
    headers: { "x-agent-api-key": "eam_live_votre_cle_secrete" },
    params: [
      { name: "slug", type: "string", required: false, desc: "Slug unique de l'article ciblé" },
      { name: "id", type: "string", required: false, desc: "ID interne de l'article" },
      { name: "limit", type: "number", required: false, desc: "Nombre d'articles récents à traiter (1 à 10, défaut: 3)" },
    ],
    responseExample: {
      success: true,
      count: 1,
      snippets: [
        {
          articleTitle: "L'Intelligence Artificielle au Bénin",
          punchline: "« Le saut technologique de l'Afrique ne sera pas importé, il sera bâti par nos ingénieurs. »",
          platforms: {
            linkedin: "💡 Pourquoi l'Afrique prend la tête de l'innovation IA ?\n\nDans notre dernière enquête...",
            twitter: "⚡ « Le saut technologique de l'Afrique sera bâti par nos ingénieurs. »\n\nDécouvrez comment : https://envolafrica.site/article/...",
            wab: "🌍 [World Africa Business] L'Afrique avance à grands pas. Découvrez l'analyse exclusive...",
            instagram: "✨ Innovation & Futur Africain — Envol Africa Magazine...",
          },
        },
      ],
    },
  },
  {
    id: "magazines-get",
    category: "Kiosque & Magazines",
    method: "GET",
    path: "/api/agent/magazines",
    scope: "magazines:read",
    title: "Lister les éditions du Kiosque",
    description: "Récupère la liste intégrale des magazines parus avec numéros, dates, couvertures et statistiques d'aperçu flipbook.",
    headers: { "x-agent-api-key": "eam_live_votre_cle_secrete" },
    responseExample: {
      success: true,
      count: 14,
      magazines: [
        {
          id: "mag-14",
          numero: 14,
          title: "Bourse & Capitaux : La BRVM bat tous les records",
          periode: "Février - Mars 2026",
          year: 2026,
          cover: "https://r2.envolafrica.site/covers/mag-14.webp",
          previewImagesCount: 10,
        },
      ],
    },
  },
  {
    id: "magazines-post",
    category: "Kiosque & Magazines",
    method: "POST",
    path: "/api/agent/magazines",
    scope: "magazines:write",
    title: "Monter et publier un nouveau magazine",
    description: "Permet à l'agent de créer une nouvelle édition au kiosque avec ses prix par formule, ses URLs de PDF sécurisés et ses pages flipbook de prévisualisation.",
    headers: {
      "Content-Type": "application/json",
      "x-agent-api-key": "eam_live_votre_cle_secrete",
    },
    body: {
      numero: 15,
      title: "Souveraineté Agroalimentaire : Le réveil du continent",
      description: "Grand dossier sur l'autonomie agricole et les corridors commerciaux de la ZLECAf.",
      periode: "Avril - Mai 2026",
      year: 2026,
      category: "Economie",
      cover: "https://r2.envolafrica.site/covers/mag-15.webp",
      prices: { numerique: 5000, papier: 10000, duo: 12000 },
      featured: true,
      publishToWab: true,
    },
    responseExample: {
      success: true,
      message: "Magazine N°15 créé et publié avec succès dans le kiosque",
      magazineId: "mag-15",
    },
  },
  {
    id: "analytics-get",
    category: "Analyse de Données",
    method: "GET",
    path: "/api/agent/analytics",
    scope: "analytics:read",
    title: "Obtenir l'analyse de données et les KPIs",
    description: "Fournit un rapport consolidé sur le lectorat (vues, likes, tops articles), la conversion des abonnements, les ventes de magazines et les dons.",
    headers: { "x-agent-api-key": "eam_live_votre_cle_secrete" },
    responseExample: {
      success: true,
      generatedAt: "2026-03-30T14:22:00.000Z",
      overview: {
        totalArticles: 48,
        publishedArticles: 42,
        totalMagazines: 14,
        totalUsers: 1250,
        subscribersCount: 380,
        totalOrders: 620,
        paidOrders: 580,
      },
      readership: {
        totalViews: 148500,
        totalLikes: 8920,
        topArticles: [
          { title: "Bourse BRVM", views: 18200, likes: 950 },
          { title: "IA au Bénin", views: 14500, likes: 780 },
        ],
      },
      revenue: {
        estimatedTurnoverXof: 18500000,
      },
    },
  },
  {
    id: "media-kit-get",
    category: "Kit Média & Régie",
    method: "GET",
    path: "/api/agent/media-kit",
    scope: "media_kit:read",
    title: "Consulter la grille publicitaire et les chiffres d'audience",
    description: "Récupère les tarifs publicitaires (4ème de couverture, double page, bannières web, articles sponsorisés) et les statistiques d'audience pour les annonceurs.",
    headers: { "x-agent-api-key": "eam_live_votre_cle_secrete" },
    responseExample: {
      success: true,
      audienceSummary: {
        monthlyReaders: 45000,
        countriesSpread: 18,
        printRun: 10000,
        targetAudience: "Dirigeants, Investisseurs, Cadres supérieurs",
      },
      formats: [
        { id: "cover-4", name: "4ème de couverture (Dos)", priceXof: 850000, priceEur: 1300 },
        { id: "page-int", name: "Pleine Page Intérieure", priceXof: 500000, priceEur: 760 },
      ],
    },
  },
  {
    id: "wab-post",
    category: "Réseau Social WAB",
    method: "POST",
    path: "/api/agent/wab",
    scope: "wab:publish",
    title: "Publier une annonce officielle sur WAB",
    description: "Diffuse un post officiel sur le réseau World Africa Business. Traite automatiquement les mentions et les hashtags avec lien d'ancrage.",
    headers: {
      "Content-Type": "application/json",
      "x-agent-api-key": "eam_live_votre_cle_secrete",
    },
    body: {
      content: "🌍 L'édition N°15 d'Envol Africa est disponible ! Focus sur la souveraineté agroalimentaire africaine. #Agrobusiness #Afrique #Innovation",
      visibility: "public",
      sourceUrl: "https://envolafrica.site/kiosque/mag-15",
      sourceTitle: "Envol Africa N°15",
    },
    responseExample: {
      success: true,
      message: "Post WAB publié avec succès",
      postId: "wab-post-7712",
      permalink: "https://envolafrica.site/wab/post/wab-post-7712",
    },
  },
  {
    id: "comments-moderate",
    category: "Modération",
    method: "PUT",
    path: "/api/agent/comments",
    scope: "comments:moderate",
    title: "Modérer ou masquer un commentaire lecteur",
    description: "Permet à l'agent de modérer, valider ou masquer un commentaire lecteur signalé ou suspect.",
    headers: {
      "Content-Type": "application/json",
      "x-agent-api-key": "eam_live_votre_cle_secrete",
    },
    body: {
      id: "comment-9921",
      isModerated: true,
      action: "hide",
    },
    responseExample: {
      success: true,
      message: "Commentaire modéré avec succès",
    },
  },
];

export default function DevelopersClient() {
  const [activeLang, setActiveLang] = useState<"curl" | "typescript" | "python">("curl");
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDoc>(ENDPOINTS[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCodeSnippet = (endpoint: EndpointDoc, lang: "curl" | "typescript" | "python") => {
    const baseUrl = "https://envolafrica.site";
    const fullUrl = `${baseUrl}${endpoint.path}`;

    if (lang === "curl") {
      if (endpoint.method === "GET") {
        return `curl -X GET "${fullUrl}" \\
  -H "x-agent-api-key: eam_live_votre_cle_secrete"`;
      }
      return `curl -X ${endpoint.method} "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-agent-api-key: eam_live_votre_cle_secrete" \\
  -d '${JSON.stringify(endpoint.body || {}, null, 2)}'`;
    }

    if (lang === "typescript") {
      if (endpoint.method === "GET") {
        return `const response = await fetch("${fullUrl}", {
  method: "GET",
  headers: {
    "x-agent-api-key": process.env.EAM_AGENT_API_KEY!,
  },
});

const data = await response.json();
console.log(data);`;
      }
      return `const response = await fetch("${fullUrl}", {
  method: "${endpoint.method}",
  headers: {
    "Content-Type": "application/json",
    "x-agent-api-key": process.env.EAM_AGENT_API_KEY!,
  },
  body: JSON.stringify(${JSON.stringify(endpoint.body || {}, null, 2)}),
});

const data = await response.json();
console.log(data);`;
    }

    // Python
    if (endpoint.method === "GET") {
      return `import requests
import os

url = "${fullUrl}"
headers = {
    "x-agent-api-key": os.getenv("EAM_AGENT_API_KEY")
}

response = requests.get(url, headers=headers)
data = response.json()
print(data)`;
    }
    return `import requests
import os

url = "${fullUrl}"
headers = {
    "Content-Type": "application/json",
    "x-agent-api-key": os.getenv("EAM_AGENT_API_KEY")
}
payload = ${JSON.stringify(endpoint.body || {}, null, 4)}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print(data)`;
  };

  return (
    <div className="bg-[#f8fafc] text-slate-800 min-h-screen">
      {/* Hero Header */}
      <section className="bg-[#0A1931] text-white pt-16 pb-20 border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#9e001f_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-[#D4AF37] mb-6">
            <span>⚡ Envol Africa Agent API v1.0</span>
            <span>•</span>
            <span className="text-white/80">REST & Model Context Protocol (MCP)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white max-w-3xl leading-[1.15]">
            Connectez vos Agents IA et Applications à Envol Africa
          </h1>

          <p className="mt-5 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Automatisez la rédaction d’articles, la génération de contenus pour les réseaux sociaux, le montage d’éditions kiosque, l’analyse de données et la régie média via notre API sécurisée et notre serveur officiel MCP.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/admin?platform=magazine"
              className="inline-flex items-center gap-2 px-6 h-12 rounded-full bg-[#9e001f] text-white font-bold text-xs hover:bg-[#800019] transition shadow-lg shadow-[#9e001f]/30"
            >
              <span>Générer une clé API (Admin)</span>
              <span>→</span>
            </Link>
            <a
              href="#mcp-section"
              className="inline-flex items-center gap-2 px-6 h-12 rounded-full bg-white/10 text-white font-bold text-xs border border-white/15 hover:bg-white/20 transition"
            >
              <span>Configuration Serveur MCP</span>
            </a>
            <a
              href="#endpoints-section"
              className="inline-flex items-center gap-2 px-6 h-12 rounded-full bg-white/5 text-white/80 font-bold text-xs hover:bg-white/10 transition"
            >
              <span>Catalogue des Endpoints</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[280px_1fr] gap-10 items-start">
          {/* Sticky Navigation Sidebar */}
          <aside className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Démarrage
              </h3>
              <ul className="space-y-1 text-xs">
                <li>
                  <a href="#auth-section" className="block px-3 py-2 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#9e001f]">
                    🔑 Authentification & Clés
                  </a>
                </li>
                <li>
                  <a href="#mcp-section" className="block px-3 py-2 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#9e001f]">
                    🤖 Serveur MCP Officiel
                  </a>
                </li>
                <li>
                  <a href="#scopes-section" className="block px-3 py-2 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#9e001f]">
                    🛡️ Scopes & Permissions
                  </a>
                </li>
              </ul>
            </div>

            <div className="border-t pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Endpoints ({ENDPOINTS.length})
              </h3>
              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                {ENDPOINTS.map((ep) => {
                  const isSelected = selectedEndpoint.id === ep.id;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => {
                        setSelectedEndpoint(ep);
                        const el = document.getElementById("endpoint-card");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                        isSelected
                          ? "bg-[#9e001f]/10 text-[#9e001f] font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate mr-2">{ep.title}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          ep.method === "GET"
                            ? "bg-blue-100 text-blue-800"
                            : ep.method === "POST"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ep.method}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="space-y-12 min-w-0">
            {/* Section 1 : Authentification */}
            <section id="auth-section" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-800 font-bold text-lg">
                  🔑
                </span>
                <div>
                  <h2 className="text-xl font-black text-[#0A1931]">Authentification & Clés API</h2>
                  <p className="text-xs text-slate-500">Sécurité de niveau bancaire conforme aux règles AGENTS.md</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Toutes les requêtes vers l'API agent doivent inclure une clé d'API valide. Vous pouvez transmettre votre clé via l'en-tête personnalisé <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono text-xs">x-agent-api-key</code> ou via le header standard <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono text-xs">Authorization: Bearer</code>.
              </p>

              <div className="mt-5 p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto relative group">
                <div className="text-slate-400 mb-1"># Exemple d'en-tête HTTP :</div>
                <div>x-agent-api-key: eam_live_a1b2c3d4e5f6...</div>
                <div className="mt-1 text-slate-500"># Ou standard Bearer :</div>
                <div>Authorization: Bearer eam_live_a1b2c3d4e5f6...</div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <span className="text-base">💡</span>
                <div>
                  <strong className="block font-bold">Comment obtenir votre clé d'agent ?</strong>
                  <span>
                    Rendez-vous dans la section <Link href="/admin?platform=magazine" className="underline font-bold">Administration &gt; Agents & Clés API</Link>. Vous pouvez y générer des clés avec permissions restreintes (ex: uniquement Rédaction ou uniquement Analytics) et les révoquer instantanément en cas de besoin.
                  </span>
                </div>
              </div>
            </section>

            {/* Section 2 : MCP (Model Context Protocol) */}
            <section id="mcp-section" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-800 font-bold text-lg">
                  🤖
                </span>
                <div>
                  <h2 className="text-xl font-black text-[#0A1931]">Serveur MCP (Claude Desktop, Cursor, Antigravity)</h2>
                  <p className="text-xs text-slate-500">Connectez vos agents conversationnels directement aux 8 outils métiers</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Le dépôt comprend un serveur officiel <strong>Model Context Protocol (MCP)</strong> situé dans le dossier <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">mcp-server-envolafrica</code>. Il permet à Claude Desktop, Cursor ou tout agent compatible d'appeler directement les fonctions d'Envol Africa comme des outils natifs.
              </p>

              <div className="mt-6">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Configuration pour Claude Desktop (<code className="font-mono text-[11px]">claude_desktop_config.json</code>) :
                </h4>
                <div className="relative p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto">
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        JSON.stringify(
                          {
                            mcpServers: {
                              "envol-africa": {
                                command: "node",
                                args: ["c:/Users/EliteBook/NOUVEAUX PROJETS/EAM final/mcp-server-envolafrica/dist/index.js"],
                                env: {
                                  EAM_SITE_URL: "https://envolafrica.site",
                                  EAM_AGENT_API_KEY: "eam_live_votre_cle_ici",
                                },
                              },
                            },
                          },
                          null,
                          2
                        ),
                        "mcp-config"
                      )
                    }
                    className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold"
                  >
                    {copiedId === "mcp-config" ? "✓ Copié" : "Copier la config"}
                  </button>
                  <pre>{`{
  "mcpServers": {
    "envol-africa": {
      "command": "node",
      "args": ["c:/chemin/vers/mcp-server-envolafrica/dist/index.js"],
      "env": {
        "EAM_SITE_URL": "https://envolafrica.site",
        "EAM_AGENT_API_KEY": "eam_live_votre_cle_ici"
      }
    }
  }
}`}</pre>
                </div>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-[#0A1931]">1. Compiler le serveur MCP</div>
                  <div className="text-slate-500 mt-1 font-mono text-[11px]">cd mcp-server-envolafrica && npm install && npm run build</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-[#0A1931]">2. Relancer Claude ou Cursor</div>
                  <div className="text-slate-500 mt-1">Les 8 outils apparaissent automatiquement dans l'interface de discussion.</div>
                </div>
              </div>
            </section>

            {/* Section 3 : Interactive Endpoints Explorer */}
            <section id="endpoints-section" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#0A1931]">Explorateur des Endpoints REST</h2>
                  <p className="text-xs text-slate-500">Testez et intégrez chaque outil dans votre pile technique</p>
                </div>
              </div>

              {/* Endpoint Card */}
              <div id="endpoint-card" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-1 rounded-md ${
                        selectedEndpoint.method === "GET"
                          ? "bg-blue-100 text-blue-800"
                          : selectedEndpoint.method === "POST"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {selectedEndpoint.method}
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-800">{selectedEndpoint.path}</span>
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                    Scope : <code className="font-mono text-[#9e001f]">{selectedEndpoint.scope}</code>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#0A1931]">{selectedEndpoint.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">{selectedEndpoint.description}</p>
                </div>

                {/* Query Parameters */}
                {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Paramètres d'URL (Query Params) :</h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b text-slate-500 font-semibold text-left">
                          <tr>
                            <th className="p-3">Paramètre</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Requis</th>
                            <th className="p-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-slate-700">
                          {selectedEndpoint.params.map((p) => (
                            <tr key={p.name}>
                              <td className="p-3 font-mono font-bold text-[#0A1931]">{p.name}</td>
                              <td className="p-3 font-mono text-slate-500">{p.type}</td>
                              <td className="p-3">{p.required ? <span className="text-red-600 font-bold">Oui</span> : <span className="text-slate-400">Non</span>}</td>
                              <td className="p-3 text-slate-600">{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Request Body (for POST / PUT) */}
                {selectedEndpoint.body && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Corps de la Requête (JSON) :</h4>
                    <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto">
                      <pre>{JSON.stringify(selectedEndpoint.body, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* Code Examples Tabs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Exemple d'Appel :</h4>
                    <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-bold">
                      {(["curl", "typescript", "python"] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setActiveLang(lang)}
                          className={`px-3 py-1 rounded-md transition ${
                            activeLang === lang ? "bg-white text-[#9e001f] shadow-xs" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {lang === "curl" ? "cURL" : lang === "typescript" ? "TypeScript" : "Python"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => copyText(getCodeSnippet(selectedEndpoint, activeLang), "code-snippet")}
                      className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold"
                    >
                      {copiedId === "code-snippet" ? "✓ Copié" : "Copier le code"}
                    </button>
                    <pre>{getCodeSnippet(selectedEndpoint, activeLang)}</pre>
                  </div>
                </div>

                {/* Response Example */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Exemple de Réponse HTTP 200 :</h4>
                  <div className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                    <pre>{JSON.stringify(selectedEndpoint.responseExample, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 : Codes HTTP & Bonnes Pratiques */}
            <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-xl font-black text-[#0A1931] mb-4">Codes de Statut HTTP & Résilience</h2>
              <div className="grid sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-800 text-sm">200 / 201 OK</span>
                  <p className="mt-1 text-emerald-900">Requête exécutée avec succès. L'opération a été enregistrée de manière atomique.</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="font-bold text-amber-800 text-sm">401 Unauthorized</span>
                  <p className="mt-1 text-amber-900">Clé d'API absente, invalide ou révoquée. Vérifiez l'en-tête x-agent-api-key.</p>
                </div>
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                  <span className="font-bold text-red-800 text-sm">403 Forbidden</span>
                  <p className="mt-1 text-red-900">La clé fournie n'a pas les permissions (scopes) suffisantes pour cet endpoint.</p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
