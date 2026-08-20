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


## Vérification complémentaire demandée — compétition hors live et cycle live

La compétition `africa-awards-2025-edition-2` est bien exposée en Production avec le statut `voting_open`, six candidats, quatre candidats acceptés, une période affichée du 8 août au 7 septembre 2026 et un accès direct au vote. La page de vote du candidat réel s’ouvre directement sans passer par le live et affiche le checkout à 100 F CFA. Le vote hors live existe donc au niveau du parcours public.

Il faut toutefois distinguer « données réelles en API » et « page publique réellement branchée ». L’API des compétitions et des candidats lit Supabase, mais la page de détail de compétition et la fiche candidat lisent encore `readAwardsDB()` localement. Les données visibles peuvent donc diverger après une modification administrative ou un redéploiement. Les compétitions sont réelles dans l’API, mais le branchement de toutes les pages n’est pas encore unifié.

Le cycle live n’est pas réellement opérationnel. Le lecteur indique `Mux Player (mock)`, les spectateurs, la cagnotte et les évolutions du classement sont générés par `Math.random()` dans le navigateur, et les commentaires/cadeaux sont seulement dans l’état React local. Le tableau animateur ne fait que modifier un booléen local pour démarrer/arrêter le live ; les invitations, la modération, les candidats présents et les statistiques ne sont pas persistés. Aucun endpoint live/stream dédié n’a été trouvé. Le texte annonçant une clôture automatique des votes et un replay à l’arrêt n’est pas relié à une logique serveur.

Conclusion : les votes peuvent être lancés hors live pendant la période de la compétition active, mais le live actuel est une démonstration visuelle et non un live réel. Les cadeaux et dons du live restent également simulés et n’ouvrent pas de paiement Moneroo. Aucun nouveau paiement n’a été lancé pendant cette vérification.


## Nouvelle structure demandée — catégories et compétitions

Deux catégories ont été créées dans Supabase : `Entrepreneuriat` et `Valeur africaine`. Les six anciennes compétitions n’ont pas été supprimées ; elles ont été archivées afin de préserver l’historique et de permettre un retour arrière.

Deux nouvelles compétitions ont été créées en statut `draft`, donc elles ne sont pas encore ouvertes au vote : `Qui veut être mon associé ?` dans `Entrepreneuriat`, et `Awards du Fa` dans `Valeur africaine`. Leur prix initial de référence est de 200 XOF par vote, conformément à la règle métier minimale prévue pour les votes, mais leurs dates et leurs candidats restent à configurer avant lancement.

Les deux images fournies ont été ajoutées dans `public/africa-awards/` pour être servies correctement par Vercel. La migration de schéma `supabase/migrations/20260820_awards_categories.sql` ajoute `awards_categories` et le lien `category_id` sur `awards_competitions`. Le commit local est `1be93e1` (`feat(awards): add competition categories and real public cards`).

Le code public a été branché sur Supabase pour l’accueil, la liste et la fiche de compétition. Le build TypeScript et le build Next.js passent. Le code n’est pas encore déployé sur Vercel ; le déploiement doit être fait après validation de la structure et des paramètres de lancement.


## Audit des exigences d’inscription, de vote et de live — 20 août 2026

### Ce qui existe déjà dans le schéma

Le schéma contient les tables `awards_competition_requests`, `awards_competitions`, `awards_applications`, `awards_candidates`, `awards_votes`, `awards_gifts_catalog`, `awards_gift_transactions`, `awards_donations`, `awards_live_sessions`, `awards_live_events`, `awards_comments`, `awards_favorites`, `awards_notifications` et `awards_payment_transactions`. Les types financiers prévus distinguent le vote, le cadeau, le don candidat, le don plateforme, la cagnotte et le capital Angel.

### Manques confirmés

Le formulaire de candidature actuel ne collecte que nom affiché, pays, biographie, description du projet et URL vidéo. Il ne collecte pas identité complète, téléphone, besoins financiers, niveau actuel, plan d’affaires, documents structurés ou champs dynamiques. L’API `POST /api/awards/candidates` crée directement un candidat en attente, sans vérifier l’authentification, le statut d’inscription de la compétition, la catégorie, un éventuel paiement d’inscription ou des champs obligatoires spécifiques.

La table `awards_applications` est trop courte pour le parcours Entrepreneuriat : elle contient bio, projet, photos, vidéo et documents, mais aucun modèle de champs personnalisés, de configuration d’inscription par compétition, de frais, de paiement d’inscription ou d’identité structurée. L’interface administrateur de création de compétition ne configure actuellement que le titre, la description, une catégorie fixe, le prix du vote, les points et la pondération jury/public.

Le vote direct affiche bien un nombre de votes et le montant correspondant, mais il appelle encore l’API de paiement commune avec le produit `award_vote`. Le webhook sait régler ce vote dans Supabase avec idempotence par transaction Moneroo. En revanche, le prix du vote n’est pas encore contrôlé par une condition serveur vérifiant que la compétition est lancée et que la date courante se trouve dans la période de vote. Le lien partageable du nominé n’est pas encore un jeton ou une route métier dédiée avec état d’ouverture contrôlé.

Le dashboard candidat est entièrement alimenté par des tableaux et badges locaux fictifs. Il ne lit pas les statistiques réelles du nominé, ne limite pas l’affichage après 60 points et n’applique pas encore la règle de classement sans nombre détaillé. La page publique du nominé lit également le stockage local et affiche des compteurs exacts, en contradiction avec la règle demandée de masquage.

Les tables de notifications existent, mais aucune preuve de branchement complet n’a été trouvée pour notifier les votants lorsqu’un nominé suivi est dépassé ou pour notifier les spectateurs ayant suivi un live lorsqu’un nouveau live démarre.

Le live reste un mock : Mux Player est simulé, spectateurs et classement utilisent `Math.random()`, commentaires et cadeaux sont conservés seulement dans React, et les actions Cadeau, Don et Cagnotte n’ouvrent aucun checkout Moneroo. Les tables persistantes de live existent mais ne sont pas exploitées par la page ni par un endpoint de session live. Il manque aussi les événements de battle, le rôle animateur, montée/descente des nominés, questions, modération, réactions, likes, partages et présence synchronisée.

### Verdict

Le schéma prévoit plusieurs briques, mais le produit actuel ne réalise pas encore le parcours métier complet. Les priorités sont : créer une configuration d’inscription par compétition avec frais et champs dynamiques ; sécuriser l’application candidate et la convertir en nominé après validation ; implémenter le lien de vote et la condition de lancement ; produire les statistiques réelles avec la règle de masquage après 60 points ; connecter les notifications ; puis remplacer le live mock par des sessions, événements et paiements persistants. Aucun nominé fictif ne doit être créé avant réception des informations réelles des candidats.


## Mise à jour — inscription configurable implémentée

Le socle de candidature configurable est maintenant branché sur Supabase. La création administrateur d’une compétition peut enregistrer le mode de formulaire (`simple` ou `entrepreneurship`), les frais d’inscription, les périodes d’inscription et de vote, la cagnotte initiale, les seuils minimums de cagnotte/don et des champs supplémentaires. Les compétitions restent créées en `draft` et ne deviennent pas votables automatiquement.

La route `POST /api/awards/applications` exige une session authentifiée, vérifie que la compétition existe, que son statut est `registrations_open`, que la période est ouverte, que la configuration existe, que les champs obligatoires sont remplis et que le formulaire Entrepreneuriat contient le besoin du projet, le niveau actuel et le plan d’affaires. Les frais non nuls sont refusés explicitement avec le code `REGISTRATION_FEE_REQUIRED` tant que le paiement d’inscription n’est pas raccordé au circuit Moneroo. Les inscriptions gratuites peuvent être soumises en statut `soumise` pour validation administrative.

La page de candidature charge désormais la configuration et les champs dynamiques et affiche les champs détaillés pour l’Entrepreneuriat. Le dépôt ne crée pas directement un nominé : la conversion en nominé reste une action administrative à implémenter. La compilation TypeScript et le build Next.js ont été exécutés après ces changements ; le build a produit la liste complète des routes sans erreur bloquante visible.

## Limites à traiter avant ouverture réelle

Le contrôle de période des votes doit encore être appliqué dans la route de vote elle-même, et non seulement dans l’interface. La validation administrative doit transformer une candidature approuvée en candidat officiel avec un identifiant de vote public. Les frais d’inscription, les cadeaux, les dons, la contribution à la cagnotte et les notifications doivent utiliser le webhook Moneroo centralisé avec des métadonnées produit distinctes. Le live reste une maquette et ne doit pas être présenté comme une session vidéo persistante tant que Mux ou une solution équivalente avec présence, chat et persistance n’est pas raccordée.


## Mise à jour — vote et validation administrative sécurisés

La route serveur des votes ne comptabilise plus un vote direct sans paiement confirmé. En environnement Supabase, elle vérifie la relation entre compétition et nominé, exige le statut `accepted`, exige une compétition `voting_open` ou `live_running`, vérifie `voting_start_at` et `voting_end_at`, puis laisse le règlement définitif au webhook Moneroo. Les accès directs sans paiement renvoient une réponse explicite indiquant qu’un paiement confirmé est requis.

Le règlement du vote au webhook applique également ces contrôles avant l’écriture financière : montant minimum de 100 XOF, compétition et nominé valides, statut accepté, statut de compétition ouvert et période active. Le montant conservé dans `awards_payment_transactions` utilise l’unité XOF fournie par les métadonnées contrôlées.

La route `PUT /api/awards/applications` est maintenant réservée à l’administrateur. Une décision `rejected` marque la candidature comme rejetée. Une décision `approved` crée un nominé dans `awards_candidates`, marque la candidature comme approuvée et utilise `application_id` avec un index unique afin qu’une répétition de la requête ne crée pas de doublon. Le nominé reste au statut `accepted` et ne devient votable que lorsque l’administrateur ouvre une compétition et une période de vote.

Le build TypeScript/Next.js a été relancé après ces changements et a généré la liste complète des routes sans erreur bloquante visible. Les lots encore distincts sont le paiement des frais d’inscription, les cadeaux/dons/cagnotte via Moneroo, les notifications et le live persistant avec Realtime ou Mux.


## Mise à jour — lot financier et live

Les frais d’inscription peuvent maintenant créer une candidature en attente de paiement, puis ouvrir un checkout Moneroo dédié avec le produit `award_registration_fee`. Le webhook vérifié rattache ensuite le paiement à la candidature et la remet en statut `soumise`. Les frais doivent être nuls ou d’au moins 100 XOF.

Un endpoint dédié `/api/awards/payments/init` gère les produits `award_registration_fee`, `award_gift`, `award_donation` et `award_pot_increase`. Il exige une session utilisateur, valide la compétition, contrôle le catalogue cadeau et refuse tout montant inférieur à 100 XOF. Le webhook Moneroo route ces produits vers des fonctions de règlement Supabase idempotentes. Les cadeaux et dons sont écrits dans les tables Awards et produisent un événement live persistant.

Un endpoint `/api/awards/live` permet de démarrer et terminer une session, de consulter la session active et d’enregistrer des événements de commentaire, réaction, cadeau, don, cagnotte et présence. La page live ne génère plus de spectateurs, de cagnotte, de classement ou de commentaires fictifs. Elle affiche un flux Mux seulement lorsqu’un `mux_playback_id` réel existe ; sinon elle indique que le live n’est pas démarré ou que le flux est en attente. Le chat et les événements chargent désormais les données persistées.

Le build TypeScript/Next.js a été relancé après le lot et a produit les routes complètes sans erreur bloquante visible. Le live n’est pas déclaré entièrement opérationnel tant qu’une configuration Mux réelle n’est pas renseignée et que le tableau animateur n’est pas raccordé à l’endpoint de démarrage/arrêt. Aucun reversement n’a été ajouté.


## Mise à jour — tableau animateur et préparation Mux

Le tableau animateur utilise désormais l’API `/api/awards/live` pour démarrer et terminer une session, charger les événements persistants, inviter ou retirer un candidat via des événements de session et afficher les commentaires et montants confirmés. Les valeurs de démonstration, le compteur aléatoire de spectateurs, les commentaires préchargés et la cagnotte fictive ont été retirés.

La page publique live affiche un flux vidéo uniquement si la session contient un `mux_playback_id` réel. Sans identifiant Mux, elle indique clairement que le live n’est pas démarré ou que le flux est en attente. Aucune variable Mux ou clé secrète n’a été trouvée dans le code source ; le flux Mux de production doit donc être configuré séparément dans les secrets de déploiement et dans le service de génération de sessions avant une diffusion réelle.

Une erreur TypeScript du tableau animateur a été corrigée et le build complet a été relancé avec succès visible dans la liste des routes. La prochaine vérification doit porter sur des sessions et paiements réels dans un environnement connecté, sans reversement.


## Mise à jour — boîte à outils mobile Africa Awards

Dans l’en-tête mobile partagé, l’icône Traduction est maintenant remplacée par l’icône Boîte à outils uniquement lorsque la plateforme active est Africa Awards. Le desktop, les autres plateformes et l’icône Traduction des autres sections restent inchangés.

La fenêtre contextuelle affiche des raccourcis adaptés au contexte : le visiteur peut découvrir les compétitions, voter et accéder aux lives ; un utilisateur connecté dispose en plus de son espace nominé et de son historique de votes ; un administrateur dispose du dashboard Africa Awards, de la création de compétition, de la validation des candidatures et de l’accès aux sessions live. Chaque raccourci ferme la fenêtre après navigation et le changement de route réinitialise l’état d’ouverture.

La compilation TypeScript/Next.js a été relancée après cette modification. La mise à jour reste locale tant qu’un commit et un déploiement Production ne sont pas demandés.


## Mise à jour — refonte de l’administration Magazine

L’accueil de l’administration Magazine a été réorganisé sans supprimer les outils existants. Le nouvel écran présente un centre de pilotage avec indicateurs revenus, éditions, abonnés et demandes, un parcours recommandé et six cartes opérationnelles : Articles, Magazines/flipbooks, Abonnements/tarifs, Commandes/paiements, Rédacteurs/catégories et Réglages/sécurité.

Chaque carte conserve l’onglet opérationnel correspondant et son action existante. La composition reprend l’esprit apprécié du dashboard Africa Awards : hiérarchie forte, numérotation des étapes, descriptions courtes, accès directs et contrôle rapide. La boîte à outils mobile Africa Awards reste incluse dans le même lot de travail. La compilation complète et `git diff --check` sont passés ; aucun déploiement supplémentaire n’a encore été effectué pour permettre le regroupement avec les prochaines modifications demandées.


## Extension Magazine : articles multilingues et audio

Le modèle Article prend désormais en charge `translations`, une structure JSON par code de langue contenant le titre, le résumé et le contenu, ainsi que `audio_by_language`, une structure JSON associant chaque langue à une URL audio validée. La migration `20260820_article_localizations_audio.sql` ajoute ces colonnes à Supabase avec des index GIN.

L’administration Magazine expose des champs pour le français principal, l’anglais, l’espagnol, le swahili, le fongbé et le wolof, ainsi qu’une URL audio par langue. Les valeurs sont normalisées côté serveur, les contenus sont nettoyés et aucune piste audio fictive n’est désormais générée. La préférence de langue du compte peut être sauvegardée via `/api/profile/preferences` et lue par la page article.

La page article propose un sélecteur de langue et un lecteur audio HTML réservé aux abonnés. La version préférée est sélectionnée par défaut lorsqu’elle existe ; sinon le site revient à la langue principale de l’article. Le paywall reste appliqué à chaque version. Avant déploiement, la migration Supabase doit être appliquée sur la base de production et un article réel doit être vérifié avec au moins une traduction et une piste audio hébergée.
