# CARTOGRAPHIE EXHAUSTIVE DE L'ÉCOSYSTÈME ENVOL AFRICA
**Plateforme :** Envol Africa (Magazine, Kiosque, Marketplace, Jobs, Crowdfunding, Africa Awards, WAB, Affiliation, Régie Pub, Wallet)  
**URL de production :** `https://www.envolafrica.site` (Vercel : `envolafricamagazinema`)  
**Projet Supabase :** `rtfjwpytiuvoekomevpu`  
**Date d'inventaire :** 08 Novembre 2026 (Phase 0 du Contrôle Final)  
**Total des routes recensées :** 121 pages frontend | 220 routes API backend | 200 tables PostgreSQL | 66 migrations SQL | 60 variables d'environnement  

---

## 1. CARTOGRAPHIE DES ROUTES FRONTEND (PAGES : 121)

### 1.1 Pages Publiques & Portails Institutionnels (27 pages)
| Route | Rôle & Volet | Accès |
|---|---|---|
| `/` | Portail public / Découverte | Visiteur public |
| `/a-propos` | Portail public / Découverte | Visiteur public |
| `/abonnement` | Portail public / Découverte | Visiteur public |
| `/article/[slug]` | Portail public / Découverte | Visiteur public |
| `/b/[code]` | Portail public / Découverte | Visiteur public |
| `/compte` | Portail public / Découverte | Visiteur public |
| `/compte/abonnement` | Portail public / Découverte | Visiteur public |
| `/compte/achats` | Portail public / Découverte | Visiteur public |
| `/compte/dons` | Portail public / Découverte | Visiteur public |
| `/compte/favoris` | Portail public / Découverte | Visiteur public |
| `/compte/kyc` | Portail public / Découverte | Visiteur public |
| `/compte/parametres` | Portail public / Découverte | Visiteur public |
| `/compte/parrainage` | Portail public / Découverte | Visiteur public |
| `/compte/wallet` | Portail public / Découverte | Visiteur public |
| `/conditions` | Portail public / Découverte | Visiteur public |
| `/contact` | Portail public / Découverte | Visiteur public |
| `/don` | Portail public / Découverte | Visiteur public |
| `/faq` | Portail public / Découverte | Visiteur public |
| `/lecteur-document` | Portail public / Découverte | Visiteur public |
| `/moneroo/merci` | Portail public / Découverte | Visiteur public |
| `/navigateur` | Portail public / Découverte | Visiteur public |
| `/publicite` | Portail public / Découverte | Visiteur public |
| `/publicite/espace` | Portail public / Découverte | Visiteur public |
| `/publicite/politique` | Portail public / Découverte | Visiteur public |
| `/recherche` | Portail public / Découverte | Visiteur public |
| `/salons` | Portail public / Découverte | Visiteur public |
| `/service` | Portail public / Découverte | Visiteur public |

### 1.2 Magazine & Kiosque (2 pages)
| Route | Rôle & Volet | Accès |
|---|---|---|
| `/kiosque` | Kiosque, Liseuse Flipbook, Paywall page 8 | Public & Abonné |
| `/kiosque/[id]` | Kiosque, Liseuse Flipbook, Paywall page 8 | Public & Abonné |

### 1.3 Marketplace (10 pages)
| Route | Rôle & Volet | Accès |
|---|---|---|
| `/marketplace` | Catalogue, Boutiques, Produits, Panier, Commandes | Public & Acheteur / Vendeur |
| `/marketplace/admin` | Catalogue, Boutiques, Produits, Panier, Commandes | Public & Acheteur / Vendeur |
| `/marketplace/boutique` | Catalogue, Boutiques, Produits, Panier, Commandes | Public & Acheteur / Vendeur |
| `/marketplace/boutique/[slug]` | Catalogue, Boutiques, Produits, Panier, Commandes | Public & Acheteur / Vendeur |
| `/marketplace/boutique/[vendor]/[slug]` | Catalogue, Boutiques, Produits, Panier, Commandes | Public & Acheteur / Vendeur |
| `/marketplace/commandes` | Catalogue, Boutiques, Produits, Panier, Commandes | Public & Acheteur / Vendeur |
| `/marketplace/messages` | Catalogue, Boutiques, Produits, Panier, Commandes | Public & Acheteur / Vendeur |
| `/marketplace/produits/[id]` | Catalogue, Boutiques, Produits, Panier, Commandes | Public & Acheteur / Vendeur |
| `/marketplace/vendre` | Catalogue, Boutiques, Produits, Panier, Commandes | Public & Acheteur / Vendeur |
| `/panier` | Catalogue, Boutiques, Produits, Panier, Commandes | Public & Acheteur / Vendeur |

### 1.4 Emploi & Opportunités (12 pages)
| Route | Rôle & Volet | Accès |
|---|---|---|
| `/emploi` | Offres d'emploi, Demandes, Candidatures, Recruteurs | Public & Demandeur / Recruteur |
| `/emploi/abonnements` | Offres d'emploi, Demandes, Candidatures, Recruteurs | Public & Demandeur / Recruteur |
| `/emploi/admin` | Offres d'emploi, Demandes, Candidatures, Recruteurs | Public & Demandeur / Recruteur |
| `/emploi/candidats` | Offres d'emploi, Demandes, Candidatures, Recruteurs | Public & Demandeur / Recruteur |
| `/emploi/dashboard` | Offres d'emploi, Demandes, Candidatures, Recruteurs | Public & Demandeur / Recruteur |
| `/emploi/dashboard/offres/[id]/candidatures` | Offres d'emploi, Demandes, Candidatures, Recruteurs | Public & Demandeur / Recruteur |
| `/emploi/messages` | Offres d'emploi, Demandes, Candidatures, Recruteurs | Public & Demandeur / Recruteur |
| `/emploi/offres` | Offres d'emploi, Demandes, Candidatures, Recruteurs | Public & Demandeur / Recruteur |
| `/emploi/offres/[id]` | Offres d'emploi, Demandes, Candidatures, Recruteurs | Public & Demandeur / Recruteur |
| `/emploi/offres/[id]/decrypter` | Offres d'emploi, Demandes, Candidatures, Recruteurs | Public & Demandeur / Recruteur |
| `/emploi/publier-candidature` | Offres d'emploi, Demandes, Candidatures, Recruteurs | Public & Demandeur / Recruteur |
| `/emploi/publier-offre` | Offres d'emploi, Demandes, Candidatures, Recruteurs | Public & Demandeur / Recruteur |

### 1.5 Crowdfunding & Financement (7 pages)
| Route | Rôle & Volet | Accès |
|---|---|---|
| `/crowdfunding` | Campagnes, Projets, Dons, Participations, Prêts | Public & Porteur / Donateur |
| `/financement` | Campagnes, Projets, Dons, Participations, Prêts | Public & Porteur / Donateur |
| `/financement/dashboard` | Campagnes, Projets, Dons, Participations, Prêts | Public & Porteur / Donateur |
| `/financement/dashboard/investisseur` | Campagnes, Projets, Dons, Participations, Prêts | Public & Porteur / Donateur |
| `/financement/dashboard/porteur` | Campagnes, Projets, Dons, Participations, Prêts | Public & Porteur / Donateur |
| `/financement/messages` | Campagnes, Projets, Dons, Participations, Prêts | Public & Porteur / Donateur |
| `/financement/projets/[id]` | Campagnes, Projets, Dons, Participations, Prêts | Public & Porteur / Donateur |

### 1.6 Africa Awards (28 pages)
| Route | Rôle & Volet | Accès |
|---|---|---|
| `/africa-awards` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/about` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/affiliate` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/apply/[competitionSlug]` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/candidate/dashboard` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/candidate/live/[id]` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/candidates/[id]` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/competitions` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/competitions/[slug]` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/competitions/[slug]/live` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/competitions/[slug]/moderate` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/competitions/[slug]/results` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/gallery` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/help` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/host/dashboard/live/[id]` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/jury/dashboard/scoring/[competitionId]` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/messages` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/my-votes` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/organizer/dashboard/competitions/[id]` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/organizer/dashboard/requests` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/organizer/dashboard/requests/new` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/partners` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/press` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/privacy` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/rankings` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/search` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/terms` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |
| `/africa-awards/vote/[candidateId]` | Compétitions, Candidatures, Votes payants, Lives Agora | Public, Candidat, Jury, Animateur |

### 1.7 WAB – World Africa Business (13 pages)
| Route | Rôle & Volet | Accès |
|---|---|---|
| `/wab` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |
| `/wab/admin` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |
| `/wab/campagnes` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |
| `/wab/createur` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |
| `/wab/groupes/[id]` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |
| `/wab/messages` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |
| `/wab/notifications` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |
| `/wab/pages/[id]` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |
| `/wab/posts/[id]` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |
| `/wab/profil` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |
| `/wab/recherche` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |
| `/wab/salons` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |
| `/wab/salons/[id]` | Fil pro, Profils, Salons/Lives, Espace Créateur, Statuts | Public & Membre / Créateur |

### 1.8 Affiliation & MLM (1 pages)
| Route | Rôle & Volet | Accès |
|---|---|---|
| `/affiliation` | Portail Affilié, Arbre 5x5, Commissions globales | Affilié authentifié |

### 1.9 Authentification & Compte (8 pages)
| Route | Rôle & Volet | Accès |
|---|---|---|
| `/2fa` | Auth / Espace utilisateur / Paramètres | Visiteur / Utilisateur connecté |
| `/auth/callback` | Auth / Espace utilisateur / Paramètres | Visiteur / Utilisateur connecté |
| `/auth/login` | Auth / Espace utilisateur / Paramètres | Visiteur / Utilisateur connecté |
| `/auth/register` | Auth / Espace utilisateur / Paramètres | Visiteur / Utilisateur connecté |
| `/auth/reset` | Auth / Espace utilisateur / Paramètres | Visiteur / Utilisateur connecté |
| `/auth/verify-email` | Auth / Espace utilisateur / Paramètres | Visiteur / Utilisateur connecté |
| `/messages` | Auth / Espace utilisateur / Paramètres | Visiteur / Utilisateur connecté |
| `/notifications` | Auth / Espace utilisateur / Paramètres | Visiteur / Utilisateur connecté |

### 1.10 Pages Administratives & Back-Office (10 pages)
| Route | Rôle & Volet | Accès |
|---|---|---|
| `/admin` | Back-Office Admin, Modération, KPIs, Finances | Administrateur (Strict eam_token / cookie) |
| `/admin/crowdfunding` | Back-Office Admin, Modération, KPIs, Finances | Administrateur (Strict eam_token / cookie) |
| `/admin/publicite` | Back-Office Admin, Modération, KPIs, Finances | Administrateur (Strict eam_token / cookie) |
| `/africa-awards/admin/dashboard` | Back-Office Admin, Modération, KPIs, Finances | Administrateur (Strict eam_token / cookie) |
| `/africa-awards/admin/dashboard/applications` | Back-Office Admin, Modération, KPIs, Finances | Administrateur (Strict eam_token / cookie) |
| `/africa-awards/admin/dashboard/competitions` | Back-Office Admin, Modération, KPIs, Finances | Administrateur (Strict eam_token / cookie) |
| `/africa-awards/admin/dashboard/competitions/[id]` | Back-Office Admin, Modération, KPIs, Finances | Administrateur (Strict eam_token / cookie) |
| `/africa-awards/admin/dashboard/competitions/new` | Back-Office Admin, Modération, KPIs, Finances | Administrateur (Strict eam_token / cookie) |
| `/africa-awards/admin/dashboard/requests` | Back-Office Admin, Modération, KPIs, Finances | Administrateur (Strict eam_token / cookie) |
| `/africa-awards/admin/dashboard/sponsors` | Back-Office Admin, Modération, KPIs, Finances | Administrateur (Strict eam_token / cookie) |

### 1.11 Pages Légales & Conformité (3 pages)
| Route | Rôle & Volet | Accès |
|---|---|---|
| `/cookies` | CGU, CGV, Confidentialité, Mentions légales | Tout public |
| `/mentions-legales` | CGU, CGV, Confidentialité, Mentions légales | Tout public |
| `/politique-de-confidentialite` | CGU, CGV, Confidentialité, Mentions légales | Tout public |

---

## 2. CARTOGRAPHIE DES ROUTES API (220 endpoints)

### 2.1 Authentification, Sessions & 2FA (12 endpoints)
- `/api/auth/2fa`
- `/api/auth/2fa/verify-login`
- `/api/auth/google-one-tap`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/oauth/callback`
- `/api/auth/oauth/session`
- `/api/auth/password`
- `/api/auth/register`
- `/api/auth/verify-email`
- `/api/live/agora/session`

### 2.2 Paiements, Webhooks & Sécurité Financière (9 endpoints)
- `/api/awards/payments/init`
- `/api/crowdfunding/payments`
- `/api/crowdfunding/repayments`
- `/api/live/agora/webhook`
- `/api/payment/init`
- `/api/payment/methods`
- `/api/payment/verify`
- `/api/webhooks/chariow-pulse`
- `/api/webhooks/moneroo`

### 2.3 Portefeuille (Wallet), Commissions & Retraits (4 endpoints)
- `/api/wab/creator/wallet`
- `/api/wallet`
- `/api/wallet/deposit`
- `/api/wallet/withdraw`

### 2.4 Magazine & Kiosque (6 endpoints)
- `/api/articles`
- `/api/articles/[slug]`
- `/api/articles/[slug]/engagement`
- `/api/magazine-landing`
- `/api/magazines`
- `/api/magazines/[id]/preview`

### 2.5 Marketplace (21 endpoints)
- `/api/marketplace/analytics`
- `/api/marketplace/boosts`
- `/api/marketplace/certification`
- `/api/marketplace/download/[token]`
- `/api/marketplace/downloads`
- `/api/marketplace/installments`
- `/api/marketplace/messages`
- `/api/marketplace/messages/calls`
- `/api/marketplace/messages/conversations`
- `/api/marketplace/messages/disputes`
- `/api/marketplace/messages/order`
- `/api/marketplace/messages/quick-replies`
- `/api/marketplace/messages/upload`
- `/api/marketplace/orders`
- `/api/marketplace/products`
- `/api/marketplace/products/digital/upload`
- `/api/marketplace/products/video`
- `/api/marketplace/products/video/upload`
- `/api/marketplace/suppliers`
- `/api/marketplace/video-subscription`
- `/api/orders`

### 2.6 WAB – World Africa Business (41 endpoints)
- `/api/wab/admin`
- `/api/wab/boosts`
- `/api/wab/boosts/[id]/verify`
- `/api/wab/coins`
- `/api/wab/connections`
- `/api/wab/discovery`
- `/api/wab/groups`
- `/api/wab/groups/[id]`
- `/api/wab/groups/[id]/join`
- `/api/wab/media`
- `/api/wab/media-interactions`
- `/api/wab/media/preview`
- `/api/wab/messages`
- `/api/wab/messages/[id]`
- `/api/wab/notifications`
- `/api/wab/pages`
- `/api/wab/pages/[id]`
- `/api/wab/pages/[id]/follow`
- `/api/wab/posts`
- `/api/wab/posts/[id]`
- `/api/wab/posts/[id]/comments`
- `/api/wab/posts/[id]/reaction`
- `/api/wab/posts/[id]/share`
- `/api/wab/posts/[id]/view`
- `/api/wab/profile`
- `/api/wab/reels`
- `/api/wab/reels/[id]/view`
- `/api/wab/reports`
- `/api/wab/rewards`
- `/api/wab/salons`
- `/api/wab/salons/[id]`
- `/api/wab/salons/[id]/join`
- `/api/wab/salons/[id]/messages`
- `/api/wab/salons/[id]/products`
- `/api/wab/salons/[id]/reports`
- `/api/wab/salons/[id]/stage`
- `/api/wab/search`
- `/api/wab/stories`
- `/api/wab/stories/[id]/view`
- `/api/wab/subscription`
- `/api/wab/upload`

### 2.7 Africa Awards (11 endpoints)
- `/api/awards/affiliate-links`
- `/api/awards/applications`
- `/api/awards/candidates`
- `/api/awards/competitions`
- `/api/awards/gifts`
- `/api/awards/jury-scores`
- `/api/awards/live`
- `/api/awards/live/moderate`
- `/api/awards/rankings`
- `/api/awards/requests`
- `/api/awards/votes`

### 2.8 Emploi & Opportunités (23 endpoints)
- `/api/jobs`
- `/api/jobs/admin`
- `/api/jobs/applications`
- `/api/jobs/boosts`
- `/api/jobs/boosts/[boostId]/verify`
- `/api/jobs/candidates`
- `/api/jobs/cv`
- `/api/jobs/events`
- `/api/jobs/messages`
- `/api/jobs/messages/block`
- `/api/jobs/messages/call`
- `/api/jobs/messages/contacts`
- `/api/jobs/messages/conversations`
- `/api/jobs/messages/interact`
- `/api/jobs/messages/report`
- `/api/jobs/messages/upload`
- `/api/jobs/notifications`
- `/api/jobs/subscriptions`
- `/api/jobs/subscriptions/[subscriptionId]/verify`
- `/api/jobs/unlocks`
- `/api/jobs/unlocks/[unlockId]/verify`
- `/api/jobs/upload`
- `/api/jobs/views`

### 2.9 Crowdfunding & Financement (16 endpoints)
- `/api/crowdfunding/advisory-plans`
- `/api/crowdfunding/boosts`
- `/api/crowdfunding/contributions`
- `/api/crowdfunding/documents`
- `/api/crowdfunding/messages`
- `/api/crowdfunding/messages/call`
- `/api/crowdfunding/messages/kick`
- `/api/crowdfunding/messages/pin`
- `/api/crowdfunding/messages/report`
- `/api/crowdfunding/messages/settings`
- `/api/crowdfunding/messages/spaces`
- `/api/crowdfunding/messages/upload`
- `/api/crowdfunding/payouts`
- `/api/crowdfunding/projects`
- `/api/crowdfunding/reports`
- `/api/crowdfunding/stats`

### 2.10 Affiliation & MLM (7 endpoints)
- `/api/affiliate`
- `/api/affiliate/activate`
- `/api/affiliate/me`
- `/api/affiliate/me/earnings`
- `/api/affiliate/me/network`
- `/api/affiliate/register`
- `/api/affiliate/withdraw`

### 2.11 Régie Publicitaire & Ads (4 endpoints)
- `/ads.txt`
- `/api/ads/campaigns`
- `/api/ads/campaigns/[id]`
- `/api/publicite`

### 2.12 Stockage & Uploads Cloudflare R2 / Supabase (6 endpoints)
- `/api/storage/[id]`
- `/api/storage/confirm`
- `/api/storage/presign`
- `/api/storage/url`
- `/api/upload`
- `/api/upload/signed`

### 2.13 Administration (30 endpoints)
- `/api/admin/ads/moderation`
- `/api/admin/ads/overview`
- `/api/admin/ads/reports`
- `/api/admin/ads/slots`
- `/api/admin/affiliate/founder`
- `/api/admin/affiliate/stats`
- `/api/admin/affiliate/tree`
- `/api/admin/affiliate/users`
- `/api/admin/affiliate/withdrawals`
- `/api/admin/articles`
- `/api/admin/commissions/process`
- `/api/admin/crowdfunding/projects`
- `/api/admin/editorial`
- `/api/admin/kpis`
- `/api/admin/kyc`
- `/api/admin/magazine-categories`
- `/api/admin/magazine-landing`
- `/api/admin/magazines`
- `/api/admin/magazines/protect-pdfs`
- `/api/admin/marketplace`
- `/api/admin/marketplace-commissions/process`
- `/api/admin/migrations/rls`
- `/api/admin/orders`
- `/api/admin/push/test`
- `/api/admin/salons`
- `/api/admin/settings`
- `/api/admin/storage/cleanup`
- `/api/admin/storage/stats`
- `/api/admin/subscription-plans`
- `/api/admin/users`

### 2.14 Autres Services & Utilitaires (30 endpoints)
- `/api/comments`
- `/api/dons`
- `/api/download/[token]`
- `/api/ev/c/[token]`
- `/api/ev/i`
- `/api/ev/r`
- `/api/ev/s`
- `/api/favorites`
- `/api/geo`
- `/api/kit-media`
- `/api/kyc`
- `/api/live/agora/participants`
- `/api/live/agora/token`
- `/api/locale/rates`
- `/api/mcp`
- `/api/messages`
- `/api/messages/call`
- `/api/messages/contacts`
- `/api/newsletter`
- `/api/notifications`
- `/api/notifications/subscribe`
- `/api/og/share`
- `/api/og/wab-post`
- `/api/profile/avatar`
- `/api/profile/preferences`
- `/api/search`
- `/api/service`
- `/api/subscription-plans`
- `/api/weather`
- `/feed.xml`

---

## 3. INVENTAIRE DES TABLES DE BASE DE DONNÉES SUPABASE (200 tables)

> **Projet :** `rtfjwpytiuvoekomevpu` (Schéma `public`)  
> **Migrations versionnées :** 66 fichiers dans `supabase/migrations/`

### Répartition par domaine métier :
1. **Identité, Profils & Auth :** `profiles`, `users`, `roles`, `user_roles`, `sessions`, `login_challenges`, `two_factor_auth`, `user_devices`, `notifications`, `push_subscriptions`.
2. **Magazine & Kiosque :** `magazines`, `magazine_categories`, `magazine_landing_blocks`, `magazine_views`, `magazine_reads`, `magazine_downloads`, `magazine_purchases`, `articles`, `article_categories`, `article_comments`, `article_likes`, `article_reads`, `article_audio`, `subscriptions`.
3. **Marketplace :** `products`, `product_categories`, `product_images`, `product_variants`, `product_reviews`, `orders`, `order_items`, `cart_items`, `shops`, `seller_profiles`, `seller_verifications`, `marketplace_messages`, `marketplace_conversations`, `disputes`.
4. **Africa Awards :** `competitions`, `competition_categories`, `candidates`, `candidate_applications`, `votes`, `vote_transactions`, `awards_prizes`, `awards_sponsors`, `awards_jury`, `live_events`, `live_participants`, `live_messages`, `live_gifts`.
5. **WAB (World Africa Business) :** `wab_posts`, `wab_post_media`, `wab_post_likes`, `wab_comments`, `wab_comment_likes`, `wab_shares`, `wab_stories`, `wab_pages`, `wab_page_followers`, `wab_connections`, `wab_followers`, `wab_messages`, `wab_conversations`, `wab_creator_profiles`, `wab_creator_earnings`, `wab_salons`, `wab_salon_participants`, `wab_boosts`.
6. **Emploi (Jobs) :** `job_offers`, `job_applications`, `job_demands`, `job_profiles`, `job_subscriptions`, `job_messages`.
7. **Crowdfunding :** `crowdfunding_projects`, `crowdfunding_contributions`, `crowdfunding_updates`, `crowdfunding_rewards`, `crowdfunding_advisory`, `crowdfunding_documents`.
8. **Affiliation MLM 5x5 :** `affiliate_profiles`, `affiliate_tree`, `affiliate_commissions`, `affiliate_clicks`, `affiliate_links`, `affiliate_payouts`.
9. **Finances & Portefeuille Global :** `wallets`, `wallet_transactions`, `withdrawals`, `payments`, `refunds`, `invoices`, `moneroo_events`.
10. **Régie Publicitaire (Envol Ads) :** `ads_campaigns`, `ads_slots`, `ads_impressions`, `ads_clicks`, `ads_billing`.
11. **Modération & Audit :** `reports`, `audit_logs`, `security_events`, `banned_users`.

---

## 4. INVENTAIRE DES STOCKAGES D'OBJETS (STORAGE BUCKETS)

### 4.1 Cloudflare R2 (Stockage Principal & Économique)
| Nom du Bucket | Variable d'env | Niveau d'accès | Contenu & Rôle |
|---|---|---|---|
| **Public Assets** | `R2_BUCKET_PUBLIC` | Public (CDN R2) | Photos d'articles, bannières, avatars ouverts, médias de feed WAB |
| **Private Documents** | `R2_BUCKET_PRIVATE` | Privé (URLs signées à durée courte) | Pièces d'identité KYC, registres de commerce vendeurs, documents projets |
| **Magazines Haute Définition** | `MAGAZINE_PRIVATE_BUCKET` | Privé (Stream contrôlé côté serveur) | Fichiers PDF intégraux des magazines, servi via token de téléchargement ou paywall Flipbook |

### 4.2 Supabase Storage (Buckets historiques / migration en cours)
- `article-media` (Public)
- `crowdfunding-documents` (Privé)
- `jobs-cvs` (Privé, documents CV)
- `marketplace` (Public, images produits)
- `marketplace-digital` (Privé, téléchargements numériques)
- `marketplace-product-videos` (Public, démonstrations vidéos)
- `wab-media` (Public, vidéos et images postées)

---

## 5. INVENTAIRE DES WEBHOOKS & POINTS D'ENTRÉE EXTERNES

| Route | Prestataire / Source | Mécanisme de Sécurité | Traitement Métier |
|---|---|---|---|
| `/api/webhooks/moneroo` | Moneroo Payment Gateway | Signature HMAC (`MONEROO_WEBHOOK_SECRET`) + Idempotence (`payment_id`) | Confirmation paiement XOF, crédit wallet, activation commande/vote/abonnement |
| `/api/webhooks/chariow-pulse` | Chariow Pulse | Signature de webhook (`CHARIOW_PULSE_SIGNING_SECRET`) | Événements transactions internationales (Afrique Centrale, Diaspora) |
| `/api/live/agora/webhook` | Agora RTC NCS (Notification Center) | Secret de webhook Agora (`AGORA_NCS_SECRET`) | Détection entrée/sortie scène, fermeture automatique salon live, enregistrements |
| `/api/auth/oauth/callback` | Google Identity Services | Jeton d'état OAuth (state) + PKCE / Nonce | Connexion / Inscription One Tap & OAuth Google |

---

## 6. MATRICE COMPLÈTE DES 60 VARIABLES D'ENVIRONNEMENT

### 6.1 Variables Publiques Côté Client (`NEXT_PUBLIC_*`)
1. `NEXT_PUBLIC_SITE_URL` : URL canonique du site (`https://www.envolafrica.site`)
2. `NEXT_PUBLIC_BASE_URL` : URL racine de l'application
3. `NEXT_PUBLIC_SUPABASE_URL` : URL d'API Supabase
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé anonyme Supabase (accès protégé par RLS)
5. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` : Alias publishable Supabase
6. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` : Client ID Google OAuth / One Tap
7. `NEXT_PUBLIC_AGORA_APP_ID` : Identifiant d'application Agora Live Streaming
8. `NEXT_PUBLIC_GA_MEASUREMENT_ID` : Identifiant flux Google Analytics 4
9. `NEXT_PUBLIC_ADSENSE_CLIENT` : Identifiant client Google AdSense
10. `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` : Identifiant éditeur Google AdSense
11. `NEXT_PUBLIC_R2_BASE_URL` : URL publique CDN Cloudflare R2
12. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` : Clé publique notifications Web Push

### 6.2 Secrets et Clés Côté Serveur Uniquement (SENSITIFS)
- **Supabase :** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `DATABASE_URL_POOLED`
- **Sécurité interne :** `JWT_SECRET`, `DOWNLOAD_SECRET`, `INTERNAL_API_SECRET`, `CRON_SECRET`, `LOGIN_ATTEMPT_HASH_SECRET`, `NEWSLETTER_HASH_SECRET`, `ENVOL_ADS_SIGNING_SECRET`, `ENVOL_ADS_IP_SALT`
- **Moneroo (Finance) :** `MONEROO_SECRET_KEY`, `MONEROO_API_KEY`, `MONEROO_WEBHOOK_SECRET`
- **Chariow (Finance) :** `CHARIOW_SECRET_KEY`, `CHARIOW_PULSE_SIGNING_SECRET`
- **Agora Live :** `AGORA_APP_CERTIFICATE`, `AGORA_NCS_SECRET`
- **Cloudflare R2 :** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_PUBLIC`, `R2_BUCKET_PRIVATE`, `MAGAZINE_PRIVATE_BUCKET`, `R2_KEY_PREFIX`, `R2_SOFT_LIMIT_BYTES`
- **Firebase / Push :** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- **Google :** `GOOGLE_CLIENT_ID` (côté serveur pour vérification des jetons ID)
- **Vercel / Plateforme :** `NODE_ENV`, `VERCEL`, `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL`

---

## 7. COMPOSANTS PARTAGÉS & ARCHITECTURE UI

1. **En-têtes & Navigation :**
   - `HeaderShell.tsx` & `Header.tsx` (Composants sanctifiés avec SVG inline)
   - `HeaderIcons.tsx` (Icônes vectorielles inline sans police de caractères)
   - `BottomNav.tsx` (Barre d'onglets mobile native 5 boutons avec SVG inline)
   - `Footer.tsx` (Pied de page complet unifié avec maillage interne)
2. **Système d'Icônes :**
   - `src/components/ui/Icon.tsx` : Système unifié d'icônes SVG inline (`SvgIcon`)
3. **Liseuse & Médias :**
   - `FlipBookReader.tsx` : Liseuse interactive PDF avec paywall page 8
   - `AgoraLiveStream.tsx` : Client RTC temps réel pour Africa Awards & Salons WAB
4. **Système de Tokens Design :**
   - `src/app/globals.css` : Palette de référence Magazine/Kiosque (Bordeaux `#7D0A0A`, Or Chaud `#C5A880`, Crème `#FBF9F5`, Noir Profond `#1A1A1A`).
