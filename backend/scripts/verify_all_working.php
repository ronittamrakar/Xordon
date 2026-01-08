<?php
/**
 * Comprehensive verification of automation system
 */

require_once __DIR__ . '/../src/Database.php';

echo "=== Comprehensive Automation System Verification ===\n\n";

$pdo = Database::conn();
$errors = [];
$warnings = [];

// 1. Verify all tables exist
echo "1. Checking required tables...\n";
$requiredTables = [
    'automation_recipes',
    'user_automation_instances', 
    'followup_automations',
    'campaign_flows',
    'flow_stats',
    'automation_queue',
    'automation_logs',
    'automation_rate_limits'
];

foreach ($requiredTables as $table) {
    $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
    if ($stmt->rowCount() > 0) {
        echo "   ✓ $table\n";
    } else {
        echo "   ✗ $table (MISSING)\n";
        $errors[] = "Table $table is missing";
    }
}

// 2. Verify data counts
echo "\n2. Checking data counts...\n";
$counts = [
    'automation_recipes (system)' => "SELECT COUNT(*) FROM automation_recipes WHERE is_system = 1",
    'followup_automations (user 1)' => "SELECT COUNT(*) FROM followup_automations WHERE user_id = 1",
    'campaign_flows (user 1)' => "SELECT COUNT(*) FROM campaign_flows WHERE user_id = 1",
    'flow_stats' => "SELECT COUNT(*) FROM flow_stats"
];

foreach ($counts as $name => $sql) {
    try {
        $stmt = $pdo->query($sql);
        $count = $stmt->fetchColumn();
        $status = $count > 0 ? "✓" : "⚠";
        echo "   $status $name: $count\n";
        if ($count == 0) {
            $warnings[] = "$name has no data";
        }
    } catch (Exception $e) {
        echo "   ✗ $name: ERROR - " . $e->getMessage() . "\n";
        $errors[] = "Failed to query $name";
    }
}

// 3. Verify recipe categories
echo "\n3. Checking recipe categories...\n";
$stmt = $pdo->query("SELECT category, COUNT(*) as cnt FROM automation_recipes WHERE is_system = 1 GROUP BY category ORDER BY cnt DESC");
$categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($categories as $cat) {
    echo "   - {$cat['category']}: {$cat['cnt']} recipes\n";
}

// 4. Verify automation channels
echo "\n4. Checking automation channels...\n";
$stmt = $pdo->query("SELECT channel, COUNT(*) as cnt FROM followup_automations WHERE user_id = 1 GROUP BY channel ORDER BY cnt DESC");
$channels = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($channels as $ch) {
    echo "   - {$ch['channel']}: {$ch['cnt']} automations\n";
}

// 5. Verify flow statuses
echo "\n5. Checking flow statuses...\n";
$stmt = $pdo->query("SELECT status, COUNT(*) as cnt FROM campaign_flows WHERE user_id = 1 GROUP BY status");
$statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($statuses as $s) {
    echo "   - {$s['status']}: {$s['cnt']} flows\n";
}

// 6. Verify flow nodes are valid JSON
echo "\n6. Validating flow node data...\n";
$stmt = $pdo->query("SELECT id, name, nodes FROM campaign_flows WHERE user_id = 1");
$flows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$validFlows = 0;
$invalidFlows = 0;
foreach ($flows as $flow) {
    $nodes = json_decode($flow['nodes'], true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($nodes)) {
        $validFlows++;
    } else {
        $invalidFlows++;
        $warnings[] = "Flow {$flow['id']} ({$flow['name']}) has invalid JSON nodes";
    }
}
echo "   ✓ Valid flows: $validFlows\n";
if ($invalidFlows > 0) {
    echo "   ⚠ Invalid flows: $invalidFlows\n";
}

// 7. Verify recipe steps are valid JSON
echo "\n7. Validating recipe step data...\n";
$stmt = $pdo->query("SELECT id, name, steps FROM automation_recipes WHERE is_system = 1");
$recipes = $stmt->fetchAll(PDO::FETCH_ASSOC);
$validRecipes = 0;
$invalidRecipes = 0;
foreach ($recipes as $recipe) {
    $steps = json_decode($recipe['steps'], true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($steps)) {
        $validRecipes++;
    } else {
        $invalidRecipes++;
        $warnings[] = "Recipe {$recipe['id']} ({$recipe['name']}) has invalid JSON steps";
    }
}
echo "   ✓ Valid recipes: $validRecipes\n";
if ($invalidRecipes > 0) {
    echo "   ⚠ Invalid recipes: $invalidRecipes\n";
}

// 8. Verify automation trigger/action configs are valid JSON
echo "\n8. Validating automation config data...\n";
$stmt = $pdo->query("SELECT id, name, trigger_conditions, action_config FROM followup_automations WHERE user_id = 1");
$automations = $stmt->fetchAll(PDO::FETCH_ASSOC);
$validAutomations = 0;
$invalidAutomations = 0;
foreach ($automations as $auto) {
    $trigger = json_decode($auto['trigger_conditions'], true);
    $action = json_decode($auto['action_config'], true);
    if (json_last_error() === JSON_ERROR_NONE) {
        $validAutomations++;
    } else {
        $invalidAutomations++;
        $warnings[] = "Automation {$auto['id']} ({$auto['name']}) has invalid JSON config";
    }
}
echo "   ✓ Valid automations: $validAutomations\n";
if ($invalidAutomations > 0) {
    echo "   ⚠ Invalid automations: $invalidAutomations\n";
}

// 9. Check column existence for connections
echo "\n9. Checking connection columns...\n";
$columnChecks = [
    ['user_automation_instances', 'automation_id'],
    ['user_automation_instances', 'flow_id'],
    ['campaign_flows', 'automation_id'],
    ['campaign_flows', 'flow_type']
];
foreach ($columnChecks as $check) {
    $stmt = $pdo->query("SHOW COLUMNS FROM {$check[0]} LIKE '{$check[1]}'");
    if ($stmt->rowCount() > 0) {
        echo "   ✓ {$check[0]}.{$check[1]}\n";
    } else {
        echo "   ✗ {$check[0]}.{$check[1]} (MISSING)\n";
        $errors[] = "Column {$check[0]}.{$check[1]} is missing";
    }
}

// Summary
echo "\n=== Summary ===\n";
if (empty($errors) && empty($warnings)) {
    echo "✓ All checks passed! System is ready.\n";
} else {
    if (!empty($errors)) {
        echo "\n❌ Errors (" . count($errors) . "):\n";
        foreach ($errors as $e) {
            echo "   - $e\n";
        }
    }
    if (!empty($warnings)) {
        echo "\n⚠ Warnings (" . count($warnings) . "):\n";
        foreach (array_slice($warnings, 0, 5) as $w) {
            echo "   - $w\n";
        }
        if (count($warnings) > 5) {
            echo "   ... and " . (count($warnings) - 5) . " more\n";
        }
    }
}

echo "\n=== Verification Complete ===\n";
