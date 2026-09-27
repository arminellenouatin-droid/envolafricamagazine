# MÉMO DE MISSION : MODULE LIVE "SALONS" — WAB (CONFORMITÉ PRD v1.0)

## 1. Objectif
Finaliser et compléter à 100% le Module Live "Salons" pour World Africa Business (WAB) conformément au PRD v1.0 (Lots 1 à 6) :
Hub `/salons`, Studio de création (thèmes, visibilité, vente), Live Shopping (épinglage de produits Marketplace, achat 1-clic Moneroo, panier, séquestre), WAB Coins & cadeaux monétisés, classement contributeurs, modération en direct & anti-contournement, et back-office admin.

## 2. Périmètre
- **Inclus & Validé** :
  - Hub `/salons` : filtres réels ("Tous", "En direct", "À venir", "Replays"), filtres par thèmes, badges thématiques, et modal de configuration complète (thèmes, visibilité, mode vente, prise de parole, cover).
  - Bandeau "🔴 SALONS EN DIRECT" sur le feed WAB (`/wab`).
  - Live Shopping : sélection & épinglage de produits Marketplace, widget flottant avec minuteur d'offre flash, overlay d'achat 1-clic Moneroo & ajout au panier général `/panier`, séquestre WAB.
  - Système de Coins WAB : recharge Moneroo/Mobile Money (packs 100, 500, 1200, 3000 Coins), catalogue de cadeaux virtuels avec débits/crédits atomiques, classement Top 3/10 contributeurs en temps réel.
  - Espace Créateur (`/wab/createur`) : gains lives, solde disponible, demandes de retrait Mobile Money (MTN, Moov, Orange, Wave).
  - Modération in-live : promotion modérateur, mute, kick, ban, filtre anti-insultes & anti-contournement (tél, WhatsApp, liens externes), signalement spectateur.
  - Admin Back-Office (`/wab/admin` et `/api/admin/salons`) : suivi des salons en direct, arrêt forcé à distance, file des signalements, validation des retraits créateurs, configuration des taux et commissions.
  - Écran de bilan post-live complet & Publication Replay.
- **Hors Périmètre Respecté** :
  - Africa Awards Live (strictement séparé, aucun conflit ni couplage).
  - Aucun panier concurrent créé (réutilisation exclusive de `/panier` et du séquestre Marketplace).
  - Sanctification absolue de `Header.tsx` et `HeaderShell.tsx`.

## 3. Sécurité & Données Sensibles (AGENTS.md)
- Aucun secret exposé côté client.
- Validation serveur stricte sur tous les endpoints d'achat, de don et de modération.
- Opérations financières atomiques (vérification de solde avant débit, idempotence des recharges).
- Filtre anti-contournement et désinfection des messages de chat.

## 4. Plan d'Exécution par Lots — Statut de Réalisation
- [x] **Étape 1** : Modèle de données & Endpoints WAB Salons (`src/lib/wab-db.ts`, `/api/wab/salons/...`, `/api/wab/coins/...`).
- [x] **Étape 2** : Hub `/salons` enrichi & Bandeau Live sur `/wab` (thèmes, visibilité, mode vente, badge interactif).
- [x] **Étape 3** : WAB Coins & Cadeaux virtuels (recharge Moneroo, débit/crédit, Top contributeurs, tiroir cadeaux avec sélecteur de quantité).
- [x] **Étape 4** : Live Shopping Marketplace (épinglage produit, offre flash, widget flottant, overlay d'achat direct Moneroo & panier `/panier`, séquestre).
- [x] **Étape 5** : Modération in-live & Signalements (rôles modérateurs, sourdine, expulsion, bannissement, regex anti-contournement, signalement spectateur).
- [x] **Étape 6** : Back-office Admin & Espace Créateurs (suivi lives actifs, arrêt forcé, validation retraits, configuration taux, bilan post-live & replay).
- [x] **Étape 7** : Vérifications QA & Build de production Next.js (TypeScript `0` erreurs, compilation Turbopack `100%` verte).
