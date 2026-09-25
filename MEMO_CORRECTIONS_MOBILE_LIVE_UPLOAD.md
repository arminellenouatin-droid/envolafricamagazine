# Mémo de Mission : Corrections Mobile Plein Écran, Upload Vidéo & Stories

## 1. Objectifs de la mission
1. **Mode Plein Écran Application Externe pour le Live WAB & la Messagerie** :
   - Éliminer le masquage des commandes en bas de page sur mobile provoqué par l'en-tête et le pied de page du site.
   - Proposer une expérience 100% plein écran (`fixed inset-0 z-[9999] h-[100dvh] w-screen overflow-hidden`) avec bouton de fermeture / retour direct au site.
   - Respecter la règle sanctifiée de non-modification de `Header.tsx` et `HeaderShell.tsx`.
2. **Résolution de l'erreur d'upload vidéo HTTP 413** :
   - Contourner la limite de payload Vercel Serverless (4.5 Mo) pour les vidéos de 5 Mo et plus via un flux d'upload direct signé Supabase Storage (`action: "prepare"` -> upload direct -> `action: "confirm"`).
   - Sécuriser `readJsonResponse` pour intercepter les statuts 413 et formuler un message clair sans planter sur `JSON.parse`.
3. **Prise en charge intelligente des vidéos > 30 secondes en Story / Reel** :
   - Ne plus bloquer ni lever d'exception si la vidéo sélectionnée dépasse 30 secondes.
   - Charger automatiquement la vidéo, plafonner la durée à 30 secondes, et couper la lecture automatiquement à 30 secondes dans le visualiseur avec barre de progression synchronisée.

## 2. Périmètre des modifications
- `src/app/wab/salons/[id]/SalonClient.tsx` : Conteneur plein écran `z-[9999]`, bouton de sortie explicite "Fermer".
- `src/app/messages/page.tsx` : Conteneur plein écran `z-[9999]`, en-tête dédié "Messagerie Envol Africa" avec bouton "Retour au site", ancrage fixe des commandes de chat.
- `src/app/wab/messages/page.tsx` : Redirection transparente vers `/messages`.
- `src/app/api/wab/upload/route.ts` : Support JSON `action: "prepare"` et `action: "confirm"` avec signed upload URL Supabase + anti-IDOR.
- `src/app/wab/WabClient.tsx` : Intégration de l'upload direct signé pour les fichiers > 3.5 Mo et gestion du HTTP 413.
- `src/app/wab/StoriesReelsCarousel.tsx` : Upload direct signé, auto-trim à 30 secondes, arrêt et progression calés à 30s.

## 3. Checklist de vérification
- [ ] Aucun composant de Header (`Header.tsx`, `HeaderShell.tsx`) modifié.
- [ ] Pas de secret exposé.
- [ ] Zéro erreur TypeScript (`tsc --noEmit`).
- [ ] Build Next.js validé.
