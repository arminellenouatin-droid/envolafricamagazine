# Audit complet de l’écosystème Envol Africa

**Date de l’audit :** 20 août 2026  
**Environnement audité :** Production Vercel — `https://envolafricamagazinealokpe.vercel.app`  
**Périmètre :** Magazine, Kiosque, WAB, Marketplace, Jobs, Crowdfunding, Africa Awards, Salons, authentification, SEO, API et paiements Moneroo.  
**Auteur :** Manus AI

## 1. Conclusion exécutive

L’écosystème est **accessible en Production et techniquement compilable**, mais il ne peut pas encore être déclaré totalement stabilisé ni validé financièrement pour tous les modules. Le socle le plus avancé est le Crowdfunding : la campagne MagicAfrica est visible, les 200 XOF de deux paiements réussis apparaissent dans Supabase, le webhook central Moneroo vérifie la signature et revalide le paiement, et le domaine Production répond correctement.

L’audit a toutefois confirmé plusieurs anomalies concrètes. Trois liens de compétitions Africa Awards conduisent à des pages 404. Un article affiché dans « À la une » conduit également à une page 404. L’API dynamique des moyens de paiement répond 200 mais renvoie une liste vide avec `source: moneroo-error` pour plusieurs pays, ce qui compromet la sélection automatique des moyens de paiement et confirme qu’il faut corriger l’endpoint Moneroo utilisé. Plusieurs pages ont des métadonnées SEO incomplètes, des balises canoniques absentes, et les fichiers `robots.txt`/`sitemap.xml` pointent vers `envolafricamag.com` alors que l’environnement réellement audité est `envolafricamagazinealokpe.vercel.app`.

La sécurité de base est plutôt correcte sur les routes observées : HSTS, anti-sniffing, anti-framing, politique de référent, politique de permissions et contrôle HMAC du webhook sont présents. En revanche, la CSP est minimale et ne définit pas les sources de scripts, styles, images, connexions ou objets. L’architecture reste hétérogène : Crowdfunding a été migré vers Supabase, tandis qu’Africa Awards et certains autres modules utilisent encore des adaptateurs JSON locaux ou des fallbacks. Cette coexistence est le principal risque de cohérence et de persistance lors d’une utilisation réelle.

> **Verdict :** mise en ligne possible pour continuer des tests contrôlés, mais pas validation finale « zéro erreur ». Les corrections prioritaires sont les liens 404, l’endpoint des méthodes Moneroo, la normalisation des URLs SEO et la sécurisation de l’atomicité du règlement financier.

## 2. Méthode et limites

Les tests ont combiné des requêtes HTTP publiques, l’ouverture visuelle des pages Production, la consultation de la console navigateur, l’analyse statique du dépôt local, un build Next.js local et la comparaison avec la documentation officielle Moneroo. Aucun paiement supplémentaire, reversement, suppression, création de compte, publication, upload ou modification de base n’a été déclenché pendant cet audit.

Les parcours nécessitant une session authentifiée — administration, création de projet, publication WAB, boutique vendeur, candidature, achat final et reversement — n’ont pas pu être considérés comme validés de bout en bout sans utiliser le compte connecté du propriétaire. Ils sont donc classés **à confirmer**, et non comme « fonctionnels » ou « cassés » par défaut.

## 3. État des plateformes

| Plateforme | Tests publics réalisés | Résultat observé | État actuel |
|---|---|---|---|
| Magazine | Accueil, bandeau À la une, articles et navigation | Page 200, console sans erreur ; un lien éditorial mène à 404 | **Partiellement validé** |
| Kiosque | Catalogue, filtres, couvertures, fiches et bouton Feuilleter | Page 200 ; quatre numéros visibles ; couvertures accessibles ; anciennes URLs encore utilisées | **Partiellement validé** |
| WAB | Fil, stories, pages ENVOL AFRICA/YEKPON DIGIT, réactions et commentaires publics | Page 200, contenu public visible, console sans erreur | **Partiellement validé** |
| Marketplace | Produits, vendeurs, certifiés, boîte à outils, recherche par image et filtres | Page 200, catalogue visible, console sans erreur ; couvertures sur ancien domaine | **Partiellement validé** |
| Jobs | Recherche, pays, secteurs, publication de candidature/offre, accès payants | Page 200 ; aucune offre par défaut ; console sans erreur | **Partiellement validé** |
| Crowdfunding | Campagne publique, fiche MagicAfrica, API publique, options Don/Part/Prêt | Page 200 ; API projet 200 ; 200 XOF et 2 investisseurs visibles | **Module financier le plus avancé** |
| Africa Awards | Landing page, compétitions, CTA candidat/organisateur | Landing 200 ; `demo-1`, `demo-2`, `demo-3` en 404 | **Anomalie critique de routage** |
| Salons | Route publique et chargement | Route 200 | **Contrôle superficiel uniquement** |

## 4. Anomalies fonctionnelles confirmées

### 4.1 Liens Africa Awards cassés — priorité P0

La page `/africa-awards` génère explicitement les URLs `/africa-awards/competitions/demo-1`, `/demo-2` et `/demo-3`. Ces trois URLs répondent 404. Le code de la page utilise des identifiants artificiels `demo-${i}`, tandis que les pages dynamiques de compétition chargent les compétitions à partir de données qui attendent vraisemblablement un slug réel. Le visiteur voit donc des compétitions « en direct » mais ne peut ouvrir aucune fiche.

**Correction recommandée :** utiliser les vrais slugs issus de la source de données, ou supprimer les cartes de démonstration tant qu’aucune compétition réelle n’est publiée. Ajouter un test automatisé qui vérifie qu’aucun lien affiché publiquement ne répond 404.

### 4.2 Article « Énergie solaire » cassé — priorité P0

Le bandeau « À la une » et plusieurs blocs éditoriaux utilisent `/article/nergie-solaire-vers-le-pari-gagnant-du-sahel-3`. Cette route répond 404. Le slug semble avoir perdu le caractère initial `É`, ou ne correspond pas au slug enregistré.

**Correction recommandée :** corriger le slug dans la donnée source et ajouter une redirection permanente depuis l’ancienne URL. Les liens éditoriaux doivent être générés à partir de l’identifiant réel de l’article, jamais reconstruits manuellement.

### 4.3 Moyens de paiement dynamiques vides — priorité P0 financier

Les appels Production suivants répondent HTTP 200 mais sans méthode :

| Requête | Réponse observée |
|---|---|
| `/api/payment/methods?country=BJ&currency=XOF` | `methods: []`, `source: moneroo-error` |
| `/api/payment/methods?country=NG&currency=NGN` | `methods: []`, `source: moneroo-error` |
| `/api/payment/methods?country=GH&currency=GHS` | `methods: []`, `source: moneroo-error` |

Le code appelle `https://api.moneroo.io/v1/utils/payment/methods`, tandis que la documentation officielle indique `GET https://api.moneroo.io/utils/payment/methods` [1]. Cette divergence est une cause probable du résultat vide. Le code possède en parallèle un catalogue local limité au Bénin/XOF avec `card_xof`, `mtn_bj` et `moov_bj`. Celtiis n’est pas présent.

**Correction recommandée :** aligner l’URL sur la documentation officielle, journaliser le statut et le corps d’erreur côté serveur sans exposer de secret, traiter séparément les méthodes réellement retournées par Moneroo et compléter le catalogue local uniquement comme fallback explicite. La présence d’une carte bancaire dans l’interface ne doit être affichée que si le checkout Moneroo accepte réellement `card_xof`.

## 5. Audit financier et Moneroo

### 5.1 Points positifs

Le webhook `/api/webhooks/moneroo` accepte les événements de paiement, vérifie `X-Moneroo-Signature` en HMAC-SHA256 et rejette une signature absente ou invalide en 403. Il reconsulte ensuite le paiement auprès de Moneroo avant de créditer certains produits, ce qui suit les recommandations officielles [1] [2]. Les événements non financiers et les événements de reversement sont traités sans créditer automatiquement un produit.

Le test négatif Production a confirmé que le webhook sans signature reçoit `403 Signature manquante`. Le paiement avec panier vide reçoit `400 Panier vide`, et la vérification sans identifiant reçoit `400`. Ces comportements sont corrects et ne modifient pas les données.

La boucle Crowdfunding déjà réalisée est cohérente avec les preuves disponibles : deux paiements de 100 XOF ont été confirmés, le total affiché est 200 XOF, et deux investisseurs sont comptabilisés. L’API publique `/api/crowdfunding/projects?id=...` répond 200 avec le projet MagicAfrica.

### 5.2 Risques financiers à traiter

La documentation Moneroo précise qu’il faut vérifier la référence, le statut, la devise et le montant avant de créditer le client, et gérer les doublons [2]. Le code revalide le statut, mais la fonction `settleCrowdfundingContributionSupabase` met à jour le projet et ses totaux avant d’enregistrer définitivement la transaction dans `crowdfunding_payment_transactions`. En cas d’échec après la mise à jour du projet, un total pourrait être augmenté sans transaction correspondante. La protection par référence limite les doublons, mais elle ne remplace pas une transaction SQL atomique ou une fonction RPC qui réalise tout le règlement en une seule opération.

La contribution utilise `metadata.amount_xof` pour le montant enregistré. L’audit doit confirmer que ce montant est systématiquement comparé au montant confirmé par Moneroo, et qu’une métadonnée falsifiée ne peut jamais créditer un montant différent du paiement réellement reçu. La logique de règlement doit utiliser en priorité le montant et la devise issus de la vérification Moneroo, puis comparer avec le montant attendu de la commande.

Le reversement Crowdfunding calcule bien brut, taux, commission et net sur le brut et exige que le projet ait atteint son objectif. Cependant, la route POST crée seulement une demande `requested`; elle ne lance pas encore un transfert Moneroo. Le calcul de 4 % et la permission porteur doivent être validés sur une session réelle. Le cas MagicAfrica n’est pas éligible au reversement tant que son objectif de 5 000 000 XOF n’est pas atteint, même si 200 XOF ont été collectés.

### 5.3 Parcours financiers non encore validés

| Parcours | État de preuve |
|---|---|
| Crowdfunding : contribution → checkout → webhook → Supabase | **Réussi sur deux paiements de 100 XOF** |
| Crowdfunding : rejeu du même webhook | **À exécuter avec une référence identique** |
| Crowdfunding : brut/4 %/net sur dashboard porteur | **À confirmer avec session porteur** |
| Crowdfunding : demande de reversement | **Route présente, transfert réel non validé** |
| Magazine : achat et retour panier | **À confirmer** |
| Abonnement : activation après paiement | **À confirmer** |
| WAB : compte Business après paiement | **À confirmer** |
| Marketplace : commande et paiement | **À confirmer** |
| Jobs : décryptage/abonnement/boost | **À confirmer** |
| Africa Awards : vote Moneroo | **À confirmer, routes de compétition actuellement cassées** |
| Don | **Route publique présente, paiement réel non validé** |

## 6. Audit sécurité et architecture

### 6.1 Contrôles observés

Les réponses Production contiennent HSTS avec preload, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, une `Permissions-Policy` limitant caméra, microphone et géolocalisation, ainsi qu’une CSP `frame-ancestors 'self'`. Les routes administratives testées sans session refusent l’accès ou redirigent vers la connexion dans plusieurs cas.

Le cookie d’authentification est configuré `httpOnly`, `secure` en Production, `sameSite=lax`, avec une durée de 30 jours. Le secret JWT est exigé en Production. Le webhook est protégé contre les signatures absentes et utilise une comparaison à temps constant.

### 6.2 Faiblesses et risques

La CSP actuelle ne définit pas `default-src`, `script-src`, `style-src`, `img-src`, `connect-src` ou `object-src`. Elle limite l’encadrement des iframes mais ne constitue pas une politique complète contre l’injection de scripts. Une CSP progressive doit être introduite après inventaire des domaines nécessaires : Supabase, Moneroo, CDN d’images, analytics, fontes et médias.

L’architecture de données est mixte. Crowdfunding utilise Supabase pour la partie stabilisée, mais `src/lib/awards-db.ts` lit et écrit encore `src/data/awards.json`. D’autres modules contiennent des fallbacks JSON ou des données de démonstration. En Production, les écritures JSON locales sont explicitement bloquées par `db.ts`. Toute route qui atteint encore `writeDB`, `writeAwardsDB`, `writeWabDB` ou un fallback non migré peut donc échouer ou perdre sa persistance après redéploiement, même si la page publique se charge.

Une analyse statique a signalé 16 routes d’écriture sans contrôle apparent. L’échantillon `/api/admin/magazines` est en réalité protégé par `getCurrentUserForAdmin`, ce qui montre que l’alerte automatique comporte des faux positifs. Il faut néanmoins procéder à une revue manuelle de chaque route, surtout Awards, remboursements, uploads, services, votes et partages. La règle de validation doit être explicite : authentification, autorisation par rôle, propriété de la ressource, validation de schéma, limitation de fréquence et journalisation.

## 7. Audit SEO, référencement Google et moteurs IA

### 7.1 Résultats techniques

| Page | Titre | Description | Canonical | Open Graph | JSON-LD |
|---|---|---|---|---|---|
| Accueil | Présent | Présente | Absente | Absent | 0 |
| Kiosque | Présent | Présente | Absente | Absent | 0 |
| WAB | Présent | Présente | Absente | Absent | 0 |
| Marketplace | Présent | Présente | Présente mais relative `/marketplace` | Présent | 0 |
| Jobs | Présent | Présente | Absente | Absent | 0 |
| Crowdfunding | Titre générique Magazine | Description générique Magazine | Absente | Absent | 0 |
| Africa Awards | Titre générique Magazine | Description générique Magazine | Absente | Absent | 0 |

Les pages principales ne fournissent généralement ni canonical absolue, ni Open Graph complet, ni données structurées JSON-LD. Crowdfunding et Africa Awards réutilisent un titre de magazine générique, ce qui réduit la compréhension par Google, les réseaux sociaux et les moteurs IA. WAB n’expose pas de H1 détecté par l’analyse HTML alors que son contenu pourrait bénéficier d’un titre sémantique.

Le fichier `robots.txt` et le sitemap Production renvoient vers `https://envolafricamag.com`, alors que le domaine audité est `https://envolafricamagazinealokpe.vercel.app`. Si le domaine canonique de lancement est bien `envolafrica.com`, le projet Vercel doit déclarer clairement ce domaine et rediriger l’environnement technique. Sinon, robots, sitemap et balises canoniques doivent pointer vers le domaine réellement publié. La coexistence des deux identités crée un risque de duplication et de mauvaise indexation.

La stratégie pour robots IA est documentée dans le fichier robots : certains robots peuvent accéder à l’accueil et au Kiosque, tandis que les articles complets sont bloqués. Cette politique doit être décidée par le propriétaire de la plateforme, puis alignée avec les extraits gratuits réellement visibles. Elle ne doit pas contenir de commentaires internes ou de décision en attente dans un fichier destiné aux robots.

### 7.2 Recommandations SEO prioritaires

Chaque plateforme doit disposer de son propre titre, description, canonical absolue, `og:title`, `og:description`, `og:image`, `twitter:card` et données JSON-LD adaptées. Le Magazine doit utiliser `NewsMediaOrganization`, `Article` et `CollectionPage`; le Kiosque `Product` ou `CollectionPage`; Jobs `JobPosting` uniquement pour des offres réelles et non expirées; Marketplace `Product` et `Organization`; Crowdfunding `Project` ou `Organization` selon le modèle validé; Africa Awards `Event` et `Person` pour les candidats réels.

Les données structurées ne doivent pas annoncer de chiffres fictifs ou de compétitions de démonstration en Production. Les statistiques telles que « 2.5M+ spectateurs », « 150+ compétitions » et « 500K+ votes » doivent être présentées comme des chiffres vérifiables, ou retirées tant que leur source n’est pas établie.

## 8. Performance et médias

Les pages principales sont servies en HTTP 200 et les consoles consultées n’ont pas remonté d’erreur JavaScript lors des chargements publics. Le build local Next.js se termine correctement. L’audit n’a pas mesuré de manière instrumentée le LCP, INP, CLS ou le poids total sur réseau mobile, donc il ne serait pas honnête de déclarer la performance conforme aux Core Web Vitals.

Les couvertures de magazines dans Kiosque et Marketplace utilisent encore l’ancien domaine `envolafricamagazinegildas.vercel.app`. Elles répondent HTTP 200 au moment du test et ne sont donc pas cassées actuellement, mais cette dépendance doit être supprimée. Les médias doivent être servis depuis le domaine et le stockage Production officiels, avec optimisation, cache long pour les fichiers versionnés, tailles responsives et formats modernes lorsque possible.

## 9. Parcours utilisateurs et erreurs de navigation

Les parcours publics principaux se chargent : accueil, Kiosque, WAB, Marketplace, Jobs, Crowdfunding, Africa Awards, Salons, abonnement, panier et don. Les routes de détail Magazine testées répondent 200, sauf l’article Énergie solaire déjà signalé. Les routes de candidature Jobs, abonnement Jobs, compétitions Africa Awards et demande organisateur répondent 200 au niveau HTTP.

Le statut HTTP 200 sur une page protégée ne signifie pas toujours que le parcours est opérationnel : plusieurs pages affichent une coquille ou attendent une session côté client. Les routes `/emploi/dashboard` et `/marketplace/admin` redirigent correctement vers la connexion. En revanche, `/financement/dashboard/porteur`, `/wab/admin`, `/wab/createur`, `/compte`, `/notifications` et `/messages` répondent 200 sans redirection immédiate; il faut vérifier dans l’interface qu’elles affichent clairement « connexion requise » sans données privées ni commandes actives.

WAB expose les réactions, commentaires et pages attendues au public. Les workflows de création de publication, média image, document, vidéo, création de page et groupe, droits premium, messagerie et notifications restent à valider avec le compte concerné. Jobs expose une recherche et des CTA cohérents, mais ne présente aucune offre par défaut dans l’état audité. Marketplace expose le catalogue et la boîte à outils, mais les parcours vendeur, vidéo payante, boutique, panier et paiement ne sont pas validés.

## 10. Plan de correction prudent

| Priorité | Action | Critère de sortie |
|---|---|---|
| P0 | Corriger les trois URLs Africa Awards et l’article Énergie solaire | Aucun lien public testé ne renvoie 404 |
| P0 | Corriger `/v1/utils/payment/methods` vers l’endpoint Moneroo documenté, vérifier le format de réponse et ajouter Celtiis uniquement si réellement disponible | BJ/XOF et pays ciblés retournent des méthodes cohérentes |
| P0 | Rendre le règlement Crowdfunding atomique et comparer montant/devise Moneroo avec la commande | Rejeu idempotent, aucune double comptabilisation, aucun total orphelin |
| P0 | Tester le dashboard porteur avec session réelle | Brut, commission et net affichés sans lancer de transfert |
| P1 | Migrer Awards et les fallbacks d’écriture vers Supabase | Aucune écriture métier Production vers JSON local |
| P1 | Revoir manuellement les 16 alertes de routes d’écriture | Chaque endpoint documente auth, rôle, propriété et validation |
| P1 | Corriger robots, sitemap, canonical et domaine officiel | Une seule identité canonique partout |
| P1 | Ajouter métadonnées et JSON-LD par plateforme | Chaque landing page possède title, description, canonical absolue, OG et schema adapté |
| P2 | Mesurer Core Web Vitals et optimiser médias | LCP, INP et CLS mesurés sur mobile et desktop avec budgets définis |
| P2 | Passer un test authentifié par plateforme | Publication, upload, panier, paiement, retour, notification et message validés |

Chaque lot doit être traité sur une branche dédiée, suivi d’un build, d’un test de routes, d’un test de console, d’un test négatif de sécurité, puis d’un checkpoint avant déploiement. Aucun test financier ne doit utiliser un transfert réel sans confirmation explicite et sans journal de référence Moneroo.

## 11. Verdict final

**Le projet est en ligne et le socle Crowdfunding est fonctionnel jusqu’à l’enregistrement Supabase.** Il reste toutefois quatre risques de production prioritaires : les liens 404, les moyens de paiement dynamiques vides, l’atomicité du règlement financier et la coexistence de bases JSON locales avec Supabase. Le référencement est insuffisamment normalisé et la CSP doit être renforcée.

La recommandation est de maintenir Production accessible pour des tests contrôlés, mais de considérer l’écosystème comme **partiellement validé**, et non comme entièrement terminé. La prochaine intervention la plus sûre est un lot P0 limité aux liens cassés et à l’endpoint Moneroo, suivi d’un test de non-régression financier et d’un checkpoint. Les parcours authentifiés et le reversement doivent ensuite être vérifiés depuis le compte porteur réel.

## Références

[1]: https://docs.moneroo.io/introduction/webhooks.md "Moneroo — Webhooks"

[2]: https://docs.moneroo.io/payments/transaction-verification.md "Moneroo — Transaction verification"

[3]: https://docs.moneroo.io/payments/available-methods.md "Moneroo — Available methods"

[4]: https://docs.moneroo.io/payments/initialize-payment.md "Moneroo — Initialize payment"
