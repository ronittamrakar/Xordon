<?php
/**
 * Run Affiliate Program Migration
 * Creates affiliate tables if they don't exist
 */

try {
    $db = new PDO('mysql:host=localhost;dbname=xordon', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Running Affiliate Program Migration...\n";
    
    // Read the SQL file
    $sqlFile = __DIR__ . '/../migrations/add_affiliates_program.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("Migration file not found: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    
    // Split into individual statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        fn($stmt) => !empty($stmt) && !preg_match('/^--/', $stmt)
    );
    
    foreach ($statements as $statement) {
        if (empty(trim($statement))) continue;
        
        // Skip comments
        if (preg_match('/^--/', $statement)) continue;
        
        try {
            $db->exec($statement);
            echo ".";
        } catch (PDOException $e) {
            // Ignore table already exists errors
            if (strpos($e->getMessage(), 'already exists') === false) {
                echo "\nError: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n\nMigration completed successfully!\n";
    
    // Verify tables were created
    $tables = ['affiliates', 'affiliate_referrals', 'affiliate_payouts', 'affiliate_clicks'];
    foreach ($tables as $table) {
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✓ Table '$table' exists\n";
        } else {
            echo "✗ Table '$table' NOT found\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
