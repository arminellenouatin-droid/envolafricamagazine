# Matrice des écritures locales — stabilisation

| Adaptateur | Fichier local | Routes principales | Statut |
|---|---|---|---|
| `db.ts` | `src/data/db.json` | `admin/articles, admin/magazines, admin/orders, core auth` | garde-fou ajouté |
| `wab-subscriptions.ts` | `src/data/wab-subscriptions.json` | `wab/subscription` | garde-fou existant, à migrer |
| `wab-db.ts` | `src/data/wab.json` | `wab posts/pages/groups/messages` | à migrer |
| `jobs-db.ts` | `src/data/jobs.json` | `jobs offers/applications/unlocks` | à migrer |
| `crowdfunding-db.ts` | `src/data/crowdfunding.json` | `financement projects/contributions` | à migrer avant paiements réels |
| `awards-db.ts` | `src/data/awards.json` | `awards votes/competitions` | à migrer avant votes réels |

La matrice est une synthèse de code, non une autorisation de migration. Chaque domaine doit être converti, testé puis seulement désactivé en écriture locale.
