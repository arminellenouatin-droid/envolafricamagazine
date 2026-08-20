
## Vérification du catalogue Moneroo en direct

L’endpoint public `https://api.moneroo.io/utils/payment/methods` a été consulté et analysé. Pour le Bénin en XOF, Moneroo renvoie actuellement notamment :

| Nom Moneroo | Code | Activé | Gateways indiqués |
|---|---|---:|---|
| Visa / MasterCard XOF | `card_xof` | Oui | PayTech, Flutterwave, Kkiapay, PayDunya, Stripe, CinetPay, entre autres |
| Celtiis Benin | `celtiis_bj` | Oui | FedaPay, Kkiapay |
| Moov Money Benin | `moov_bj` | Oui | Plusieurs gateways, dont FedaPay, Kkiapay, PayTech, etc. |
| MTN MoMo Benin | `mtn_bj` | Oui | Plusieurs gateways, dont FedaPay, Kkiapay, PayTech, etc. |

Le fichier local `src/lib/payment-methods.ts` ne contient que `card_xof`, `mtn_bj` et `moov_bj`, et ne contient pas `celtiis_bj`. Il s’agit donc bien d’un catalogue local incomplet.

Cependant, `src/lib/moneroo.ts` importe `getMonerooMethodCodes` mais l’appel à Moneroo n’envoie pas `methods` par défaut. Le checkout Crowdfunding laisse donc actuellement Moneroo proposer ses méthodes disponibles. Le catalogue local peut affecter l’affichage ou d’autres modules, mais il ne semble pas forcer directement les trois méthodes du checkout Crowdfunding. Il faut encore rechercher les composants qui construisent l’interface de sélection et vérifier la configuration Moneroo du dashboard.

## Intégration standard et retour après paiement

La documentation Moneroo confirme que le flux standard consiste à initialiser le paiement côté serveur, rediriger vers `data.checkout_url`, puis recevoir une redirection vers `return_url` avec le statut, le `paymentId` et le `paymentStatus`. Moneroo envoie également un webhook si celui-ci est activé, y compris pour chaque tentative échouée.

Le champ `methods` est facultatif. S’il est absent, tous les moyens de paiement disponibles sont autorisés. S’il est fourni, il doit contenir uniquement les shortcodes supportés. Le champ `restrict_country_code` permet de limiter le pays, tandis que `restricted_phone` permet de limiter un numéro ; ces deux options sont mutuellement exclusives.

Source : https://docs.moneroo.io/payments/standard-integration

## Conséquence pour Envol Africa

Le code Crowdfunding fournit `amount`, `currency`, `description`, `customer`, `return_url` et `metadata`, mais ne fournit pas `methods` ni `restrict_country_code`. Cela explique pourquoi Moneroo propose sa propre liste de moyens et non une liste imposée par l’application. La carte bancaire et Celtiis ne sont donc pas forcés ou supprimés par la route Crowdfunding actuelle.

Le catalogue local est néanmoins incomplet puisqu’il oublie `celtiis_bj`. Il doit être corrigé pour les éventuels écrans internes qui l’utilisent, mais ce changement ne suffira pas à modifier la liste affichée par le checkout tant que `methods` reste absent.
