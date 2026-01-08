<?php
/**
 * Lead Marketplace Migration Runner
 * Run this script to apply the lead marketplace database tables
 * 
 * Usage: php run_marketplace_migration.php
 */

require_once __DIR__ . '/src/Config.php';
require_once __DIR__ . '/src/Database.php';

/**
 * Split SQL into statements while respecting quoted strings.
 */
function splitSqlStatements(string $sql): array {
    // Split by semicolon, strip leading comment lines, drop empties.
    $parts = explode(';', $sql);
    $stmts = [];
    foreach ($parts as $part) {
        // Remove comment-only lines
        $lines = array_filter(
            array_map('trim', preg_split('/\r?\n/', $part)),
            fn($line) => $line !== '' && strpos($line, '--') !== 0
        );
        $stmt = trim(implode("\n", $lines));
        if ($stmt === '') continue;
        $stmts[] = $stmt;
    }
    return $stmts;
}

echo "=== Lead Marketplace Migration Runner ===\n\n";

try {
    $pdo = Database::conn(); // PDO connection
    echo "✓ Database connection established\n";

    $migrationFile = __DIR__ . '/migrations/lead_marketplace.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }

    $sql = file_get_contents($migrationFile);
    echo "✓ Migration file loaded (" . strlen($sql) . " bytes)\n";

    // Split statements safely (respecting quoted semicolons)
    $statements = splitSqlStatements($sql);

    echo "✓ Found " . count($statements) . " SQL statements\n\n";

    $success = 0;
    $failed = 0;
    $skipped = 0;

    foreach ($statements as $statement) {
        if (empty(trim($statement)) || strpos(trim($statement), '--') === 0) {
            continue;
        }

        // Extract table name for logging
        $tableName = '';
        if (preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $statement, $m)) {
            $tableName = $m[1];
        } elseif (preg_match('/INSERT INTO.*?`?(\w+)`?/i', $statement, $m)) {
            $tableName = $m[1] . ' (seed data)';
        } elseif (preg_match('/CREATE.*?INDEX.*?ON.*?`?(\w+)`?/i', $statement, $m)) {
            $tableName = $m[1] . ' (index)';
        }

        try {
            $pdo->exec($statement);
            echo "  ✓ Applied: $tableName\n";
            $success++;
        } catch (PDOException $e) {
            $msg = $e->getMessage();
            if (stripos($msg, 'already exists') !== false || stripos($msg, 'Duplicate') !== false) {
                echo "  ⊘ Skipped: $tableName (already exists)\n";
                $skipped++;
            } else {
                echo "  ✗ Failed: $tableName - $msg\n";
                $failed++;
            }
        }
    }

    echo "\n=== Migration Complete ===\n";
    echo "Success: $success | Skipped: $skipped | Failed: $failed\n";

    // Verify tables exist
    echo "\n=== Verifying Tables ===\n";
    $tables = [
        'service_catalog',
        'service_pros',
        'pro_preferences',
        'service_areas',
        'service_pro_offerings',
        'lead_requests',
        'lead_request_services',
        'lead_matches',
        'lead_quotes',
        'lead_pricing_rules',
        'credits_wallets',
        'credit_transactions',
        'credit_packages',
        'promo_codes',
        'marketplace_reviews',
        'lead_activity_log',
        'lead_routing_queue',
        'lead_dedupe_log'
    ];

    $existing = 0;
    $missing = 0;
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE " . $pdo->quote($table));
        $found = $stmt ? $stmt->fetchColumn() : false;
        if ($found) {
            echo "  ✓ $table\n";
            $existing++;
        } else {
            echo "  ✗ $table (MISSING)\n";
            $missing++;
        }
    }

    echo "\n=== Table Verification ===\n";
    echo "Existing: $existing | Missing: $missing\n";

    if ($missing > 0) {
        echo "\n⚠ Some tables are missing. Please check the migration file.\n";
    } else {
        echo "\n✓ All lead marketplace tables are ready!\n";
    }

} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
