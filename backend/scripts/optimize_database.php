<?php
/**
 * Database Optimization Script
 * Optimizes tables and analyzes database performance
 */

require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/DatabaseOptimizer.php';

use Xordon\Database;
use Xordon\DatabaseOptimizer;

echo "[" . date('Y-m-d H:i:s') . "] Starting database optimization...\n";

try {
    $pdo = Database::conn();
    $dbName = getenv('DB_NAME') ?: 'xordon';
    
    // Get all tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "[" . date('Y-m-d H:i:s') . "] Found " . count($tables) . " tables\n";
    
    foreach ($tables as $table) {
        echo "\n[" . date('Y-m-d H:i:s') . "] Optimizing table: $table\n";
        
        // Optimize table
        $pdo->query("OPTIMIZE TABLE `$table`");
        
        // Analyze table
        $stats = DatabaseOptimizer::analyzeTable($table);
        if (!empty($stats)) {
            echo "  - Rows: " . number_format($stats['rows']) . "\n";
            echo "  - Data size: " . round($stats['data_length'] / 1024 / 1024, 2) . " MB\n";
            echo "  - Index size: " . round($stats['index_length'] / 1024 / 1024, 2) . " MB\n";
            
            if ($stats['data_free'] > 0) {
                echo "  - Fragmentation: " . round($stats['data_free'] / 1024 / 1024, 2) . " MB can be reclaimed\n";
            }
        }
        
        // Check for missing indexes
        $suggestions = DatabaseOptimizer::suggestIndexes($table);
        if (!empty($suggestions)) {
            echo "  - Index suggestions:\n";
            foreach ($suggestions as $suggestion) {
                echo "    * {$suggestion['column']}: {$suggestion['reason']}\n";
                echo "      SQL: {$suggestion['sql']}\n";
            }
        }
    }
    
    // Check for missing foreign key indexes
    $missing = DatabaseOptimizer::checkMissingIndexes();
    if (!empty($missing)) {
        echo "\n[" . date('Y-m-d H:i:s') . "] WARNING: Foreign keys without indexes:\n";
        foreach ($missing as $fk) {
            echo "  - {$fk['TABLE_NAME']}.{$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']}.{$fk['REFERENCED_COLUMN_NAME']}\n";
        }
    }
    
    echo "\n[" . date('Y-m-d H:i:s') . "] Database optimization completed\n";
    
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] Error: " . $e->getMessage() . "\n";
    exit(1);
}

exit(0);
