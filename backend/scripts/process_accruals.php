<?php
/**
 * Process Leave Accruals CLI
 * 
 * Usage:
 * php backend/scripts/process_accruals.php --workspace-id=1 [--user-ids=1,2,3] [--year=2025] [--dry-run]
 */

require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/controllers/TimeTrackingController.php';

use Xordon\Database;

// Parse command line arguments
$options = getopt("", ["workspace-id:", "user-ids:", "year:", "dry-run"]);

if (!isset($options['workspace-id'])) {
    echo "Error: --workspace-id is required\n";
    echo "Usage: php backend/scripts/process_accruals.php --workspace-id=1 [--user-ids=1,2,3] [--year=2025] [--dry-run]\n";
    exit(1);
}

$params = [
    'workspace_id' => (int)$options['workspace-id'],
    'user_ids' => isset($options['user-ids']) ? explode(',', $options['user-ids']) : null,
    'year' => $options['year'] ?? date('Y'),
    'dry_run' => isset($options['dry-run'])
];

echo "[" . date('Y-m-d H:i:s') . "] Starting leave accrual processing for workspace " . $params['workspace_id'] . "...\n";
if ($params['dry_run']) echo "[DRY RUN] No changes will be saved to the database.\n";

try {
    // Call the controller method directly
    $response = TimeTrackingController::processAccruals($params);
    $result = json_decode($response, true);

    if (isset($result['error'])) {
        echo "Error: " . $result['error'] . "\n";
        exit(1);
    }

    echo "[" . date('Y-m-d H:i:s') . "] " . $result['message'] . "\n";
    
    if (isset($result['details']['results'])) {
        foreach ($result['details']['results'] as $res) {
            echo "  - User ID " . $res['user_id'] . ": " . $res['status'] . "\n";
        }
    }

    echo "[" . date('Y-m-d H:i:s') . "] Accrual processing completed\n";
    
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] Fatal Error: " . $e->getMessage() . "\n";
    exit(1);
}

exit(0);
