# PHASE 1 — Audit de l'existant : Africa Awards Live & Architecture Vidéo

Date de l'audit : 06/10/2026
Projet : Envol Africa Magazine (Africa Awards Live)
Environnement : Next.js App Router, TypeScript, Supabase, Vercel

---

## 1. Mécanisme d'Authentification & Gestion des Droits

### Authentification Réelle
- **Mécanisme principal** : Cookie HttpOnly nommé `eam_token` chiffré/signé par JWT (`jsonwebtoken`).
- **Fonctions d'accès serveur** :
  - `getCurrentUserFromCookie()` dans `src/lib/auth.ts` : lit le cookie de requête de manière sécurisée via `cookies()`, vérifie la signature avec `JWT_SECRET`, puis charge l'enregistrement utilisateur complet depuis la base de données via `findUserById(decoded.id)`.
  - Supabase Auth n'est pas utilisé directement pour la session web de l'utilisateur final ; Supabase est piloté côté serveur via le client d'administration privilégié `getSupabaseAdmin()` (`SUPABASE_SERVICE_ROLE_KEY`).
- **Identification des Rôles** :
  - Champ `user.role` sur le modèle utilisateur.
  - Administrateur : `user.role === 'admin'`.
  - Animateur : `user.role === 'host'` (ou assigné spécifiquement dans la session live).
  - Modérateur : `user.role === 'moderator'` (ou administrateur / animateur délégué).
  - Candidat : `user.role === 'candidate'` (associé à un enregistrement accepté dans `awards_candidates`).
- **Impact sur `auth-adapter.ts` (Phase 3)** :
  - **Important** : L'authentification réelle n'étant pas basée sur `supabase.auth.getUser()`, `auth-adapter.ts` doit être adapté pour appeler `getCurrentUserFromCookie()` de `@/lib/auth`.

---

## 2. Tables Existantes Liées aux Lives

Les tables existantes dans le schéma Supabase (`003_awards.sql` et `20260823_awards_live_participants.sql`) sont :

1. **`public.awards_live_sessions`** :
   - Colonnes : `id` (uuid, PK), `competition_id` (uuid, FK), `mux_stream_id` (text), `mux_playback_id` (text), `rtmp_key` (text), `status` (text: `'scheduled'`, `'live'`, `'ended'`), `started_at` (timestamptz), `ended_at` (timestamptz), `replay_url` (text), `created_at` (timestamptz).
2. **`public.awards_live_participants`** :
   - Colonnes : `id` (uuid, PK), `live_session_id` (uuid, FK), `competition_id` (uuid, FK), `candidate_id` (uuid, FK nullable), `user_id` (uuid, FK), `role` (text: `'candidate'`, `'host'`, `'viewer'`), `state` (text: `'waiting'`, `'on_stage'`, `'left'`, `'removed'`), `joined_at`, `left_at`, `updated_at`.
3. **`public.awards_live_events`** :
   - Colonnes : `id` (uuid, PK), `competition_id` (uuid), `live_session_id` (uuid), `event_type` (`'vote'`, `'gift'`, `'donation'`, `'comment'`, `'reaction'`, `'pot_increase'`, `'candidate_join'`, `'candidate_leave'`), `payload` (jsonb), `created_at`.
4. **`public.awards_comments`** :
   - Colonnes : `id`, `competition_id`, `live_session_id`, `user_id`, `content`, `is_moderated`, `is_banned`, `created_at`.

*Note d'intégration* : Les 3 nouvelles tables Agora (`agora_live_channels`, `agora_live_participants`, `agora_event_log`) s'adossent sur l'identifiant du live (`live_id = session.id` ou `competition_id`) sans altérer ni casser ces tables existantes.

---

## 3. Liste Exhaustive des Écrans Live & Composants d'Overlays

### A. Écran Spectateur (Viewer)
- **Fichier** : `src/app/africa-awards/competitions/[slug]/live/page.tsx`
- **Lecteur vidéo actuel** :
  - Balise `<video>` lisant le flux HLS Mux (`https://stream.mux.com/${session.mux_playback_id}.m3u8`) avec repli sur image de fond de gala lorsque aucun flux direct n'est diffusé.
- **Overlays superposés (à préserver strictement)** :
  1. `LiveTopBar` : Titre de la compétition, logo, compteur de spectateurs, cagnotte du pot, durée.
  2. `LiveFloatingRanking` : Mini-classement dynamique des 5 meilleurs candidats avec votes.
  3. `LiveTikTokActions` : Colonne droite d'actions rapides (likes/réactions animées, bouton d'ouverture du tiroir de cadeaux, partage, bouton follow).
  4. `LiveChatOverlay` : Flux de messages défilants, message épinglé, saisie de commentaires, boutons d'action rapide (Voter via Moneroo, Faire un don, Offrir un cadeau, Demander à monter sur scène).
  5. `LiveGiftAnimationOverlay` : Animations graphiques immersives plein écran (lion doré, couronne, diamants, etc.).
  6. `LiveGiftDrawer` : Tiroir coulissant inférieur permettant l'envoi de cadeaux virtuels payants avec sélection de candidat.

### B. Écran Animateur (Régie Studio)
- **Fichier** : `src/app/africa-awards/host/dashboard/live/[id]/page.tsx`
- **Composants associés** :
  - `LiveHostGrid.tsx` : Grille scénique des flux (animateur principal + vignettes des candidats sur scène).
  - `LiveHostControls.tsx` : Barre d'outils de la régie avec boutons Micro (on/off), Caméra (on/off), Flip caméra, Fin du direct.
  - `LiveHostPreviewPip.tsx` : Vignette de retour vidéo Picture-in-Picture.
- **Actions existantes** :
  - `handleToggleLive` : Démarrage (`action: "start"`) et arrêt (`action: "end"`) du live via `POST /api/awards/live`.
  - `handleToggleMic`, `handleToggleCam`, `handleSelectSpeaker`, `handleRemoveParticipant`, `handleInviteCandidateOnStage`.
  - Gestion des alertes modérateur et commentaires épinglés.

### C. Écran Candidat (Studio d'intervention)
- **Fichier** : `src/app/africa-awards/candidate/live/[id]/page.tsx`
- **Composants associés** :
  - `LiveCandidateStudio.tsx` : Interface d'intervention du candidat avec état "en coulisse" (waiting) / "sur scène" (on_stage), jauge de votes personnels, cadeaux reçus en direct, affichage des directives du modérateur/animateur.

### D. Écran / Outil Modérateur
- **Composant** : `src/components/africa-awards/live/LiveModeratorStream.tsx`
- **Fonctions** :
  - Filtrage des messages signalés (flagged), sanctions (avertissement, silence, bannissement), alertes transmises en temps réel à l'animateur.

---

## 4. Endpoints Existants de Gestion du Live

- **Fichier** : `src/app/api/awards/live/route.ts`
  - `GET /api/awards/live?competition_id=...` ou `session_id=...` : Récupère la session active, la liste des participants et les derniers événements.
  - `POST /api/awards/live` :
    - `action: "start"` : Passe la session en statut `live` et met à jour la compétition en `live_running`.
    - `action: "end"` : Clôture la session live (`status: "ended"`), archive `ended_at` et réactive `voting_open`.
    - `action: "participant"` : Inscription d'un participant (`waiting`, `on_stage`, `left`, `removed`).
    - `action: "event"` : Émission d'événements de direct (`vote`, `gift`, `donation`, `comment`, etc.).
- **Modération** : `src/app/api/awards/live/moderate/route.ts` pour les sanctions et masquages.

---

## 5. Sécurité, En-têtes & CSP

- **Fichier** : `next.config.ts`
  - `Permissions-Policy: camera=(self), microphone=(self), geolocation=()` est déjà présent, autorisant les flux WebRTC de capture média.
  - `Content-Security-Policy: frame-ancestors 'self';` : Pas de directive `connect-src` restrictive qui bloquerait les serveurs Agora SD-RTN (`*.agora.io`, `*.sd-rtn.com`).
- **Fichier** : `src/middleware.ts`
  - Route `/admin` protégée par cookie `eam_token`.

---

## 6. Versions des Dépendances & Outils

- **Node.js** : `v24.11.1`
- **npm** : `11.6.2`
- **Next.js** : `15.1.6` (App Router)
- **React** : `19.0.0`
- **Supabase SDK** : `@supabase/supabase-js` `^2.48.1`, `@supabase/ssr` `^0.5.2`
- **Base de données ORM** : Prisma `5.22.0` + client PostgreSQL direct `pg`
- **Validation** : Zod `^3.24.1`

---

## 7. Scripts npm Disponibles

- `npm run dev` : Lancement en mode développement
- `npm run build` : `prisma generate && next build`
- `npm run start` : Démarrage du serveur de production
- `npm run lint` : `eslint`
- `npm run db:push` : Push du schéma Prisma

---

## Conclusion de la Phase 1

L'audit confirme que :
1. La base de code compile parfaitement (`npx tsc --noEmit` = 0 erreur, `next build` = succès).
2. L'auth est identifiée (`eam_token` via `getCurrentUserFromCookie()`).
3. Les écrans et overlays sont clairement localisés et seront préservés à l'identique.
4. L'environnement est prêt pour aborder la Phase 2.
