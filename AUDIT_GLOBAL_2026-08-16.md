# Audit global — Envol Africa Magazine (EAM)

**Date de l’audit :** 16 août 2026  
**Auteur :** Manus AI  
**Déploiement audité :** [`envolafricamagazine-o4sglwoo.vercel.app`](https://envolafricamagazine-o4sglwoo.vercel.app)  
**Révision auditée :** `cbbade267bf55a2458929d352b4f036defd6860e`  
**Dépôt :** [`arminellenouatin-droid/envolafricamagazine`](https://github.com/arminellenouatin-droid/envolafricamagazine)  
**Périmètre :** pages publiques et protégées, APIs, authentification, architecture de données, Moneroo, contrôle d’accès, sécurité HTTP, SEO Google et SEO pour moteurs génératifs, performance, accessibilité, responsive et liens.

> **Verdict de mise en production : NO-GO en l’état.** Le produit présente une couverture fonctionnelle importante, mais l’inscription est cassée sur Vercel, un secret administratif est exposé dans le HTML public, le webhook Moneroo accepte une signature invalide, et Supabase signale des tables publiques sans RLS. Ces risques doivent être traités avant toute communication commerciale ou encaissement réel.

## 1. Résumé exécutif

EAM est une application Next.js 16.3 avec App Router, TypeScript, Tailwind CSS v4, Prisma et Supabase. Le dépôt contient un périmètre large : magazine, kiosque, abonnement, compte utilisateur, Jobs, World Africa Business (WAB), crowdfunding, Africa Awards, marketplace, salons, affiliation et administration. Les récentes intégrations Jobs et WAB sont visibles et leurs APIs principales existent, mais l’application globale reste hybride : plusieurs parcours historiques utilisent encore un fichier JSON local tandis que les nouvelles briques s’appuient sur Supabase/Prisma. Cette divergence est la cause directe de l’échec de création de compte dans l’environnement serverless.

Les pages répondent globalement, les protections API anonymes sont souvent présentes et le paywall article est observable. En revanche, la disponibilité HTTP ne doit pas être confondue avec la complétude fonctionnelle : plusieurs pages protégées retournent un HTML 200 avant un contrôle client, les données visibles sont parfois statiques ou de démonstration, et aucun compte d’essai n’a pu être créé en raison de l’erreur de persistance `EROFS`.

Le socle SEO est insuffisant pour une publication durable : aucun canonical n’a été détecté, aucun JSON-LD n’a été détecté sur les 60 pages inspectées, les métadonnées restent largement génériques, et le sitemap référence un domaine différent du déploiement audité. Les scores Lighthouse SEO sont néanmoins à 100 dans les quatre scénarios, ce qui montre que l’outil n’a pas sanctionné les absences de données structurées ; une validation métier plus complète reste donc indispensable.

Les performances mobiles sont le principal frein à l’adoption : FCP autour de 8,5–8,7 secondes, LCP autour de 12,7–14,9 secondes et interaction autour de 13,0–15,3 secondes. Le desktop est meilleur, mais le CLS de l’accueil atteint 0,373. Les images externes non dimensionnées, l’absence de chaîne d’images responsive cohérente et le chargement initial lourd sont les causes prioritaires.

## 2. Synthèse des risques et décision

### Corrections incluses dans la livraison documentaire

Le commit associé à ce rapport supprime le bloc d’identifiants administrateur de la page de connexion et durcit le contrôle HMAC du webhook Moneroo : signature absente ou invalide rejetée, comparaison protégée contre les longueurs différentes et absence de secret refusée en production. Ces corrections sont **préparées dans le dépôt mais restent à déployer et à revalider sur Vercel** ; les résultats ci-dessous décrivent donc le comportement observé avant ce déploiement.


| Priorité | Constat | Impact | Décision recommandée | Statut |
|---|---|---|---|---|
| P0 | Identifiants d’administration présents en clair dans le HTML de `/auth/login` | Compromission immédiate possible d’un compte privilégié | Révoquer et remplacer le secret, supprimer toute mention côté client, vérifier l’historique Git et les logs | Ouvert |
| P0 | `/api/auth/register` écrit dans `src/data/db.json` et échoue sur Vercel avec `EROFS` | Aucun nouvel utilisateur ne peut être créé en production | Migrer l’inscription vers Supabase/Prisma transactionnel avant recette | Ouvert |
| P1 | `/api/webhooks/moneroo` répond 200 avec signature invalide | Risque de faux paiement ou d’état de commande falsifié | Rejeter toute signature absente/invalide en 403, utiliser comparaison constante et journaliser sans données sensibles | À corriger |
| P1 | 28 tables Supabase publiques sans RLS | Lecture/modification potentielle de données via les rôles anon/authenticated | Définir policies par table, tester en anon/authenticated/service role, puis activer RLS progressivement | Ouvert |
| P1 | Pages admin Africa Awards et autres espaces métier rendues en 200 sans session | Exposition d’interface, métriques ou actions avant autorisation serveur | Protéger les pages par middleware ou contrôle serveur de rôle | Ouvert |
| P1 | CSP `frame-ancestors *` et `X-Frame-Options: ALLOWALL` | Risque de clickjacking | Restreindre l’encadrement aux domaines nécessaires ou l’interdire | Ouvert |
| P1 | LCP mobile supérieur à 12 secondes | Abandon, faible conversion, mauvais signal UX | Optimiser le chemin critique, les images et le JavaScript avant lancement public | Ouvert |
| P1 | 0 canonical et 0 JSON-LD ; sitemap sur domaine incohérent | Indexation et compréhension sémantique dégradées | Mettre en place metadata par route, canonical, Open Graph, JSON-LD et sitemap de production | Ouvert |
| P2 | 25 images sur 33 sans `alt` sur l’accueil, boutons/carrousels sans nom | Accessibilité et compréhension SEO diminuées | Ajouter alternatives textuelles, labels et contrôles clavier | Ouvert |
| P2 | 1 vulnérabilité npm HIGH (`nanoid < 3.3.18`) | Surface de dépendance inutilement vulnérable | Mettre à jour la chaîne de dépendances et régénérer le lockfile | Ouvert |

## 3. Méthode et limites

L’audit a combiné analyse statique du dépôt, inspection des routes et APIs, navigation Chromium sur le déploiement Vercel, tests anonymes de formulaires et de contrôles d’accès, mesures Lighthouse et inspection Supabase en lecture seule. Les mesures HTTP proviennent de la révision `cbbade2` déployée au moment de l’audit [1]. Les métriques de performance sont des mesures de laboratoire et doivent être complétées par des données réelles de terrain lorsque l’analytics sera en place.

Un compte d’essai n’a pas été conservé : la tentative d’inscription a atteint la route de production mais a échoué sur le système de fichiers en lecture seule. Aucun paiement réel n’a été déclenché. L’activation opérationnelle de Moneroo doit être validée avec une clé sandbox ou avec une confirmation explicite du montant, de la devise et du caractère irréversible avant tout encaissement. Cette limite est volontaire et protège le compte marchand.

## 4. Architecture et déploiement

| Élément | Observation | Évaluation |
|---|---|---|
| Frontend | Next.js 16.3, App Router, TypeScript, Tailwind v4 | Solide techniquement, mais métadonnées trop globales |
| Données historiques | `src/lib/db.ts` et `src/data/db.json` pour auth, magazine et commandes | Non compatible avec l’écriture serverless Vercel |
| Données nouvelles | Prisma v5 et Supabase/PostgreSQL pour Jobs, WAB et tables métier | Direction correcte, mais policies RLS incomplètes |
| Paiements | Client Moneroo avec mode mock si `MONEROO_API_KEY` manque | Flux prévu, vérification webhook insuffisante |
| Hébergement | Vercel, déploiement READY audité | Disponible mais configuration de sécurité à durcir |
| Rewrites | `/rest/v1/*` et `/functions/v1/*` vers `/api/*` | À vérifier avec le modèle Supabase cible ; éviter de masquer les erreurs |

La priorité d’architecture est de disposer d’une seule source de vérité. Les utilisateurs, abonnements, commandes, paiements, favoris, téléchargements et états de paywall doivent être persistés dans Supabase/Prisma avec transactions, contraintes d’unicité, contrôle d’accès et migrations versionnées. Un fichier JSON local peut rester un fixture de développement, mais ne doit jamais être le backend de production.

## 5. Couverture des routes

Le dépôt contient 60 routes de pages et 70 routes API recensées dans l’audit automatisé. La couverture HTTP est la suivante [1].

| Catégorie | Nombre | Interprétation |
|---|---:|---|
| Pages HTTP 200 | 57 | Page rendue ou shell rendu ; ne signifie pas que le parcours est fonctionnel |
| Pages HTTP 307 | 3 | Redirections observées pour `/admin`, `/emploi/admin` et `/emploi/dashboard` |
| APIs HTTP 200 | 29 | Réponses nominales anonymes ou endpoints publics |
| APIs HTTP 401 | 10 | Authentification requise ; comportement attendu sur plusieurs endpoints |
| APIs HTTP 403 | 4 | Autorisation ou rôle requis ; comportement attendu sur endpoints admin |
| APIs HTTP 405 | 23 | Méthode HTTP utilisée par le test non acceptée ; à compléter par tests POST/PATCH/DELETE métier |
| APIs HTTP 400 | 2 | Validation d’entrée fonctionnelle sur les cas testés |
| APIs HTTP 404 | 2 | Route dynamique appelée sans identifiant réel ou ressource absente |

Les routes admin Africa Awards (`/africa-awards/admin/dashboard`, `/competitions/new`, `/requests`, `/sponsors`) et plusieurs espaces compte/financement/WAB répondent en 200 sans redirection serveur. Les APIs admin, elles, renvoient généralement 401/403. Cette différence indique une protection d’API meilleure que la protection des pages et doit être corrigée pour éviter l’exposition d’interface ou de données préparées côté serveur.

## 6. Parcours fonctionnels

### 6.1 Magazine, kiosque et article

L’accueil, le kiosque, le panier et un article sont accessibles. Le paywall d’article est visible côté serveur : le contenu premium n’est pas entièrement présenté à un visiteur anonyme. Le kiosque expose des numéros et le panier répond, mais l’absence de compte d’essai et d’achat réel empêche de valider la persistance d’un achat, le téléchargement après paiement, l’historique et la restauration d’accès.

Le parcours à accepter en recette est : visiteur → aperçu → ajout au panier → initialisation Moneroo → redirection → webhook vérifié → commande `paid` → accès au téléchargement → historique compte. Chacune de ces transitions doit être idempotente et traçable par un identifiant de commande non sensible.

### 6.2 Authentification et compte

La page de connexion affiche une erreur correcte avec des identifiants invalides. Les redirections protégées sont visibles, notamment `/compte` vers la connexion et `/emploi/dashboard` vers `/auth/login?next=/emploi/dashboard`. Toutefois, l’inscription échoue en production avec `EROFS: read-only file system, open '/var/task/src/data/db.json'`. Aucun compte de test n’a donc été créé et les parcours authentifiés n’ont pas pu être validés de bout en bout.

La correction ne doit pas être un simple changement de permissions. Il faut retirer l’écriture fichier du chemin de production, utiliser Supabase Auth ou une table `users` gérée par Prisma, hacher les mots de passe avec une primitive maintenue, ajouter rate limiting et journaliser les erreurs sans inclure les secrets.

### 6.3 Jobs

La page `/emploi` répond et la recherche est utilisable visuellement. Les pages de publication d’offre, publication de candidature, candidats et abonnements existent. Les endpoints Jobs sensibles sont protégés par des réponses 401/403 sur les appels anonymes testés. La fonctionnalité est donc **partiellement prête** : le parcours public est présent, mais la persistance et les droits doivent être retestés avec un vrai compte après migration de l’authentification et mise en place des policies Supabase.

### 6.4 World Africa Business (WAB)

La page `/wab` affiche trois publications publiques et les pages de recherche, profil, campagnes et salons sont présentes. Le parcours public est **partiellement fonctionnel**. Lighthouse et la console navigateur signalent une erreur sur `/api/wab/posts/wab-1/view` en HTTP 500 lors de l’enregistrement d’une vue. Cette route doit être idempotente, tolérer un visiteur anonyme et ne jamais dégrader le rendu du feed.

Les endpoints de boost, récompense, signalement, média et administration exigent ou semblent exiger une session selon les codes observés. Il faut néanmoins recetter la création de publication, l’upload, réaction, commentaire, suivi, salon et notification avec un compte connecté et des policies RLS ciblées.

### 6.5 Crowdfunding

Les pages et APIs publiques du financement sont présentes et répondent. L’audit n’a pas validé la création d’un projet, la vérification de documents, la messagerie entre parties, le remboursement ou le rapprochement financier en base. Le statut est **partiel** jusqu’à démonstration d’un flux complet avec rôles porteur/investisseur et états transactionnels.

### 6.6 Africa Awards

Les pages publiques, compétitions, candidats, votes, classement, galerie et espaces partenaires sont rendues. Les APIs de compétitions, candidats, votes et scores répondent anonymement, tandis que les demandes sont protégées. Les pages admin rendent néanmoins une interface complète sans session. Le module doit être classé **partiel et à risque** tant que le middleware de rôle, les policies RLS et le workflow de vote/audit ne sont pas vérifiés.

### 6.7 Marketplace et salons

Les pages marketplace et salons sont disponibles, mais l’audit n’a pas établi un catalogue persistant complet, une commande livrée ou une réservation confirmée. Les fonctionnalités sont donc **présentes mais non certifiées**. Les tables de paiements, commandes, tarifs d’expédition et participants salons sont notamment concernées par les alertes RLS Supabase.

## 7. Base de données et Supabase

Le projet Supabase de production `arminellenouatin-droid's EAM` est actif et sain, référence `rtfjwpytiuvoekomevpu`, région `eu-central-1`, PostgreSQL 17.6.1. Le schéma public contient des tables structurées pour les utilisateurs, articles, magazines, commandes, paiements, Jobs, WAB, Africa Awards, affiliation et services.

Supabase signale **28 tables publiques sans RLS**, incluant des tables de paiements, commandes détaillées, téléchargements, tarifs d’expédition, affiliation, Jobs, WAB et Africa Awards. D’après l’avis Supabase, ces tables sont exposées aux rôles `anon` et `authenticated` utilisés par les bibliothèques clientes [2]. Il s’agit d’un risque critique : les données financières, profils, candidatures, publications et états métier ne doivent pas être modifiables par un client non autorisé.

Supabase signale aussi des tables avec RLS activé mais sans policy, ainsi qu’une fonction `public.jobs_set_updated_at` dont le `search_path` est mutable. La remédiation doit être conçue table par table. **Aucune activation RLS automatique n’a été appliquée pendant cet audit**, car activer RLS sans policies pourrait bloquer le produit et masquer les régressions.

| Domaine | Contrôle attendu avant validation |
|---|---|
| Utilisateurs | Un utilisateur lit/modifie son propre profil uniquement ; rôle administrateur non modifiable côté client |
| Jobs | Lecture publique des offres publiées ; création/modification réservée au recruteur propriétaire ; candidature privée au candidat et recruteur autorisé |
| WAB | Lecture publique des posts publiés ; écriture par auteur connecté ; modération et administration séparées |
| Paiements | Aucun accès direct client aux écritures de paiement ; seules les routes serveur/webhooks autorisés écrivent l’état |
| Awards | Vote selon fenêtre de compétition et règles anti-fraude ; jury, organisateur et admin séparés |
| Audit | Journal append-only, lecture restreinte, absence de données sensibles en clair |

## 8. Paiements Moneroo

Le code prévoit Moneroo pour Mobile Money et carte, avec une clé dans l’environnement et un mode mock si la clé est absente. Les tests non destructifs ont confirmé que `/api/payment/init` renvoie 400 avec un panier vide et que `/api/payment/verify` renvoie 400 sans `orderId`. Ces validations d’entrée sont correctes.

Aucun paiement réel n’a été initialisé, car un encaissement peut être irréversible et nécessite une confirmation explicite du montant, de la devise et du bénéficiaire. Il est recommandé d’utiliser d’abord une clé sandbox Moneroo et un produit de test à faible valeur.

Le défaut critique concerne `/api/webhooks/moneroo` : une requête avec une signature invalide a reçu HTTP 200. Le serveur doit calculer la signature attendue à partir du secret webhook, comparer en temps constant, retourner HTTP 403 en cas de signature absente ou invalide, puis seulement parser et traiter l’événement. Le traitement doit être idempotent sur l’identifiant Moneroo, vérifier le montant/devise/commande côté serveur et ne jamais faire confiance au statut envoyé par le navigateur.

## 9. Sécurité applicative

| Contrôle | Résultat | Risque |
|---|---|---|
| Secret admin dans le HTML de connexion | Échec critique | Compromission directe possible ; révoquer immédiatement |
| Inscription serverless | Échec critique | Persistance locale en lecture seule |
| Signature webhook Moneroo | Échec | Fausse confirmation de paiement possible |
| APIs admin anonymes | Souvent 401/403 | Point positif, à conserver après refactor |
| Pages admin | Protection serveur insuffisante sur plusieurs routes | Interface ou métriques rendues avant contrôle |
| CSP frame ancestors | `*` | Clickjacking possible |
| X-Frame-Options | `ALLOWALL` | Protection d’encadrement neutralisée |
| Dépendances | 1 vulnérabilité HIGH nanoid | Mettre à jour et tester le lockfile |
| RLS Supabase | 28 tables désactivées | Exposition potentielle de données métier |

Les identifiants révélés ne sont pas reproduits dans ce rapport. Ils doivent être considérés comme compromis : rotation immédiate, contrôle de l’historique Git, invalidation des sessions, mise à jour de toutes les variables Vercel et activation de l’authentification forte pour les comptes privilégiés.

## 10. SEO Google et SEO pour moteurs génératifs

L’audit de 60 pages a détecté des titres et descriptions, mais **aucun canonical**, **aucun JSON-LD**, aucun `robots` spécifique et plusieurs métadonnées génériques héritées du layout. L’accueil a un `title` de 71 caractères et une description de 175 caractères ; plusieurs pages Jobs et WAB ont des métadonnées spécifiques, mais la majorité des routes conserve le titre magazine général.

Le sitemap est présent mais minimal et référence `envolafricamag.com` alors que le déploiement audité est sur `envolafricamagazine-o4sglwoo.vercel.app`. Avant mise en production du domaine canonique, le domaine réellement utilisé doit être décidé puis appliqué de façon cohérente dans `metadataBase`, sitemap, Open Graph, canonical, alternate languages et liens internes.

Pour Google, il faut ajouter `Organization`, `WebSite`, `NewsArticle` ou `Article`, `BreadcrumbList`, `Product`/`Offer` pour le kiosque et `JobPosting` pour les offres valides. Pour les moteurs génératifs, il faut privilégier une structure claire : auteur, date de publication et de mise à jour, source, catégorie, entités nommées, résumé autonome, liens internes stables, pages auteur et signaux de confiance. Les données structurées doivent refléter strictement le contenu visible.

## 11. Performance, responsive et accessibilité

| Scénario | Performance | Accessibilité | Bonnes pratiques | SEO | FCP | LCP | Interaction | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Accueil mobile | 56 | 84 | 100 | 100 | 8,7 s | 14,9 s | 15,3 s | 0,035 |
| Accueil desktop | 60 | 84 | 100 | 100 | 1,7 s | 2,5 s | 2,6 s | 0,373 |
| Jobs mobile | 53 | 92 | 100 | 100 | 8,5 s | 12,8 s | 13,2 s | 0,102 |
| WAB mobile | 56 | 91 | 96 | 100 | 8,5 s | 12,7 s | 13,0 s | 0,029 |

Les résultats mobiles sont incompatibles avec une expérience premium : le document HTML répond rapidement, mais l’affichage utile est retardé. Lighthouse estime notamment jusqu’à environ 1,6 Mo d’économies sur les formats modernes de l’accueil desktop, environ 960 Ko sur le dimensionnement responsive mobile et environ 782 Ko sur Jobs/WAB. Il faut utiliser `next/image`, `sizes`, dimensions intrinsèques, formats AVIF/WebP, préchargement limité de l’image LCP et lazy loading sous la ligne de flottaison.

L’accueil desktop présente cinq déplacements de mise en page et un CLS de 0,373. Les hauteurs doivent être réservées pour le header, la bannière promotionnelle, le carrousel et les images. Les boutons du carrousel ont été détectés sans nom accessible ; 25 images sur 33 n’ont pas de texte alternatif ; des problèmes de contraste, de taille de cible, de labels de select et d’ordre des titres sont également signalés.

La navigation responsive est globalement utilisable sur les scénarios mobiles testés, mais la qualité est dégradée par le temps de chargement et par des contrôles compacts. La recette doit couvrir au minimum 320, 375, 414, 768, 1024 et 1440 pixels, avec clavier, zoom 200 %, mode sombre et lecteur d’écran.

## 12. Liens et intégrité de navigation

La vérification de liens a relevé trois 404 internes et sept domaines externes non résolus au moment de la mesure. Les anomalies internes incluent notamment `/jobs`, `/crowdfunding` et une URL Africa Awards contenant un espace (`/africa awards`). Les liens footer vers des sous-domaines tels que crowdfunding, kiosque, WAB, marketplace, Jobs et Africa Awards doivent être vérifiés selon la stratégie de domaines finale, avec redirections permanentes si nécessaire.

Une campagne de crawl doit être ajoutée en CI pour détecter toute URL interne cassée avant déploiement. Les liens externes doivent utiliser une liste contrôlée et un timeout ; une indisponibilité temporaire ne doit pas faire échouer toute la build, mais doit générer une alerte.

## 13. Plan de remédiation priorisé

### Immédiat — avant tout nouveau paiement ou communication

Révoquer les identifiants admin exposés et vérifier les journaux. Supprimer le bloc de démonstration côté client. Corriger l’inscription en remplaçant `writeDB` par Supabase/Prisma côté serveur. Corriger le webhook Moneroo avec validation HMAC effective et tests de non-régression pour signature valide, invalide, absente, replay et payload incohérent. Réduire `frame-ancestors` et supprimer `ALLOWALL`. Ne pas déclencher de transaction réelle sans environnement sandbox ou confirmation explicite.

### Sprint sécurité et données

Écrire les policies RLS table par table, en commençant par paiements, commandes, téléchargements, utilisateurs, candidatures Jobs, posts WAB, votes Awards et audit logs. Ajouter tests d’accès avec rôles anon, user, recruiter, organizer, jury, admin et service role. Corriger le `search_path` de la fonction Jobs. Mettre à jour `nanoid` et publier un rapport npm audit propre.

### Sprint fiabilité fonctionnelle

Créer un compte de test, valider login/logout/session/refresh, vérifier les pages compte, créer une offre Jobs, déposer une candidature, publier un post WAB, commenter/réagir, tester un vote Awards et accomplir un cycle panier → paiement sandbox → webhook → téléchargement. Ajouter idempotence et observabilité des routes critiques.

### Sprint performance et acquisition

Remplacer les images non optimisées, réserver les espaces, réduire le JavaScript initial et charger les composants lourds à la demande. Implémenter métadonnées par page, canonical, sitemap de domaine final, Open Graph et JSON-LD. Corriger les liens 404, alt, labels, contraste, titres et contrôles du carrousel. Rejouer Lighthouse sur mobile et desktop avec objectifs : performance ≥ 85, LCP mobile ≤ 2,5 s, CLS ≤ 0,1, accessibilité ≥ 95.

## 14. Critères de sortie de l’audit

La version pourra être considérée comme prête lorsque l’inscription crée et retrouve un utilisateur dans Supabase, aucun secret n’est présent dans le bundle ou le HTML, toutes les pages admin sont protégées côté serveur, les 28 tables critiques ont des policies testées, Moneroo rejette les signatures invalides et passe un flux sandbox complet, les parcours Jobs/WAB/Awards sont testés avec rôles, le sitemap et les canonical pointent vers le domaine final, les liens internes ne contiennent plus de 404 et les seuils performance/accessibilité sont atteints.

## 15. Références

[1]: https://envolafricamagazine-o4sglwoo.vercel.app/ "Déploiement Vercel audité — Envol Africa Magazine"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase — Row Level Security"
[3]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview "Google Search Central — Sitemaps"
[4]: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data "Google Search Central — Structured data"
[5]: https://web.dev/articles/vitals "Web.dev — Core Web Vitals"
[6]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors "MDN — CSP frame-ancestors"
