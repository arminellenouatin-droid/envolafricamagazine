# Rapport final de stabilisation — Finance & Crowdfunding

**Projet :** Envol Africa Ecosystem
**Branche :** `stabilization/lot-4-finance-migration-audit`
**Date :** 20 août 2026
**Auteur :** Manus AI

## 1. Synthèse exécutive

La phase de stabilisation financière du module Crowdfunding est désormais structurée autour de Supabase, avec un stockage privé des documents sensibles, des politiques RLS explicites, un reporting mensuel pour les investisseurs, un accompagnement obligatoire pour les projets Angel, une commission calculée au reversement et un boost payant limité dans le temps.

Le code a été compilé avec succès après chaque lot principal et les changements ont été poussés sur la branche dédiée. Les données de test Crowdfunding ont été supprimées ; les endpoints publics vérifiés ne retournent donc actuellement aucune campagne active, ce qui est cohérent avec l’état de départ demandé.

> **État global :** stabilisation technique avancée et preview fonctionnelle sur les parcours publics ; validation authentifiée de bout en bout encore requise avant passage en production.

## 2. Travaux réalisés

| Domaine | Réalisation | État |
|---|---|---|
| Reporting investisseur | Affichage des rapports mensuels autorisés avec chiffre d’affaires, trésorerie, dépenses, clients actifs et résumé | Validé au build et sur preview |
| Reporting porteur | Formulaire de soumission des rapports mensuels et KPI | Validé au build |
| Angel | Trois formules d’accompagnement : 50 000, 80 000 et 100 000 FCFA par mois ; engagement obligatoire à la création | Validé sur endpoint preview |
| Documents KYC | Bucket Supabase privé, contrôle d’accès, validation MIME et URL signée temporaire | Validé techniquement |
| RLS | Refus explicite des accès directs `anon` et `authenticated` sur les tables sensibles Crowdfunding | Audit Supabase sans alerte Crowdfunding restante |
| Commission | Taux par type de financement, initialisé à 4 %, commission calculée sur le brut et figée lors de la demande de reversement | Validé au lint/build et migration appliquée |
| Reversement | Demande unique ouverte par projet, calcul brut/commission/net, statuts de suivi | Validé au lint/build |
| Boost | Paiement Moneroo, durée de 1 à 90 jours, prix calculé automatiquement à partir d’un tarif quotidien administrable | Validé au lint/build et migration appliquée |
| WAB | Activation du boost après confirmation Moneroo et publication du projet boosté dans WAB via le traitement webhook existant | Présent dans le flux serveur ; test de paiement réel à effectuer |
| Métriques dashboard | Suppression des valeurs fictives du dashboard porteur et du dashboard investisseur | Corrigé et build validé |

## 3. Validation réalisée sur le preview

Le preview de la branche de stabilisation a été identifié sur Vercel et les pages publiques suivantes ont été vérifiées :

| Vérification | Résultat observé |
|---|---|
| `/financement` | La page se rend correctement, avec filtres et parcours de dépôt de projet. Aucune campagne active n’est affichée après nettoyage des données de test. |
| `/api/crowdfunding/advisory-plans` | Les trois formules Angel actives sont retournées avec prix, niveau de service et description. |
| `/api/crowdfunding/projects?limit=12` | Réponse valide : liste vide, `nextCursor: null`, `boostedIds: []`. |
| `/api/crowdfunding/payouts` sans session | Refus correct avec `Connexion requise.` |
| `/api/crowdfunding/documents` sans session | Refus correct avec `Connexion requise.` |
| `/financement/dashboard/porteur` | Wizard en 8 étapes rendu correctement ; métriques initiales à zéro lorsqu’aucun projet n’est disponible. |
| `/financement/dashboard/investisseur` | Dashboard rendu correctement ; les valeurs fictives de parts, valorisation et échéancier ont été retirées. |

La protection SSO Vercel a nécessité une reprise de session pour consulter la preview. Le test public a été mené sans mutation de données. Les tests authentifiés et les paiements Moneroo doivent être exécutés avec un compte applicatif de test et un moyen de paiement de sandbox avant toute mise en production.

## 4. Commits livrés

| Commit | Contenu |
|---|---|
| `75b5186` | Sécurisation RLS Crowdfunding et documents privés |
| `ef45904` | Commission par type et demandes de reversement |
| `bc9dc06` | Connexion du dashboard porteur au reversement et aux métriques Supabase |
| `4bd4fd4` | Suppression des métriques fictives du dashboard investisseur |
| `bf3f18c` | Boost Crowdfunding payant et limité dans le temps |

La branche distante de travail est `stabilization/lot-4-finance-migration-audit`. Le déploiement Vercel est configuré en preview par branche, ce qui permet de revenir à un commit stable sans toucher directement à la production.

## 5. Règles financières effectivement implémentées

La commission est calculée selon le type de financement en utilisant la table `crowdfunding_commission_rates`. La valeur initiale de chaque type est de 4 %, mais le taux peut être ajusté ultérieurement par l’administration. Le calcul suit la règle suivante :

```text
commission = arrondi(montant_brut_collecte × taux / 100)
montant_net = montant_brut_collecte − commission
```

La commission n’est pas déduite au moment de la contribution. Elle est enregistrée au moment de la demande de reversement et reste figée dans la demande afin d’éviter qu’une modification administrative ultérieure ne change rétroactivement un paiement déjà soumis.

Le boost est calculé automatiquement selon la durée choisie. Le tarif initial est de 500 FCFA par jour, donc une durée de 7 jours produit un paiement de 3 500 FCFA. La table `crowdfunding_boost_settings` permet de modifier le tarif quotidien sans modifier le code. Le projet n’est publié dans WAB et marqué actif qu’après confirmation du paiement par Moneroo ; la durée d’activation est celle qui a été payée.

## 6. Points restant à valider avant production

La validation fonctionnelle complète doit être réalisée avec un compte porteur et un compte investisseur distincts. Le scénario recommandé est le suivant : créer un brouillon, vérifier la limite d’un brouillon par porteur, soumettre le projet, le faire approuver dans l’administration, effectuer une contribution Moneroo de test, confirmer la création de la contribution par le webhook, publier un rapport mensuel, vérifier sa visibilité côté investisseur, puis tester une demande de reversement sur un projet arrivé à son objectif.

Le second scénario concerne le boost : créer ou sélectionner un projet actif, choisir une durée, vérifier que le montant est égal à `500 × nombre de jours`, effectuer le paiement Moneroo de test, confirmer que le webhook rend le boost actif et vérifier la publication automatique dans WAB. Une nouvelle tentative du même webhook doit rester idempotente et ne pas créer un second boost ou une seconde publication.

Enfin, la migration complète des autres flux Moneroo — Magazine, abonnements, dons, Jobs, Marketplace et Africa Awards — doit être vérifiée séparément avec les mêmes exigences : référence de paiement unique, webhook idempotent, confirmation serveur du statut Moneroo et absence d’écriture JSON sur Vercel.

## 7. Risques résiduels et recommandations

Le dashboard investisseur comporte encore des zones fonctionnelles qui dépendent de données réelles non disponibles dans l’état vide actuel, notamment la valorisation détaillée des prises de participation. L’interface n’affiche plus de chiffres fictifs, mais le calcul final doit être vérifié sur une contribution equity réelle.

Le dashboard porteur contient encore certains textes hérités décrivant des fonctionnalités futures ou des parcours de démonstration, notamment dans la messagerie et les remboursements automatiques. Ils ne compromettent pas la sécurité, mais doivent être harmonisés avant la mise en ligne commerciale afin d’éviter toute promesse non disponible.

Le contrôle d’accès applicatif doit rester distinct du RLS. Les endpoints utilisent l’utilisateur de session et le rôle métier, tandis que Supabase est appelé avec la clé serveur. Il faut donc conserver la protection des secrets Vercel, ne jamais exposer `service_role` au navigateur et ne pas réactiver les anciens chemins JSON en production.

## 8. Procédure de déploiement sûre

La procédure retenue est additive et réversible. Toute modification commence par une migration SQL nouvelle, un commit dédié et un build local. Le preview de la branche est ensuite contrôlé sur les endpoints publics et sur les parcours authentifiés. Après validation, le commit peut être promu ; en cas de régression, le déploiement Vercel doit être rollbacké vers le dernier commit READY connu, sans supprimer les données Supabase.

La sauvegarde de prudence doit conserver le dépôt Git, les migrations SQL, les variables d’environnement hors ligne et un export contrôlé des tables métier. Les données de test ne doivent jamais être réintroduites dans la base de production pour simuler un parcours ; il est préférable d’utiliser un environnement de test séparé ou des comptes de test explicitement identifiés.

## 9. Conclusion

Le module Crowdfunding n’est plus dépendant de la persistance locale pour ses éléments financiers essentiels. La base possède désormais les fondations nécessaires pour gérer des projets Angel, participatifs, equity et lending avec reporting, accompagnement, boost, commission et reversement contrôlé.

La prochaine étape n’est pas une nouvelle refonte : c’est une **campagne de tests authentifiés et de paiements sandbox**, suivie d’une revue des flux Moneroo Magazine, Jobs et Marketplace. Aucun déploiement production ne doit être considéré comme final avant la réussite de ces scénarios et la confirmation qu’un rollback reste possible.
