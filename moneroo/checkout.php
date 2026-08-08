<?php

/**
 * =====================================================================
 *  CHECKOUT — Initialise un paiement et redirige le client vers Moneroo
 *  Adapté pour Envol Africa Magazine (Next.js + JSON DB + Supabase)
 * =====================================================================
 *
 * INSTALLATION (une seule fois) :
 *      composer require moneroo/moneroo-php
 *
 * Ce fichier supporte :
 * - POST classique depuis formulaire HTML (panier, commande, abonnement)
 * - JSON via fetch/AJAX si site en SPA (Next.js)
 */

$autoloadPaths = [
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../../vendor/autoload.php',
    __DIR__ . '/../../../vendor/autoload.php',
];
$autoloadFound = false;
foreach ($autoloadPaths as $path) {
    if (file_exists($path)) {
        require $path;
        $autoloadFound = true;
        break;
    }
}
if (!$autoloadFound) {
    // Si vendor/autoload.php n'existe pas, on continue en mode mock pour ne pas casser le site
    // En prod, assure-toi que composer install a été exécuté
    error_log('vendor/autoload.php introuvable - vérifie composer install');
}

require __DIR__ . '/config.php';

// Support à la fois $_POST classique et JSON (fetch)
$input = $_POST;
if (empty($input)) {
    $jsonInput = file_get_contents('php://input');
    $decoded = json_decode($jsonInput, true);
    if (is_array($decoded)) {
        $input = $decoded;
    }
}

try {
    // Validation basique des champs requis §3 + §4.2 + §9.2 Zod
    $required = ['amount', 'email', 'first_name', 'last_name'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new InvalidArgumentException("Champ requis manquant: $field");
        }
    }

    $amount = (int) $input['amount']; // ex: 5000 XOF
    $currency = $input['currency'] ?? 'XOF';
    $email = $input['email'];
    $firstName = $input['first_name'];
    $lastName = $input['last_name'];
    $orderId = $input['order_id'] ?? $input['metadata']['order_id'] ?? uniqid('order_');

    // Détection langue/devise si fournie par le site
    $phone = $input['phone'] ?? $input['customer']['phone'] ?? null;
    $address = $input['address'] ?? $input['customer']['address'] ?? null;
    $city = $input['city'] ?? $input['customer']['city'] ?? 'Cotonou';
    $country = $input['country'] ?? $input['customer']['country'] ?? 'BJ';
    $description = $input['description'] ?? 'Paiement Envol Africa Magazine';

    // URL de retour réelle - utilise MONEROO_RETURN_URL + order_id pour retrouver la commande
    $returnUrl = MONEROO_RETURN_URL;
    // On ajoute order_id en query pour pouvoir le retrouver dans merci.php
    $returnUrl .= (strpos($returnUrl, '?') === false ? '?' : '&') . 'order_id=' . urlencode($orderId);

    // Si NEXT_PUBLIC_BASE_URL est défini, on peut aussi rediriger vers /panier?order_id=xxx&verify=1 (logique Next.js)
    $nextBase = getenv('NEXT_PUBLIC_BASE_URL');
    if ($nextBase) {
        // On garde merci.php pour compatibilité PHP, mais on prévoit aussi le flux Next.js
        // Le merci.php fera un verify et pourra rediriger vers /panier si besoin
    }

    $paymentData = [
        'amount'      => $amount,
        'currency'    => $currency,
        'description' => $description,
        'return_url'  => $returnUrl,
        'customer' => [
            'email'      => $email,
            'first_name' => $firstName,
            'last_name'  => $lastName,
            'phone'      => $phone,
            'address'    => $address,
            'city'       => $city,
            'country'    => $country,
        ],
        // Données que tu veux retrouver plus tard (ID commande interne)
        'metadata' => [
            'order_id' => $orderId,
            'site' => 'envolafrica',
            'user_email' => $email,
        ],
        // Limite les moyens de paiement proposés (Mobile Money + Carte, marché africain)
        'methods' => ['card', 'mtn_bj', 'orange_bj', 'moov_bj', 'mtn_ci', 'orange_ci', 'wave', 'mtn', 'orange_sn'],
    ];

    // Si MONEROO_SECRET_KEY manquant ou mock, on redirige en mode mock pour ne pas casser le dev
    if (!MONEROO_SECRET_KEY || MONEROO_SECRET_KEY === 'colle_ta_cle_api_ici' || empty(MONEROO_SECRET_KEY)) {
        header('Location: ' . $returnUrl . '&mock_success=1&transaction_id=mock_' . $orderId);
        exit;
    }

    if (!class_exists('\Moneroo\Payment')) {
        throw new Exception('Librairie Moneroo non installée - exécute composer require moneroo/moneroo-php');
    }

    $monerooPayment = new \Moneroo\Payment(MONEROO_SECRET_KEY);
    $payment = $monerooPayment->init($paymentData);

    // Log pour debug (ne jamais logger la clé secrète)
    error_log("Moneroo checkout créé: order_id=$orderId amount=$amount $currency email=$email checkout_url={$payment->checkout_url}");

    // Redirection vers la page de paiement Moneroo
    header('Location: ' . $payment->checkout_url);
    exit;

} catch (\Moneroo\Exceptions\InvalidPayloadException $e) {
    http_response_code(400);
    error_log('Moneroo InvalidPayload: ' . $e->getMessage());
    // En mode SPA (Next.js), renvoyer JSON
    if (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false || !empty($input['is_ajax'])) {
        header('Content-Type: application/json');
        echo json_encode(['error' => ['code' => 'INVALID_PAYLOAD', 'message' => 'Données de paiement invalides: ' . $e->getMessage()]]);
    } else {
        echo 'Données de paiement invalides : ' . htmlspecialchars($e->getMessage());
    }
} catch (\Exception $e) {
    http_response_code(500);
    error_log('Moneroo checkout erreur: ' . $e->getMessage());
    if (strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false || !empty($input['is_ajax'])) {
        header('Content-Type: application/json');
        echo json_encode(['error' => ['code' => 'PAYMENT_ERROR', 'message' => $e->getMessage()]]);
    } else {
        echo 'Erreur lors de la création du paiement : ' . htmlspecialchars($e->getMessage());
    }
}
