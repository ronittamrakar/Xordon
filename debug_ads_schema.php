<?php
require_once __DIR__ . '/backend/src/Database.php';
require_once __DIR__ . '/backend/src/Config.php';

// Manually set environment variables if .env exists
$envFile = __DIR__ . '/backend/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            putenv(trim($name) . '=' . trim($value));
        }
    }
}

try {
    $pdo = \Xordon\Database::conn();
    $adsTables = ['ad_accounts', 'ad_campaigns', 'ad_campaign_metrics', 'ad_conversions', 'ad_budgets', 'ad_ab_tests'];
    
    foreach ($adsTables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->fetch()) {
            echo "--- Schema for $table ---\n";
            $desc = $pdo->query("DESCRIBE $table")->fetchAll(PDO::FETCH_ASSOC);
            print_r($desc);
        } else {
            echo "$table does not exist.\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
