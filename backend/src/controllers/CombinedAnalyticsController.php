<?php

require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';

class CombinedAnalyticsController {
    
    private function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    /**
     * Get all campaigns grouped by channel type (email, sms, call)
     * Returns campaigns for the campaign selector dropdown
     * Requirements: 1.4, 3.1
     */
    public function getCampaignsList() {
        try {
            Auth::userIdOrFail();
            $db = Database::conn();
            $scope = $this->getWorkspaceScope();
            
            // Get Email campaigns
            $stmt = $db->prepare('
                SELECT id, name, status, created_at 
                FROM campaigns 
                WHERE ' . $scope['col'] . ' = ? 
                ORDER BY created_at DESC
            ');
            $stmt->execute([$scope['val']]);
            $emailCampaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get SMS campaigns
            $stmt = $db->prepare('
                SELECT id, name, status, created_at 
                FROM sms_campaigns 
                WHERE ' . $scope['col'] . ' = ? 
                ORDER BY created_at DESC
            ');
            $stmt->execute([$scope['val']]);
            $smsCampaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get Call campaigns
            $stmt = $db->prepare('
                SELECT id, name, status, created_at 
                FROM call_campaigns 
                WHERE ' . $scope['col'] . ' = ? 
                ORDER BY created_at DESC
            ');
            $stmt->execute([$scope['val']]);
            $callCampaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format campaigns with channel type
            $formatCampaigns = function($campaigns, $channel) {
                return array_map(function($c) use ($channel) {
                    return [
                        'id' => (string)$c['id'],
                        'name' => $c['name'],
                        'channel' => $channel,
                        'status' => $c['status'],
                        'createdAt' => $c['created_at']
                    ];
                }, $campaigns);
            };
            
            return Response::json([
                'email' => $formatCampaigns($emailCampaigns, 'email'),
                'sms' => $formatCampaigns($smsCampaigns, 'sms'),
                'call' => $formatCampaigns($callCampaigns, 'call')
            ]);
            
        } catch (Exception $e) {
            return Response::error('Failed to fetch campaigns list: ' . $e->getMessage(), 500);
        }
    }
    
    public function getCombinedAnalytics() {
        try {
            $db = Database::conn();
            $scope = $this->getWorkspaceScope();
            
            $timeframe = $_GET['timeframe'] ?? '30'; // days
            $campaignId = $_GET['campaign_id'] ?? null;
            $channel = $_GET['channel'] ?? null;
            $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
            
            // If campaign_id is provided, return channel-specific analytics
            if ($campaignId !== null && $channel !== null) {
                return $this->getCampaignSpecificAnalytics($scope, $db, $timeframe, $campaignId, $channel);
            }
            
            // Get Email Analytics
            $emailAnalytics = $this->getEmailAnalytics($scope, $db, $timeframe);
            
            // Get SMS Analytics
            $smsAnalytics = $this->getSMSAnalytics($scope, $db, $timeframe);
            
            // Get Form Analytics
            $formAnalytics = $this->getFormAnalytics($scope, $db, $timeframe);
            
            // Get Calls Analytics
            $callsAnalytics = $this->getCallsAnalytics($scope, $db, $timeframe);
            
            // Calculate Overview Metrics
            $overview = $this->calculateOverview($emailAnalytics, $smsAnalytics, $formAnalytics, $callsAnalytics);
            
            return Response::json([
                'email' => $emailAnalytics,
                'sms' => $smsAnalytics,
                'forms' => $formAnalytics,
                'calls' => $callsAnalytics,
                'overview' => $overview,
                'timeframe' => $timeframe
            ]);
            
        } catch (Exception $e) {
            return Response::error('Failed to fetch combined analytics: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Get analytics for a specific campaign based on channel type
     * Requirements: 1.2, 2.4
     */
    private function getCampaignSpecificAnalytics(array $scope, $db, $timeframe, $campaignId, $channel) {
        // Validate channel type
        $validChannels = ['email', 'sms', 'call'];
        if (!in_array($channel, $validChannels)) {
            return Response::error('Invalid channel type. Must be one of: email, sms, call', 400);
        }
        
        switch ($channel) {
            case 'email':
                return $this->getEmailCampaignAnalytics($scope, $db, $timeframe, $campaignId);
            case 'sms':
                return $this->getSMSCampaignAnalytics($scope, $db, $timeframe, $campaignId);
            case 'call':
                return $this->getCallCampaignAnalytics($scope, $db, $timeframe, $campaignId);
            default:
                return Response::error('Invalid channel type', 400);
        }
    }
    
    /**
     * Get analytics for a specific email campaign
     * Requirements: 2.1
     * 
     * Queries the campaigns table for aggregate metrics (sent, opens, clicks, bounces, unsubscribes)
     * and the recipients table for daily stats filtered to this specific campaign.
     */
    private function getEmailCampaignAnalytics(array $scope, $db, $timeframe, $campaignId) {
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        // Verify campaign exists and belongs to user
        $stmt = $db->prepare('SELECT id, name, status, created_at FROM campaigns WHERE id = ? AND ' . $scope['col'] . ' = ?');
        $stmt->execute([$campaignId, $scope['val']]);
        $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$campaign) {
            return Response::error('Campaign not found', 404);
        }
        
        // Get email metrics for this specific campaign from the campaigns table
        $stmt = $db->prepare('SELECT sent, opens, clicks, bounces, unsubscribes FROM campaigns WHERE id = ? AND ' . $scope['col'] . ' = ?');
        $stmt->execute([$campaignId, $scope['val']]);
        $metrics = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $totalSent = (int)($metrics['sent'] ?? 0);
        $totalOpens = (int)($metrics['opens'] ?? 0);
        $totalClicks = (int)($metrics['clicks'] ?? 0);
        $totalBounces = (int)($metrics['bounces'] ?? 0);
        $totalUnsubscribes = (int)($metrics['unsubscribes'] ?? 0);
        
        // Generate daily stats for this campaign from recipients table
        // Query recipients table for daily breakdown of sent, opens, and clicks
        $stmt = $db->prepare("
            SELECT 
                DATE(sent_at) as date,
                COUNT(CASE WHEN sent_at IS NOT NULL THEN 1 END) as sent,
                COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opens,
                COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicks
            FROM recipients
            WHERE campaign_id = ? AND " . $scope['col'] . " = ? AND sent_at >= ?
            GROUP BY DATE(sent_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$campaignId, $scope['val'], $dateFrom]);
        $dailyData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Create a map for quick lookup
        $dataMap = [];
        foreach ($dailyData as $row) {
            $dataMap[$row['date']] = $row;
        }
        
        // Build daily stats array for all days in timeframe
        $dailyStats = [];
        for ($i = $timeframe - 1; $i >= 0; $i--) {
            $date = new DateTime();
            $date->modify("-$i day");
            $dateStr = $date->format('Y-m-d');
            
            $dailyStats[] = [
                'date' => $dateStr,
                'sent' => (int)($dataMap[$dateStr]['sent'] ?? 0),
                'opens' => (int)($dataMap[$dateStr]['opens'] ?? 0),
                'clicks' => (int)($dataMap[$dateStr]['clicks'] ?? 0)
            ];
        }
        
        return Response::json([
            'campaign' => [
                'id' => (string)$campaign['id'],
                'name' => $campaign['name'],
                'channel' => 'email',
                'status' => $campaign['status']
            ],
            'metrics' => [
                'totalSent' => $totalSent,
                'totalOpens' => $totalOpens,
                'totalClicks' => $totalClicks,
                'totalBounces' => $totalBounces,
                'totalUnsubscribes' => $totalUnsubscribes,
                'openRate' => $totalSent > 0 ? round(($totalOpens / $totalSent) * 100, 2) : 0,
                'clickRate' => $totalSent > 0 ? round(($totalClicks / $totalSent) * 100, 2) : 0,
                'bounceRate' => $totalSent > 0 ? round(($totalBounces / $totalSent) * 100, 2) : 0,
                'unsubscribeRate' => $totalSent > 0 ? round(($totalUnsubscribes / $totalSent) * 100, 2) : 0
            ],
            'dailyStats' => $dailyStats,
            'timeframe' => $timeframe
        ]);
    }
    
    /**
     * Get analytics for a specific SMS campaign
     * Requirements: 2.2
     */
    private function getSMSCampaignAnalytics(array $scope, $db, $timeframe, $campaignId) {
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        // Verify campaign exists and belongs to user
        $stmt = $db->prepare('SELECT id, name, status, created_at FROM sms_campaigns WHERE id = ? AND ' . $scope['col'] . ' = ?');
        $stmt->execute([$campaignId, $scope['val']]);
        $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$campaign) {
            return Response::error('Campaign not found', 404);
        }
        
        // Get total messages sent for this campaign
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM sms_messages sm
            JOIN sms_campaigns sc ON sm.campaign_id = sc.id
            WHERE sc.id = ? AND sc." . $scope['col'] . " = ? AND sm.created_at >= ?
        ");
        $stmt->execute([$campaignId, $scope['val'], $dateFrom]);
        $totalSent = (int)$stmt->fetchColumn();
        
        // Get delivered messages
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM sms_messages sm
            JOIN sms_campaigns sc ON sm.campaign_id = sc.id
            WHERE sc.id = ? AND sc." . $scope['col'] . " = ? AND sm.delivery_status = 'delivered' AND sm.created_at >= ?
        ");
        $stmt->execute([$campaignId, $scope['val'], $dateFrom]);
        $totalDelivered = (int)$stmt->fetchColumn();
        
        // Get failed messages
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM sms_messages sm
            JOIN sms_campaigns sc ON sm.campaign_id = sc.id
            WHERE sc.id = ? AND sc." . $scope['col'] . " = ? AND sm.delivery_status = 'failed' AND sm.created_at >= ?
        ");
        $stmt->execute([$campaignId, $scope['val'], $dateFrom]);
        $totalFailed = (int)$stmt->fetchColumn();
        
        // Get replies for this campaign
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM sms_replies sm
            JOIN sms_campaigns sc ON sm.campaign_id = sc.id
            WHERE sc.id = ? AND sc." . $scope['col'] . " = ? AND sm.created_at >= ?
        ");
        $stmt->execute([$campaignId, $scope['val'], $dateFrom]);
        $totalReplies = (int)$stmt->fetchColumn();
        
        // Generate daily stats for this campaign
        $stmt = $db->prepare("
            SELECT 
                DATE(sm.created_at) as date,
                COUNT(*) as sent,
                SUM(CASE WHEN sm.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN sm.delivery_status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM sms_messages sm
            JOIN sms_campaigns sc ON sm.campaign_id = sc.id
            WHERE sc.id = ? AND sc." . $scope['col'] . " = ? AND sm.created_at >= ?
            GROUP BY DATE(sm.created_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$campaignId, $scope['val'], $dateFrom]);
        $dailyData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Create daily stats array for all days in timeframe
        $dailyStats = [];
        $dataMap = [];
        foreach ($dailyData as $row) {
            $dataMap[$row['date']] = $row;
        }
        
        for ($i = $timeframe - 1; $i >= 0; $i--) {
            $date = new DateTime();
            $date->modify("-$i day");
            $dateStr = $date->format('Y-m-d');
            
            $dailyStats[] = [
                'date' => $dateStr,
                'sent' => (int)($dataMap[$dateStr]['sent'] ?? 0),
                'delivered' => (int)($dataMap[$dateStr]['delivered'] ?? 0),
                'failed' => (int)($dataMap[$dateStr]['failed'] ?? 0)
            ];
        }
        
        return Response::json([
            'campaign' => [
                'id' => (string)$campaign['id'],
                'name' => $campaign['name'],
                'channel' => 'sms',
                'status' => $campaign['status']
            ],
            'metrics' => [
                'totalSent' => $totalSent,
                'totalDelivered' => $totalDelivered,
                'totalFailed' => $totalFailed,
                'totalReplies' => $totalReplies,
                'deliveryRate' => $totalSent > 0 ? round(($totalDelivered / $totalSent) * 100, 2) : 0,
                'failureRate' => $totalSent > 0 ? round(($totalFailed / $totalSent) * 100, 2) : 0,
                'replyRate' => $totalDelivered > 0 ? round(($totalReplies / $totalDelivered) * 100, 2) : 0
            ],
            'dailyStats' => $dailyStats,
            'timeframe' => $timeframe
        ]);
    }
    
    /**
     * Get analytics for a specific call campaign
     * Requirements: 2.3
     */
    private function getCallCampaignAnalytics(array $scope, $db, $timeframe, $campaignId) {
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        // Verify campaign exists and belongs to user
        $stmt = $db->prepare('SELECT id, name, status, created_at FROM call_campaigns WHERE id = ? AND ' . $scope['col'] . ' = ?');
        $stmt->execute([$campaignId, $scope['val']]);
        $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$campaign) {
            return Response::error('Campaign not found', 404);
        }
        
        // Get total calls for this campaign
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM call_logs 
            WHERE campaign_id = ? AND created_at >= ?
        ");
        $stmt->execute([$campaignId, $dateFrom]);
        $totalCalls = (int)$stmt->fetchColumn();
        
        // Get answered calls
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM call_logs 
            WHERE campaign_id = ? AND status = 'completed' AND call_outcome = 'answered' AND created_at >= ?
        ");
        $stmt->execute([$campaignId, $dateFrom]);
        $answeredCalls = (int)$stmt->fetchColumn();
        
        // Get missed calls (no answer)
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM call_logs 
            WHERE campaign_id = ? AND status = 'completed' AND call_outcome = 'no_answer' AND created_at >= ?
        ");
        $stmt->execute([$campaignId, $dateFrom]);
        $missedCalls = (int)$stmt->fetchColumn();
        
        // Get voicemails
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM call_logs 
            WHERE campaign_id = ? AND status = 'completed' AND call_outcome = 'voicemail' AND created_at >= ?
        ");
        $stmt->execute([$campaignId, $dateFrom]);
        $voicemails = (int)$stmt->fetchColumn();
        
        // Get failed calls
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM call_logs 
            WHERE campaign_id = ? AND status = 'failed' AND created_at >= ?
        ");
        $stmt->execute([$campaignId, $dateFrom]);
        $failedCalls = (int)$stmt->fetchColumn();
        
        // Get average call duration for answered calls
        $stmt = $db->prepare("
            SELECT AVG(call_duration) FROM call_logs 
            WHERE campaign_id = ? AND status = 'completed' AND call_outcome = 'answered' 
            AND created_at >= ? AND call_duration IS NOT NULL
        ");
        $stmt->execute([$campaignId, $dateFrom]);
        $avgDuration = (int)($stmt->fetchColumn() ?: 0);
        
        // Get disposition breakdown
        $stmt = $db->prepare("
            SELECT 
                COALESCE(disposition, 'No Disposition') as name,
                COUNT(*) as count
            FROM call_logs
            WHERE campaign_id = ? AND created_at >= ?
            GROUP BY disposition
            ORDER BY count DESC
        ");
        $stmt->execute([$campaignId, $dateFrom]);
        $dispositions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Generate daily stats for this campaign
        $stmt = $db->prepare("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' AND call_outcome = 'answered' THEN 1 ELSE 0 END) as answered,
                SUM(CASE WHEN status = 'completed' AND call_outcome = 'no_answer' THEN 1 ELSE 0 END) as missed,
                SUM(CASE WHEN status = 'completed' AND call_outcome = 'voicemail' THEN 1 ELSE 0 END) as voicemail
            FROM call_logs
            WHERE campaign_id = ? AND created_at >= ?
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$campaignId, $dateFrom]);
        $dailyData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Create daily stats array for all days in timeframe
        $dailyStats = [];
        $dataMap = [];
        foreach ($dailyData as $row) {
            $dataMap[$row['date']] = $row;
        }
        
        for ($i = $timeframe - 1; $i >= 0; $i--) {
            $date = new DateTime();
            $date->modify("-$i day");
            $dateStr = $date->format('Y-m-d');
            
            $dailyStats[] = [
                'date' => $dateStr,
                'total' => (int)($dataMap[$dateStr]['total'] ?? 0),
                'answered' => (int)($dataMap[$dateStr]['answered'] ?? 0),
                'missed' => (int)($dataMap[$dateStr]['missed'] ?? 0),
                'voicemail' => (int)($dataMap[$dateStr]['voicemail'] ?? 0)
            ];
        }
        
        return Response::json([
            'campaign' => [
                'id' => (string)$campaign['id'],
                'name' => $campaign['name'],
                'channel' => 'call',
                'status' => $campaign['status']
            ],
            'metrics' => [
                'totalCalls' => $totalCalls,
                'answeredCalls' => $answeredCalls,
                'missedCalls' => $missedCalls,
                'voicemails' => $voicemails,
                'failedCalls' => $failedCalls,
                'avgDuration' => $avgDuration,
                'answerRate' => $totalCalls > 0 ? round(($answeredCalls / $totalCalls) * 100, 2) : 0
            ],
            'dailyStats' => $dailyStats,
            'dispositions' => $dispositions,
            'timeframe' => $timeframe
        ]);
    }
    
    private function getEmailAnalytics(array $scope, $db, $timeframe) {
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        // Get total email metrics
        $stmt = $db->prepare('SELECT sent, opens, clicks, bounces, unsubscribes FROM campaigns WHERE ' . $scope['col'] . ' = ?');
        $stmt->execute([$scope['val']]);
        $rows = $stmt->fetchAll();
        
        $totalSent = 0; $totalOpens = 0; $totalClicks = 0; $totalBounces = 0; $totalUnsubscribes = 0;
        foreach ($rows as $r) {
            $totalSent += (int)$r['sent'];
            $totalOpens += (int)$r['opens'];
            $totalClicks += (int)$r['clicks'];
            $totalBounces += (int)$r['bounces'];
            $totalUnsubscribes += (int)$r['unsubscribes'];
        }
        
        // Generate daily stats
        $dailyStats = [];
        for ($i = $timeframe - 1; $i >= 0; $i--) {
            $date = new DateTime();
            $date->modify("-$i day");
            $dateStr = $date->format('Y-m-d');
            
            $stmt = $db->prepare('SELECT metric_type, SUM(metric_value) as total FROM analytics WHERE ' . $scope['col'] . ' = ? AND date_recorded = ? GROUP BY metric_type');
            $stmt->execute([$scope['val'], $dateStr]);
            
            $dayData = ['date' => $dateStr, 'sent' => 0, 'opens' => 0, 'clicks' => 0];
            while ($row = $stmt->fetch()) {
                switch ($row['metric_type']) {
                    case 'sent': $dayData['sent'] = (int)$row['total']; break;
                    case 'opened': $dayData['opens'] = (int)$row['total']; break;
                    case 'clicked': $dayData['clicks'] = (int)$row['total']; break;
                }
            }
            $dailyStats[] = $dayData;
        }
        
        return [
            'totalSent' => $totalSent,
            'totalOpens' => $totalOpens,
            'totalClicks' => $totalClicks,
            'totalBounces' => $totalBounces,
            'totalUnsubscribes' => $totalUnsubscribes,
            'openRate' => $totalSent > 0 ? ($totalOpens / $totalSent) * 100 : 0,
            'clickRate' => $totalSent > 0 ? ($totalClicks / $totalSent) * 100 : 0,
            'bounceRate' => $totalSent > 0 ? ($totalBounces / $totalSent) * 100 : 0,
            'unsubscribeRate' => $totalSent > 0 ? ($totalUnsubscribes / $totalSent) * 100 : 0,
            'dailyStats' => $dailyStats
        ];
    }
    
    private function getSMSAnalytics(array $scope, $db, $timeframe) {
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        // Get total SMS campaigns
        $stmt = $db->prepare("SELECT COUNT(*) FROM sms_campaigns WHERE {$scope['col']} = :scope_val");
        $stmt->execute(['scope_val' => $scope['val']]);
        $totalCampaigns = $stmt->fetchColumn();
        
        // Get total messages sent (timeframe)
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM sms_messages sm
            JOIN sms_campaigns sc ON sm.campaign_id = sc.id
            WHERE sc.{$scope['col']} = :scope_val AND sm.created_at >= :date_from
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $totalSent = $stmt->fetchColumn();
        
        // Get delivered messages
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM sms_messages sm
            JOIN sms_campaigns sc ON sm.campaign_id = sc.id
            WHERE sc.{$scope['col']} = :scope_val AND sm.delivery_status = 'delivered' AND sm.created_at >= :date_from
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $totalDelivered = $stmt->fetchColumn();
        
        // Get failed messages
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM sms_messages sm
            JOIN sms_campaigns sc ON sm.campaign_id = sc.id
            WHERE sc.{$scope['col']} = :scope_val AND sm.delivery_status = 'failed' AND sm.created_at >= :date_from
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $totalFailed = $stmt->fetchColumn();
        
        // Get replies
        $stmt = $db->prepare("SELECT COUNT(*) FROM sms_replies WHERE {$scope['col']} = :scope_val AND created_at >= :date_from");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $totalReplies = $stmt->fetchColumn();
        
        // Get daily volume
        $stmt = $db->prepare("
            SELECT DATE(sm.created_at) as date, COUNT(*) as count
            FROM sms_messages sm
            JOIN sms_campaigns sc ON sm.campaign_id = sc.id
            WHERE sc.{$scope['col']} = :scope_val AND sm.created_at >= :date_from
            GROUP BY DATE(sm.created_at)
            ORDER BY date ASC
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $dailyVolume = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get top campaigns
        $stmt = $db->prepare("
            SELECT 
                sc.id, sc.name,
                COUNT(sm.id) as sent,
                SUM(CASE WHEN sm.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
                COUNT(sr.id) as replies,
                COALESCE(SUM(sm.cost), 0) as total_cost
            FROM sms_campaigns sc
            LEFT JOIN sms_messages sm ON sc.id = sm.campaign_id AND sm.created_at >= :date_from
            LEFT JOIN sms_replies sr ON sc.id = sr.campaign_id AND sr.created_at >= :date_from2
            WHERE sc.{$scope['col']} = :scope_val
            GROUP BY sc.id, sc.name
            HAVING sent > 0
            ORDER BY delivered DESC
            LIMIT 5
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom, 'date_from2' => $dateFrom]);
        $topCampaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate rates for top campaigns
        foreach ($topCampaigns as &$campaign) {
            $campaign['delivery_rate'] = $campaign['sent'] > 0 ? 
                round(($campaign['delivered'] / $campaign['sent']) * 100, 2) : 0;
            $campaign['reply_rate'] = $campaign['delivered'] > 0 ? 
                round(($campaign['replies'] / $campaign['delivered']) * 100, 2) : 0;
        }
        
        return [
            'total_campaigns' => $totalCampaigns,
            'stats' => [
                'total_sent' => $totalSent,
                'total_delivered' => $totalDelivered,
                'total_failed' => $totalFailed,
                'total_replies' => $totalReplies,
                'delivery_rate' => $totalSent > 0 ? round(($totalDelivered / $totalSent) * 100, 2) : 0,
                'failure_rate' => $totalSent > 0 ? round(($totalFailed / $totalSent) * 100, 2) : 0,
                'reply_rate' => $totalDelivered > 0 ? round(($totalReplies / $totalDelivered) * 100, 2) : 0
            ],
            'daily_volume' => $dailyVolume,
            'top_campaigns' => $topCampaigns
        ];
    }
    
    private function getFormAnalytics(array $scope, $db, $timeframe) {
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        // Get total forms
        $stmt = $db->prepare("SELECT COUNT(*) FROM forms WHERE {$scope['col']} = :scope_val");
        $stmt->execute(['scope_val' => $scope['val']]);
        $totalForms = $stmt->fetchColumn();
        
        // Get total responses and forms with responses (using same logic as standalone method)
        $stmt = $db->prepare("
            SELECT 
                COUNT(DISTINCT fr.id) as total_responses,
                COUNT(DISTINCT fr.form_id) as forms_with_responses
            FROM form_responses fr
            JOIN forms f ON fr.form_id = f.id
            WHERE f.{$scope['col']} = :scope_val AND fr.created_at >= :date_from
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $responseStats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $totalResponses = (int)$responseStats['total_responses'];
        $formsWithResponses = (int)$responseStats['forms_with_responses'];
        
        // Use responses as proxy for views (same as standalone method)
        $totalViews = $totalResponses;
        
        // Calculate conversion rate (forms with responses / total forms)
        $conversionRate = $totalForms > 0 ? round(($formsWithResponses / $totalForms) * 100, 2) : 0;
        
        // Get daily responses for the last 30 days (same as standalone method)
        $stmt = $db->prepare("
            SELECT 
                DATE(fr.created_at) as date,
                COUNT(*) as responses,
                COUNT(DISTINCT fr.form_id) as views
            FROM form_responses fr
            JOIN forms f ON fr.form_id = f.id
            WHERE f.{$scope['col']} = :scope_val AND fr.created_at >= :date_from
            GROUP BY DATE(fr.created_at)
            ORDER BY date ASC
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $dailyResponses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Create daily stats array for all days in timeframe
        $dailyStats = [];
        $responsesMap = array_column($dailyResponses, 'responses', 'date');
        $viewsMap = array_column($dailyResponses, 'views', 'date');
        
        for ($i = $timeframe - 1; $i >= 0; $i--) {
            $date = new DateTime();
            $date->modify("-$i day");
            $dateStr = $date->format('Y-m-d');
            
            $dailyStats[] = [
                'date' => $dateStr,
                'views' => $viewsMap[$dateStr] ?? 0,
                'responses' => $responsesMap[$dateStr] ?? 0
            ];
        }
        
        // Get top performing forms (same as standalone method)
        $stmt = $db->prepare("
            SELECT 
                f.id,
                f.name,
                COUNT(fr.id) as responses,
                COUNT(DISTINCT DATE(fr.created_at)) as unique_days,
                ROUND(COUNT(fr.id) / GREATEST(COUNT(DISTINCT DATE(fr.created_at)), 1), 2) as avg_daily_responses
            FROM forms f
            LEFT JOIN form_responses fr ON f.id = fr.form_id AND fr.created_at >= :date_from
            WHERE f.{$scope['col']} = :scope_val
            GROUP BY f.id, f.name
            HAVING responses > 0
            ORDER BY responses DESC
            LIMIT 5
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $topForms = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate conversion rates for top forms (same as standalone method)
        foreach ($topForms as &$form) {
            // For simplicity, assume each form view is counted when it gets a response
            $form['views'] = $form['responses']; // Using responses as proxy for views
            $form['conversionRate'] = round(($form['responses'] / max($form['responses'], 1)) * 100, 2);
        }
        
        // Get response sources (based on user agent patterns, same as standalone method)
        $stmt = $db->prepare("
            SELECT 
                CASE 
                    WHEN fr.user_agent LIKE '%Mobile%' THEN 'Mobile'
                    WHEN fr.user_agent LIKE '%Chrome%' THEN 'Chrome'
                    WHEN fr.user_agent LIKE '%Firefox%' THEN 'Firefox'
                    WHEN fr.user_agent LIKE '%Safari%' THEN 'Safari'
                    WHEN fr.user_agent LIKE '%Edge%' THEN 'Edge'
                    ELSE 'Other'
                END as source,
                COUNT(*) as count
            FROM form_responses fr
            JOIN forms f ON fr.form_id = f.id
            WHERE f.{$scope['col']} = :scope_val AND fr.user_agent IS NOT NULL AND fr.created_at >= :date_from
            GROUP BY source
            ORDER BY count DESC
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $responseSources = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'totalForms' => $totalForms,
            'totalViews' => $totalViews,
            'totalResponses' => $totalResponses,
            'conversionRate' => $conversionRate,
            'avgResponseTime' => $this->calculateAverageResponseTime($scope, $db, $dateFrom),
            'dailyResponses' => $dailyStats,
            'topForms' => $topForms,
            'responseSources' => $responseSources
        ];
    }
    
    private function calculateAverageResponseTime(array $scope, $db, $dateFrom) {
        $stmt = $db->prepare("
            SELECT AVG(response_time) as avg_time
            FROM form_responses fr
            JOIN forms f ON fr.form_id = f.id
            WHERE f.{$scope['col']} = :scope_val AND fr.created_at >= :date_from AND fr.response_time IS NOT NULL
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        return (float)$stmt->fetchColumn() ?: 0;
    }
    
    private function getCallsAnalytics(array $scope, $db, $timeframe) {
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        // Get total call campaigns
        $stmt = $db->prepare("SELECT COUNT(*) FROM call_campaigns WHERE {$scope['col']} = :scope_val");
        $stmt->execute(['scope_val' => $scope['val']]);
        $totalCampaigns = $stmt->fetchColumn();
        
        // Get total calls made (timeframe)
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM call_logs cl
            JOIN call_campaigns cc ON cl.campaign_id = cc.id
            WHERE cc.{$scope['col']} = :scope_val AND cl.created_at >= :date_from
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $totalCalls = $stmt->fetchColumn();
        
        // Get answered calls
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM call_logs cl
            JOIN call_campaigns cc ON cl.campaign_id = cc.id
            WHERE cc.{$scope['col']} = :scope_val AND cl.status = 'completed' AND cl.call_outcome = 'answered' AND cl.created_at >= :date_from
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $answeredCalls = $stmt->fetchColumn();
        
        // Get missed calls (no answer)
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM call_logs cl
            JOIN call_campaigns cc ON cl.campaign_id = cc.id
            WHERE cc.{$scope['col']} = :scope_val AND cl.status = 'completed' AND cl.call_outcome = 'no_answer' AND cl.created_at >= :date_from
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $missedCalls = $stmt->fetchColumn();
        
        // Get busy calls
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM call_logs cl
            JOIN call_campaigns cc ON cl.campaign_id = cc.id
            WHERE cc.{$scope['col']} = :scope_val AND cl.status = 'completed' AND cl.call_outcome = 'busy' AND cl.created_at >= :date_from
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $busyCalls = $stmt->fetchColumn();
        
        // Get failed calls
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM call_logs cl
            JOIN call_campaigns cc ON cl.campaign_id = cc.id
            WHERE cc.{$scope['col']} = :scope_val AND cl.status = 'failed' AND cl.created_at >= :date_from
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $failedCalls = $stmt->fetchColumn();
        
        // Get voicemails (calls that went to voicemail)
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM call_logs cl
            JOIN call_campaigns cc ON cl.campaign_id = cc.id
            WHERE cc.{$scope['col']} = :scope_val AND cl.status = 'completed' AND cl.call_outcome = 'voicemail' AND cl.created_at >= :date_from
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $voicemails = $stmt->fetchColumn();
        
        // Get average call duration for answered calls
        $stmt = $db->prepare("
            SELECT AVG(cl.call_duration) FROM call_logs cl
            JOIN call_campaigns cc ON cl.campaign_id = cc.id
            WHERE cc.{$scope['col']} = :scope_val AND cl.status = 'completed' AND cl.call_outcome = 'answered' AND cl.created_at >= :date_from AND cl.call_duration IS NOT NULL
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $avgDuration = (int)$stmt->fetchColumn() ?: 0;
        
        // Get daily stats
        $stmt = $db->prepare("
            SELECT DATE(cl.created_at) as date, 
                   COUNT(*) as total,
                   SUM(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'answered' THEN 1 ELSE 0 END) as answered,
                   SUM(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'no_answer' THEN 1 ELSE 0 END) as missed,
                   SUM(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'busy' THEN 1 ELSE 0 END) as busy,
                   SUM(CASE WHEN cl.status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM call_logs cl
            JOIN call_campaigns cc ON cl.campaign_id = cc.id
            WHERE cc.{$scope['col']} = :scope_val AND cl.created_at >= :date_from
            GROUP BY DATE(cl.created_at)
            ORDER BY date ASC
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $dailyStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get top campaigns
        $stmt = $db->prepare("
            SELECT 
                cc.id, cc.name,
                COUNT(cl.id) as calls,
                SUM(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'answered' THEN 1 ELSE 0 END) as answered,
                AVG(cl.call_duration) as avg_duration,
                SUM(cl.call_cost) as total_cost
            FROM call_campaigns cc
            LEFT JOIN call_logs cl ON cc.id = cl.campaign_id AND cl.created_at >= :date_from
            WHERE cc.{$scope['col']} = :scope_val
            GROUP BY cc.id, cc.name
            HAVING calls > 0
            ORDER BY answered DESC
            LIMIT 5
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $topCampaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate rates for top campaigns
        foreach ($topCampaigns as &$campaign) {
            $campaign['avg_duration'] = (int)$campaign['avg_duration'] ?: 0;
            $campaign['answerRate'] = $campaign['calls'] > 0 ? 
                round(($campaign['answered'] / $campaign['calls']) * 100, 2) : 0;
        }
        
        return [
            'totalCalls' => $totalCalls,
            'answeredCalls' => $answeredCalls,
            'missedCalls' => $missedCalls,
            'busyCalls' => $busyCalls,
            'failedCalls' => $failedCalls,
            'voicemails' => $voicemails,
            'avgDuration' => $avgDuration,
            'answerRate' => $totalCalls > 0 ? round(($answeredCalls / $totalCalls) * 100, 2) : 0,
            'conversionRate' => $answeredCalls > 0 ? round(($answeredCalls / $totalCalls) * 100, 2) : 0, // Simplified conversion rate
            'totalCost' => 0, // Would need cost tracking
            'dailyStats' => $dailyStats,
            'topCampaigns' => $topCampaigns
        ];
    }
    
    private function calculateOverview($emailAnalytics, $smsAnalytics, $formAnalytics, $callsAnalytics) {
        $totalCampaigns = ($emailAnalytics['totalSent'] > 0 ? 1 : 0) + 
                         ($smsAnalytics['total_campaigns'] ?? 0) + 
                         ($formAnalytics['totalForms'] ?? 0) + 
                         ($callsAnalytics['totalCalls'] > 0 ? 1 : 0);
        
        $totalRecipients = ($emailAnalytics['totalSent'] ?? 0) + 
                          ($smsAnalytics['stats']['total_sent'] ?? 0);
        
        $totalMessages = ($emailAnalytics['totalSent'] ?? 0) + 
                         ($smsAnalytics['stats']['total_sent'] ?? 0) +
                         ($callsAnalytics['totalCalls'] ?? 0);
        
        // Calculate overall engagement rate (weighted average)
        $emailWeight = $emailAnalytics['totalSent'] ?? 0;
        $smsWeight = $smsAnalytics['stats']['total_sent'] ?? 0;
        $callsWeight = $callsAnalytics['totalCalls'] ?? 0;
        $totalWeight = $emailWeight + $smsWeight + $callsWeight;
        
        $emailEngagement = $emailAnalytics['openRate'] ?? 0;
        $smsEngagement = $smsAnalytics['stats']['delivery_rate'] ?? 0;
        $callsEngagement = $callsAnalytics['answerRate'] ?? 0;
        
        $engagementRate = $totalWeight > 0 ? 
            (($emailWeight * $emailEngagement) + ($smsWeight * $smsEngagement) + ($callsWeight * $callsEngagement)) / $totalWeight : 0;
        
        return [
            'totalCampaigns' => $totalCampaigns,
            'totalRecipients' => $totalRecipients,
            'totalMessages' => $totalMessages,
            'totalRevenue' => 0, // Would need revenue tracking
            'engagementRate' => round($engagementRate, 2)
        ];
    }
    
    private function getContactsAnalytics(array $scope, $db, $timeframe) {
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        // Get total contacts
        $stmt = $db->prepare("SELECT COUNT(*) FROM recipients WHERE {$scope['col']} = :scope_val");
        $stmt->execute(['scope_val' => $scope['val']]);
        $totalContacts = $stmt->fetchColumn();
        
        // Get new contacts in timeframe
        $stmt = $db->prepare("SELECT COUNT(*) FROM recipients WHERE {$scope['col']} = :scope_val AND created_at >= :date_from");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $newContacts = $stmt->fetchColumn();
        
        // Get contacts by type
        $stmt = $db->prepare("
            SELECT type, COUNT(*) as count 
            FROM recipients 
            WHERE {$scope['col']} = :scope_val 
            GROUP BY type
        ");
        $stmt->execute(['scope_val' => $scope['val']]);
        $contactsByType = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get contacts by status
        $stmt = $db->prepare("
            SELECT status, COUNT(*) as count 
            FROM recipients 
            WHERE {$scope['col']} = :scope_val 
            GROUP BY status
        ");
        $stmt->execute(['scope_val' => $scope['val']]);
        $contactsByStatus = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get daily new contacts
        $stmt = $db->prepare("
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM recipients 
            WHERE {$scope['col']} = :scope_val AND created_at >= :date_from
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        $stmt->execute(['scope_val' => $scope['val'], 'date_from' => $dateFrom]);
        $dailyNewContacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'totalContacts' => $totalContacts,
            'newContacts' => $newContacts,
            'contactsByType' => $contactsByType,
            'contactsByStatus' => $contactsByStatus,
            'dailyNewContacts' => $dailyNewContacts,
            'growthRate' => $totalContacts > 0 ? round(($newContacts / $totalContacts) * 100, 2) : 0
        ];
    }
    
    private function getAutomationsAnalytics(array $scope, $db, $timeframe) {
        $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
        
        // Get total automations
        $stmt = $db->prepare("SELECT COUNT(*) FROM followup_automations WHERE {$scope['col']} = :scope_val");
        $stmt->execute(['scope_val' => $scope['val']]);
        $totalAutomations = $stmt->fetchColumn();
        
        // Get active automations
        $stmt = $db->prepare("SELECT COUNT(*) FROM followup_automations WHERE {$scope['col']} = :scope_val AND is_active = 1");
        $stmt->execute(['scope_val' => $scope['val']]);
        $activeAutomations = $stmt->fetchColumn();
        
        // Get automations by channel
        $stmt = $db->prepare("
            SELECT channel, COUNT(*) as count 
            FROM followup_automations 
            WHERE {$scope['col']} = :scope_val 
            GROUP BY channel
        ");
        $stmt->execute(['scope_val' => $scope['val']]);
        $automationsByChannel = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get automations by trigger type
        $stmt = $db->prepare("
            SELECT trigger_type, COUNT(*) as count 
            FROM followup_automations 
            WHERE {$scope['col']} = :scope_val 
            GROUP BY trigger_type
            ORDER BY count DESC
            LIMIT 10
        ");
        $stmt->execute(['scope_val' => $scope['val']]);
        $topTriggers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'totalAutomations' => $totalAutomations,
            'activeAutomations' => $activeAutomations,
            'automationsByChannel' => $automationsByChannel,
            'topTriggers' => $topTriggers,
            'activationRate' => $totalAutomations > 0 ? round(($activeAutomations / $totalAutomations) * 100, 2) : 0
        ];
    }
    
    public function getExtendedAnalytics() {
        try {
            $db = Database::conn();
            $scope = $this->getWorkspaceScope();
            
            $timeframe = $_GET['timeframe'] ?? '30';
            
            // Get all analytics
            $emailAnalytics = $this->getEmailAnalytics($scope, $db, $timeframe);
            $smsAnalytics = $this->getSMSAnalytics($scope, $db, $timeframe);
            $formAnalytics = $this->getFormAnalytics($scope, $db, $timeframe);
            $callsAnalytics = $this->getCallsAnalytics($scope, $db, $timeframe);
            $contactsAnalytics = $this->getContactsAnalytics($scope, $db, $timeframe);
            $automationsAnalytics = $this->getAutomationsAnalytics($scope, $db, $timeframe);
            $overview = $this->calculateOverview($emailAnalytics, $smsAnalytics, $formAnalytics, $callsAnalytics);
            
            return Response::json([
                'email' => $emailAnalytics,
                'sms' => $smsAnalytics,
                'forms' => $formAnalytics,
                'calls' => $callsAnalytics,
                'contacts' => $contactsAnalytics,
                'automations' => $automationsAnalytics,
                'overview' => $overview,
                'timeframe' => $timeframe
            ]);
            
        } catch (Exception $e) {
            return Response::error('Failed to fetch extended analytics: ' . $e->getMessage(), 500);
        }
    }
}