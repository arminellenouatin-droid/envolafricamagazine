# Constats de documentation Moneroo — diagnostic kiosque

Sources consultées le 17 août 2026 :

- https://docs.moneroo.io/introduction/authentication
- https://docs.moneroo.io/introduction/webhooks
- https://docs.moneroo.io/

## Exigences observées

L’API Moneroo exige un header `Authorization: Bearer SECRET_KEY` côté serveur. Les clés publiques ne servent qu’à initier des transactions depuis l’interface ou les SDK ; les clés secrètes doivent rester côté serveur.

Les webhooks Moneroo transmettent notamment `event` et `data.id`, puis l’application doit reconsulter l’API Moneroo pour obtenir le statut complet. Les événements de paiement documentés sont `payment.initiated`, `payment.success`, `payment.failed` et `payment.cancelled`.

Le webhook doit répondre HTTP 200 rapidement. Les signatures sont envoyées dans `X-Moneroo-Signature` et doivent être vérifiées avec HMAC-SHA256 sur le corps brut de la requête, avec le secret de webhook. Une réponse autre que 200 déclenche des tentatives de renvoi.

Les paiements ne doivent pas dépendre uniquement du webhook : une stratégie de repli doit reconsulter le statut. Les traitements doivent être idempotents et accepter les doublons.

## Hypothèses de diagnostic à vérifier dans EAM

1. Contrôler que l’URL d’API, le header Bearer et les noms de champs utilisés par `/api/payment/init` correspondent à la version actuelle de Moneroo.
2. Contrôler que le `return_url` et le webhook public utilisés par le kiosque sont ceux du projet Gildas et non ceux d’un ancien projet Vercel.
3. Contrôler que la route webhook vérifie le corps brut pour HMAC et répond dans les délais.
4. Contrôler que le montant envoyé correspond au montant réel affiché, que la devise est XOF et que les champs client sont valides.
5. Contrôler la cohérence entre le statut de la transaction `py_ibi4k9l4p2ce`, le paiement local et la réponse de l’API Moneroo, sans relancer de paiement réel sans confirmation explicite.

## Résultat de la transaction signalée

La transaction `py_ibi4k9l4p2ce` a été consultée via l’API Moneroo avec la clé locale, sans afficher la clé. Moneroo répond HTTP 200 mais la transaction est finale `failed`, pour 20 000 XOF. Les détails de capture indiquent la méthode `MTN MoMo Benin` (`mtn_bj`), la passerelle `FeexPay` (`feexpay`), et le message de méthode `TEMPORARILY_UNAVAILABLE unavailable. Please redirect`. La passerelle retourne `Unknown error` sans code détaillé. Cela prouve que l’échec de cette transaction est au niveau du fournisseur/gateway MTN via FeexPay, après création correcte de la transaction, et non une erreur HTTP d’initialisation EAM.

La liste Moneroo consultée expose bien `celtiis_bj`, `moov_bj` et `mtn_bj` en XOF pour le Bénin. La documentation d’intégration standard précise que `methods` est optionnel et que son omission laisse toutes les méthodes disponibles ; elle documente aussi `restrict_country_code` pour restreindre le pays. La documentation de vérification précise que les statuts `failed` et `cancelled` sont finaux et qu’un paiement ne doit être crédité que si le statut est `success`.

Sources supplémentaires :
- https://docs.moneroo.io/payments/standard-integration
- https://docs.moneroo.io/payments/available-methods
- https://docs.moneroo.io/payments/status
- https://docs.moneroo.io/payments/transaction-verification
