<?php
/**
 * Multi-tenancy verification and backfill script
 * Run this to check and fix workspace_id/company_id across all tables
 */

require_once __DIR__ . '/../src/Database.php';

echo "=== Multi-Tenancy Verification Script ===\n\n";

try {
    $pdo = Database::conn();
    echo "✓ Database connection established\n\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Tables that should have workspace_id
$workspaceTables = [
    'companies',
    'campaigns',
    'recipients',
    'templates',
    'sending_accounts',
    'sequences',
    'settings',
    'contacts',
    'tags',
    'lists',
    'segments',
    'forms',
    // Operations tables (merged from xordon_fsm, table names kept as fsm_* internally)
    'fsm_jobs',
    'fsm_estimates',
    'fsm_services',
    'fsm_staff',
    'fsm_appointments',
    'fsm_referrals',
    'fsm_recalls',
    'fsm_payments',
    'fsm_playbooks',
    'fsm_settings',
    'fsm_booking_types',
    'fsm_availability',
    // Forms tables (merged from xordon_forms)
    'webforms_folders',
    'webforms_forms',
    'webforms_spam_rules',
    'webforms_webhooks',
    'webforms_activity_logs',
    'webforms_user_settings',
];

// Tables that should have company_id (client-owned data)
$companyTables = [
    'campaigns',
];

echo "=== 1. Checking workspace_id columns ===\n";
$missingWorkspaceId = [];
$nullWorkspaceIdCounts = [];

foreach ($workspaceTables as $table) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if (!$stmt->fetchColumn()) {
            echo "  - $table: table does not exist (skipped)\n";
            continue;
        }
        
        $stmt = $pdo->query("SHOW COLUMNS FROM `$table` LIKE 'workspace_id'");
        if (!$stmt->fetch()) {
            $missingWorkspaceId[] = $table;
            echo "  ✗ $table: missing workspace_id column\n";
        } else {
            // Count NULL values
            $stmt = $pdo->query("SELECT COUNT(*) as total, SUM(CASE WHEN workspace_id IS NULL THEN 1 ELSE 0 END) as null_count FROM `$table`");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $total = (int)$row['total'];
            $nullCount = (int)$row['null_count'];
            $nullWorkspaceIdCounts[$table] = ['total' => $total, 'null' => $nullCount];
            
            if ($nullCount > 0) {
                echo "  ⚠ $table: has workspace_id but $nullCount/$total rows have NULL\n";
            } else {
                echo "  ✓ $table: workspace_id OK ($total rows)\n";
            }
        }
    } catch (Exception $e) {
        echo "  ✗ $table: error - " . $e->getMessage() . "\n";
    }
}

echo "\n=== 2. Checking company_id columns ===\n";
foreach ($companyTables as $table) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if (!$stmt->fetchColumn()) {
            echo "  - $table: table does not exist (skipped)\n";
            continue;
        }
        
        $stmt = $pdo->query("SHOW COLUMNS FROM `$table` LIKE 'company_id'");
        if (!$stmt->fetch()) {
            echo "  ✗ $table: missing company_id column\n";
        } else {
            $stmt = $pdo->query("SELECT COUNT(*) as total, SUM(CASE WHEN company_id IS NULL THEN 1 ELSE 0 END) as null_count FROM `$table`");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $total = (int)$row['total'];
            $nullCount = (int)$row['null_count'];
            
            if ($nullCount > 0) {
                echo "  ⚠ $table: has company_id but $nullCount/$total rows have NULL (OK if not required)\n";
            } else {
                echo "  ✓ $table: company_id OK ($total rows)\n";
            }
        }
    } catch (Exception $e) {
        echo "  ✗ $table: error - " . $e->getMessage() . "\n";
    }
}

echo "\n=== 3. Checking user_company_access table ===\n";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'user_company_access'");
    if (!$stmt->fetchColumn()) {
        echo "  ✗ user_company_access table does not exist\n";
    } else {
        $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM user_company_access");
        $count = (int)$stmt->fetch()['cnt'];
        echo "  ✓ user_company_access exists with $count entries\n";
    }
} catch (Exception $e) {
    echo "  ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== 4. Checking workspaces and workspace_members ===\n";
try {
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM workspaces");
    $workspaceCount = (int)$stmt->fetch()['cnt'];
    
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM workspace_members");
    $memberCount = (int)$stmt->fetch()['cnt'];
    
    echo "  ✓ Workspaces: $workspaceCount\n";
    echo "  ✓ Workspace members: $memberCount\n";
    
    // Check for users without workspaces
    $stmt = $pdo->query("
        SELECT COUNT(*) as cnt FROM users u 
        WHERE NOT EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.user_id = u.id)
    ");
    $orphanUsers = (int)$stmt->fetch()['cnt'];
    if ($orphanUsers > 0) {
        echo "  ⚠ Users without workspace membership: $orphanUsers\n";

        // Auto-assign orphan users to workspace 1 so tenant scoping works consistently
        // (workspace_id=1 is assumed to exist)
        $result = $pdo->exec("
            INSERT IGNORE INTO workspace_members (workspace_id, user_id, role)
            SELECT 1, u.id, 'member'
            FROM users u
            WHERE NOT EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.user_id = u.id)
        ");
        echo "  - Assigned $result users to workspace 1 (member)\n";
    }
} catch (Exception $e) {
    echo "  ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== 5. Running backfill for NULL workspace_id ===\n";

// Backfill companies
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'companies'");
    if ($stmt->fetchColumn()) {
        $stmt = $pdo->query("SHOW COLUMNS FROM companies LIKE 'workspace_id'");
        if ($stmt->fetch()) {
            $result = $pdo->exec("
                UPDATE companies c
                JOIN workspace_members wm ON wm.user_id = c.user_id
                SET c.workspace_id = wm.workspace_id
                WHERE c.workspace_id IS NULL
            ");
            echo "  - companies: backfilled $result rows\n";
        }
    }
} catch (Exception $e) {
    echo "  ✗ companies backfill error: " . $e->getMessage() . "\n";
}

// Backfill campaigns
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'campaigns'");
    if ($stmt->fetchColumn()) {
        $stmt = $pdo->query("SHOW COLUMNS FROM campaigns LIKE 'workspace_id'");
        if ($stmt->fetch()) {
            $result = $pdo->exec("
                UPDATE campaigns c
                JOIN workspace_members wm ON wm.user_id = c.user_id
                SET c.workspace_id = wm.workspace_id
                WHERE c.workspace_id IS NULL
            ");
            echo "  - campaigns: backfilled $result rows\n";
        }
    }
} catch (Exception $e) {
    echo "  ✗ campaigns backfill error: " . $e->getMessage() . "\n";
}

// Backfill templates
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'templates'");
    if ($stmt->fetchColumn()) {
        $stmt = $pdo->query("SHOW COLUMNS FROM templates LIKE 'workspace_id'");
        if ($stmt->fetch()) {
            $result = $pdo->exec("
                UPDATE templates t
                JOIN workspace_members wm ON wm.user_id = t.user_id
                SET t.workspace_id = wm.workspace_id
                WHERE t.workspace_id IS NULL
            ");
            echo "  - templates: backfilled $result rows\n";
        }
    }
} catch (Exception $e) {
    echo "  ✗ templates backfill error: " . $e->getMessage() . "\n";
}

// Backfill sending_accounts
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'sending_accounts'");
    if ($stmt->fetchColumn()) {
        $stmt = $pdo->query("SHOW COLUMNS FROM sending_accounts LIKE 'workspace_id'");
        if ($stmt->fetch()) {
            $result = $pdo->exec("
                UPDATE sending_accounts sa
                JOIN workspace_members wm ON wm.user_id = sa.user_id
                SET sa.workspace_id = wm.workspace_id
                WHERE sa.workspace_id IS NULL
            ");
            echo "  - sending_accounts: backfilled $result rows\n";
        }
    }
} catch (Exception $e) {
    echo "  ✗ sending_accounts backfill error: " . $e->getMessage() . "\n";
}

// Backfill sequences
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'sequences'");
    if ($stmt->fetchColumn()) {
        $stmt = $pdo->query("SHOW COLUMNS FROM sequences LIKE 'workspace_id'");
        if ($stmt->fetch()) {
            $result = $pdo->exec("
                UPDATE sequences s
                JOIN workspace_members wm ON wm.user_id = s.user_id
                SET s.workspace_id = wm.workspace_id
                WHERE s.workspace_id IS NULL
            ");
            echo "  - sequences: backfilled $result rows\n";
        }
    }
} catch (Exception $e) {
    echo "  ✗ sequences backfill error: " . $e->getMessage() . "\n";
}

// Backfill recipients from campaigns
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'recipients'");
    if ($stmt->fetchColumn()) {
        $stmt = $pdo->query("SHOW COLUMNS FROM recipients LIKE 'workspace_id'");
        if ($stmt->fetch()) {
            $result = $pdo->exec("
                UPDATE recipients r
                JOIN campaigns c ON c.id = r.campaign_id
                SET r.workspace_id = c.workspace_id
                WHERE r.workspace_id IS NULL AND c.workspace_id IS NOT NULL
            ");
            echo "  - recipients (from campaigns): backfilled $result rows\n";
            
            // Also try from user_id
            $result = $pdo->exec("
                UPDATE recipients r
                JOIN workspace_members wm ON wm.user_id = r.user_id
                SET r.workspace_id = wm.workspace_id
                WHERE r.workspace_id IS NULL
            ");
            echo "  - recipients (from user_id): backfilled $result rows\n";
        }
    }
} catch (Exception $e) {
    echo "  ✗ recipients backfill error: " . $e->getMessage() . "\n";
}

// Backfill contacts
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'contacts'");
    if ($stmt->fetchColumn()) {
        $stmt = $pdo->query("SHOW COLUMNS FROM contacts LIKE 'workspace_id'");
        if ($stmt->fetch()) {
            $result = $pdo->exec("
                UPDATE contacts c
                JOIN workspace_members wm ON wm.user_id = c.user_id
                SET c.workspace_id = wm.workspace_id
                WHERE c.workspace_id IS NULL
            ");
            echo "  - contacts: backfilled $result rows\n";
        }
    }
} catch (Exception $e) {
    echo "  ✗ contacts backfill error: " . $e->getMessage() . "\n";
}

// Backfill tags
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'tags'");
    if ($stmt->fetchColumn()) {
        $stmt = $pdo->query("SHOW COLUMNS FROM tags LIKE 'workspace_id'");
        if ($stmt->fetch()) {
            $result = $pdo->exec("
                UPDATE tags t
                JOIN workspace_members wm ON wm.user_id = t.user_id
                SET t.workspace_id = wm.workspace_id
                WHERE t.workspace_id IS NULL
            ");
            echo "  - tags: backfilled $result rows\n";
        }
    }
} catch (Exception $e) {
    echo "  ✗ tags backfill error: " . $e->getMessage() . "\n";
}

// Backfill settings
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'settings'");
    if ($stmt->fetchColumn()) {
        $stmt = $pdo->query("SHOW COLUMNS FROM settings LIKE 'workspace_id'");
        if ($stmt->fetch()) {
            $result = $pdo->exec("
                UPDATE settings s
                JOIN workspace_members wm ON wm.user_id = s.user_id
                SET s.workspace_id = wm.workspace_id
                WHERE s.workspace_id IS NULL
            ");
            echo "  - settings (from workspace_members): backfilled $result rows\n";

            // Final fallback for any rows still NULL
            $result = $pdo->exec("UPDATE settings SET workspace_id = 1 WHERE workspace_id IS NULL");
            echo "  - settings (fallback workspace 1): backfilled $result rows\n";
        }
    }
} catch (Exception $e) {
    echo "  ✗ settings backfill error: " . $e->getMessage() . "\n";
}

echo "\n=== 6. Seeding user_company_access ===\n";
try {
    $result = $pdo->exec("
        INSERT IGNORE INTO user_company_access (workspace_id, user_id, company_id, role)
        SELECT c.workspace_id, c.user_id, c.id, 'owner'
        FROM companies c
        WHERE c.workspace_id IS NOT NULL AND c.user_id IS NOT NULL
    ");
    echo "  - Seeded $result new access entries\n";
} catch (Exception $e) {
    echo "  ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== 7. Creating default company per workspace (if missing) ===\n";
try {
    // Find workspaces without any companies
    $stmt = $pdo->query("
        SELECT w.id, w.name, w.owner_user_id
        FROM workspaces w
        WHERE NOT EXISTS (SELECT 1 FROM companies c WHERE c.workspace_id = w.id)
    ");
    $workspacesWithoutCompanies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($workspacesWithoutCompanies)) {
        echo "  ✓ All workspaces have at least one company\n";
    } else {
        foreach ($workspacesWithoutCompanies as $ws) {
            $wsId = (int)$ws['id'];
            $wsName = $ws['name'];
            $ownerId = (int)$ws['owner_user_id'];
            
            // Create default company
            $stmt = $pdo->prepare("
                INSERT INTO companies (workspace_id, user_id, name, status, created_at, updated_at)
                VALUES (?, ?, ?, 'active', NOW(), NOW())
            ");
            $stmt->execute([$wsId, $ownerId, 'Default Company']);
            $companyId = (int)$pdo->lastInsertId();
            
            // Grant owner access
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO user_company_access (workspace_id, user_id, company_id, role)
                VALUES (?, ?, ?, 'owner')
            ");
            $stmt->execute([$wsId, $ownerId, $companyId]);
            
            echo "  + Created 'Default Company' for workspace '$wsName' (ID: $wsId)\n";
        }
    }
} catch (Exception $e) {
    echo "  ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== 8. Final verification ===\n";
$hasIssues = false;

foreach ($workspaceTables as $table) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if (!$stmt->fetchColumn()) continue;
        
        $stmt = $pdo->query("SHOW COLUMNS FROM `$table` LIKE 'workspace_id'");
        if (!$stmt->fetch()) continue;
        
        $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM `$table` WHERE workspace_id IS NULL");
        $nullCount = (int)$stmt->fetch()['cnt'];
        
        if ($nullCount > 0) {
            echo "  ⚠ $table: still has $nullCount rows with NULL workspace_id\n";
            $hasIssues = true;
        }
    } catch (Exception $e) {
        // Skip
    }
}

if (!$hasIssues) {
    echo "  ✓ All checked tables have workspace_id populated\n";
}

echo "\n=== Verification Complete ===\n";
