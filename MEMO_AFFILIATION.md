# MÉMO DE MISSION — SYSTÈME D'AFFILIATION & ADMINISTRATION EAM

## Objectif
Mettre à jour et unifier le système d'affiliation d'Envol Africa Magazine en intégrant les programmes Magazine (MLM 5×5 sur 5 niveaux avec répartition 70/10/20) et Marketplace (taux vendeur, 92/8), avec portefeuille de gains commun, seuil de retrait Mobile Money à 10 000 XOF et console d'administration complète sans régressions.

## Périmètre
- **Inclus** :
  - Création des tables SQL d'affiliation dans Supabase (`affiliates`, `commissions`, `unallocated_funds`, `network_size_funds`, `ceremony_funds`, `withdrawals`, `product_affiliations`, `affiliate_product_wallets`, `marketplace_commissions`).
  - Schéma Prisma & types unifiés.
  - Moteur d'affiliation dans `@/lib/affiliation/` (`constants.ts`, `matrix.ts`, `commission.ts`, `marketplace.ts`, `enrollment.ts`).
  - Adaptateur d'accès base dual (Supabase Admin + fallback Prisma).
  - Routes API affilié (`/api/affiliate/register`, `/api/affiliate/me`, `/api/affiliate/me/network`, `/api/affiliate/me/earnings`, `/api/affiliate/withdraw`).
  - Routes API admin (`/api/admin/affiliate/stats`, `/api/admin/affiliate/users`, `/api/admin/affiliate/tree`, `/api/admin/affiliate/withdrawals`, `/api/admin/affiliate/founder`).
  - Console Admin dans `src/app/admin/AdminClient.tsx` sous `activeTab === "affiliate"` (KPIs, annuaire affiliés, création fondateur racine, inspecteur d'arbre 5×5, validation/rejet retraits Mobile Money, audit des fonds).
  - Branchement du calcul des commissions sur la confirmation de commande / paiement.
- **Hors périmètre** :
  - Modification des autres onglets de l'administration (Articles, Magazines, Abonnements, Utilisateurs, etc.) -> ZÉRO RÉGRESSION.
  - Programmes Crowdfunding, Jobs ou Awards Ads pour le MLM Magazine (exclus par la règle métier).

## Décisions techniques
1. **Double compatibilité Base de Données** : Supabase SQL + Prisma. Les tables sont créées directement sur Supabase PostgreSQL avec UUIDs/text standards et index de performance.
2. **Portefeuille unique** : Solde commun pour Magazine et Marketplace, avec seuil minimum de 10 000 XOF pour les retraits.
3. **Sécurité & Rôles** : Contrôle strict via `getCurrentUserForAdmin('admin')` sur toutes les routes `/api/admin/affiliate/*` et validation des montants/fournisseurs Mobile Money.
4. **Zéro régression UI** : Remplacement ciblé du panneau `activeTab === "affiliate"` dans `AdminClient.tsx` sans toucher aux 530+ autres lignes des autres modules.

## Plan d'exécution
- [x] 1. Migration SQL dans Supabase (création des 9 tables + contraintes + index)
- [x] 2. Mise à jour de `prisma/schema.prisma` et régénération client
- [x] 3. Implémentation des modules métier dans `src/lib/affiliation/`
- [x] 4. Création des routes API affilié et admin
- [x] 5. Interface d'administration riche dans `AdminClient.tsx`
- [x] 6. Déclenchement de la commission à la finalisation de vente
- [x] 7. Visualiseur complet d'arbre 5×5 et lignée de filleuls N1-N5 (`NetworkExplorer.tsx`)
- [x] 8. Politique intégrale de gratification des ambassadeurs (`GratificationPolicy.tsx`)
- [x] 9. Remplacement du 1er bouton de la 1ère ligne desktop par "S'affilier" (`/affiliation`)
- [x] 10. Ajout du 3ème bouton "S'affilier" dans le menu d'actions mobile
- [x] 11. Refonte UI/UX compacte des popups sur mobile (`PromoPopup.tsx`, boîtes à outils)
- [x] 12. Vérification TypeScript (`npx tsc --noEmit`), tests de build (`npx next build`), déploiement Git

