# Revue de l’étape 1 — Création d’un projet Crowdfunding

## Avis général

Le document est suffisamment détaillé pour constituer une base fonctionnelle sérieuse. Il définit le wizard en huit étapes, les statuts du cycle de vie, les validations, les documents privés, les règles RLS, l’audit et les points encore à décider. Il est donc possible d’avancer, mais pas encore de coder définitivement sans verrouiller les décisions métier listées en fin de document.

## Points déjà suffisamment définis

Le porteur peut créer et sauvegarder un brouillon non public, puis soumettre explicitement le projet en `pending_review`. Les statuts `draft`, `pending_review`, `changes_requested`, `approved`, `active`, `suspended`, `completed_success`, `completed_failed`, `cancelled` et `rejected` sont définis avec leurs déclencheurs.

Le formulaire couvre les informations générales, le type de financement, les objectifs et la durée, les descriptions et médias, les documents justificatifs, les coordonnées et l’équipe, les risques et les consentements, puis le récapitulatif. Les documents doivent être stockés dans un bucket Supabase privé avec des liens signés temporaires.

Les règles de validation essentielles sont claires : objectifs cohérents, répartition des fonds totalisant 100 %, campagne entre 7 et 90 jours, KYC avant soumission, documents obligatoires bloquants, contrôles front et back, limitation anti-fraude, et commission figée au moment de l’approbation.

## Points à clarifier avant implémentation définitive

1. Confirmer si les quatre types `donation`, `reward`, `equity` et `lending` sont tous activés dans la première version.
2. Confirmer la liste de pays et les devises de lancement : tous les pays africains ou un premier groupe limité.
3. Définir les seuils minimum et maximum par devise ou une règle de conversion commune.
4. Confirmer la durée de campagne de 7 à 90 jours.
5. Confirmer si un porteur peut avoir un seul projet actif ou plusieurs projets simultanés.
6. Définir le niveau KYC : contrôle interne de document ou prestataire externe.
7. Définir la commission : taux unique ou taux différent selon le type de financement et le pays.
8. Préciser le compte de réception : banque, mobile money, ou les deux, et à quel moment le compte est vérifié.
9. Préciser si la vidéo uploadée doit être supportée en V1 ou si un lien YouTube/Vimeo suffit d’abord.
10. Préciser les champs de l’entreprise et le nombre maximal de membres d’équipe.

## Recommandation d’architecture

Ne pas utiliser le schéma générique `projects` tel quel, car le projet EAM possède déjà `crowdfunding_projects`. Il faut faire une migration additive ou une extension contrôlée de cette table, avec les colonnes du document, puis créer des tables liées pour `funding_details`, `project_documents`, `project_team_members`, `project_rewards` et `project_status_history`. Les IDs utilisateurs doivent rester compatibles avec l’authentification EAM existante, et non être remplacés aveuglément par `auth.users`.

La première implémentation doit couvrir uniquement le wizard, la sauvegarde de brouillon, la soumission `pending_review`, les validations back-end et le stockage privé des documents. La validation administrative et les paiements seront construits dans les étapes suivantes.
