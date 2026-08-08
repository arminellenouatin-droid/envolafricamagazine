# RESUME COMPLET - Africa Awards - 11 Documents

## Consigne initiale (prioritaire)
- Finir volet Magazine/Kiosque (fait)
- 5 autres plateformes sur sous-domaines: Jobs, Marketplace, Crowdfunding, Africa Awards, World Africa Business
- Toutes utilisent même header, même footer, même paiement Moneroo, mêmes APIs, mêmes données Google login
- Attaquer maintenant volet Africa Awards déployé sur sous-domaine https://envolafricamagazine-o4sglwoo.vercel.app/africa-awards (prod: aa.envolafrica.net)
- Créer dossier Africa Awards et coder toute cette partie
- 11 documents à suivre, si un doc contredit consigne initiale (même header/footer/paiement/APIs/Google login, pas mélanger magazine et Awards), tenir compte de consigne initiale en priorité
- Tout mettre sur même projet Github, Supabase, Vercel ? -> OUI (voir ci-dessous)

## 00-INDEX-AGENT.md
- Ordre lecture obligatoire 00→09 avant code
- Règle absolue gouvernance: Seul Administrateur peut créer et lancer une compétition, Organisateur que demande - vérifier RLS, API, UI, tests
- Principes: ne jamais sauter section, pas de bouton non fonctionnel, loading/empty/error/success obligatoires, sécurité RLS avant terminé, design noir/or strict pas template générique, pas de nouvelle dépendance sans vérifier stack, commit fréquent, checklist fin phase, ambiguïté → option sûre style Airbnb/Uber/TikTok Live
- Definition of Done 8 critères: spec exacte, pages fonctionnelles, RLS, design desktop+mobile, 4 états, TS strict, commit branche, preview Vercel
- Liste 9 docs

## 01-STACK-ET-OUTILS.md
- Frontend: Next.js 14+ App Router, TS strict, Tailwind + shadcn/ui, lucide-react, Framer Motion, react-hook-form+zod, Recharts, Supabase Realtime, Zustand, next-intl
- Backend: Supabase (Postgres + Auth + Storage + Realtime + Edge Functions Deno) + Next.js Route Handlers/Server Actions
- Live: Mux (ou Agora) + Mux Player + replays webhook → Storage
- Paiement: Moneroo + webhook Edge Function vérif signature obligatoire
- Notifs: Web Push + FCM + Resend + Twilio optionnel
- Recherche: Postgres tsvector/pg_trgm V1, Algolia/Meilisearch V2+
- Infra: Vercel (frontend) + Supabase (3 env dev/staging/prod) + GitHub + GitHub Actions + Sentry + Vercel Analytics + PostHog + Vercel Env Vars + Supabase Vault
- Qualité: ESLint strict + Prettier + Vitest + Playwright + supabase gen types
- Interdictions: pas d'autre DB que Postgres/Supabase, pas d'hébergement autre que Vercel, pas de secrets en dur, pas de localStorage sensibles, pas d'auth uniquement frontend (toujours RLS), pas de UI non accessible, pas de paiement sans vérif signature webhook
- DECISIONS.md pour toute déviation stack

## 02-BASE-DE-DONNEES-SUPABASE.md (MANQUANT - à recevoir)
- Attendu: schéma SQL complet tables, relations, RLS

## 03-SECURITE.md
- Auth: Supabase Auth email/mdp + OAuth Google/Facebook, 12 caractères min, 2FA obligatoire admin/organizer/jury TOTP, sessions JWT courts + refresh + révocation dashboard, vérif email obligatoire avant vote/paiement
- Autorisation RBAC + RLS: rôle dans profiles.role jamais JWT modifiable sans re-vérif serveur, toute règle RLS pas seulement JS, changement rôle uniquement via admin_set_role()
- Gouvernance compétitions: aucun endpoint/Server Action/RPC ne permet autre que admin de créer/publier/changer statut, test Playwright + RLS organizer 403
- Paiements Moneroo zone très haut risque: vérif signature obligatoire, Edge Function service_role key, idempotence moneroo_transaction_id unique, payment_transactions puis vote/gift/donation, stats agrégées, aucune écriture vote/cadeau/don directe client, montants entiers centimes, audit_logs immuable, tests e2e paiement + double-webhook idempotence
- Anti-fraude: rate limiting Upstash Redis sur connexion/votes/cadeaux/création compte/demande compétition, détection pic anormal votes même IP/carte → file attente revue manuelle admin, CAPTCHA Cloudflare Turnstile sur inscription/demande compétition/candidature, jamais afficher nombre exact votes publiquement que classement relatif
- Sécu applicative: validation stricte entrées zod, CSRF Server Actions, headers CSP/X-Frame-Options/HSTS next.config/Vercel, upload fichiers validation MIME réel + taille + antivirus, pas de données sensibles en clair logs
- Confidentialité: CGU + politique confidentialité publiées avant launch, RGPD droit accès/rectif/suppression, lois locales paiements/concours, données paiement jamais stockées, minimisation données
- Live: URLs RTMP Mux jamais exposées client, uniquement animateur authentifié endpoint génère clé usage unique, modération comments filtre mots interdits + suppression + bannissement, limiter débit comments anti-spam
- Supervision: Sentry dès début frontend + Edge Functions, alertes taux échec paiement anormal, erreurs RLS répétées, pic créations compte même IP, audit_logs toute action sensible validation/refus demande, création/publication compétition, changement rôle, publication résultats
- Checklist prod: RLS 100% tables user, aucune clé secrète côté client/dépôt, webhooks Moneroo/Mux vérifiés signature, 2FA actif admin/orga/jury prod, tests Playwright accès non autorisé, CGU/politique publiées footer, Sentry alertes, rate limiting endpoints sensibles

## 04-SPECIFICATIONS-FONCTIONNELLES.md (20 modules)
- Rôles et gouvernance: admin seul crée/lance/modifie statut, organizer soumet demande et gère attribuée sans jamais créer/publier, tests 403
- Demande compétition: formulaire complet catégorie/titre/description/règlement/calendrier/récompenses/orga, statut visible Demande soumise non modifiable, notif auto changement statut, historique dashboard
- Création/config compétition admin: à partir demande validée pré-remplissage ou zéro, config complète catégorie/règlement/calendrier/prix vote/points/pondération vote/jury somme 100/cadeaux/dons/Capital Angel/nb gagnants/visibilité classement, progression tous statuts + retour arrière, attribution orga/animateurs/jury
- Candidature: formulaire complet bio/projet/photos min/max/vidéo/docs, statuts soumise/en étude/acceptée/refusée, admin+orga assigné étudient/valident/refusent, profil public auto généré, candidat complète/enrichit
- Vote payant: choix candidat/nb votes/paiement Moneroo, récap clair montant/nb votes/points, après webhook comptabilisation <5s + classement temps réel, échec message clair + pas comptabilisation, historique votes, nb exact votes jamais affiché publiquement
- Cadeaux virtuels: catalogue visible que pendant live, prix/animation/valeur points admin, envoi → paiement → webhook → animation temps réel tous spectateurs, historique
- Dons et cagnotte: 3 types soutien candidat/plateforme/augmentation cagnotte, cagnotte overlay live temps réel, Capital Angel startups objectif barre progression + liste investisseurs anonymat
- Jury et notation: grille notation configurable, notes/comments modifiables jusqu'à clôture délibération, classement final combine auto vote public/jury selon pondération admin, admin visualise détail calcul avant publication
- Récompenses: admin définit illimité types texte libre + montant/valeur, affichées compétition + résultats
- Sponsors et pub: admin associe sponsors logo/lien/desc, logos page compétition + overlay live, espaces pub bannière/pre-roll
- Live streaming: animateur démarre/arrête (clé RTMP sécurisée), overlay complet spectateurs/durée/cagnotte/classement top5 flèches, animateur invite/retire candidat, coupe micro/caméra, invite spectateur, annonce, arrêt → clôture auto votes + replay + extraits, modération active comments
- Statistiques: dashboard candidat votes/évolution/visiteurs/cadeaux/dons/revenus graphiques Recharts, organisateur revenus/participants/vues/taux participation, admin CA global/nb lives/users actifs/pays répartition export CSV
- Gamification: badges auto Premier Voteur/Super Donateur etc., niveaux Bronze→Diamant visible profil public, notif nouveau badge/niveau
- Découverte: recherche compétitions/candidats/organisateurs/catégories/pays <500ms, filtres combinables statut/catégorie/popularité, favoris 1 clic + notifs, classements globaux hors compétition maj quotidienne
- Réseaux sociaux: bouton partage fonctionnel lien direct + OG image correcte, liens sociaux profil candidat cliquables vérifiés
- Notifications intelligentes: système base notifications + temps réel Realtime + email Resend, chaque type événement testé
- Messagerie interne: candidats/orgas reçoivent messages/notifs importantes messagerie dédiée dashboard lu/non lu
- Affiliation: lien personnel unique, tracking inscriptions/votes/dons/partages/achats cadeaux via tracking + cookie/table conversions, dashboard gains détail
- Pages institutionnelles: À propos/Presse/Partenaires/Galerie/Centre aide entièrement rédigées, navigables footer
- Multilingue: FR/EN dès V1 next-intl, sélecteur header, toutes chaînes via traduction aucun texte en dur
- Non-régression: relancer suite Playwright couvrant 9 parcours critiques à chaque ajout fonctionnalité

## 05-PAGES-ROUTES-COMPOSANTS.md
- Convention routes Next.js App Router: (public)/, competitions, competitions/[slug], competitions/[slug]/live, competitions/[slug]/results, candidates/[id], rankings, about/press/partners/gallery/help/terms/privacy, (auth)/login/register/forgot-password/reset-password/verify-email, (app)/profile, my-votes, notifications, messages, apply/[competitionSlug], vote/[candidateId], affiliate, (candidate)/dashboard, (organizer)/dashboard/requests/new, requests, competitions/[id], (host)/dashboard/live/[id], (jury)/dashboard/scoring/[competitionId], (admin)/dashboard, requests, competitions/new (ADMIN UNIQUEMENT), competitions/[id]/edit, competitions/[id]/assign, users, payments, sponsors, ads, results/[competitionId]
- Middleware protection Supabase session + rôle → 403 explicite pas redirect silencieuse
- Composants transverses: Header (logo, nav, lang, recherche globale, notifs, menu user dashboard adapté rôle), Footer, LiveOverlay (haut/droite/bas/gauche + Realtime), VoteModal/GiftDrawer/DonationModal (Moneroo + états loading/success/failed), RankingList flèches animées Framer Motion, EmptyState/ErrorState/LoadingSkeleton (aucune page écran blanc), RoleGuard HOC vérif rôle
- Règle boutons/liens: 1 Actif fonctionnel, 2 Désactivé avec explication disabled+tooltip, 3 Masqué si rôle/état ne permet pas - jamais 4ème cliquable mais ne fait rien
- Checklist recette page: liens internes pas 404, boutons règle, mobile testée, loading/empty/error/success, titre/meta SEO, OG image, accessibilité

## 06-DESIGN-SYSTEM.md
- Palette: fond principal noir profond #0B0B0F mode sombre par défaut, anthracite #16161D, accent or #D4AF37 dégradé #F4D976→#B8892B, bleu profond #1B2A6B, texte blanc cassé #F5F3EE + gris chaud #A8A6A0, succès vert émeraude #1F9D6B, erreur rouge rubis #C23B3B, flèches verte/rouge animées
- Typo: titres serif/display prestige Playfair Display/Fraunces + texte/UI sans-serif Inter/General Sans, hiérarchie stricte H1/H2/H3/body/caption une fois tailwind.config.ts
- Composants signature: cartes bord fin doré hover + élévation shadow + image dégradé sombre, compteurs animés incrémentation, classement live flèches animées + transition Framer Motion layout, boutons primaires fond doré texte noir lueur dorée hover, overlay Live semi-transparent backdrop-blur, animations cadeaux scale+fade+rebond
- Responsive: mobile-first obligatoire (trafic Afrique mobile), Live réorganisation complète mobile overlay bas fixe + classement tiroir swipe up, tester 375/768/1440
- Accessibilité: contrastes AA, clavier shadcn/Radix, labels + aria-describedby
- Interdictions: pas dégradés violet/bleu IA générique, pas emoji seule iconographie (lucide-react), pas liste cartes identiques sans hiérarchie landing, pas police système Arial/Times, pas espaces vides à moitié faites
- Livrables: tailwind.config.ts tokens nommés, docs/design-tokens.md, Storybook optionnel

## 07-PARCOURS-UTILISATEURS.md
- Visiteur: / → /competitions/:slug → /candidates/:id → Voter → /login?redirect=/vote/:candidateId
- Spectateur inscrit: /profile + fav → /vote/:candidateId choix nb votes → paiement Moneroo → /my-votes statut succeeded + classement <5s → notif live 10min → /competitions/:slug/live commente/réagit + GiftDrawer animation + DonationModal cagnotte → alerte dépassé → revote → /competitions/:slug/results podium + replay
- Candidat: /apply/:competitionSlug formulaire complet → suivi statut dashboard → acceptée → complète profil public → dashboard temps réel votes/cadeaux/dons → live intervention sous animateur → après live classement final + stats + replay
- Organisateur: /organizer/dashboard/requests/new formulaire complet → soumission submitted → /organizer/dashboard/requests suivi → notif décision admin validée/refusée + motif → Test critique: tentative accès direct création compétition → 403 (aucune route n'existe côté organisateur) → si validée: /organizer/dashboard/competitions/:id gestion limitée → propose résultats finaux → validation admin jamais publiés directement
- Animateur: invitation → /host/dashboard/live/:id jour J démarre live clé RTMP sécurisée côté serveur → gère interventions invite/retire candidat, coupe micro/caméra, invite spectateur, annonces → arrête live → clôture auto votes + génération replay webhook Mux
- Jury: invitation validée admin → /jury/dashboard/scoring/:competitionId → note chaque candidat grille admin → après clôture live/votes → délibération → finalise notes → classement final calcul auto compute_final_ranking selon pondération
- Admin: /admin/dashboard/requests étudie demandes → valide/refuse motif → /admin/dashboard/competitions/new config complète → /admin/dashboard/competitions/:id/assign attribue orga/animateurs/jury → fait progresser statut cycle vie → suit /admin/dashboard stats globales + /admin/dashboard/payments → fin: /admin/dashboard/results/:competitionId valide publie officiellement résultats → archive → /gallery
- Paiement transverse critique: init paiement Moneroo → redirection/iframe → réussi → webhook Edge Function vérifie signature + idempotence moneroo_transaction_id unique → payment_transactions → vote/gift/donation → stats agrégées → notif temps réel → échec aucune écriture vote/cadeau/don message clair statut failed + double envoi webhook idempotence garantie contrainte unique

## 08-PLAN-DE-DEVELOPPEMENT-PHASES.md
- Phase 0 Fondations: repo GitHub privé Next.js App Router, TS strict ESLint Prettier Vitest Playwright, 3 projets Supabase + 3 env Vercel, env vars jamais en dur, design system 06 tokens Tailwind + shadcn/ui base, auth Supabase email/mdp+OAuth table profiles RLS base, middleware protection rôles, 1er déploiement Vercel minimal stylé → Checklist: auth bout en bout + preview auto PR + design system doc
- Phase 1 MVP gouvernance/compétitions/candidats/vote: tables competition_requests, competitions, competition_organizers, candidates, applications + RLS 02, dashboard admin validation demandes + création/config/publication + attribution orga, dashboard orga soumission demande + suivi + gestion candidats attribuée, pages publiques landing/liste/détail/profil candidat, formulaire candidature workflow validation, Moneroo vote payant webhook+Edge+idempotence, historique votes → Checklist: admin valide demande orga, crée/publie compétition, candidat postule/validé, spectateur vote/payé réel mode test, RLS orga ne peut pas créer compétition (test Playwright)
- Phase 2 Live/cadeaux/cagnotte/jury/replay: Mux ingestion/player/webhook asset ready, page Live complète overlay Realtime, dashboard animateur démarrage/arrêt + interventions + modération, catalogue cadeaux + envoi + anim temps réel, dons cagnotte + affichage temps réel, dashboard jury notation + calcul pondéré, replay auto + extraits, notifs intelligentes Realtime+Resend → Checklist: live complet bout en bout
- Phase 3 Engagement/découverte/monet avancée: sponsors/pub, badges/niveaux/profils enrichis, recherche/filtres/favoris/classements globaux, partage réseaux OG, affiliation complet, messagerie interne, stats avancées Recharts → Checklist: engagement testé + stats exactes
- Phase 4 Finitions/institutionnel/internationalisation: À propos/Presse/Partenaires/Galerie/Centre aide contenu réel, CGU/confidentialité, i18n FR/EN next-intl, accessibilité complet, sécu checklist 03, perf Lighthouse, tests charge vote/webhook → Checklist: Lighthouse >90, sécu 100%, live démo
- Suivi: rapport docs/rapports/phase-X.md fin chaque phase (livré, déviations + justification, tests + résultats, dette technique)

## 09-DEPLOIEMENT-CICD.md
- GitHub: dépôt privé africa-awards/platform, branches main prod, staging recette, feature/* dev, main+staging protégées PR + CI verte obligatoire, commits type(scope): description, PR avec description + screenshot/vidéo + DoD
- GitHub Actions CI: checkout/install/lint/typecheck/unit tests/build/e2e Playwright critiques (paiement, gouvernance compétition, live) - bloque merge si échec, suite complète sur push staging
- Vercel: connecté repo GitHub, Preview auto par PR, Prod=main, Staging=staging, env vars séparées par env (Supabase/Moneroo/Mux jamais partagées staging/prod), domaine custom prod + sous-domaine staging
- Supabase: 1 projet par env (dev local CLI, staging, production), migrations supabase migration new + db push versionnées supabase/migrations/, CI applique staging auto après merge staging, prod manuelle validée, backups PITR, gen types TS postinstall
- Secrets: SERVICE_ROLE Vercel server-only + Edge Functions secrets, NEXT_PUBLIC_SUPABASE_URL/ANON publiques OK, MONEROO_SECRET/WEBHOOK_SECRET Edge Function secrets, MUX_TOKEN_ID/SECRET Edge Function/Vercel server-only, RESEND/SENTRY/UPSTASH Redis Vercel server-only, aucun commité .env gitignore + .env.example
- Envs: Dev feature/* -> local preview + Supabase local/dev partagé, Staging -> Vercel staging + Supabase staging, Prod -> Vercel prod + Supabase prod
- Mise en prod: feature -> PR staging -> CI verte + recette visuelle -> merge staging -> deploy staging -> tests complets -> PR staging->main -> merge main -> deploy prod -> migrations prod manuelle validée -> vérif post-deploy Sentry/Lighthouse/vote test petit montant
- Monitoring: Sentry dashboard vérifié après chaque prod, Vercel Analytics + PostHog conversion vote/abandon/pics live, alertes email/Slack erreur/webhook paiement/live down

## Consigne prioritaire initiale (toujours primauté)
- 5 plateformes sous-domaines: Jobs, Marketplace, Crowdfunding, Africa Awards, WAB - toutes même header/footer/paiement Moneroo/APIs/Google login
- Africa Awards: créer dossier Africa Awards et coder toute partie, 11 docs à suivre
- Si doc contredit consigne initiale (même header/footer/paiement/APIs/Google login, pas mélanger magazine et Awards), tenir compte consigne initiale en priorité
- Tout sur même Github, Supabase, Vercel ? -> OUI, triptyque verrouillé GitHub+Vercel+Supabase + 2 projets Supabase Dev+Recette/Prod + 3 env Vercel

## MANQUE
- 02-BASE-DE-DONNEES-SUPABASE.md non reçu - schéma complet tables, relations, RLS
