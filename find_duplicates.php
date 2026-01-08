<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=xordon', 'root', '');

echo "=== CHECKING FOR DUPLICATES ===\n\n";

// Check automation_workflows duplicates
echo "--- automation_workflows (V2 Workflows) ---\n";
$stmt = $pdo->query("
    SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM automation_workflows
    GROUP BY name
    HAVING count > 1
    ORDER BY count DESC
");
$workflowDupes = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (empty($workflowDupes)) {
    echo "No duplicates found.\n";
} else {
    foreach ($workflowDupes as $dupe) {
        echo "Name: {$dupe['name']} - Count: {$dupe['count']} - IDs: {$dupe['ids']}\n";
    }
}

echo "\n--- followup_automations (V1 Triggers/Rules) ---\n";
$stmt = $pdo->query("
    SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM followup_automations
    GROUP BY name
    HAVING count > 1
    ORDER BY count DESC
");
$automationDupes = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (empty($automationDupes)) {
    echo "No duplicates found.\n";
} else {
    foreach ($automationDupes as $dupe) {
        echo "Name: {$dupe['name']} - Count: {$dupe['count']} - IDs: {$dupe['ids']}\n";
    }
}

echo "\n--- automation_recipes (Templates) ---\n";
$stmt = $pdo->query("
    SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM automation_recipes
    GROUP BY name
    HAVING count > 1
    ORDER BY count DESC
");
$recipeDupes = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (empty($recipeDupes)) {
    echo "No duplicates found.\n";
} else {
    foreach ($recipeDupes as $dupe) {
        echo "Name: {$dupe['name']} - Count: {$dupe['count']} - IDs: {$dupe['ids']}\n";
    }
}

echo "\n=== SUMMARY ===\n";
echo "Workflow duplicates: " . count($workflowDupes) . "\n";
echo "Automation duplicates: " . count($automationDupes) . "\n";
echo "Recipe duplicates: " . count($recipeDupes) . "\n";
