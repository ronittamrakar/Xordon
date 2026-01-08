<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';
require_once __DIR__ . '/AnalyticsController.php';

class DashboardSummaryController {
    public static function getSummary(): void {
        try {
            $userId = Auth::userIdOrFail();
            $pdo = Database::conn();
            $ctx = $GLOBALS['tenantContext'] ?? null;
            
            $workspaceId = $ctx->workspaceId ?? null;
            $companyId = $ctx->activeCompanyId ?? null;
            
            $scopeCol = $workspaceId ? 'workspace_id' : 'user_id';
            $scopeVal = $workspaceId ?: $userId;
            
            $summary = [];
            
            // 1. Analytics Summary
            $summary['analytics'] = AnalyticsController::getSummaryData($userId, null, $scopeCol, $scopeVal);
            
            // 2. Recent Campaigns
            $stmt = $pdo->prepare("SELECT * FROM campaigns WHERE $scopeCol = ? ORDER BY created_at DESC LIMIT 5");
            $stmt->execute([$scopeVal]);
            $summary['campaigns'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // 3. CRM Dashboard (Simplified)
            $stmt = $pdo->prepare("SELECT 
                COUNT(*) as total_leads,
                COUNT(CASE WHEN lead_stage = 'new' THEN 1 END) as new_leads,
                COUNT(CASE WHEN lead_stage = 'closed_won' THEN 1 END) as won_deals
                FROM leads WHERE $scopeCol = ?");
            $stmt->execute([$scopeVal]);
            $summary['crm'] = ['metrics' => $stmt->fetch(PDO::FETCH_ASSOC)];
            
            // 4. Payments Analytics
            $stmt = $pdo->prepare("SELECT 
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
                COUNT(*) as total_payments
                FROM payments WHERE $scopeCol = ?");
            $stmt->execute([$scopeVal]);
            $paymentStats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get daily trend for last 30 days
            $stmt = $pdo->prepare("SELECT 
                DATE(created_at) as date,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue
                FROM payments 
                WHERE $scopeCol = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) ASC");
            $stmt->execute([$scopeVal]);
            $dailyTrend = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $summary['payments'] = [
                'summary' => $paymentStats,
                'daily_trend' => $dailyTrend
            ];
            
            // 5. Reputation Stats
            $stmt = $pdo->prepare("SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM reviews WHERE $scopeCol = ?");
            $stmt->execute([$scopeVal]);
            $summary['reputation'] = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // 6. Upcoming Appointments
            $stmt = $pdo->prepare("SELECT * FROM appointments_v2 WHERE $scopeCol = ? AND start_time >= NOW() ORDER BY start_time ASC LIMIT 5");
            $stmt->execute([$scopeVal]);
            $summary['appointments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // 7. Sending Accounts
            $stmt = $pdo->prepare("SELECT * FROM sending_accounts WHERE $scopeCol = ?");
            $stmt->execute([$scopeVal]);
            $summary['sending_accounts'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // 8. Phone Numbers
            $stmt = $pdo->prepare("SELECT * FROM phone_numbers WHERE $scopeCol = ?");
            $stmt->execute([$scopeVal]);
            $summary['phone_numbers'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 9. Pipelines
            $stmt = $pdo->prepare("SELECT * FROM pipelines WHERE $scopeCol = ?");
            $stmt->execute([$scopeVal]);
            $summary['pipelines'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 10. Recent Reviews
            $stmt = $pdo->prepare("SELECT * FROM reviews WHERE $scopeCol = ? ORDER BY review_date DESC LIMIT 3");
            $stmt->execute([$scopeVal]);
            $summary['reviews'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 11. Recent Activities
            $stmt = $pdo->prepare("SELECT * FROM activities WHERE $scopeCol = ? ORDER BY created_at DESC LIMIT 5");
            $stmt->execute([$scopeVal]);
            $summary['activities'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 12. Notifications
            $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5");
            $stmt->execute([$userId]);
            $summary['notifications'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 13. System Health (Minimal)
            $summary['health'] = [
                'status' => 'healthy',
                'timestamp' => date('c')
            ];

            // 14. Tasks (Upcoming)
            try {
                // Check if table exists first to avoid errors during migration
                $stmt = $pdo->prepare("SELECT t.*, c.name as contact_name 
                    FROM sales_tasks t 
                    LEFT JOIN contacts c ON t.contact_id = c.id 
                    WHERE t.$scopeCol = ? 
                    AND t.status != 'completed' 
                    ORDER BY t.due_date ASC LIMIT 5");
                $stmt->execute([$scopeVal]);
                $summary['tasks'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {
                $summary['tasks'] = [];
            }

            // 15. Daily Goals
            try {
                $stmt = $pdo->prepare("SELECT * FROM daily_goals WHERE user_id = ? AND date = CURDATE()");
                $stmt->execute([$userId]);
                $goal = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$goal) {
                    $goal = [
                        'calls_goal' => 20, 'calls_completed' => 0,
                        'emails_goal' => 50, 'emails_completed' => 0,
                        'meetings_goal' => 3, 'meetings_completed' => 0,
                        'tasks_goal' => 10, 'tasks_completed' => 0
                    ];
                }
                $summary['goals'] = $goal;
            } catch (Exception $e) {
                $summary['goals'] = [];
            }

            // 16. Channel Stats
            $channelStats = [];
            
            // Email
            try {
                $stmt = $pdo->prepare("SELECT SUM(sent) as sent, SUM(opens) as opened, SUM(clicks) as clicked, SUM(bounces) as bounces FROM campaigns WHERE $scopeCol = ?");
                $stmt->execute([$scopeVal]);
                $emailStats = $stmt->fetch(PDO::FETCH_ASSOC);
                $channelStats[] = [
                    'channel' => 'email',
                    'sent' => (int)($emailStats['sent'] ?? 0),
                    'delivered' => (int)(($emailStats['sent'] ?? 0) - ($emailStats['bounces'] ?? 0)),
                    'opened' => (int)($emailStats['opened'] ?? 0),
                    'clicked' => (int)($emailStats['clicked'] ?? 0),
                    'avgResponseTime' => '2.4h' 
                ];
            } catch (Exception $e) {}

            // SMS
            try {
                $stmt = $pdo->prepare("SELECT SUM(sent_count) as sent, SUM(sent_count - failed_count) as delivered FROM sms_campaigns WHERE $scopeCol = ?");
                $stmt->execute([$scopeVal]);
                $smsStats = $stmt->fetch(PDO::FETCH_ASSOC);
                $channelStats[] = [
                    'channel' => 'sms',
                    'sent' => (int)($smsStats['sent'] ?? 0),
                    'delivered' => (int)($smsStats['delivered'] ?? 0),
                    'replied' => 0, // Need separate query for replies
                    'avgResponseTime' => '45m' // hardcoded
                ];
            } catch (Exception $e) {}

            // Calls
            try {
                $stmt = $pdo->prepare("SELECT SUM(total_recipients) as sent, SUM(answered_calls) as delivered FROM call_campaigns WHERE $scopeCol = ?");
                $stmt->execute([$scopeVal]);
                $callStats = $stmt->fetch(PDO::FETCH_ASSOC);
                $channelStats[] = [
                    'channel' => 'call',
                    'sent' => (int)($callStats['sent'] ?? 0),
                    'delivered' => (int)($callStats['delivered'] ?? 0), // Answered = delivered?
                    'avgResponseTime' => '1.2h' // hardcoded
                ];
            } catch (Exception $e) {}

            $summary['channel_stats'] = $channelStats;
            
            Response::json($summary);
        } catch (Exception $e) {
            Response::json(['error' => $e->getMessage()], 500);
        }
    }
}
