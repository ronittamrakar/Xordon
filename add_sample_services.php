<?php
/**
 * Script to add sample services to the database
 * Run with: php add_sample_services.php
 */

require_once __DIR__ . '/backend/vendor/autoload.php';
require_once __DIR__ . '/backend/src/Database.php';

try {
    $pdo = Database::conn();
    
    $services = [
        ['Consultation Session', 'One-on-one consultation with our experts', 150.00, 60],
        ['Installation Service', 'Professional installation and setup', 200.00, 120],
        ['Training Workshop', 'Comprehensive training workshop', 500.00, 240],
        ['Maintenance Service', 'Regular maintenance and checkup', 75.00, 60],
        ['Emergency Support', '24/7 emergency support service', 300.00, 120],
        ['System Audit', 'Complete system audit and optimization', 400.00, 180],
        ['Custom Development', 'Custom development and integration', 150.00, 60],
        ['Data Migration', 'Secure data migration service', 250.00, 90],
    ];
    
    $stmt = $pdo->prepare("
        INSERT INTO services 
        (workspace_id, user_id, category_id, name, description, price, price_type, duration_minutes, buffer_before_minutes, buffer_after_minutes, max_bookings_per_slot, requires_confirmation, allow_online_booking, is_active, created_at, updated_at)
        VALUES (1, 0, NULL, ?, ?, ?, 'fixed', ?, 0, 0, 1, 0, 1, 1, NOW(), NOW())
    ");
    
    $count = 0;
    foreach ($services as $service) {
        $stmt->execute([
            $service[0], // name
            $service[1], // description
            $service[2], // price
            $service[3], // duration_minutes
        ]);
        $count++;
    }
    
    echo "Successfully added $count sample services!\n";
    
    // Verify
    $result = $pdo->query("SELECT COUNT(*) FROM services WHERE workspace_id = 1")->fetchColumn();
    echo "Total services in database: $result\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}
