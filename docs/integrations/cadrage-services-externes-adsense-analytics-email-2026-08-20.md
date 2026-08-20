# Cadrage des services externes et de la monétisation

**Projet :** écosystème Envol Africa  
**Date :** 20 août 2026  
**Auteur :** Manus AI

## Conclusion exécutive

L’écosystème peut rester largement autonome. Les fonctions de messagerie interne, de notifications dans l’application, de suivi des sessions, de calcul des KPI, de gestion des rôles et de stockage des abonnés newsletter peuvent être développées dans Next.js et Supabase. Elles ne nécessitent pas obligatoirement un service externe supplémentaire.

En revanche, trois besoins ne peuvent pas être garantis correctement avec du code local uniquement : l’envoi réel des e-mails, la vérification qu’une personne contrôle l’adresse e-mail fournie et la diffusion d’annonces Google. Pour ces trois sujets, il faut connecter un fournisseur d’envoi e-mail et créer/configurer un compte Google correspondant. Les clés et identifiants doivent être fournis par le propriétaire du projet et stockés comme secrets de production.

> Il n’est pas possible de garantir une approbation AdSense à 100 %. Google décide après examen du domaine, du contenu, de l’expérience utilisateur, du respect des règles et de la propriété du site. Le code peut préparer l’infrastructure et réduire les risques, mais il ne peut pas remplacer la validation Google.

## Ce qui peut rester interne à Envol Africa

| Besoin | Solution proposée | Service externe obligatoire ? |
|---|---|---:|
| Newsletter et désinscription | Table Supabase dédiée, route API sécurisée, contrainte d’unicité, statut actif/désinscrit, journal d’inscription | Non pour stocker ; oui pour envoyer un e-mail de confirmation |
| Messagerie interne | Tables de conversations/messages, contrôle d’accès serveur, notifications internes et temps réel Supabase | Non |
| Présence connectée/déconnectée | Événements de session, `last_seen_at`, heartbeat limité, agrégation par période | Non |
| KPI de connexions | Vue/API d’agrégation à partir des événements réels | Non |
| KPI paniers abandonnés | Événement de panier, expiration configurable, exclusion des commandes payées | Non |
| KPI ventes et flux financiers | Agrégation des commandes, paiements confirmés et remboursements par plateforme | Non pour le calcul ; Moneroo reste la source de confirmation de paiement |
| Rôles rédacteur/gestionnaire/admin | Rôles en base, permissions par action, contrôles serveur sur chaque route | Non |
| Notifications dans le site | Table `notifications`, déduplication et statut lu/non lu | Non |
| Authentification Google | OAuth Google si souhaité | Oui, uniquement si le bouton Google Login est retenu |

## Newsletter et e-mails transactionnels

Le formulaire newsletter actuellement présent dans le Kiosque est un formulaire d’interface qui affiche un message local ; il ne crée pas encore un abonnement persistant. Il faut le relier à une table dédiée et à une route API. La route devra normaliser l’adresse, refuser les formats invalides, empêcher les doublons, enregistrer la date, la source et le consentement, puis permettre la désinscription.

Pour envoyer une confirmation, un lien de vérification de compte, une notification de paiement, une notification de message ou une alerte importante, la meilleure solution légère est un fournisseur transactionnel spécialisé tel que **Resend**. Une alternative est le SMTP du domaine Envol Africa. Attendre la mise en ligne n’est pas techniquement obligatoire : l’infrastructure peut être préparée avant, mais les identifiants d’envoi et le domaine expéditeur doivent être vérifiés avant les tests réels.

### Informations à fournir pour l’envoi e-mail

| Variable ou élément | Nécessité | Où le récupérer |
|---|---:|---|
| Clé API Resend ou identifiants SMTP | Obligatoire pour l’envoi réel | Tableau de bord du fournisseur |
| Adresse expéditrice vérifiée | Obligatoire | Domaine e-mail contrôlé par Envol Africa |
| Domaine d’envoi | Obligatoire pour une bonne délivrabilité | DNS du domaine |
| Enregistrements SPF/DKIM/DMARC | Fortement recommandé | Fournis par Resend ou le prestataire SMTP puis ajoutés au DNS |
| URL publique de vérification | Obligatoire | Domaine de production Vercel |
| Politique de rétention des journaux | À décider | Paramètre produit et conformité |

Une adresse « fausse » ne peut pas être détectée parfaitement par une simple expression régulière. La solution fiable est la double vérification : contrôle syntaxique et domaine, blocage raisonnable des domaines jetables, puis e-mail contenant un lien ou un code à usage unique. Le compte ne doit pas être considéré comme vérifié tant que le lien n’a pas été utilisé.

## Google Analytics 4

Google Analytics 4 est utile pour mesurer les parcours, les abandons, les conversions, les sources d’acquisition, les pages vues et les revenus. Il est recommandé pour piloter la rentabilité, mais il ne doit pas remplacer les données internes de commandes et paiements. Les montants financiers doivent rester calculés depuis la base et les confirmations Moneroo ; Analytics sert à analyser les parcours et les événements.

L’intégration doit être faite avec une bannière de consentement et Google Consent Mode v2. Google recommande de définir l’état de consentement avant l’envoi des événements, puis de mettre à jour cet état lorsque l’utilisateur choisit ses préférences [3]. Les catégories minimales à gérer sont `analytics_storage`, `ad_storage`, `ad_user_data` et `ad_personalization`.

### Informations nécessaires pour GA4

| Élément | Nécessité |
|---|---:|
| Identifiant de mesure `G-XXXXXXXXXX` | Obligatoire |
| Propriété GA4 et flux Web | Obligatoire |
| Accès administrateur à Google Analytics | Recommandé |
| Choix des catégories de consentement | Obligatoire |
| Événements à mesurer | À définir puis implémenter |

Événements prioritaires à prévoir : `page_view`, `login`, `sign_up`, `newsletter_subscribe`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `donation`, `vote_started`, `campaign_view`, `job_view`, `article_read` et `message_sent`. Les événements ne doivent jamais contenir de mot de passe, token, adresse complète ou donnée sensible inutile.

## Google AdSense

Le site peut être rendu techniquement compatible avec AdSense, mais l’éligibilité dépend d’une décision Google. Google demande notamment un contenu original et de qualité, le respect des règles éditeur, un site dont le propriétaire peut contrôler le code HTML et un demandeur âgé d’au moins 18 ans [1]. Les règles interdisent notamment les clics artificiels, l’incitation à cliquer, les intégrations trompeuses, les pop-ups perturbateurs et les emplacements qui ressemblent à des menus ou à des liens de téléchargement [2].

### Infrastructure que nous pouvons préparer

| Élément | Préparation côté projet |
|---|---|
| Script AdSense | Chargement uniquement après décision de consentement publicitaire, avec identifiant fourni par Google |
| Composant `AdSlot` | Emplacements réutilisables et clairement étiquetés, désactivables par plateforme |
| Emplacements Magazine | Entre des blocs éditoriaux, jamais dans le titre ou au-dessus d’un bouton de téléchargement |
| Emplacements WAB et scrolls | Emplacements espacés, non confondus avec les publications, actions ou commentaires |
| Jobs, Marketplace, Crowdfunding | Emplacements compatibles avec la lecture, la recherche et les fiches, sans masquer les actions commerciales |
| `ads.txt` | Fichier racine généré avec l’identifiant éditeur réel fourni par Google |
| Consentement | Liaison avec Consent Mode v2 et préférence publicitaire distincte de la préférence analytique |
| SEO et qualité | Métadonnées, pages légales, navigation claire, contenus originaux et pages sans erreurs critiques |

Google indique qu’`ads.txt` n’est pas strictement obligatoire pour diffuser, mais qu’il est recommandé car certains acheteurs ne participent qu’aux enchères vérifiées. Le fichier se place à la racine du domaine et contient l’identifiant éditeur autorisé [4]. Nous ne devons pas inventer la ligne `ads.txt` : elle devra être construite à partir de l’identifiant fourni dans le compte AdSense.

### Informations nécessaires pour AdSense

| Élément | Nécessité |
|---|---:|
| Compte AdSense validé | Obligatoire pour diffuser des annonces réelles |
| Domaine de production définitif | Obligatoire |
| Identifiant éditeur `ca-pub-...` | Obligatoire |
| Ligne `ads.txt` fournie par Google | Obligatoire en pratique pour une bonne couverture |
| Accès au compte Google propriétaire | Obligatoire pour la validation et le suivi |
| Décision sur les plateformes autorisées | Nécessaire pour éviter une surcharge publicitaire |
| Politique de confidentialité et consentement | Obligatoire pour l’intégration conforme |

Les pages liées à des paiements, formulaires sensibles, comptes privés, messagerie privée et écrans administrateurs ne doivent pas être traitées comme de simples emplacements publicitaires. Les annonces doivent rester séparées des actions importantes et ne doivent pas être placées dans la messagerie ou les e-mails, conformément aux règles d’emplacement Google [2].

## Messagerie interne et notifications

La messagerie interne peut rester sur Supabase : conversations, messages, pièces jointes, statut lu, notifications et accès par participant. Un service externe n’est pas nécessaire pour le fonctionnement dans l’application. Un service e-mail est seulement nécessaire si chaque nouveau message, changement de statut ou notification doit aussi être relayé vers la boîte personnelle de l’utilisateur.

La stratégie recommandée est de distinguer trois canaux : notification interne immédiate, notification push si l’utilisateur l’a autorisée, et e-mail transactionnel réservé aux événements importants ou aux préférences choisies. Cette séparation évite d’envoyer un e-mail pour chaque interaction et protège la délivrabilité.

## État actuel et ordre recommandé

Le projet dispose déjà d’une base pour les utilisateurs, les notifications internes, les paiements, les commandes, l’administration et les préférences de locale. En revanche, l’audit montre que l’inscription newsletter est encore locale au navigateur, qu’aucun service d’envoi e-mail n’est configuré et qu’AdSense/GA4 ne sont pas encore intégrés comme infrastructure de production.

L’ordre sûr est le suivant : créer les tables et contrôles internes ; brancher le formulaire newsletter ; ajouter les rôles et permissions serveur ; créer les événements et KPI ; ajouter la bannière de consentement et Consent Mode ; intégrer GA4 avec un identifiant réel ; préparer les composants publicitaires mais les laisser désactivés jusqu’à la validation AdSense ; enfin connecter le fournisseur e-mail et effectuer les tests réels sur le domaine de production.

## Prérequis à fournir par le propriétaire

Pour avancer sans inventer de secrets, il faudra fournir : l’identifiant GA4, l’identifiant AdSense après création du compte, la ligne `ads.txt` ou les instructions Google correspondantes, le domaine définitif à valider, un fournisseur e-mail choisi et sa clé API ou ses paramètres SMTP, ainsi que l’adresse expéditrice vérifiée. Les secrets devront être ajoutés uniquement dans les variables d’environnement de production, jamais dans Git ni dans le code source.

## Références

[1]: https://support.google.com/adsense/answer/9724?hl=fr "Google AdSense — Critères d’éligibilité"

[2]: https://support.google.com/adsense/answer/48182?hl=fr "Google AdSense — Règlement du programme"

[3]: https://developers.google.com/tag-platform/security/guides/consent "Google Developers — Configurer le mode Consentement"

[4]: https://developers.google.com/adsense/platforms/transparent/ads-txt "Google Developers — Ads.txt"


## Incrément implémenté le 20 août 2026

La première migration additive a été appliquée au projet Supabase EAM `rtfjwpytiuvoekomevpu`. Elle crée les tables `newsletter_subscribers`, `email_verification_tokens`, `login_attempts`, `session_events`, `consent_records` et `analytics_events`, avec index et RLS restrictives. Une seconde migration a ajouté les colonnes chiffrables `two_factor_secret` et `two_factor_recovery_hashes` à `users`.

Le formulaire newsletter du Kiosque n’affiche plus seulement une alerte locale : il appelle maintenant `/api/newsletter`, normalise l’adresse, empêche les doublons actifs et crée un token de confirmation. Le branchement du service d’envoi reste volontairement isolé tant que le fournisseur e-mail n’est pas choisi.

L’inscription ne marque plus automatiquement le compte comme vérifié. Elle crée un compte en attente, émet un token de confirmation et ne délivre pas de session. La route `/api/auth/verify-email` consomme le token pour activer un compte ou un abonné newsletter. En développement uniquement, l’URL de vérification peut être renvoyée pour faciliter les tests ; elle n’est pas renvoyée en production.

La connexion enregistre désormais les tentatives et applique le seuil initial de cinq échecs en quinze minutes, avec réponse HTTP 429 lorsque le seuil est dépassé. Les connexions réussies créent aussi un événement de session. La limitation dépend des tables partagées Supabase et non d’un compteur mémoire local.

Le prototype 2FA qui acceptait les codes `123456` et `000000` a été remplacé par un socle TOTP réel avec secret chiffré, URI d’authenticator et codes de récupération hachés à usage unique. Le challenge 2FA lors de la connexion et l’interface complète d’activation restent à finaliser dans l’incrément suivant avant de déclarer la 2FA complètement opérationnelle.

La build Next.js passe après ce lot. Commit réversible : `7d67c95` (`feat(security): add internal verification and newsletter foundations`).
