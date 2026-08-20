# Validation Crowdfunding avec le compte Noélie

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
