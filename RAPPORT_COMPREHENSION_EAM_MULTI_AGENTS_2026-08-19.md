# Rapport de compréhension du projet EAM après interventions multi-agents

**Date d’analyse :** 19 août 2026  
**Auteur :** Manus AI  
**Dépôt analysé :** `arminellenouatin-droid/envolafricamagazine`  
**Révision locale analysée :** `7291008` — `feat: ajouter le carousel media aux fiches marketplace`  
**Périmètre :** historique Git, architecture, données, règles métier, sécurité, paiements, UX, performance, SEO, documentation et causes probables des erreurs signalées.

> **Conclusion principale :** le projet n’est pas incompréhensible ni bloqué. Il est devenu un écosystème très riche par ajouts successifs, mais il fonctionne encore avec plusieurs sources de vérité, plusieurs conventions d’API et plusieurs niveaux de maturité. Les erreurs observées ne sont donc pas isolées : elles sont principalement les symptômes d’une architecture hybride et d’un processus de livraison qui a parfois confondu « code ajouté », « build réussi », « migration appliquée », « fonctionnalité testée » et « fonctionnalité certifiée en production ».

## 1. Résumé exécutif

Envol Africa est devenu une plateforme écosystémique composée du Magazine éditorial, du Kiosque, des abonnements, de l’authentification et du compte, de Jobs, de WAB, de Marketplace, du Crowdfunding, d’Africa Awards, des Salons, de l’affiliation, des notifications, de la messagerie et de l’administration. Le dépôt comporte une application Next.js 16.3 App Router, une centaine de routes d’interface, 113 routes API environ, des migrations Supabase et plusieurs adaptateurs métier. Le build de production passe, ce qui confirme que le code est compilable ; cela ne suffit pas à confirmer la persistance, la sécurité, les paiements ou les parcours authentifiés.

La compréhension la plus importante est la suivante : **l’interface est devenue plus unifiée que le backend**. Le Header, les toolboxes, l’identité visuelle et certaines règles de compte sont partagés, alors que les données restent réparties entre `db.json`, `awards.json`, `crowdfunding.json`, `jobs.json`, `wab.json`, Prisma et Supabase. Cette asymétrie explique les disparitions après actualisation, les identités introuvables, les prix incohérents, les paiements qui reviennent au panier et les différences entre l’environnement local et Vercel.

| Niveau | État réel au 19 août 2026 | Interprétation |
|---|---|---|
| Interface et navigation | Avancées | Beaucoup de demandes utilisateur ont été implémentées, notamment les headers, toolboxes, Marketplace, flipbook et WAB. |
| Build TypeScript | Validé | Le projet compile ; ce résultat ne prouve pas que les flux réels sont persistants. |
| Fonctionnalités métier | Présentes mais hétérogènes | Plusieurs verticales ont des écrans et APIs, mais pas encore une source de vérité unique. |
| Sécurité | Renforcée mais incomplète | Headers et webhook ont reçu des corrections ; 19 tables restent à traiter par policies RLS, et la gouvernance des secrets doit être contrôlée. |
| Paiements | Intégrés mais non totalement certifiés | Moneroo est centralisé, mais certaines branches métier utilisent encore des stores locaux et nécessitent une recette sandbox/live contrôlée. |
| Production commerciale | Non certifiée globalement | Il manque la preuve de persistance, la recette par rôles, la validation RLS et la certification complète des paiements. |

## 2. Comment le projet a évolué

L’historique Git montre des merges explicites de la branche `arena/019fdc3b-envolafricamagazine`, avec la mention `arena-agent`, entre le 7 et le 10 août. Les auteurs GitHub ne permettent pas d’identifier chaque agent individuel, mais les commits permettent de reconstituer les vagues de travail. Il est donc plus exact de parler de **vagues d’agents et de consolidation** que d’attribuer chaque changement à une personne précise.

### 2.1 Première vague : socle, redesign et administration

Du 7 au 10 août, le projet a reçu la refonte de la landing page, du header, du footer, du kiosque, du panier, des articles et de la fiche produit. Moneroo a été intégré, des routes d’administration ont été ajoutées, puis un audit V2 a introduit des migrations manquantes, des réécritures de compatibilité et une première formalisation des décisions. Cette vague a produit un socle visuel ambitieux, mais elle a aussi fixé des choix provisoires : JWT personnalisé plutôt que Supabase Auth, Prisma plutôt que Drizzle et JSON local comme fallback.

### 2.2 Deuxième vague : Magazine, Kiosque, paiements et compte

Les commits des 17 et 18 août ont amélioré le flipbook, les aperçus protégés, les prix, les langues, les méthodes de paiement, le profil, les avatars et l’affiliation. Les problèmes signalés par l’utilisateur sur la suppression de magazines, l’enregistrement des tarifs, le prix affiché au panier et l’aperçu PDF correspondent à cette zone : plusieurs données historiques étaient encore structurées comme des objets JSON, alors que les écrans administratifs commençaient à utiliser Supabase et Storage.

### 2.3 Troisième vague : Jobs et WAB

Jobs et WAB ont été ajoutés selon une règle d’isolation additive. Les routes, les migrations et les bibliothèques ont été regroupées par domaine afin de ne pas refactoriser les anciens modules. Cette stratégie a limité les conflits immédiats, mais le plan Jobs/WAB documente lui-même que les données locales étaient temporaires et devaient impérativement être remplacées par Supabase avant production.

WAB a ensuite reçu la publication de texte et médias, les stories, les réactions, commentaires, pages, groupes, profils, salons, abonnements business, notifications, boosts, prévisualisations de documents et optimisation des images. Ces évolutions répondent précisément aux demandes utilisateur, mais une grande partie du modèle social reste représentée dans `src/data/wab.json` via `src/lib/wab-db.ts`.

### 2.4 Quatrième vague : navigation et outils écosystème

Le Header partagé a été modifié plusieurs fois : header desktop, header mobile, barre basse, sélection de plateforme, thème clair/sombre, logos, méga-menu, toolboxes de notifications/messages/favoris, profil et panier. La décision d’unifier les outils est cohérente avec la vision produit. Cependant, comme `Header.tsx` est un composant client global et transversal, toute correction ciblée d’un vertical peut affecter les autres plateformes ou les breakpoints mobile/desktop.

### 2.5 Cinquième vague : Marketplace et premiumisation vendeur

La dernière vague a transformé Marketplace en espace plus abouti : cartes compactes et cliquables, modal produit, carousel images/vidéos, recherche par image, vues Produits/Vendeurs/Certifiés/Boîte à outils, aperçu des magazines, option vidéo à 5 000 XOF par mois, limite de 3 Mo et quota de 10 produits. Le parcours `/marketplace/boutique` est maintenant contextuel : assistant de création pour un nouvel utilisateur et tableau de bord pour un vendeur existant. Cette partie est compilable et documentée, mais le paiement réel, l’upload authentifié et le quota doivent encore être certifiés avec un vendeur réel.

## 3. Architecture réellement en place

### 3.1 Le modèle hybride

Le code ne correspond plus à une architecture unique. `src/lib/db.ts` définit le modèle historique et écrit dans `src/data/db.json`. `src/lib/core-db.ts` essaie d’utiliser Supabase lorsque les variables serveur existent ; hors production, il autorise le fallback JSON ; en production, il peut lever une erreur si la base n’est pas configurée. Les objets JSON anciens sont ensuite remappés vers les colonnes Supabase.

Cette compatibilité est utile pour travailler rapidement, mais elle rend le comportement dépendant de l’environnement. Deux utilisateurs peuvent donc traverser le même écran et obtenir des résultats différents si l’un passe par Supabase et l’autre par un fixture local ou si une variable serveur manque.

| Couche | Rôle actuel | Risque résultant |
|---|---|---|
| `src/data/*.json` | Seeds, démo et parfois écriture métier | Écriture non persistante sur Vercel, pertes après refresh ou changement d’instance. |
| `src/lib/db.ts` | Modèle historique et helpers JSON | Les anciennes routes continuent à modifier la source locale. |
| `src/lib/core-db.ts` | Adaptateur de transition vers Supabase | Les comportements changent selon la configuration et la disponibilité des variables. |
| Prisma | Noyau historique : utilisateurs, articles, magazines, commandes, dons, commentaires | Le schéma ne couvre pas l’ensemble de Jobs, WAB, Marketplace, Crowdfunding et Awards. |
| Supabase SQL | Migrations des nouveaux domaines et tables de sécurité | Les tables existent parfois avant que les routes et policies métier soient complètement raccordées. |
| Storage privé | Médias WAB, CV Jobs, PDF et vidéos selon les modules | Les URLs signées, MIME, taille et rétention doivent être uniformisés. |

### 3.2 Les conventions d’API concurrentes

La spécification historique attendait des familles PostgREST `/rest/v1/*` et Edge Functions `/functions/v1/*`, tandis que l’implémentation utilise principalement les routes Next `/api/*`. `next.config.ts` contient une couche de rewrites de compatibilité. Cette solution évite de casser certains liens, mais elle ne garantit pas que la méthode HTTP, le payload, les erreurs et la réponse soient strictement équivalents.

### 3.3 L’authentification et RLS ne parlent pas exactement la même langue

L’application utilise un JWT personnalisé stocké dans le cookie `eam_token`. Les policies Supabase naturelles utilisent plutôt l’identité `auth.uid()` de Supabase Auth. Tant qu’une fonction serveur stable ne traduit pas explicitement l’identité EAM en identité de policy, il est dangereux d’appliquer des règles RLS en supposant que les identifiants coïncident. Cette divergence est une cause probable des erreurs d’utilisateur introuvable, des accès refusés inattendus et de la difficulté à écrire des policies fines.

## 4. Cartographie des verticales et de leurs règles

| Vertical | Règles métier structurantes | État des données | Niveau de confiance |
|---|---|---|---|
| Magazine | Articles publiés ou cryptés, résumé visible, paywall progressif, auteurs et catégories, republication WAB | Ancien JSON + relations éditoriales Supabase | Fonctionnel côté interface, persistance et droits à certifier. |
| Kiosque | Produit magazine, version/langue, prix, panier, aperçu, paiement, téléchargement signé | Catalogue hybride, panier côté client, commandes via adaptateur | Risque élevé sur prix, paiement et entitlement. |
| Abonnements | Plan, prix, période, paiement confirmé, activation et expiration | Tables et logique réparties entre users/orders/entitlements | Cron et recette récurrente à confirmer. |
| Jobs | Offre, candidat, candidature, unlock, abonnement, boost, CV privé, modération | Migrations Jobs + fixtures et adaptateurs | Parcours riche, migration complète à prouver. |
| WAB | Publication, visibilité, pages/groupes, médias, stories, réactions, commentaires, messages, modération, boost | `wab.json` encore central pour une grande partie | Risque élevé de perte et de confidentialité. |
| Marketplace | Vendeur, produit, carte publique, modal, commande, paiement échelonné, certification, vidéo | Tables Marketplace + APIs serveur, mais recette réelle incomplète | Correct côté produit, non certifié côté transaction. |
| Crowdfunding | Projet, documents, contribution don/part/pret, calendrier de remboursement | `crowdfunding.json` actif dans le code | Inacceptable pour une ouverture financière sans migration. |
| Africa Awards | Compétition, candidat, vote, jury, scores, paiements de votes, audit | `awards.json` actif dans le code et webhook local | Risque élevé de fraude, perte et incohérence. |
| Salons | Programmation, participation, discussion, replay | Tables/fixtures selon les flux | Fonctionnalité à recetter avec rôles. |
| Socle écosystème | Compte partagé, toolboxes, notifications, messages, profil, thème, navigation | UI partagée ; données réparties | Toute modification transversale a un rayon de régression large. |

## 5. Causes racines des erreurs observées

### 5.1 « La publication apparaît puis disparaît après actualisation »

La cause la plus probable est la différence entre l’écriture locale et la lecture Supabase. Une publication WAB peut être créée par `createWabPost`, qui écrit `wab.json`, alors qu’un autre chemin de lecture ou un futur déploiement ne lit pas la même instance. Sur Vercel, le système de fichiers n’est pas une base persistante. La publication visible dans la réponse immédiate peut donc ne plus exister après une nouvelle invocation.

### 5.2 « Utilisateur introuvable » ou mauvais avatar

L’identité affichée peut venir d’un seed WAB, d’un profil WAB, d’une ligne `users`, d’un JWT ou d’un objet local. Si l’identifiant de l’utilisateur connecté n’existe pas dans la table interrogée, la mise à jour échoue. Les avatars de démonstration dans les seeds WAB expliquent également pourquoi une personne a pu voir le nom correct avec la photo d’un autre profil.

### 5.3 « L’article ou le magazine ne s’enregistre pas »

Plusieurs causes se combinent : écriture dans `db.json` sur un environnement en lecture seule, utilisateur admin local absent de Supabase, formulaire multipart ou payload trop lourd, réponse serveur non JSON interprétée comme JSON, ou champ nouveau non accepté par une table ancienne. L’erreur `Unexpected token 'R'` indique typiquement que le frontend essaye de parser en JSON une réponse texte commençant par « Request… », souvent produite par une erreur de plateforme ou de taille de payload.

### 5.4 « Request Entity Too Large » lors d’un magazine

Le PDF et les images ont probablement été envoyés dans le body d’une fonction serverless au lieu d’être envoyés directement vers Storage ou une route d’upload adaptée. Les limites de body de Vercel s’appliquent avant même que le code métier puisse enregistrer le magazine. La bonne direction est l’upload direct ou multipart contrôlé vers Storage, puis l’enregistrement de métadonnées légères en base.

### 5.5 « Le prix du magazine n’est pas le prix enregistré »

Le prix peut être lu depuis plusieurs endroits : seed JSON, prix par format, override, état du panier localStorage, conversion de devise ou donnée Supabase. Si la carte affiche une source et que le panier recalcule une autre source, le client constate un écart. La règle correcte est que le serveur doit recharger le produit et son prix de référence au moment de créer la commande, puis stocker un snapshot immuable du prix et de la devise.

### 5.6 « Le paiement revient au panier ou reste non abouti »

Le retour Moneroo n’est pas la confirmation du paiement. Le résultat dépend du webhook signé, de la référence retrouvée, de la revalidation Moneroo, du montant, de la devise, de l’idempotence et de la persistance de l’état. Le webhook actuel est mieux durci, mais ses branches ne sont pas homogènes : Awards et Crowdfunding écrivent encore dans des stores locaux, tandis que commandes et abonnements utilisent davantage `core-db`. Cette asymétrie explique pourquoi un type de paiement peut fonctionner et un autre échouer.

### 5.7 « L’aperçu PDF ou le flipbook ne réagit pas »

Les causes possibles sont l’absence de PDF dans le bucket privé, une URL signée invalide ou expirée, un mauvais mapping entre couverture et pages, une langue non choisie, une réponse vide, une page générée côté serveur absente ou le fait que le navigateur tente d’utiliser le PDF original alors que seule une preview image doit être rendue. La protection des premières pages est une règle produit ; elle ne remplace pas un pipeline de génération et de cache vérifié.

### 5.8 « Les vidéos ou documents joints ne s’affichent pas »

La chaîne média comporte plusieurs générations : liens directs, upload route, optimisation, Storage privé, previews LibreOffice/Napi-RS Canvas et URLs signées. Une erreur peut venir du MIME, du dépassement de taille, de l’optimisation côté client, de l’absence de persistance du chemin, d’une URL non signée ou d’un rendu asynchrone non terminé. L’option Marketplace vidéo est maintenant contrôlée côté serveur, mais les anciennes règles WAB et Magazine doivent être harmonisées.

### 5.9 « Un bouton ne réagit pas »

Les causes récurrentes sont un handler client qui ne termine pas, une route qui renvoie une erreur non affichée, un contrôle affiché sans action serveur, une méthode HTTP différente de celle attendue par le rewrite, un modal qui bloque le scroll ou une mutation suivie d’un `router.refresh()` sans source de données persistante. L’absence de tests E2E et d’observabilité rend ces défauts visibles uniquement lorsqu’un utilisateur les signale.

### 5.10 Régressions de header et responsive

Le Header et les composants d’outils sont transversaux. Les demandes portaient souvent sur un seul vertical ou une seule résolution ; plusieurs correctifs ont donc ajouté des conditions de chemin, de breakpoint et d’état dans un composant global. La logique peut satisfaire la version testée et produire une répétition ou une ligne cachée ailleurs. La solution n’est pas d’ajouter encore une condition isolée, mais de séparer clairement le shell global, le header de plateforme et les variantes desktop/mobile, avec une matrice de recette.

## 6. Sécurité : ce qui est corrigé et ce qui reste ouvert

### Corrigé ou renforcé

Les headers actuels utilisent `X-Frame-Options: SAMEORIGIN` et `Content-Security-Policy: frame-ancestors 'self'`, ce qui corrige l’ancien réglage permissif. Le webhook Moneroo rejette en production une signature absente ou invalide, compare les signatures de manière résistante aux différences de longueur et revalide le paiement pour plusieurs branches. Le téléchargement de contenu protégé utilise des jetons signés et les buckets privés sont utilisés pour plusieurs catégories de médias.

### Encore ouvert

L’audit Supabase du 19 août signale 19 tables publiques avec RLS désactivé et d’autres tables avec RLS activé sans policies métier. Les zones concernées comprennent notamment messages WAB, conversations, audit, paiements d’affiliation, téléchargements, plans, catégories, transport et boosts Crowdfunding. L’activation de RLS sans policies est volontairement différée ; le bon travail consiste à écrire les policies par rôle puis à les tester.

Les fichiers historiques de déploiement contiennent également des exemples de configuration trop réalistes et un ancien document a exposé des informations administratives. Même si ces valeurs ne sont plus dans le code courant, elles doivent être considérées comme potentiellement compromises : rotation, vérification de l’historique Git et contrôle des variables Vercel sont nécessaires.

Le rate limiting en mémoire n’est pas distribué entre instances Vercel. Les schémas Zod existent mais ne sont pas appliqués uniformément. Les pages admin peuvent aussi être rendues avant le contrôle serveur sur certaines routes, même lorsque leurs APIs sont protégées. Ces points doivent être distingués du RLS : un contrôle client ou une API 401 ne remplace pas la protection de la page et des données.

## 7. Performance, SEO et expérience utilisateur

Les audits précédents mesuraient un LCP mobile autour de 12,7 à 14,9 secondes et signalaient un CLS desktop de 0,373. Les causes structurelles sont cohérentes avec le code : nombreuses balises `<img>`, images externes, polices et icônes chargées par des services tiers, géolocalisation côté navigateur, gros Header client global, polling du panier et composants client lourds. Les optimisations déjà ajoutées améliorent certains chemins, mais elles ne remplacent pas une mesure RUM et une campagne Lighthouse répétée.

Le SEO dispose d’un `robots.txt`, d’un `sitemap.xml` et d’un `llms.txt`, mais les audits ont relevé des URLs/domaine incohérents, peu de canonical, peu de JSON-LD et un sitemap statique. Le SEO Google et le référencement IA doivent partir de données visibles et vérifiables : auteur, date, catégorie, résumé, produit, prix, offre, emploi, profil et breadcrumbs.

L’expérience utilisateur est globalement riche et plus cohérente qu’au début du projet. La principale faiblesse est la **compréhension de l’état** : l’utilisateur ne sait pas toujours si une action a été envoyée, enregistrée, modérée, payée, synchronisée ou simplement affichée localement. Chaque mutation critique doit donc disposer d’un état de chargement, d’une confirmation serveur, d’un message d’erreur lisible et d’une preuve de persistance après actualisation.

## 8. Ce que les agents ont bien fait et ce qu’il faut améliorer

Les agents ont correctement répondu à une vision produit ambitieuse. Ils ont créé une navigation écosystème, séparé progressivement les verticales, ajouté des migrations, protégé des médias, amélioré la présentation Marketplace, renforcé le webhook et conservé une capacité de rollback Git/Vercel. La stratégie additive a évité une réécriture destructrice.

La faiblesse principale est procédurale. Plusieurs documents ont utilisé les mots « final », « déployé » ou « prêt pour production » alors que les vérifications réelles étaient parfois limitées à un build, une page ouverte dans le navigateur ou une API répondant HTTP 200. Il faut désormais employer quatre statuts distincts : **implémenté**, **compilé**, **déployé**, **certifié**. Seul le dernier autorise une promesse commerciale.

Une autre faiblesse est l’absence d’un registre de contrat. Chaque agent a pu ajouter une route, une migration ou un état sans mettre à jour systématiquement la source de vérité des données, le rôle autorisé, le statut de paiement, le format de réponse et le test de non-régression. Le projet a donc grandi en largeur plus vite qu’en cohérence verticale.

## 9. Recommandation stratégique

Je recommande de geler les nouvelles fonctionnalités pendant une courte phase de stabilisation. Il ne faut pas supprimer les verticales ni refaire toute l’interface. Il faut d’abord rendre le système prévisible.

### Phase 0 — inventaire et protection immédiate

Il faut considérer Supabase comme la seule source cible, inventorier chaque route qui écrit encore dans un JSON et confirmer que les secrets historiques sont tournés. Les fichiers JSON peuvent rester comme seeds de développement, mais aucune route de production ne doit y écrire. Le mode mock Moneroo doit être impossible en production. Les variables de production doivent être vérifiées dans Vercel sans les copier dans la documentation.

### Phase 1 — données et paiements critiques

La migration doit commencer par utilisateurs, commandes, paiements, abonnements, téléchargements, messages et audit. Les tables sensibles reçoivent des policies testées par rôle. Le webhook doit devenir idempotent avec une contrainte unique sur la référence fournisseur, une transaction serveur et une journalisation sans données sensibles. Awards et Crowdfunding doivent sortir des stores JSON avant toute opération financière réelle.

### Phase 2 — validation verticale

Chaque vertical doit disposer d’un scénario de recette complet, avec preuves de persistance après actualisation. Pour Magazine/Kiosque : création, aperçu, panier, checkout sandbox, webhook et téléchargement. Pour Jobs : offre, unlock, candidature, CV privé et abonnement. Pour WAB : publication, média, modération, page, groupe, message, réaction et notification. Pour Marketplace : création boutique, produit, commande, option vidéo, quota et paiement. Pour Crowdfunding et Awards : création, contribution/vote, calcul, statut, audit et permissions.

### Phase 3 — performance, SEO et qualité

Après stabilisation des données, il faut remplacer progressivement les images par `next/image` ou une chaîne CDN équivalente, scinder le Header global, supprimer le polling inutile, réserver les dimensions et mesurer LCP/INP/CLS sur réseau mobile. Ensuite, il faut mettre en place canonical, sitemap dynamique, JSON-LD par type de page, alt et contrôles accessibles. Les tests Playwright des parcours critiques et une CI deviennent obligatoires avant fusion sur `main`.

## 10. Règles de fonctionnement recommandées pour les prochains agents

| Règle | Exigence |
|---|---|
| Source de vérité | Une fonctionnalité métier doit déclarer sa table Supabase, son seed éventuel et l’interdiction d’écriture JSON en production. |
| Contrat API | Toute route doit documenter méthode, payload, réponse, erreurs 401/403/409/422/500 et rôle autorisé. |
| Paiement | Aucun succès côté client ne donne un droit ; seul le webhook serveur vérifié et idempotent le fait. |
| Identité | Toute opération doit utiliser une identité serveur résolue ; aucun `userId` envoyé par le client ne doit faire autorité pour une donnée privée. |
| RLS | Une policy doit être livrée avec son scénario de test anonyme, utilisateur, propriétaire, participant, vendeur et admin. |
| Upload | Taille, MIME réel, extension, stockage, URL signée, expiration et suppression doivent être documentés. |
| Interface | Une mutation doit afficher chargement, succès, erreur et état après refresh. |
| Responsive | Toute modification du Header doit être testée sur au moins 320, 375, 414, 768, 1024 et 1440 pixels, sur chaque vertical concerné. |
| Livraison | « Implémenté », « compilé », « déployé » et « certifié » sont quatre statuts différents. |
| Documentation | Chaque agent ajoute une entrée au changelog, au PRD et au registre de décisions, en indiquant ce qui est prouvé et ce qui reste à tester. |

## 11. Critères de compréhension et de sortie

Le projet pourra être considéré comme stabilisé lorsque l’équipe pourra répondre sans ambiguïté aux questions suivantes : où est stockée chaque donnée, quel rôle peut la lire ou la modifier, quelle route confirme la mutation, quel événement déclenche le paiement, quelle table garantit l’idempotence, quelle URL signée sert le fichier, que se passe-t-il après actualisation et quelle preuve montre que le comportement fonctionne en production.

À ce moment-là, la richesse fonctionnelle déjà construite deviendra un avantage réel plutôt qu’une source de comportements contradictoires. Le projet n’a pas besoin d’être recommencé. Il a besoin d’une **phase de convergence** : une base de données de référence, des contrats explicites, une sécurité par rôles, des tests de parcours et une documentation qui ne déclare jamais plus que ce qui a été prouvé.

## Références internes

[1]: [Audit complet V2 — écart entre cahier des charges et implémentation](./AUDIT_COMPLET_V2.md)
[2]: [Audit technique complet du 15 août 2026](./AUDIT_TECHNIQUE_COMPLET_2026-08-15.md)
[3]: [Audit global du 16 août 2026](./AUDIT_GLOBAL_2026-08-16.md)
[4]: [Plan de finalisation Jobs et WAB](./PLAN_FINALISATION_JOBS_WAB.md)
[5]: [Journal des décisions](./DECISIONS.md)
[6]: [Changelog du 19 août 2026](./CHANGELOG.md)
[7]: [PRD du 16 août 2026](./PRD_2026-08-16.md)
[8]: [Documentation technique vivante](./DOCUMENTATION_TECHNIQUE.md)
[9]: [Plan de durcissement RLS](./docs/security/rls-hardening-plan.md)
[10]: [Historique Git du dépôt](https://github.com/arminellenouatin-droid/envolafricamagazine)
[11]: [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
