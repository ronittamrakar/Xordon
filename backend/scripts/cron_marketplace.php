<?php
/**
 * Lead Marketplace Cron Job
 * Processes expiring leads, sends reminders, and handles cleanup
 * 
 * Add to crontab:
 * * * * * * php /path/to/backend/cron_marketplace.php >> /var/log/marketplace_cron.log 2>&1
 */

require_once __DIR__ . '/src/Config.php';
require_once __DIR__ . '/src/Database.php';
require_once __DIR__ . '/src/services/LeadNotificationService.php';

use App\Services\LeadNotificationService;

$startTime = microtime(true);
echo "[" . date('Y-m-d H:i:s') . "] Marketplace cron started\n";

try {
    // Process expiring leads (send 2-hour reminders)
    $expiringCount = LeadNotificationService::processExpiringLeads();
    echo "  - Sent $expiringCount expiring lead reminders\n";

    // Process expired leads (update status)
    $expiredCount = LeadNotificationService::processExpiredLeads();
    echo "  - Marked $expiredCount leads as expired\n";

    // Clean up old routing queue entries
    $conn = \App\Database::conn();
    $stmt = $conn->prepare("DELETE FROM lead_routing_queue WHERE status = 'completed' AND processed_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");
    $stmt->execute();
    $cleanedQueue = $stmt->affected_rows;
    echo "  - Cleaned $cleanedQueue old routing queue entries\n";

    // Clean up old dedupe log entries (older than 30 days)
    $stmt = $conn->prepare("DELETE FROM lead_dedupe_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)");
    $stmt->execute();
    $cleanedDedupe = $stmt->affected_rows;
    echo "  - Cleaned $cleanedDedupe old dedupe log entries\n";

    $elapsed = round((microtime(true) - $startTime) * 1000, 2);
    echo "[" . date('Y-m-d H:i:s') . "] Marketplace cron completed in {$elapsed}ms\n\n";

} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
