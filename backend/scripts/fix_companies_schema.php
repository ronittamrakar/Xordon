<?php
/**
 * Fix Companies Schema - Add Missing Columns
 */

require_once __DIR__ . '/src/Database.php';

try {
    echo "Connecting to database...\n";
    $pdo = Database::conn();
    
    echo "Adding missing columns to companies table...\n";
    
    $alterations = [
        "ALTER TABLE companies ADD COLUMN is_client BOOLEAN NOT NULL DEFAULT TRUE AFTER workspace_id",
        "ALTER TABLE companies ADD COLUMN client_since DATE NULL AFTER is_client",
        "ALTER TABLE companies ADD COLUMN monthly_retainer DECIMAL(10,2) NULL AFTER client_since",
        "ALTER TABLE companies ADD COLUMN billing_email VARCHAR(255) NULL AFTER monthly_retainer",
        "ALTER TABLE companies ADD COLUMN notes TEXT NULL AFTER billing_email",
        "ALTER TABLE companies ADD COLUMN archived_at DATETIME NULL AFTER notes",
    ];
    
    foreach ($alterations as $sql) {
        try {
            $pdo->exec($sql);
            echo "✓ " . substr($sql, 0, 60) . "...\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column') !== false) {
                echo "S " . substr($sql, 0, 60) . "... (already exists)\n";
            } else {
                echo "✗ ERROR: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\nAdding indexes...\n";
    
    $indexes = [
        "ALTER TABLE companies ADD INDEX idx_companies_is_client (workspace_id, is_client)",
        "ALTER TABLE companies ADD INDEX idx_companies_archived (workspace_id, archived_at)",
    ];
    
    foreach ($indexes as $sql) {
        try {
            $pdo->exec($sql);
            echo "✓ " . substr($sql, 0, 60) . "...\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate key') !== false) {
                echo "S " . substr($sql, 0, 60) . "... (already exists)\n";
            } else {
                echo "✗ ERROR: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\nAdding columns to workspaces table...\n";
    
    $workspaceAlterations = [
        "ALTER TABLE workspaces ADD COLUMN account_type ENUM('agency', 'individual') NOT NULL DEFAULT 'individual' AFTER slug",
        "ALTER TABLE workspaces ADD COLUMN settings JSON NULL AFTER account_type",
        "ALTER TABLE workspaces ADD COLUMN logo_url VARCHAR(500) NULL AFTER settings",
        "ALTER TABLE workspaces ADD COLUMN primary_color VARCHAR(7) NULL AFTER logo_url",
    ];
    
    foreach ($workspaceAlterations as $sql) {
        try {
            $pdo->exec($sql);
            echo "✓ " . substr($sql, 0, 60) . "...\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column') !== false) {
                echo "S " . substr($sql, 0, 60) . "... (already exists)\n";
            } else {
                echo "✗ ERROR: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\nVerifying schema...\n";
    
    $result = $pdo->query("SHOW COLUMNS FROM companies LIKE 'is_client'");
    if ($result->fetch()) {
        echo "✓ companies.is_client exists\n";
    } else {
        echo "✗ companies.is_client NOT found\n";
    }
    
    $result = $pdo->query("SHOW COLUMNS FROM workspaces LIKE 'account_type'");
    if ($result->fetch()) {
        echo "✓ workspaces.account_type exists\n";
    } else {
        echo "✗ workspaces.account_type NOT found\n";
    }
    
    echo "\n✓ Schema fix complete! Please restart your backend server.\n";
    
} catch (Exception $e) {
    die("FATAL ERROR: " . $e->getMessage() . "\n");
}
