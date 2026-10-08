<?php

/**
 * =====================================================================
 *  CONFIGURATION MONEROO - Version sécurisée via .env
 *  Ne jamais coder en dur les secrets - utilise getenv() + .env
 * =====================================================================
 */

// Chargement .env si vlucas/phpdotenv disponible ou .env.local
$dotenvPath = __DIR__ . '/../.env';
$dotenvLocalPath = __DIR__ . '/../.env.local';

if (file_exists($dotenvLocalPath) && !getenv('MONEROO_SECRET_KEY')) {
    // Fallback simple sans librairie: parse .env.local ligne par ligne
    $lines = file($dotenvLocalPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        if (!getenv($key)) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

if (file_exists($dotenvPath) && !getenv('MONEROO_SECRET_KEY')) {
    $lines = file($dotenvPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        if (!getenv($key)) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

// Si vlucas/phpdotenv est installé via composer, on l'utilise
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    // L'autoload sera chargé dans chaque fichier avant config, mais on tente Dotenv ici aussi
    if (class_exists('Dotenv\Dotenv')) {
        try {
            $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
            $dotenv->safeLoad();
        } catch (Exception $e) {
            // ignore si .env manquant
        }
    }
}

// 🔑 Clé API secrète Moneroo (tableau de bord > Développeurs > API Keys)
// Utilise MONEROO_API_KEY (nouveau nom) ou MONEROO_SECRET_KEY (ancien)
$secretKey = getenv('MONEROO_API_KEY') ?: getenv('MONEROO_SECRET_KEY') ?: getenv('MONEROO_SECRET_KEY') ?: null;

if (!$secretKey) {
    // Fallback pour compatibilité - ne devrait jamais arriver en prod si .env bien configuré
    error_log('MONEROO_API_KEY manquant dans .env - mode mock activé');
}

define('MONEROO_SECRET_KEY', $secretKey ?: 'colle_ta_cle_api_ici');

// 🔗 URL publique vers webhook - doit pointer vers moneroo/webhook.php en prod
// Ex: https://envolafricamag.com/moneroo/webhook.php ou https://ton-projet.vercel.app/moneroo/webhook.php
$webhookUrl = getenv('MONEROO_WEBHOOK_URL') ?: getenv('NEXT_PUBLIC_BASE_URL') . '/moneroo/webhook.php';
define('MONEROO_WEBHOOK_URL', $webhookUrl ?: 'https://envolafricamag.com/moneroo/webhook.php');

// 🔒 Secret de signature webhook (tableau de bord > Développeurs > Webhooks)
$webhookSecret = getenv('MONEROO_WEBHOOK_SECRET') ?: getenv('MONEROO_SECRET_KEY') ?: null;
define('MONEROO_WEBHOOK_SECRET', $webhookSecret ?: 'colle_ton_secret_de_signature_ici');

// URL de retour après paiement - page merci
$baseUrl = getenv('NEXT_PUBLIC_BASE_URL') ?: 'https://envolafricamag.com';
define('MONEROO_RETURN_URL', $baseUrl . '/moneroo/merci.php');

// Pour compatibilité avec checkout.php qui utilise MONEROO_RETURN_URL
if (!defined('MONEROO_API_KEY')) {
    define('MONEROO_API_KEY', MONEROO_SECRET_KEY);
}
