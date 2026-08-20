# Vérification locale et affichage monétaire — 20 août 2026

La build Next.js locale sur le port 3100 répond avec HTTP 200 pour `/api/locale/rates`, `/kiosque`, `/abonnement`, `/don`, `/panier` et `/africa-awards`. L’API de taux renvoie XOF comme base et un taux USD réel dans la réponse testée.

Sur `/abonnement`, la préférence par défaut Bénin/XOF affiche les prix en F CFA. Après simulation contrôlée d’une préférence visiteur États-Unis/USD via l’événement `ea-locale-updated`, les mêmes montants source sont affichés en dollars : 2 000 XOF devient 3,55 USD, 42 000 XOF devient 74,59 USD, et 5 000 XOF devient 8,88 USD. Le panier et les boutons de paiement restent reliés au flux source XOF ; l’API de paiement force maintenant XOF côté serveur afin que la devise d’affichage ne puisse pas modifier le montant métier envoyé à Moneroo.

La vérification a été réalisée uniquement sur la build locale et n’implique aucun paiement ni modification de données de production.


Le mode sombre a été activé pendant la vérification. La page applique bien la classe sombre, mais un popup de découverte automatique s’est affiché au-dessus de l’abonnement et masque une partie des cartes ; il doit être fermé avant de juger le contraste complet. Une correction CSS ciblée a été ajoutée pour les textes hérités de l’ancienne palette de l’abonnement, notamment les couleurs navy et zinc explicites.


Le contrôle DOM a d’abord montré l’ancien HTML sans `subscription-page`, alors que le serveur local et le fichier source contenaient bien ce wrapper. Le HTML servi directement par curl contient désormais `subscription-page`; le navigateur doit être rafraîchi pour recharger cette build et éviter de conclure sur un cache de page précédent.
