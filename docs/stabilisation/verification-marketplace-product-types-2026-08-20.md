# Vérification Marketplace — types d’offres et livraison numérique

## Périmètre

Le Marketplace accepte désormais cinq types d’offres : produit physique, service, formation, produit digital et fichier téléchargeable. Les catégories de catalogue existantes sont proposées dans le formulaire vendeur et restent administrables séparément.

## Parcours vendeur

Après création de la boutique, le vendeur trouve le formulaire dans son dashboard. Il sélectionne le type, la catégorie, le prix en XOF, la description, la zone, le mode de livraison et, pour une offre numérique, un fichier privé ou un lien HTTPS externe. Le minimum serveur est de 100 XOF. Les produits physiques demandent un stock ; les services, formations et produits numériques ne sont pas bloqués par un stock physique.

Les fichiers sont envoyés au bucket privé `marketplace-digital`, avec une limite de 100 Mo et une liste de formats contrôlée. Le stockage retourne un chemin privé, jamais une URL publique permanente.

## Parcours acheteur

Le paiement Marketplace continue d’être initialisé en XOF. Le webhook Moneroo vérifie le paiement et le montant avant de passer la commande à `paid`. Pour un service, une formation ou une offre digitale, un token d’accès est créé uniquement après confirmation. Le token est limité par expiration et nombre de téléchargements. Un fichier privé est servi par URL signée courte durée ; un lien externe n’est redirigé qu’après authentification et contrôle de l’acheteur.

La page `/marketplace/commandes` affiche l’historique et les accès numériques confirmés. Aucun accès n’est créé pour une commande simplement initiée, échouée ou annulée.

## Validation technique

La migration additive a été appliquée au projet Supabase réel. `git diff --check` et `pnpm build` passent après l’ajout du formulaire, des champs produit, de l’upload privé, du webhook et de l’espace client.

## Points à compléter avant production

Le fournisseur e-mail réel, l’identifiant AdSense et les secrets de production restent des prérequis externes. Les tests de paiement numérique doivent être réalisés avec un vendeur et un acheteur réels, puis vérifiés depuis le webhook Moneroo en production avant activation commerciale large.
