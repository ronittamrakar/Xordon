<?php
require_once __DIR__ . '/../../src/auth_check.php';
require_once __DIR__ . '/../../src/db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db = getDbConnection();
$userId = $_SESSION['user_id'];
$workspaceId = $_SESSION['workspace_id'] ?? null;

if (!$workspaceId) {
    http_response_code(400);
    echo json_encode(['error' => 'No workspace selected']);
    exit;
}

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get date range from query params (default to last 30 days)
$endDate = $_GET['end_date'] ?? date('Y-m-d');
$startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));

// Spend by platform
$stmt = $db->prepare("
    SELECT 
        a.platform,
        COUNT(DISTINCT c.id) as campaign_count,
        COALESCE(SUM(c.total_spent), 0) as total_spent,
        COALESCE(SUM(c.impressions), 0) as impressions,
        COALESCE(SUM(c.clicks), 0) as clicks
    FROM ad_accounts a
    LEFT JOIN ad_campaigns c ON a.id = c.account_id
    WHERE a.workspace_id = ?
    GROUP BY a.platform
");
$stmt->execute([$workspaceId]);
$platformStats = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Format platform data
foreach ($platformStats as &$stat) {
    $stat['total_spent'] = (float) $stat['total_spent'];
    $stat['impressions'] = (int) $stat['impressions'];
    $stat['clicks'] = (int) $stat['clicks'];
}

// Daily spend trend (last 30 days)
$stmt = $db->prepare("
    SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_spent), 0) as spent
    FROM ad_campaigns c
    JOIN ad_accounts a ON c.account_id = a.id
    WHERE a.workspace_id = ?
      AND c.created_at >= ?
      AND c.created_at <= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
");
$stmt->execute([$workspaceId, $startDate, $endDate]);
$dailySpend = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($dailySpend as &$day) {
    $day['spent'] = (float) $day['spent'];
}

// Overall metrics
$stmt = $db->prepare("
    SELECT 
        COALESCE(SUM(c.total_spent), 0) as total_spent,
        COALESCE(SUM(c.impressions), 0) as impressions,
        COALESCE(SUM(c.clicks), 0) as clicks,
        COUNT(DISTINCT c.id) as active_campaigns,
        COALESCE(AVG(c.ctr), 0) as avg_ctr,
        COALESCE(AVG(c.cpc), 0) as avg_cpc
    FROM ad_campaigns c
    JOIN ad_accounts a ON c.account_id = a.id
    WHERE a.workspace_id = ?
      AND c.status = 'active'
");
$stmt->execute([$workspaceId]);
$metrics = $stmt->fetch(PDO::FETCH_ASSOC);

$metrics['total_spent'] = (float) $metrics['total_spent'];
$metrics['impressions'] = (int) $metrics['impressions'];
$metrics['clicks'] = (int) $metrics['clicks'];
$metrics['active_campaigns'] = (int) $metrics['active_campaigns'];
$metrics['avg_ctr'] = (float) $metrics['avg_ctr'];
$metrics['avg_cpc'] = (float) $metrics['avg_cpc'];

// Top performing campaigns
$stmt = $db->prepare("
    SELECT 
        c.id,
        c.name,
        c.platform,
        c.total_spent,
        c.impressions,
        c.clicks,
        c.conversions,
        c.ctr,
        c.cpc
    FROM ad_campaigns c
    JOIN ad_accounts a ON c.account_id = a.id
    WHERE a.workspace_id = ?
      AND c.status = 'active'
    ORDER BY c.conversions DESC
    LIMIT 10
");
$stmt->execute([$workspaceId]);
$topCampaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($topCampaigns as &$campaign) {
    $campaign['total_spent'] = (float) ($campaign['total_spent'] ?? 0);
    $campaign['impressions'] = (int) ($campaign['impressions'] ?? 0);
    $campaign['clicks'] = (int) ($campaign['clicks'] ?? 0);
    $campaign['conversions'] = (int) ($campaign['conversions'] ?? 0);
    $campaign['ctr'] = (float) ($campaign['ctr'] ?? 0);
    $campaign['cpc'] = (float) ($campaign['cpc'] ?? 0);
}

echo json_encode([
    'overview' => $metrics,
    'by_platform' => $platformStats,
    'daily_spend' => $dailySpend,
    'top_campaigns' => $topCampaigns
]);
