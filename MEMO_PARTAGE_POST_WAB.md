# Mémo de Mission — Correction Partage & Affichage des Publications WAB

## 1. Objectif Réel
Résoudre deux anomalies critiques lors du partage d'un lien de publication WAB (`/wab/posts/[id]`) :
1. **Aperçu / Miniature sur les réseaux sociaux** : les réseaux sociaux affichaient la photo de profil de l'auteur au lieu du média de la publication (vidéo/image).
2. **Redirection indésirable** : cliquer sur le lien d'une publication redirigeait vers le haut du fil d'actualité (`/wab`) au lieu d'afficher la publication demandée.

## 2. Périmètre
- **Inclus** :
  - Création de la route dynamique d'image Open Graph `/api/og/wab-post/route.tsx` avec `next/og` (ImageResponse) : génération d'une miniature 1200x630 dédiée au format vidéo/texte avec badge "▶ VIDÉO EXCLUSIVE WAB", citation du post et branding Envol Africa.
  - Résolution des médias dans `getPostData` pour `generateMetadata` : détection prioritaire des vidéos et images, ajout des balises `og:video` et `twitter:player`.
  - Refonte de la page `src/app/wab/posts/[id]/page.tsx` : suppression de la redirection automatique brutale, affichage direct de la publication complète (lecteur vidéo natif, texte intégral, statistiques, commentaires et bouton de retour au fil).
  - Correction du défilement avec ancre `#post-[id]` dans `src/app/wab/WabClient.tsx` pour centrer et surligner le post lorsque l'utilisateur choisit d'ouvrir le fil.
- **Hors Périmètre** :
  - Composants sanctifiés (`Header.tsx`, `HeaderShell.tsx`) : strictement non modifiés.
  - Kiosque, Flipbook, abonnements Moneroo : inchangés.

## 3. Plan d'Exécution & Résultats
- [x] Phase 1 : Diagnostic des causes racines (résolution de la vidéo `No-video-title-fdown.net.mp4`, cause du fallback sur avatar, redirection client)
- [x] Phase 2 : Rédaction et suivi du mémo d'architecture
- [x] Phase 3 : Création de la route `/api/og/wab-post` pour les aperçus sociaux (cartes haute définition 1200x630 avec badge Vidéo/Opportunité/Rapport et lecteur miniature)
- [x] Phase 4 : Mise à jour de `src/app/wab/posts/[id]/page.tsx` et création de `WabSinglePostView.tsx` (métadonnées complètes OpenGraph / Twitter Player + vue dédiée standalone avec lecteur vidéo HTML5 natif, texte enrichi sécurisé, commentaires et liens de navigation)
- [x] Phase 5 : Amélioration du scroll et surlignage interactif dans `src/app/wab/WabClient.tsx` (retry intelligent jusqu'à 15 tentatives, écouteur d'événement `hashchange`, animation douce et bordure éclairée `ring-4 ring-[#006874]`)
- [x] Phase 6 : Validation du build (`tsc --noEmit` et `next build` réussis avec code 0, 0 erreur)
- [x] Phase 7 : Déploiement et rapport de livraison
