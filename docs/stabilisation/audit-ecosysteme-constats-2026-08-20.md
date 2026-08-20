# Audit écosystème Envol Africa — constats intermédiaires

## Routes Production testées

Le domaine `https://envolafricamagazinealokpe.vercel.app` répond en HTTP 200 sur `/`, `/kiosque`, `/wab`, `/emploi`, `/marketplace`, `/financement`, `/africa-awards`, `/auth/login`, `/compte`, `/panier`, `/abonnement` et `/don`. Les routes `robots.txt`, `sitemap.xml`, l’endpoint des moyens de paiement, l’API publique Crowdfunding, le webhook Moneroo en GET et plusieurs APIs publiques répondent également.

## Anomalies publiques déjà relevées

Le crawl des liens internes a trouvé des liens en 404 vers `/africa-awards/competitions/demo-1`, `/demo-2`, `/demo-3`, `/contact`, `/crowdfunding` et `/recherche`. Il faut vérifier s’il s’agit de liens de démonstration obsolètes ou de routes réellement attendues.

L’analyse SEO de la Production montre que la majorité des pages ont un titre et une description génériques ou hérités de Magazine. Les pages WAB, Emploi et Marketplace ont des titres plus adaptés. Les balises canonical, robots, Open Graph et données structurées sont absentes de plusieurs pages. Le sitemap publié pointe vers `https://envolafricamag.com` et ne contient que cinq URLs, alors que le domaine actif audité est `envolafricamagazinealokpe.vercel.app`.

L’endpoint `/api/payment/methods` répond `{"methods":[],"source":"moneroo-error"}`, ce qui indique une erreur ou une indisponibilité de la récupération dynamique des moyens de paiement. Ce point doit être confirmé dans les journaux et comparé au checkout Moneroo réel.

Les produits Magazine de l’API Marketplace référencent encore des images sur l’ancien domaine `envolafricamagazinegildas.vercel.app`. Cela crée un risque de médias cassés si l’ancien déploiement devient indisponible.

Les en-têtes de sécurité visibles comprennent HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` et une CSP limitée à `frame-ancestors 'self'`. Les routes administratives et de paiement testées sans session répondent 401, ce qui est positif. Le webhook GET répond explicitement que le POST signé HMAC-SHA256 est attendu.

## Limites de la preuve

Les actions nécessitant une session authentifiée — création, modification, paiement, reversement, administration, publication et tests de permissions par rôle — ne sont pas considérées comme validées tant qu’une session de test autorisée n’est pas disponible. Aucun paiement, reversement, suppression ou écriture destructive n’a été effectué pendant cet audit.

## Contrôle visuel WAB

La page WAB Production se charge et expose le fil, les stories, la page YEKPON DIGIT, la page ENVOL AFRICA, les réactions, commentaires et partages. La console du navigateur n’a remonté aucune erreur sur ce chargement public. La session est toutefois visiteur non connecté; les parcours de création, modification, suppression, upload et administration restent à tester avec un compte autorisé.

## Contrôle visuel Crowdfunding

La page `/financement` affiche une campagne MagicAfrica avec 200 F collectés, 2 investisseurs et un lien de fiche fonctionnel. La fiche `/financement/projets/51c966b9-193a-405a-af4e-b967a7fc7a25` finit par charger correctement après son état initial « Chargement projet… ». Elle expose les options Don, Part et Prêt, les montants 5k/10k/50k, un montant libre et le bouton de contribution. Aucun paiement n’a été lancé dans cet audit.

La fiche affiche un grand emplacement média vide pour la couverture/vidéo de présentation. Ce n’est pas nécessairement une erreur si le porteur n’a pas chargé de média, mais le rendu devrait prévoir un état vide plus explicite et vérifier que la couverture n’est pas simplement absente par défaut.

## Contrôle visuel Africa Awards

La page `/africa-awards` se charge et affiche trois compétitions avec des liens publics. Le premier lien `Africa Awards Édition 2025 - Finale 1` mène effectivement à `/africa-awards/competitions/demo-1`, qui affiche une page 404. Le même problème a été constaté par le crawl pour `demo-2` et `demo-3`. Il s’agit d’une anomalie fonctionnelle et SEO prioritaire : des compétitions présentées comme actives ne doivent pas mener à des routes inexistantes.

## Contrôle visuel Jobs

La page `/emploi` se charge, expose la recherche par mot-clé, pays et secteur, ainsi que les parcours « Publier ma candidature », « Publier une offre » et les accès payants. Elle ne retourne actuellement aucune offre publique pour la recherche par défaut. La console du navigateur n’a remonté aucune erreur lors du chargement public. Les parcours de candidature, décryptage payant, publication d’offre et vérification Moneroo nécessitent une session et restent à tester séparément.

## Contrôle visuel Kiosque

La page `/kiosque` se charge, affiche quatre numéros, le bandeau « À la une », les filtres année/format, la recherche, les fiches et le bouton « Feuilleter ». La console n’a remonté aucune erreur lors du chargement public. Les images de couverture des magazines référencent encore l’ancien domaine `envolafricamagazinegildas.vercel.app`, ce qui constitue un risque de rupture média commun avec Marketplace. Le parcours panier, prix réel, achat et flipbook protégé doit être testé avec une session et sans confirmer de paiement pendant l’audit.

## Référence officielle Moneroo

La documentation officielle Moneroo indique que les webhooks sont envoyés par POST, qu’ils doivent retourner HTTP 200, qu’un secret signe le payload avec HMAC-SHA256 et qu’une signature invalide doit être rejetée en 403. Elle recommande de reconsulter l’API Moneroo pour confirmer le statut, la référence, la devise et le montant avant de créditer un compte, ainsi que de gérer les doublons car les webhooks peuvent être renvoyés. Elle indique également que la liste des méthodes est disponible sur `GET https://api.moneroo.io/utils/payment/methods`.

Références :

- https://docs.moneroo.io/introduction/webhooks.md
- https://docs.moneroo.io/payments/available-methods.md
- https://docs.moneroo.io/payments/initialize-payment.md
- https://docs.moneroo.io/payments/transaction-verification.md

## Sécurité, paiements et architecture

Le build local du dépôt `eam-full` réussit avec un code de sortie nul. Le dernier déploiement Production Vercel est `READY`, ciblé `production`, sur le commit Git vérifié de la branche `main`. Les erreurs runtime groupées Vercel sur les dernières 24 heures sont nulles.

Les en-têtes observés sont globalement solides : HSTS avec preload, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictive et une CSP limitée à `frame-ancestors 'self'`. La CSP n’est pas une politique de contenu complète : elle ne définit pas de `default-src`, `script-src`, `object-src` ou `connect-src`; son niveau de défense contre XSS reste donc à renforcer.

Les tests négatifs sont corrects pour le paiement : panier vide rejeté en 400, vérification sans identifiant rejetée en 400 et webhook sans signature rejeté en 403. La route webhook relit le paiement auprès de Moneroo et gère une partie des doublons par référence Supabase, ce qui est conforme aux exigences générales Moneroo. Toutefois, le règlement Crowdfunding met à jour le projet (`montant_collecte` et `investisseurs`) avant l’upsert final de la transaction; une erreur après cette mise à jour pourrait laisser un total incohérent si la base ne l’encapsule pas dans une transaction atomique.

Le endpoint Production `/api/payment/methods` répond 200 mais renvoie `{"methods":[],"source":"moneroo-error"}` pour BJ/XOF, NG/NGN et GH/GHS. Le code utilise `https://api.moneroo.io/v1/utils/payment/methods`, alors que la documentation officielle indique `GET https://api.moneroo.io/utils/payment/methods`. Cette divergence est une anomalie probable et explique la liste vide dynamique. En parallèle, le catalogue local ne contient que `card_xof`, `mtn_bj` et `moov_bj`; Celtiis n’y figure pas et la carte XOF est présentée comme disponible sans preuve que le checkout Moneroo l’active effectivement.

La route de reversement impose l’authentification, vérifie que le porteur est propriétaire du projet, exige un objectif atteint et calcule la commission sur le brut. Elle ne lance pas encore un transfert Moneroo : elle crée seulement une demande `requested`. Le contrôle brut/commission/net n’a donc pas été confirmé en session porteuse.

L’analyse statique a trouvé plusieurs familles à revoir, notamment Awards qui utilise encore `awards-db.ts` et écrit dans `src/data/awards.json`, ainsi que des fallbacks JSON dans d’autres modules. En Production, les écritures JSON sont bloquées, ce qui peut transformer certaines fonctions administratives ou sociales en erreurs 500 si elles ne basculent pas correctement vers Supabase. Une analyse automatique a signalé 16 routes d’écriture sans authentification apparente; l’échantillon `/api/admin/magazines` est en réalité protégé par `getCurrentUserForAdmin`, donc cette liste doit être revue manuellement plutôt que considérée comme une preuve de vulnérabilité.

## Contrôle visuel Marketplace

Marketplace se charge sans erreur console et expose Produits, Vendeurs, Certifiés, Boîte à outils, recherche par image, catégories, pays et fiches produits. Les images des quatre magazines réutilisent encore `envolafricamagazinegildas.vercel.app`; elles répondent HTTP 200 aujourd’hui, mais cette dépendance à l’ancien projet est un risque de disponibilité et de cohérence de déploiement. Les actions d’achat, panier, paiement, création de boutique et vidéo vendeur ne sont pas validées dans cet audit sans session authentifiée.

## Routes publiques et référencement éditorial

Les racines Production `/`, `/kiosque`, `/wab`, `/marketplace`, `/emploi`, `/financement`, `/africa-awards`, `/salons`, `/abonnement`, `/panier` et `/don` répondent HTTP 200. Cinq des six liens d’articles À la une testés répondent HTTP 200. Le lien « Énergie solaire : le pari gagnant du Sahel » mène à `/article/nergie-solaire-vers-le-pari-gagnant-du-sahel-3`, qui répond HTTP 404. Ce lien cassé est à corriger immédiatement, car il est exposé dans le Kiosque et peut être découvert par les moteurs.
