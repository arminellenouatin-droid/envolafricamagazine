# Comparaison Api-moneroo-current / EAM

Dépôt examiné en lecture seule : https://github.com/leooffed/Api-moneroo-current

## Constats du dépôt de référence

Le dépôt contient un exemple minimal Axios qui appelle `POST https://api.moneroo.io/v1/payments/initialize` avec un header `Authorization: Bearer MONEROO_API_KEY`, `Content-Type: application/json` et `Accept: application/json`. Le payload comprend `amount`, `currency`, `description`, `customer.email`, `customer.first_name`, `customer.last_name`, `return_url` et `metadata`.

Il ne force ni `methods` ni `restrict_country_code`, et ne contient pas de webhook ni de logique de vérification. Il imprime malheureusement la clé API dans la console à la ligne 5 ; cette pratique ne doit pas être reproduite.

## Comparaison avec EAM

EAM utilise le même endpoint, le même Bearer token et les mêmes champs fondamentaux, avec en plus l’attachement de la commande, le retour vers le panier et la vérification serveur. Après le correctif `4305895`, EAM ne transmet plus `methods`, ne transmet plus `restrict_country_code` et ne transmet plus le pays client dans le payload Moneroo. Le téléphone client reste transmis s’il est disponible.

Cette comparaison confirme que le dépôt de référence ne révèle pas de paramètre manquant qui expliquerait l’échec Moov. Le flux automatique Moneroo est désormais aligné : Moneroo détecte le pays et décide des méthodes/agrégateurs disponibles. Les échecs MTN/Moov observés après création de la transaction doivent donc être diagnostiqués au niveau de la capture et de la passerelle choisie, pas par une méthode imposée par EAM.

## Risque identifié dans le dépôt de référence

La ligne `console.log("MONEROO KEY:", process.env.MONEROO_API_KEY)` expose une clé secrète dans les logs. Elle est absente du code EAM et ne doit pas être copiée.
