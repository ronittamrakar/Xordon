<?php
// Simple script to run migrations

$migrationFile = $argv[1] ?? 'migrations/add_proposals_tables.sql';

try {
    $pdo = new PDO('mysql:host=localhost;dbname=xordon', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = file_get_contents($migrationFile);
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $stmt) {
        if (empty($stmt) || strpos(trim($stmt), '--') === 0) {
            continue;
        }
        try {
            $pdo->exec($stmt);
            echo "OK: " . substr($stmt, 0, 60) . "...\n";
        } catch (PDOException $e) {
            // Table already exists is OK
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "SKIP (exists): " . substr($stmt, 0, 40) . "...\n";
            } else {
                echo "ERROR: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\nMigration completed!\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}