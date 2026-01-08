<?php
/**
 * Process Pending Appointment Reminders
 * Run this script via cron every 5 minutes
 */

require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/services/AppointmentAutomationService.php';

try {
    $service = new AppointmentAutomationService();
    $processed = $service->processPendingReminders();
    
    echo date('Y-m-d H:i:s') . " - Processed {$processed} reminders\n";
    
} catch (Exception $e) {
    echo date('Y-m-d H:i:s') . " - Error: " . $e->getMessage() . "\n";
    exit(1);
}
