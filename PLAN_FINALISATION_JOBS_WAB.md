# Plan de finalisation sécurisé — Envol Africa Jobs & World Africa Business

**Date :** 15 août 2026  
**Périmètre actif :** Jobs et World Africa Business (WAB) uniquement  
**Déploiement :** Jobs et WAB seront déployés ensemble, après recette complète.

---

## 1. Engagement de périmètre

Le travail en cours concerne exclusivement les deux nouveaux volets suivants :

- **Envol Africa Jobs** : route actuelle `/emploi` ;
- **World Africa Business** : route actuelle `/wab`.

Les volets déjà existants ne doivent pas être supprimés, remplacés, refactorisés ou modifiés fonctionnellement :

- Magazine ;
- Kiosque ;
- Africa Awards ;
- Crowdfunding ;
- Marketplace.

### Règle d’isolation appliquée

Les ajouts sont séparés par domaine fonctionnel :

```text
src/app/emploi/
src/app/api/jobs/
src/lib/jobs-*.ts

src/app/wab/
src/app/api/wab/
src/lib/wab-*.ts
```

Les migrations Supabase créées sont additives et isolées :

```text
supabase/migrations/004_jobs.sql
supabase/migrations/005_wab.sql
```

Elles créent de nouvelles ressources `jobs_*` et `wab_*`. Elles ne suppriment ni n’altèrent les tables existantes du Magazine, Kiosque, Africa Awards, Crowdfunding ou Marketplace.

---

## 2. Architecture existante respectée

Le projet utilise :

- **GitHub** pour le code source et l’historique ;
- **Next.js / Vercel** pour l’application et le déploiement ;
- **Supabase** pour les données persistantes et le stockage ;
- **Moneroo** pour les paiements.

L’URL actuelle Jobs est :

```text
https://envolafricamagazine-o4sglwoo.vercel.app/emploi
```

La configuration Moneroo existante est centralisée dans :

```text
src/lib/moneroo.ts
```

Les nouveaux modules Jobs et WAB réutilisent ce même mécanisme et les mêmes variables d’environnement Vercel. Ils n’introduisent pas une seconde intégration de paiement.

---

## 3. Travail déjà réalisé — Jobs

### Expérience publique

- Nouvelle landing page Jobs avec recherche, filtres pays/secteur et scroll infini ;
- liste des 54 pays africains ;
- classement par contenu boosté, localisation et intérêts de recherche ;
- géolocalisation via route commune `/api/geo` ;
- protection serveur des informations employeur avant décryptage ;
- fiche offre avec décryptage individuel à **200 XOF** ;
- annuaire des candidatures avec recherche par métier, pays et disponibilité.

### Candidats et employeurs

- publication gratuite de candidature ;
- publication d’offre entreprise ;
- contrôle des deux publications employeur gratuites ;
- abonnements candidat : 24 h, semaine, mois ;
- abonnements employeur : publication, semaine, mois ;
- soumission de candidature après décryptage ou abonnement actif ;
- suivi des statuts : reçue, vue, présélectionnée, refusée ;
- dashboard Jobs candidat/employeur ;
- CV PDF/DOCX envoyé vers le bucket privé Supabase `jobs-cvs` ;
- accès au CV par lien signé seulement pour un employeur concerné par une candidature.

### Boost, paiement et administration

- règles de boost Jobs implémentées ;
- initialisation Moneroo pour décryptage, abonnement et boost ;
- vérification de paiement préparée ;
- expiration logique des boosts et abonnements ;
- administration Jobs : KPI, modération d’offres et candidatures.

### Schéma Supabase Jobs préparé

La migration `004_jobs.sql` prévoit notamment :

```text
jobs_offers
jobs_candidates
jobs_subscriptions
jobs_unlocks
jobs_applications
jobs_boosts
jobs_notifications
jobs_events
```

---

## 4. Travail déjà réalisé — WAB

### Réseau professionnel

- transformation de la page WAB initiale en fil professionnel ;
- création de profils WAB séparés des autres profils Envol Africa ;
- publication de texte, opportunité, document ou vidéo ;
- scroll infini ;
- réactions, commentaires et signalements ;
- recherche par pays, secteur, expertise, professionnel et opportunité ;
- suivi de profils professionnels ;
- notifications pour les publications de profils suivis.

### Médias et modération

- téléversement de JPEG, PNG, WebP, MP4, PDF, DOCX, XLSX et PPTX ;
- limite de 50 Mo par fichier ;
- stockage privé dans le bucket `wab-media` ;
- publication avec média mise en attente de modération ;
- médias publics servis avec liens Supabase signés et temporaires après validation ;
- administration WAB pour publier, masquer ou rejeter un contenu ;
- gestion de signalements ;
- statut WAB séparé : actif, silencieux ou banni.

### Créateurs, boost et Salons

- suivi de vues ;
- suivi du visionnage vidéo ;
- récompenses créateurs :
  - **1 000 vues éligibles = 1 000 XOF** ;
  - **3 000 minutes vidéo éligibles = 5 000 XOF** ;
- statut initial des gains : `pending_review` ;
- dashboard créateur ;
- validation manuelle : valider, refuser, marquer comme payé ;
- campagnes sponsorisées WAB avec budget, durée et ciblage pays/secteur ;
- initialisation Moneroo des campagnes ;
- Salons : programmation, participation, discussion en direct, démarrage/fin par l’animateur et replay.

### Schéma Supabase WAB préparé

La migration `005_wab.sql` prévoit notamment :

```text
wab_profiles
wab_posts
wab_post_views
wab_post_reactions
wab_comments
wab_reports
wab_rewards
wab_boosts
wab_connections
wab_notifications
wab_salons
wab_salon_participants
```

---

## 5. État technique actuel

### Vérifié

- La vérification TypeScript (`npx tsc --noEmit`) est exécutée après les étapes importantes ;
- elle est actuellement valide pour les ajouts Jobs et WAB ;
- aucun changement n’a été poussé sur GitHub ou déployé sur Vercel à ce stade.

### À ne pas confondre avec la production

Les données Jobs/WAB ont un stockage temporaire local de développement afin de permettre la construction des parcours avant l’application des migrations.

**Ce stockage local ne doit pas être conservé comme source de données en production Vercel.**

Avant déploiement, les données doivent être servies par Supabase :

- données relationnelles dans les tables `jobs_*` et `wab_*` ;
- CV dans `jobs-cvs` ;
- médias WAB dans `wab-media` ;
- routes serveur avec clés Supabase serveur uniquement.

---

## 6. Méthodologie de finalisation sans perturber l’existant

### Phase A — Préparation Supabase

1. Relire les migrations `004_jobs.sql` et `005_wab.sql` ;
2. les appliquer dans le SQL Editor Supabase ou via le processus de migration retenu ;
3. vérifier la création des tables et buckets ;
4. vérifier les politiques RLS ;
5. ne modifier aucune table existante sans validation explicite.

### Phase B — Raccordement applicatif

1. Remplacer progressivement le stockage temporaire Jobs/WAB par Supabase ;
2. conserver les APIs dédiées `/api/jobs/*` et `/api/wab/*` ;
3. utiliser `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur ;
4. ne jamais exposer une clé secrète au navigateur ;
5. tester chaque module isolément avant de passer au suivant.

### Phase C — Paiements Moneroo

1. Conserver la configuration Moneroo partagée déjà présente ;
2. enrichir le traitement de webhook de manière additive ;
3. utiliser des métadonnées pour distinguer les paiements :

```text
jobs_offer_unlock
jobs_subscription
jobs_boost
wab_boost
```

4. tester en environnement de recette : succès, échec, annulation, double appel webhook ;
5. confirmer une opération métier uniquement après confirmation serveur du paiement.

### Phase D — Recette fonctionnelle

#### Jobs

- inscription/connexion ;
- publication candidature ;
- publication offre et quota gratuit ;
- décryptage ;
- abonnement ;
- candidature ;
- boost ;
- CV privé ;
- modération ;
- notifications.

#### WAB

- profil ;
- publication texte et média ;
- modération ;
- commentaire/réaction/signalement ;
- récompenses ;
- Salon ;
- boost ;
- recherche et suivi de profils.

#### Non-régression obligatoire

Vérifier que les pages existantes restent accessibles :

```text
/
/kiosque
/africa-awards
/financement
/marketplace
```

Vérifier aussi :

- connexion existante ;
- paiement Magazine/Kiosque ;
- navigation générale ;
- pages administratives existantes.

### Phase E — Déploiement contrôlé

1. Créer un commit Git clair et limité à Jobs/WAB ;
2. vérifier le build complet ;
3. déployer d’abord sur Preview Vercel ;
4. effectuer les tests de recette sur la Preview ;
5. promouvoir en production uniquement après validation ;
6. conserver la possibilité de revenir au déploiement Vercel précédent si une anomalie est détectée.

---

## 7. Garanties de méthode et limites honnêtes

### Garanties de méthode

- Pas de suppression volontaire de code existant ;
- pas de migration destructive ;
- pas de déploiement sans tests ;
- isolation Jobs/WAB par routes, données et stockage ;
- contrôle de non-régression avant et après déploiement ;
- retour à la version Vercel précédente disponible en cas de besoin.

### Limite technique

Aucun déploiement logiciel ne peut promettre un risque théorique de 0 % avant recette réelle. La méthode ci-dessus vise à réduire ce risque au maximum et à permettre un retour rapide en arrière si nécessaire.

---

## 8. Prochaine action recommandée

1. Appliquer les migrations Supabase `004_jobs.sql` et `005_wab.sql` dans l’environnement de recette ;
2. raccorder les APIs Jobs/WAB aux tables Supabase ;
3. tester les paiements Moneroo et le webhook ;
4. exécuter la recette complète ;
5. déployer Jobs et WAB ensemble.
