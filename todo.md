

## Reprise Africa Awards — prochain lot

- [ ] Auditer la route serveur de vote et la source de configuration de la compétition.
- [ ] Bloquer côté serveur les votes avant `voting_start_at`, après `voting_end_at` et hors statut `voting_open`.
- [ ] Vérifier les seuils minimums de 100 XOF pour votes, dons et contributions de cagnotte.
- [ ] Ajouter l’action administrative d’approbation d’une candidature et sa conversion idempotente en nominé officiel.
- [ ] Vérifier l’affichage du nombre de votes et le masquage après 60 points.
- [ ] Documenter les tests et sauvegarder un checkpoint avant les lots live/paiements cadeaux.


## Lot financier et live Africa Awards

- [ ] Auditer les routes de frais d’inscription, cadeaux, dons et cagnotte.
- [ ] Vérifier le routage Moneroo et les métadonnées webhook par type de produit.
- [ ] Vérifier et imposer le minimum de 100 XOF partout dans ce lot.
- [ ] Auditer les tables et routes de sessions live, chat, likes, présence et événements.
- [ ] Remplacer les écritures locales ou états React simulés par une persistance serveur là où nécessaire.
- [ ] Tester les parcours sans lancer de reversement.


## Actions restantes — animateur, Mux et tests financiers

- [ ] Auditer le tableau animateur et ses contrôles actuellement locaux.
- [ ] Connecter démarrage, arrêt, événements, candidats et modération à `/api/awards/live`.
- [ ] Vérifier les variables Mux sans exposer les secrets dans le code ou les logs.
- [ ] Prévoir un état clair lorsque le flux Mux n’est pas configuré.
- [ ] Préparer les scénarios de test contrôlé pour inscription, cadeau, don et cagnotte.


## Administration centralisée et tests sans paiement

- [ ] Vérifier si les dernières modifications Africa Awards sont réellement incluses dans le déploiement en ligne.
- [ ] Vérifier les onglets d’administration existants et la présence de Crowdfunding.
- [ ] Ajouter l’onglet Africa Awards si nécessaire, avec accès à création, inscriptions et validation.
- [ ] Vérifier que Crowdfunding ouvre bien ses outils d’administration sans lien cassé.
- [ ] Tester le parcours Africa Awards sans paiement avant les tests Moneroo.


## Déploiement et tests fonctionnels

- [ ] Vérifier compilation et diff avant déploiement.
- [ ] Créer un commit réversible contenant l’administration centrale et Africa Awards.
- [ ] Déployer en Production Vercel et vérifier l’état READY.
- [ ] Tester l’accès administration, Crowdfunding et Africa Awards sans paiement.
- [ ] Documenter le lien de test et les limites restantes.


## Boîte à outils mobile Africa Awards

- [ ] Repérer l’en-tête mobile Africa Awards et le composant de fenêtre réutilisable.
- [ ] Remplacer l’icône Traduction uniquement sur mobile Africa Awards.
- [ ] Définir les raccourcis visiteur/votant, nominé et administrateur.
- [ ] Implémenter l’ouverture, la fermeture et la navigation contextuelle.
- [ ] Vérifier que le desktop et les autres plateformes restent inchangés.


## Déploiement boîte à outils mobile Awards

- [ ] Recompiler et vérifier le diff local.
- [ ] Committer la boîte à outils mobile Africa Awards.
- [ ] Synchroniser la branche puis fusionner dans main.
- [ ] Attendre et vérifier le déploiement Production Vercel.
- [ ] Confirmer le lien et l’état en ligne.


## Refonte administration Magazine

- [ ] Auditer la présentation actuelle et toutes les actions existantes.
- [ ] Conserver les outils Magazine déjà disponibles et leurs routes.
- [ ] Recomposer l’accueil avec une hiérarchie claire inspirée d’Africa Awards.
- [ ] Ajouter des cartes de modules et un accès opérationnel lisible.
- [ ] Vérifier les autres administrations avant le déploiement groupé avec Africa Awards.


## Déploiement groupé Magazine + Africa Awards

- [ ] Recompiler la version regroupée.
- [ ] Créer et pousser le commit de la boîte à outils mobile et de la refonte Magazine.
- [ ] Fusionner dans `main`.
- [ ] Vérifier le déploiement Production Vercel et son état `READY`.


## Versions linguistiques et audio des articles Magazine

- [ ] Auditer le modèle article, les API, le paywall et le compte utilisateur.
- [ ] Vérifier les champs multilingues et audio déjà disponibles.
- [ ] Définir la structure des versions par langue et du fichier audio associé.
- [ ] Ajouter les champs dans la création et modification d’article.
- [ ] Afficher la langue préférée et le lecteur audio pour les abonnés.
- [ ] Tester l’accès non abonné, le changement de langue et l’écoute audio.


## Déploiement Magazine multilingue et audio

- [ ] Vérifier le diff, le build et la migration article-localizations.
- [ ] Appliquer la migration Supabase en production.
- [ ] Créer et pousser le commit de déploiement.
- [ ] Vérifier Vercel Production en état READY.
- [ ] Tester les routes de préférence et d’article après mise en ligne.


## Navigation mobile multi-plateformes

- [ ] Auditer les en-têtes mobiles des plateformes Magasin, Job, Kiosque, Crowdfunding, Marketplace et Hub.
- [ ] Auditer le composant du menu inférieur « + » et ses trois actions actuelles.
- [ ] Ajouter les boîtes à outils contextuelles par plateforme.
- [ ] Transformer le menu « + » en barre texte avec six actions et ouverture/fermeture au clic.
- [ ] Tester les plateformes mobile et préserver le desktop.
- [ ] Compiler, documenter et déployer le lot.


## Correction responsive du menu inférieur mobile

- [ ] Garantir une seule ligne horizontale avec défilement contrôlé.
- [ ] Remplacer les sélecteurs natifs Pays et Devise par des menus clairs et modernes.
- [ ] Refermer automatiquement la barre après une sélection.
- [ ] Tester les largeurs mobiles et compiler avant déploiement.


## Bandeau audio article et menu mobile

- [ ] Regrouper langue et audio dans un bandeau rouge responsive.
- [ ] Remplacer le sélecteur de langue natif par un menu moderne et accessible.
- [ ] Rechercher les autres menus natifs ciblés sans modifier les contrôles indispensables.
- [ ] Réaligner les six actions du bouton « + » sur une seule ligne et replier l’ensemble.
- [ ] Compiler et préparer le déploiement après vérification.


## Restauration du menu inférieur mobile

- [ ] Identifier la version du menu avant les deux dernières corrections.
- [ ] Restaurer uniquement le rendu et le comportement du menu inférieur.
- [ ] Conserver le bandeau rouge langue-audio de la page article.
- [ ] Compiler, déployer directement et vérifier l’état Production.


## Drapeau et réglages mobiles

- [ ] Remplacer le menu mobile avant la loupe par le drapeau du pays actif.
- [ ] Regrouper mode sombre/clair, devise et langue dans la fenêtre du drapeau.
- [ ] Vérifier la persistance du pays et la fermeture des réglages.
- [ ] Compiler et déployer directement en Production.
