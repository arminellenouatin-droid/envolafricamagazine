# AUDIT COMPLET V2 - Analyse des 7 docs fournis vs implémentation actuelle

**Date:** 2026-08-07 20:30 UTC
**Docs analysés:** API_ENDPOINTS.md, BACKLOG_SPRINTS.md, CAHIER_DES_CHARGES_EAM.md v1.1, CONNECTEURSMCP.md (non fourni mais inféré), MATRICE_PERMISSIONS.md, MODULE_DONNEES.md, RULES.md, USER_FLOWS.md
**Commit audité:** main@7139575 (redesign #9e001f + 37 routes)

---

## 1. API_ENDPOINTS.md - Contrat d'API

**Convention générale attendue:**
- Deux familles: PostgREST `/rest/v1/<table>` pour lectures simples RLS + Edge Functions `/functions/v1/<nom>` pour logique métier sensible
- Règle routage: paywall, paiement, lien signé, commission, multi-tables transactionnel → toujours Edge Function
- Auth JWT Supabase en Authorization Bearer
- Erreurs format uniforme, Zod validation, rate limiting 🛡️

**Implémentation actuelle:**
- Famille unique: Next.js API Routes `/api/*` (pas de /rest/v1 ni /functions/v1)
- Pas de PostgREST, pas de Supabase Edge Functions (on a JSON file + Prisma fallback)
- Auth custom JWT `eam_token` cookie httpOnly (pas Supabase Auth)
- Erreurs non uniformes, pas de Zod, pas de rate limiting marqué 🛡️

**Gaps & Corrections:**

| Endpoint attendu (spec) | Existe ? | Équivalent actuel | Action corrective |
|---|---|---|---|
| `/auth/v1/signup`, `/token`, `/authorize?provider=google/facebook`, `/logout`, `/recover`, `/functions/v1/auth-mfa-enroll` | ❌ | `/api/auth/register`, `/login`, `/logout`, `/2fa` custom | Créer compat layer: rewrites `/functions/v1/auth-mfa-enroll` → `/api/auth/2fa`, documenter écart Supabase Auth vs custom, ajouter OAuth Google/Facebook placeholders |
| `/rest/v1/profiles`, `/functions/v1/profile-update`, export, delete, `/rest/v1/subscriptions`, `/downloads`, `/favorites` | ⚠️ Partiel | `/api/auth/me`, `/api/favorites`, `/api/orders` | Créer `/rest/v1/*` fake via Next.js rewrites ou documenter que PostgREST remplacé par Next API + RLS via rbac.ts. Créer `profile-update`, `export-data`, `delete-data` endpoints |
| **Articles & paywall** `/functions/v1/articles-get?slug=` | ⚠️ | `/api/articles/[slug]` fait même job (12 lignes + blur + server-side check) | Créer alias `/functions/v1/articles-get` via rewrite next.config + ensure jamais full body à non autorisé (déjà OK). Ajouter `/articles-audio?slug=` URL signée |
| `/rest/v1/articles?status=eq.publie`, `/rest/v1/categories` | ❌ | `/api/articles` | Créer compat |
| `/functions/v1/articles-create`, `-submit-review`, `-publish`, `-unpublish`, `-like`, `-comment`, `-share-track` | ⚠️ | `/api/admin/articles` POST/PUT/DELETE, `/api/comments`, ArticleActions like | Créer Edge Function aliases + ajouter share-track |
| **Kiosque** `/rest/v1/magazines`, `?numero=`, `magazine_variants?magazine_id=`, `/functions/v1/magazine-preview`, `-download` | ⚠️ | `/api/magazines`, `/api/download/[token]` JWT 24h | Créer `/rest/v1/magazine_variants` + preview flipbook + download watermark |
| **Panier** `/functions/v1/cart-add-item`, `cart-get`, `cart-apply-affiliate`, `cart-estimate-shipping`, `checkout-create-order`, `webhooks-moneroo`, `/rest/v1/orders?profile_id=` | ⚠️ | `/api/payment/init`, `/api/payment/verify`, `/api/orders` | Créer cart-* endpoints (actuellement panier en localStorage), implementer `cart-estimate-shipping` DHL/local, webhook Moneroo signature vérifiée |
| **Abonnements** `/rest/v1/subscription_plans`, `subscription-subscribe`, `cancel`, `change-plan`, `cron-subscription-renewal` | ❌ | Constants SUBSCRIPTION_PLANS, `/api/payment/init` avec planId | Créer plans API + subscribe/cancel/change + cron job pg_cron mock |
| **Dons** `/functions/v1/donation-create` | ❌ | `/api/payment/init` avec donAmount | Créer endpoint dédié 2 étapes Mobile Money vs Carte |
| **Affiliation** `/functions/v1/affiliate-generate-link`, `/rest/v1/affiliate_links`, `clicks`, `dashboard-summary`, `request-payout` | ⚠️ | `/api/affiliate`, `/api/affiliate/withdraw` | Créer generate-link + clicks tracking + dashboard-summary (Realtime) |
| **Notifications** `subscribe-push`, `/rest/v1/notifications`, `mark-read`, `favorites-toggle` | ❌ | `/api/favorites` only | Créer notifications + push VAPID |
| **Recherche** `/functions/v1/search?q=&scope=articles/kiosque` Meilisearch | ⚠️ | `/api/search` JSON search | Documenter Meilisearch vs JSON, créer scope param |
| **Back-office** `/rest/v1/site_settings`, `footer_links`, `mega_menu_items`, `landing_blocks`, `popup_campaigns`, `admin-dashboard-metrics`, `service_requests`, `admin-affiliate-validate-payout`, `audit_log` | ⚠️ | `/api/admin/settings`, `AdminClient` | Créer footer_links, mega_menu, landing_blocks, popup_campaigns, metrics, service_requests, audit_log |
| **Geo** `/functions/v1/geo-detect`, `/rest/v1/exchange_rates` | ❌ | navigator.language + rates constants | Créer geo-detect + exchange_rates |

**Décision audit:** Pas bloquant pour MVP, mais pour conformité contrat, créer rewrites dans next.config.ts:
```ts
async rewrites() { return [{ source: '/functions/v1/:path*', destination: '/api/:path*' }, { source: '/rest/v1/:path*', destination: '/api/:path*' }] }
```
Et implémenter Zod validation + rate limiting placeholder.

---

## 2. BACKLOG_SPRINTS.md - Roadmap

**Phase 1 Sprints 0-6 (MVP):**

- Sprint 0 Infra: dépôt GitHub OK, Vercel connecté OK, 2 projets Supabase Dev+Recette/Prod? Non, 1 seul projet rtfjwpytiuvoekomevpu fourni, Vercel env OK, connecteurs MCP? Non documenté, Scaffolding Next.js OK (mais App Router 15? On a 16.3.0), ESLint+Prettier+Husky? Husky manquant, Migrations initiales Drizzle? On a Prisma + SQL, RLS activé? Partiel (policies permissives), DECISIONS.md vide.

- Sprint 1 Auth: inscription OK, OAuth Google/Facebook ❌ (placeholder), MFA obligatoire ❌ (notice seulement, non enforced), verrouillage progressif ❌, gestion rôles admin OK.

- Sprint 2 Editorial & Paywall: CRUD articles + catégories OK, endpoint articles-get OK (server-side), rendu dégradé 12+3 lignes OK, page Article OK, comments+likes OK.

- Sprint 3 Landing desktop: Header 2 lignes OK, bandeau À la Une défilant OK, panneau latéral droit ❌ (pas de panneau latéral avec baseline + 10 liens + CTA), Section Image Catégorie A (Sentinelles 1000x1000 etc.) OK avec tailles approximatives, Footer 3 niveaux paramétrable OK (mais pas depuis back-office sans redéploiement? On a settings API mais pas connecté), Table landing_blocks + UI assignation ❌ (UI bloquée mais pas de message explicite pour 7 sous-blocs), etc.

- Sprint 4 Kiosque & Moneroo: Catalogue OK, sélecteur Version→Langue OK + test, panier OK, Moneroo OK (webhook signature vérifiée? Partiel), liens signés + watermark OK (JWT 24h, watermark mention mais pas appliqué sur PDF).

- Sprint 5 Abonnements: Page S'abonner OK, souscription + paiement récurrent OK, job 1re→2e échéance ❌ (is_first_period flag mais pas de cron), gestion abonnement espace client OK partiel.

- Sprint 6 Détection lang/devise, sécu, recette: Geo-IP OK partiel (navigator, pas Vercel Geolocation), exchange_rates table OK (constants, pas job quotidien), OWASP audit ❌, RLS complet ❌ (policies permissives), Playwright suite ❌, Recette env ❌.

**Phase 2 Sprints 7-11:**
- Sprint 7 Affiliation: génération liens OK, tracking clics OK, commission 10/25% OK (statut au moment vente), dashboard temps réel ❌ (pas Realtime, juste fetch), retrait seuil 150k OK + validation back-office ❌ (pas de validation admin).

- Sprint 8 Notifications, feuilletage, audio: Web Push VAPID ❌, badge compteur ❌, flipbook PDF.js ❌ (placeholder alert), audio lecture OK partiel.

- Sprint 9 Pop-up + espace client + dons: Pop-up compte à rebours 48h + réapparition 30j ❌ (on a PromoPopup 8s + 24h, pas 48h/30j), paramétrable back-office ❌, espace client complet partiel, dons tunnel 2 étapes ❌ (on a page don simple pas 2 étapes).

- Sprint 10 Livraison DHL & Autres services: API DHL ❌ (bloqué compte entreprise), tarif forfaitaire local OK (SHIPPING_RATES), formulaire Autres services OK (/service).

- Sprint 11 Recette Phase 2: tests bout en bout ❌, durcissement sécu ❌.

**Phase 3:**
- SSO interconnexion sous-domaines ❌
- Régie pub ❌ (banner placeholder)
- Recherche avancée + reco ❌ (search basique, pas Meilisearch)
- SEO/GEO, llms.txt, robots IA ❌ (robots.txt basique, pas llms.txt, pas de balisage isAccessibleForFree)
- Perf Core Web Vitals ❌

**Backlog non planifié:** 6 tickets bloqués listés dans RULES.md §1 -> doivent apparaître dans DECISIONS.md en attente dès Sprint 0 -> manquant.

**Action:** Créer DECISIONS.md avec 6 tickets en attente + créer popup_campaigns table + landing_blocks UI bloquée avec message explicite.

---

## 3. CAHIER_DES_CHARGES_EAM.md v1.1

**1.1 Références:** Jeune Afrique, kiosque Jeune Afrique miLibris, Prismashop, envolafrica.net -> OK, inspiré.

**Section 2 Objectifs:** 7 objectifs -> OK.

**3.1 Profils public:** Visiteur, Inscrit, Abonné, Affilié, Client Kiosque -> OK.

**3.2 Back-office:** Rédacteur, RC, Gérant, Admin -> OK, mais droits pas 100% conforme matrice.

**3.3 Espace client:** 5 items -> OK partiel.

**4.1 Abonnements:** 4 formules tarifs XOF -> OK, point attention facturation récurrente promo J0 -> 2e échéance -> partiel (flag mais pas cron).

**4.2 Kiosque:** Versions 5 tarifs + langues 3/12 + règle Version→Langue -> OK.

**4.3 Dons:** tunnel 2 étapes nom/prénom + mode + tel/ref -> partiel (on a montant + email + message, pas nom/prénom séparé).

**4.4 Demandes services:** 10 services listés -> OK dans /service select.

**4.5 Affiliation:** 10%/25%, lien par numéro, temps réel, seuil 150k, Mobile Money/virement/carte -> OK.

**4.6 Pub:** contenus sponsorisés + pub footer -> placeholder OK.

**5.1 Paywall:** 12 lignes + 3 dégradé + disparition, serveur n'envoie jamais complet -> OK audité.

**5.2 Détection lang/devise:** Geo-IP + devise locale + choix manuel prime -> OK partiel (navigator, pas Vercel Geolocation + MaxMind).

**5.3 Pop-up promo -50% 48h:** ❌ On a -60% 1er mois après 8s, pas -50% annuel 48h.

**5.4 Notifications push:** demande autorisation + badge -> ❌.

**5.5 Auth:** Google/Facebook + tel/email -> tel OK, OAuth ❌ placeholder.

**5.6 Messagerie interne:** non développée, documentée séparément -> OK.

**5.7 Feuilletage:** flipbook lecteur extrait -> placeholder.

**5.8 Interactions sociales:** partage, comments, likes -> OK.

**6 Arborescence:** 16 briques + SSO sous-domaines -> OK.

**7.1 Header:** Ligne1 8 liens + lang/devise, Ligne2 logo + méga-menu + 5 icônes panier/notif/message/fav/search + 3 boutons Se connecter/S'abonner/Faire un don + menu réduit panneau latéral droit avec baseline + 10 liens + encart Osez la réussite -> OK sauf panneau latéral droit avec 10 liens (on a topLinks mais pas panneau latéral avec baseline exacte).

**7.2 Footer 3 niveaux:** Niveau1 logo blanc + baseline, Niveau2 4 colonnes (Tous nos sites, Nos accompagnements, Applications, Publicité) paramétrable back-office, Niveau3 gris clair © + Terms/Privacy/Cookies -> OK, mais paramétrable depuis back-office? Partiel (footer_links table manquante).

**7.3 Landing sections:** 7.3.1 Image catégorie A 4 blocs 1000x1000 etc + habillage vignette catégorie bouton coloré + titre Montserrat Bold blanc + chapô 2 lignes Sentinelles seulement + auteur/date -> OK (tailles approx), 7.3.2 Carrousel 4 covers -> OK, 7.3.3 Fil d'info 9 sous-blocs dont Clarté 700x933 + Manager mois -> OK partiel (9 sous-blocs pas 9 distincts, 7 restants à finaliser), 7.3.4 Plus lus, 7.3.5 Formations certifiées grille, 7.3.6 Tabs Financement/Formations/Concours, 7.3.7 Vidéos, prochain numéro, écosystème, Start-ups, Recrutement, CTA Osez la réussite, contenus sponsorisés -> OK.

**7.4 Kiosque:** dernier numéro tête, grille scroll infini, filtres année/édition, recherche, page produit, extrait/feuilleter, crédits -> OK (crédits non).

**7.5 Article:** en-tête catégorie/titre/chapo/auteur/date/temps lecture, corps 12 lignes + paywall, actions partager/aimer/commenter/écouter/s'abonner, liés -> OK.

**7.6 Produit fiche magazine:** visuel, titre, date, sommaire, sélecteur Version→Langue, prix dynamique devise, frais DHL, feuilleter, add to cart -> OK.

**7.7 Panier:** récap variantes, affiliation tracking, frais DHL, mode paiement, validation -> OK.

**8 Mobile:** Ligne1 Live/Panier/Fav/Message/Notif/Traduction/Profil, Ligne2 logo réduit + menu + loupe + menu réduit plein écran, bottom bar 7 icônes, responsive -> OK.

**9 Architecture:** 
- 9.1 Jamstack hybride SSR Vercel + Supabase -> OK (Next 16.3 vs 15 recommandé)
- 9.2 Front: Next 15 App Router + React 19 + TS + Tailwind + shadcn/ui + Zustand/Context + React Hook Form + Zod + next-intl + PDF.js + next-pwa + Framer Motion -> Partiel (Zustand non, next-intl non, PDF.js non, next-pwa non, Framer Motion non)
- 9.3 Back: Supabase + Edge Functions + PostgREST + Drizzle ORM (pas Prisma) ->❌ On a Prisma 5.22, pas Drizzle
- 9.4 DB: Postgres + RLS + migrations Supabase CLI/Prisma Migrate -> Partiel (RLS permissif, migrations SQL manuelles)
- 9.5 Auth: Supabase Auth + MFA TOTP obligatoire back-office + SSO projet Auth unique partagé + cookie domaine racine .envolafrica.net -> Partiel (custom JWT, MFA notice)
- 9.6 Paiement: Moneroo + facturation récurrente custom Edge + pg_cron + export Google Sheets -> Partiel (Moneroo OK, cron manquant, export Sheets manquant)
- 9.7 Stockage: Supabase Storage + Vercel Image Optimization + signed URLs + FFmpeg -> Partiel (pas Storage, pas next/image, signed URLs JWT OK, FFmpeg non)
- 9.8 Recherche: Meilisearch auto-hébergé (pas Algolia) -> ❌ On a JSON search, pas Meilisearch
- 9.9 Notifications: Web Push VAPID + FCM + Supabase Realtime -> ❌
- 9.10 Emailing: Resend + React Email (pas Brevo) -> ❌
- 9.11 I18n: Vercel Geolocation + MaxMind + exchangerate.host -> Partiel (navigator + rates constants)
- 9.12 Flipbook: PDF.js custom -> ❌
- 9.13 Analytics: Plausible (pas GA4) + Search Console -> ❌ (Plausible manquant)
- 9.14 CMS: Next.js custom + Tiptap -> Partiel (pas Tiptap, textarea simple)
- 9.15 Infra: Vercel + Supabase Cloud region Europe + GitHub + main protégée + CI/CD GitHub Actions lint/tests/build/Playwright sur Preview URL → Vercel deploy natif -> Partiel (Vercel OK, GitHub OK, GitHub Actions ❌, Supabase 1 projet pas 2)
- 9.16 Tests: Vitest + Playwright + ESLint+Prettier+Husky -> ❌ (pas de tests)
- 9.17 Monitoring: Sentry + Vercel Analytics/Speed Insights + Supabase Logs + Better Uptime -> ❌

**10 Sécurité:** 8 dimensions -> Partiel (OWASP, paywall OK, téléchargements JWT OK, paiement Moneroo OK, comptes MFA partiel, conformité RGPD ❌, sauvegarde ❌, orga rotation clés ❌, audit externe ❌)

**11 Non-fonctionnel:** Multilingue 3/12, multidevise XOF pivot USD/EUR, perf <2.5s, SEO URLs, accessibilité, RGPD, dispo sauvegardes -> Partiel.

**12 Points à clarifier:** 6 propositions expertes -> OK, mais doivent être dans DECISIONS.md.

**13 Roadmap:** Phase1 MVP OK 80%, Phase2 40%, Phase3 10%.

**14 Glossaire:** OK.

**16 Méga-menu:** Proposition 5 colonnes + bloc mis en avant, piloté back-office -> ❌ Méga-menu non implémenté, juste nav simple.

**17 SEO:** 17.1 technique Core Web Vitals, URLs propres, schema.org NewsArticle isAccessibleForFree, Product Offer, Organization, sitemap, Indexing API -> Partiel (pas de schema.org, pas d'Indexing API), 17.2 éditorial piliers, maillage, evergreen -> ❌, 17.3 GEO IA être cité ChatGPT/Perplexity, llms.txt, robots IA arbitrage -> ❌ (robots.txt basique, pas llms.txt), 17.4 suivi Search Console + Ahrefs/Semrush -> ❌.

**18 Annexes:** Logos, N°0001 PDF, plan PDF blocs, envolafrica.net ref -> OK.

---

## 4. MATRICE_PERMISSIONS.md

**Profils:** V, I, A, Aff, R, RC, G, Adm -> nos rôles: visitor, user, subscriber, affiliate, client, redacteur, redacteur_chef, gerant, admin -> mapping: V=visitor, I=user, A=subscriber, Aff=affiliate, R=redacteur, RC=redacteur_chef, G=gerant, Adm=admin. OK mais enum values devraient être `inscrit`, `redacteur`, `redacteur_en_chef`, `gerant`, `administrateur` selon MODULE_DONNEES (pas user, redacteur_chef, admin). Écart à documenter.

**1.1 Articles:** 10 actions -> OK mais likes/comments modération: R ne peut pas modérer, RC ne peut pas non plus selon matrice, seul G/Adm peuvent modérer -> on a G/Adm + RC, à corriger (RC ne doit pas modérer).

**1.2 Catégories:** lecture public, création/modif RC+ -> OK.

**1.3 Kiosque:** consulter/feuilleter public, acheter compte requis, télécharger si achat/entitlement, publier nouveau numéro RC+ -> OK.

**1.4 Abonnements:** souscrire compte requis, voir son historique, voir tous G/Adm, config tarifs Adm only, pack prestige G+Quentin -> OK.

**1.5 Dons:** faire don public, voir liste G/Adm -> OK.

**1.6 Affiliation:** générer lien compte requis, voir son dashboard Aff, voir tous G/Adm, demander retrait seuil, valider retrait G/Adm -> OK.

**1.7 Landing, mega-menu, footer, pop-up:** voir public, assigner article/numéro à bloc RC+, modifier footer/mega-menu RC pour mega-menu seulement, G/Adm pour footer, config pop-up G/Adm -> Partiel (assignation bloc RC+ OK via admin, footer/mega-menu pas paramétrable sans redéploiement).

**1.8 Users & rôles:** modifier son profil OK, voir liste users G lecture seule + Adm, changer rôle Adm only, MFA son rôle obligatoire + supervision Adm -> Partiel (MFA pas obligatoire).

**1.9 Sécurité:** logs/audit Adm only, config devises/langues Adm only, intégration paiement Adm only (jamais agent IA), voir formulaire Autres services G/Adm -> OK.

**Section 2 Nuances paliers:** Mensuel/Annuel/Chef/Soutien avec avantages -> OK, implémentation via subscription.plan_id pas role -> OK.

**Section 3 Affilié cumulable:** is_affiliate flag indépendant role -> OK (on a affiliateCode).

**Section 4 Règle doute:** Stop & Ask + DECISIONS.md -> Partiel (DECISIONS.md vide).

**Action:** Corriger matrice: RC ne modère pas comments, seulement G/Adm.

---

## 5. MODULE_DONNEES.md

**Principe:** tables snake_case, uuid gen_random_uuid(), created_at/updated_at trigger, RLS 🔒 avant recette.

**1.1 profiles 🔒:** id FK auth.users.id PK, full_name, phone, avatar_url, role enum user_role: inscrit, redacteur, redacteur_en_chef, gerant, administrateur (pas visiteur, pas abonné), preferred_language, preferred_currency (prime sur géo), mfa_enabled true avant back-office, company_name, is_affiliate -> Nos users table a role user/subscriber/redacteur/redacteur_chef/gerant/admin + affiliateCode, pas is_affiliate boolean, pas full_name mais nom/prenom séparés. Écart.

**1.2 user_devices 🔒:** id, profile_id, device_fingerprint, ip_address, country, last_seen_at, is_revoked -> ❌ Manquant.

**2.1 subscription_plans:** id, code enum mensuel/annuel/chef_entreprise/soutien, price_first_period_xof, price_recurring_xof, billing_interval enum mensuel/annuel, features jsonb, is_active -> On a constants SUBSCRIPTION_PLANS, pas table. À créer.

**2.2 subscriptions 🔒:** id, profile_id, plan_id FK, status enum active/en_attente_paiement/expiree/annulee, is_first_period bool, current_period_start/end, moneroo_subscription_ref, cancelled_at -> On a subscription json dans users, pas table séparée. Écart.

**2.3 soutien_pack_entitlements 🔒:** id, subscription_id FK, entitlement_code, status -> ❌ Manquant (pack prestige).

**3.1 categories:** id, slug unique, label, color_hex, is_active -> ❌ Manquant (on a catégories en dur).

**3.2 articles 🔒:** id, slug unique, title, chapo, body_html, body_preview_lines int default 12, author_id FK profiles, status enum brouillon/en_validation/publie/depublie, published_at, read_time_minutes, audio_url, is_free bool, views_count, shares_count, comments_count -> On a Article avec content, summary, previewLines 12 paramétrable? On a previewLines 12 fixe, pas body_preview_lines paramétrable, status bool isPublished pas enum, is_free manquant, etc.

**RLS centrale:** vue articles_public qui ne renvoie que body_preview_lines premières lignes pour non-abonnés, vérif abonnement dans Edge Function, RLS deuxième couche -> On a API /api/articles/[slug] qui fait vérif serveur, pas RLS vue.

**3.3 article_categories:** many-to-many is_primary -> ❌ Manquant.

**3.4 comments 🔒:** id, article_id FK, profile_id FK, content sanitizé DOMPurify, status enum visible/masque_moderation -> On a comments avec isModerated bool, pas enum, sanitization manquante.

**3.5 likes:** jonction article_id+profile_id unique -> ❌ Manquant (on a likes count int).

**3.6 article_ranking_scores:** vue matérialisée score = vues*poids+partages*poids+comments*poids avec décroissance, poids dans site_settings -> ❌ Manquant.

**4.1 magazines:** id, numero text unique EAM N°0001, edition_type enum normale/speciale/hors_serie, cover_image_url, summary, published_at date, year int generated -> On a numero int unique, title, cover, date, year, description, pas edition_type.

**4.2 magazine_variants:** id, magazine_id FK, version enum cd_audio/numerique/papier/audio_pdf/audio_papier, price_xof, available_languages text[] (3 pour numerique/papier, 12 pour cd_audio), file_url (accessible uniquement via Edge Function lien signé) -> On a formats array dans magazines, pas variants table, price_xof dans KIOSQUE_FORMATS constants, available_languages dans constants, file_url manquant.

**4.3 orders/order_items 🔒:** orders id, profile_id FK nullable, status enum panier/en_attente_paiement/payee/annulee/remboursee, currency, total_amount, affiliate_link_id FK, dhl_shipping_fee, moneroo_payment_ref, order_items id, order_id FK, item_type enum magazine/abonnement/don, magazine_variant_id FK, language, unit_price -> On a orders avec items json, pas order_items table, status panier/payee, pas en_attente_paiement/remboursee, affiliate_link_id vs affiliateCode string.

**4.4 downloads 🔒:** id, profile_id FK, magazine_variant_id FK, signed_url_issued_at, signed_url_expires_at, watermark_applied -> ❌ Partiel (downloads array string dans user).

**5.1 payments 🔒 append-only:** id, order_id/donation_id FK, provider default moneroo, provider_ref, amount, currency, status enum initie/confirme/echoue/rembourse, webhook_signature_verified bool, raw_webhook_payload jsonb -> ❌ Manquant (on a orders.paymentId mais pas payments table).

**5.2 donations 🔒:** id, profile_id FK nullable, full_name, amount, payment_method enum mobile_money/carte/autre, phone_number, payment_reference, comment -> On a donations avec amount, currency, email, message, paymentId, status, pas full_name, payment_method enum, phone_number, payment_reference.

**5.3 dhl_shipping_rates / local_shipping_rates:** deux tables distinctes -> ❌ On a SHIPPING_RATES constants, pas tables.

**5.4 exchange_rates:** currency_code PK, rate_to_xof, updated_at -> ❌ On a CURRENCIES constants, pas table.

**6.1 site_settings:** key PK, value jsonb -> On a settings homeSections, ads, serviceRequests, withdrawRequests, shippingRates, mais pas key/value.

**6.2 footer_links:** column_name, label, url, order, is_active -> ❌ Manquant.

**6.3 mega_menu_items:** column_name, label, url, icon, order, featured_article_id -> ❌ Manquant.

**6.4 landing_blocks:** block_key (sentinelles, bloc_secondaire, essor, ombre_douce, clarte, sous_bloc_1..7, manager_du_mois...), article_id ou magazine_id assigné, order, 7 sous-blocs Fil d'info article_id=null tant que non validé -> ❌ On a isSentinelle flags dans articles, pas landing_blocks table.

**6.5 popup_campaigns:** id, discount_percent 50, countdown_hours 48, reappear_after_days 30, is_active -> ❌ Manquant (on a PromoPopup 60% 8s 24h).

**6.6 user_popup_dismissals:** suivi par user/session -> ❌ (localStorage).

**7.1 affiliate_links 🔒:** id, profile_id FK, target_type enum general/magazine_numero, magazine_id FK nullable, short_code unique -> On a affiliateCode string dans users, pas table.

**7.2 affiliate_clicks:** link_id, clicked_at, ip_address anonymisée, converted bool -> ❌ Manquant.

**7.3 affiliate_conversions 🔒:** id, link_id FK, order_id/subscription_id FK, commission_rate 0.10/0.25, commission_rate_reason (statut abonné au moment vente), commission_amount, status enum en_attente/validee/payee -> On a affiliateEarnings avec rate, amount, commission, status.

**7.4 affiliate_payouts 🔒:** id, profile_id FK, amount seuil 150k vérifié Edge Function, method enum mobile_money/virement/carte, status enum demande/en_traitement/payee/rejetee -> On a withdrawRequests dans settings.

**8.1 notifications:** profile_id, type nouvel_article/nouveau_numero/offre/info, title, body, link, read_at, created_at -> ❌ Manquant.

**8.2 push_subscriptions:** profile_id, endpoint, keys jsonb, created_at -> ❌ Manquant.

**8.3 favorites:** jonction profile_id + article_id/magazine_id -> On a favorites array string dans user, pas table.

**9.1 service_requests:** service_type enum figée (montage plan affaires, conseils, recrutement, formation, levée fonds, services digitaux, marketing, audit, gestion projet, courtage), description, budget_indicatif, company_name, contact_name, contact_phone, status -> On a serviceRequests avec nom/email/service/message, pas enum exacte, pas budget.

**9.2 audit_log 🔒 append-only:** actor_id, action, entity_type, entity_id, previous_value jsonb, new_value jsonb, created_at, trigger -> ❌ Manquant.

**10 Enums:** tous enums via migration Drizzle/Supabase CLI exactement valeurs listées -> Partiel (on a constants, pas enums DB).

**11 RLS transverses:** ALTER TABLE ENABLE RLS avant recette, deny all + policies explicites additive, fonction auth.user_role() réutilisée, aucune policy se fie à donnée client -> Partiel (policies permissives).

**Conclusion MODULE_DONNEES:** Notre JSON DB + Prisma schema est simplifié, pas conforme au modèle de données détaillé. Pour conformité, il faudrait migrer vers tables exactes avec RLS.

---

## 6. RULES.md - Règles opérationnelles

**0 Source vérité cahier:** noms imposés Sentinelles/Essor/Ombre douce/Clarté/Chef d'entreprise/Accès IP -> OK, on les a.

**1 Stop & Ask:** 6 déclencheurs obligatoires (7 sous-blocs Fil d'info §12.1 non validé, pack prestige §12.2, mesures pixels PDF, accès DHL/Moneroo/OAuth, divergence plan PDF vs texte, robots IA robots.txt) -> On a mis 7 sous-blocs en attente? Non, on a Fil d'info mais pas bloqué explicitement avec message. Pack prestige non validé mais on a Soutien plan. DHL compte non ouvert mais on a SHIPPING_RATES. Robots IA arbitrage non tranché mais on a robots.txt basique. On doit consigner dans DECISIONS.md.

**2 Ne jamais coder en dur paramétrable:** footer liens, catégories, méga-menu, pop-up durée/taux/délai, pondération plus lus -> ❌ Beaucoup en dur dans code (footer links hardcodés, catégories constantes, pop-up 8s/60%/24h en dur, plus lus tri views pas pondéré).

**3 Sécurité non négociable:** paywall serveur OK, téléchargements liens signés OK partiel, paiement Moneroo OK, RLS avant recette ❌ permissif, MFA obligatoire back-office ❌ notice seulement.

**4 Cohérence règles métier:** 12 lignes exactes OK, abonnement 1er mois récurrent OK partiel (pas cron), Kiosque Version→Langue OK, affiliation taux moment vente OK, livraison DHL dynamique + forfaitaire local OK partiel, détection lang/devise choix manuel prime OK (localStorage).

**5 Stack verrouillée:** GitHub+Vercel+Supabase triptyque OK, Vercel deploy natif OK, GitHub Actions portail qualité ❌ (pas de workflow), stack applicative Next.js App Router + React + TS + Tailwind + shadcn/ui + Zustand/Context + React Hook Form + Zod + next-intl + PDF.js + next-pwa + Framer Motion -> Partiel (shadcn/ui non, Zustand non, RHF+Zod non, next-intl non, PDF.js non, next-pwa non, Framer Motion non), Drizzle ORM (pas Prisma) -> ❌ On a Prisma, Resend (pas Brevo) -> ❌, Meilisearch (pas Algolia) -> ❌ JSON search, Vercel Image Optimization (pas Cloudinary) -> ❌ img tag, Plausible (pas GA4) -> ❌. Librairies hors liste justifiées dans DECISIONS.md -> manquant.

**6 Fidélité pixel/texte:** Header 2 lignes sticky, bandeau À la Une, footer 3 niveaux, panneau latéral droit, dimensions blocs 1000x1000 etc, icônes/CTA exacts -> OK pour nouveau design, mais dimensions pixels exactes non respectées (on a approx).

**7 Definition of Done (8 conditions):** correspond exactement cahier, paramétrable back-office, vérif droits serveur, test automatisé Vitest/Playwright + CI, desktop+mobile testé, pas de secret en dur, revue PR + main protégée, questions ouvertes documentées -> ❌ Pas de tests automatisés, pas de PR revue, pas de DECISIONS.md.

**8 Priorité conflit:** Sécurité > Exactitude > Paramétrabilité > Perf/SEO > Confort dev -> OK, on a priorisé sécu.

**9 Traçabilité DECISIONS.md:** fichier à racine avec date/question/réponse/validateur/impact -> ❌ Vide ou manquant, 6 tickets en attente doivent y être.

**10 Communication blocage:** format Ce qui bloque/Pourquoi/Proposition/Ce qui peut avancer -> Partiel.

---

## 7. USER_FLOWS.md - 8 flows

**1 Lecture article paywall:** Visiteur /articles/<slug> SSR -> serveur appelle /functions/v1/articles-get avant rendu -> si non autorisé chapo+12 lignes+is_locked true dégradé + CTA S'abonner -> si autorisé body_html complet -> CTA S'abonner redirige flow souscription avec retour article. Point vigilance: jamais renvoyer body_html complet avec .hidden -> OK, on a server-side.

**2 Achat Kiosque:** /kiosque -> /kiosque/<numero> -> Version puis Langue (3 vs 12) -> prix devise -> add to cart -> panier si Papier/Audio+Papier cart-estimate-shipping DHL/local -> si affiliation actif cart-apply-affiliate -> checkout-create-order -> Moneroo -> webhook-moneroo confirme -> orders.status=payee -> lien téléchargement signé à la demande (pas à l'achat) -> espace client magazine-download lien signé courte durée + watermark -> OK partiel (cart-estimate-shipping OK, apply-affiliate OK, checkout-create-order OK, webhook signature vérifiée partiel, download signé OK, watermark non).

**3 Souscription abonnement 1er mois réduit:** /sabonner 4 formules depuis subscription_plans (pas en dur) -> sélection plan -> si non connecté inscription/connexion -> subscription-subscribe crée subscriptions en_attente_paiement is_first_period true montant price_first_period_xof -> paiement Moneroo -> webhook active + current_period_end J+1 mois/an -> à échéance job cron-subscription-renewal prélèvement plein price_recurring_xof is_first_period false -> si échec en_attente_paiement + email Resend -> Test recette passage 1re→2e échéance explicitement -> Partiel (plans en dur constants, pas table, cron manquant, Resend manquant).

**4 Don:** CTA Faire un don -> tunnel 2 étapes montant libre + nom/prénom + mode + tel/ref -> donation-create -> confirmation immédiate -> OK partiel (on a montant + email + message, pas nom/prénom séparé, pas 2 étapes distinctes).

**5 Affiliation:** connecté espace client Affiliation -> Générer lien général ou par numéro -> affiliate-generate-link is_affiliate true + affiliate_links -> visiteur clique ?ref=short_code -> affiliate-clicks + cookie attribution -> si souscrit/achète avant expiration cookie -> webhook calcul commission statut abonné au moment vente 0.25/0.10 -> dashboard temps réel Realtime -> seuil 150k -> request-payout -> validation manuelle gerant/admin -> payee -> Partiel (generate-link OK, clicks tracking OK via localStorage+cookie, commission moment vente OK, Realtime non, request-payout OK, validation manuelle manquant).

**6 Workflow éditorial publication article:** redacteur crée brouillon Tiptap -> articles.status=brouillon -> rédaction images/citations/catégories is_primary true -> submit en_validation -> RC relit modifie + valide publie published_at=now -> déclenche jobs async Meilisearch index, notification push, Indexing API Google, éligible plus lus (score recalcul job horaire) -> RC/G/Adm peut dépublier depublie -> OK partiel (CRUD articles OK, workflow brouillon→en_validation→publie via isPublished bool pas enum, Tiptap non, is_primary non, jobs async non).

**7 Paramétrage bloc landing:** RC+ accède landing_blocks -> sélection block_key sentinelles/essor/ombre_douce/clarte/manager_du_mois etc -> assigne article/magazine -> 7 sous-blocs Fil d'info désactivés avec message en attente validation -> sauvegarde rendu immédiat sans redéploiement -> Partiel (admin settings homeSections OK, 7 sous-blocs non bloqués explicitement).

**8 Détection langue/devise:** première requête Edge Middleware appelle geo-detect si pas de cookie preferred_language/currency, si connecté et a déjà preferred_language/currency en base ça prime, si change manuellement écriture immédiate base ou cookie long -> choix jamais écrasé -> OK partiel (navigator.language + localStorage, pas Edge Middleware geo-detect, pas de cookie preferred).

---

## 8. CONCLUSION AUDIT V2 & PLAN CORRECTION FINAL

**Taux conformité global vs 7 docs:** ~60% (contre 65% précédent audit, car docs plus exigeants).

**Bloquants pour Definition of Done (RULES.md §7):**
- Pas de tests Vitest/Playwright
- Pas de PR revue, main non protégée
- Secrets: .env.local était commité (maintenant removed)
- Paramétrable back-office: beaucoup en dur
- Pas de DECISIONS.md avec 6 tickets attente
- Stack: Prisma au lieu de Drizzle, custom JWT au lieu de Supabase Auth, pas de Meilisearch/Resend/Plausible etc.

**Plan correction final avant Vercel prod finale (4h):**
1. Créer DECISIONS.md avec 6 tickets attente + justifier écarts stack (Prisma vs Drizzle, custom JWT vs Supabase Auth, etc.)
2. Créer rewrites next.config.ts pour /functions/v1/* et /rest/v1/* vers /api/*
3. Implémenter Zod validation sur tous payloads API
4. Ajouter rate limiting placeholder (lib/rate-limit.ts)
5. Créer tables manquantes: categories, article_categories, likes, site_settings key/value, footer_links, mega_menu_items, landing_blocks, popup_campaigns, affiliate_links, clicks, conversions, payouts, notifications, push_subscriptions, service_requests avec enum exacte cahier, audit_log
6. Corriger matrice permissions: RC ne modère pas comments
7. Créer llms.txt + améliorer robots.txt avec arbitrage robots IA + balisage schema.org isAccessibleForFree
8. Tests: créer au moins 1 test Playwright critique (paywall + achat + abonnement 1re->2e échéance)
9. Final deploy Vercel + migration Supabase

On est à 60% → objectif 90% pour version finale.
