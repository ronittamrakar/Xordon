<?php

require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class SMSAnalyticsController {
    use WorkspaceScoped;
    
    public function getDashboard() {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping for tenant isolation
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            $scopeSql = str_replace('?', ':ws_id', $scope['sql']);
            
            $timeframe = $_GET['timeframe'] ?? '30'; // days
            $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
            
            // Overall statistics
            $stats = [];
            
            // Total campaigns
            $stmt = $db->prepare("SELECT COUNT(*) FROM sms_campaigns WHERE $scopeSql");
            $stmt->execute(['ws_id' => $workspaceId]);
            $stats['total_campaigns'] = $stmt->fetchColumn();
            
            // Active campaigns
            $stmt = $db->prepare("SELECT COUNT(*) FROM sms_campaigns WHERE $scopeSql AND status = 'active'");
            $stmt->execute(['ws_id' => $workspaceId]);
            $stats['active_campaigns'] = $stmt->fetchColumn();
            
            // Total recipients
            $stmt = $db->prepare("SELECT COUNT(*) FROM sms_recipients WHERE $scopeSql");
            $stmt->execute(['ws_id' => $workspaceId]);
            $stats['total_recipients'] = $stmt->fetchColumn();
            
            // Opted-in recipients
            $stmt = $db->prepare("SELECT COUNT(*) FROM sms_recipients WHERE $scopeSql AND opt_in_status = 'opted_in'");
            $stmt->execute(['ws_id' => $workspaceId]);
            $stats['opted_in_recipients'] = $stmt->fetchColumn();
            
            // Messages sent (timeframe)
            $stmt = $db->prepare("
                SELECT COUNT(*) FROM sms_messages sm
                JOIN sms_campaigns sc ON sm.campaign_id = sc.id
                WHERE sc.workspace_id = :ws_id AND sm.created_at >= :date_from
            ");
            $stmt->execute(['ws_id' => $workspaceId, 'date_from' => $dateFrom]);
            $stats['messages_sent'] = $stmt->fetchColumn();
            
            // Messages delivered (timeframe)
            $stmt = $db->prepare("
                SELECT COUNT(*) FROM sms_messages sm
                JOIN sms_campaigns sc ON sm.campaign_id = sc.id
                WHERE sc.workspace_id = :ws_id AND sm.delivery_status = 'delivered' AND sm.created_at >= :date_from
            ");
            $stmt->execute(['ws_id' => $workspaceId, 'date_from' => $dateFrom]);
            $stats['messages_delivered'] = $stmt->fetchColumn();
            
            // Messages failed (timeframe)
            $stmt = $db->prepare("
                SELECT COUNT(*) FROM sms_messages sm
                JOIN sms_campaigns sc ON sm.campaign_id = sc.id
                WHERE sc.workspace_id = :ws_id AND sm.delivery_status = 'failed' AND sm.created_at >= :date_from
            ");
            $stmt->execute(['ws_id' => $workspaceId, 'date_from' => $dateFrom]);
            $stats['messages_failed'] = $stmt->fetchColumn();
            
            // Replies received (timeframe)
            $stmt = $db->prepare("SELECT COUNT(*) FROM sms_replies WHERE $scopeSql AND created_at >= :date_from");
            $stmt->execute(['ws_id' => $workspaceId, 'date_from' => $dateFrom]);
            $stats['replies_received'] = $stmt->fetchColumn();
            
            // Total cost (timeframe)
            $stmt = $db->prepare("
                SELECT COALESCE(SUM(cost), 0) FROM sms_messages sm
                JOIN sms_campaigns sc ON sm.campaign_id = sc.id
                WHERE sc.workspace_id = :ws_id AND sm.created_at >= :date_from
            ");
            $stmt->execute(['ws_id' => $workspaceId, 'date_from' => $dateFrom]);
            $stats['total_cost'] = $stmt->fetchColumn();
            
            // Calculate rates
            $stats['delivery_rate'] = $stats['messages_sent'] > 0 ? 
                round(($stats['messages_delivered'] / $stats['messages_sent']) * 100, 2) : 0;
            $stats['failure_rate'] = $stats['messages_sent'] > 0 ? 
                round(($stats['messages_failed'] / $stats['messages_sent']) * 100, 2) : 0;
            $stats['reply_rate'] = $stats['messages_delivered'] > 0 ? 
                round(($stats['replies_received'] / $stats['messages_delivered']) * 100, 2) : 0;
            
            // Daily message volume (last 30 days)
            $stmt = $db->prepare("
                SELECT DATE(sm.created_at) as date, COUNT(*) as count
                FROM sms_messages sm
                JOIN sms_campaigns sc ON sm.campaign_id = sc.id
                WHERE sc.workspace_id = :ws_id AND sm.created_at >= :date_from
                GROUP BY DATE(sm.created_at)
                ORDER BY date ASC
            ");
            $stmt->execute(['ws_id' => $workspaceId, 'date_from' => $dateFrom]);
            $dailyVolume = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Top performing campaigns
            $stmt = $db->prepare("
                SELECT 
                    sc.id, sc.name,
                    COUNT(sm.id) as messages_sent,
                    SUM(CASE WHEN sm.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
                    COUNT(sr.id) as replies,
                    COALESCE(SUM(sm.cost), 0) as total_cost
                FROM sms_campaigns sc
                LEFT JOIN sms_messages sm ON sc.id = sm.campaign_id AND sm.created_at >= :date_from
                LEFT JOIN sms_replies sr ON sc.id = sr.campaign_id AND sr.created_at >= :date_from2
                WHERE sc.workspace_id = :ws_id
                GROUP BY sc.id, sc.name
                HAVING messages_sent > 0
                ORDER BY delivered DESC
                LIMIT 5
            ");
            $stmt->execute(['ws_id' => $workspaceId, 'date_from' => $dateFrom, 'date_from2' => $dateFrom]);
            $topCampaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Calculate rates for top campaigns
            foreach ($topCampaigns as &$campaign) {
                $campaign['delivery_rate'] = $campaign['messages_sent'] > 0 ? 
                    round(($campaign['delivered'] / $campaign['messages_sent']) * 100, 2) : 0;
                $campaign['reply_rate'] = $campaign['delivered'] > 0 ? 
                    round(($campaign['replies'] / $campaign['delivered']) * 100, 2) : 0;
            }
            
            Response::json([
                'stats' => $stats,
                'daily_volume' => $dailyVolume,
                'top_campaigns' => $topCampaigns,
                'timeframe' => $timeframe
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to fetch dashboard data: ' . $e->getMessage(), 500);
        }
    }
    
    public function getCampaignAnalytics($campaignId) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify campaign ownership via workspace
            $stmt = $db->prepare("SELECT * FROM sms_campaigns WHERE id = :id AND " . str_replace('?', ':ws_id', $scope['sql']));
            $stmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$campaign) {
                http_response_code(404);
                return Response::json(['error' => 'Campaign not found']);
            }
            
            // Campaign statistics
            $stats = [];
            
            // Total messages
            $stmt = $db->prepare("SELECT COUNT(*) FROM sms_messages WHERE campaign_id = :campaign_id");
            $stmt->execute(['campaign_id' => $campaignId]);
            $stats['total_messages'] = $stmt->fetchColumn();
            
            // Messages by status
            $stmt = $db->prepare("
                SELECT delivery_status, COUNT(*) as count
                FROM sms_messages 
                WHERE campaign_id = :campaign_id
                GROUP BY delivery_status
            ");
            $stmt->execute(['campaign_id' => $campaignId]);
            $statusCounts = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            $stats['sent'] = $statusCounts['sent'] ?? 0;
            $stats['delivered'] = $statusCounts['delivered'] ?? 0;
            $stats['failed'] = $statusCounts['failed'] ?? 0;
            $stats['pending'] = $statusCounts['pending'] ?? 0;
            
            // Replies
            $stmt = $db->prepare("SELECT COUNT(*) FROM sms_replies WHERE campaign_id = :campaign_id");
            $stmt->execute(['campaign_id' => $campaignId]);
            $stats['replies'] = $stmt->fetchColumn();
            
            // Opt-outs
            $stmt = $db->prepare("
                SELECT COUNT(*) FROM sms_recipients sr
                JOIN sms_messages sm ON sr.id = sm.recipient_id
                WHERE sm.campaign_id = :campaign_id AND sr.opt_in_status = 'opted_out'
                AND sr.opt_out_date >= (SELECT created_at FROM sms_campaigns WHERE id = sm.campaign_id)
            ");
            $stmt->execute(['campaign_id' => $campaignId]);
            $stats['opt_outs'] = $stmt->fetchColumn();
            
            // Total cost
            $stmt = $db->prepare("SELECT COALESCE(SUM(cost), 0) FROM sms_messages WHERE campaign_id = :campaign_id");
            $stmt->execute(['campaign_id' => $campaignId]);
            $stats['total_cost'] = $stmt->fetchColumn();
            
            // Calculate rates
            $stats['delivery_rate'] = $stats['total_messages'] > 0 ? 
                round(($stats['delivered'] / $stats['total_messages']) * 100, 2) : 0;
            $stats['failure_rate'] = $stats['total_messages'] > 0 ? 
                round(($stats['failed'] / $stats['total_messages']) * 100, 2) : 0;
            $stats['reply_rate'] = $stats['delivered'] > 0 ? 
                round(($stats['replies'] / $stats['delivered']) * 100, 2) : 0;
            $stats['opt_out_rate'] = $stats['delivered'] > 0 ? 
                round(($stats['opt_outs'] / $stats['delivered']) * 100, 2) : 0;
            
            // Message timeline
            $stmt = $db->prepare("
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM sms_messages 
                WHERE campaign_id = :campaign_id AND created_at IS NOT NULL
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            ");
            $stmt->execute(['campaign_id' => $campaignId]);
            $timeline = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Recent messages
            $stmt = $db->prepare("
                SELECT 
                    sm.*,
                    sr.first_name, sr.last_name, sr.phone_number
                FROM sms_messages sm
                JOIN sms_recipients sr ON sm.recipient_id = sr.id
                WHERE sm.campaign_id = :campaign_id
                ORDER BY sm.created_at DESC
                LIMIT 10
            ");
            $stmt->execute(['campaign_id' => $campaignId]);
            $recentMessages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Recent replies
            $stmt = $db->prepare("
                SELECT 
                    sr.*,
                    srec.first_name, srec.last_name
                FROM sms_replies sr
                LEFT JOIN sms_recipients srec ON sr.recipient_id = srec.id
                WHERE sr.campaign_id = :campaign_id
                ORDER BY sr.created_at DESC
                LIMIT 10
            ");
            $stmt->execute(['campaign_id' => $campaignId]);
            $recentReplies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json([
                'campaign' => $campaign,
                'stats' => $stats,
                'timeline' => $timeline,
                'recent_messages' => $recentMessages,
                'recent_replies' => $recentReplies
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to fetch campaign analytics: ' . $e->getMessage()]);
        }
    }
    
    public function getSequenceAnalytics($sequenceId) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify sequence ownership via workspace
            $stmt = $db->prepare("SELECT * FROM sms_sequences WHERE id = :id AND workspace_id = :ws_id");
            $stmt->execute(['id' => $sequenceId, 'ws_id' => $workspaceId]);
            $sequence = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$sequence) {
                http_response_code(404);
                return Response::json(['error' => 'Sequence not found']);
            }
            
            // Get sequence steps
            $stmt = $db->prepare("SELECT * FROM sms_sequence_steps WHERE sequence_id = :sequence_id ORDER BY step_order ASC");
            $stmt->execute(['sequence_id' => $sequenceId]);
            $steps = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Campaigns using this sequence
            $stmt = $db->prepare("SELECT COUNT(*) FROM sms_campaigns WHERE sequence_id = :sequence_id");
            $stmt->execute(['sequence_id' => $sequenceId]);
            $campaignCount = $stmt->fetchColumn();
            
            // Step performance
            $stepPerformance = [];
            foreach ($steps as $step) {
                $stmt = $db->prepare("
                    SELECT 
                        COUNT(*) as sent,
                        SUM(CASE WHEN sm.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
                        SUM(CASE WHEN sm.delivery_status = 'failed' THEN 1 ELSE 0 END) as failed,
                        COALESCE(SUM(sm.cost), 0) as cost
                    FROM sms_messages sm
                    JOIN sms_campaigns sc ON sm.campaign_id = sc.id
                    WHERE sc.sequence_id = :sequence_id AND sm.sequence_step_id = :step_id
                ");
                $stmt->execute(['sequence_id' => $sequenceId, 'step_id' => $step['id']]);
                $performance = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $performance['delivery_rate'] = $performance['sent'] > 0 ? 
                    round(($performance['delivered'] / $performance['sent']) * 100, 2) : 0;
                
                $stepPerformance[] = [
                    'step' => $step,
                    'performance' => $performance
                ];
            }
            
            // Overall sequence performance
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_messages,
                    SUM(CASE WHEN sm.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
                    SUM(CASE WHEN sm.delivery_status = 'failed' THEN 1 ELSE 0 END) as failed,
                    COALESCE(SUM(sm.cost), 0) as total_cost
                FROM sms_messages sm
                JOIN sms_campaigns sc ON sm.campaign_id = sc.id
                WHERE sc.sequence_id = :sequence_id
            ");
            $stmt->execute(['sequence_id' => $sequenceId]);
            $overallStats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $overallStats['delivery_rate'] = $overallStats['total_messages'] > 0 ? 
                round(($overallStats['delivered'] / $overallStats['total_messages']) * 100, 2) : 0;
            
            return Response::json([
                'sequence' => $sequence,
                'campaign_count' => $campaignCount,
                'step_performance' => $stepPerformance,
                'overall_stats' => $overallStats
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to fetch sequence analytics: ' . $e->getMessage()]);
        }
    }
    
    public function getReports() {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            // Use workspace scoping
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            $reportType = $_GET['type'] ?? 'summary';
            $dateFrom = $_GET['date_from'] ?? date('Y-m-d', strtotime('-30 days'));
            $dateTo = $_GET['date_to'] ?? date('Y-m-d');
            
            switch ($reportType) {
                case 'summary':
                    return $this->getSummaryReport($workspaceId, $db, $dateFrom, $dateTo);
                case 'campaigns':
                    return $this->getCampaignsReport($workspaceId, $db, $dateFrom, $dateTo);
                case 'recipients':
                    return $this->getRecipientsReport($workspaceId, $db, $dateFrom, $dateTo);
                case 'cost':
                    return $this->getCostReport($workspaceId, $db, $dateFrom, $dateTo);
                default:
                    http_response_code(400);
                    return Response::json(['error' => 'Invalid report type']);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to generate report: ' . $e->getMessage()]);
        }
    }
    
    private function getSummaryReport($workspaceId, $db, $dateFrom, $dateTo) {
        $stmt = $db->prepare("
            SELECT 
                DATE(sm.sent_at) as date,
                COUNT(*) as messages_sent,
                SUM(CASE WHEN sm.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN sm.delivery_status = 'failed' THEN 1 ELSE 0 END) as failed,
                COALESCE(SUM(sm.cost), 0) as daily_cost,
                COUNT(DISTINCT sm.campaign_id) as active_campaigns
            FROM sms_messages sm
            JOIN sms_campaigns sc ON sm.campaign_id = sc.id
            WHERE sc.workspace_id = :ws_id 
            AND DATE(sm.sent_at) BETWEEN :date_from AND :date_to
            GROUP BY DATE(sm.sent_at)
            ORDER BY date ASC
        ");
        $stmt->execute([
            'ws_id' => $workspaceId,
            'date_from' => $dateFrom,
            'date_to' => $dateTo
        ]);
        
        return Response::json(['summary' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    private function getCampaignsReport($workspaceId, $db, $dateFrom, $dateTo) {
        $stmt = $db->prepare("
            SELECT 
                sc.id, sc.name, sc.status,
                COUNT(sm.id) as messages_sent,
                SUM(CASE WHEN sm.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN sm.delivery_status = 'failed' THEN 1 ELSE 0 END) as failed,
                COUNT(sr.id) as replies,
                COALESCE(SUM(sm.cost), 0) as total_cost
            FROM sms_campaigns sc
            LEFT JOIN sms_messages sm ON sc.id = sm.campaign_id 
                AND DATE(sm.created_at) BETWEEN :date_from AND :date_to
            LEFT JOIN sms_replies sr ON sc.id = sr.campaign_id 
                AND DATE(sr.created_at) BETWEEN :date_from AND :date_to
            WHERE sc.workspace_id = :ws_id
            GROUP BY sc.id, sc.name, sc.status
            ORDER BY messages_sent DESC
        ");
        $stmt->execute([
            'ws_id' => $workspaceId,
            'date_from' => $dateFrom,
            'date_to' => $dateTo
        ]);
        
        $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate rates
        foreach ($campaigns as &$campaign) {
            $campaign['delivery_rate'] = $campaign['messages_sent'] > 0 ? 
                round(($campaign['delivered'] / $campaign['messages_sent']) * 100, 2) : 0;
            $campaign['reply_rate'] = $campaign['delivered'] > 0 ? 
                round(($campaign['replies'] / $campaign['delivered']) * 100, 2) : 0;
        }
        
        return Response::json(['campaigns' => $campaigns]);
    }
    
    private function getRecipientsReport($workspaceId, $db, $dateFrom, $dateTo) {
        $stmt = $db->prepare("
            SELECT 
                sr.id, sr.first_name, sr.last_name, sr.phone_number, sr.opt_in_status,
                COUNT(sm.id) as messages_received,
                SUM(CASE WHEN sm.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
                COUNT(srep.id) as replies_sent,
                MAX(sm.created_at) as last_message_date
            FROM sms_recipients sr
            LEFT JOIN sms_messages sm ON sr.id = sm.recipient_id 
                AND DATE(sm.created_at) BETWEEN :date_from AND :date_to
            LEFT JOIN sms_replies srep ON sr.id = srep.recipient_id 
                AND DATE(srep.created_at) BETWEEN :date_from AND :date_to
            WHERE sr.workspace_id = :ws_id
            GROUP BY sr.id, sr.first_name, sr.last_name, sr.phone_number, sr.opt_in_status
            HAVING messages_received > 0
            ORDER BY messages_received DESC
        ");
        $stmt->execute([
            'ws_id' => $workspaceId,
            'date_from' => $dateFrom,
            'date_to' => $dateTo
        ]);
        
        return Response::json(['recipients' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    private function getCostReport($workspaceId, $db, $dateFrom, $dateTo) {
        $stmt = $db->prepare("
            SELECT 
                DATE(sm.created_at) as date,
                COUNT(*) as messages_sent,
                COALESCE(SUM(sm.cost), 0) as daily_cost,
                AVG(sm.cost) as avg_cost_per_message
            FROM sms_messages sm
            JOIN sms_campaigns sc ON sm.campaign_id = sc.id
            WHERE sc.workspace_id = :ws_id 
            AND DATE(sm.created_at) BETWEEN :date_from AND :date_to
            GROUP BY DATE(sm.created_at)
            ORDER BY date ASC
        ");
        $stmt->execute([
            'ws_id' => $workspaceId,
            'date_from' => $dateFrom,
            'date_to' => $dateTo
        ]);
        
        $dailyCosts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate totals
        $totalCost = array_sum(array_column($dailyCosts, 'daily_cost'));
        $totalMessages = array_sum(array_column($dailyCosts, 'messages_sent'));
        $avgCostPerMessage = $totalMessages > 0 ? $totalCost / $totalMessages : 0;
        
        return [
            'daily_costs' => $dailyCosts,
            'totals' => [
                'total_cost' => $totalCost,
                'total_messages' => $totalMessages,
                'avg_cost_per_message' => round($avgCostPerMessage, 4)
            ]
        ];
    }
    
    public function exportReport() {
        try {
            $userId = Auth::userIdOrFail();
            $reportType = $_GET['type'] ?? 'summary';
            $format = $_GET['format'] ?? 'csv';
            
            // Get report data
            $reportData = $this->getReports();
            
            if (isset($reportData['error'])) {
                return $reportData;
            }
            
            // Generate filename
            $filename = "sms_report_{$reportType}_" . date('Y-m-d') . ".$format";
            
            if ($format === 'csv') {
                header('Content-Type: text/csv');
                header("Content-Disposition: attachment; filename=\"$filename\"");
                
                $output = fopen('php://output', 'w');
                
                // Write CSV based on report type
                switch ($reportType) {
                    case 'summary':
                        fputcsv($output, ['Date', 'Messages Sent', 'Delivered', 'Failed', 'Daily Cost', 'Active Campaigns']);
                        foreach ($reportData['summary'] as $row) {
                            fputcsv($output, $row);
                        }
                        break;
                    case 'campaigns':
                        fputcsv($output, ['Campaign ID', 'Name', 'Status', 'Messages Sent', 'Delivered', 'Failed', 'Replies', 'Total Cost', 'Delivery Rate', 'Reply Rate']);
                        foreach ($reportData['campaigns'] as $row) {
                            fputcsv($output, $row);
                        }
                        break;
                }
                
                fclose($output);
                exit;
            }
            
            return Response::json(['error' => 'Unsupported export format']);
            
        } catch (Exception $e) {
            http_response_code(500);
            return Response::json(['error' => 'Failed to export report: ' . $e->getMessage()]);
        }
    }
}
