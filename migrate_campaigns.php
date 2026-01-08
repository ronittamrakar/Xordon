<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $pdo = \Xordon\Database::conn();
    
    echo "Starting migrations...\n";

    // Add campaign_type and stop_on_reply to campaigns
    $pdo->exec("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_type ENUM('cold', 'warm') DEFAULT 'warm'");
    $pdo->exec("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS stop_on_reply TINYINT(1) DEFAULT 0");
    echo "Updated campaigns table.\n";

    // Add replied_at to recipients
    $pdo->exec("ALTER TABLE recipients ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP NULL DEFAULT NULL");
    echo "Updated recipients table.\n";

    // Add type to sequences
    $pdo->exec("ALTER TABLE sequences ADD COLUMN IF NOT EXISTS type ENUM('cold', 'warm') DEFAULT 'warm'");
    echo "Updated sequences table.\n";

    echo "Migrations completed successfully.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
