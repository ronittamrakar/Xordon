<?php
/**
 * Multi-tenancy isolation test script
 * Run this to verify cross-workspace and cross-company isolation
 */

require_once __DIR__ . '/../src/Database.php';

echo "=== Multi-Tenancy Isolation Test Suite ===\n\n";

try {
    $pdo = Database::conn();
    echo "✓ Database connection established\n\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

$testsPassed = 0;
$testsFailed = 0;

function test($name, $condition, $details = '') {
    global $testsPassed, $testsFailed;
    if ($condition) {
        echo "  ✓ $name\n";
        $testsPassed++;
    } else {
        echo "  ✗ $name" . ($details ? " - $details" : "") . "\n";
        $testsFailed++;
    }
}

function skipTest($name, $details = '') {
    echo "  - $name" . ($details ? " - $details" : "") . "\n";
}

// ============================================
// TEST 1: Schema Verification
// ============================================
echo "=== 1. Schema Verification ===\n";

$tablesWithWorkspaceId = [
    'companies', 'campaigns', 'recipients', 'templates', 
    'sending_accounts', 'sequences', 'tags',
    // Operations tables (merged from xordon_fsm, table names kept as fsm_* internally)
    'fsm_jobs', 'fsm_estimates', 'fsm_services', 'fsm_staff',
    'fsm_appointments', 'fsm_referrals', 'fsm_recalls', 'fsm_payments',
    'fsm_playbooks', 'fsm_settings', 'fsm_booking_types', 'fsm_availability',
    // Forms tables (merged from xordon_forms)
    'webforms_folders', 'webforms_forms', 'webforms_spam_rules', 'webforms_webhooks',
    'webforms_activity_logs', 'webforms_user_settings'
];

$optionalTables = [
    // Optional Operations tables (may not exist depending on deployed subset)
    'fsm_recalls',
    'fsm_payments',
    'fsm_settings',
    'fsm_availability',
];

foreach ($tablesWithWorkspaceId as $table) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if (!$stmt->fetchColumn()) {
            if (in_array($table, $optionalTables, true)) {
                skipTest("$table has workspace_id", "table does not exist (optional)");
                continue;
            }
            test("$table has workspace_id", false, "table does not exist");
            continue;
        }
        $stmt = $pdo->query("SHOW COLUMNS FROM `$table` LIKE 'workspace_id'");
        test("$table has workspace_id column", (bool)$stmt->fetch());
    } catch (Exception $e) {
        test("$table has workspace_id", false, $e->getMessage());
    }
}

// Check user_company_access table
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'user_company_access'");
    test("user_company_access table exists", (bool)$stmt->fetchColumn());
} catch (Exception $e) {
    test("user_company_access table exists", false, $e->getMessage());
}

// Check composite indexes
echo "\n=== 2. Index Verification ===\n";
$expectedIndexes = [
    ['companies', 'idx_companies_workspace_created'],
    ['campaigns', 'idx_campaigns_workspace_created'],
    ['campaigns', 'idx_campaigns_workspace_company'],
    ['recipients', 'idx_recipients_workspace_created'],
];

foreach ($expectedIndexes as [$table, $indexName]) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if (!$stmt->fetchColumn()) {
            test("$table.$indexName exists", false, "table does not exist");
            continue;
        }
        $stmt = $pdo->query("SHOW INDEX FROM `$table` WHERE Key_name = '$indexName'");
        test("$table.$indexName exists", (bool)$stmt->fetch());
    } catch (Exception $e) {
        test("$table.$indexName exists", false, $e->getMessage());
    }
}

// ============================================
// TEST 2: Data Isolation Verification
// ============================================
echo "\n=== 3. Data Isolation Verification ===\n";

// Get workspace counts
try {
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM workspaces");
    $workspaceCount = (int)$stmt->fetch()['cnt'];
    echo "  Found $workspaceCount workspaces\n";
    
    if ($workspaceCount >= 2) {
        // Get two different workspaces
        $stmt = $pdo->query("SELECT id FROM workspaces ORDER BY id LIMIT 2");
        $workspaces = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $ws1 = (int)$workspaces[0];
        $ws2 = (int)$workspaces[1];
        
        // Check companies are properly isolated
        $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM companies WHERE workspace_id = ?");
        $stmt->execute([$ws1]);
        $ws1Companies = (int)$stmt->fetch()['cnt'];
        
        $stmt->execute([$ws2]);
        $ws2Companies = (int)$stmt->fetch()['cnt'];
        
        echo "  Workspace $ws1 has $ws1Companies companies\n";
        echo "  Workspace $ws2 has $ws2Companies companies\n";
        
        // Verify no company belongs to both workspaces (impossible by design, but check anyway)
        $stmt = $pdo->query("
            SELECT c.id, c.name, c.workspace_id 
            FROM companies c 
            WHERE c.workspace_id IS NULL
            LIMIT 5
        ");
        $orphanCompanies = $stmt->fetchAll();
        test("No orphan companies (NULL workspace_id)", count($orphanCompanies) === 0, 
             count($orphanCompanies) . " companies have NULL workspace_id");
        
        // Check campaigns isolation
        $stmt = $pdo->query("
            SELECT COUNT(*) as cnt FROM campaigns WHERE workspace_id IS NULL
        ");
        $orphanCampaigns = (int)$stmt->fetch()['cnt'];
        test("No orphan campaigns (NULL workspace_id)", $orphanCampaigns === 0,
             "$orphanCampaigns campaigns have NULL workspace_id");
             
    } else {
        echo "  ⚠ Need at least 2 workspaces to test isolation\n";
    }
} catch (Exception $e) {
    echo "  ✗ Data isolation test failed: " . $e->getMessage() . "\n";
    $testsFailed++;
}

// ============================================
// TEST 3: User Company Access Verification
// ============================================
echo "\n=== 4. User Company Access Verification ===\n";

try {
    // Check that company owners have access entries
    $stmt = $pdo->query("
        SELECT c.id, c.name, c.user_id, c.workspace_id
        FROM companies c
        WHERE c.workspace_id IS NOT NULL 
          AND c.user_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM user_company_access uca 
            WHERE uca.company_id = c.id 
              AND uca.user_id = c.user_id
          )
        LIMIT 10
    ");
    $companiesWithoutAccess = $stmt->fetchAll();
    test("All company owners have access entries", count($companiesWithoutAccess) === 0,
         count($companiesWithoutAccess) . " companies missing owner access");
    
    // Check access entry count
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM user_company_access");
    $accessCount = (int)$stmt->fetch()['cnt'];
    echo "  Total user_company_access entries: $accessCount\n";
    
} catch (Exception $e) {
    echo "  ✗ User company access test failed: " . $e->getMessage() . "\n";
    $testsFailed++;
}

// ============================================
// TEST 4: Cross-Reference Integrity
// ============================================
echo "\n=== 5. Cross-Reference Integrity ===\n";

try {
    // Check campaigns reference valid companies in same workspace
    $stmt = $pdo->query("
        SELECT cam.id, cam.name, cam.workspace_id as cam_ws, cam.company_id, c.workspace_id as company_ws
        FROM campaigns cam
        JOIN companies c ON c.id = cam.company_id
        WHERE cam.company_id IS NOT NULL 
          AND cam.workspace_id IS NOT NULL
          AND cam.workspace_id != c.workspace_id
        LIMIT 5
    ");
    $crossWorkspaceCampaigns = $stmt->fetchAll();
    test("No cross-workspace campaign-company references", count($crossWorkspaceCampaigns) === 0,
         count($crossWorkspaceCampaigns) . " campaigns reference companies in different workspaces");
    
    // Check recipients reference campaigns in same workspace
    $stmt = $pdo->query("
        SELECT r.id, r.workspace_id as r_ws, r.campaign_id, c.workspace_id as c_ws
        FROM recipients r
        JOIN campaigns c ON c.id = r.campaign_id
        WHERE r.workspace_id IS NOT NULL 
          AND c.workspace_id IS NOT NULL
          AND r.workspace_id != c.workspace_id
        LIMIT 5
    ");
    $crossWorkspaceRecipients = $stmt->fetchAll();
    test("No cross-workspace recipient-campaign references", count($crossWorkspaceRecipients) === 0,
         count($crossWorkspaceRecipients) . " recipients reference campaigns in different workspaces");
         
} catch (Exception $e) {
    echo "  ✗ Cross-reference integrity test failed: " . $e->getMessage() . "\n";
    $testsFailed++;
}

// ============================================
// TEST 5: Workspace Member Verification
// ============================================
echo "\n=== 6. Workspace Member Verification ===\n";

try {
    // Check all users have at least one workspace
    $stmt = $pdo->query("
        SELECT u.id, u.email
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM workspace_members wm WHERE wm.user_id = u.id
        )
        LIMIT 10
    ");
    $usersWithoutWorkspace = $stmt->fetchAll();
    test("All users have workspace membership", count($usersWithoutWorkspace) === 0,
         count($usersWithoutWorkspace) . " users have no workspace");
    
    // Check workspace member counts
    $stmt = $pdo->query("
        SELECT w.id, w.name, COUNT(wm.user_id) as member_count
        FROM workspaces w
        LEFT JOIN workspace_members wm ON wm.workspace_id = w.id
        GROUP BY w.id, w.name
        HAVING member_count = 0
        LIMIT 5
    ");
    $emptyWorkspaces = $stmt->fetchAll();
    test("All workspaces have at least one member", count($emptyWorkspaces) === 0,
         count($emptyWorkspaces) . " workspaces have no members");
         
} catch (Exception $e) {
    echo "  ✗ Workspace member test failed: " . $e->getMessage() . "\n";
    $testsFailed++;
}

// ============================================
// Summary
// ============================================
echo "\n=== Test Summary ===\n";
echo "  Passed: $testsPassed\n";
echo "  Failed: $testsFailed\n";
echo "  Total:  " . ($testsPassed + $testsFailed) . "\n\n";

if ($testsFailed === 0) {
    echo "✓ All tests passed! Multi-tenancy isolation is properly configured.\n";
    exit(0);
} else {
    echo "⚠ Some tests failed. Review the output above for details.\n";
    exit(1);
}
