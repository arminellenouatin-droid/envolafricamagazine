# Envol Africa Live — UX/UI Kit

Kit d'intégration UX/UI pour les Lives WAB et Africa Awards.

OBJECTIF
- Conserver toutes les fonctionnalités et tous les boutons métier existants.
- Ne pas remplacer Agora : Agora reste le moteur RTC.
- Ajouter une présentation mobile-first inspirée des conventions des grands Lives.
- Utiliser Supabase pour l'état, les événements et le chat; Agora pour audio/vidéo.
- Les composants sont volontairement découplés du moteur Agora afin de pouvoir être branchés sur l'implémentation actuelle.

RÈGLE NON NÉGOCIABLE
Aucun bouton existant ne doit être supprimé. Les composants de ce kit servent à améliorer la hiérarchie, la position, l'accessibilité, les états et les animations.

CONTENU
- LiveShell.tsx : structure générale de l'écran.
- LiveHeader.tsx : identité du Live.
- LiveActionRail.tsx : réactions, chat, cadeaux, participants, partage.
- LiveBottomControls.tsx : commandes créateur/spectateur.
- StageRequestButton.tsx : demande/rejoindre la scène.
- ParticipantGrid.tsx : grille dynamique host/cohosts.
- LiveCenterSheet.tsx : panneau de contrôle créateur.
- LiveComments.tsx : commentaires flottants.
- live.css : design system et responsive.
- types.ts : contrats TypeScript.
- integration-example.tsx : exemple d'assemblage.

INTÉGRATION
1. Copier les composants dans votre dossier de composants Live.
2. Importer live.css une fois dans le module Live.
3. Brancher les callbacks sur vos fonctions existantes.
4. Brancher video tracks Agora sur ParticipantGrid.
5. Conserver vos boutons métier existants et passer leurs actions dans les callbacks.
6. Ne pas déplacer la logique Agora dans les composants UI.

IMPORTANT
Ce kit ne contient pas de faux moteur vidéo. Il ne remplace pas Agora.
Il est conçu pour recevoir vos flux vidéo Agora déjà publiés/souscrits.
