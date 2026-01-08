<?php
/**
 * Backfill workspace_id for existing records
 * 
 * This script populates workspace_id for records that only have user_id set.
 * It uses the user's primary workspace (first workspace they own or are a member of).
 * 
 * Run this script once after deploying workspace scoping changes.
 * 
 * Usage: php backfill_workspace_id.php [--dry-run]
 */

require_once __DIR__ . '/../src/Database.php';

$dryRun = in_array('--dry-run', $argv ?? []);

echo "=== Workspace ID Backfill Script ===\n";
echo $dryRun ? "DRY RUN MODE - No changes will be made\n\n" : "LIVE MODE - Changes will be applied\n\n";

try {
    $pdo = Database::conn();
    
    // Tables that need workspace_id backfill
    $tables = [
        'companies',
        'recipients',
        'campaigns',
        'call_campaigns',
        'call_recipients',
        'call_logs',
        'call_agents',
        'call_disposition_types',
        'connections',
        'phone_numbers',
        'booking_types',
        'availability_schedules',
        'availability_overrides',
        'appointments',
        'tags',
        'email_templates',
        'sms_templates',
        'proposals',
        'payments',
        'invoices',
    ];
    
    // First, build a map of user_id -> primary workspace_id
    echo "Building user -> workspace mapping...\n";
    $stmt = $pdo->query("
        SELECT m.user_id, m.workspace_id 
        FROM workspace_members m
        INNER JOIN (
            SELECT user_id, MIN(
                CASE WHEN role = 'owner' THEN 0 ELSE 1 END * 1000000 + id
            ) as priority
            FROM workspace_members
            GROUP BY user_id
        ) ranked ON m.user_id = ranked.user_id
        WHERE (CASE WHEN m.role = 'owner' THEN 0 ELSE 1 END * 1000000 + m.id) = ranked.priority
    ");
    $userWorkspaceMap = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $userWorkspaceMap[$row['user_id']] = $row['workspace_id'];
    }
    echo "Found " . count($userWorkspaceMap) . " users with workspaces\n\n";
    
    if (empty($userWorkspaceMap)) {
        echo "No users with workspaces found. Creating default workspace for users...\n";
        
        // Get all users without workspaces
        $usersStmt = $pdo->query("SELECT id, name, email FROM users WHERE id NOT IN (SELECT user_id FROM workspace_members)");
        $users = $usersStmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($users as $user) {
            $workspaceName = ($user['name'] ?? 'User') . "'s Workspace";
            $slug = strtolower(preg_replace('/[^a-z0-9]+/', '-', $workspaceName)) . '-' . $user['id'];
            
            if (!$dryRun) {
                $pdo->prepare("INSERT INTO workspaces (name, slug, owner_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())")
                    ->execute([$workspaceName, $slug, $user['id']]);
                $workspaceId = $pdo->lastInsertId();
                
                $pdo->prepare("INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, 'owner', NOW())")
                    ->execute([$workspaceId, $user['id']]);
                
                $userWorkspaceMap[$user['id']] = $workspaceId;
                echo "  Created workspace '$workspaceName' (ID: $workspaceId) for user {$user['id']}\n";
            } else {
                echo "  [DRY RUN] Would create workspace '$workspaceName' for user {$user['id']}\n";
            }
        }
        echo "\n";
    }
    
    // Process each table
    $totalUpdated = 0;
    foreach ($tables as $table) {
        // Check if table exists
        $checkStmt = $pdo->prepare(
            'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1'
        );
        $checkStmt->execute([$table]);
        if (!$checkStmt->fetchColumn()) {
            echo "Table '$table' does not exist, skipping...\n";
            continue;
        }
        
        // Check if workspace_id column exists
        $colStmt = $pdo->prepare("SHOW COLUMNS FROM `$table` LIKE 'workspace_id'");
        $colStmt->execute();
        if (!$colStmt->fetch()) {
            echo "Table '$table' has no workspace_id column, skipping...\n";
            continue;
        }
        
        // Check if user_id column exists
        $userColStmt = $pdo->prepare("SHOW COLUMNS FROM `$table` LIKE 'user_id'");
        $userColStmt->execute();
        if (!$userColStmt->fetch()) {
            echo "Table '$table' has no user_id column, skipping...\n";
            continue;
        }
        
        // Count records needing update
        $countStmt = $pdo->query("SELECT COUNT(*) as cnt FROM `$table` WHERE workspace_id IS NULL AND user_id IS NOT NULL");
        $count = $countStmt->fetch(PDO::FETCH_ASSOC)['cnt'];
        
        if ($count == 0) {
            echo "Table '$table': No records need updating\n";
            continue;
        }
        
        echo "Table '$table': $count records need workspace_id...\n";
        
        // Update records
        $updated = 0;
        foreach ($userWorkspaceMap as $userId => $workspaceId) {
            if ($dryRun) {
                $checkStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM `$table` WHERE user_id = ? AND workspace_id IS NULL");
                $checkStmt->execute([$userId]);
                $userCount = $checkStmt->fetch(PDO::FETCH_ASSOC)['cnt'];
                if ($userCount > 0) {
                    echo "  [DRY RUN] Would update $userCount records for user $userId -> workspace $workspaceId\n";
                    $updated += $userCount;
                }
            } else {
                $updateStmt = $pdo->prepare("UPDATE `$table` SET workspace_id = ? WHERE user_id = ? AND workspace_id IS NULL");
                $updateStmt->execute([$workspaceId, $userId]);
                $rowCount = $updateStmt->rowCount();
                if ($rowCount > 0) {
                    echo "  Updated $rowCount records for user $userId -> workspace $workspaceId\n";
                    $updated += $rowCount;
                }
            }
        }
        
        echo "  Total updated in '$table': $updated\n\n";
        $totalUpdated += $updated;
    }
    
    echo "=== Summary ===\n";
    echo "Total records " . ($dryRun ? "that would be " : "") . "updated: $totalUpdated\n";
    
    if ($dryRun) {
        echo "\nThis was a dry run. Run without --dry-run to apply changes.\n";
    } else {
        echo "\nBackfill complete!\n";
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
