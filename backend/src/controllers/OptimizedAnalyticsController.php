<?php

require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../services/CacheService.php';

class OptimizedAnalyticsController {
    
    public function getOptimizedAnalytics() {
        try {
            $userId = Auth::userIdOrFail();
            $timeframe = (int)($_GET['timeframe'] ?? '30'); // days
            
            // Generate cache key
            $cacheKey = CacheService::generateKey('analytics', $userId, ['timeframe' => $timeframe]);
            
            // Try to get from cache first (5 minute cache)
            $result = CacheService::remember($cacheKey, function() use ($userId, $timeframe) {
                $db = Database::conn();
                $dateFrom = date('Y-m-d H:i:s', strtotime("-{$timeframe} days"));
                
                // Use single optimized queries instead of multiple loops
                $emailAnalytics = $this->getOptimizedEmailAnalytics($userId, $db, $timeframe, $dateFrom);
                $smsAnalytics = $this->getOptimizedSMSAnalytics($userId, $db, $timeframe, $dateFrom);
                $formAnalytics = $this->getOptimizedFormAnalytics($userId, $db, $timeframe, $dateFrom);
                $callsAnalytics = $this->getOptimizedCallsAnalytics($userId, $db, $timeframe, $dateFrom);
                
                // Calculate Overview Metrics
                $overview = $this->calculateOverview($emailAnalytics, $smsAnalytics, $formAnalytics, $callsAnalytics);
                
                return [
                    'email' => $emailAnalytics,
                    'sms' => $smsAnalytics,
                    'forms' => $formAnalytics,
                    'calls' => $callsAnalytics,
                    'overview' => $overview,
                    'timeframe' => $timeframe
                ];
            }, 300); // 5 minutes cache
            
            return Response::json($result);
            
        } catch (Exception $e) {
            return Response::error('Failed to fetch optimized analytics: ' . $e->getMessage(), 500);
        }
    }
    
    private function getOptimizedEmailAnalytics($userId, $db, $timeframe, $dateFrom) {
        // Single query for total metrics
        $stmt = $db->prepare('SELECT 
            SUM(sent) as totalSent,
            SUM(opens) as totalOpens, 
            SUM(clicks) as totalClicks,
            SUM(bounces) as totalBounces,
            SUM(unsubscribes) as totalUnsubscribes
            FROM campaigns WHERE user_id = ?');
        $stmt->execute([$userId]);
        $totals = $stmt->fetch();
        
        $totalSent = (int)($totals['totalSent'] ?? 0);
        $totalOpens = (int)($totals['totalOpens'] ?? 0);
        $totalClicks = (int)($totals['totalClicks'] ?? 0);
        $totalBounces = (int)($totals['totalBounces'] ?? 0);
        $totalUnsubscribes = (int)($totals['totalUnsubscribes'] ?? 0);
        
        // Single query for all daily stats (no loop)
        $stmt = $db->prepare("
            SELECT 
                date_recorded as date,
                SUM(CASE WHEN metric_type = 'sent' THEN metric_value ELSE 0 END) as sent,
                SUM(CASE WHEN metric_type = 'opened' THEN metric_value ELSE 0 END) as opens,
                SUM(CASE WHEN metric_type = 'clicked' THEN metric_value ELSE 0 END) as clicks
            FROM analytics 
            WHERE user_id = ? AND date_recorded >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
            GROUP BY date_recorded 
            ORDER BY date_recorded ASC
        ");
        $stmt->execute([$userId, $timeframe]);
        $dailyStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Fill missing dates with zeros
        $completeDailyStats = [];
        $statsMap = array_column($dailyStats, null, 'date');
        
        for ($i = $timeframe - 1; $i >= 0; $i--) {
            $date = new DateTime();
            $date->modify("-$i day");
            $dateStr = $date->format('Y-m-d');
            
            $completeDailyStats[] = [
                'date' => $dateStr,
                'sent' => (int)($statsMap[$dateStr]['sent'] ?? 0),
                'opens' => (int)($statsMap[$dateStr]['opens'] ?? 0),
                'clicks' => (int)($statsMap[$dateStr]['clicks'] ?? 0)
            ];
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
            'dailyStats' => $completeDailyStats
        ];
    }
    
    private function getOptimizedSMSAnalytics($userId, $db, $timeframe, $dateFrom) {
        // Single query for all SMS metrics
        $stmt = $db->prepare("
            SELECT 
                COUNT(DISTINCT sc.id) as total_campaigns,
                COUNT(sm.id) as total_sent,
                SUM(CASE WHEN sm.delivery_status = 'delivered' THEN 1 ELSE 0 END) as total_delivered,
                SUM(CASE WHEN sm.delivery_status = 'failed' THEN 1 ELSE 0 END) as total_failed,
                COUNT(sr.id) as total_replies
            FROM sms_campaigns sc
            LEFT JOIN sms_messages sm ON sc.id = sm.campaign_id AND sm.created_at >= ?
            LEFT JOIN sms_replies sr ON sc.id = sr.campaign_id AND sr.created_at >= ?
            WHERE sc.user_id = ?
        ");
        $stmt->execute([$dateFrom, $dateFrom, $userId]);
        $stats = $stmt->fetch();
        
        $totalSent = (int)($stats['total_sent'] ?? 0);
        $totalDelivered = (int)($stats['total_delivered'] ?? 0);
        $totalFailed = (int)($stats['total_failed'] ?? 0);
        $totalReplies = (int)($stats['total_replies'] ?? 0);
        
        // Single query for daily volume
        $stmt = $db->prepare("
            SELECT DATE(sm.created_at) as date, COUNT(*) as count
            FROM sms_messages sm
            JOIN sms_campaigns sc ON sm.campaign_id = sc.id
            WHERE sc.user_id = ? AND sm.created_at >= ?
            GROUP BY DATE(sm.created_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$userId, $dateFrom]);
        $dailyVolume = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Single query for top campaigns
        $stmt = $db->prepare("
            SELECT 
                sc.id, sc.name,
                COUNT(sm.id) as sent,
                SUM(CASE WHEN sm.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
                COUNT(sr.id) as replies,
                COALESCE(SUM(sm.cost), 0) as total_cost
            FROM sms_campaigns sc
            LEFT JOIN sms_messages sm ON sc.id = sm.campaign_id AND sm.created_at >= ?
            LEFT JOIN sms_replies sr ON sc.id = sr.campaign_id AND sr.created_at >= ?
            WHERE sc.user_id = ?
            GROUP BY sc.id, sc.name
            HAVING sent > 0
            ORDER BY delivered DESC
            LIMIT 5
        ");
        $stmt->execute([$dateFrom, $dateFrom, $userId]);
        $topCampaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate rates for top campaigns
        foreach ($topCampaigns as &$campaign) {
            $campaign['delivery_rate'] = $campaign['sent'] > 0 ? 
                round(($campaign['delivered'] / $campaign['sent']) * 100, 2) : 0;
            $campaign['reply_rate'] = $campaign['delivered'] > 0 ? 
                round(($campaign['replies'] / $campaign['delivered']) * 100, 2) : 0;
        }
        
        return [
            'total_campaigns' => (int)($stats['total_campaigns'] ?? 0),
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
    
    private function getOptimizedFormAnalytics($userId, $db, $timeframe, $dateFrom) {
        // Single query for all form metrics
        $stmt = $db->prepare("
            SELECT 
                COUNT(DISTINCT f.id) as total_forms,
                COUNT(DISTINCT fr.id) as total_responses,
                COUNT(DISTINCT CASE WHEN fr.id IS NOT NULL THEN fr.form_id END) as forms_with_responses
            FROM forms f
            LEFT JOIN form_responses fr ON f.id = fr.form_id AND fr.created_at >= ?
            WHERE f.user_id = ?
        ");
        $stmt->execute([$dateFrom, $userId]);
        $stats = $stmt->fetch();
        
        $totalForms = (int)($stats['total_forms'] ?? 0);
        $totalResponses = (int)($stats['total_responses'] ?? 0);
        $formsWithResponses = (int)($stats['forms_with_responses'] ?? 0);
        
        $totalViews = $totalResponses; // Using responses as proxy for views
        $conversionRate = $totalForms > 0 ? round(($formsWithResponses / $totalForms) * 100, 2) : 0;
        
        // Single query for daily responses
        $stmt = $db->prepare("
            SELECT 
                DATE(fr.created_at) as date,
                COUNT(*) as responses,
                COUNT(DISTINCT fr.form_id) as views
            FROM form_responses fr
            JOIN forms f ON fr.form_id = f.id
            WHERE f.user_id = ? AND fr.created_at >= ?
            GROUP BY DATE(fr.created_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$userId, $dateFrom]);
        $dailyResponses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Create complete daily stats array
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
        
        // Single query for top forms
        $stmt = $db->prepare("
            SELECT 
                f.id, f.name,
                COUNT(fr.id) as responses,
                COUNT(DISTINCT DATE(fr.created_at)) as unique_days,
                ROUND(COUNT(fr.id) / GREATEST(COUNT(DISTINCT DATE(fr.created_at)), 1), 2) as avg_daily_responses
            FROM forms f
            LEFT JOIN form_responses fr ON f.id = fr.form_id AND fr.created_at >= ?
            WHERE f.user_id = ?
            GROUP BY f.id, f.name
            HAVING responses > 0
            ORDER BY responses DESC
            LIMIT 5
        ");
        $stmt->execute([$dateFrom, $userId]);
        $topForms = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate conversion rates for top forms
        foreach ($topForms as &$form) {
            $form['views'] = $form['responses']; // Using responses as proxy for views
            $form['conversionRate'] = round(($form['responses'] / max($form['responses'], 1)) * 100, 2);
        }
        
        return [
            'totalForms' => $totalForms,
            'totalViews' => $totalViews,
            'totalResponses' => $totalResponses,
            'conversionRate' => $conversionRate,
            'avgResponseTime' => $this->calculateAverageResponseTime($userId, $db, $dateFrom),
            'dailyResponses' => $dailyStats,
            'topForms' => $topForms,
            'responseSources' => [] // Simplified for performance
        ];
    }
    
    private function getOptimizedCallsAnalytics($userId, $db, $timeframe, $dateFrom) {
        // Single query for all call metrics
        $stmt = $db->prepare("
            SELECT 
                COUNT(DISTINCT cc.id) as total_campaigns,
                COUNT(cl.id) as total_calls,
                SUM(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'answered' THEN 1 ELSE 0 END) as answered_calls,
                SUM(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'no_answer' THEN 1 ELSE 0 END) as missed_calls,
                SUM(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'busy' THEN 1 ELSE 0 END) as busy_calls,
                SUM(CASE WHEN cl.status = 'failed' THEN 1 ELSE 0 END) as failed_calls,
                SUM(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'voicemail' THEN 1 ELSE 0 END) as voicemails,
                AVG(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'answered' AND cl.duration IS NOT NULL THEN cl.duration END) as avg_duration
            FROM call_campaigns cc
            LEFT JOIN call_logs cl ON cc.id = cl.campaign_id AND cl.created_at >= ?
            WHERE cc.user_id = ?
        ");
        $stmt->execute([$dateFrom, $userId]);
        $stats = $stmt->fetch();
        
        $totalCalls = (int)($stats['total_calls'] ?? 0);
        $answeredCalls = (int)($stats['answered_calls'] ?? 0);
        $missedCalls = (int)($stats['missed_calls'] ?? 0);
        $busyCalls = (int)($stats['busy_calls'] ?? 0);
        $failedCalls = (int)($stats['failed_calls'] ?? 0);
        $voicemails = (int)($stats['voicemails'] ?? 0);
        $avgDuration = (int)($stats['avg_duration'] ?? 0);
        
        // Single query for daily stats
        $stmt = $db->prepare("
            SELECT DATE(cl.created_at) as date, 
                   COUNT(*) as total,
                   SUM(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'answered' THEN 1 ELSE 0 END) as answered,
                   SUM(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'no_answer' THEN 1 ELSE 0 END) as missed,
                   SUM(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'busy' THEN 1 ELSE 0 END) as busy,
                   SUM(CASE WHEN cl.status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM call_logs cl
            JOIN call_campaigns cc ON cl.campaign_id = cc.id
            WHERE cc.user_id = ? AND cl.created_at >= ?
            GROUP BY DATE(cl.created_at)
            ORDER BY date ASC
        ");
        $stmt->execute([$userId, $dateFrom]);
        $dailyStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Single query for top campaigns
        $stmt = $db->prepare("
            SELECT 
                cc.id, cc.name,
                COUNT(cl.id) as calls,
                SUM(CASE WHEN cl.status = 'completed' AND cl.call_outcome = 'answered' THEN 1 ELSE 0 END) as answered,
                AVG(cl.duration) as avg_duration,
                SUM(cl.call_cost) as total_cost
            FROM call_campaigns cc
            LEFT JOIN call_logs cl ON cc.id = cl.campaign_id AND cl.created_at >= ?
            WHERE cc.user_id = ?
            GROUP BY cc.id, cc.name
            HAVING calls > 0
            ORDER BY answered DESC
            LIMIT 5
        ");
        $stmt->execute([$dateFrom, $userId]);
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
            'conversionRate' => $totalCalls > 0 ? round(($answeredCalls / $totalCalls) * 100, 2) : 0,
            'totalCost' => 0,
            'dailyStats' => $dailyStats,
            'topCampaigns' => $topCampaigns
        ];
    }
    
    private function calculateAverageResponseTime($userId, $db, $dateFrom) {
        $stmt = $db->prepare("
            SELECT AVG(response_time) as avg_time
            FROM form_responses fr
            JOIN forms f ON fr.form_id = f.id
            WHERE f.user_id = ? AND fr.created_at >= ? AND fr.response_time IS NOT NULL
        ");
        $stmt->execute([$userId, $dateFrom]);
        return (float)$stmt->fetchColumn() ?: 0;
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
            'totalRevenue' => 0,
            'engagementRate' => round($engagementRate, 2)
        ];
    }
}
