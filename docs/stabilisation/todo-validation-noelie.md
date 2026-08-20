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
