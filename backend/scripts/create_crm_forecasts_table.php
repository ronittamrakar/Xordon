<?php
require_once __DIR__ . '/../src/Database.php';

use Xordon\Database;

try {
    echo "Creating crm_forecasts table...\n";
    $migrationFile = __DIR__ . '/../migrations/create_crm_advanced_features.sql';
    if (!file_exists($migrationFile)) throw new Exception("Migration file not found: $migrationFile");

    $sql = file_get_contents($migrationFile);
    if ($sql === false) throw new Exception("Failed to read migration file");

    // Extract the CREATE TABLE crm_forecasts block (up to the terminating semicolon)
    if (!preg_match('/(CREATE TABLE IF NOT EXISTS crm_forecasts[\s\S]*?;)/i', $sql, $matches)) {
        throw new Exception("crm_forecasts CREATE TABLE block not found");
    }

    $createBlock = $matches[1];

    $db = Database::conn();
    $db->exec($createBlock);

    echo "✓ crm_forecasts table created (or already exists)\n";
} catch (PDOException $e) {
    echo "✗ PDO Error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
