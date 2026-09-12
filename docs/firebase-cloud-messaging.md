# Firebase Cloud Messaging pour Envol Africa

Cette intégration active les notifications Chrome pour les utilisateurs **connectés** qui ont explicitement donné leur consentement. Le navigateur enregistre un Firebase Installation ID (FID), l’API l’associe au compte Envol Africa dans Supabase, puis Firebase Admin envoie les notifications en arrière-plan.

## État de la configuration

La configuration publique Firebase et la clé Web Push sont intégrées au client. La migration Supabase `20260912_firebase_messaging.sql` ajoute les champs `provider` et `fcm_fid` à `push_subscriptions`.

L’envoi serveur reste volontairement désactivé tant qu’un compte de service Firebase n’est pas fourni à l’environnement Vercel. La session Google vérifiée le 12 septembre 2026 n’avait pas accès au projet Firebase `envolafrica-8d361`; aucune clé privée n’a donc été créée ni copiée.

## Variable Vercel requise

Dans Firebase Console, avec un compte autorisé sur `envolafrica-8d361`, ouvrez **Paramètres du projet > Comptes de service > Générer une nouvelle clé privée**. Encodez le fichier JSON en base64 et ajoutez sa valeur à Vercel sous le nom suivant :

```text
FIREBASE_SERVICE_ACCOUNT_JSON_BASE64
```

Cette variable doit être définie pour les environnements **Production**, **Preview** et **Development** concernés. Ne placez jamais le JSON ou sa clé privée dans Git.

Le compte de service doit obligatoirement appartenir au même projet `envolafrica-8d361` que la configuration Firebase publique du navigateur.

L’application accepte aussi les trois variables séparées `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` et `FIREBASE_PRIVATE_KEY`, mais la variable JSON encodée en base64 est recommandée sur Vercel.

Vérifiez également que l’API **Firebase Cloud Messaging HTTP v1** est activée dans le projet.

## Parcours utilisateur

Le bandeau de consentement apparaît uniquement pour une personne connectée et lorsque Chrome n’a pas encore reçu de décision. Un refus n’est jamais contourné. Le choix « Plus tard » repousse le bandeau pendant sept jours. Après consentement, l’appareil est lié au compte et les notifications reçues ouvrent directement l’article, le magazine ou l’action concernée.

## Aperçus de partage

Les pages d’article, de produit Marketplace et de magazine génèrent des métadonnées Open Graph et Twitter dynamiques : titre, résumé, image principale et, lorsqu’elle existe, vidéo Open Graph. Toutes les autres pages bénéficient de l’aperçu global Envol Africa.

## Références officielles

- [Démarrer avec FCM Web](https://firebase.google.com/docs/cloud-messaging/web/get-started)
- [Recevoir des messages Web](https://firebase.google.com/docs/cloud-messaging/web/receive-messages)
- [Envoyer avec Firebase Admin](https://firebase.google.com/docs/cloud-messaging/send/admin-sdk)
