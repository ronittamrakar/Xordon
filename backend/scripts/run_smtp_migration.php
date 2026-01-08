<?php
require 'load_env.php';
require 'src/Database.php';

try {
    $pdo = Database::conn();
    
    // Check if columns already exist
    $stmt = $pdo->query("SHOW COLUMNS FROM sending_accounts LIKE 'smtp_host'");
    if ($stmt->fetch()) {
        echo "SMTP columns already exist in sending_accounts table\n";
        exit(0);
    }
    
    $sql = file_get_contents('migrations/add_smtp_credentials.sql');
    $pdo->exec($sql);
    echo "SMTP credentials migration completed successfully\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}