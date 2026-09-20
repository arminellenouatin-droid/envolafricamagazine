# MEMO DE MISSION — AUDIT & REFONTE SEO, GEO, SÉCURITÉ & PERFORMANCE

**Projet** : Envol Africa Magazine (EAM)  
**Domaine canonique** : https://envolafrica.site  
**Date** : 20 Septembre 2026  
**Contrainte absolue** : Zéro modification sur les en-têtes globaux (Header.tsx, HeaderShell.tsx).

---

## 1. Objectif Réel
Garantir une visibilité maximale sur tous les moteurs de recherche traditionnels (Google, Bing, DuckDuckGo, Yandex, Baidu) et les moteurs IA génératifs (ChatGPT, Perplexity, Gemini, Claude, Copilot, Google AI Overviews), tout en verrouillant la sécurité OWASP (élimination de fuite d'empreintes de mots de passe, en-tête HSTS, blocage des routes privées dans robots.txt/meta).

## 2. Périmètre
- Inclus :
  - Étape 1 : Inventaire complet (102 pages + 148 routes API) classé en Publique vs Privée.
  - Étape 2 : Audit technique détaillé (SSR, sitemaps, robots.txt, schema.org, sécurité, GEO).
  - Étape 3 : Corrections exhaustives (Dynamic Sitemaps, SSR Hydration, JSON-LD Schema.org, llms.txt & llms-full.txt, flux RSS /feed.xml, page not-found.tsx, HSTS, nettoyage des hashs admin).
  - Étape 4 : Validation du build (next build, tests de routes).
- Hors Périmètre :
  - Les composants d'en-tête mobile et desktop (Header.tsx, HeaderShell.tsx).
  - Toute modification de modèle de données ou logique métier de paiement Moneroo.

## 3. Décisions Techniques Clés
1. SSR Hydration : Fournir les données initiales (initialMagazine, initialProduct, initialProjet) depuis les Server Components aux Client Components.
2. Dynamic Sitemap (src/app/sitemap.ts) : Génération dynamique des URLs.
3. Robots.txt & GEO : Domaine canonique https://envolafrica.site, déblocage des bots IA pour GEO.
4. Sécurité critique : Assainissement strict de db.users dans src/app/admin/page.tsx.
5. En-têtes HTTP : Ajout de Strict-Transport-Security (HSTS) dans next.config.ts.
