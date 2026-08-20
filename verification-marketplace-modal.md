# Vérification — fiche produit globale Marketplace

La compilation Next.js passe après l’ajout du composant `ProductDetailModal` dans `src/app/marketplace/MarketplaceClient.tsx`.

Le composant remplace la navigation des cartes par un événement d’ouverture local. Il affiche l’image ou la vidéo, le titre, le prix, le paiement échelonné, le vendeur, la catégorie, la zone, la description et les actions panier, favoris, contact et fermeture.

Les cartes des vues Produits, Vendeurs et Certifiés transmettent toutes le produit sélectionné au modal. La fermeture fonctionne par bouton, clic sur l’arrière-plan et touche Échap. Le défilement du document est bloqué pendant l’ouverture.

La vérification visuelle locale a confirmé le rendu du landing, mais l’API catalogue locale n’a pas retourné de produits pendant cette session ; le clic sur une carte réelle doit donc être revalidé après déploiement avec les données Supabase disponibles.

Commit de code : `472e602`.
