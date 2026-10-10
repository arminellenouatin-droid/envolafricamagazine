# INVENTAIRE TECHNIQUE OFFICIEL — ENVOL AFRICA
## Référence d'Architecture, Sources de Vérité et Cartographie des 216 Routes API
> **Date de production :** 10 Octobre 2026  
> **Conformité :** Phase 0 (Vérité & Hygiène Immédiate) du Prompt Global Antigravity

---

## 1. MATRICE DOMAINE → SOURCE DE VÉRITÉ RÉELLE

| Domaine Métier | Source de Vérité Réelle (Production) | Couches Secondaires / Legacy | Stratégie Phase 2 (P0) |
|---|---|---|---|
| **Authentification & Profils** | **Supabase Auth** (`auth.users`) + table `public.users` | Fallback `db.json` dans `src/lib/db.ts` | **Supprimer définitivement le fallback local** (fail-closed strict). |
| **Magazines & Numéros Kiosque** | **Supabase Postgres** (`public.magazines`) | Fallback `src/lib/core-db.ts` & `db.json` | Supprimer le fallback `db.json` sur la gestion magazine. |
| **Articles Éditoriaux** | **Supabase Postgres** (`public.articles`) | `src/lib/core-db.ts` & `db.json` | Source unique Supabase Postgres. |
| **Marketplace (Produits, Vendeurs)** | **Supabase Postgres** (`marketplace_products`, `marketplace_suppliers`) | Seeds (`marketplace-seed.ts`) | **Retirer les seeds de la production publique**. |
| **Marketplace (Commandes & Devis RFQ)**| **Supabase Postgres** (`marketplace_orders`, `marketplace_conversations`) | Types dans `src/lib/marketplace/` | Source unique Supabase Postgres. |
| **Africa Awards (Compétitions, Votes)** | **Supabase Postgres** (`award_competitions`, `award_candidates`, `award_votes`) | `src/lib/awards-db.ts` | Source unique Supabase Postgres. |
| **Crowdfunding (Projets & Dons)** | **Supabase Postgres** (`crowdfunding_projets`, `crowdfunding_contributions`) | `src/lib/crowdfunding-db.ts` | Source unique Supabase Postgres. |
| **Jobs (Offres & Candidatures)** | **Supabase Postgres** (`jobs_offers`, `jobs_candidates`, `jobs_applications`) | `src/lib/jobs-db.ts` | Source unique Supabase Postgres. |
| **WAB (Posts, Salons, Commentaires)** | **Supabase Postgres** (`wab_posts`, `wab_comments`, `wab_salons`) | `src/lib/wab-db.ts` | Source unique Supabase Postgres. |
| **Financial Core & Wallet** | **Supabase Postgres** (`wallets`, `wallet_transactions`, `orders`, `payments`) | Ledger unifié à centraliser | **1 utilisateur = 1 wallet unique**, transactions atomiques. |
| **Régie Envol Ads** | **Supabase Postgres** (`ads_campaigns`, `ads_impressions`, `ads_clicks`) | Lot 8 déployé | Raccordement direct au Financial Core. |
| **Médias, Vidéos & PDF Protégés** | **Cloudflare R2** (Buckets `envol-public` et `envol-private`) | Stockage local / CDN tiers | URLs signées pour contenus payants / privés. |
| **Analytics & Traçage** | Google Analytics 4 (GA4) | Stockage local session | Soumis au bandeau de consentement strict. |

---

## 2. ROUTES DE COMPATIBILITÉ HISTORIQUES

Les routes suivantes sont déclarées dans `next.config.ts` pour compatibilité ascendante :

| Ancienne Route Rewrite | Destination Nouvelle Route | Utilisée Actuellement ? | Dépendances Externes | Action & Date de Suppression Recommandée |
|---|---|---|---|---|
| `/functions/v1/auth-mfa-enroll` | `/api/auth/2fa` | Historique API v1 | Clients Edge / Anciennes sessions | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/articles-get` | `/api/articles` | Historique Supabase Edge | Apps externes / RSS | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/articles-audio` | `/api/articles` | Historique | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/articles-create` | `/api/admin/articles` | Historique admin | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/articles-publish` | `/api/admin/articles` | Historique admin | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/articles-like` | `/api/comments` | Historique | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/articles-comment` | `/api/comments` | Historique | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/magazine-preview` | `/api/magazines` | Historique Kiosque | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/magazine-download`| `/api/download` | Liens générés anciens | Anciens emails utilisateurs | KEEP temporaire (redirection 301) |
| `/functions/v1/cart-add-item` | `/api/payment/init` | Historique panier | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/cart-get` | `/api/orders` | Historique commandes | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/checkout-create-order`| `/api/payment/init`| Historique checkout | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/webhooks-moneroo` | `/api/webhooks/moneroo`| Historique webhook | Configuration ancienne Moneroo | KEEP (sécurité webhook) |
| `/functions/v1/subscription-subscribe`| `/api/payment/init`| Historique abonnements| Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/donation-create` | `/api/payment/init` | Historique dons | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/affiliate-generate-link`| `/api/affiliate` | Historique affiliation | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/affiliate-dashboard-summary`| `/api/affiliate`| Historique affiliation | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/affiliate-request-payout`| `/api/affiliate/withdraw`| Historique retrait | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/search` | `/api/search` | Historique recherche | Non | DEPRECATE → Suppression fin Phase 2 |
| `/functions/v1/geo-detect` | `/api/search` | Historique geo | Non | DEPRECATE → Suppression fin Phase 2 |
| `/rest/v1/profiles` | `/api/auth/me` | PostgREST direct compat | Non | DEPRECATE → Suppression fin Phase 2 |
| `/rest/v1/articles` | `/api/articles` | PostgREST direct compat | Non | DEPRECATE → Suppression fin Phase 2 |
| `/rest/v1/magazines` | `/api/magazines` | PostgREST direct compat | Non | DEPRECATE → Suppression fin Phase 2 |
| `/rest/v1/orders` | `/api/orders` | PostgREST direct compat | Non | DEPRECATE → Suppression fin Phase 2 |
| `/p/:id` | `/marketplace/produits/:id`| Raccourci URL partage | Réseaux sociaux / Liens partagés | KEEP (301 Permanent) |

---

## 3. DOSSIER PHP LEGACY MONEROO (`moneroo/*.php`)

- **Fichiers :** `docs/archive-legacy-php/moneroo/checkout.php`, `config.php`, `merci.php`, `webhook.php`.
- **Statut vérifié :** **ARCHIVÉ & INACTIF**.
- **Analyse :** Les fichiers PHP historiques sont situés dans le sous-dossier documentaire `docs/archive-legacy-php/`. Ils **ne sont pas exécutés** par l'infrastructure Vercel Next.js.
- **Remplacement :** 100% des paiements Moneroo et des webhooks sont gérés par les handlers TypeScript officiels :
  - Initiation du paiement : `/api/payment/init`
  - Webhook de confirmation : `/api/webhooks/moneroo`
- **Recommandation :** Conserver dans l'archive documentaire `docs/` pour historique d'audit, sans exposition publique.

---

## 4. CLASSIFICATION DU CODE LEGACY, SEEDS ET MOCKS

| Composant / Fichier | Nature | Décision | Action requise |
|---|---|---|---|
| `src/lib/marketplace-seed.ts` | 15 produits & 12 faux fournisseurs | **DELETE DU SITE PUBLIC** / KEEP pour tests | Remplacer par état vide sur le site public. |
| `src/data/db.json` | Fichier JSON local 70 Ko | **DEPRECATE → DELETE** | Retirer tout accès de production en Phase 2. |
| `src/lib/moneroo-payout.ts` (Mock) | Mock de versement Mobile Money | **MIGRATE** | Remplacer par intégration API de payout réelle ou fail-closed. |
| `src/lib/jobs-db.ts` | Fallback local offres & candidatures | **DEPRECATE** | Remplacer par `jobs-supabase.ts` exclusif. |
| `src/lib/crowdfunding-db.ts` | Fallback local projets crowdfunding | **DEPRECATE** | Remplacer par `crowdfunding-supabase.ts` exclusif. |
| `src/lib/awards-db.ts` | Fallback local jury & compétitions | **DEPRECATE** | Remplacer par `awards-supabase.ts` exclusif. |
| `src/lib/wab-db.ts` | Fallback local fil WAB & salons | **DEPRECATE** | Remplacer par `wab-supabase.ts` exclusif. |

---

## 5. CLASSIFICATION DES 216 ROUTES API

Total : **216 routes**
- **Admin :** 30 routes (`admin`)
- **Internal Webhook :** 2 routes (`internal webhook`)
- **Owner-Protected :** 62 routes (`owner`)
- **Authenticated :** 80 routes (`authenticated`)
- **Public :** 42 routes (`public`)
- **Financial (Touchent l'argent) :** 38 routes (`FINANCIAL = TRUE`)

| Route API | Niveau d'Accès | FINANCIAL | Rôle / Description |
|---|---|---|---|
| /api/admin/ads/moderation | admin | false | Gestion de route moderation |
| /api/admin/ads/overview | admin | false | Gestion de route overview |
| /api/admin/ads/reports | admin | false | Gestion de route reports |
| /api/admin/ads/slots | admin | false | Gestion de route slots |
| /api/admin/affiliate/founder | admin | false | Gestion de route founder |
| /api/admin/affiliate/stats | admin | false | Gestion de route stats |
| /api/admin/affiliate/tree | admin | false | Gestion de route tree |
| /api/admin/affiliate/users | admin | false | Gestion de route users |
| /api/admin/affiliate/withdrawals | admin | **TRUE** | Gestion de route withdrawals |
| /api/admin/articles | admin | false | Gestion de route articles |
| /api/admin/commissions/process | admin | **TRUE** | Gestion de route process |
| /api/admin/crowdfunding/projects | admin | false | Gestion de route projects |
| /api/admin/editorial | admin | false | Gestion de route editorial |
| /api/admin/kpis | admin | false | Gestion de route kpis |
| /api/admin/kyc | admin | false | Gestion de route kyc |
| /api/admin/magazine-categories | admin | false | Gestion de route magazine-categories |
| /api/admin/magazine-landing | admin | false | Gestion de route magazine-landing |
| /api/admin/magazines/protect-pdfs | admin | false | Gestion de route protect-pdfs |
| /api/admin/magazines | admin | false | Gestion de route magazines |
| /api/admin/marketplace | admin | false | Gestion de route marketplace |
| /api/admin/marketplace-commissions/process | admin | **TRUE** | Gestion de route process |
| /api/admin/migrations/rls | admin | false | Gestion de route rls |
| /api/admin/orders | admin | **TRUE** | Gestion de route orders |
| /api/admin/push/test | admin | false | Gestion de route test |
| /api/admin/salons | admin | false | Gestion de route salons |
| /api/admin/settings | admin | false | Gestion de route settings |
| /api/admin/storage/cleanup | admin | false | Gestion de route cleanup |
| /api/admin/storage/stats | admin | false | Gestion de route stats |
| /api/admin/subscription-plans | admin | **TRUE** | Gestion de route subscription-plans |
| /api/admin/users | admin | false | Gestion de route users |
| /api/ads/campaigns | owner | false | Gestion de route campaigns |
| /api/ads/campaigns/[id] | owner | false | Gestion de route [id] |
| /api/affiliate/activate | owner | false | Gestion de route activate |
| /api/affiliate/me/earnings | owner | false | Gestion de route earnings |
| /api/affiliate/me/network | owner | false | Gestion de route network |
| /api/affiliate/me | owner | false | Gestion de route me |
| /api/affiliate/register | authenticated | false | Gestion de route register |
| /api/affiliate | owner | false | Gestion de route affiliate |
| /api/affiliate/withdraw | owner | **TRUE** | Gestion de route withdraw |
| /api/articles | public | false | Gestion de route articles |
| /api/articles/[slug]/engagement | authenticated | false | Gestion de route engagement |
| /api/articles/[slug] | public | false | Gestion de route [slug] |
| /api/auth/2fa | authenticated | false | Gestion de route 2fa |
| /api/auth/2fa/verify-login | public | false | Gestion de route verify-login |
| /api/auth/google-one-tap | public | false | Gestion de route google-one-tap |
| /api/auth/login | public | false | Gestion de route login |
| /api/auth/logout | public | false | Gestion de route logout |
| /api/auth/me | authenticated | false | Gestion de route me |
| /api/auth/oauth/callback | public | false | Gestion de route callback |
| /api/auth/oauth/session | public | false | Gestion de route session |
| /api/auth/password | authenticated | false | Gestion de route password |
| /api/auth/register | public | false | Gestion de route register |
| /api/auth/verify-email | public | false | Gestion de route verify-email |
| /api/awards/affiliate-links | owner | false | Gestion de route affiliate-links |
| /api/awards/applications | owner | false | Gestion de route applications |
| /api/awards/candidates | authenticated | false | Gestion de route candidates |
| /api/awards/competitions | authenticated | false | Gestion de route competitions |
| /api/awards/gifts | public | false | Gestion de route gifts |
| /api/awards/jury-scores | authenticated | false | Gestion de route jury-scores |
| /api/awards/live/moderate | owner | false | Gestion de route moderate |
| /api/awards/live | owner | false | Gestion de route live |
| /api/awards/payments/init | authenticated | **TRUE** | Gestion de route init |
| /api/awards/rankings | authenticated | false | Gestion de route rankings |
| /api/awards/requests | authenticated | false | Gestion de route requests |
| /api/awards/votes | authenticated | false | Gestion de route votes |
| /api/comments | owner | false | Gestion de route comments |
| /api/crowdfunding/advisory-plans | public | false | Gestion de route advisory-plans |
| /api/crowdfunding/boosts | owner | **TRUE** | Gestion de route boosts |
| /api/crowdfunding/contributions | authenticated | **TRUE** | Gestion de route contributions |
| /api/crowdfunding/documents | owner | false | Gestion de route documents |
| /api/crowdfunding/messages/call | authenticated | false | Gestion de route call |
| /api/crowdfunding/messages/kick | authenticated | false | Gestion de route kick |
| /api/crowdfunding/messages/pin | authenticated | false | Gestion de route pin |
| /api/crowdfunding/messages/report | authenticated | false | Gestion de route report |
| /api/crowdfunding/messages | authenticated | false | Gestion de route messages |
| /api/crowdfunding/messages/settings | authenticated | false | Gestion de route settings |
| /api/crowdfunding/messages/spaces | authenticated | false | Gestion de route spaces |
| /api/crowdfunding/messages/upload | authenticated | false | Gestion de route upload |
| /api/crowdfunding/payments | owner | **TRUE** | Gestion de route payments |
| /api/crowdfunding/payouts | authenticated | **TRUE** | Gestion de route payouts |
| /api/crowdfunding/projects | authenticated | false | Gestion de route projects |
| /api/crowdfunding/repayments | authenticated | **TRUE** | Gestion de route repayments |
| /api/crowdfunding/reports | authenticated | false | Gestion de route reports |
| /api/crowdfunding/stats | public | false | Gestion de route stats |
| /api/dons | owner | **TRUE** | Gestion de route dons |
| /api/download/[token] | public | false | Gestion de route [token] |
| /api/ev/c/[token] | public | false | Gestion de route [token] |
| /api/ev/i | public | false | Gestion de route i |
| /api/ev/r | authenticated | false | Gestion de route r |
| /api/ev/s | public | false | Gestion de route s |
| /api/favorites | authenticated | false | Gestion de route favorites |
| /api/geo | public | false | Gestion de route geo |
| /api/jobs/admin | authenticated | false | Gestion de route admin |
| /api/jobs/applications | authenticated | false | Gestion de route applications |
| /api/jobs/boosts | owner | **TRUE** | Gestion de route boosts |
| /api/jobs/boosts/[boostId]/verify | authenticated | **TRUE** | Gestion de route verify |
| /api/jobs/candidates | authenticated | false | Gestion de route candidates |
| /api/jobs/cv | authenticated | false | Gestion de route cv |
| /api/jobs/events | authenticated | false | Gestion de route events |
| /api/jobs/messages/block | authenticated | false | Gestion de route block |
| /api/jobs/messages/call | authenticated | false | Gestion de route call |
| /api/jobs/messages/contacts | authenticated | false | Gestion de route contacts |
| /api/jobs/messages/conversations | authenticated | false | Gestion de route conversations |
| /api/jobs/messages/interact | authenticated | false | Gestion de route interact |
| /api/jobs/messages/report | authenticated | false | Gestion de route report |
| /api/jobs/messages | authenticated | false | Gestion de route messages |
| /api/jobs/messages/upload | authenticated | false | Gestion de route upload |
| /api/jobs/notifications | authenticated | false | Gestion de route notifications |
| /api/jobs | authenticated | false | Gestion de route jobs |
| /api/jobs/subscriptions | owner | **TRUE** | Gestion de route subscriptions |
| /api/jobs/subscriptions/[subscriptionId]/verify | authenticated | **TRUE** | Gestion de route verify |
| /api/jobs/unlocks | owner | false | Gestion de route unlocks |
| /api/jobs/unlocks/[unlockId]/verify | authenticated | false | Gestion de route verify |
| /api/jobs/upload | authenticated | false | Gestion de route upload |
| /api/jobs/views | authenticated | false | Gestion de route views |
| /api/kit-media | authenticated | false | Gestion de route kit-media |
| /api/kyc | authenticated | false | Gestion de route kyc |
| /api/live/agora/participants | public | false | Gestion de route participants |
| /api/live/agora/session | public | false | Gestion de route session |
| /api/live/agora/token | public | false | Gestion de route token |
| /api/live/agora/webhook | public | false | Gestion de route webhook |
| /api/locale/rates | public | false | Gestion de route rates |
| /api/magazine-landing | public | false | Gestion de route magazine-landing |
| /api/magazines | public | false | Gestion de route magazines |
| /api/magazines/[id]/preview | public | false | Gestion de route preview |
| /api/marketplace/analytics | owner | false | Gestion de route analytics |
| /api/marketplace/boosts | owner | **TRUE** | Gestion de route boosts |
| /api/marketplace/certification | owner | false | Gestion de route certification |
| /api/marketplace/download/[token] | authenticated | false | Gestion de route [token] |
| /api/marketplace/downloads | authenticated | false | Gestion de route downloads |
| /api/marketplace/installments | authenticated | **TRUE** | Gestion de route installments |
| /api/marketplace/messages/calls | owner | false | Gestion de route calls |
| /api/marketplace/messages/conversations | authenticated | false | Gestion de route conversations |
| /api/marketplace/messages/disputes | authenticated | false | Gestion de route disputes |
| /api/marketplace/messages/order | owner | **TRUE** | Gestion de route order |
| /api/marketplace/messages/quick-replies | owner | false | Gestion de route quick-replies |
| /api/marketplace/messages | owner | false | Gestion de route messages |
| /api/marketplace/messages/upload | authenticated | false | Gestion de route upload |
| /api/marketplace/orders | owner | **TRUE** | Gestion de route orders |
| /api/marketplace/products/digital/upload | owner | false | Gestion de route upload |
| /api/marketplace/products | owner | false | Gestion de route products |
| /api/marketplace/products/video | owner | false | Gestion de route video |
| /api/marketplace/products/video/upload | owner | false | Gestion de route upload |
| /api/marketplace/suppliers | owner | false | Gestion de route suppliers |
| /api/marketplace/video-subscription | owner | **TRUE** | Gestion de route video-subscription |
| /api/mcp | public | false | Gestion de route mcp |
| /api/messages/call | authenticated | false | Gestion de route call |
| /api/messages/contacts | owner | false | Gestion de route contacts |
| /api/messages | authenticated | false | Gestion de route messages |
| /api/newsletter | public | false | Gestion de route newsletter |
| /api/notifications | authenticated | false | Gestion de route notifications |
| /api/notifications/subscribe | authenticated | false | Gestion de route subscribe |
| /api/orders | authenticated | **TRUE** | Gestion de route orders |
| /api/payment/init | authenticated | **TRUE** | Gestion de route init |
| /api/payment/methods | public | **TRUE** | Gestion de route methods |
| /api/payment/verify | public | **TRUE** | Gestion de route verify |
| /api/profile/avatar | owner | false | Gestion de route avatar |
| /api/profile/preferences | public | false | Gestion de route preferences |
| /api/publicite | authenticated | false | Gestion de route publicite |
| /api/search | public | false | Gestion de route search |
| /api/service | public | false | Gestion de route service |
| /api/storage/confirm | owner | false | Gestion de route confirm |
| /api/storage/presign | owner | false | Gestion de route presign |
| /api/storage/url | authenticated | false | Gestion de route url |
| /api/storage/[id] | owner | false | Gestion de route [id] |
| /api/subscription-plans | public | **TRUE** | Gestion de route subscription-plans |
| /api/upload | public | false | Gestion de route upload |
| /api/upload/signed | public | false | Gestion de route signed |
| /api/wab/admin | authenticated | false | Gestion de route admin |
| /api/wab/boosts | owner | **TRUE** | Gestion de route boosts |
| /api/wab/boosts/[id]/verify | authenticated | **TRUE** | Gestion de route verify |
| /api/wab/coins | owner | **TRUE** | Gestion de route coins |
| /api/wab/connections | owner | false | Gestion de route connections |
| /api/wab/creator/wallet | authenticated | **TRUE** | Gestion de route wallet |
| /api/wab/discovery | authenticated | false | Gestion de route discovery |
| /api/wab/groups | owner | false | Gestion de route groups |
| /api/wab/groups/[id]/join | authenticated | false | Gestion de route join |
| /api/wab/groups/[id] | owner | false | Gestion de route [id] |
| /api/wab/media/preview | public | false | Gestion de route preview |
| /api/wab/media | public | false | Gestion de route media |
| /api/wab/media-interactions | owner | false | Gestion de route media-interactions |
| /api/wab/messages | owner | false | Gestion de route messages |
| /api/wab/messages/[id] | authenticated | false | Gestion de route [id] |
| /api/wab/notifications | owner | false | Gestion de route notifications |
| /api/wab/pages | owner | false | Gestion de route pages |
| /api/wab/pages/[id]/follow | owner | false | Gestion de route follow |
| /api/wab/pages/[id] | public | false | Gestion de route [id] |
| /api/wab/posts | owner | false | Gestion de route posts |
| /api/wab/posts/[id]/comments | owner | false | Gestion de route comments |
| /api/wab/posts/[id]/reaction | owner | false | Gestion de route reaction |
| /api/wab/posts/[id] | owner | false | Gestion de route [id] |
| /api/wab/posts/[id]/share | public | false | Gestion de route share |
| /api/wab/posts/[id]/view | authenticated | false | Gestion de route view |
| /api/wab/profile | owner | false | Gestion de route profile |
| /api/wab/reels | authenticated | false | Gestion de route reels |
| /api/wab/reels/[id]/view | authenticated | false | Gestion de route view |
| /api/wab/reports | authenticated | false | Gestion de route reports |
| /api/wab/rewards | authenticated | **TRUE** | Gestion de route rewards |
| /api/wab/salons | owner | false | Gestion de route salons |
| /api/wab/salons/[id]/join | authenticated | false | Gestion de route join |
| /api/wab/salons/[id]/messages | owner | false | Gestion de route messages |
| /api/wab/salons/[id]/products | owner | false | Gestion de route products |
| /api/wab/salons/[id]/reports | authenticated | false | Gestion de route reports |
| /api/wab/salons/[id] | owner | false | Gestion de route [id] |
| /api/wab/salons/[id]/stage | owner | false | Gestion de route stage |
| /api/wab/search | public | false | Gestion de route search |
| /api/wab/stories | owner | false | Gestion de route stories |
| /api/wab/stories/[id]/view | authenticated | false | Gestion de route view |
| /api/wab/subscription | owner | **TRUE** | Gestion de route subscription |
| /api/wab/upload | authenticated | false | Gestion de route upload |
| /api/wallet/deposit | owner | **TRUE** | Gestion de route deposit |
| /api/wallet | authenticated | **TRUE** | Gestion de route wallet |
| /api/wallet/withdraw | authenticated | **TRUE** | Gestion de route withdraw |
| /api/weather | public | false | Gestion de route weather |
| /api/webhooks/chariow-pulse | internal webhook | **TRUE** | Gestion de route chariow-pulse |
| /api/webhooks/moneroo | internal webhook | **TRUE** | Gestion de route moneroo |
