# Validation Crowdfunding avec le compte Noélie

- [ ] Se reconnecter avec Noélie sur le nouveau preview 8dca8a1.
- [ ] Vérifier que l’étape 2/8 est affichée et que les modèles de financement sont disponibles.
- [ ] Choisir un modèle de test et une formule Angel si nécessaire.
- [ ] Compléter les étapes 3 à 8 avec des données de test non financières.
- [ ] Enregistrer un seul brouillon et vérifier son apparition dans le dashboard.
- [ ] Vérifier qu’un second brouillon est refusé.
- [ ] Soumettre le projet de test et relever le statut obtenu.
- [ ] Faire approuver le projet dans l’administration si le compte le permet.
- [ ] Atteindre la page Moneroo sans confirmer de paiement.
- [ ] Documenter chaque résultat et toute erreur rencontrée.

## Constat intermédiaire

Le preview reconnaît toujours le compte Noélie. En revanche, après une nouvelle navigation directe vers le dashboard, le wizard revient à l’étape 1 et les champs précédemment saisis ne sont pas conservés tant qu’aucun brouillon n’a été enregistré. Le test doit donc recommencer l’étape 1 puis utiliser explicitement « Enregistrer brouillon » avant toute navigation.

Les champs du projet ont été reconstitués après le rechargement : titre, slogan, Cotonou, secteur Tech et pays Bénin. Le projet n’est toujours pas enregistré.

Le passage de l’étape 1 à l’étape 2 fonctionne de nouveau après reconstitution des champs. L’étape 2 affiche bien les quatre modèles et les trois formules Angel. La session n’a encore déclenché aucun paiement.

Premier essai d’enregistrement du brouillon à l’étape 2 : l’interface affiche « Champs requis manquants » malgré les champs de l’étape générale et la sélection apparente d’Angel/formule. Aucun brouillon n’est confirmé dans le dashboard à ce stade. Il faut identifier le champ manquant ou un état de sélection non propagé avant de poursuivre.

## Passage en production confirmé

Le test est autorisé en production avec un projet explicitement nommé comme test. Les écritures seront limitées au brouillon et aux statuts nécessaires ; aucune confirmation de paiement Moneroo ne sera effectuée par l’agent.

## Constat production — 20 août 2026

URL testée : https://envolafricamagazinegildas.vercel.app/financement/dashboard/porteur

La production affiche « Mon profil : Visiteur » et non le compte Noélie. Le wizard de création n’est donc pas accessible. Le dashboard affiche toutefois des métriques de démonstration (« 3.2M F », « 1 240 vues », « 78% taux réussite ») alors qu’aucun projet n’est listé. Ce point est bloquant pour un test réel et doit être corrigé ou expliqué avant toute écriture en production.

La production est actuellement connectée à « Visiteur Test EAM » (`visiteur.eam.20260817@example.com`), pas à Noélie. Le compte dispose d’un espace visiteur et le dashboard Crowdfunding affiche des statistiques fictives de démonstration. Il est impossible de valider le parcours porteur avec cette session ; une authentification Noélie explicite est nécessaire avant toute création en production.

## Vérification de cohérence déploiement/données

- [ ] Comparer l’URL de production consultée avec le preview du commit 8dca8a1.
- [ ] Vérifier si les données visibles proviennent de Supabase ou d’un fallback de démonstration.
- [ ] Confirmer l’état réel des campagnes après suppression des données de test.

## Conclusion déploiement Vercel

Le commit `8dca8a1` (« fix(crowdfunding): allow partial draft saves ») possède un déploiement READY à l’URL `https://envolafricamagazinegildas-i3325e8k1-arminel.vercel.app`. Le domaine `https://envolafricamagazinegildas.vercel.app` consulté par l’utilisateur est le domaine de production, mais la configuration Vercel indique que le dernier déploiement de la branche de stabilisation est un preview (`target: null`) et que le projet n’est pas marqué live. La présence des anciennes données sur le domaine de production est donc cohérente avec une version de production distincte ou un fallback de démonstration.

## Vérification endpoint public production

L’endpoint `https://envolafricamagazinegildas.vercel.app/api/crowdfunding/projects?limit=12` renvoie encore plusieurs campagnes de démonstration (« Projet AgroBio », « Projet TechVillage », « Projet Solar Power », etc.) avec des dates du 18 août 2026 et des porteurs `porteur_0`, `porteur_1`, etc. Ces données ne correspondent pas à la liste nettoyée attendue sur Supabase. Le domaine de production utilise donc encore une source fallback, une ancienne version ou une autre base de données. Il faut corriger cette incohérence avant d’autoriser une contribution réelle.

## Résultat preview 212ebc3

Le déploiement `212ebc3` est READY à `https://envolafricamagazinegildas-4ap1vaueh-arminel.vercel.app`. L’endpoint public retourne `{"projets":[],"nextCursor":null,"boostedIds":[]}` : les anciennes campagnes de démonstration ne sont plus servies et la liste est cohérente avec le nettoyage. Le preview est donc prêt pour reprendre la validation authentifiée du projet soumis.

## Tâches ajoutées — administration Crowdfunding

- [ ] Ajouter une liste administrative des projets soumis depuis Supabase.
- [ ] Ajouter l’affichage du détail, du porteur, du financement et des documents.
- [ ] Ajouter les actions sécurisées approuver, rejeter et remettre en brouillon.
- [ ] Tester la visibilité du projet Noélie avant toute contribution Moneroo.
- [ ] Vérifier que la promotion en production ne réintroduit aucun fallback JSON.

## Blocage constaté — file administrative vide

- [ ] Comparer le projet Supabase utilisé par le preview avec celui de la production.
- [ ] Vérifier si la soumission Noélie existe dans la table `crowdfunding_projects`.
- [ ] Vérifier que la session administrateur utilise le même environnement et les bons droits.
- [ ] Ne pas recréer de projet tant que la cause de la file vide n’est pas établie.

## Diagnostic confirmé

La base Supabase de référence `rtfjwpytiuvoekomevpu` contient exactement un projet Crowdfunding, `MagicAfrica`, avec le statut `en_attente_validation`. Son `porteur_id` correspond au compte Noélie `Noelie GBETOKOU` (`noeliegbetokou@gmail.com`). La file administrative du preview affichant zéro projet, le problème est une mauvaise liaison d’environnement Supabase du preview ou une configuration Vercel différente, et non une absence du projet. Aucun doublon ne doit être créé.

## Action confirmée — alignement de configuration

- [ ] Auditer les variables Supabase locales et la configuration Vercel du preview.
- [ ] Aligner le preview sur la base `rtfjwpytiuvoekomevpu` qui contient MagicAfrica.
- [ ] Redéployer sans modifier le statut du projet.
- [ ] Vérifier que MagicAfrica apparaît dans la file administrative.

## Nouveau blocage — projet toujours invisible après connexion

- [ ] Capturer le statut HTTP et le JSON de `/api/admin/crowdfunding/projects` sur le preview.
- [ ] Distinguer une réponse 401/403 d’une réponse vide Supabase.
- [ ] Comparer la base lue par le preview avec `rtfjwpytiuvoekomevpu`.
- [ ] Ne modifier ni le projet MagicAfrica ni son statut avant diagnostic.

## Réponse API et preview corrigé

Sur le preview avant le dernier correctif, l’appel `GET /api/admin/crowdfunding/projects` a répondu `401 {"error":"Non authentifié"}` dans la session de contrôle. Le correctif `4388e0d` affiche désormais une page explicite de session non reconnue au lieu de compteurs zéro. Le déploiement Vercel `dpl_AUjcSFB4VSvjvP4TfZ9JXgUCxLRn` est READY à l’URL `https://envolafricamagazinegildas-q5oid18d7-arminel.vercel.app`. La base Supabase de référence contient toujours MagicAfrica avec le statut `en_attente_validation`.

## Blocage — action administrative non fonctionnelle

- [ ] Vérifier pourquoi le statut affiche « À valider » sans bouton d’action opérationnel.
- [ ] Exposer une action explicite « Approuver le projet » et une action de rejet séparée.
- [ ] Tester la requête PUT et la transition `en_attente_validation` vers `en_cours`.
- [ ] Ne lancer aucun paiement pendant cette correction.
