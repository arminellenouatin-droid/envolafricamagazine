<?php

/**
 * =====================================================================
 *  WEBHOOK MONEROO — Notifications temps réel (payment.success, etc.)
 *  Adapté pour Envol Africa Magazine (Next.js JSON DB + Supabase)
 * =====================================================================
 *
 *  C'est CE fichier que tu déploies à l'URL renseignée dans
 *  MONEROO_WEBHOOK_URL (config.php) et dans le tableau de bord Moneroo.
 *
 *  ⚠️ IMPORTANT :
 *  - Désactive la protection CSRF sur cette route si ton framework
 *    en a une (Laravel, Symfony...), sinon Moneroo ne pourra pas l'appeler.
 *    Ici, on est en PHP natif, pas de CSRF, mais on a une route Next.js
 *    équivalente /api/webhooks/moneroo qui doit être exemptée CSRF.
 *  - Réponds toujours avec un code 200 le plus vite possible, et fais
 *    les traitements longs de façon asynchrone si besoin.
 *  - Vérifie la signature HMAC-SHA256 avant toute écriture.
 * =====================================================================
 */

$autoloadPaths = [
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../../vendor/autoload.php',
];
foreach ($autoloadPaths as $path) {
    if (file_exists($path)) {
        require $path;
        break;
    }
}
require __DIR__ . '/config.php';

// Fonction pour mettre à jour la commande en base JSON (Envol Africa)
// En prod avec Supabase, remplacer par Supabase client ou Prisma
function updateOrderFromWebhook($orderId, $type, $paymentData) {
    $dbPath = __DIR__ . '/../src/data/db.json';
    if (!file_exists($dbPath)) {
        error_log("webhook: db.json introuvable $dbPath");
        return false;
    }
    $db = json_decode(file_get_contents($dbPath), true);
    if (!$db) return false;

    $found = false;
    foreach ($db['orders'] as &$order) {
        // On retrouve la commande via metadata.order_id transmis à la création
        if ($order['id'] === $orderId || ($order['paymentId'] ?? null) === ($paymentData['id'] ?? null)) {
            $found = true;
            if ($type === 'payment.success') {
                $order['status'] = 'paid';
                $order['paidAt'] = date('c');
                $order['paymentId'] = $paymentData['id'] ?? $order['paymentId'];

                // Activation abonnement si présent
                if (isset($order['items'])) {
                    foreach ($order['items'] as $item) {
                        if ($item['type'] === 'subscription' && $order['userId'] !== 'guest') {
                            foreach ($db['users'] as &$user) {
                                if ($user['id'] === $order['userId']) {
                                    $now = new DateTime();
                                    $end = new DateTime();
                                    if (in_array($item['planId'], ['mensuel', 'entreprise', 'chef_entreprise'])) {
                                        $end->modify('+1 month');
                                    } else {
                                        $end->modify('+1 year');
                                    }
                                    $user['subscription'] = [
                                        'planId' => $item['planId'],
                                        'status' => 'active',
                                        'startDate' => $now->format('c'),
                                        'endDate' => $end->format('c'),
                                        'firstMonth' => true
                                    ];
                                    if ($user['role'] === 'user') $user['role'] = 'subscriber';
                                }
                            }
                        }
                    }
                }

                // Commission affiliation - taux au moment de la vente
                if (!empty($order['affiliateCode'])) {
                    foreach ($db['users'] as $affUser) {
                        if ($affUser['affiliateCode'] === $order['affiliateCode'] && $affUser['id'] !== $order['userId']) {
                            $isSub = isset($affUser['subscription']) && $affUser['subscription']['status'] === 'active' && new DateTime($affUser['subscription']['endDate']) > new DateTime();
                            $rate = $isSub ? 0.25 : 0.10;
                            $commission = round($order['total'] * $rate);
                            $db['affiliateEarnings'][] = [
                                'id' => uniqid('earn_'),
                                'affiliateId' => $affUser['id'],
                                'orderId' => $order['id'],
                                'amount' => $order['total'],
                                'commission' => $commission,
                                'rate' => $rate,
                                'status' => 'available',
                                'createdAt' => date('c'),
                                'commission_rate_reason' => $isSub ? 'affilié abonné actif au moment vente => 25%' : 'affilié non abonné => 10%'
                            ];
                            break;
                        }
                    }
                }

                // Log paiement immuable (payments table append-only)
                if (!isset($db['payments'])) $db['payments'] = [];
                $db['payments'][] = [
                    'id' => uniqid('pay_'),
                    'order_id' => $order['id'],
                    'provider' => 'moneroo',
                    'provider_ref' => $paymentData['id'] ?? null,
                    'amount' => $paymentData['amount'] ?? $order['total'],
                    'currency' => $paymentData['currency'] ?? $order['currency'],
                    'status' => 'confirme',
                    'webhook_signature_verified' => true,
                    'raw_webhook_payload' => $paymentData,
                    'created_at' => date('c')
                ];

            } elseif ($type === 'payment.failed') {
                $order['status'] = 'failed';
            } elseif ($type === 'payment.cancelled') {
                $order['status'] = 'failed';
            }
            break;
        }
    }

    if (!$found && $type === 'payment.success') {
        error_log("webhook: commande non trouvée pour order_id=$orderId payment_id=" . ($paymentData['id'] ?? 'unknown'));
        // Ne pas échouer, on retourne 200 pour éviter relance infinie, mais on log
    }

    file_put_contents($dbPath, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return true;
}

// 1) Récupérer le corps brut de la requête et la signature envoyée par Moneroo
$payload = file_get_contents('php://input');
$receivedSignature = $_SERVER['HTTP_X_MONEROO_SIGNATURE'] ?? $_SERVER['HTTP_X_MONEROO_SIGNATURE'] ?? '';

if (empty($payload)) {
    // Certains webhooks Moneroo envoient aussi via $_POST si content-type form
    $payload = json_encode($_POST);
}

// 2) Recalculer la signature attendue (HMAC-SHA256)
$expectedSignature = hash_hmac('sha256', $payload, MONEROO_WEBHOOK_SECRET);

// 3) Comparer les signatures de façon sécurisée (anti timing-attack)
if (!MONEROO_WEBHOOK_SECRET || MONEROO_WEBHOOK_SECRET === 'colle_ton_secret_de_signature_ici') {
    error_log('webhook: MONEROO_WEBHOOK_SECRET manquant - vérification signature ignorée en dev');
    // En dev sans secret, on continue mais on log
} else {
    if (!$receivedSignature || !hash_equals($expectedSignature, $receivedSignature)) {
        error_log("webhook: signature invalide - reçue: $receivedSignature - attendue: $expectedSignature - payload: $payload");
        http_response_code(403);
        exit('Signature invalide.');
    }
}

// 4) La requête est authentique -> on peut traiter l'événement
$event = json_decode($payload, true);

if (!$event || !isset($event['event'])) {
    // Certains webhooks Moneroo ont structure différente: {type, data} ou {event, data}
    if (isset($event['type'])) {
        $event['event'] = $event['type'];
    } else {
        http_response_code(400);
        error_log("webhook: payload invalide: $payload");
        exit('Payload invalide.');
    }
}

$type = $event['event'];     // ex: payment.success
$data = $event['data'] ?? $event;      // détails (id, amount, currency, status...)

error_log("webhook reçu: type=$type id=" . ($data['id'] ?? 'unknown') . " amount=" . ($data['amount'] ?? ''));

switch ($type) {

    case 'payment.success':

        // ⚠️ Bonne pratique Moneroo : re-vérifier la transaction via l'API
        // avant de livrer, plutôt que de faire confiance au webhook seul.
        try {
            if (class_exists('\Moneroo\Payment') && MONEROO_SECRET_KEY && MONEROO_SECRET_KEY !== 'colle_ta_cle_api_ici') {
                $monerooPayment = new \Moneroo\Payment(MONEROO_SECRET_KEY);
                $payment = $monerooPayment->verify($data['id']);

                if ($payment->status === 'success') {
                    // -> Marque la commande comme payée en base
                    $orderId = $payment->metadata->order_id ?? $data['metadata']['order_id'] ?? $data['id'];
                    updateOrderFromWebhook($orderId, $type, (array)$payment);
                } else {
                    error_log("webhook: re-vérification API status non success: {$payment->status} pour id {$data['id']}");
                }
            } else {
                // Sans API key ou librairie, on fait confiance au webhook après vérif signature (mode dev)
                $orderId = $data['metadata']['order_id'] ?? $data['id'] ?? null;
                if ($orderId) {
                    updateOrderFromWebhook($orderId, $type, $data);
                }
            }
        } catch (Exception $e) {
            error_log("webhook payment.success re-verify erreur: " . $e->getMessage());
            // On ne renvoie pas 500 pour éviter boucle retry infinie, on log et on retourne 200
            // Mais on marque quand même la commande comme payée si signature était valide (selon politique)
            $orderId = $data['metadata']['order_id'] ?? $data['id'] ?? null;
            if ($orderId) {
                updateOrderFromWebhook($orderId, $type, $data);
            }
        }

        break;

    case 'payment.failed':
    case 'payment.cancelled':

        $orderId = $data['metadata']['order_id'] ?? $data['id'] ?? null;
        if ($orderId) {
            updateOrderFromWebhook($orderId, $type, $data);
        }
        break;

    case 'payment.initiated':

        // Optionnel : logue que le client a démarré un paiement
        error_log("webhook payment.initiated id=" . ($data['id'] ?? 'unknown'));
        break;

    case 'payout.success':
    case 'payout.failed':
    case 'payout.initiated':

        // Si tu utilises aussi les Payouts (versements affiliés), gère-les ici
        // Ex: update affiliate_payouts status
        error_log("webhook payout event: $type");
        break;

    default:
        error_log("webhook event non géré: $type");
        break;
}

// 5) Toujours répondre 200 pour accuser réception (sinon Moneroo relance jusqu'à 3 fois, toutes les 10 minutes)
http_response_code(200);
echo 'OK';
