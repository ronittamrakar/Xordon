<?php
/**
 * Test Automation APIs directly without HTTP
 */

require_once __DIR__ . '/../src/Database.php';

echo "=== Testing Automation APIs ===\n\n";

$pdo = Database::conn();

// Test 1: Automation Recipes
echo "1. Testing Automation Recipes...\n";
$stmt = $pdo->query("SELECT id, name, category, target_audience, status FROM automation_recipes WHERE is_system = 1 LIMIT 5");
$recipes = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "   Found " . count($recipes) . " recipes (showing first 5):\n";
foreach ($recipes as $r) {
    echo "   - [{$r['id']}] {$r['name']} ({$r['category']}, {$r['target_audience']})\n";
}

// Test 2: Follow-up Automations
echo "\n2. Testing Follow-up Automations...\n";
$stmt = $pdo->query("SELECT id, name, channel, trigger_type, is_active FROM followup_automations WHERE user_id = 1 LIMIT 5");
$automations = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "   Found " . count($automations) . " automations (showing first 5):\n";
foreach ($automations as $a) {
    $status = $a['is_active'] ? 'active' : 'inactive';
    echo "   - [{$a['id']}] {$a['name']} ({$a['channel']}, {$a['trigger_type']}, $status)\n";
}

// Test 3: Campaign Flows
echo "\n3. Testing Campaign Flows...\n";
$stmt = $pdo->query("
    SELECT f.id, f.name, f.status, f.flow_type, 
           COALESCE(s.total_contacts, 0) as contacts,
           COALESCE(s.emails_sent, 0) as emails,
           JSON_LENGTH(f.nodes) as node_count
    FROM campaign_flows f
    LEFT JOIN flow_stats s ON f.id = s.flow_id
    WHERE f.user_id = 1 
    LIMIT 5
");
$flows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "   Found " . count($flows) . " flows (showing first 5):\n";
foreach ($flows as $f) {
    echo "   - [{$f['id']}] {$f['name']} ({$f['status']}, {$f['node_count']} nodes, {$f['contacts']} contacts)\n";
}

// Test 4: Verify connections
echo "\n4. Checking entity connections...\n";

// Check if user_automation_instances has automation_id and flow_id columns
$stmt = $pdo->query("SHOW COLUMNS FROM user_automation_instances LIKE 'automation_id'");
$hasAutomationId = $stmt->rowCount() > 0;
echo "   - user_automation_instances.automation_id: " . ($hasAutomationId ? "EXISTS" : "MISSING") . "\n";

$stmt = $pdo->query("SHOW COLUMNS FROM user_automation_instances LIKE 'flow_id'");
$hasFlowId = $stmt->rowCount() > 0;
echo "   - user_automation_instances.flow_id: " . ($hasFlowId ? "EXISTS" : "MISSING") . "\n";

// Check if campaign_flows has automation_id column
$stmt = $pdo->query("SHOW COLUMNS FROM campaign_flows LIKE 'automation_id'");
$flowHasAutomationId = $stmt->rowCount() > 0;
echo "   - campaign_flows.automation_id: " . ($flowHasAutomationId ? "EXISTS" : "MISSING") . "\n";

// Test 5: Verify automation_queue table
echo "\n5. Checking automation queue...\n";
$stmt = $pdo->query("SHOW TABLES LIKE 'automation_queue'");
$hasQueue = $stmt->rowCount() > 0;
echo "   - automation_queue table: " . ($hasQueue ? "EXISTS" : "MISSING") . "\n";

$stmt = $pdo->query("SHOW TABLES LIKE 'automation_logs'");
$hasLogs = $stmt->rowCount() > 0;
echo "   - automation_logs table: " . ($hasLogs ? "EXISTS" : "MISSING") . "\n";

// Test 6: Count totals
echo "\n6. Final counts...\n";
$stmt = $pdo->query("SELECT COUNT(*) FROM automation_recipes WHERE is_system = 1");
echo "   - System Recipes: " . $stmt->fetchColumn() . "\n";

$stmt = $pdo->query("SELECT COUNT(*) FROM followup_automations WHERE user_id = 1");
echo "   - Automations: " . $stmt->fetchColumn() . "\n";

$stmt = $pdo->query("SELECT COUNT(*) FROM campaign_flows WHERE user_id = 1");
echo "   - Flows: " . $stmt->fetchColumn() . "\n";

echo "\n=== All Tests Complete ===\n";
