<?php
/**
 * Cleanup Expired Auth Tokens
 * Removes expired authentication tokens from the database
 */

require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';

use Xordon\Database;

echo "[" . date('Y-m-d H:i:s') . "] Starting token cleanup...\n";

try {
    $pdo = Database::conn();
    
    // Delete expired tokens
    $stmt = $pdo->prepare("
        DELETE FROM auth_tokens 
        WHERE expires_at IS NOT NULL 
        AND expires_at < CURRENT_TIMESTAMP
    ");
    
    $stmt->execute();
    $deletedCount = $stmt->rowCount();
    
    echo "[" . date('Y-m-d H:i:s') . "] Deleted $deletedCount expired tokens\n";
    
    // Optional: Delete very old tokens even without expiration (older than 90 days)
    $stmt = $pdo->prepare("
        DELETE FROM auth_tokens 
        WHERE created_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 90 DAY)
    ");
    
    $stmt->execute();
    $oldTokensCount = $stmt->rowCount();
    
    echo "[" . date('Y-m-d H:i:s') . "] Deleted $oldTokensCount tokens older than 90 days\n";
    echo "[" . date('Y-m-d H:i:s') . "] Token cleanup completed\n";
    
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] Error: " . $e->getMessage() . "\n";
    exit(1);
}

exit(0);
