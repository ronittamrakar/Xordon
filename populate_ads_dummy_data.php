<?php
require_once __DIR__ . '/backend/src/bootstrap.php';
require_once __DIR__ . '/backend/src/Database.php';

$workspaceId = 1;
$companyId = 1;
$db = Database::conn();

// 1. Create dummy accounts if none
$stmt = $db->query("SELECT COUNT(*) FROM ad_accounts");
if ($stmt->fetchColumn() == 0) {
    echo "Creating dummy ad accounts...\n";
    $accounts = [
        ['platform' => 'google_ads', 'name' => 'Google Ads Account', 'id' => '123-456-7890'],
        ['platform' => 'facebook_ads', 'name' => 'Facebook Ads Account', 'id' => 'act_123456789'],
    ];
    
    foreach ($accounts as $acc) {
        $stmt = $db->prepare("INSERT INTO ad_accounts (workspace_id, company_id, platform, account_name, platform_account_id, status) VALUES (?, ?, ?, ?, ?, 'connected')");
        $stmt->execute([$workspaceId, $companyId, $acc['platform'], $acc['name'], $acc['id']]);
    }
} else {
    echo "Ad accounts already exist.\n";
}

// 2. Create dummy campaigns if none
$stmt = $db->query("SELECT COUNT(*) FROM ad_campaigns");
if ($stmt->fetchColumn() == 0) {
    echo "Creating dummy campaigns...\n";
    
    // Get account IDs
    $accStmt = $db->prepare("SELECT id, platform FROM ad_accounts WHERE workspace_id = ? AND company_id = ?");
    $accStmt->execute([$workspaceId, $companyId]);
    $accounts = $accStmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($accounts as $acc) {
        $campaigns = [
            ['name' => 'Brand Awareness ' . $acc['platform'], 'status' => 'enabled', 'budget' => 50.00],
            ['name' => 'Retargeting ' . $acc['platform'], 'status' => 'paused', 'budget' => 25.00],
        ];
        
        foreach ($campaigns as $camp) {
            $stmt = $db->prepare("
                INSERT INTO ad_campaigns (workspace_id, company_id, ad_account_id, name, status, daily_budget, start_date)
                VALUES (?, ?, ?, ?, ?, ?, CURDATE())
            ");
            $stmt->execute([$workspaceId, $companyId, $acc['id'], $camp['name'], $camp['status'], $camp['budget']]);
            $campId = $db->lastInsertId();
            
            // Add dummy metrics for this campaign
            echo "  Adding metrics for campaign $campId...\n";
            for ($i = 0; $i < 30; $i++) {
                $date = date('Y-m-d', strtotime("-$i days"));
                
                // Randomish data
                $impressions = rand(100, 1000);
                $clicks = rand(5, 50);
                $conversions = rand(0, 5);
                $spend = $clicks * rand(1, 3);
                $val = $conversions * 50;
                
                $mStmt = $db->prepare("
                    INSERT INTO ad_campaign_metrics (campaign_id, metric_date, spend, impressions, clicks, conversions, conversion_value)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $mStmt->execute([$campId, $date, $spend, $impressions, $clicks, $conversions, $val]);
            }
        }
    }
} else {
    echo "Campaigns already exist.\n";
}

echo "Dummy data population complete.\n";
