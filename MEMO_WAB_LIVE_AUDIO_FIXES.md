# Mémo de Mission — WAB Live & Messagerie Vocale

## 1. Objectif
Corriger les 4 dysfonctionnements majeurs du Live WAB TikTok (`/wab/salons/[id]`), fiabiliser le décrochage et l'échange audio bidirectionnel des appels vocaux (`/messages`), et garantir une responsivité parfaite sur tous les écrans sans aucun débordement.

## 2. Périmètre
- **WAB Live TikTok** :
  - Affichage réel de la photo de profil de l'hôte (suppression des photos génériques d'Unsplash).
  - Diffusion vidéo réelle de la caméra de l'hôte vers tous les spectateurs connectés (WebRTC P2P + fallback synchronisation de trames canvas).
  - Affichage systématique du nom de l'auteur sur les commentaires et cadeaux reçus (optimisation `authorName` et diffusion broadcast instantanée).
  - Possibilité pour un spectateur de « Demander à monter sur scène / live » avec approbation de l'hôte et affichage en écran partagé (Dual Live / Battle TikTok).
- **Messagerie & Appels Audio** :
  - Résolution du blocage au décrochage de l'appel audio (signalisation WebRTC via canal Supabase Realtime Broadcast + persistance des sessions d'appels sur disque/serveur).
  - Déclenchement garanti du flux audio bidirectionnel et lecture automatique débloquée dès le clic sur « Décrocher ».
  - Audit et ajustements responsives de `/messages` (en-têtes mobiles, barre de saisie, aucune barre de défilement horizontale).

## 3. Décisions Techniques
1. **Canal Supabase Realtime Broadcast (`salon_live_[id]` & `wab_audio_call_[id]`)** :
   - Évite les pertes de mémoire inter-instances sur Vercel serverless.
   - Signalisation WebRTC instantanée (Offer, Answer, ICE Candidates).
   - Chat, cadeaux et cœurs synchronisés en temps réel sans latence de polling.
2. **Double flux de streaming pour le Live** :
   - Flux principal : WebRTC P2P (30 fps fluide + audio hôte).
   - Flux de secours instantané : Canvas frame sync (capture et envoi régulier d'instantanés) assurant que le spectateur voit toujours la caméra même si la négociation WebRTC prend quelques secondes ou traverse un NAT strict.
3. **Persistance multi-instances des appels audio** :
   - Synchronisation disque (`wab-active-calls.json`) pour `/api/messages/call` pour garantir la persistance entre différentes lambdas.

## 4. Règles Invariables
- Header.tsx et HeaderShell.tsx sanctifiés (aucune modification).
- Respect absolu de la sécurité (AGENTS.md).

## 5. État Réel Livré et Validé
- [x] **Photo de profil de l'hôte** : Remplacement des images statiques Unsplash par `salon.hostAvatarUrl` et l'avatar réel de l'utilisateur connecté.
- [x] **Diffusion vidéo hôte vers spectateurs** : Double mécanisme WebRTC P2P et flux de trames instantanées (`host_frame`), visible immédiatement par tous les spectateurs connectés.
- [x] **Nom des auteurs sur les commentaires** : Résolution sécurisée du nom complet/pseudo, envoi temps réel via Supabase Broadcast (`live_chat_message`) et affichage propre `[Nom] : [Message]`.
- [x] **Demande de montée sur scène (Dual Live TikTok)** : Bouton « Monter sur scène » pour les spectateurs, notification avec Accepter/Refuser pour l'hôte, démarrage caméra invité et écran partagé 50/50.
- [x] **Décrochage d'appel audio garanti** : Signalisation Supabase Realtime (`wab_audio_call_[id]`) + persistance disque multi-lambdas (`wab-calls.json`). Clic immédiat sur Décrocher débloquant l'audio bidirectionnel.
- [x] **Responsivité de la messagerie** : Zéro débordement horizontal, adaptation mobile (`min-w-0`, boutons compacts).
- [x] **Build & Déploiement** : Typecheck TypeScript (0 erreurs), compilation Next.js réussie, commit et push sur `origin main`.
