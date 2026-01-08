<?php
/**
 * Run Appointments Migration (MySQL)
 * 
 * This script creates the appointments scheduling tables for MySQL/XAMPP
 */

require_once __DIR__ . '/src/Database.php';

echo "Running Appointments Migration (MySQL)...\n";

try {
    $pdo = Database::conn();
    
    echo "Connected to MySQL database\n";
    
    $migrationFile = __DIR__ . '/migrations/add_appointments_scheduling.sql';
    
    if (!file_exists($migrationFile)) {
        echo "Migration file not found: $migrationFile\n";
        exit(1);
    }
    
    $sql = file_get_contents($migrationFile);
    
    // Split by semicolons and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $success = 0;
    $skipped = 0;
    $failed = 0;
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos(trim($statement), '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            $success++;
            echo ".";
        } catch (PDOException $e) {
            // Ignore "already exists" errors
            if (strpos($e->getMessage(), 'already exists') !== false ||
                strpos($e->getMessage(), 'Duplicate') !== false) {
                $skipped++;
                echo "s";
                continue;
            }
            echo "\nError: " . $e->getMessage() . "\n";
            $failed++;
        }
    }
    
    echo "\n\nMigration completed!\n";
    echo "Success: $success, Skipped: $skipped, Failed: $failed\n";
    
    // Verify tables exist
    echo "\nVerifying tables...\n";
    $tables = ['booking_types', 'availability_schedules', 'availability_slots', 
               'availability_overrides', 'appointments', 'appointment_reminders', 
               'booking_page_settings', 'calendar_connections'];
    
    foreach ($tables as $table) {
        try {
            $stmt = $pdo->query("SELECT 1 FROM $table LIMIT 1");
            echo "  ✓ $table\n";
        } catch (PDOException $e) {
            echo "  ✗ $table - " . $e->getMessage() . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "\nMigration failed: " . $e->getMessage() . "\n";
    exit(1);
}
