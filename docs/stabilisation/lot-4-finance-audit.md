# Lot 4 — Audit Crowdfunding et Africa Awards

## Constat vérifié

Les adaptateurs `src/lib/crowdfunding-db.ts` et `src/lib/awards-db.ts` écrivent directement dans `src/data/crowdfunding.json` et `src/data/awards.json`. Ils peuvent créer leurs fichiers au chargement du module et lancer des seeds automatiquement. Cette architecture n’est pas compatible avec un runtime Vercel en production : le système de fichiers local est éphémère et non inscriptible de manière persistante.

## Couverture Supabase constatée

Supabase possède déjà une famille de tables Awards structurée, notamment `awards_competitions`, `awards_candidates`, `awards_applications`, `awards_votes`, `awards_donations`, `awards_gift_transactions`, `awards_payment_transactions`, `awards_results` et `awards_audit_logs`. La requête d’inventaire a également trouvé `crowdfunding_boosts`, mais pas un ensemble complet de tables Crowdfunding correspondant directement aux projets, contributions, documents et remboursements du store JSON.

Cela signifie que **Awards peut probablement être migré par adaptateur et comparaison**, tandis que Crowdfunding nécessite d’abord une clarification de schéma ou une création de tables manquantes. Il serait dangereux de brancher directement le JSON Crowdfunding sur des tables Awards ou de supposer une correspondance automatique.

## Risque

Il ne faut pas simplement bloquer ces écritures en production sans préparer un chemin Supabase équivalent. Cela pourrait rendre les projets, contributions, votes, candidatures ou opérations associées indisponibles. Le risque est particulièrement élevé pour les données financières et les votes.

## Décision de stabilisation

Aucune modification de production n’est appliquée dans ce lot. Avant toute migration, il faut :

1. inventorier les routes et contrats de données Crowdfunding/Awards ;
2. confirmer les tables Supabase existantes et leurs colonnes ;
3. comparer les données JSON et Supabase ;
4. définir les règles d’accès et l’idempotence des paiements ;
5. créer un adaptateur Supabase testé en Preview ;
6. effectuer un backfill contrôlé ;
7. seulement ensuite bloquer le fallback JSON en production.

Ce lot est donc marqué **audit et préparation**, non déployé. Les lots 1 à 3 restent séparés et réversibles.
