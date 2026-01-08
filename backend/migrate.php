<?php
/**
 * Simple Migration Runner for Xordon
 */

require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    echo "Connected to database successfully.\n";

    // 1. Create migrations table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            migration VARCHAR(255) NOT NULL,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY (migration)
        ) ENGINE=InnoDB;
    ");

    // 2. Scan migrations directory
    $migrationsDir = __DIR__ . '/migrations';
    $files = glob($migrationsDir . '/*.sql');
    sort($files); // Run in order

    // 3. Get already executed migrations
    $stmt = $pdo->query("SELECT migration FROM migrations");
    $executed = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $count = 0;
    foreach ($files as $file) {
        $filename = basename($file);
        if (in_array($filename, $executed)) {
            continue;
        }

        echo "Executing $filename... ";
        $sql = file_get_contents($file);
        
        // Split by semicolon but ignore ones inside quotes
        // Simple regex split for basic SQL files
        // A better way is to run the whole block if the driver supports multiple statements
        try {
            // PDO doesn't always support multiple statements in one exec() depending on driver/config
            // But for MySQL it usually works if enabled. 
            // We'll try to run the whole content first.
            $pdo->exec($sql);
            
            $stmt = $pdo->prepare("INSERT INTO migrations (migration) VALUES (?)");
            $stmt->execute([$filename]);
            
            echo "DONE\n";
            $count++;
        } catch (PDOException $e) {
            echo "FAILED: " . $e->getMessage() . "\n";
            // Optional: exit or continue
        }
    }

    echo "\nMigration process completed. $count new migrations executed.\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
