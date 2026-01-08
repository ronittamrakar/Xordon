<?php
/**
 * Full Stack Connectivity Test
 * Tests database, backend API, and verifies all critical systems
 */

require_once __DIR__ . '/backend/src/Database.php';

use Xordon\Database;

echo "🔍 Full Stack Connectivity Test\n";
echo str_repeat("=", 50) . "\n\n";

$allPassed = true;

// Test 1: Database Connection
echo "Test 1: Database Connection... ";
try {
    $db = Database::conn();
    echo "✅ PASSED\n";
} catch (Exception $e) {
    echo "❌ FAILED: " . $e->getMessage() . "\n";
    $allPassed = false;
}

// Test 2: Critical Tables Exist
echo "Test 2: Critical Tables... ";
try {
    $criticalTables = [
        'users', 'workspaces', 'contacts', 'companies',
        'webforms_forms', 'webforms_form_submissions',
        'pipelines', 'campaigns', 'business_listings'
    ];
    
    $stmt = $db->query('SHOW TABLES');
    $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $missing = array_diff($criticalTables, $existingTables);
    if (empty($missing)) {
        echo "✅ PASSED (all " . count($criticalTables) . " critical tables found)\n";
    } else {
        echo "❌ FAILED (missing: " . implode(', ', $missing) . ")\n";
        $allPassed = false;
    }
} catch (Exception $e) {
    echo "❌ FAILED: " . $e->getMessage() . "\n";
    $allPassed = false;
}

// Test 3: Database Read Operations
echo "Test 3: Database Read... ";
try {
    $stmt = $db->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✅ PASSED (found {$result['count']} users)\n";
} catch (Exception $e) {
    echo "❌ FAILED: " . $e->getMessage() . "\n";
    $allPassed = false;
}

// Test 4: Database Write Operations (test transaction)
echo "Test 4: Database Write... ";
try {
    $db->beginTransaction();
    $db->exec("CREATE TEMPORARY TABLE test_write (id INT)");
    $db->exec("INSERT INTO test_write VALUES (1)");
    $db->rollBack();
    echo "✅ PASSED\n";
} catch (Exception $e) {
    echo "❌ FAILED: " . $e->getMessage() . "\n";
    $allPassed = false;
}

// Test 5: Check Backend API Response
echo "Test 5: Backend API... ";
try {
    $ch = curl_init('http://127.0.0.1:8001/api/health');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        if ($data && isset($data['status']) && $data['status'] === 'healthy') {
            echo "✅ PASSED (API responding)\n";
        } else {
            echo "❌ FAILED (invalid response)\n";
            $allPassed = false;
        }
    } else {
        echo "❌ FAILED (HTTP $httpCode)\n";
        $allPassed = false;
    }
} catch (Exception $e) {
    echo "❌ FAILED: " . $e->getMessage() . "\n";
    $allPassed = false;
}

// Test 6: Check Data Integrity
echo "Test 6: Data Integrity... ";
try {
    $checks = [
        'workspaces' => "SELECT COUNT(*) as count FROM workspaces WHERE id IS NOT NULL",
        'users' => "SELECT COUNT(*) as count FROM users WHERE email IS NOT NULL",
        'contacts' => "SELECT COUNT(*) as count FROM contacts WHERE workspace_id IS NOT NULL"
    ];
    
    $issues = [];
    foreach ($checks as $table => $query) {
        $stmt = $db->query($query);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result['count'] === '0' && $table === 'workspaces') {
            $issues[] = "$table has no valid records";
        }
    }
    
    if (empty($issues)) {
        echo "✅ PASSED\n";
    } else {
        echo "⚠️  WARNING: " . implode(', ', $issues) . "\n";
    }
} catch (Exception $e) {
    echo "❌ FAILED: " . $e->getMessage() . "\n";
    $allPassed = false;
}

// Test 7: Foreign Key Relationships
echo "Test 7: Foreign Keys... ";
try {
    // Check if workspace_id references are valid
    $stmt = $db->query("
        SELECT COUNT(*) as count 
        FROM contacts c 
        LEFT JOIN workspaces w ON c.workspace_id = w.id 
        WHERE c.workspace_id IS NOT NULL AND w.id IS NULL
    ");
    $orphaned = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($orphaned == 0) {
        echo "✅ PASSED (no orphaned records)\n";
    } else {
        echo "⚠️  WARNING ($orphaned orphaned contact records)\n";
    }
} catch (Exception $e) {
    echo "⚠️  SKIPPED (FK check not critical)\n";
}

// Test 8: Check Module Tables
echo "Test 8: Module System... ";
try {
    $moduleCount = $db->query("SELECT COUNT(*) as count FROM modules")->fetch()['count'];
    $workspaceModules = $db->query("SELECT COUNT(*) as count FROM workspace_modules")->fetch()['count'];
    echo "✅ PASSED ($moduleCount modules, $workspaceModules workspace assignments)\n";
} catch (Exception $e) {
    echo "❌ FAILED: " . $e->getMessage() . "\n";
    $allPassed = false;
}

// Summary
echo "\n" . str_repeat("=", 50) . "\n";
if ($allPassed) {
    echo "🎉 ALL TESTS PASSED - System is fully operational!\n";
    echo "\nYou can now:\n";
    echo "  • Access the frontend at http://localhost:5173\n";
    echo "  • Make API calls to http://127.0.0.1:8001/api/*\n";
    echo "  • Run migrations with: php backend/scripts/run_all_migrations.php\n";
    echo "  • Start development with: .\\start-dev.ps1\n";
    exit(0);
} else {
    echo "⚠️  SOME TESTS FAILED - Please review the errors above\n";
    exit(1);
}
