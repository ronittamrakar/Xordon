<?php
require_once __DIR__ . '/src/Database.php';

use Xordon\Database;

// Increase memory limit for large reports
ini_set('memory_limit', '512M');

echo "Starting Database Schema Validation...\n";

// 1. Get Expected Tables from Migrations
$migrationsDir = __DIR__ . '/migrations';
$migrationFiles = glob($migrationsDir . '/*.sql');
$expectedTables = [];

echo "Scanning " . count($migrationFiles) . " migration files...\n";

foreach ($migrationFiles as $file) {
    $content = file_get_contents($file);
    // Rough regex to find CREATE TABLE statements
    // Matches: CREATE TABLE [IF NOT EXISTS] `table_name`
    // OR: CREATE TABLE [IF NOT EXISTS] table_name
    if (preg_match_all('/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i', $content, $matches)) {
        foreach ($matches[1] as $tableName) {
            $expectedTables[] = $tableName;
        }
    }
}
$expectedTables = array_unique($expectedTables);
sort($expectedTables);

echo "Found " . count($expectedTables) . " expected tables defined in migrations.\n";


// 2. Get Actual Database Schema
try {
    $pdo = Database::conn();
    $dbName = $_ENV['DB_NAME'] ?? 'xordon'; // Database::conn() relies on env but we might need to fetch it differently if not set in $_ENV by the class 

    // Re-fetch db name from env if not set, strict check
    if (empty($dbName) || $dbName === 'xordon') {
         // Try to get from query if possible or assume xordon/defaults from Database class
         $stmt = $pdo->query("SELECT DATABASE()");
         $dbName = $stmt->fetchColumn();
    }
    
    echo "Connected to database: $dbName\n";

    // Get Tables
    $stmt = $pdo->query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$dbName'");
    $actualTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    sort($actualTables);
    
    echo "Found " . count($actualTables) . " actual tables in database.\n";

    // Get Columns Details
    $tablesDetails = [];
    foreach ($actualTables as $table) {
        $stmt = $pdo->prepare("
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                COLUMN_TYPE, 
                IS_NULLABLE, 
                COLUMN_DEFAULT, 
                COLUMN_KEY, 
                EXTRA 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        ");
        $stmt->execute([$dbName, $table]);
        $tablesDetails[$table]['columns'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get Foreign Keys
        $stmt = $pdo->prepare("
            SELECT 
                COLUMN_NAME, 
                CONSTRAINT_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
        ");
        $stmt->execute([$dbName, $table]);
        $tablesDetails[$table]['fks'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get Indexes (excluding PKs usually covered by columns scan, but good to have)
        $stmt = $pdo->prepare("
            SELECT DISTINCT
                INDEX_NAME,
                COLUMN_NAME,
                NON_UNIQUE
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY INDEX_NAME, SEQ_IN_INDEX
        ");
        $stmt->execute([$dbName, $table]);
        $tablesDetails[$table]['indexes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

} catch (Exception $e) {
    echo "Error connecting to database: " . $e->getMessage() . "\n";
    exit(1);
}

// 3. Compare and Generate Report
$missingTables = array_diff($expectedTables, $actualTables);
$extraTables = array_diff($actualTables, $expectedTables); // Unnecessary tables?

$report = "";
$report .= "# Database Schema Validation Report\n";
$report .= "Generated on: " . date('Y-m-d H:i:s') . "\n\n";

$report .= "## Summary\n";
$report .= "- **Expected Tables (from migrations):** " . count($expectedTables) . "\n";
$report .= "- **Actual Tables (in database):** " . count($actualTables) . "\n";
$report .= "- **Missing Tables:** " . count($missingTables) . "\n";
$report .= "- **Extra/Unnecessary Tables:** " . count($extraTables) . "\n\n";

if (!empty($missingTables)) {
    $report .= "## ⚠️ Missing Tables\n";
    $report .= "The following tables are defined in migrations but missing from the database:\n";
    foreach ($missingTables as $table) {
        $report .= "- `$table`\n";
    }
    $report .= "\n### Suggested Actions\n";
    $report .= "Check the `migrations/` folder for files creating these tables and run them manually if needed.\n\n";
}

if (!empty($extraTables)) {
    $report .= "## ❓ Extra Tables\n";
    $report .= "The following tables are in the database but NOT found in any `CREATE TABLE` statement in `migrations/`:\n";
    foreach ($extraTables as $table) {
        $report .= "- `$table`\n";
    }
    $report .= "\n> Note: These might be created dynamicall, legacy tables, or seed data tables.\n\n";
}

$report .= "## 📋 Detailed Schema Inspection\n";

foreach ($actualTables as $table) {
    $info = $tablesDetails[$table];
    $report .= "### Table: `$table`\n";
    
    // Columns
    $report .= "**Columns:**\n";
    $report .= "| Column | Type | Nullable | Default | Key | Extra |\n";
    $report .= "|---|---|---|---|---|---|\n";
    foreach ($info['columns'] as $col) {
        $default = $col['COLUMN_DEFAULT'] === null ? 'NULL' : $col['COLUMN_DEFAULT'];
        $report .= "| `{$col['COLUMN_NAME']}` | `{$col['COLUMN_TYPE']}` | {$col['IS_NULLABLE']} | `$default` | {$col['COLUMN_KEY']} | {$col['EXTRA']} |\n";
    }
    $report .= "\n";

    // Foreign Keys
    if (!empty($info['fks'])) {
        $report .= "**Foreign Keys:**\n";
        foreach ($info['fks'] as $fk) {
            $report .= "- `{$fk['COLUMN_NAME']}` -> `{$fk['REFERENCED_TABLE_NAME']}.{$fk['REFERENCED_COLUMN_NAME']}` (Constraint: `{$fk['CONSTRAINT_NAME']}`)\n";
        }
        $report .= "\n";
    }
    
    // Indexes
    if (!empty($info['indexes'])) {
        $report .= "**Indexes:**\n";
         $currentIdx = '';
         foreach ($info['indexes'] as $idx) {
             if ($currentIdx !== $idx['INDEX_NAME']) {
                 if ($currentIdx !== '') $report .= "\n";
                 $type = $idx['NON_UNIQUE'] == 0 ? 'UNIQUE' : 'INDEX';
                 $report .= "- `$type` `{$idx['INDEX_NAME']}`: `{$idx['COLUMN_NAME']}`";
                 $currentIdx = $idx['INDEX_NAME'];
             } else {
                 $report .= ", `{$idx['COLUMN_NAME']}`";
             }
         }
         $report .= "\n\n";
    }
    
    $report .= "---\n";
}

$reportFile = 'DATABASE_VALIDATION_REPORT.md';
file_put_contents(__DIR__ . '/' . $reportFile, $report);

echo "Report generated: $reportFile\n";
