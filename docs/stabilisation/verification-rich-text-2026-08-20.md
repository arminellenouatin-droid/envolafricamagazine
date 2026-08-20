# Vérification éditeur de texte enrichi — 20 août 2026

## Périmètre

L’éditeur enrichi est maintenant disponible dans le formulaire d’administration des articles pour le résumé, le contenu principal et le contenu des traductions linguistiques. Il est également utilisé pour la description des magazines dans `MagazineModal`.

## Mise en forme disponible

La barre d’outils accessible propose les commandes **gras**, *italique* et souligné. Les commandes s’appliquent au texte sélectionné et les boutons empêchent la perte de sélection lors du clic.

## Sécurité et compatibilité

Le contenu est nettoyé par `sanitizeRichText` lors de la saisie, du collage et du rendu. Les balises dangereuses, attributs d’événement et styles arbitraires sont retirés. Les anciens contenus texte restent compatibles grâce à la conversion automatique texte vers HTML sûr.

Les résumés d’articles et les descriptions de magazines sont rendus avec `RichTextContent`, qui applique à nouveau la sanitation avant insertion dans le DOM. Le payload métier conserve le contenu formaté sans modifier les structures de prix, de paiement ou de stockage des magazines.

## Vérification technique

La vérification `git diff --check`, TypeScript et la build Next.js ont été relancées après l’intégration de la barre d’outils, du formulaire article, des traductions, du formulaire magazine et de la fiche Kiosque.
