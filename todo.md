

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


## Audit locale globale

- [ ] Vérifier si la devise choisie convertit et reformate réellement tous les montants.
- [ ] Vérifier si la langue choisie traduit réellement les textes de toute la plateforme.
- [ ] Comparer les pages principales et distinguer préférence enregistrée, formatage et traduction complète.


## Internationalisation globale et mode sombre

- [ ] Auditer la détection pays, la locale, les devises et les traductions existantes.
- [ ] Définir une source de vérité pour les pays, devises, taux et langues.
- [ ] Centraliser la conversion monétaire côté serveur et le formatage global.
- [ ] Centraliser les textes traduisibles de la plateforme.
- [ ] Refaire le thème sombre avec textes clairs et accents contrastés.
- [ ] Tester progressivement avant tout déploiement global.


## Premier lot internationalisation

- [ ] Corriger la conversion monétaire pour utiliser de vrais taux et conserver la devise source.
- [ ] Centraliser le formatage des prix et repérer les affichages codés en dur.
- [ ] Préparer les fondations du dictionnaire de traduction global.
- [ ] Définir les tokens clair/sombre et vérifier les contrastes prioritaires.


## Lot final — affichage international sans modification des montants

- [ ] Confirmer que les montants métier restent stockés dans leur devise source, principalement XOF, et que seule la présentation visiteur est convertie.
- [ ] Centraliser un formatteur unique pour les cartes, fiches, paniers et récapitulatifs avant paiement.
- [ ] Migrer les prix affichés dans Marketplace, Kiosque/Magazine, Crowdfunding et Africa Awards vers ce formatteur.
- [ ] Préserver les montants source envoyés à Moneroo et ne pas doubler la conversion côté application.
- [ ] Vérifier le minimum de 100 XOF côté serveur pour les paiements concernés et afficher une information claire côté interface.
- [ ] Tester la détection pays/devise, le changement manuel de devise, le panier et la redirection Moneroo.
- [ ] Vérifier le mode sombre sur les pages migrées et préparer un checkpoint réversible avant toute livraison.

## Lot final — traduction globale progressive

- [ ] Remplacer les chaînes prioritaires des en-têtes, menus, boutons et formulaires par le dictionnaire i18n.
- [ ] Auditer les chaînes restantes par plateforme et documenter les exceptions non traduisibles.
- [ ] Vérifier la cohérence de langue entre navigation, panier, paiement et compte utilisateur.


## Correction article — photo avant titre ou résumé

- [ ] Vérifier si le dernier lot international a été poussé et déployé en production.
- [ ] Auditer la structure de la page article et localiser le bloc image actuellement trop bas.
- [ ] Repositionner la photo dans le flux éditorial avant le titre ou entre le titre et le résumé.
- [ ] Vérifier le rendu mobile, desktop, le mode sombre et les articles sans image.
- [ ] Compiler, créer un commit réversible et communiquer séparément l’état de production.


## Publication demandée — correction Article

- [ ] Préparer le commit validé comme version de livraison.
- [ ] Vérifier la branche et la cible Vercel avant publication.
- [ ] Publier uniquement après validation de la build.
- [ ] Contrôler l’URL de production et l’ordre photo puis titre sur un article réel.
- [ ] Confirmer à l’utilisateur le résultat et l’URL publique.


## Éditeur de texte enrichi — articles et magazines

- [ ] Inventorier les champs article : titre, résumé, contenu principal et traductions.
- [ ] Inventorier les champs magazine : description, détails et contenus affichés au kiosque.
- [ ] Vérifier le format actuellement stocké et les composants de lecture concernés.
- [ ] Ajouter gras, italique et souligné avec une structure compatible avec les contenus existants.
- [ ] Sanitizer le contenu formaté avant rendu public afin d’empêcher l’injection HTML ou script.
- [ ] Tester création, édition, sauvegarde, lecture publique et compatibilité avec les anciens contenus.


## Kiosque — aperçu du magazine à la une

- [ ] Auditer le composant du bloc magazine à la une et son bouton d’aperçu.
- [ ] Réutiliser le même composant et les mêmes données que le flipbook de la fiche produit.
- [ ] Vérifier l’ouverture, la fermeture, les pages PDF et les images de secours.
- [ ] Tester le fonctionnement sur ordinateur, mobile et mobile paysage.
- [ ] Compiler et enregistrer la correction dans un commit réversible.


## Performance Flipbook mobile

- [ ] Mesurer le délai de la route d’aperçu et le poids du PDF demandé par le Kiosque.
- [ ] Vérifier si le lecteur attend inutilement le PDF complet avant d’afficher la couverture.
- [ ] Vérifier le délai des images d’aperçu et le comportement de la route sécurisée.
- [ ] Afficher immédiatement une couverture ou une première page disponible sur mobile.
- [ ] Ajouter un état d’erreur et un fallback explicite si le PDF est lent ou inaccessible.
- [ ] Tester le premier affichage et la navigation sur mobile portrait et paysage.


## Publication demandée — performance Flipbook mobile

- [ ] Vérifier que le commit `7cf7147` est la version de livraison validée.
- [ ] Vérifier la branche et la cible de production avant publication.
- [ ] Déclencher la publication depuis l’interface de gestion du projet.
- [ ] Ouvrir le Kiosque en production sur mobile et tester l’apparition immédiate de la couverture.
- [ ] Contrôler le chargement de la première page et le message de délai éventuel.


## Lot backend — newsletter, KPI, rôles et e-mails

- [ ] Auditer les tables, routes et services déjà disponibles pour les abonnements newsletter.
- [ ] Vérifier la présence de tables d’événements pour connexions, déconnexions, paniers abandonnés, commandes et paiements.
- [ ] Définir les KPI réels calculables sans données fictives et leurs périodes.
- [ ] Réparer l’enregistrement newsletter avec validation, unicité et désinscription.
- [ ] Mettre en place une vérification e-mail réelle avant activation du compte.
- [ ] Définir les rôles rédacteur, gestionnaire magazine et administrateur avec contrôle serveur.
- [ ] Protéger séparément la publication, la modification et la suppression des articles et magazines.
- [ ] Préparer le service d’envoi d’e-mails pour inscription, notifications et événements importants.
- [ ] Tester les permissions, les doublons, les faux e-mails, les KPI et les erreurs d’envoi.


## Cadrage des intégrations externes et monétisation

- [ ] Cartographier les besoins pouvant rester internes à Supabase/Next.js et ceux nécessitant un fournisseur externe.
- [ ] Vérifier les prérequis officiels Google AdSense : domaine, contenu, confidentialité, consentement, ads.txt et validation Google.
- [ ] Vérifier les prérequis Google Analytics 4 et le consentement des visiteurs avant mesure non nécessaire.
- [ ] Préparer une architecture d’emplacements publicitaires non intrusive pour WAB, Magazine, Jobs, Marketplace et Crowdfunding.
- [ ] Préparer la liste des variables à fournir pour le service d’envoi d’e-mails et la vérification des comptes.
- [ ] Définir les KPI réels, leur source de données et leur fréquence de calcul sans générer de données fictives.
- [ ] Documenter les limites : aucune garantie d’acceptation AdSense avant examen Google et aucune détection parfaite d’un faux e-mail sans vérification par lien ou code.


## Fondations internes — sécurité et monétisation

- [ ] Auditer le flux d’inscription, de connexion, de session et de 2FA déjà présent.
- [ ] Retenir une limite initiale de 5 tentatives échouées par fenêtre de 15 minutes, avec blocage progressif et journalisation.
- [ ] Implémenter la vérification e-mail par lien à usage unique et expiration courte, avec possibilité d’adapter plus tard le fournisseur d’envoi.
- [ ] Vérifier et renforcer la 2FA existante sans supprimer le mécanisme de secours administrateur.
- [ ] Préparer les tables internes newsletter, événements de session, KPI et consentements publicitaires.
- [ ] Préparer les composants AdSense désactivés par défaut, `ads.txt` paramétrable et emplacements clairement séparés du contenu.
- [ ] Tester les scénarios de sécurité, la récupération de compte et la compatibilité future avec un service externe.


## Implémentation démarrée — sécurité interne

- [ ] Ajouter les tables de tokens de vérification e-mail, tentatives de connexion et événements de session.
- [ ] Ajouter les helpers de génération, hash, expiration et consommation des tokens.
- [ ] Remplacer le 2FA fictif par une vérification TOTP réelle et des codes de récupération hachés.
- [ ] Appliquer 5 tentatives sur 15 minutes avec blocage progressif côté serveur.
- [ ] Empêcher l’ouverture automatique d’une session pour un compte non vérifié.
- [ ] Compiler et tester les routes d’inscription, de connexion et de 2FA avant le lot suivant.


## Lot final demandé — sécurité, KPI, AdSense et publication

- [ ] Brancher le challenge 2FA avant l’émission du cookie de session.
- [ ] Ajouter les écrans de résultat pour vérification e-mail et challenge 2FA.
- [ ] Construire les routes KPI administrateur à partir des données réelles Supabase.
- [ ] Afficher connexions, utilisateurs actifs, paniers abandonnés, commandes, achats et flux financiers par plateforme.
- [ ] Ajouter Consent Mode et le composant AdSense désactivé tant que l’identifiant Google n’est pas fourni.
- [ ] Tester les parcours sensibles et compiler la version finale.
- [ ] Enregistrer un checkpoint réversible et préparer la publication contrôlée.
