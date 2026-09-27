# MÉMO DE MISSION — SYSTÈME DE MESSAGERIE MARKETPLACE (ISOLÉ & STYLE COMEUP)

## 1. Objectif
Développer et livrer le système complet et isolé de messagerie du Marketplace d'Envol Africa (`/marketplace/messages`), inspiré du modèle de référence **ComeUp** (Chat transactionnel + "ComeUp Direct" pour appels vocaux/vidéo 1:1), dédié exclusivement aux relations Acheteur ↔ Vendeur.

## 2. Périmètre & Isolation Stricte
- **Isolation totale avec WAB** :
  - Aucun code métier, aucun composant, aucune table ni aucune route partagés avec la messagerie WAB (`/messages`, `/wab/messages`).
  - Namespace dédié : `/marketplace/messages` et `/api/marketplace/messages/*`.
- **Inclus** :
  1. **Conversations 1:1** : Pré-achat (questions avant commande) et Liées à une commande (briefing, réalisation, livraison, révisions).
  2. **Intégrité absolue des messages** : Non-altération et non-suppression côté serveur (valeur probante en cas de litige).
  3. **Anti-contournement renforcé côté serveur** : Détection et blocage automatique avant envoi des numéros de téléphone (tous indicatifs africains/internationaux), e-mails, réseaux sociaux (WhatsApp, Telegram, etc.), liens de paiement externes et formules de contournement.
  4. **Modération des pièces jointes** : Envoi sécurisé d'images, vidéos, documents (PDF, Word, Excel, ZIP) avec contrôle de sécurité et types MIME.
  5. **Cycle de commande ComeUp (Machine à états)** :
     - Délai fixe d'acceptation vendeur de 48h (annulation et remboursement automatique si dépassé).
     - Phase en cours d'exécution.
     - Soumission explicite de la livraison par le vendeur (fichiers livrables + message d'accompagnement).
     - Révision demandée par l'acheteur (motif obligatoire).
     - Validation de la livraison par l'acheteur (déclenche la libération des fonds séquestrés).
     - Auto-validation automatique après 72h sans action de l'acheteur.
  6. **ComeUp Direct (Appels 1:1)** :
     - Appels audio et vidéo 1:1 entre acheteur et vendeur.
     - Journal des appels consigné dans le fil de conversation (durée, horodatage).
     - Commutateur de disponibilité pour le vendeur ("Disponible pour les appels").
  7. **Procédure de Litige & Back-office Support** :
     - Signalement de litige par l'acheteur ou le vendeur.
     - Gel immédiat de la conversation (lecture seule).
     - Back-office support dédié avec consultation journalisée (`marketplace_admin_access_logs`) et actions de résolution (libérer les fonds, rembourser l'acheteur, clôturer sans suite).
  8. **Outils de productivité vendeur** :
     - Réponses rapides / modèles de messages réutilisables.
     - Tableau de bord vendeur avec filtres par statut (Pré-achat, 48h, En cours, Livrée, Terminée, Litige).
- **Hors périmètre** :
  - Groupes, canaux publics, notes vocales sociales (réservés à WAB).
  - Modification des composants d'en-tête sanctifiés (`Header.tsx`, `HeaderShell.tsx`).

## 3. Plan d'exécution par Lots (PRD Section 22)
- [x] **Lot 1** : Modèle de données & Fondations (tables SQL, types, API conversations & messages texte immutables, contact pré-achat).
- [x] **Lot 2** : Pièces jointes (upload images, vidéos, documents, stockage et visualisation sécurisés).
- [x] **Lot 3** : Anti-contournement serveur (moteur de filtrage strict, blocage avant envoi, alertes de récidive).
- [x] **Lot 4** : Machine à états de commande (délai 48h, livraison, révision, validation manuelle & auto 72h).
- [x] **Lot 5** : ComeUp Direct (signalisation d'appels audio/vidéo 1:1, UI d'appel, journal automatique).
- [x] **Lot 6** : Litiges & Back-office support (signalement, gel de conversation, journal d'accès admin, résolution).
- [x] **Lot 7** : Réponses rapides, tableau de bord vendeur, responsive complet, tests TypeScript et build.

## 4. Statut de Livraison
- **Compilation TypeScript** : 0 erreurs (`npx tsc --noEmit` validé).
- **Next.js Production Build** : Réussi (`npx next build` validé avec génération statique & dynamique).
- **Composants Sanctifiés** : 100 % préservés (`Header.tsx` et `HeaderShell.tsx` intacts).
- **Isolation WAB / Marketplace** : 100 % respectée (tables dédiées `marketplace_*`, routes `/api/marketplace/messages/*`, UI `/marketplace/messages`).
