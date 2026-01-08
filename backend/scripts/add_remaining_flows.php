<?php
require_once __DIR__ . '/../src/Database.php';

$pdo = Database::conn();

// Add 2 more flows to reach 50
$pdo->exec("INSERT INTO campaign_flows (user_id, name, description, status, nodes, flow_type, created_at, updated_at) VALUES 
(1, 'App Re-engagement', 'Bring users back to app', 'active', '[{\"id\":\"trigger-1\",\"type\":\"trigger\",\"position\":{\"x\":250,\"y\":50},\"data\":{\"label\":\"App Inactive\",\"trigger_type\":\"app_inactive_14_days\"}},{\"id\":\"sms-1\",\"type\":\"sms\",\"position\":{\"x\":250,\"y\":150},\"data\":{\"label\":\"SMS\",\"message\":\"New features await!\"}}]', 'automation', NOW(), NOW()),
(1, 'Warranty Registration', 'Register warranty flow', 'active', '[{\"id\":\"trigger-1\",\"type\":\"trigger\",\"position\":{\"x\":250,\"y\":50},\"data\":{\"label\":\"Order Complete\",\"trigger_type\":\"order_completed\"}},{\"id\":\"delay-1\",\"type\":\"delay\",\"position\":{\"x\":250,\"y\":150},\"data\":{\"label\":\"Wait 3d\",\"delay_amount\":72,\"delay_unit\":\"hours\"}},{\"id\":\"email-1\",\"type\":\"email\",\"position\":{\"x\":250,\"y\":250},\"data\":{\"label\":\"Register\",\"subject\":\"Register Your Warranty\"}}]', 'automation', NOW(), NOW())");

// Add flow stats for new flows
$stmt = $pdo->query("SELECT id FROM campaign_flows WHERE user_id = 1 AND name IN ('App Re-engagement', 'Warranty Registration')");
$flowIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
foreach ($flowIds as $flowId) {
    $pdo->exec("INSERT IGNORE INTO flow_stats (flow_id, total_contacts, emails_sent, sms_sent, conversions) VALUES ($flowId, " . rand(50, 500) . ", " . rand(100, 1000) . ", " . rand(50, 300) . ", " . rand(10, 50) . ")");
}

// Count totals
$stmt = $pdo->query("SELECT COUNT(*) FROM campaign_flows WHERE user_id = 1");
echo "Total flows: " . $stmt->fetchColumn() . "\n";

$stmt = $pdo->query("SELECT COUNT(*) FROM automation_recipes WHERE is_system = 1");
echo "Total recipes: " . $stmt->fetchColumn() . "\n";

$stmt = $pdo->query("SELECT COUNT(*) FROM followup_automations WHERE user_id = 1");
echo "Total automations: " . $stmt->fetchColumn() . "\n";
