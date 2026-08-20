# Audit et essais Africa Awards

**Date :** 20 août 2026  
**Environnement :** `https://envolafricamagazinealokpe.vercel.app`  
**Périmètre :** compétition, candidats, live, votes, cadeaux, dons, paiements Moneroo et écritures de règlement.  
**Limite confirmée :** aucun reversement n’a été exécuté.

## 1. Résultat immédiat

Le parcours public Africa Awards est accessible et les compétitions réelles disposent de slugs valides. Les pages de compétition, candidats, live, résultats, classement, candidature et espaces de gestion répondent HTTP 200 au niveau de la route.

Le test de vote a ouvert correctement le checkout Moneroo. Pour un vote affiché comme **1 F CFA**, Moneroo a affiché **100 F CFA**. Le test n’a pas été finalisé faute de fonds suffisants et aucun paiement n’a donc été enregistré. Aucun webhook de succès et aucune écriture de vote n’ont été déclenchés.

Cette différence est une anomalie confirmée de cohérence monétaire. Le code de la page de vote calcule `votes * 100`, avec le commentaire `100 centimes = 1 XOF`, puis affiche `total / 100`. Or la réponse de documentation Moneroo présente les montants XOF comme des montants en XOF avec zéro décimale, par exemple `amount: 200` et `amount_formatted: XOF 200`, même si la fiche de devise mentionne un sous-unité historique [1]. Le checkout observé confirme le comportement opérationnel : la valeur 100 envoyée a été présentée comme 100 F CFA.

## 2. Matrice des routes testées

| Parcours | Route ou API | Résultat |
|---|---|---:|
| Landing Africa Awards | `/africa-awards` | HTTP 200 |
| Liste compétitions | `/africa-awards/competitions` | HTTP 200 |
| Compétition 2024 | `/africa-awards/competitions/africa-awards-2024-edition-1` | HTTP 200 |
| Compétition 2025 | `/africa-awards/competitions/africa-awards-2025-edition-2` | HTTP 200 |
| Live 2024 et 2025 | `/competitions/{slug}/live` | HTTP 200 |
| Résultats 2024 et 2025 | `/competitions/{slug}/results` | HTTP 200 |
| Profil candidat réel | `/candidates/{id}` | HTTP 200 |
| Page vote | `/vote/{candidateId}` | HTTP 200 |
| Classement | `/rankings` | HTTP 200 |
| Mes votes | `/my-votes` | HTTP 200 sans session apparente |
| Candidature | `/apply/{competitionSlug}` | HTTP 200 |
| Dashboard candidat | `/candidate/dashboard` | HTTP 200 |
| Administration | `/admin/dashboard` | HTTP 200 au niveau route |
| Création compétition admin | `/admin/dashboard/competitions/new` | HTTP 200 au niveau route |
| Demandes organisateur | `/organizer/dashboard/requests` | HTTP 200 au niveau route |
| Scoring jury | `/jury/dashboard/scoring/{id}` | HTTP 200 au niveau route |
| Dashboard host live | `/host/dashboard/live/{id}` | HTTP 200 au niveau route |

Un statut HTTP 200 sur un dashboard ne suffit pas à valider l’autorisation côté interface. Une vérification avec session administrateur, candidat, jury et host est encore requise.

## 3. Compétitions et données publiques

L’API Production `/api/awards/competitions` retourne six compétitions réelles :

| Slug | Titre | Statut |
|---|---|---|
| `africa-awards-2024-edition-1` | Africa Awards Édition 2024 - Awards | `live_running` |
| `africa-awards-2025-edition-2` | Africa Awards Édition 2025 - Miss | `voting_open` |
| `africa-awards-2026-edition-3` | Africa Awards Édition 2026 - Talent Show | `registrations_open` |
| `africa-awards-2027-edition-4` | Africa Awards Édition 2027 - Chant | `published` |
| `africa-awards-2028-edition-5` | Africa Awards Édition 2028 - Danse | `published` |
| `africa-awards-2029-edition-6` | Africa Awards Édition 2029 - Startup | `published` |

L’API candidats retourne des candidats avec pays, statut, votes, cadeaux et dons. Le filtre par compétition fonctionne au niveau API et permet d’alimenter la page de vote et la page live.

La page de détail de compétition utilise toutefois directement `readAwardsDB()` au lieu de la source Supabase utilisée par l’API `GET /api/awards/competitions`. Cette divergence peut produire une page publique différente de l’API et rendre les modifications non persistantes ou incohérentes après déploiement.

## 4. Test du live

Le live réel s’ouvre, affiche la compétition, les candidats, un classement, un chat et les commandes de soutien. Cependant, le lecteur porte explicitement la mention **« Mux Player (mock) »** et rend un bloc visuel simulé au lieu d’un flux vidéo Mux réel. Il ne s’agit donc pas encore d’un live exploitable en production.

Les spectateurs, la cagnotte et les flèches de classement changent avec des valeurs générées côté navigateur par `setInterval` et `Math.random()`. Les commentaires initiaux sont codés en dur, l’envoi de commentaire ajoute seulement un élément dans l’état React local, et la sélection de cadeau ajoute également un message local.

**Conclusion live :** rendu de démonstration fonctionnel visuellement, mais pas encore connecté à un flux Mux, Supabase Realtime, une base de commentaires ou un événement de paiement partagé entre spectateurs.

## 5. Cadeaux et dons

Le bouton général **Cadeau** et le bouton général **Don** du live ne déclenchent aucun checkout Moneroo. Le cadeau ajoute localement le texte « Moi : a envoyé Cœur à Candidat 1 » et augmente localement la cagnotte. Le don augmente localement la cagnotte. Un rafraîchissement de la page efface ces effets.

Le catalogue affiche six cadeaux : Cœur 1 F, Étoile 2 F, Fusée 5 F, Couronne 10 F, Diamant 20 F et Coffre 50 F. Les boutons du catalogue appellent la même fonction locale `sendGift` et ne contiennent aucune initialisation de paiement. Aucun endpoint `/api/awards/gifts` ou `/api/awards/donations` dédié n’a été trouvé. La seule route générique `/api/dons` sert principalement à lister les dons d’un utilisateur authentifié et ne crée pas de paiement.

**Conclusion cadeaux/dons :** ces parcours ne sont pas encore branchés financièrement. Il n’est pas possible de valider un paiement réel pour un cadeau ou un don à partir du live dans l’état actuel.

## 6. Vote et paiement Moneroo

La page de vote appelle `/api/payment/init` avec `donAmount`, `currency: XOF` et les métadonnées `product: award_vote`, `candidate_id`, `competition_id` et `points`. Le paiement est donc routé par le moteur générique de paiement et non par une route Awards dédiée.

Le checkout Moneroo s’est ouvert correctement et affichait les moyens suivants pour le Bénin : MTN MoMo, Moov Money et Visa/MasterCard XOF. Le test a été arrêté avant confirmation parce que le solde disponible ne permettait pas le paiement. Le checkout affichait 100 F CFA alors que la page affichait 1 F CFA.

La correction doit commencer par une décision métier explicite :

| Option | Montant envoyé pour 1 vote | Affichage attendu |
|---|---:|---:|
| Prix réel 1 F | `1` XOF | 1 F CFA partout |
| Prix réel 100 F | `100` XOF | 100 F CFA partout |

Il ne faut pas corriger uniquement le texte ou uniquement la requête. Le prix doit être défini une seule fois, transmis à Moneroo dans l’unité XOF, affiché dans le récapitulatif et contrôlé au webhook avec le montant confirmé par Moneroo.

## 7. Sécurité et persistance Awards

Les tests sans session ont produit des rejets corrects : `POST /api/awards/votes` répond 401, `POST /api/awards/competitions` répond 403, et la gouvernance « seul administrateur » est appliquée sur la création de compétition.

Cependant, la route `POST /api/awards/votes` utilise `getUser()` qui lit `readDB()` pour retrouver l’utilisateur après décodage du JWT. En Production, l’authentification partagée utilise normalement Supabase via `core-db`; cette route risque donc de ne pas retrouver un utilisateur pourtant connecté si la base JSON locale ne contient pas son profil.

La même route écrit ensuite avec `writeAwardsDB(db)`. Le stockage JSON local est désactivé en Production par `db.ts`, ce qui signifie qu’un vote direct par cette route peut échouer en Production ou ne pas persister. La voie attendue devrait être le règlement Supabase déclenché par le webhook Moneroo, et non une écriture directe de vote sans preuve de paiement.

La fonction `settleAwardVoteSupabase` existe et utilise `awards_payment_transactions` avec une contrainte d’unicité sur `moneroo_transaction_id`, puis écrit `awards_votes`. Elle exige un utilisateur différent de `guest`, ce qui est cohérent avec l’obligation de rattacher un vote à un compte. Elle doit toutefois recevoir le montant confirmé par Moneroo, et non seulement `metadata.amount_cents` fournie lors de l’initialisation.

## 8. Corrections prioritaires

| Priorité | Correction | Critère de validation |
|---|---|---|
| P0 | Harmoniser 1 vote et son montant XOF dans l’interface et Moneroo | Le même montant apparaît sur la page, le checkout et le webhook |
| P0 | Empêcher tout cadeau ou don de modifier seulement l’état local | Chaque action ouvre un checkout et devient visible après webhook |
| P0 | Remplacer le mock Mux par une configuration de flux réelle ou afficher clairement un état « live à venir » | Le lecteur lit un flux autorisé et persistant, ou ne promet pas un live actif |
| P0 | Unifier les pages de détail sur Supabase/API au lieu de `readAwardsDB()` | Les données de page et d’API sont identiques après redéploiement |
| P0 | Rendre le règlement vote atomique et idempotent | Un même paiement ne crée jamais deux votes |
| P1 | Remplacer `getUser()` basé sur `readDB()` par la résolution Supabase partagée | Un compte connecté peut voter et consulter son historique |
| P1 | Ajouter des routes dédiées pour cadeau et don avec schémas stricts | Montant, candidat, compétition et type sont validés côté serveur |
| P1 | Ajouter retour post-paiement Awards et historique `/my-votes` | L’utilisateur voit succès, échec ou attente avec référence |
| P2 | Ajouter Realtime pour classement, chat, cagnotte et animations | Deux navigateurs voient le même événement confirmé |

## 9. Étape suivante sûre

La prochaine action ne doit pas être un nouveau paiement. Il faut d’abord confirmer avec le propriétaire si le prix métier est **1 F** ou **100 F par vote**. Après cette décision, la correction de cohérence doit être appliquée et testée sans paiement, puis un paiement réel de faible montant pourra être relancé avec confirmation explicite. Les cadeaux et dons ne doivent être testés financièrement qu’après branchement d’un endpoint serveur et d’un webhook dédié ou correctement routé par métadonnées.

Aucun reversement ne fait partie de ce lot et aucun reversement n’a été lancé.

## Références

[1]: https://docs.moneroo.io/payments/transaction-verification "Moneroo — Transaction verification"
[2]: https://docs.moneroo.io/payments/initialize-payment "Moneroo — Initialize payment"
