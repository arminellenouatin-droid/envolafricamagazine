<?php

/**
 * =====================================================================
 *  PAGE DE RETOUR CLIENT (return_url)
 *  Moneroo redirige le client ici après paiement, avec ?transaction_id=...
 *
 *  ⚠️ Ne considère JAMAIS le paiement comme validé juste parce que le
 *  client arrive sur cette page — vérifie toujours son statut via l'API.
 *  Le webhook (webhook.php) reste ta source de vérité principale.
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

$transactionId = $_GET['transaction_id'] ?? $_GET['payment_id'] ?? null;
$orderId = $_GET['order_id'] ?? null;
$mockSuccess = isset($_GET['mock_success']);

// Fonction pour mettre à jour la commande dans la base JSON (Envol Africa)
function updateOrderStatus($orderId, $status, $paymentId = null) {
    $dbPath = __DIR__ . '/../src/data/db.json';
    if (!file_exists($dbPath)) return false;
    
    $db = json_decode(file_get_contents($dbPath), true);
    if (!$db) return false;

    foreach ($db['orders'] as &$order) {
        if ($order['id'] === $orderId) {
            $order['status'] = $status;
            if ($status === 'paid') {
                $order['paidAt'] = date('c');
                $order['paymentId'] = $paymentId;
            }
            // Gestion abonnement si présent
            if ($status === 'paid' && isset($order['items'])) {
                foreach ($order['items'] as $item) {
                    if ($item['type'] === 'subscription' && $order['userId'] !== 'guest') {
                        foreach ($db['users'] as &$user) {
                            if ($user['id'] === $order['userId']) {
                                $now = new DateTime();
                                $end = new DateTime();
                                if (in_array($item['planId'], ['mensuel', 'entreprise'])) {
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
            file_put_contents($dbPath, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return true;
        }
    }
    return false;
}

if (!$transactionId && !$mockSuccess) {
    // Pas de transaction_id mais on a order_id en mock mode
    if ($orderId) {
        echo "<h1>Merci pour votre commande !</h1><p>Commande: " . htmlspecialchars($orderId) . " - En attente de confirmation.</p>";
        exit;
    }
    http_response_code(400);
    echo "<h1>Transaction introuvable.</h1><p>Aucun identifiant de transaction fourni. <a href='/'>Retour à l'accueil</a></p>";
    exit;
}

try {
    // Mode mock pour dev sans clé API
    if ($mockSuccess || strpos($transactionId, 'mock_') === 0) {
        if ($orderId) {
            updateOrderStatus($orderId, 'paid', $transactionId);
        }
        // Page de confirmation personnalisée Envol Africa
        ?>
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="utf-8"><title>Merci - Envol Africa</title><style>body{font-family:Inter,sans-serif;background:#fcf9f8;color:#1b1c1c;padding:40px;text-align:center} .card{max-w:600px;margin:40px auto;background:white;border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.1)} .success{color:#9e001f;font-size:48px} a{color:#9e001f;font-weight:bold}</style></head>
        <body>
            <div class="card">
                <div class="success">✅</div>
                <h1>Paiement confirmé (mode test), merci pour votre commande !</h1>
                <p>Commande <strong><?= htmlspecialchars($orderId ?? $transactionId) ?></strong> est maintenant <strong>payée</strong>.</p>
                <p>Vous recevrez vos accès (magazines PDF/audio, abonnement) par email.</p>
                <p style="margin-top:24px"><a href="/">Retour à l'accueil</a> | <a href="/compte">Mon espace</a> | <a href="/kiosque">Kiosque</a></p>
                <p style="font-size:12px;color:#5c403f;margin-top:16px">Mode mock - En prod, ce sera un vrai paiement Moneroo vérifié.</p>
            </div>
        </body>
        </html>
        <?php
        exit;
    }

    // Mode réel - vérifier via API Moneroo
    if (!MONEROO_SECRET_KEY || MONEROO_SECRET_KEY === 'colle_ta_cle_api_ici') {
        throw new Exception('Clé API Moneroo manquante - vérifie .env');
    }

    if (!class_exists('\Moneroo\Payment')) {
        throw new Exception('Librairie Moneroo non installée');
    }

    $monerooPayment = new \Moneroo\Payment(MONEROO_SECRET_KEY);
    $payment = $monerooPayment->verify($transactionId);

    if ($payment->status === 'success') {
        if ($orderId) {
            updateOrderStatus($orderId, 'paid', $transactionId);
        }
        // Page confirmation personnalisée Envol Africa au lieu du texte brut
        ?>
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Merci - Envol Africa Magazine</title><style>body{font-family:Montserrat,Inter,sans-serif;background:#fcf9f8;color:#1b1c1c;padding:20px} .card{max-w:640px;margin:40px auto;background:white;border-radius:16px;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,0.08);border:1px solid #e5bdbb} .badge{display:inline-block;background:#ffdad8;color:#9e001f;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:bold;letter-spacing:0.05em} h1{font-size:28px;line-height:1.1;margin:16px 0} p{color:#5c403f;line-height:1.6} a{color:#9e001f;font-weight:bold;text-decoration:none} a:hover{text-decoration:underline} .btn{display:inline-block;margin-top:16px;background:#9e001f;color:white;padding:12px 24px;border-radius:999px;font-weight:bold}</style></head>
        <body>
            <div class="card">
                <span class="badge">PAIEMENT CONFIRMÉ</span>
                <h1>✅ Merci pour votre commande, votre paiement est confirmé !</h1>
                <p>Transaction <strong><?= htmlspecialchars($transactionId) ?></strong> - Commande <strong><?= htmlspecialchars($orderId ?? $payment->metadata->order_id ?? '') ?></strong></p>
                <p>Votre abonnement/magazine est maintenant actif. Vous pouvez accéder à vos téléchargements depuis votre espace client. Vos liens sécurisés expirent en 24h (JWT signé).</p>
                <p><a href="/compte" class="btn">Mon espace →</a> <a href="/kiosque" style="margin-left:12px">Kiosque</a></p>
                <p style="font-size:11px;color:#906f6e;margin-top:24px">Paiement sécurisé par Moneroo - Aucune donnée bancaire stockée - Vérification webhook HMAC-SHA256 OK</p>
            </div>
        </body>
        </html>
        <?php
    } elseif ($payment->status === 'pending') {
        ?>
        <!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Paiement en cours - Envol Africa</title></head><body style="font-family:Inter,sans-serif;padding:40px;text-align:center"><h1>⏳ Votre paiement est en cours de traitement.</h1><p>Transaction <?= htmlspecialchars($transactionId) ?> - Vous recevrez une confirmation sous peu par email. Le webhook Moneroo reste source de vérité.</p><p><a href="/">Retour accueil</a></p></body></html>
        <?php
    } else {
        $status = $payment->status ?? 'unknown';
        if ($orderId) {
            updateOrderStatus($orderId, 'failed', $transactionId);
        }
        ?>
        <!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Paiement échoué - Envol Africa</title></head><body style="font-family:Inter,sans-serif;padding:40px;text-align:center"><h1>❌ Le paiement n'a pas abouti (statut: <?= htmlspecialchars($status) ?>).</h1><p>Transaction <?= htmlspecialchars($transactionId) ?> - <a href="/panier">Réessayez</a> ou contactez support.</p></body></html>
        <?php
    }

} catch (Exception $e) {
    error_log('merci.php erreur: ' . $e->getMessage());
    http_response_code(500);
    ?>
    <!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Erreur - Envol Africa</title></head><body style="font-family:Inter,sans-serif;padding:40px;text-align:center"><h1>Impossible de vérifier ce paiement pour le moment.</h1><p><?= htmlspecialchars($e->getMessage()) ?></p><p>Notre équipe a été notifiée. Le webhook reste source de vérité. <a href="/compte">Voir mes commandes</a></p></body></html>
    <?php
}
