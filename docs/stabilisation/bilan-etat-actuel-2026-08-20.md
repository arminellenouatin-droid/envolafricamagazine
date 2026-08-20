# Bilan actuel de la réparation prudente — Envol Africa

**Date : 20 août 2026**  
**Périmètre : Crowdfunding, Supabase, Moneroo, Vercel et risques d’architecture financière**

## Conclusion générale

La réparation prudente a permis de stabiliser le **circuit financier principal du Crowdfunding** et de le mettre en production sur le domaine `https://envolafricamagazinealokpe.vercel.app`. Le projet n’est plus dans l’état bloquant observé au début : la campagne MagicAfrica peut être approuvée, publiée, affichée publiquement et alimentée par une contribution Moneroo reçue par webhook et enregistrée dans Supabase.

Toutefois, la validation n’est pas complète à 100 %. Le point le plus important restant est le **reversement**, notamment l’affichage et le calcul du brut, de la commission configurable de 4 % et du net. Ce contrôle n’a pas été confirmé depuis une session authentifiée du porteur. De même, l’audit d’idempotence doit être considéré comme implémenté dans le traitement central, mais un rejeu contrôlé de la même référence de paiement n’est pas documenté comme test final.

## Problèmes corrigés et vérifiés

| Problème initial | État actuel | Preuve ou constat |
|---|---|---|
| Campagnes Crowdfunding stockées dans un système JSON local non persistant | **Corrigé pour Crowdfunding** | Migration vers Supabase avec RLS et stockage privé. |
| File administrative vide ou non reliée à la bonne base | **Corrigé** | MagicAfrica est apparu dans la file administrative. |
| Bouton d’approbation non fonctionnel ou clic capturant toute la carte | **Corrigé** | Le projet MagicAfrica a été approuvé avec transition vers `en_cours`. |
| Campagne approuvée invisible publiquement | **Corrigé** | Le filtre incohérent `active` a été aligné sur `en_cours`; MagicAfrica est visible publiquement. |
| Contribution qui n’ouvrait pas correctement Moneroo | **Corrigé** | Le checkout Moneroo s’ouvre et affiche le montant ainsi que les moyens de paiement du pays. |
| Webhook configuré sur une URL inexistante (`/wzbhook`) | **Corrigé pour le déploiement stabilisé** | La route active est `/api/webhooks/moneroo`; le pattern central de webhook a été conservé. |
| Paiement accepté mais non enregistré dans Supabase | **Corrigé et vérifié** | Deux paiements MTN Mobile Money de 100 XOF ont été reçus et enregistrés pour MagicAfrica. |
| Totaux de collecte et nombre d’investisseurs non mis à jour | **Corrigé et vérifié** | Le dashboard affiche 200 XOF collectés et 2 investisseurs. |
| URL de retour Moneroo mal formée, DNS erroné ou déploiement pausé | **Corrigé côté configuration** | `NEXT_PUBLIC_BASE_URL` contenait encore `https://api.example.com`; elle a été remplacée par le domaine Production, puis un redéploiement a été créé. |
| Domaine Production inaccessible après correction | **Corrigé au niveau disponibilité** | Le contrôle externe de la page Production renvoie HTTP 200. |

## Problèmes corrigés mais nécessitant encore une validation finale

| Sujet | État | Ce qu’il reste à vérifier |
|---|---|---|
| Retour Moneroo après paiement | **À confirmer en ligne** | Effectuer un parcours réel depuis le domaine Production et confirmer que la page de retour est valide, sans DNS, 503 ou déploiement pausé. |
| Idempotence d’un même paiement | **Partiellement vérifié** | Vérifier qu’un rejeu du même identifiant Moneroo ne crée ni seconde contribution, ni second investisseur, ni double incrément de total. |
| Commission de 4 % sur le brut | **Non vérifié dans le dashboard** | Afficher le calcul sur les 200 XOF : brut 200 XOF, commission selon le taux configuré, net correspondant. Le calcul doit rester par type de projet si cette règle est activée. |
| Demande de reversement | **Non exécutée** | Vérifier les conditions, les documents requis, l’état de la demande et le montant net, sans nécessairement effectuer un transfert réel. |
| Session authentifiée du porteur | **Non confirmée dans le navigateur de diagnostic** | Le navigateur utilisé ne possédait pas la session Noélie/porteur et affichait « Connexion requise ». |
| API de détail du projet | **Probablement corrigée, contrôle direct recommandé** | Le dashboard Production affiche MagicAfrica, mais l’endpoint de détail qui avait renvoyé 404 doit être rejoué directement après le dernier redéploiement. |

## Problèmes non traités ou hors périmètre du lot financier

| Problème ou risque | État actuel | Niveau de risque |
|---|---|---:|
| Adaptateurs JSON locaux pour Awards et autres modules financiers | **Non migrés dans ce lot** | Élevé |
| Audit et alignement des paiements Magazine, WAB, Marketplace et Africa Awards | **À faire** | Élevé |
| Vérification de tous les secrets Moneroo entre Production et le dashboard Moneroo | **Présence confirmée, valeurs non relues** | Élevé |
| Ajout de Celtiis dans le catalogue local des moyens de paiement | **Non confirmé comme réalisé** | Moyen |
| Vérification globale des liens, boutons, SEO, performance, médias et parcours utilisateurs | **Non couverte par la validation financière actuelle** | Moyen à élevé |
| Validation complète de l’authentification partagée entre les plateformes | **Non revalidée dans ce lot** | Élevé |
| Notifications, messages, pages/groupes WAB et autres évolutions fonctionnelles | **Non revalidées dans ce lot** | Moyen à élevé |
| Protection, aperçu et comportement de tous les flipbooks Magazine | **Non revalidés dans ce lot** | Moyen |

## État des erreurs par gravité

| Niveau | État |
|---|---|
| **Bloquant corrigé** | Migration Crowdfunding, approbation administrative, visibilité publique, ouverture Moneroo, réception du webhook, mise à jour Supabase et disponibilité du domaine Production. |
| **Critique restant** | Reversement et commission; rejeu idempotent; validation du retour Moneroo depuis une session authentifiée; alignement des autres modules de paiement. |
| **Important non traité** | Migration des autres adaptateurs JSON, audit global des paiements, cohérence des secrets et tests inter-plateformes. |
| **Non critique pour la boucle financière** | Celtiis local, SEO, design, optimisation média et certaines demandes d’interface précédentes. |

## Recommandation de suite

La plateforme peut rester en ligne et poursuivre des tests contrôlés. Il ne faut toutefois pas déclarer la stabilisation financière finale avant quatre vérifications : premièrement, ouvrir le dashboard avec le compte porteur authentifié; deuxièmement, afficher le détail brut/commission/net; troisièmement, contrôler la demande de reversement sans exécuter le transfert; quatrièmement, vérifier le rejeu idempotent d’une référence Moneroo déjà traitée.

Après cette étape, le prochain lot doit traiter séparément les paiements Magazine, WAB, Marketplace et Africa Awards. Il ne faut pas remplacer brutalement tous les adaptateurs JSON : chaque module doit d’abord être comparé à son schéma Supabase, testé en environnement isolé, puis promu progressivement.

## Références internes

[1]: /home/ubuntu/eam-full/docs/stabilisation/todo-validation-noelie.md "Suivi de validation Noélie et Crowdfunding"
[2]: /home/ubuntu/eam-full/docs/stabilisation/lot-4-finance-audit.md "Audit financier du lot 4"
[3]: /home/ubuntu/eam-full/docs/stabilisation/preview-validation-notes.md "Notes de validation Preview"
