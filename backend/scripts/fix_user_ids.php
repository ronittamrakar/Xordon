<?php
require_once __DIR__ . '/../src/Database.php';

$pdo = Database::conn();

// Get the user ID that has workspace access
$stmt = $pdo->query("SELECT user_id FROM workspace_members WHERE workspace_id = 1 LIMIT 1");
$userId = $stmt->fetchColumn();

if (!$userId) {
    echo "No user found with workspace access!\n";
    exit(1);
}

echo "Updating all seeded data to use user_id = $userId\n\n";

// Update followup_automations
$stmt = $pdo->prepare("UPDATE followup_automations SET user_id = ? WHERE user_id = 1");
$stmt->execute([$userId]);
echo "Updated " . $stmt->rowCount() . " followup_automations\n";

// Update campaign_flows
$stmt = $pdo->prepare("UPDATE campaign_flows SET user_id = ? WHERE user_id = 1");
$stmt->execute([$userId]);
echo "Updated " . $stmt->rowCount() . " campaign_flows\n";

// Update user_automation_instances
$stmt = $pdo->prepare("UPDATE user_automation_instances SET user_id = ? WHERE user_id = 1");
$stmt->execute([$userId]);
echo "Updated " . $stmt->rowCount() . " user_automation_instances\n";

// Verify counts
echo "\nVerifying data for user $userId:\n";
$stmt = $pdo->prepare("SELECT COUNT(*) FROM followup_automations WHERE user_id = ?");
$stmt->execute([$userId]);
echo "  - followup_automations: " . $stmt->fetchColumn() . "\n";

$stmt = $pdo->prepare("SELECT COUNT(*) FROM campaign_flows WHERE user_id = ?");
$stmt->execute([$userId]);
echo "  - campaign_flows: " . $stmt->fetchColumn() . "\n";

echo "\nDone!\n";
