# Intégration Moneroo - Envol Africa Magazine

Ce dossier contient l'intégration Moneroo **compatible Next.js (Vercel) + PHP natif**.

## Fichiers

- `config.php` - Configuration sécurisée via `.env` (MONEROO_API_KEY, WEBHOOK_URL, WEBHOOK_SECRET)
- `checkout.php` - Initialise paiement et redirige vers Moneroo (support POST form + JSON fetch)
- `merci.php` - Page retour client `return_url` avec vérification API + mise à jour commande
- `webhook.php` - Webhook HMAC-SHA256 vérification + re-vérification API + update commande + commission affiliation + log paiement immuable

## Installation PHP (si hébergement PHP)

```bash
composer require moneroo/moneroo-php vlucas/phpdotenv
# Vérifie vendor/autoload.php existe
```

`.env` exemple (ne jamais committer):
```
MONEROO_API_KEY=pvk_4lf37v|01KZ7F2SRWWFQ70JCRASB8YHEC
MONEROO_SECRET_KEY=pvk_4lf37v|01KZ7F2SRWWFQ70JCRASB8YHEC
MONEROO_WEBHOOK_URL=https://envolafricamag.com/moneroo/webhook.php
MONEROO_WEBHOOK_SECRET=whsec_ton_secret
NEXT_PUBLIC_BASE_URL=https://envolafricamag.com
```

## Installation Next.js (Vercel) - Recommandé pour ce projet

Ce projet est en **Next.js 16.3**, pas PHP. Les fichiers PHP ci-dessus sont fournis pour référence et pour hébergement PHP alternatif, mais **l'intégration principale est en Next.js** :

- `src/lib/moneroo.ts` - `initMonerooPayment()` + `verifyMonerooPayment()` (équivalent PHP)
- `src/app/api/payment/init/route.ts` - Équivalent `checkout.php` (crée order + init Moneroo + renvoie checkout_url)
- `src/app/api/webhooks/moneroo/route.ts` - Équivalent `webhook.php` (vérifie HMAC-SHA256 + re-vérifie API + update order + commission affiliation + log paiement)
- `src/app/moneroo/merci/page.tsx` + `moneroo/merci.php` - Page retour client avec vérification
- `src/app/panier/page.tsx` - Formulaire existant qui déclenche paiement (action vers /api/payment/init)

**Champs transmis:** `amount`, `currency`, `email`, `first_name`, `last_name`, `phone`, `metadata.order_id`

## Brancher formulaire existant

### Next.js (actuel)
Dans `src/app/panier/page.tsx`:
```ts
fetch("/api/payment/init", {
  method: "POST",
  body: JSON.stringify({
    items: cart,
    currency: "XOF",
    email, firstName, lastName,
    affiliateCode: localStorage.getItem("eam_affiliate"),
    shippingCountry: country
  })
})
.then(r=>r.json())
.then(data=> window.location.href = data.checkout_url)
```

### PHP classique
Dans ton formulaire HTML:
```html
<form action="/moneroo/checkout.php" method="POST">
  <input type="hidden" name="amount" value="5000">
  <input type="hidden" name="currency" value="XOF">
  <input type="hidden" name="email" value="client@example.com">
  <input type="hidden" name="first_name" value="John">
  <input type="hidden" name="last_name" value="Doe">
  <input type="hidden" name="order_id" value="order_123">
  <button type="submit">Payer avec Moneroo</button>
</form>
```

Ou en JSON fetch:
```js
fetch("/moneroo/checkout.php", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ amount: 5000, currency: "XOF", email: "...", first_name: "John", last_name: "Doe", order_id: "order_123", is_ajax: true })
})
```

## Configurer return_url

Dans `config.php`:
```php
define('MONEROO_RETURN_URL', getenv('NEXT_PUBLIC_BASE_URL') . '/moneroo/merci.php');
```
Ou en Next.js dans `lib/moneroo.ts`:
```ts
return_url: `${baseUrl}/panier?order_id=${orderId}&verify=1`
// ou
return_url: `${baseUrl}/moneroo/merci?order_id=${orderId}&transaction_id={CHECKOUT_ID}`
```

Remplace `https://tonsite.com` par ton domaine prod réel (ex: `https://envolafricamag.com` ou `https://ton-projet.vercel.app`).

## Configurer webhook côté Moneroo

1. Dashboard Moneroo > Développeurs > Webhooks
2. URL publique: `https://ton-domaine.com/moneroo/webhook.php` **ou** `https://ton-domaine.com/api/webhooks/moneroo` (Next.js)
3. Active les événements: `payment.success`, `payment.failed`, `payment.cancelled`, `payment.initiated` (optionnel), `payout.*` si tu utilises payouts
4. Copie le **Webhook Secret** et mets-le dans `.env`: `MONEROO_WEBHOOK_SECRET=whsec_...`
5. Si framework avec CSRF (Laravel/Symfony), exempte cette route: dans `VerifyCsrfToken` ajoute `moneroo/webhook.php` et `api/webhooks/moneroo` à `$except`

Vérifie que route est accessible en **HTTPS** et sans auth (Moneroo ne peut pas se connecter avec auth).

## Relier webhook et merci.php à logique métier

Dans `webhook.php` sections marquées `// -> ...`:

- Retrouve commande interne via `metadata.order_id` (transmis à la création)
- Mets à jour statut dans base: `orders` table (ou `src/data/db.json` pour JSON, ou Supabase `orders` table)
  - `payment.success` → `status=paid`, `paidAt=now()`, active abonnement si `items` contient `subscription`, calcule commission affiliation 10%/25% au moment vente, log paiement immuable
  - `payment.failed` / `payment.cancelled` → `status=failed`
- Déclenche actions: activation service, email confirmation (Resend), génération facture, etc.

Même logique dans `merci.php` si webhook n'a pas déjà fait le travail (vérifie avant d'écrire).

**Exemple avec notre JSON DB:**
```php
function updateOrderStatus($orderId, $status, $paymentId) {
  $db = json_decode(file_get_contents(__DIR__ . '/../src/data/db.json'), true);
  foreach ($db['orders'] as &$order) {
    if ($order['id'] === $orderId) {
      $order['status'] = $status;
      // ... activation abonnement, commission, etc.
    }
  }
  file_put_contents(__DIR__ . '/../src/data/db.json', json_encode($db, JSON_PRETTY_PRINT));
}
```

## Tester

1. Mode test/sandbox Moneroo si disponible (vérifie doc/dashboard)
2. Teste 3 chemins:
   - **Réussi**: carte test 4242... ou Mobile Money test, vérifie logs webhook reçoit event, signature validée (pas 403), commande passe en `payee` en base
   - **Échoué**: carte refusée, vérifie `payment.failed`
   - **Annulé**: client abandonne, vérifie `payment.cancelled`
3. Vérifie dans logs que webhook reçoit bien events et que signature est validée
4. Vérifie que commande passe bien au statut "payée" en base après success

**Test local avec ngrok:**
```bash
ngrok http 3000
# Mets l'URL ngrok https://xxxx.ngrok.io/moneroo/webhook.php dans dashboard Moneroo
# Lance un paiement test, vérifie ngrok logs + webhook logs
```

## Ne pas casser l'existant

- Moneroo s'ajoute comme option, ne remplace pas autres moyens de paiement
- Respecte conventions code, structure dossiers, style projet
- Pour Next.js: garde `/api/payment/*` existant + ajoute `/api/webhooks/moneroo` et `/moneroo/merci` page

## Sécurité

- `.env` dans `.gitignore`, jamais committer vraies clés
- `MONEROO_WEBHOOK_SECRET` utilisé uniquement pour HMAC-SHA256 vérification
- Aucune donnée CB ne transite/stockée par nos serveurs, PCI DSS déléguée à Moneroo
- Webhook vérifié par signature avant tout impact commande
- `merci.php` re-vérifie via API, ne fait pas confiance au seul retour client
- Journalisation immuable `payments` table append-only
