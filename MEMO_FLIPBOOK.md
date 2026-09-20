# Mémo de Mission — Correction et Optimisation du Flipbook Kiosque (Feuilleter en ligne)

## 1. Objectif Réel
Rendre le Flipbook (« Feuilleter en ligne ») 100% fonctionnel, fluide, élégant et fiable sur ordinateur (mode double page / simple page) comme sur mobile (mode simple page responsive avec swipe gestuel) pour tous les numéros du magazine.

## 2. Périmètre
- **Inclus** :
  - `src/components/kiosque/PreviewFlipbook.tsx` : navigation single/spread corrigée, support gestes tactiles swipe mobile, gestion du son papier réaliste, zoom/fullscreen, fallback robuste multi-niveaux.
  - Rendu éditorial élégant pour tous les numéros (sommaire, édito, grand angle, dossier, interview) quand aucun PDF lourd n'est fourni.
  - `public/pdf.worker.min.mjs` : synchronisé avec `pdfjs-dist` v6.3.289.
  - `src/app/kiosque/[id]/MagazineDetailClient.tsx` & `src/components/kiosque/KiosqueExperience.tsx` : nettoyage des caractères mojibake résiduels et transmission des métadonnées complètes au Flipbook.
- **Hors périmètre** :
  - `src/components/Header.tsx`, `HeaderShell.tsx` (INTERDICTION FORMELLE d'y toucher — strictement respectée).

## 3. Causes Racines Identifiées et Résolues
1. **Worker PDF.js désynchronisé** (6.2.108 vs 6.3.289) -> Remplacé par la version officielle 6.3.289 issue de `node_modules`.
2. **Absence de pages d'aperçu pour 24 numéros sur 25** dans `db.json` -> Création du moteur éditorial interactif (Tier 4) qui génère 7 pages immersives pour tout numéro.
3. **Saut de pages défectueux en mode mobile (single)** : `nextPage` sautait les pages 3, 5 et 7 -> Corrigé avec navigation unitaire `current + 1` en mode single et `current + 2` en mode spread.
4. **Absence de gestes tactiles (swipe)** sur mobile -> Ajout des écouteurs `onTouchStart` et `onTouchEnd` avec détection de balayage gauche/droite.
5. **Absence de fallback visuel éditorial** -> Composant `EditorialPage` intégré pour afficher éditorial, sommaire, grand angle avec infographies, dossier thématique, entretien exclusif, tribune et page de commande verrouillée.
6. **Caractères mojibake** dans `MagazineDetailClient.tsx` nettoyés (`FEUILLETER L'APERÇU` et `—`).

## 4. Plan d'Exécution & État Final
- [x] Phase 1 : Cadrage et analyse des causes racines.
- [x] Phase 2 : Remplacement du worker PDF.js par la version exacte 6.3.289.
- [x] Phase 3 : Refonte de `PreviewFlipbook.tsx` (navigation mobile/desktop, swipe tactile, rendu multi-tier avec pages éditoriales stylisées).
- [x] Phase 4 : Nettoyage du mojibake et transmission des métadonnées enrichies dans `MagazineDetailClient.tsx` et `KiosqueExperience.tsx`.
- [x] Phase 5 : Tests et validation (`npx tsc --noEmit` code 0, `npx next build` 121 pages générées avec succès).
- [x] Phase 6 : Clôture et notification utilisateur.
