# Audit technique complet — Envol Africa Magazine

**Date d’audit :** 15 août 2026  
**Référentiel analysé :** dépôt GitHub `envolafricamagazine` dans son état de travail local  
**Périmètre :** design, UX, fonctionnalités, architecture, sécurité, qualité, performance, SEO/GEO/IA, données, paiements, déploiement et compatibilité des ajouts Jobs/WAB.  
**Méthodes utilisées :** lecture de la structure et des fichiers applicatifs, inventaire des routes/API, vérification TypeScript, build de production Next.js, audit de dépendances, inspection des configurations SEO et de sécurité.

> Cet audit est un audit de code et de build. Il ne remplace pas un pentest externe, une analyse de trafic réel (Core Web Vitals/RUM), une revue des réglages Supabase/Vercel/Moneroo, ni une recette manuelle dans l’environnement de production.

---

## 1. Synthèse exécutive

Le projet est une application Next.js ambitieuse et déjà très riche : Magazine, Kiosque, compte, abonnements, paiements, affiliation, Africa Awards, crowdfunding, ainsi que les ajouts Jobs et WAB. Le build de production est actuellement **réussi** : Next.js génère **119 pages/routes** et TypeScript termine sans erreur.

Cependant, le projet n’est pas encore prêt pour une mise en production financière à grande échelle sans phase de durcissement. Les principaux risques sont :

1. **Critique — secrets présents dans `.env.example`** : ce fichier contient des valeurs qui ressemblent à des clés Moneroo et à des chaînes de connexion PostgreSQL/Supabase. Elles doivent être considérées comme compromises et tournées/remplacées immédiatement.
2. **Critique — persistance locale JSON** : une partie majeure de l’application historique, ainsi que Jobs/WAB pendant leur construction, utilise des fichiers JSON et `fs`. Ceci n’est pas une persistance fiable sur Vercel serverless. Le basculement complet vers Supabase est indispensable avant production.
3. **Élevé — secret JWT par défaut codé dans le code** : si la variable Vercel manque, les jetons sont signés avec une valeur prévisible.
4. **Élevé — protection webhook Moneroo incomplète** : une signature absente n’est pas rejetée lorsque le secret est configuré ; le webhook ne revalide pas systématiquement le paiement auprès de Moneroo avant livraison ; il faut ajouter une idempotence durable côté base.
5. **Élevé — politiques HTTP trop permissives** : `X-Frame-Options: ALLOWALL` et `Content-Security-Policy: frame-ancestors *` autorisent l’intégration du site par tout tiers et augmentent le risque de clickjacking.
6. **Élevé — absence de tests automatisés et de CI** : aucun test Vitest/Playwright ni workflow GitHub Actions n’a été détecté. La non-régression est donc manuelle aujourd’hui.
7. **Important — qualité de code** : `npm run lint` échoue actuellement avec **380 erreurs et 109 avertissements** ; le build passe parce que le lint n’est pas un bloqueur du build.
8. **Important — SEO incomplet/incohérent** : sitemap statique très limité, peu de métadonnées par page, aucune génération dynamique d’articles, pas de balisage JSON-LD détecté, et domaines canoniques à confirmer.

### Évaluation synthétique

| Domaine | État | Évaluation | Commentaire |
|---|---:|---:|---|
| Build Next.js / TypeScript | ✅ | Bon | Build production réussi ; 119 routes générées. |
| Fonctionnalités métier | ⚠️ | Avancé | Nombreux volets ; certaines fonctions reposent sur données de démonstration/locales. |
| Design / expérience | ⚠️ | Bon potentiel | Identité visuelle présente, mais cohérence, responsive et accessibilité à consolider. |
| Sécurité | 🔴 | À durcir | Secrets, JWT par défaut, webhook, headers et rate limit à corriger avant production. |
| Paiement | ⚠️ | Partiel | Intégration Moneroo centralisée ; webhook et persistance transactionnelle à finaliser. |
| Données / Supabase | 🔴 | Bloquant pour production | Migration et adoption complète Supabase indispensables. |
| SEO classique | ⚠️ | Partiel | robots/llms présents ; métadonnées, sitemap et schema.org incomplets. |
| SEO IA / GEO | ⚠️ | Bon début | `llms.txt` et règles robots IA présents ; contenu, JSON-LD et politique à finaliser. |
| Performance | ⚠️ | À mesurer et optimiser | Build fonctionnel ; 52 balises `<img>`, services tiers et composants lourds. |
| Tests / observabilité | 🔴 | Insuffisant | Absence de suite E2E, CI, monitoring et alertes applicatives. |
| Compatibilité Jobs/WAB | ⚠️ | Compatible si méthode suivie | Ajouts isolés ; migration/paiement/webhook doivent être finalisés avant déploiement. |

---

## 2. Résultats des contrôles exécutés

### 2.1 Build de production

Commande exécutée :

```bash
npm run build
```

**Résultat : succès.**

- Prisma Client généré ;
- compilation Next.js réussie ;
- TypeScript réussi ;
- 119 pages/routes générées ;
- toutes les routes recensées par le build ont été compilées.

Le build produit toutefois un avertissement : la version Node utilisée pour l’audit est Node 20 alors que des versions futures de `@supabase/supabase-js` nécessitent Node 22 ou plus.

**Recommandation :** configurer Vercel et le projet sur Node 22 LTS (`engines.node` dans `package.json` et réglage Vercel).

### 2.2 Lint

Commande exécutée précédemment :

```bash
npm run lint
```

**Résultat : échec — 380 erreurs, 109 avertissements.**

Principaux motifs observés :

- `any` explicites très nombreux ;
- JSX avec apostrophes/guillemets non échappés ;
- navigation interne via `window.location.href` au lieu du routeur Next ;
- imports CommonJS (`require`) dans les scripts ;
- règles React d’immutabilité ;
- images `<img>` non optimisées ;
- variables inutilisées.

**Impact :** le code build, mais la dette de qualité et le risque de bugs lors de futures évolutions sont élevés. Le lint doit devenir bloquant avant fusion sur `main`.

### 2.3 Audit des dépendances

```bash
npm audit --omit=dev
```

Résultat : **1 vulnérabilité élevée** détectée dans une dépendance transitive `nanoid` (< 3.3.18), liée à une possibilité de boucle dans certains générateurs custom de taille nulle.

**Recommandation :** mettre à jour le verrouillage de dépendances avec une mise à jour ciblée (`npm audit fix` après revue, ou `overrides`), puis reconstruire et tester.

### 2.4 Tests automatisés et CI

Aucun fichier de test, configuration Playwright/Vitest ni workflow GitHub Actions n’a été détecté.

**Impact :** aucun filet de non-régression automatique ne protège actuellement Magazine, Kiosque, Awards, Crowdfunding, Marketplace, Jobs ou WAB.

---

## 3. Inventaire fonctionnel du projet existant

L’application contient environ 10 000 lignes TypeScript/TSX, une centaine de routes et plusieurs sous-domaines fonctionnels.

### 3.1 Magazine et éditorial

Fonctions observées :

- accueil éditorial riche ;
- catégories, articles, articles premium et paywall ;
- article détaillé ;
- commentaires, favoris, likes ;
- recherche ;
- administration d’articles et de magazines ;
- audio et images prévus sur les articles ;
- popup promotionnel ;
- header/footer communs.

**Forces :** identité éditoriale forte, composants réutilisables (`Header`, `Footer`, `HeroSections`), paywall serveur partiellement prévu.

**Points d’attention :** métadonnées article insuffisantes, images externes non optimisées, modèle de données JSON de secours, responsabilités concentrées dans de gros composants.

### 3.2 Kiosque et commerce

Fonctions observées :

- catalogue de magazines ;
- fiche magazine ;
- choix de format/langue ;
- panier `localStorage` ;
- commande et paiement Moneroo ;
- téléchargement signé ;
- espace achats.

**Forces :** parcours achat complet dans l’architecture ; gestion de format/langue ; endpoint de téléchargement signé.

**Risques :** la commande/paiement utilise encore le stockage local JSON en fallback ; validation de panier et identité de prix doivent être totalement serveur/Supabase ; la livraison et les téléchargements doivent être retestés en production.

### 3.3 Authentification, compte et rôles

Fonctions observées :

- inscription/connexion avec bcrypt et JWT ;
- cookie HTTP-only ;
- gestion de rôle ;
- espace compte, abonnements, achats, dons, favoris, parrainage ;
- page 2FA.

**Forces :** mots de passe hashés ; cookie HTTP-only ; fonctions RBAC présentes ; séparation de rôle dans `rbac.ts`.

**Risques :** JWT secret de secours codé ; pas de verrouillage progressif/rate limit durable ; la 2FA doit être vérifiée fonctionnellement ; l’authentification custom est distincte de Supabase Auth, ce qui complexifie RLS/SSO.

### 3.4 Moneroo, dons, abonnement et affiliation

Fonctions observées :

- helper commun `src/lib/moneroo.ts` ;
- initialisation paiement ;
- vérification ;
- webhook ;
- dons ;
- affiliation et demande de retrait ;
- abonnements.

**Forces :** un seul client Moneroo centralisé, métadonnées de paiement, webhook déjà présent, logique de commission.

**Risques :** voir section sécurité/paiement ; le webhook doit être le point d’autorité, idempotent, transactionnel et connecté à Supabase.

### 3.5 Africa Awards

Fonctions observées :

- pages publiques de compétitions ;
- candidats, votes, jurys, résultats et classements ;
- dashboards candidat, organisateur, hôte et administration ;
- partenaires, presse, règlement, aide, messages et affiliation.

**Forces :** couverture fonctionnelle large ; structure de routes riche.

**Risques :** données à vérifier en production, images de démonstration externes, tests E2E prioritaires pour vote, jury, paiement et permissions.

### 3.6 Crowdfunding

Fonctions observées :

- projets ;
- espace porteur et investisseur ;
- documents ;
- messagerie ;
- remboursements ;
- dashboards ;
- investissements et suivi.

**Forces :** parcours fonctionnel très étendu.

**Risques :** domaine sensible financier : persistance locale/JSON et absence de tests automatisés constituent un risque majeur. Vérifier KYC, documents, calculs, intérêts, échéanciers, permissions et traçabilité avant toute ouverture réelle.

### 3.7 Marketplace

État observé :

- route Marketplace existante ;
- page principalement présentée comme « bientôt disponible » dans la version actuelle analysée.

**Conclusion :** le module Marketplace est à traiter comme un volet distinct ; les fonctionnalités WAB ne doivent pas modifier son fonctionnement actuel. L’intégration future de produits boostés doit passer par une API/événement explicite, pas par un couplage de données direct.

### 3.8 Jobs — ajout en cours

Ajouts isolés détectés :

- landing, filtres, scroll infini ;
- offres et candidatures ;
- décryptage, abonnements, boosts ;
- dashboard candidat/employeur ;
- modération ;
- CV privé ;
- géolocalisation et personnalisation ;
- migrations `jobs_*`.

**État :** compilation valide, mais les données sont encore dans un stockage temporaire local tant que la migration Supabase n’est pas appliquée et que les routes n’ont pas été entièrement basculées.

### 3.9 World Africa Business — ajout en cours

Ajouts isolés détectés :

- profil professionnel ;
- fil, publication, scroll infini ;
- commentaires, réactions, signalements ;
- médias privés et modération ;
- créateurs/récompenses ;
- boost ;
- Salons ;
- recherche, suivi de profils, notifications ;
- migrations `wab_*`.

**État :** compilation valide, mais comme Jobs, la persistance finale Supabase, l’activation webhook et la recette sont indispensables avant mise en production.

---

## 4. Audit design, UX et accessibilité

### 4.1 Forces

- identité de marque cohérente : bleu marine, rouge, beige, vert/jaune de contextualisation ;
- composition éditoriale riche ;
- header global complet, menus, panier, bascule de thème ;
- composants dédiés aux sections d’accueil ;
- responsive Tailwind présent dans la majorité des pages ;
- WAB et Jobs disposent de structures desktop/mobile récentes et lisibles.

### 4.2 Problèmes et recommandations design/UX

| Priorité | Constat | Risque | Recommandation |
|---|---|---|---|
| Haute | Grande hétérogénéité de styles et de composants entre volets | Expérience fragmentée, maintenance difficile | Créer un mini design system : boutons, cartes, champs, badges, modales, états d’erreur et vide. |
| Haute | Plusieurs interfaces sont encore des démos/maquettes avec texte ou images de placeholder | Baisse de confiance et conversion | Établir un registre de contenu de production, images, textes, états vides et erreurs. |
| Haute | Beaucoup de formulaires n’affichent pas toujours l’erreur au champ concerné | Friction et abandon | Validation client + serveur cohérente, résumé accessible, focus sur le premier champ invalide. |
| Moyenne | Navigation WAB/Jobs non pleinement reliée au header global | Découvrabilité limitée | Ajouter seulement après recette les liens vers dashboard, profil, campagnes et Salons. |
| Moyenne | Absence d’audit a11y automatisé | Risque clavier/lecteur d’écran | Ajouter axe-core/Playwright, labels systématiques, focus visible, ARIA sur menus/modales. |
| Moyenne | Plusieurs boutons peuvent être visibles sans retour d’état riche | Confusion | États `loading`, `success`, `pending`, `failed`, et notifications unifiées. |
| Moyenne | Libellés d’administration parfois techniques (`pending_review`, `published`) | UX administration pauvre | Utiliser des libellés localisés et une couleur/explication métier. |

### 4.3 Accessibilité

Points positifs : certains labels/formulaires sont présents, contrastes généralement lisibles.

Points à vérifier/corriger :

- texte alternatif des images : plusieurs `alt=""` sont utilisés pour des images non décoratives ;
- navigation clavier du mega-menu, des dropdowns et des modales ;
- piège de focus dans les menus mobiles ;
- rôle, nom et état des boutons icônes ;
- hiérarchie de titres (`h1` unique, sections `h2`, etc.) ;
- messages asynchrones annoncés par lecteur d’écran (`aria-live`) ;
- contraste réel du texte gris sur fond clair ;
- tables et KPI administratifs accessibles.

---

## 5. Audit sécurité détaillé

### 5.1 Secrets et configuration — CRITIQUE

Le fichier `.env.example` contient des valeurs qui ressemblent à :

- clé Moneroo ;
- URL de connexion PostgreSQL avec mot de passe ;
- clés Supabase.

Même si certaines peuvent être des valeurs de démonstration, elles doivent être traitées comme exposées parce que le dépôt est GitHub.

**Actions immédiates :**

1. Révoquer/faire tourner toutes les clés potentiellement réelles : Moneroo, PostgreSQL, Supabase service role, JWT, secret webhook ;
2. supprimer toutes les valeurs sensibles du fichier versionné ;
3. ne laisser que des placeholders explicites : `CHANGE_ME`, `your_key_here` ;
4. vérifier l’historique Git, puis utiliser l’outil de purge Git si une clé réelle a été committée ;
5. configurer les nouvelles valeurs uniquement dans Vercel/Supabase/Moneroo ;
6. activer des alertes de secrets GitHub.

### 5.2 JWT et authentification — ÉLEVÉ

`src/lib/auth.ts` utilise un secret JWT de secours codé. `src/lib/download.ts` dérive également un secret de téléchargement de ce fallback.

**Risque :** si `JWT_SECRET` est absent dans Vercel, un attaquant peut signer des jetons valides.

**Recommandation :** faire échouer le démarrage en production si `JWT_SECRET` est absent. Utiliser un secret aléatoire long, distinct pour les téléchargements si nécessaire, rotation documentée, durée de vie réduite et mécanisme d’invalidation.

### 5.3 Headers HTTP / clickjacking — ÉLEVÉ

`next.config.ts` applique :

```text
X-Frame-Options: ALLOWALL
Content-Security-Policy: frame-ancestors *
```

**Risque :** le site peut être intégré dans une iframe hostile, avec risque de clickjacking, notamment pour paiements, administration et authentification.

**Recommandation :**

- par défaut : `frame-ancestors 'self'` ;
- supprimer `X-Frame-Options: ALLOWALL` ;
- autoriser uniquement les hôtes réellement nécessaires, éventuellement conditionnellement pour la Preview Arena ;
- ajouter CSP complète : `default-src`, `script-src`, `style-src`, `img-src`, `connect-src`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.

### 5.4 Webhook Moneroo — ÉLEVÉ

Points constatés :

- signature HMAC calculée ;
- comparaison timing-safe présente ;
- **signature manquante seulement avertie, pas rejetée, lorsque le secret existe** ;
- le code commente la revalidation Moneroo mais ne l’applique pas ;
- l’idempotence n’est pas garantie par une contrainte durable de base ;
- le webhook écrit dans le JSON local ;
- Jobs/WAB sont aujourd’hui vérifiés par des routes de retour client, à remplacer/compléter par webhook serveur.

**Recommandation :**

1. en production, rejeter tout webhook sans signature valide ;
2. vérifier le paiement via l’API Moneroo avant tout changement métier ;
3. stocker `provider_payment_id` avec contrainte unique dans Supabase ;
4. traiter le webhook dans une transaction ;
5. utiliser les métadonnées pour router : `order`, `jobs_offer_unlock`, `jobs_subscription`, `jobs_boost`, `wab_boost` ;
6. journaliser le payload, l’état, l’horodatage et la signature ;
7. tester livraison double, ordre inversé, annulation et fraude.

### 5.5 Rate limit, anti-bruteforce et validation — ÉLEVÉ

Un fichier `rate-limit.ts` existe, mais utilise un `Map` en mémoire, non partagé entre instances Vercel et non durable. Il n’est pas appliqué uniformément aux endpoints sensibles.

Les schémas Zod existent, mais ils ne sont pas appliqués à toutes les routes, notamment les ajouts Jobs/WAB et plusieurs endpoints historiques.

**Recommandation :**

- Upstash Redis ou Vercel KV pour rate limit distribué ;
- rate limit strict pour login, inscription, reset, 2FA, paiement, upload, commentaires, vues, votes et recherches ;
- appliquer Zod à toutes les entrées API ;
- limitation de taille de payload et de fichiers ;
- anti-bot/Turnstile sur authentification et formulaires publics ;
- verrouillage progressif des comptes et journal de sécurité.

### 5.6 Autorisation et RBAC — IMPORTANT

Le fichier `rbac.ts` donne une bonne base. Toutefois, une inspection automatique montre des API publiques ou à contrôle variable, notamment crowdfunding et certains endpoints Awards.

**Recommandation :** revue route par route avec matrice de permissions ; tests 401/403 systématiques ; aucune décision d’autorisation uniquement côté client ; `admin`, `gerant`, rédacteur, jury, candidat, porteur et investisseur à vérifier.

### 5.7 Stockage et documents — IMPORTANT

Les CV Jobs et médias WAB ont été préparés avec buckets privés et URLs signées, ce qui est la bonne direction. À finaliser :

- vérifier les migrations/buckets réellement créés ;
- scanner antivirus des documents ;
- vérifier MIME réel et extension ;
- supprimer les fichiers orphelins ;
- fixer rétention et taille maximale ;
- journaliser les téléchargements ;
- ne jamais afficher un chemin Storage brut.

### 5.8 Données locales JSON / serverless — CRITIQUE POUR LA PRODUCTION

Les fichiers `src/data/db.json`, `awards.json`, `crowdfunding.json`, ainsi que les nouveaux magasins locaux Jobs/WAB servent de base/fallback. Vercel serverless ne garantit pas l’écriture persistante du système de fichiers entre invocations et instances.

**Conséquence :** paiements, commandes, votes, candidatures, messages ou statuts peuvent être perdus/incohérents si le JSON est utilisé en production.

**Recommandation impérative :** Supabase/PostgreSQL devient la source de vérité avant activation réelle. Les JSON restent uniquement seeds/démos locales.

### 5.9 Données personnelles et conformité

Le projet traite : identité, e-mail, téléphone, CV, documents d’identité crowdfunding, paiements, candidatures et potentiellement données KYC.

À compléter :

- politique de confidentialité réellement cohérente avec les traitements ;
- consentement cookies/analytics ;
- durée de conservation ;
- export/suppression de données ;
- registre des sous-traitants ;
- procédures incident et droits d’accès ;
- chiffrement/accès aux documents KYC ;
- contrats et mentions légales appropriées aux pays ciblés.

---

## 6. Paiement et commerce

### État

- intégration Moneroo centralisée : bonne base ;
- panier et commandes : présents ;
- abonnements, dons, affiliation : présents ;
- Jobs/WAB réutilisent le helper partagé.

### Défauts / risques

- mode mock possible si clé Moneroo absente ; à interdire en production ;
- prix et contenu du panier doivent être recalculés serveur depuis les données de référence ;
- transitions de commande doivent être transactionnelles ;
- mécanisme Jobs/WAB encore basé sur retour client de vérification avant intégration webhook complète ;
- conformité des méthodes Moneroo et URLs de retour à vérifier avec le compte réel ;
- actions asynchrones (téléchargement, abonnements, boosts) nécessitent une idempotence stricte.

### Recommandations

- variable `NODE_ENV=production` : jamais de fallback mock ;
- prix uniquement côté serveur ;
- webhooks transactionnels Supabase ;
- trace d’audit par paiement ;
- rapprochement quotidien Moneroo/Supabase ;
- tests e2e sandbox puis tests de faible montant réel ;
- messages client explicites sur `pending`, `paid`, `failed`, `cancelled`.

---

## 7. Performance et temps de chargement

### Constats

- build de production fonctionnel, environ quatre minutes dans l’environnement d’audit ;
- 52 balises `<img>` détectées dans `src` ;
- nombreuses images Unsplash externes ;
- Google Fonts, Google Material Symbols et `ipapi.co` chargés au runtime ;
- `Header.tsx` est un gros composant client (383 lignes), rendu global sur toutes les pages ;
- polling du panier toutes les secondes dans le header ;
- `ipapi.co` est sollicité par le navigateur ;
- plusieurs gros composants et pages sont majoritairement client-side ;
- aucun rapport Lighthouse, WebPageTest ou Core Web Vitals réel n’est disponible dans le dépôt.

### Risques

- LCP dégradé par images externes non optimisées ;
- dépendance au réseau tiers pour les polices et la géolocalisation ;
- JavaScript global inutile pour certaines pages ;
- coût/latence en Afrique mobile ;
- scroll infini pouvant croître sans limites/virtualisation ;
- polling inefficace du panier ;
- build long.

### Recommandations prioritaires

1. Remplacer les `<img>` non décoratives par `next/image` ;
2. stocker/optimiser les images pertinentes via Supabase Storage ou CDN ;
3. définir tailles, `sizes`, formats WebP/AVIF et lazy-load ;
4. utiliser `next/font` ou auto-héberger les polices principales ;
5. remplacer le polling panier par un événement/état partagé ;
6. déplacer la géolocalisation côté serveur/Vercel headers avec cache ;
7. scinder `Header` et lazy-loader les sous-menus lourds ;
8. mesurer Lighthouse mobile sur réseau lent ;
9. mettre en place Vercel Analytics/Speed Insights ou équivalent privacy-friendly ;
10. surveiller LCP, INP, CLS et erreurs JS réelles.

Objectifs initiaux recommandés :

```text
LCP < 2,5 s (75e percentile mobile)
INP < 200 ms
CLS < 0,1
JS initial réduit au minimum par page
```

---

## 8. SEO, indexation et référencement IA (GEO/AEO)

### 8.1 Éléments existants positifs

- `public/robots.txt` présent ;
- `public/sitemap.xml` présent ;
- `public/llms.txt` présent ;
- meta globale dans `src/app/layout.tsx` ;
- metadata ajoutée sur Jobs et WAB ;
- intention de paywall Google documentée dans robots/llms ;
- contenu éditorial riche, thématique africaine identifiable.

### 8.2 Problèmes SEO constatés

| Priorité | Constat | Impact | Recommandation |
|---|---|---|---|
| Haute | Sitemap statique ne contient que 5 URLs | Pages clés, articles, Awards, Jobs/WAB non découverts | Générer un sitemap dynamique via `app/sitemap.ts`, segmentation articles/kiosque/jobs/wab. |
| Haute | Domaine dans robots/sitemap/llms : `envolafricamag.com`, alors que l’URL fournie est Vercel | Canonical/indexation incohérente si domaine non finalisé | Définir un seul domaine de production, `metadataBase`, canonical et redirections. |
| Haute | Métadonnées spécifiques très limitées | Titres/descriptions identiques ou absents sur nombreux parcours | `generateMetadata` pour article, magazine, Awards, Jobs/WAB, profils et Salons. |
| Haute | Aucun JSON-LD détecté | Moins de compréhension Google/IA et rich results | Ajouter `NewsArticle`, `Organization`, `WebSite`, `BreadcrumbList`, `Product`, `Event`, `JobPosting`, `ProfilePage`. |
| Haute | Articles/données dynamiques absents du sitemap | Indexation faible | Publication automatique dans sitemap + `lastModified`. |
| Moyenne | `robots.txt` contient une politique IA « en attente » | Politique ambiguë | Valider la stratégie et documenter le choix définitif. |
| Moyenne | `llms.txt` est une bonne base mais comporte des promesses non vérifiées | Risque de contenu obsolète | Le générer à partir des données réelles/documenter les capacités réellement actives. |
| Moyenne | Pas de preuves de Search Console/Bing Webmaster | Indexation non pilotée | Connecter les outils, soumettre sitemap, contrôler couverture/erreurs. |
| Moyenne | Pas de hreflang généré | Multilingue non exploité SEO | Mettre en place URLs locales ou `hreflang` seulement quand les traductions existent réellement. |

### 8.3 Recommandation de balisage structuré

- Magazine/accueil : `Organization`, `WebSite`, `SearchAction` ;
- article : `NewsArticle` avec auteur réel, date de publication/mise à jour, image, section, paywall `isAccessibleForFree` et `hasPart` conformes ;
- kiosque : `Product`, `Offer`, `Book`/`Periodical` selon modèle ;
- Awards/Salons : `Event` ;
- Jobs : `JobPosting` pour chaque offre publique, sans exposer les coordonnées avant accès si la stratégie le requiert ;
- WAB : `ProfilePage` et `DiscussionForumPosting`/`SocialMediaPosting` selon validation SEO ;
- breadcrumb sur les pages profondes.

### 8.4 SEO IA / GEO

La présence de `llms.txt` et les règles spécifiques GPTBot/Google-Extended/Perplexity/ClaudeBot sont un bon début.

Pour une stratégie IA réellement solide :

- valider juridiquement et éditorialement quels contenus sont crawlables ;
- créer des pages auteurs vérifiées ;
- attribuer clairement les données chiffrées et leurs sources ;
- afficher dates de mise à jour ;
- produire des FAQ factuelles sur sujets clés ;
- utiliser des synthèses, tableaux et définitions citables ;
- garantir l’alignement entre robots, llms, paywall et HTML effectivement livré ;
- ne pas revendiquer des fonctions ou données inexistantes dans `llms.txt` ;
- suivre les citations et visibilité IA sans contourner les droits.

---

## 9. Données, Supabase et architecture

### État actuel

Le dépôt comporte :

- Prisma ;
- client Supabase ;
- migrations Supabase ;
- JSON local de données ;
- authentification custom JWT.

Cela constitue une architecture hybride. Elle peut fonctionner temporairement, mais est difficile à maintenir si les sources de vérité se multiplient.

### Recommandation d’architecture cible

| Élément | Cible recommandée |
|---|---|
| Source de vérité métier | Supabase PostgreSQL |
| Fichiers privés | Supabase Storage buckets privés + signed URLs |
| Paiements | Moneroo + webhook serveur + tables transactionnelles |
| Auth | Décider custom JWT durable ou migration Supabase Auth ; ne pas maintenir deux systèmes concurrents sans plan |
| Sessions | cookies sécurisés + rotation + secret obligatoire |
| Recherche | PostgreSQL full-text au départ, Meilisearch/Algolia quand volume justifié |
| Rate limit | Redis/Vercel KV/Upstash |
| Tâches planifiées | Vercel Cron/Supabase scheduled jobs pour expirations et relances |
| Logs | logs structurés, alertes d’erreur et audit trail |

### Jobs/WAB et compatibilité

Les ajouts Jobs/WAB sont correctement isolés dans de nouveaux dossiers, routes, buckets et migrations. Ils ne devraient pas altérer les volets existants **à condition que** :

1. les migrations soient exécutées d’abord en recette ;
2. aucun JSON Jobs/WAB ne soit utilisé en production ;
3. le webhook Moneroo soit étendu de façon additive ;
4. le build complet et les parcours existants soient rejoués avant promotion en production ;
5. les URLs/canoniques/sitemaps soient alignés ;
6. un déploiement Preview Vercel soit validé avant production.

---

## 10. Déploiement, observabilité et continuité

### Points positifs

- configuration Vercel présente ;
- build de production réussi ;
- routes dynamiques compilées ;
- possibilité native Vercel de revenir au déploiement précédent.

### Manques

- pas de CI/CD documenté ;
- pas de tests ;
- pas de monitoring applicatif visible ;
- pas d’alertes Moneroo/Supabase/Vercel ;
- pas de procédure écrite de rollback ou migration ;
- pas de stratégie de sauvegarde/restauration documentée.

### Pipeline recommandé

```text
Branche de travail
  → pull request
  → lint + TypeScript + tests unitaires
  → build Next.js
  → Preview Vercel
  → migrations Supabase recette
  → tests e2e / paiements sandbox
  → validation humaine
  → production
  → smoke tests + monitoring
```

### Smoke tests de production obligatoires

- page d’accueil Magazine ;
- article gratuit/premium ;
- Kiosque + panier ;
- connexion/inscription ;
- paiement Mag/Kiosque ;
- Africa Awards public et vote ;
- Crowdfunding public/dashboard ;
- Marketplace existant ;
- Jobs ;
- WAB ;
- administration autorisée et refus 403 non autorisé.

---

## 11. Plan de corrections priorisé

### P0 — bloquant avant tout déploiement sensible

- [ ] Révoquer et remplacer tous les secrets potentiellement exposés dans `.env.example` et historique Git ;
- [ ] supprimer le fallback JWT prédictible en production ;
- [ ] corriger CSP / protection clickjacking ;
- [ ] basculer les données métier de production de JSON vers Supabase ;
- [ ] appliquer et tester les migrations Jobs/WAB en recette ;
- [ ] durcir webhook Moneroo : signature obligatoire, revalidation API, idempotence DB, transactions ;
- [ ] interdire explicitement les paiements mock en production ;
- [ ] mettre en place backups et procédure rollback.

### P1 — avant lancement Jobs/WAB

- [ ] ajouter tests E2E des parcours critiques ;
- [ ] ajouter rate limit distribué et validation Zod sur toutes les APIs ;
- [ ] terminer l’intégration webhook Jobs/WAB ;
- [ ] scanner/contrôler documents ;
- [ ] vérifier RLS et accès Storage ;
- [ ] standardiser erreurs API et logs ;
- [ ] ajouter gestion d’expiration durable par cron ;
- [ ] corriger les problèmes lint bloquants majeurs.

### P2 — qualité, SEO, performance

- [ ] sitemap dynamique complet ;
- [ ] canonicals, `metadataBase`, Open Graph, Twitter Cards ;
- [ ] JSON-LD ;
- [ ] optimisation images et polices ;
- [ ] audit Lighthouse mobile ;
- [ ] a11y automatisée ;
- [ ] CI GitHub Actions ;
- [ ] monitoring, alertes et analytics respectueux de la vie privée.

### P3 — évolutions produit

- [ ] compléter Marketplace selon le cahier validé ;
- [ ] intégration contrôlée Marketplace → WAB ;
- [ ] recherche avancée ;
- [ ] recommandations basées sur consentement ;
- [ ] SSO/architecture auth consolidée ;
- [ ] internationalisation réellement traduite et conversion devise fiable.

---

## 12. Conclusion

Le projet est fonctionnellement ambitieux, visuellement prometteur et le build de production valide sa capacité à compiler l’ensemble de ses routes actuelles. Les ajouts Jobs et WAB sont techniquement isolés et ne modifient pas les routes fonctionnelles existantes autres que leurs propres pages `/emploi` et `/wab`.

La condition essentielle pour une mise en ligne robuste n’est pas l’ajout de nouvelles interfaces, mais la consolidation : **Supabase comme source de vérité, sécurité des secrets, webhook Moneroo transactionnel, tests automatisés, SEO dynamique et recette non-régressive**.

La stratégie recommandée est donc : corriger les P0, appliquer les migrations en recette, raccorder Jobs/WAB à Supabase, tester tous les parcours existants et nouveaux sur une Preview Vercel, puis seulement promouvoir le déploiement groupé.
