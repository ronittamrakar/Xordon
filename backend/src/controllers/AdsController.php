<?php
/**
 * Ads Controller
 * Google Ads, Facebook Ads, and advertising management
 * 
 * SCOPING: Company-scoped (requires active company)
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class AdsController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    private static function getCompanyId(): int {
        return Permissions::requireActiveCompany();
    }

    // ==================== AD ACCOUNTS ====================

    public static function getAccounts() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT id, workspace_id, company_id, platform, platform_account_id, account_name,
                       currency, timezone, status, sync_campaigns, sync_conversions,
                       last_sync_at, created_at
                FROM ad_accounts
                WHERE workspace_id = ? AND company_id = ?
                ORDER BY platform, account_name
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::json(['data' => $accounts]);
            return;
        } catch (Exception $e) {
            Response::error('Failed to fetch accounts: ' . $e->getMessage());
            return;
        }
    }

    public static function disconnectAccount($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            Permissions::require('growth.ads.manage_accounts');

            $stmt = $db->prepare("
                UPDATE ad_accounts SET status = 'disconnected', access_token_encrypted = NULL, refresh_token_encrypted = NULL
                WHERE id = ? AND workspace_id = ? AND company_id = ?
            ");
            $stmt->execute([$id, $workspaceId, $companyId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to disconnect account: ' . $e->getMessage());
            return;
        }
    }

    // ==================== CAMPAIGNS ====================

    public static function createCampaign() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            Permissions::require('growth.ads.manage_campaigns');

            if (empty($data['name']) || empty($data['daily_budget'])) {
                Response::error('Name and daily budget are required', 400);
                return;
            }

            // In a real app, this would call the external Ad Platform API first to create the campaign there.
            // Here we are treating the local DB as the source of truth for the demo or simple management.
            $platformCampaignId = 'local_' . uniqid(); 

            // Try to resolve ad_account_id from platform if not provided
            if (empty($data['ad_account_id']) && !empty($data['platform'])) {
                $accStmt = $db->prepare("SELECT id FROM ad_accounts WHERE platform = ? AND workspace_id = ? AND company_id = ? LIMIT 1");
                $accStmt->execute([$data['platform'], $workspaceId, $companyId]);
                $data['ad_account_id'] = $accStmt->fetchColumn() ?: null;
            }

            $stmt = $db->prepare("
                INSERT INTO ad_campaigns 
                (workspace_id, company_id, ad_account_id, platform_campaign_id, name, status, 
                 campaign_type, daily_budget, total_budget, start_date, end_date, targeting_summary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['ad_account_id'] ?? null,
                $platformCampaignId,
                $data['name'],
                $data['status'] ?? 'draft',
                $data['campaign_type'] ?? 'search',
                $data['daily_budget'],
                $data['total_budget'] ?? null,
                $data['start_date'] ?? null,
                $data['end_date'] ?? null,
                $data['targeting_summary'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            Response::error('Failed to create campaign: ' . $e->getMessage());
            return;
        }
    }

    public static function deleteCampaign($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            Permissions::require('growth.ads.manage_campaigns');

            // Verify ownership
            $check = $db->prepare("SELECT id FROM ad_campaigns WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $check->execute([$id, $workspaceId, $companyId]);
            if (!$check->fetch()) {
                Response::error('Campaign not found', 404);
                return;
            }

            $stmt = $db->prepare("DELETE FROM ad_campaigns WHERE id = ?");
            $stmt->execute([$id]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to delete campaign: ' . $e->getMessage());
            return;
        }
    }

    public static function updateCampaign($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            Permissions::require('growth.ads.manage_campaigns');

            $updates = [];
            $params = [];

            $allowedFields = ['name', 'status', 'daily_budget', 'total_budget', 'start_date', 'end_date', 'targeting_summary'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (!empty($updates)) {
                $params[] = $id;
                $params[] = $workspaceId;
                $params[] = $companyId;
                $stmt = $db->prepare("UPDATE ad_campaigns SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ? AND company_id = ?");
                $stmt->execute($params);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to update campaign: ' . $e->getMessage());
            return;
        }
    }

    public static function syncCampaigns() {
        try {
            // Mock sync functionality
            // In production, this would fetch from Google/FB APIs and upsert into DB
            sleep(1); // Simulate network delay
            return Response::json(['data' => ['synced' => 0, 'message' => 'Sync simulated successfully']]);
        } catch (Exception $e) {
            Response::error('Failed to sync campaigns: ' . $e->getMessage());
            return;
        }
    }

    public static function getCampaigns() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $where = ['c.workspace_id = ?', 'c.company_id = ?'];
            $params = [$workspaceId, $companyId];

            if (!empty($_GET['account_id'])) {
                $where[] = 'c.ad_account_id = ?';
                $params[] = (int)$_GET['account_id'];
            }

            if (!empty($_GET['status'])) {
                $where[] = 'c.status = ?';
                $params[] = $_GET['status'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT c.*, a.platform, a.account_name
                FROM ad_campaigns c
                LEFT JOIN ad_accounts a ON a.id = c.ad_account_id
                WHERE $whereClause
                ORDER BY c.name
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $countParams = array_slice($params, 0, -2);
            $countStmt = $db->prepare("SELECT COUNT(*) FROM ad_campaigns c WHERE $whereClause");
            $countStmt->execute($countParams);
            $total = (int)$countStmt->fetchColumn();

            Response::json([
                'data' => $campaigns,
                'meta' => ['total' => $total, 'limit' => $limit, 'offset' => $offset]
            ]);
            return;
        } catch (Exception $e) {
            Response::error('Failed to fetch campaigns: ' . $e->getMessage());
            return;
        }
    }

    public static function getCampaign($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT c.*, a.platform, a.account_name
                FROM ad_campaigns c
                LEFT JOIN ad_accounts a ON a.id = c.ad_account_id
                WHERE c.id = ? AND c.workspace_id = ? AND c.company_id = ?
            ");
            $stmt->execute([$id, $workspaceId, $companyId]);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$campaign) {
                Response::error('Campaign not found', 404);
                return;
            }

            // Get recent metrics
            $metricsStmt = $db->prepare("
                SELECT * FROM ad_campaign_metrics
                WHERE campaign_id = ?
                ORDER BY metric_date DESC
                LIMIT 30
            ");
            $metricsStmt->execute([$id]);
            $campaign['metrics'] = $metricsStmt->fetchAll(PDO::FETCH_ASSOC);

            Response::json(['data' => $campaign]);
            return;
        } catch (Exception $e) {
            Response::error('Failed to fetch campaign: ' . $e->getMessage());
            return;
        }
    }

    public static function getCampaignMetrics($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
            $to = $_GET['to'] ?? date('Y-m-d');

            // Verify ownership
            $checkStmt = $db->prepare("SELECT id FROM ad_campaigns WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $checkStmt->execute([$id, $workspaceId, $companyId]);
            if (!$checkStmt->fetch()) {
                Response::error('Campaign not found', 404);
                return;
            }

            $stmt = $db->prepare("
                SELECT * FROM ad_campaign_metrics
                WHERE campaign_id = ? AND metric_date BETWEEN ? AND ?
                ORDER BY metric_date
            ");
            $stmt->execute([$id, $from, $to]);
            $metrics = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calculate totals
            $totals = [
                'spend' => 0,
                'impressions' => 0,
                'clicks' => 0,
                'conversions' => 0,
                'conversion_value' => 0
            ];

            foreach ($metrics as $m) {
                $totals['spend'] += (float)$m['spend'];
                $totals['impressions'] += (int)$m['impressions'];
                $totals['clicks'] += (int)$m['clicks'];
                $totals['conversions'] += (int)$m['conversions'];
                $totals['conversion_value'] += (float)$m['conversion_value'];
            }

            $totals['ctr'] = $totals['impressions'] > 0 ? round(($totals['clicks'] / $totals['impressions']) * 100, 2) : 0;
            $totals['cpc'] = $totals['clicks'] > 0 ? round($totals['spend'] / $totals['clicks'], 2) : 0;
            $totals['cpa'] = $totals['conversions'] > 0 ? round($totals['spend'] / $totals['conversions'], 2) : 0;
            $totals['roas'] = $totals['spend'] > 0 ? round($totals['conversion_value'] / $totals['spend'], 2) : 0;

            Response::json([
                'data' => [
                    'daily' => $metrics,
                    'totals' => $totals,
                    'period' => ['from' => $from, 'to' => $to]
                ]
            ]);
            return;
        } catch (Exception $e) {
            Response::error('Failed to fetch metrics: ' . $e->getMessage());
            return;
        }
    }

    // ==================== CONVERSIONS ====================

    public static function getConversions() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
            $to = $_GET['to'] ?? date('Y-m-d');

            $stmt = $db->prepare("
                SELECT cv.*, c.first_name, c.last_name, c.email,
                       ac.name as campaign_name, aa.platform
                FROM ad_conversions cv
                LEFT JOIN contacts c ON c.id = cv.contact_id
                LEFT JOIN ad_campaigns ac ON ac.id = cv.campaign_id
                LEFT JOIN ad_accounts aa ON aa.id = cv.ad_account_id
                WHERE cv.workspace_id = ? AND cv.company_id = ? AND cv.converted_at BETWEEN ? AND ?
                ORDER BY cv.converted_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$workspaceId, $companyId, $from, $to . ' 23:59:59', $limit, $offset]);
            $conversions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $countStmt = $db->prepare("
                SELECT COUNT(*) FROM ad_conversions
                WHERE workspace_id = ? AND company_id = ? AND converted_at BETWEEN ? AND ?
            ");
            $countStmt->execute([$workspaceId, $companyId, $from, $to . ' 23:59:59']);
            $total = (int)$countStmt->fetchColumn();

            Response::json([
                'data' => $conversions,
                'meta' => ['total' => $total, 'limit' => $limit, 'offset' => $offset]
            ]);
            return;
        } catch (Exception $e) {
            Response::error('Failed to fetch conversions: ' . $e->getMessage());
            return;
        }
    }

    public static function trackConversion() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['conversion_name'])) {
                Response::error('conversion_name required', 400);
                return;
            }

            $stmt = $db->prepare("
                INSERT INTO ad_conversions 
                (workspace_id, company_id, ad_account_id, campaign_id, conversion_name, conversion_type,
                 contact_id, click_id, conversion_value, currency, source, medium, campaign)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['ad_account_id'] ?? null,
                $data['campaign_id'] ?? null,
                $data['conversion_name'],
                $data['conversion_type'] ?? null,
                $data['contact_id'] ?? null,
                $data['click_id'] ?? null,
                $data['conversion_value'] ?? null,
                $data['currency'] ?? 'USD',
                $data['source'] ?? null,
                $data['medium'] ?? null,
                $data['campaign'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            Response::error('Failed to track conversion: ' . $e->getMessage());
            return;
        }
    }

    // ==================== BUDGETS ====================

    public static function getBudgets() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM ad_budgets
                WHERE workspace_id = ? AND company_id = ?
                ORDER BY period_start DESC
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $budgets = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::json(['data' => $budgets]);
            return;
        } catch (Exception $e) {
            Response::error('Failed to fetch budgets: ' . $e->getMessage());
            return;
        }
    }

    public static function createBudget() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            Permissions::require('growth.ads.manage_budgets');

            if (empty($data['total_budget']) || empty($data['period_start']) || empty($data['period_end'])) {
                Response::error('total_budget, period_start, and period_end required', 400);
                return;
            }

            $stmt = $db->prepare("
                INSERT INTO ad_budgets 
                (workspace_id, company_id, period_type, period_start, period_end, total_budget,
                 google_ads_budget, facebook_ads_budget, other_budget, alert_threshold)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['period_type'] ?? 'monthly',
                $data['period_start'],
                $data['period_end'],
                $data['total_budget'],
                $data['google_ads_budget'] ?? null,
                $data['facebook_ads_budget'] ?? null,
                $data['other_budget'] ?? null,
                $data['alert_threshold'] ?? 80
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            Response::error('Failed to create budget: ' . $e->getMessage());
            return;
        }
    }

    public static function updateBudget($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            Permissions::require('growth.ads.manage_budgets');

            $updates = [];
            $params = [];

            $allowedFields = ['total_budget', 'google_ads_budget', 'facebook_ads_budget', 
                'other_budget', 'spent', 'alert_threshold'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (!empty($updates)) {
                $params[] = $id;
                $params[] = $workspaceId;
                $params[] = $companyId;
                $stmt = $db->prepare("UPDATE ad_budgets SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ? AND company_id = ?");
                $stmt->execute($params);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to update budget: ' . $e->getMessage());
            return;
        }
    }

    public static function deleteBudget($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            Permissions::require('growth.ads.manage_budgets');

            $stmt = $db->prepare("DELETE FROM ad_budgets WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to delete budget: ' . $e->getMessage());
            return;
        }
    }

    // ==================== ANALYTICS ====================

    public static function getAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
            $to = $_GET['to'] ?? date('Y-m-d');

            // Overall metrics
            $overallStmt = $db->prepare("
                SELECT 
                    SUM(m.spend) as total_spend,
                    SUM(m.impressions) as total_impressions,
                    SUM(m.clicks) as total_clicks,
                    SUM(m.conversions) as total_conversions,
                    SUM(m.conversion_value) as total_conversion_value
                FROM ad_campaign_metrics m
                JOIN ad_campaigns c ON c.id = m.campaign_id
                WHERE c.workspace_id = ? AND c.company_id = ? AND m.metric_date BETWEEN ? AND ?
            ");
            $overallStmt->execute([$workspaceId, $companyId, $from, $to]);
            $overall = $overallStmt->fetch(PDO::FETCH_ASSOC);

            // Calculate derived metrics
            $overall['ctr'] = $overall['total_impressions'] > 0 
                ? round(($overall['total_clicks'] / $overall['total_impressions']) * 100, 2) : 0;
            $overall['cpc'] = $overall['total_clicks'] > 0 
                ? round($overall['total_spend'] / $overall['total_clicks'], 2) : 0;
            $overall['cpa'] = $overall['total_conversions'] > 0 
                ? round($overall['total_spend'] / $overall['total_conversions'], 2) : 0;
            $overall['roas'] = $overall['total_spend'] > 0 
                ? round($overall['total_conversion_value'] / $overall['total_spend'], 2) : 0;

            // By platform
            $byPlatformStmt = $db->prepare("
                SELECT 
                    a.platform,
                    SUM(m.spend) as spend,
                    SUM(m.impressions) as impressions,
                    SUM(m.clicks) as clicks,
                    SUM(m.conversions) as conversions,
                    SUM(m.conversion_value) as conversion_value
                FROM ad_campaign_metrics m
                JOIN ad_campaigns c ON c.id = m.campaign_id
                JOIN ad_accounts a ON a.id = c.ad_account_id
                WHERE c.workspace_id = ? AND c.company_id = ? AND m.metric_date BETWEEN ? AND ?
                GROUP BY a.platform
            ");
            $byPlatformStmt->execute([$workspaceId, $companyId, $from, $to]);
            $byPlatform = $byPlatformStmt->fetchAll(PDO::FETCH_ASSOC);

            // Daily trend
            $trendStmt = $db->prepare("
                SELECT 
                    m.metric_date as date,
                    SUM(m.spend) as spend,
                    SUM(m.clicks) as clicks,
                    SUM(m.conversions) as conversions
                FROM ad_campaign_metrics m
                JOIN ad_campaigns c ON c.id = m.campaign_id
                WHERE c.workspace_id = ? AND c.company_id = ? AND m.metric_date BETWEEN ? AND ?
                GROUP BY m.metric_date
                ORDER BY m.metric_date
            ");
            $trendStmt->execute([$workspaceId, $companyId, $from, $to]);
            $trend = $trendStmt->fetchAll(PDO::FETCH_ASSOC);

            // Top campaigns
            $topCampaignsStmt = $db->prepare("
                SELECT 
                    c.name,
                    a.platform,
                    SUM(m.spend) as spend,
                    SUM(m.conversions) as conversions,
                    SUM(m.conversion_value) as conversion_value
                FROM ad_campaign_metrics m
                JOIN ad_campaigns c ON c.id = m.campaign_id
                JOIN ad_accounts a ON a.id = c.ad_account_id
                WHERE c.workspace_id = ? AND c.company_id = ? AND m.metric_date BETWEEN ? AND ?
                GROUP BY c.id
                ORDER BY conversions DESC
                LIMIT 10
            ");
            $topCampaignsStmt->execute([$workspaceId, $companyId, $from, $to]);
            $topCampaigns = $topCampaignsStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'overall' => $overall,
                    'by_platform' => $byPlatform,
                    'daily_trend' => $trend,
                    'top_campaigns' => $topCampaigns,
                    'period' => ['from' => $from, 'to' => $to]
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }
    // ==================== A/B TESTING ====================

    public static function getABTests() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT t.*, c.name as campaign_name 
                FROM ad_ab_tests t
                LEFT JOIN ad_campaigns c ON c.id = t.campaign_id
                WHERE t.workspace_id = ? AND t.company_id = ?
                ORDER BY t.created_at DESC
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $tests = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::json(['data' => $tests]);
        } catch (Exception $e) {
            Response::error('Failed to fetch A/B tests: ' . $e->getMessage());
        }
    }

    public static function createABTest() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            Permissions::require('growth.ads.manage_campaigns');

            if (empty($data['name']) || empty($data['campaign_id'])) {
                Response::error('Name and Campaign ID are required', 400);
                return;
            }

            $stmt = $db->prepare("
                INSERT INTO ad_ab_tests 
                (workspace_id, company_id, name, campaign_id, variant_a_name, variant_b_name, 
                 variant_a_budget, variant_b_budget, test_duration_days, metric, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['name'],
                $data['campaign_id'],
                $data['variant_a_name'] ?? 'Variant A',
                $data['variant_b_name'] ?? 'Variant B',
                $data['variant_a_budget'] ?? 0,
                $data['variant_b_budget'] ?? 0,
                $data['test_duration_days'] ?? 14,
                $data['metric'] ?? 'conversions',
                'active'
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            Response::error('Failed to create A/B test: ' . $e->getMessage());
        }
    }

    public static function deleteABTest($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            Permissions::require('growth.ads.manage_campaigns');

            $stmt = $db->prepare("DELETE FROM ad_ab_tests WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to delete A/B test: ' . $e->getMessage());
        }
    }
}

