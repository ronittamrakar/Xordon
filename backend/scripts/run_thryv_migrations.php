<?php
/**
 * Run Thryv-Parity Migrations
 * Executes all new migrations for booking, payments, portal, and job queue
 * 
 * Usage: php run_thryv_migrations.php
 */

require_once __DIR__ . '/src/bootstrap.php';
require_once __DIR__ . '/src/Database.php';

echo "=== Running Thryv-Parity Migrations ===\n\n";

$migrations = [
    // Sprint 0: Foundation
    'integrations_framework.sql',
    'notifications.sql',
    'create_jobs_queue.sql',
    'create_notification_logs.sql',
    
    // Sprint 1-2: Booking/Scheduling
    'scheduling_enhancements.sql',
    
    // Sprint 4-5: Invoicing & Stripe
    'estimates_invoices.sql',
    'stripe_payments.sql',
    
    // Sprint 6: PayPal
    'create_paypal_payments.sql',
    
    // Sprint 7: Portal Auth
    'create_portal_auth.sql',
];

$migrationsDir = __DIR__ . '/migrations/';
$successCount = 0;
$errorCount = 0;
$skippedCount = 0;

try {
    $db = Database::conn();
    
    foreach ($migrations as $migration) {
        $filePath = $migrationsDir . $migration;
        
        if (!file_exists($filePath)) {
            echo "⚠️  SKIP: $migration (file not found)\n";
            $skippedCount++;
            continue;
        }
        
        echo "📄 Running: $migration... ";
        
        try {
            $sql = file_get_contents($filePath);
            
            // Remove comments
            $sql = preg_replace('/--.*$/m', '', $sql);
            
            // Split by semicolon followed by newline or end
            $statements = preg_split('/;\s*[\r\n]+/', $sql);
            
            $stmtCount = 0;
            foreach ($statements as $statement) {
                $statement = trim($statement);
                if (empty($statement)) continue;
                
                try {
                    $db->exec($statement);
                    $stmtCount++;
                } catch (PDOException $e) {
                    // Ignore "already exists" errors for CREATE TABLE IF NOT EXISTS
                    if (strpos($e->getMessage(), 'already exists') === false &&
                        strpos($e->getMessage(), 'Duplicate') === false &&
                        strpos($e->getMessage(), 'duplicate key') === false) {
                        throw $e;
                    }
                }
            }
            
            echo "✅ ($stmtCount statements)\n";
            $successCount++;
            
        } catch (Exception $e) {
            echo "❌ Error: " . $e->getMessage() . "\n";
            $errorCount++;
        }
    }
    
    echo "\n=== Migration Summary ===\n";
    echo "✅ Success: $successCount\n";
    echo "❌ Errors: $errorCount\n";
    echo "⚠️  Skipped: $skippedCount\n";
    
    // Verify key tables exist
    echo "\n=== Verifying Key Tables ===\n";
    
    $tables = [
        'jobs_queue',
        'jobs_history',
        'scheduled_jobs',
        'notification_logs',
        'services',
        'service_categories',
        'staff_members',
        'staff_availability',
        'staff_time_off',
        'staff_services',
        'booking_settings',
        'appointment_reminders',
        'estimates',
        'estimate_items',
        'payments',
        'payment_links',
        'paypal_accounts',
        'paypal_orders',
        'paypal_webhook_events',
        'portal_identities',
        'portal_sessions',
        'portal_magic_links',
        'portal_otps',
        'portal_login_logs',
        'integrations',
        'integration_webhooks',
        'integration_webhook_logs',
    ];
    
    $existingTables = [];
    $missingTables = [];
    
    foreach ($tables as $table) {
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        if ($stmt->fetch()) {
            $existingTables[] = $table;
        } else {
            $missingTables[] = $table;
        }
    }
    
    echo "✅ Existing tables: " . count($existingTables) . "\n";
    if (!empty($missingTables)) {
        echo "❌ Missing tables: " . implode(', ', $missingTables) . "\n";
    } else {
        echo "🎉 All required tables exist!\n";
    }
    
} catch (Exception $e) {
    echo "\n❌ Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== Done ===\n";
