# Vérification de production — Lot 4 financier

Date : 19 août 2026

## Résultats

L’endpoint `GET /api/awards/competitions` répond en HTTP 200 et retourne six compétitions de démonstration avec des compteurs de candidats, de votes et de cagnotte. L’endpoint `GET /api/crowdfunding/projects` répond également en HTTP 200 et retourne huit projets de démonstration avec objectifs, montants collectés, porteurs et répartitions.

## Interprétation

Ces réponses confirment que les parcours publics restent fonctionnels en production, mais elles ne prouvent pas que les écritures sont persistantes. Le code source des adaptateurs `awards-db.ts` et `crowdfunding-db.ts` montre qu’ils lisent, initialisent et écrivent encore dans des fichiers JSON locaux. Ces données peuvent donc être régénérées, perdues au redéploiement ou diverger de Supabase.

La migration doit rester **additive et réversible** : inventorier chaque champ, importer les données JSON dans des tables de correspondance, comparer les totaux et les identifiants, puis basculer les lectures avant de bloquer les écritures JSON. Aucun blocage de production ne doit être appliqué à ces deux modules avant cette preuve de parité.

## Décision

Le lot 4 n’est pas prêt pour un simple « blocage JSON ». Awards possède déjà un schéma Supabase riche et peut être traité en premier. Crowdfunding ne présente actuellement qu’une table détectée par l’inventaire (`crowdfunding_boosts`) et nécessite une cartographie ou une migration de schéma avant tout branchement.
