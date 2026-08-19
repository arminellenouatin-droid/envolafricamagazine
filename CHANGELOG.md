# Changelog — Envol Africa

## 2026-08-19 — Finalisation Marketplace et vidéo produit

Le landing Marketplace présente désormais des cartes compactes et cliquables. La ligne d’actions a été supprimée sur mobile et ordinateur ; le clic ouvre directement la fiche correspondante, avec un traitement spécifique pour les magazines qui ouvrent le Kiosque. Les catégories, localisations, fournisseurs, paiements comptants et descriptions secondaires ont été retirés de l’aperçu compact.

La barre Marketplace comprend maintenant les vues Produits, Vendeurs, Certifiés et Boîte à outils. La recherche par image est intégrée à la barre de recherche et les filtres mobiles sont regroupés derrière l’icône filtre.

L’option vidéo vendeur a été ajoutée au tarif de 5 000 XOF par mois. Elle autorise jusqu’à 10 produits avec vidéo active, avec remplacement gratuit d’une vidéo existante. Les vidéos sont limitées à 3 Mo et aux formats MP4, WebM et MOV. La fiche produit lit la vidéo principale avec l’image produit comme poster lorsque celle-ci est configurée.

La migration Supabase `marketplace_product_video_20260819` a été appliquée en production. Elle crée `marketplace_video_subscriptions`, ajoute les métadonnées vidéo à `marketplace_products`, active RLS sur la table d’abonnement et révoque les accès directs publics.

La page `/marketplace/boutique` permet d’activer l’option vidéo via Moneroo et d’associer une vidéo à un produit. Les routes serveur vérifient la session, le propriétaire du produit, l’état de l’abonnement, le format, la taille et le quota.

La compilation de production passe. Le code a été poussé dans le commit `70b5604`.

## Vérifications et limites connues

Le rendu public du Marketplace, le clic d’une carte Magazine vers le Kiosque, la fiche Kiosque et la page boutique ont été vérifiés dans le navigateur. Une recette authentifiée Moneroo avec un vendeur réel reste nécessaire pour certifier le paiement live, l’upload et le quota complet.

L’audit Supabase signale encore 19 tables avec RLS désactivé et plusieurs tables avec RLS activé sans policies métier. Ces tables constituent un risque de sécurité indépendant et doivent être traitées par domaine avec des policies testées ; elles n’ont pas été verrouillées automatiquement afin de ne pas interrompre les API existantes.

La documentation technique détaillée se trouve dans `DOCUMENTATION_TECHNIQUE.md`. Le PRD doit conserver ces release gates et ne pas déclarer l’écosystème entièrement prêt tant que la recette RLS et Moneroo live ne sont pas validées.
