<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=xordon', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== REMOVING DUPLICATES ===\n\n";

$deletedAutomations = 0;
$deletedRecipes = 0;

// Remove duplicate followup_automations (keep oldest by ID)
echo "--- Removing duplicate followup_automations ---\n";
$stmt = $pdo->query("
    SELECT name, MIN(id) as keep_id, GROUP_CONCAT(id ORDER BY id) as all_ids
    FROM followup_automations
    GROUP BY name
    HAVING COUNT(*) > 1
");
$automationDupes = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($automationDupes as $dupe) {
    $allIds = explode(',', $dupe['all_ids']);
    $keepId = (int)$dupe['keep_id'];
    $deleteIds = array_filter($allIds, fn($id) => (int)$id != $keepId);
    
    if (!empty($deleteIds)) {
        $deleteIds = array_map('intval', $deleteIds); // Ensure integers
        $placeholders = implode(',', $deleteIds);
        
        // Delete from followup_automations
        $deleteStmt = $pdo->prepare("DELETE FROM followup_automations WHERE id IN ($placeholders)");
        $deleteStmt->execute();
        $deleted = $deleteStmt->rowCount();
        $deletedAutomations += $deleted;
        
        echo "Removed {$deleted} duplicate(s) of '{$dupe['name']}' (kept ID: {$keepId})\n";
    }
}

// Remove duplicate automation_recipes (keep oldest by ID)
echo "\n--- Removing duplicate automation_recipes ---\n";
$stmt = $pdo->query("
    SELECT name, MIN(id) as keep_id, GROUP_CONCAT(id ORDER BY id) as all_ids
    FROM automation_recipes
    GROUP BY name
    HAVING COUNT(*) > 1
");
$recipeDupes = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($recipeDupes as $dupe) {
    $allIds = explode(',', $dupe['all_ids']);
    $keepId = (int)$dupe['keep_id'];
    $deleteIds = array_filter($allIds, fn($id) => (int)$id != $keepId);
    
    if (!empty($deleteIds)) {
        $deleteIds = array_map('intval', $deleteIds); // Ensure integers
        $placeholders = implode(',', $deleteIds);
        
        // First, update any references in automation_workflows
        $updateStmt = $pdo->prepare("UPDATE automation_workflows SET recipe_id = $keepId WHERE recipe_id IN ($placeholders)");
        $updateStmt->execute();
        
        // Update any references in followup_automations
        $updateStmt2 = $pdo->prepare("UPDATE followup_automations SET recipe_id = $keepId WHERE recipe_id IN ($placeholders)");
        $updateStmt2->execute();
        
        // Update any references in user_automation_instances
        $updateStmt3 = $pdo->prepare("UPDATE user_automation_instances SET recipe_id = $keepId WHERE recipe_id IN ($placeholders)");
        $updateStmt3->execute();
        
        // Delete from automation_recipes
        $deleteStmt = $pdo->prepare("DELETE FROM automation_recipes WHERE id IN ($placeholders)");
        $deleteStmt->execute();
        $deleted = $deleteStmt->rowCount();
        $deletedRecipes += $deleted;
        
        echo "Removed {$deleted} duplicate(s) of '{$dupe['name']}' (kept ID: {$keepId})\n";
    }
}

echo "\n=== SUMMARY ===\n";
echo "Total automations removed: {$deletedAutomations}\n";
echo "Total recipes removed: {$deletedRecipes}\n";
echo "\nDone! Duplicates have been removed.\n";
