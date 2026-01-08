<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ClientDashboardController {
    
    public static function getStats() {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Priority 1: Check if user has switched to a subaccount (stored in current_subaccount_id in users table)
        $subaccountId = null;
        try {
            $stmt = $pdo->prepare("SELECT current_subaccount_id FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $userData = $stmt->fetch(PDO::FETCH_ASSOC);
            $subaccountId = $userData['current_subaccount_id'] ?? null;
        } catch (PDOException $e) {
            // Column may not exist yet - silently ignore
            error_log('ClientDashboard: current_subaccount_id column may not exist: ' . $e->getMessage());
        }
        
        // Priority 2: Fall back to legacy workspace context
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = null;
        
        if ($subaccountId) {
            // Get the linked workspace_id for this subaccount
            try {
                $stmt = $pdo->prepare("SELECT w.id FROM workspaces w WHERE w.subaccount_id = ?");
                $stmt->execute([$subaccountId]);
                $ws = $stmt->fetch(PDO::FETCH_ASSOC);
                $workspaceId = $ws['id'] ?? null;
            } catch (PDOException $e) {
                // Column may not exist yet
                error_log($e->getMessage());
            }
        }
        
        if (!$workspaceId && $ctx && isset($ctx->workspaceId)) {
            $workspaceId = (int)$ctx->workspaceId;
        }

        if (!$workspaceId) {
            // Return empty but valid response for new subaccounts with no data yet
            Response::json([
                'success' => true,
                'data' => [
                    'metrics' => [
                        ['title' => 'Total Contacts', 'value' => '0', 'change' => 0, 'changeLabel' => 'vs last month', 'icon' => 'Users', 'description' => 'No contacts yet'],
                        ['title' => 'Emails Sent', 'value' => '0', 'change' => 0, 'changeLabel' => 'total delivered', 'icon' => 'Mail', 'description' => 'No emails sent yet'],
                        ['title' => 'Open Rate', 'value' => 'N/A', 'change' => 0, 'changeLabel' => 'average rate', 'icon' => 'TrendingUp', 'description' => 'Start a campaign to see rates'],
                        ['title' => 'Active Campaigns', 'value' => '0', 'icon' => 'BarChart3', 'description' => 'No campaigns running']
                    ],
                    'activities' => [],
                    'campaigns' => [],
                    'summary' => [
                        'forms_submitted' => 0,
                        'new_contacts' => 0,
                        'delivery_rate' => 'N/A',
                        'tasks_pending' => 0
                    ]
                ]
            ]);
            return;
        }
        
        // 1. Basic Metrics with fallbacks
        $totalContacts = 0;
        $newContacts = 0;
        $contactsChange = 0;
        $totalSent = 0;
        $totalOpens = 0;
        $openRate = 0;
        $activeCampaigns = 0;
        $activities = [];
        $campaigns = [];
        $formsSubmitted = 0;
        $pendingTasks = 0;
        $deliveryRate = 100.0;
        
        try {
            // Total Contacts
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM contacts WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $totalContacts = (int)$stmt->fetchColumn();
            
            // New Contacts (last 30 days)
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM contacts WHERE workspace_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
            $stmt->execute([$workspaceId]);
            $newContacts = (int)$stmt->fetchColumn();
            
            // Previous period contacts (for change calculation)
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM contacts WHERE workspace_id = ? AND created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)");
            $stmt->execute([$workspaceId]);
            $prevContacts = (int)$stmt->fetchColumn();
            $contactsChange = $prevContacts > 0 ? round((($newContacts - $prevContacts) / $prevContacts) * 100, 1) : ($newContacts > 0 ? 100 : 0);
        } catch (PDOException $e) {
            error_log('ClientDashboard: contacts query failed: ' . $e->getMessage());
        }

        try {
            // Email Stats from Campaigns
            $stmt = $pdo->prepare("
                SELECT 
                    SUM(sent) as total_sent,
                    SUM(opens) as total_opens,
                    SUM(clicks) as total_clicks,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_campaigns
                FROM campaigns 
                WHERE workspace_id = ?
            ");
            $stmt->execute([$workspaceId]);
            $emailStats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $totalSent = (int)($emailStats['total_sent'] ?? 0);
            $totalOpens = (int)($emailStats['total_opens'] ?? 0);
            $openRate = $totalSent > 0 ? round(($totalOpens / $totalSent) * 100, 1) : 0;
            $activeCampaigns = (int)($emailStats['active_campaigns'] ?? 0);
        } catch (PDOException $e) {
            error_log('ClientDashboard: campaigns stats query failed: ' . $e->getMessage());
        }

        try {
            // 2. Recent Activities - simplified to just campaigns
            $stmt = $pdo->prepare("
                SELECT 'email' as type, name as title, status, created_at as date 
                FROM campaigns 
                WHERE workspace_id = ?
                ORDER BY created_at DESC
                LIMIT 5
            ");
            $stmt->execute([$workspaceId]);
            $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('ClientDashboard: activities query failed: ' . $e->getMessage());
        }
        
        try {
            // 3. Campaign Performance
            $stmt = $pdo->prepare("
                SELECT name, sent, opens as opened, clicks as clicked, status
                FROM campaigns
                WHERE workspace_id = ?
                ORDER BY created_at DESC
                LIMIT 3
            ");
            $stmt->execute([$workspaceId]);
            $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log('ClientDashboard: campaigns query failed: ' . $e->getMessage());
        }

        try {
            // 4. Monthly Summary - Forms submitted (simplified)
            $stmt = $pdo->prepare("
                SELECT COUNT(*) 
                FROM webforms_form_submissions fs
                JOIN webforms_forms f ON fs.form_id = f.id
                WHERE f.workspace_id = ? AND fs.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ");
            $stmt->execute([$workspaceId]);
            $formsSubmitted = (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log('ClientDashboard: forms query failed: ' . $e->getMessage());
        }

        try {
            // Pending Tasks
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM sales_tasks WHERE workspace_id = ? AND status NOT IN ('completed', 'cancelled')");
            $stmt->execute([$workspaceId]);
            $pendingTasks = (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log('ClientDashboard: tasks query failed: ' . $e->getMessage());
        }

        try {
            // Calculate real delivery rate
            $stmt = $pdo->prepare("SELECT SUM(sent) as delivered, SUM(total_recipients) as total FROM campaigns WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $deliveryStats = $stmt->fetch(PDO::FETCH_ASSOC);
            $delivered = (int)($deliveryStats['delivered'] ?? 0);
            $totalTried = (int)($deliveryStats['total'] ?? 0);
            $deliveryRate = $totalTried > 0 ? round(($delivered / $totalTried) * 100, 1) : 100.0;
        } catch (PDOException $e) {
            error_log('ClientDashboard: delivery rate query failed: ' . $e->getMessage());
        }

        Response::json([
            'success' => true,
            'data' => [
                'metrics' => [
                    [
                        'title' => 'Total Contacts',
                        'value' => number_format($totalContacts),
                        'change' => $contactsChange,
                        'changeLabel' => 'vs last month',
                        'icon' => 'Users',
                        'description' => 'Active contacts in your database'
                    ],
                    [
                        'title' => 'Emails Sent',
                        'value' => number_format($totalSent),
                        'change' => 0,
                        'changeLabel' => 'total delivered',
                        'icon' => 'Mail',
                        'description' => 'Total emails delivered'
                    ],
                    [
                        'title' => 'Open Rate',
                        'value' => $openRate . '%',
                        'change' => 0,
                        'changeLabel' => 'average rate',
                        'icon' => 'TrendingUp',
                        'description' => 'Average email open rate'
                    ],
                    [
                        'title' => 'Active Campaigns',
                        'value' => (string)$activeCampaigns,
                        'icon' => 'BarChart3',
                        'description' => 'Currently running campaigns'
                    ]
                ],
                'activities' => array_map(function($a) {
                    return [
                        'id' => uniqid(),
                        'type' => $a['type'],
                        'title' => $a['title'],
                        'status' => $a['status'] === 'new' ? 'completed' : ($a['status'] === 'pending' ? 'pending' : 'completed'),
                        'date' => self::timeAgo($a['date'])
                    ];
                }, $activities),
                'campaigns' => array_map(function($c) {
                    return [
                        'name' => $c['name'],
                        'sent' => (int)$c['sent'],
                        'opened' => (int)$c['opened'],
                        'clicked' => (int)$c['clicked'],
                        'status' => $c['status']
                    ];
                }, $campaigns),
                'summary' => [
                    'forms_submitted' => $formsSubmitted,
                    'new_contacts' => $newContacts,
                    'delivery_rate' => $deliveryRate . '%',
                    'tasks_pending' => $pendingTasks
                ]
            ]
        ]);
    }

    private static function timeAgo($datetime) {
        $time = strtotime($datetime);
        $diff = time() - $time;
        
        if ($diff < 60) return 'Just now';
        $diff = round($diff / 60);
        if ($diff < 60) return $diff . ' min ago';
        $diff = round($diff / 60);
        if ($diff < 24) return $diff . ' hours ago';
        $diff = round($diff / 24);
        if ($diff < 7) return $diff . ' days ago';
        return date('M d, Y', $time);
    }
}
