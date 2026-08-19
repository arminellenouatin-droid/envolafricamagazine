# Documentation technique finale — Envol Africa Marketplace

**Version :** 2026-08-19  
**Dernier commit principal :** `70b5604`  
**Application :** Next.js App Router, Supabase, Moneroo, Vercel

## Fonctionnalité vidéo Marketplace

L’option vidéo vendeur est gérée par la table `marketplace_video_subscriptions` et les colonnes `product_video_url`, `product_video_mime`, `product_video_size` et `product_video_updated_at` de `marketplace_products`. La migration de production `20260819_marketplace_product_video` a été appliquée au projet Supabase de production `rtfjwpytiuvoekomevpu` le 19 août 2026.

Le tarif est fixé côté serveur à **5 000 XOF par mois**. L’accès est considéré actif uniquement lorsque le paiement Moneroo est confirmé et que la date d’expiration n’est pas dépassée. Un abonnement permet au maximum **10 produits distincts avec vidéo**. Le remplacement d’une vidéo existante ne consomme pas un nouvel emplacement.

Les routes principales sont les suivantes :

| Route | Rôle |
|---|---|
| `/api/marketplace/video-subscription` | Consulter, initialiser et vérifier l’abonnement vidéo |
| `/api/marketplace/products/video/upload` | Recevoir une vidéo multipart, vérifier le propriétaire, la taille, le format et le quota, puis l’associer au produit |
| `/api/marketplace/products/video` | Préparer ou associer une vidéo depuis un flux d’upload direct |
| `/api/marketplace/products` | Exposer les métadonnées vidéo nécessaires à la fiche produit |
| `/marketplace/boutique` | Activer l’option et associer une vidéo à un produit |
| `/marketplace/produits/[id]` | Lire la vidéo principale côté client avec contrôles natifs et poster image |

Les vidéos acceptées sont MP4, WebM et MOV, avec une limite serveur de 3 Mo. La taille est contrôlée avant le stockage puis la vidéo est enregistrée dans le bucket `marketplace-product-videos`. Les erreurs de quota ou d’autorisation sont refusées côté serveur, même si l’interface est contournée.

## Cartes du landing Marketplace

Les cartes produits sont des éléments cliquables et accessibles au clavier. Un clic ouvre la fiche Marketplace, sauf pour un produit Magazine qui ouvre directement le Kiosque. La ligne d’actions a été supprimée. Le bouton Favoris intercepte son propre clic afin de ne pas déclencher la navigation.

La carte conserve uniquement l’image, le titre, le prix et la mention du paiement échelonné lorsqu’elle est disponible. La catégorie, la localisation, le fournisseur, le paiement comptant et la description secondaire ne sont plus affichés dans le landing.

## Paiement et limites de validation

Le code vérifie le statut Moneroo avant d’activer l’option vidéo. Une recette live avec un compte vendeur réel reste nécessaire pour confirmer le comportement de la passerelle, du retour de paiement et du webhook sur l’environnement Vercel. Aucun paiement réel n’a été exécuté automatiquement pendant cette passe.

## Sécurité Supabase

La migration vidéo active RLS sur la table d’abonnement et révoque les privilèges directs `anon` et `authenticated`. Les opérations métier passent par les routes serveur et la clé service Supabase.

L’audit Supabase du 19 août 2026 signale toutefois **19 tables supplémentaires avec RLS désactivé**, dont `public.audit_log`, `public.wab_messages`, `public.wab_conversations`, `public.magazine_categories`, `public.magazine_subscription_plans`, `public.crowdfunding_boosts` et plusieurs tables d’affiliation. Ces tables ne doivent pas être traitées automatiquement avec un simple `ENABLE ROW LEVEL SECURITY` sans écrire et tester les policies métier correspondantes, car cela pourrait bloquer des parcours légitimes. Elles constituent un release gate de sécurité distinct de la fonctionnalité vidéo.

## Vérifications réalisées

La compilation Next.js et la vérification TypeScript passent. Le landing Marketplace public a été ouvert après déploiement, une carte Magazine a été sélectionnée et a correctement ouvert le Kiosque. La page boutique affiche le tarif, le quota et le formulaire vidéo. La fiche Kiosque et les cartes Marketplace ont été vérifiées visuellement sur le navigateur sandbox.

La recette restante recommandée est une validation authentifiée avec un vendeur réel : paiement confirmé, upload inférieur à 3 Mo, refus d’un fichier supérieur, refus au onzième produit distinct, remplacement d’une vidéo existante et lecture côté acheteur.
