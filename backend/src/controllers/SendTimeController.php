<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class SendTimeController {
    
    // Get send time analytics for a contact
    public static function getContactAnalytics(string $contactId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT * FROM send_time_analytics 
            WHERE user_id = ? AND contact_id = ?
            ORDER BY engagement_score DESC
        ');
        $stmt->execute([$userId, $contactId]);
        
        Response::json(['items' => $stmt->fetchAll()]);
    }
    
    // Get optimal send times (aggregated)
    public static function getOptimalTimes(): void {
        $userId = Auth::userIdOrFail();
        $channel = $_GET['channel'] ?? 'email';
        $pdo = Database::conn();
        
        // Get aggregated best times
        $stmt = $pdo->prepare('
            SELECT 
                hour_of_day,
                day_of_week,
                SUM(opens) as total_opens,
                SUM(clicks) as total_clicks,
                SUM(replies) as total_replies,
                SUM(total_sent) as total_sent,
                AVG(engagement_score) as avg_engagement
            FROM send_time_analytics 
            WHERE user_id = ? AND channel = ?
            GROUP BY hour_of_day, day_of_week
            ORDER BY avg_engagement DESC
            LIMIT 10
        ');
        $stmt->execute([$userId, $channel]);
        $bestTimes = $stmt->fetchAll();
        
        // Get heatmap data
        $stmt = $pdo->prepare('
            SELECT 
                hour_of_day,
                day_of_week,
                AVG(engagement_score) as engagement
            FROM send_time_analytics 
            WHERE user_id = ? AND channel = ?
            GROUP BY hour_of_day, day_of_week
        ');
        $stmt->execute([$userId, $channel]);
        $heatmap = $stmt->fetchAll();
        
        Response::json([
            'best_times' => $bestTimes,
            'heatmap' => $heatmap
        ]);
    }
    
    // Get campaign send settings
    public static function getCampaignSettings(string $campaignId): void {
        $userId = Auth::userIdOrFail();
        $campaignType = $_GET['type'] ?? 'email';
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT * FROM campaign_send_settings 
            WHERE campaign_id = ? AND campaign_type = ?
        ');
        $stmt->execute([$campaignId, $campaignType]);
        $settings = $stmt->fetch();
        
        if (!$settings) {
            // Return defaults
            $settings = [
                'campaign_id' => (int)$campaignId,
                'campaign_type' => $campaignType,
                'send_mode' => 'immediate',
                'scheduled_time' => null,
                'timezone_mode' => 'sender',
                'specific_timezone' => null,
                'send_window_start' => '09:00:00',
                'send_window_end' => '18:00:00',
                'exclude_weekends' => false,
                'throttle_per_hour' => null
            ];
        }
        
        Response::json($settings);
    }
    
    // Save campaign send settings
    public static function saveCampaignSettings(string $campaignId): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $campaignType = $body['campaign_type'] ?? 'email';
        
        // Upsert settings
        $stmt = $pdo->prepare('
            INSERT INTO campaign_send_settings 
            (campaign_id, campaign_type, send_mode, scheduled_time, timezone_mode, specific_timezone, send_window_start, send_window_end, exclude_weekends, throttle_per_hour, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                send_mode = VALUES(send_mode),
                scheduled_time = VALUES(scheduled_time),
                timezone_mode = VALUES(timezone_mode),
                specific_timezone = VALUES(specific_timezone),
                send_window_start = VALUES(send_window_start),
                send_window_end = VALUES(send_window_end),
                exclude_weekends = VALUES(exclude_weekends),
                throttle_per_hour = VALUES(throttle_per_hour),
                updated_at = NOW()
        ');
        $stmt->execute([
            $campaignId,
            $campaignType,
            $body['send_mode'] ?? 'immediate',
            $body['scheduled_time'] ?? null,
            $body['timezone_mode'] ?? 'sender',
            $body['specific_timezone'] ?? null,
            $body['send_window_start'] ?? '09:00:00',
            $body['send_window_end'] ?? '18:00:00',
            $body['exclude_weekends'] ?? false,
            $body['throttle_per_hour'] ?? null
        ]);
        
        $stmt = $pdo->prepare('SELECT * FROM campaign_send_settings WHERE campaign_id = ? AND campaign_type = ?');
        $stmt->execute([$campaignId, $campaignType]);
        
        Response::json($stmt->fetch());
    }
    
    // Get timezone list
    public static function getTimezones(): void {
        $timezones = [
            ['value' => 'America/New_York', 'label' => 'Eastern Time (ET)', 'offset' => '-05:00'],
            ['value' => 'America/Chicago', 'label' => 'Central Time (CT)', 'offset' => '-06:00'],
            ['value' => 'America/Denver', 'label' => 'Mountain Time (MT)', 'offset' => '-07:00'],
            ['value' => 'America/Los_Angeles', 'label' => 'Pacific Time (PT)', 'offset' => '-08:00'],
            ['value' => 'America/Anchorage', 'label' => 'Alaska Time (AKT)', 'offset' => '-09:00'],
            ['value' => 'Pacific/Honolulu', 'label' => 'Hawaii Time (HST)', 'offset' => '-10:00'],
            ['value' => 'Europe/London', 'label' => 'London (GMT)', 'offset' => '+00:00'],
            ['value' => 'Europe/Paris', 'label' => 'Paris (CET)', 'offset' => '+01:00'],
            ['value' => 'Europe/Berlin', 'label' => 'Berlin (CET)', 'offset' => '+01:00'],
            ['value' => 'Asia/Dubai', 'label' => 'Dubai (GST)', 'offset' => '+04:00'],
            ['value' => 'Asia/Kolkata', 'label' => 'India (IST)', 'offset' => '+05:30'],
            ['value' => 'Asia/Singapore', 'label' => 'Singapore (SGT)', 'offset' => '+08:00'],
            ['value' => 'Asia/Tokyo', 'label' => 'Tokyo (JST)', 'offset' => '+09:00'],
            ['value' => 'Australia/Sydney', 'label' => 'Sydney (AEST)', 'offset' => '+10:00'],
            ['value' => 'Pacific/Auckland', 'label' => 'Auckland (NZST)', 'offset' => '+12:00'],
        ];
        
        Response::json(['items' => $timezones]);
    }
    
    // Calculate optimal send time for a contact
    public static function calculateOptimalTime(string $contactId): void {
        $userId = Auth::userIdOrFail();
        $channel = $_GET['channel'] ?? 'email';
        $pdo = Database::conn();
        
        // Get contact's engagement history
        $stmt = $pdo->prepare('
            SELECT hour_of_day, day_of_week, engagement_score
            FROM send_time_analytics 
            WHERE user_id = ? AND contact_id = ? AND channel = ?
            ORDER BY engagement_score DESC
            LIMIT 1
        ');
        $stmt->execute([$userId, $contactId, $channel]);
        $best = $stmt->fetch();
        
        if ($best) {
            Response::json([
                'optimal_hour' => (int)$best['hour_of_day'],
                'optimal_day' => (int)$best['day_of_week'],
                'engagement_score' => (float)$best['engagement_score'],
                'source' => 'historical'
            ]);
        } else {
            // Return general best times
            Response::json([
                'optimal_hour' => 10, // 10 AM
                'optimal_day' => 2, // Tuesday
                'engagement_score' => 0,
                'source' => 'default'
            ]);
        }
    }
    
    // Record engagement for analytics
    public static function recordEngagement(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $contactId = $body['contact_id'] ?? null;
        $channel = $body['channel'] ?? 'email';
        $engagementType = $body['type'] ?? 'open'; // open, click, reply
        $timestamp = $body['timestamp'] ?? date('Y-m-d H:i:s');
        
        if (!$contactId) {
            Response::error('Contact ID is required', 422);
            return;
        }
        
        $dt = new DateTime($timestamp);
        $hour = (int)$dt->format('G');
        $day = (int)$dt->format('w');
        
        // Upsert analytics
        $openIncrement = $engagementType === 'open' ? 1 : 0;
        $clickIncrement = $engagementType === 'click' ? 1 : 0;
        $replyIncrement = $engagementType === 'reply' ? 1 : 0;
        
        $stmt = $pdo->prepare('
            INSERT INTO send_time_analytics 
            (user_id, contact_id, channel, hour_of_day, day_of_week, opens, clicks, replies, total_sent, engagement_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            ON DUPLICATE KEY UPDATE
                opens = opens + VALUES(opens),
                clicks = clicks + VALUES(clicks),
                replies = replies + VALUES(replies),
                total_sent = total_sent + 1,
                engagement_score = (opens + clicks * 2 + replies * 3) / total_sent * 100
        ');
        
        $baseScore = $openIncrement * 1 + $clickIncrement * 2 + $replyIncrement * 3;
        $stmt->execute([
            $userId, $contactId, $channel, $hour, $day,
            $openIncrement, $clickIncrement, $replyIncrement, $baseScore * 100
        ]);
        
        Response::json(['success' => true]);
    }
}
