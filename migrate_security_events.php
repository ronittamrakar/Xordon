<?php
require_once __DIR__ . '/backend/src/Database.php';

try {
    $pdo = \Xordon\Database::conn();
    $sql = "CREATE TABLE IF NOT EXISTS security_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_created_at (created_at)
    )";
    $pdo->exec($sql);
    echo "Table security_events created successfully\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
