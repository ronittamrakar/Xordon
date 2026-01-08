<?php
/**
 * Migration: Add all missing columns to recipients table
 */

require_once __DIR__ . '/../src/Database.php';

echo "=== ADDING MISSING COLUMNS TO recipients TABLE ===\n\n";

try {
    $pdo = Database::conn();
    echo "✅ Database connected\n\n";
    
    // Get current columns
    $stmt = $pdo->query("DESCRIBE recipients");
    $existingColumns = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $existingColumns[] = $row['Field'];
    }
    
    echo "Current columns: " . implode(', ', $existingColumns) . "\n\n";
    
    // Define all required columns
    $requiredColumns = [
        'tags' => "VARCHAR(500) NULL",
        'postal_code' => "VARCHAR(20) NULL",
        'address' => "VARCHAR(255) NULL",
        'website' => "VARCHAR(255) NULL",
        'linkedin' => "VARCHAR(255) NULL",
        'twitter' => "VARCHAR(255) NULL",
        'birthday' => "DATE NULL",
        'lead_source' => "VARCHAR(100) NULL",
        'industry' => "VARCHAR(100) NULL",
        'company_size' => "VARCHAR(50) NULL",
        'annual_revenue' => "DECIMAL(15,2) NULL",
        'updated_at' => "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    ];
    
    $added = 0;
    foreach ($requiredColumns as $column => $definition) {
        if (!in_array($column, $existingColumns)) {
            echo "Adding column: $column...\n";
            $pdo->exec("ALTER TABLE recipients ADD COLUMN $column $definition");
            $added++;
        } else {
            echo "✓ Column $column already exists\n";
        }
    }
    
    echo "\n=== MIGRATION COMPLETE ===\n";
    echo "✅ Added $added new column(s)\n";
    echo "✅ recipients table is now complete\n";
    
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
