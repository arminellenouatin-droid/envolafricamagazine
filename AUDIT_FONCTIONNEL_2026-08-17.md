# Audit fonctionnel EAM — données, pages, liens et boutons

**Date :** 17 août 2026  
**Environnement testé :** dépôt local `/home/ubuntu/eam-repo`, serveur Next.js local sur le port 3100  
**Périmètre :** Magazine, Jobs, WAB, Marketplace, Crowdfunding et Africa Awards

## Synthèse

L’audit local confirme que les principales pages publiques et les pages dynamiques alimentées par les fixtures répondent correctement. Avant correction, trois liens internes renvoyaient vers des routes 404 et un endpoint Awards appelé par le front n’existait pas. Ces quatre anomalies ont été corrigées. Les pages statiques testées ne renvoient plus de 404 ni de réponse 5xx, et les pages dynamiques construites avec des identifiants réels de démonstration répondent en HTTP 200.

Le serveur local a été utilisé, car la dernière version du dépôt n’est pas encore disponible sur le domaine Vercel tant que la limite quotidienne de déploiement n’est pas réinitialisée. Ce rapport ne constitue donc pas une certification du domaine de production.

## Données de démonstration disponibles

| Plateforme | Données constatées | État de l’aperçu |
|---|---:|---|
| Magazine | 15 articles, 25 magazines | **Bon aperçu** des contenus éditoriaux et du kiosque |
| Jobs | 5 offres publiées, 3 candidats ajoutés pour la recette locale | **Bon aperçu** des offres et de la recherche candidats |
| WAB | 3 publications, 2 profils professionnels et 1 Salon ajoutés pour la recette locale | **Bon aperçu** du fil, de la recherche et des Salons |
| Marketplace | Catalogue seed avec pagination de 12 produits par page et `hasMore` pour les suivants | **Bon aperçu** catalogue, filtres et scroll infini |
| Crowdfunding | 8 projets avec secteurs, pays, montants, progression et types de financement | **Bon aperçu** des cartes et détails projets ; les contributions persistantes restent vides, tandis que le dashboard investisseur contient des exemples UI locaux |
| Africa Awards | 6 compétitions et 18 candidats | **Bon aperçu** des compétitions et candidatures ; les votes réels restent à zéro pour éviter de simuler un paiement confirmé |

Les données Jobs et WAB ajoutées dans cette étape sont des **fixtures locales de démonstration**. Elles ne remplacent pas une migration ou un seed Supabase de production. Les données Marketplace affichées par l’API locale proviennent du fallback seed lorsque Supabase ne renvoie pas de catalogue publié.

## Pages et routes testées

Les pages publiques suivantes ont répondu en HTTP 200 : `/`, `/emploi`, `/wab`, `/marketplace`, `/financement`, `/africa-awards`, `/kiosque`, `/abonnement`, `/service`, `/salons`, `/panier`, `/auth/login` et `/auth/register`. Les routes protégées comme `/admin` et `/emploi/dashboard` redirigent correctement vers l’authentification au lieu de laisser passer une session anonyme.

Les pages dynamiques suivantes ont été testées avec des identifiants effectivement renvoyés par les API : articles, offres Jobs, projets Crowdfunding, compétitions Awards, pages de vote Awards, produits Marketplace et page WAB. Toutes ont répondu en HTTP 200. La page du Salon de démonstration WAB et la page de recherche WAB répondent également en HTTP 200.

| Type de contrôle | Résultat |
|---|---|
| Pages statiques non dynamiques | 63 routes contrôlées, aucune réponse 404 ou 5xx |
| Destinations internes extraites du front | Toutes les destinations statiques corrigées répondent en 200 ou redirection d’authentification attendue |
| Pages dynamiques avec IDs de fixtures | Articles, Jobs, Crowdfunding, Awards, votes, Marketplace et WAB : 200 |
| Carte statique des endpoints API | 79 routes API présentes, 57 références littérales contrôlées, aucune référence orpheline après correction |
| Endpoint Awards d’affiliation | Route ajoutée ; réponse 401 attendue sans session, au lieu de 404 |
| Build de production | `npm run build` réussi ; TypeScript et génération des pages réussis ; 131 routes générées |

## Corrections réalisées

La page d’accueil Africa Awards pointait vers `/africa-awards/apply`, qui n’existe pas comme route statique, et vers `/africa-awards/organizer/requests/new`, dont le chemin réel est `/africa-awards/organizer/dashboard/requests/new`. Le premier lien dirige maintenant vers la liste des compétitions, qui contient les liens candidats dynamiques, et le second utilise la route réelle.

La page Crowdfunding pointait vers `/financement/creer`, qui n’existe pas. Les deux occurrences dirigent maintenant vers `/financement/dashboard/porteur`, l’espace porteur actuellement disponible pour gérer les projets et documents.

La page d’affiliation Africa Awards appelait `/api/awards/affiliate-links`, mais aucune route correspondante n’existait. Une route POST a été ajoutée. Elle exige une session, génère un code court non prévisible et renvoie 401 sans authentification ; elle ne crée pas encore une persistance Supabase complète des liens et conversions.

Des fixtures locales ont été ajoutées pour trois candidats Jobs, deux profils professionnels WAB et un Salon WAB. Aucun vote Awards payé, paiement Marketplace, contribution Crowdfunding ou transaction Jobs fictive n’a été créé, afin de ne pas simuler artificiellement une opération financière confirmée.

## Limites et prochaines vérifications

Les boutons sans handler détectés dans l’analyse statique ne sont pas tous des erreurs : certains sont des onglets, des contrôles de pagination ou des éléments de démonstration visuelle. Les actions de gouvernance Awards, les boutons de gestion administrative, le partage d’article et plusieurs actions de dashboard doivent encore être testés avec des comptes authentifiés, car un test anonyme ne permet pas de distinguer une protection correcte d’une action absente.

Le serveur local ne prouve pas que les données sont présentes dans Supabase ou sur Vercel. Avant de déclarer la recette finale, il faut déployer le commit issu de cette étape, tester avec les comptes de démonstration authentifiés, vérifier les politiques RLS par rôle et confirmer que les fixtures nécessaires à la production ont été migrées dans Supabase.

Les paiements réels, les votes Awards, les contributions Crowdfunding, les commandes Marketplace, les boosts et les abonnements Jobs doivent être testés uniquement avec un paiement Moneroo explicitement autorisé. Les boutons peuvent être fonctionnels côté code tout en dépendant de la disponibilité réelle de la passerelle Moneroo.
