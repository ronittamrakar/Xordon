<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../services/RBACService.php';

class AllDataController {
    public static function getAllData(): void {
        try {
            $userId = Auth::userIdOrFail();
            $rbac = RBACService::getInstance();
            $scope = Database::getWorkspaceScope();
            
            // Check permission
            if (!$rbac->hasPermission($userId, 'analytics.dashboard')) {
                Response::forbidden('You do not have permission to view all data');
                return;
            }

            $pdo = Database::conn();
            $data = [];

            // Get all campaigns
            $stmt = $pdo->prepare('SELECT * FROM campaigns WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['campaigns'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all recipients
            $stmt = $pdo->prepare('SELECT r.*, c.name as campaign_name FROM recipients r LEFT JOIN campaigns c ON r.campaign_id = c.id WHERE r.' . $scope['col'] . ' = ? ORDER BY r.created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['recipients'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all SMS campaigns
            $stmt = $pdo->prepare('SELECT * FROM sms_campaigns WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['sms_campaigns'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all SMS messages
            $stmt = $pdo->prepare('SELECT sm.*, sc.name as campaign_name FROM sms_messages sm LEFT JOIN sms_campaigns sc ON sm.campaign_id = sc.id WHERE sm.' . $scope['col'] . ' = ? ORDER BY sm.created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['sms_messages'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all SMS replies
            $stmt = $pdo->prepare('SELECT * FROM sms_replies WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['sms_replies'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all forms
            $stmt = $pdo->prepare('SELECT * FROM forms WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['forms'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all form responses
            $stmt = $pdo->prepare('SELECT fr.*, f.name as form_name FROM form_responses fr LEFT JOIN forms f ON fr.form_id = f.id WHERE f.' . $scope['col'] . ' = ? ORDER BY fr.created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['form_responses'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all call campaigns
            $stmt = $pdo->prepare('SELECT * FROM call_campaigns WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['call_campaigns'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all call logs
            $stmt = $pdo->prepare('SELECT cl.*, cc.name as campaign_name FROM call_logs cl LEFT JOIN call_campaigns cc ON cl.campaign_id = cc.id WHERE cl.' . $scope['col'] . ' = ? ORDER BY cl.created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['call_logs'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all call recipients
            $stmt = $pdo->prepare('SELECT cr.*, cc.name as campaign_name FROM call_recipients cr LEFT JOIN call_campaigns cc ON cr.campaign_id = cc.id WHERE cr.' . $scope['col'] . ' = ? ORDER BY cr.created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['call_recipients'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all templates
            $stmt = $pdo->prepare('SELECT * FROM templates WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['templates'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all SMS templates
            $stmt = $pdo->prepare('SELECT * FROM sms_templates WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['sms_templates'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all sequences
            $stmt = $pdo->prepare('SELECT * FROM sequences WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['sequences'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all SMS sequences
            $stmt = $pdo->prepare('SELECT * FROM sms_sequences WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['sms_sequences'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all contacts
            $stmt = $pdo->prepare('SELECT * FROM contacts WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['contacts'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all analytics data
            $stmt = $pdo->prepare('SELECT * FROM analytics WHERE ' . $scope['col'] . ' = ? ORDER BY date_recorded DESC');
            $stmt->execute([$scope['val']]);
            $data['analytics'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all sending accounts
            $stmt = $pdo->prepare('SELECT * FROM sending_accounts WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['sending_accounts'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all connections
            $stmt = $pdo->prepare('SELECT * FROM connections WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['connections'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all call scripts
            $stmt = $pdo->prepare('SELECT * FROM call_scripts WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['call_scripts'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all call dispositions
            $stmt = $pdo->prepare('SELECT * FROM call_dispositions_types WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['call_dispositions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all groups
            $stmt = $pdo->prepare('SELECT * FROM groups WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['groups'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all tags
            $stmt = $pdo->prepare('SELECT * FROM tags WHERE ' . $scope['col'] . ' = ? ORDER BY created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['tags'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all custom variables (no user_id filter)
            $stmt = $pdo->prepare('SELECT * FROM custom_variables ORDER BY created_at DESC');
            $stmt->execute();
            $data['custom_variables'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all unsubscribes (table doesn't exist - using email_replies as alternative)
            // $stmt = $pdo->prepare('SELECT * FROM unsubscribes WHERE user_id = ? ORDER BY created_at DESC');
            // $stmt->execute([$userId]);
            $data['unsubscribes'] = [];

            // Get all SMS unsubscribes (table doesn't exist - using sms_replies as alternative)
            // $stmt = $pdo->prepare('SELECT * FROM sms_unsubscribes WHERE user_id = ? ORDER BY created_at DESC');
            // $stmt->execute([$userId]);
            $data['sms_unsubscribes'] = [];

            // Get all follow-up emails
            $stmt = $pdo->prepare('SELECT fe.*, c.name as campaign_name FROM follow_up_emails fe LEFT JOIN campaigns c ON fe.campaign_id = c.id WHERE fe.' . $scope['col'] . ' = ? ORDER BY fe.created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['follow_up_emails'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all email replies
            $stmt = $pdo->prepare('SELECT er.*, c.name as campaign_name FROM email_replies er LEFT JOIN campaigns c ON er.campaign_id = c.id WHERE er.' . $scope['col'] . ' = ? ORDER BY er.created_at DESC');
            $stmt->execute([$scope['val']]);
            $data['email_replies'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get summary statistics
            $data['summary'] = [
                'total_campaigns' => count($data['campaigns']),
                'total_sms_campaigns' => count($data['sms_campaigns']),
                'total_call_campaigns' => count($data['call_campaigns']),
                'total_forms' => count($data['forms']),
                'total_contacts' => count($data['contacts']),
                'total_templates' => count($data['templates']),
                'total_sms_templates' => count($data['sms_templates']),
                'total_sequences' => count($data['sequences']),
                'total_sms_sequences' => count($data['sms_sequences']),
                'total_recipients' => count($data['recipients']),
                'total_sms_messages' => count($data['sms_messages']),
                'total_form_responses' => count($data['form_responses']),
                'total_call_logs' => count($data['call_logs']),
                'total_analytics_records' => count($data['analytics']),
                'total_email_replies' => count($data['email_replies']),
                'total_sms_replies' => count($data['sms_replies']),
            ];

            Response::json($data);

        } catch (Exception $e) {
            error_log("AllDataController::getAllData() - Error: " . $e->getMessage());
            Response::error('Failed to fetch all data: ' . $e->getMessage(), 500);
        }
    }
}
