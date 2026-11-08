# CHECKLIST MAÎTRESSE DE RECETTE ET LANCEMENT — ENVOL AFRICA
**Site de production :** `https://www.envolafrica.site` | **Dépôt :** `envolafricamagazine`  
**Statut global :** En cours (Phase 0 validée, préparation Phase 1)  
**Dernière mise à jour :** 08 Novembre 2026

---

## LÉGENDE DES STATUTS
- [ ] **À faire** : Vérification planifiée.
- [x] **Vérifié & Conforme** : Contrôle passé avec succès, preuve technique validée.
- [-] **Non applicable / Reporté** : Point documenté avec justification.

---

## PHASE 0 — INVENTAIRE COMPLET ET PRÉPARATION
- [x] **Cartographie complète** : Inventaire exhaustif des 121 pages frontend et 220 routes API généré dans `docs/audit-final/00-cartographie.md`.
- [x] **Recensement des données** : 200 tables Supabase et 66 migrations SQL inventoriées.
- [x] **Matrice des stockages** : Buckets Cloudflare R2 (`R2_BUCKET_PUBLIC`, `R2_BUCKET_PRIVATE`, `MAGAZINE_PRIVATE_BUCKET`) et Supabase Storage recensés.
- [x] **Webhooks recensés** : Moneroo (`/api/webhooks/moneroo`), Chariow (`/api/webhooks/chariow-pulse`), Agora (`/api/live/agora/webhook`), Google OAuth (`/api/auth/oauth/callback`).
- [x] **Matrice des secrets** : 60 variables d'environnement auditées (séparation stricte client/serveur).
- [x] **Checklist maîtresse** : Documentée et prête pour le suivi pas à pas (`docs/audit-final/CHECKLIST.md`).
- [x] **Vérification de parité** : Next.js 16.3.5 / React 19 / Turbopack / Vercel Production confirmé sur la branche `main`.
- [x] **Accord explicite du propriétaire** : Présentation du rapport Phase 0 et obtention du « OK » pour la Phase 1.

---

## PHASE 1 — SÉCURITÉ (PRIORITÉ ABSOLUE)
### 1.1 Authentification et Gestion des Sessions
- [x] Inscription email/mot de passe : validation stricte du format et force mot de passe (min 10 car.).
- [x] Connexion & déconnexion : session invalidée côté serveur, cookies `HttpOnly`, `Secure`, `SameSite=Lax`.
- [x] Réinitialisation de mot de passe : jetons à usage unique, expiration <= 1h, invalidation après usage.
- [x] Rate limiting actif sur les endpoints `/api/auth/*` (anti-brute-force).
- [x] Anti-énumération de comptes : messages d'erreur uniformes entre email inexistant et mot de passe invalide.
- [x] 2FA (Supabase MFA / TOTP) : fonctionnel avec validation stricte de code OTP.
- [x] Google Login & One Tap : double résolution sécurisée (serveur + repli client) sans perte de cookie PKCE.

### 1.2 Contrôle d'Accès & Supabase RLS (100% des Tables)
- [x] Vérification RLS activée (`ENABLE ROW LEVEL SECURITY`) sur les 200 tables du schéma `public`.
- [x] Révocation des droits par défaut (`REVOKE ALL ON ... FROM anon, authenticated`) sur toutes les tables sensibles (finances, wallets, retraits, logs, KYC, commissions).
- [x] Politiques minimales `USING` et `WITH CHECK` avec `(select auth.uid())`.
- [x] Test anti-IDOR : confirmation qu'un utilisateur A ne peut accéder à aucune ressource de l'utilisateur B.
- [x] Protection des 30 routes d'API d'administration (`/api/admin/*`) : double vérification session + rôle base.

### 1.3 Entrées Utilisateur, Injections & Uploads
- [x] Validation stricte de tous les schémas Zod côté serveur (zéro `any`, types et longueurs bornés).
- [x] Protection anti-XSS : sanitisation systématique du HTML riche via `sanitizeRichText` (DOMPurify).
- [x] Sécurisation des uploads Cloudflare R2 / Supabase Storage : URLs signées temporaires, types MIME vérifiés.

### 1.4 En-têtes HTTP, Secrets & Environnement
- [x] En-têtes HTTP de sécurité configurés (`CSP`, `HSTS`, `nosniff`, `frame-ancestors 'self'`).
- [x] `X-Robots-Tag: noindex, nofollow` actif sur toutes les routes privées, admins et dashboards.
- [x] Scan de secrets : aucun secret sensible dans le code source ni dans les composants client.

### 1.5 Flux Financiers, Affiliation & Moneroo
- [x] Webhook Moneroo : signature HMAC vérifiée avec `MONEROO_WEBHOOK_SECRET` en temps constant.
- [x] Idempotence financière : identifiant de transaction externe unique, webhook rejoué rejeté sans double crédit.
- [x] Transactions atomiques : écritures financières (crédit, débit, retrait) dans des transactions SQL uniques avec verrou `FOR UPDATE`.
- [x] Ledger comptable immuable : historique d'audit sans mise à jour ni suppression directe.
- [x] Retraits : seuil minimum de 10 000 XOF appliqué côté serveur, solde vérifié en base au moment du retrait.
- [x] Anti-fraude affiliation : pas d'auto-parrainage, détection de boucle, calcul exact de l'arbre MLM 5x5 restreint au Magazine.
- [x] Votes Africa Awards : vote bloqué sans paiement confirmé, comptage atomique sous forte charge.
- [x] Messagerie interne : règle anti-contournement (blocage numéros/liens externes) appliquée côté serveur.

---

## PHASE 2 — PERFORMANCE ET RAPIDITÉ
- [x] Core Web Vitals : LCP < 2,5s, INP < 200ms, CLS < 0,1, TTFB < 0,8s sur mobile 4G lente.
- [x] Optimisation des images : `next/image`, formats WebP/AVIF auto, priority sur LCP, dimensions explicites (zéro CLS).
- [x] Polices : affichage optimisé `swap`, élimination des balises de polices externes non optimisées.
- [x] Code splitting & imports dynamiques : Agora SDK (`await import`), Recharts (`VotesBarChart`), PreviewFlipbook chargés en lazy-loading.
- [x] Rendu optimisé : parallélisation `Promise.all()` sur les Server Components, cache Vercel Edge configuré (`max-age=31536000`).
- [x] Vidéos : chargement paresseux, attributs `preload="none"`, affichage de `poster`, absence d'autoplay sonore.

---

## PHASE 3 — RESPONSIVITÉ ET COMPATIBILITÉ MULTI-ÉCRANS
- [x] Tests aux résolutions : 320px, 360px, 390px, 414px, 768px, 1024px, 1280px, 1536px.
- [x] Compatibilité : Chrome Mobile (Android), Safari iOS (hauteur viewport 100dvh, safe-area), Firefox Mobile.
- [x] Zéro débordement horizontal (`w-screen` supprimé, `overflow-x: hidden` sur conteneurs racine).
- [x] Cibles tactiles conformes : boutons et liens `BottomNav` >= 56x56 px (> 44x44 px WCAG).
- [x] Ergonomie mobile : navigation par onglets `BottomNav` active, `pb-16 md:pb-0` sur `<main>`.
- [x] Clavier virtuel mobile : normalisation des polices des champs à 16px (`text-base md:text-*`), zéro zoom involontaire iOS.

---

## PHASE 4 — SEO TECHNIQUE, GEO ET PARTAGE SOCIAL
- [x] Balises `<title>` uniques (50-60 car.) et `<meta description>` (140-160 car.) sur chaque page.
- [x] Structure Hn stricte : un seul `<h1>` par page, hiérarchie logique.
- [x] URLs canoniques unifiées vers `https://www.envolafrica.site` (zéro dispersion).
- [x] `sitemap.xml` dynamique et complet pour tous les contenus publics (articles, magazines, offres, produits, projets, compétitions).
- [x] `robots.txt` optimisé (exclusion des routes privées, dashboards et admins, accueil GPTBot, ClaudeBot, etc.).
- [x] Données structurées Schema.org JSON-LD (NewsMediaOrganization, WebSite, NewsArticle paywall, Book, Product, JobPosting).
- [x] Optimisation GEO / AEO : fichiers `/llms.txt` et `/llms-full.txt` configurés avec attributions et URLs canoniques.

---

## PHASE 5 — DESIGN UI/UX : CHASSE AU « LOOK IA » & HARMONISATION
- [ ] Zéro police d'icônes textuelle : 100% des icônes converties en SVG inline (`SvgIcon`).
- [ ] Suppression des emojis en guise d'icônes d'interface.
- [ ] Élimination des dégradés violet/bleu génériques et des ombres excessives.
- [ ] Réécriture des formulations robotiques (« Révolutionnez... », « Découvrez la puissance... ») vers un français concret et professionnel.
- [ ] Harmonisation totale de la charte de référence Magazine/Kiosque sur l'ensemble des 7 volets.
- [ ] Composants d'interface unifiés avec tous leurs états (normal, survol, actif, focus visible, désactivé, chargement, erreur, vide).
- [ ] Respect de `prefers-reduced-motion` pour toutes les animations.

---

## PHASE 6 — WAB : REFONTE PROFESSIONNELLE « STYLE LINKEDIN »
- [ ] Mise en page desktop 3 colonnes (Profil & raccourcis / Fil d'actualité & publication / Suggestions & opportunités).
- [ ] Navigation mobile `BottomNav` (Accueil, Réseau, Publier, Notifications, Opportunités).
- [ ] Carte de publication LinkedIn-like : en-tête avec avatar, badge vérifié, bouton Suivre, menu actions.
- [ ] Barre d'actions J'aime / Commenter / Partager / Enregistrer 100% en SVG inline.
- [ ] Likes optimistes instantanés, anti-double-clic, mise à jour des compteurs sans rechargement.
- [ ] Menu de partage complet (WhatsApp, LinkedIn, Facebook, X, Copie lien, API native mobile).
- [ ] Lecteur vidéo vertical plein écran avec boutons d'actions superposés en SVG inline.
- [ ] Espace Créateurs (`/wab/createur`) : métriques réelles, conditions de monétisation claires, aucun chiffre fictif.
- [ ] Salons audio/vidéo Agora (`/salons`) : chat en direct, montée sur scène, live shopping.

---

## PHASE 7 — RECETTE FONCTIONNELLE BOUT EN BOUT (TOUS VOLETS)
- [ ] Google Login + One Tap : correction définitive de la connexion de nouveaux comptes (origines JS, redirection Supabase, trigger profil).
- [ ] Magazine & Kiosque : lecture fluide, liseuse Flipbook, paywall page 8 rigoureusement étanche.
- [ ] Marketplace : tunnel acheteur (panier, paiement Mobile Money XOF, suivi de commande) et espace vendeur (création produit, retraits).
- [ ] Jobs : publication d'offres, candidatures, filtrage, messagerie protégée.
- [ ] Crowdfunding : création de campagne, contributions par Mobile Money, suivi des objectifs.
- [ ] Africa Awards : inscriptions candidats, votes payants XOF atomiques, lives Agora en haute résilience.
- [ ] Affiliation MLM 5x5 : inscription par lien de parrainage, calcul des commissions, affichage total global (détail volets réservé admin).
- [ ] Régie Publicitaire : création de campagne, affichage non intrusif, mesure exacte des impressions/clics.
- [ ] Pages d'erreur personnalisées dans la charte : 404, 500, 403, 401, hors-ligne.

---

## PHASE 8 — EXPÉRIENCE UTILISATEUR & CONVERSION (CRO)
- [ ] Test des 5 secondes sur la page d'accueil (proposition de valeur immédiate, CTA principal visible sans scroll).
- [ ] Onboarding utilisateur en moins de 60 secondes.
- [ ] Jamais d'état vide austère : suggestions et contenus d'accueil soignés.
- [ ] Maillage interne inter-volets fluide et engageant.
- [ ] Badges de confiance, réassurance paiement sécurisé Mobile Money, politique de remboursement et FAQ visibles.
- [ ] Relecture intégrale des textes en français professionnel adapté au public africain.

---

## PHASE 9 — ACCESSIBILITÉ, LÉGAL & FIABILITÉ
- [ ] Conformité WCAG 2.2 AA : contrastes de couleurs, focus visible au clavier, attributs `aria-label` sur tous les boutons SVG.
- [ ] Formulaires accessibles avec étiquettes explicites et annonces d'erreurs en direct.
- [ ] Bandeau de cookies conforme : aucun traceur activé avant le consentement explicite.
- [ ] Documents légaux complets et accessibles : Mentions légales, Politique de confidentialité, CGU/CGV, Conditions d'affiliation.
- [ ] Surveillance des erreurs et alertes en production.
- [ ] Procédure de retour arrière (rollback) validée sur Vercel.

---

## PHASE 10 — RECETTE FINALE & RAPPORT DE LANCEMENT
- [ ] Lint, typecheck et build Vercel 100% verts sans warning bloquant.
- [ ] Audit de sécurité final (zéro vulnérabilité critique/haute).
- [ ] Vérification stricte : aucune donnée de test, aucun compte fictif, aucun « Lorem ipsum » en production.
- [ ] Rapport final complet documenté dans `docs/audit-final/RAPPORT-FINAL.md`.
- [ ] Émission du verdict formel : **GO / NO-GO** pour l'ouverture publique.
