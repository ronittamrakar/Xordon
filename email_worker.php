<?php
/**
 * Email Worker - CLI script to process sequences, warm-up, and sync replies.
 * Usage: php email_worker.php
 */

require_once __DIR__ . '/backend/src/services/SequenceService.php';
require_once __DIR__ . '/backend/src/services/WarmupService.php';
require_once __DIR__ . '/backend/src/services/EmailSyncService.php';
require_once __DIR__ . '/backend/src/services/HybridCampaignProcessor.php';

$sequenceService = new SequenceService();
$warmupService = new WarmupService();
$syncService = new EmailSyncService();
$hybridProcessor = new HybridCampaignProcessor();

echo "[" . date('Y-m-d H:i:s') . "] Starting Email Worker...\n";

// 1. Sync Replies (IMAP)
echo "[" . date('Y-m-d H:i:s') . "] Syncing replies...\n";
try {
    // For now, we sync for all users found in sending_accounts
    // In a production environment, this would be more targeted or partitioned
    $pdo = Database::conn();
    $users = $pdo->query("SELECT DISTINCT user_id FROM sending_accounts WHERE status = 'active'")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($users as $userId) {
        $stats = $syncService->syncAllAccounts((int)$userId);
        echo "   User $userId: Processed {$stats['accounts_processed']} accounts, found {$stats['replies_found']} replies.\n";
        if (!empty($stats['errors'])) {
            foreach ($stats['errors'] as $err) echo "   ERROR: $err\n";
        }
    }
} catch (Exception $e) {
    echo "ERROR (Sync): " . $e->getMessage() . "\n";
}

// 2. Process Hybrid Campaigns (Sequences)
echo "[" . date('Y-m-d H:i:s') . "] Processing hybrid campaign steps...\n";
try {
    $stats = $hybridProcessor->processPendingRuns(50);
    echo "   Processed {$stats['processed']} runs, {$stats['failed']} failed.\n";
} catch (Exception $e) {
    echo "ERROR (Hybrid): " . $e->getMessage() . "\n";
}

// 3. Schedule Warmup Daily Runs
echo "[" . date('Y-m-d H:i:s') . "] Scheduling warmup runs...\n";
try {
    $pdo = Database::conn();
    $users = $pdo->query("SELECT DISTINCT user_id FROM warmup_profiles WHERE status = 'active'")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($users as $userId) {
        $count = $warmupService->scheduleDailyRuns((int)$userId);
        if ($count > 0) echo "   User $userId: Scheduled $count warmup runs.\n";
    }
} catch (Exception $e) {
    echo "ERROR (Warmup): " . $e->getMessage() . "\n";
}

echo "[" . date('Y-m-d H:i:s') . "] Worker finished.\n";
