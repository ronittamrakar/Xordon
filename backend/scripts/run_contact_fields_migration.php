<?php
// Run comprehensive contact fields migration

require_once __DIR__ . '/src/Database.php';

try {
    echo "Running comprehensive contact fields migration...\n";
    
    $pdo = Database::conn();
    $migrationFile = __DIR__ . '/migrations/add_comprehensive_contact_fields.sql';
    
    if (!file_exists($migrationFile)) {
        throw new Exception("Migration file not found: $migrationFile");
    }
    
    $sql = file_get_contents($migrationFile);
    
    if ($sql === false) {
        throw new Exception("Could not read migration file: $migrationFile");
    }
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            echo "✓ Executed: " . substr($statement, 0, 60) . "...\n";
        } catch (Exception $e) {
            // Ignore "Duplicate column" errors as fields may already exist
            if (strpos($e->getMessage(), 'Duplicate column') === false && 
                strpos($e->getMessage(), 'already exists') === false) {
                throw $e;
            }
            echo "⚠ Skipped (already exists): " . substr($statement, 0, 60) . "...\n";
        }
    }
    
    echo "\n✓ Comprehensive contact fields migration completed successfully!\n";
    
    // Verify some key fields were added
    $stmt = $pdo->query("DESCRIBE recipients");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $requiredFields = ['address', 'city', 'state', 'website', 'linkedin', 'industry', 'notes', 'birthday', 'lead_source'];
    $missingFields = array_diff($requiredFields, $columns);
    
    if (empty($missingFields)) {
        echo "✓ All required contact fields are present\n";
    } else {
        echo "⚠ Warning: Some fields may be missing: " . implode(', ', $missingFields) . "\n";
    }
    
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
