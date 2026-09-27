# MÉMO DE MISSION — HARMONISATION CHARTE MAGAZINE & KIOSQUE (AFFILIATION & DON)

## 1. Objectif
Harmoniser visuellement et ergonomiquement les pages **/affiliation** (`src/app/affiliation/page.tsx`, `GratificationPolicy.tsx`, `NetworkExplorer.tsx`) et **/don** (`src/app/don/DonClient.tsx`) pour respecter strictement la charte graphique, les codes couleurs et le design UI/UX du volet Magazine et Kiosque d'Envol Africa.

## 2. Périmètre
- **Inclus** :
  - Remplacement intégral de la palette marine `#0A1931` et or `#D4AF37` / fond `#FFFCF5` par la palette signature Magazine/Kiosque :
    - Fond de page chaleureux `#fcf9f8` et `#fffdfc`.
    - Rouge bordeaux / carmin signature `#9e001f`, hover `#7f0019` et `#c8102e`.
    - Encre titres `#1b1c1c` / `#2b2525`, texte secondaire `#746665` / `#6b5353`.
    - Bordures douces éditoriales `#e5bdbb`, `#d8c3c1`, `#ead8d5`.
    - Badges et conteneurs clairs `#f2e8e6`, `#fff0ef`, `#fff8f3`.
    - Conteneurs sombres éditoriaux (gradient `#2b2525` vers `#421c22`).
    - Typographie : `font-serif` (Source Serif 4) pour les titres éditoriaux, `editorial-kicker` pour les surtitres.
  - Refonte des 3 états de `/affiliation` :
    1. Visiteur non connecté (pitch 5x5, 3 piliers, politique, bloc inscription/connexion).
    2. Utilisateur connecté non-affilié (onboarding, acceptation charte, bouton d'activation).
    3. Espace Ambassadeur actif (onglets, KPIs, bandeau arbre 5x5, explorateur, partage de lien, historique commissions, retrait Mobile Money).
  - Refonte des composants d'affiliation :
    - `GratificationPolicy.tsx` : en-tête éditorial bordeaux/charcoal, tableau de distribution N1-N5, piliers et exemples chiffrés.
    - `NetworkExplorer.tsx` : cartes de métriques, sélecteur de niveaux N1-N5, bascule arbre dynamique / tableau, fiches membres.
  - Refonte de la page de don `/don` (`DonClient.tsx`) :
    - En-tête éditorial avec kicker "Mécénat & Soutien Indépendant".
    - Sélecteur de montant à boutons pilules Magazine / Kiosque.
    - Formulaire avec bordures et focus bordeaux.
    - Carte d'impact en gradient charcoal bordeaux.
    - Cartes transparence et passerelle vers l'affiliation.
  - Support mode sombre dans `src/app/globals.css` pour `.affiliation-page` et `.don-page`.
- **Sanctifié & Préservé** :
  - `Header.tsx` et `HeaderShell.tsx` (intacts).
  - Aucune modification des règles métier : calcul MLM 5×5 (40%, 25%, 15%, 12%, 8%), règles d'éligibilité, seuil de retrait Mobile Money (10 000 XOF), redirection Moneroo.

## 3. Plan d'exécution & Livrables
- [x] Étape 1 : Refonte de `src/components/affiliation/GratificationPolicy.tsx`
- [x] Étape 2 : Refonte de `src/components/affiliation/NetworkExplorer.tsx`
- [x] Étape 3 : Refonte de `src/app/affiliation/page.tsx`
- [x] Étape 4 : Refonte de `src/app/don/DonClient.tsx`
- [x] Étape 5 : Support dark-mode et styles associés dans `src/app/globals.css`
- [x] Étape 6 : Validation TypeScript (`npx tsc --noEmit`) : 0 erreur
- [x] Étape 7 : Build de production Next.js (`npx next build`) : Réussi avec succès
- [x] Étape 8 : Déploiement Git et production en ligne Vercel
