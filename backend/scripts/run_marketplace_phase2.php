<?php
/**
 * Lead Marketplace Phase 2 Migration Runner
 * Run this script to apply the phase 2 marketplace database tables
 * Usage: php run_marketplace_phase2.php
 */

require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/Database.php';

function splitSqlStatements(string $sql): array {
    $parts = preg_split('/;\s*(\r?\n)+/', $sql);
    $stmts = [];
    foreach ($parts as $part) {
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

echo "=== Lead Marketplace Phase 2 Migration Runner ===\n\n";

try {
    $pdo = \Xordon\Database::conn();
    echo "✓ Database connection established\n";

    $migrationFile = __DIR__ . '/../migrations/lead_marketplace_phase2.sql';
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }

    $sql = file_get_contents($migrationFile);
    echo "✓ Migration file loaded (" . strlen($sql) . " bytes)\n";

    $statements = splitSqlStatements($sql);
    echo "✓ Found " . count($statements) . " SQL statements\n\n";

    $success = 0;
    $failed = 0;
    $skipped = 0;

    foreach ($statements as $statement) {
        if (empty(trim($statement)) || strpos(trim($statement), '--') === 0) continue;

        $tableName = '';
        if (preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $statement, $m)) {
            $tableName = $m[1];
        } elseif (preg_match('/INSERT INTO.*?`?(\w+)`?/i', $statement, $m)) {
            $tableName = $m[1] . ' (seed data)';
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

    if ($failed > 0) {
        echo "\n⚠ There were failures during migration. Please inspect errors above.\n";
        exit(1);
    }

    echo "\n✓ Phase 2 migration applied successfully.\n";

} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
