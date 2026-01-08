<?php
require __DIR__ . '/backend/src/bootstrap.php';
$pdo = Database::conn();

try {
    echo "Current Table Structure for contact_lists:\n";
    $stmt = $pdo->query('DESCRIBE contact_lists');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "- " . $col['Field'] . " (" . $col['Type'] . ") Default: " . ($col['Default'] ?? 'NULL') . "\n";
    }

    echo "\nEnsuring Correct Columns...\n";
    
    // Check if updated_at exists
    $hasUpdatedAt = false;
    foreach ($columns as $col) {
        if ($col['Field'] === 'updated_at') $hasUpdatedAt = true;
    }
    
    if (!$hasUpdatedAt) {
        echo "Adding updated_at column...\n";
        $pdo->exec("ALTER TABLE contact_lists ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
    }

    // Fix workspace_id if it has that weird default
    echo "Fixing workspace_id column...\n";
    $pdo->exec("ALTER TABLE contact_lists MODIFY COLUMN workspace_id INT NULL DEFAULT NULL");

    // Ensure is_folder and parent_id have correct types
    echo "Fixing folder columns...\n";
    $pdo->exec("ALTER TABLE contact_lists MODIFY COLUMN is_folder TINYINT(1) DEFAULT 0");
    $pdo->exec("ALTER TABLE contact_lists MODIFY COLUMN parent_id INT NULL DEFAULT NULL");
    
    echo "\nRe-checking Table Structure:\n";
    $stmt = $pdo->query('DESCRIBE contact_lists');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "- " . $col['Field'] . " (" . $col['Type'] . ") Default: " . ($col['Default'] ?? 'NULL') . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
