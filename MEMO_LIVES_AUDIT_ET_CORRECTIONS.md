# MEMO DE MISSION : AUDIT, CORRECTIONS ET FIABILISATION DES LIVES (WAB & AFRICA AWARDS)

## 1. Objectif en une phrase
Nettoyer et fiabiliser définitivement les deux systèmes Live (WAB Salons & Africa Awards) en établissant Agora comme unique moteur RTC vidéo/audio, en éliminant les conflits de caméra/anciens WebRTC/Supabase canvas, en intégrant les améliorations ergonomiques du kit UI fourni, tout en préservant 100% des interfaces, composants et règles métier existants.

## 2. Périmètre
- **Inclus** :
  1. Élimination complète de la concurrence matérielle (suppression des doubles `getUserMedia()`, WebRTC P2P et frames canvas base64 sur Supabase Realtime).
  2. Moteur RTC Agora unifié (`AgoraLiveEngine` et `useAgoraLive`) : validation stricte de publication (caméra + micro réels avant passage à `status = "live"`), fin des écrans noirs, reconnexion réseau résiliente, arrêt/départ propre.
  3. WAB Live Salons (`SalonClient.tsx`) : refonte du cycle de vie média 100% Agora, parcours « Monter sur scène » avec sas de prévisualisation (preview locale avant publication), confirmation de sortie et d'arrêt immédiat pour le créateur et les spectateurs.
  4. Africa Awards Live (`HostLiveStudioPage`, `SpectatorLivePage`, `LiveCandidateStudio`, `LiveHostGrid`) : suppression du `getUserMedia` concurrent du candidat, raccordement propre de la grille multi-candidats sur scène avec `live.attachRemote`, préservation intégrale des votes, dons, cadeaux géants, classements en direct.
  5. Intégration du Kit UI (`envol-africa-live-ux-kit`) : adoption des classes et dispositions mobiles (`live.css`, grille dynamique 1 à 4 participants, états du bouton scène `idle -> pending -> accepted -> joining`), sans supprimer aucun bouton ou fonctionnalité existante.
  6. Déconnexion et nettoyage propre (`LIVE_ENDED` broadcast, fermeture des tracks, arrêt de la diffusion).
- **Hors périmètre** :
  - Pas de refonte visuelle destructive des pages existantes.
  - Ne jamais toucher aux composants sanctifiés (`Header.tsx`, `HeaderShell.tsx`).
  - Aucun secret dans le code ou les logs.

## 3. Décisions techniques
- **Source unique RTC** : `Agora LocalVideoTrack` et `Agora LocalAudioTrack` sont les seuls canaux captant et diffusant le flux média.
- **Rôle de Supabase** : Transport strict des événements temps réel (chat, cœurs, cadeaux, votes, états de demande de scène, signalisation `LIVE_ENDED`).
- **Prévisualisation Co-Host** : Lors de l'acceptation d'une montée sur scène, le spectateur/candidat visualise sa caméra en local avant confirmation de publication Agora (`setClientRole("host")`).
- **Grille responsive 1 à 4** : Adaptabilité plein écran (1), split vertical/horizontal (2), grille 2x2 (3-4).

## 4. Points de sécurité
- Respect des règles RLS sur Supabase et validation des rôles (`host`, `cohost`, `moderator`, `audience`) côté serveur.
- Aucune fuite de clé secrète ou de token de production.
- Token RTC éphémère délivré uniquement via `/api/live/agora/token`.

## 5. Bilan d'exécution
- [x] **Étape 1** : Renforcement d'`engine.ts` et `useAgoraLive.ts` (vérification réelle de publication des pistes vidéo/audio, gestion d'erreur explicite sans écran noir).
- [x] **Étape 2** : Nettoyage et assainissement de `SalonClient.tsx` (suppression de la concurrence `getUserMedia`, WebRTC P2P et frames canvas ; intégration du sas de prévisualisation et grille dynamique).
- [x] **Étape 3** : Assainissement d'Africa Awards Live (`LiveCandidateStudio.tsx`, `LiveHostGrid.tsx`, `HostLiveStudioPage`, `SpectatorLivePage`) pour le flux vidéo Agora multi-candidats.
- [x] **Étape 4** : Intégration des composants et styles du kit UI (`envol-africa-live-ux-kit`) dans le design system Live (`live.css`, états bouton scène, etc.).
- [x] **Étape 5** : Vérification TypeScript (`tsc --noEmit`), tests Vitest (61/61 verts) et validation end-to-end.
