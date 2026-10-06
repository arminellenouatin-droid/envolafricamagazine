# Spécifications UX/UI

## Priorité visuelle
1. Vidéo
2. Identité du Live
3. Interaction
4. Contrôles
5. Fonctions secondaires

## Mobile
- Vidéo plein écran.
- Contrôles flottants.
- Rail droit pour réactions/chat/cadeaux/participants/partage.
- Barre basse semi-transparente.
- Bouton Quitter toujours accessible.
- Bouton Arrêter toujours accessible au host.
- CTA Monter sur scène clairement identifiable pour le spectateur.

## Multi-participants
- 1 : plein écran.
- 2 : split vertical.
- 3-4 : grille 2x2.
- Au-delà de 4 : utiliser une stratégie de pagination/spotlight selon les règles métier existantes.

## Accessibilité
- Zone tactile minimale ~44px.
- aria-label sur les icônes.
- états disabled/pending explicites.
- ne jamais dépendre uniquement de la couleur.

## Règles produit
- Ne supprimer aucun bouton existant.
- Ne supprimer aucune fonction métier existante.
- Ne pas remplacer Agora.
- Ne pas réintroduire WebRTC P2P pour la vidéo principale.
- Ne pas utiliser Supabase Realtime pour transporter des images vidéo.
- Les composants UI ne doivent pas posséder la logique de connexion Agora.
- Le moteur Live existant reste la source de vérité technique.

## Africa Awards
Le bouton VOTER doit avoir une priorité visuelle élevée pendant un Live de compétition, sans masquer la vidéo.

## WAB
Le CTA Monter sur scène doit rester accessible, avec états:
idle -> pending -> accepted -> joining -> cohost.
