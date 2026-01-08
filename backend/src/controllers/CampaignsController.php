<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';

class CampaignsController {
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'email.campaigns.view')) {
            Response::forbidden('You do not have permission to view email campaigns');
            return;
        }
        
        $pdo = Database::conn();
        
        // Build base WHERE with workspace + company scoping
        $baseWhere = '';
        $baseParams = [];
        if ($ctx && isset($ctx->workspaceId)) {
            $baseWhere = 'c.workspace_id = ?';
            $baseParams[] = (int)$ctx->workspaceId;
            // Add company scoping if active company is set
            if ($ctx->activeCompanyId) {
                $baseWhere .= ' AND (c.company_id = ? OR c.company_id IS NULL)';
                $baseParams[] = (int)$ctx->activeCompanyId;
            }
        } else {
            $baseWhere = 'c.user_id = ?';
            $baseParams[] = $userId;
        }
        
        // Check for folder filter
        $folderId = $_GET['folder_id'] ?? null;
        
        if ($folderId === 'null' || $folderId === '') {
            // Show campaigns without folder
            $stmt = $pdo->prepare("
                SELECT c.*, f.name as folder_name 
                FROM campaigns c 
                LEFT JOIN folders f ON c.folder_id = f.id 
                WHERE $baseWhere AND c.folder_id IS NULL 
                ORDER BY c.created_at DESC
            ");
            $stmt->execute($baseParams);
        } elseif ($folderId) {
            // Show campaigns in specific folder
            $stmt = $pdo->prepare("
                SELECT c.*, f.name as folder_name 
                FROM campaigns c 
                LEFT JOIN folders f ON c.folder_id = f.id 
                WHERE $baseWhere AND c.folder_id = ? 
                ORDER BY c.created_at DESC
            ");
            $stmt->execute([...$baseParams, $folderId]);
        } else {
            // Show all campaigns
            $stmt = $pdo->prepare("
                SELECT c.*, f.name as folder_name 
                FROM campaigns c 
                LEFT JOIN folders f ON c.folder_id = f.id 
                WHERE $baseWhere 
                ORDER BY c.created_at DESC
            ");
            $stmt->execute($baseParams);
        }
        
        $rows = $stmt->fetchAll();
        Response::json(['items' => array_map(fn($c) => self::map($c), $rows)]);
    }
    public static function show(string $id): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'email.campaigns.view')) {
            Response::forbidden('You do not have permission to view email campaigns');
            return;
        }
        
        $pdo = Database::conn();
        
        // Build query with workspace scoping
        $whereConditions = ['id = ?'];
        $params = [$id];
        if ($ctx && isset($ctx->workspaceId)) {
            $whereConditions[] = 'workspace_id = ?';
            $params[] = (int)$ctx->workspaceId;
        } else {
            $whereConditions[] = 'user_id = ?';
            $params[] = $userId;
        }
        $whereClause = implode(' AND ', $whereConditions);
        
        $stmt = $pdo->prepare("SELECT * FROM campaigns WHERE $whereClause");
        $stmt->execute($params);
        $row = $stmt->fetch();
        if (!$row) Response::error('Not found', 404);
        Response::json(self::map($row));
    }
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'email.campaigns.create')) {
            Response::forbidden('You do not have permission to create email campaigns');
            return;
        }
        
        $b = get_json_body();
        $name = trim($b['name'] ?? '');
        $subject = trim($b['subject'] ?? '');
        $html = $b['html_content'] ?? '';
        $sendingAccountId = $b['sending_account_id'] ?? null;
        $sequenceId = $b['sequence_id'] ?? null;
        $scheduledAt = $b['scheduled_at'] ?? null;
        $abTestId = isset($b['ab_test_id']) ? $b['ab_test_id'] : null;
        $companyId = $b['company_id'] ?? (($ctx && isset($ctx->activeCompanyId)) ? $ctx->activeCompanyId : null);
        if (!$name) Response::error('Missing name', 422);
        
        $pdo = Database::conn();
        $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
        
        $stmt = $pdo->prepare('INSERT INTO campaigns (user_id, workspace_id, company_id, name, subject, html_content, status, sending_account_id, sequence_id, scheduled_at, ab_test_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
        $stmt->execute([$userId, $workspaceId, $companyId, $name, $subject, $html, 'draft', $sendingAccountId, $sequenceId, $scheduledAt, $abTestId]);
        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM campaigns WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(self::map($stmt->fetch()), 201);
    }
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'email.campaigns.edit')) {
            Response::forbidden('You do not have permission to edit email campaigns');
            return;
        }
        
        $b = get_json_body();
        $map = [
            'name' => 'name',
            'subject' => 'subject',
            'html_content' => 'html_content',
            'status' => 'status',
            'sending_account_id' => 'sending_account_id',
            'sequence_id' => 'sequence_id',
            'scheduled_at' => 'scheduled_at',
            'ab_test_id' => 'ab_test_id',
            'company_id' => 'company_id',
        ];
        $sets = [];
        $vals = [];
        foreach ($map as $k => $col) {
            if (array_key_exists($k, $b)) { 
                $value = $b[$k];
                // Ensure status is never empty - default to 'draft'
                if ($k === 'status' && empty($value)) {
                    $value = 'draft';
                }
                $sets[] = "$col = ?"; 
                $vals[] = $value; 
            }
        }
        if (empty($sets)) Response::error('No changes', 422);
        $sets[] = 'updated_at = CURRENT_TIMESTAMP';
        
        // Build WHERE with workspace scoping
        $whereConditions = ['id = ?'];
        $vals[] = $id;
        if ($ctx && isset($ctx->workspaceId)) {
            $whereConditions[] = 'workspace_id = ?';
            $vals[] = (int)$ctx->workspaceId;
        } else {
            $whereConditions[] = 'user_id = ?';
            $vals[] = $userId;
        }
        $whereClause = implode(' AND ', $whereConditions);
        
        $pdo = Database::conn();
        $sql = 'UPDATE campaigns SET ' . implode(', ', $sets) . " WHERE $whereClause";
        $stmt = $pdo->prepare($sql); $stmt->execute($vals);
        $stmt = $pdo->prepare('SELECT * FROM campaigns WHERE id = ?'); $stmt->execute([$id]);
        Response::json(self::map($stmt->fetch()));
    }
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'email.campaigns.delete')) {
            Response::forbidden('You do not have permission to delete email campaigns');
            return;
        }
        
        $pdo = Database::conn();
        
        // Build WHERE with workspace scoping
        $whereConditions = ['id = ?'];
        $params = [$id];
        if ($ctx && isset($ctx->workspaceId)) {
            $whereConditions[] = 'workspace_id = ?';
            $params[] = (int)$ctx->workspaceId;
        } else {
            $whereConditions[] = 'user_id = ?';
            $params[] = $userId;
        }
        $whereClause = implode(' AND ', $whereConditions);
        
        $stmt = $pdo->prepare("DELETE FROM campaigns WHERE $whereClause");
        $stmt->execute($params);
        Response::json(['ok' => true]);
    }
    public static function simulateSend(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Use workspace scoping for tenant isolation
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx && isset($ctx->workspaceId) ? (int)$ctx->workspaceId : null;
        
        $pdo->beginTransaction();
        try {
            // Build workspace-scoped WHERE clause
            if ($workspaceId) {
                $campaignWhere = 'id = ? AND workspace_id = ?';
                $campaignParams = [$id, $workspaceId];
                $recipientWhere = 'campaign_id = ? AND workspace_id = ?';
                $recipientParams = [$id, $workspaceId];
            } else {
                $campaignWhere = 'id = ? AND user_id = ?';
                $campaignParams = [$id, $userId];
                $recipientWhere = 'campaign_id = ?';
                $recipientParams = [$id];
            }
            
            // Mark recipients as sent for this campaign with workspace scoping
            $stmt = $pdo->prepare("UPDATE recipients SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE $recipientWhere");
            $stmt->execute($recipientParams);
            
            // Count recipients for the campaign with workspace scoping
            $stmt = $pdo->prepare("SELECT COUNT(*) AS total FROM recipients WHERE $recipientWhere");
            $stmt->execute($recipientParams);
            $total = (int)($stmt->fetch()['total'] ?? 0);
            
            // Update campaign aggregates with workspace scoping
            $stmt = $pdo->prepare("UPDATE campaigns SET status = 'completed', total_recipients = ?, sent = ? WHERE $campaignWhere");
            $stmt->execute([$total, $total, ...$campaignParams]);
            
            $pdo->commit();
            self::show($id);
        } catch (Throwable $e) {
            $pdo->rollBack();
            Response::error('Failed to simulate send', 500);
        }
    }

    public static function send(string $id): void {
        require_once __DIR__ . '/../services/SimpleMail.php';
        
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->hasPermission($userId, 'email.campaigns.send')) {
            Response::forbidden('You do not have permission to send email campaigns');
            return;
        }
        $pdo = Database::conn();
        
        try {
            // Get campaign details with workspace scoping
            $whereConditions = ['id = ?'];
            $params = [$id];
            if ($ctx && isset($ctx->workspaceId)) {
                $whereConditions[] = 'workspace_id = ?';
                $params[] = (int)$ctx->workspaceId;
            } else {
                $whereConditions[] = 'user_id = ?';
                $params[] = $userId;
            }
            $whereClause = implode(' AND ', $whereConditions);
            
            $stmt = $pdo->prepare("SELECT * FROM campaigns WHERE $whereClause");
            $stmt->execute($params);
            $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$campaign) {
                Response::error('Campaign not found', 404);
                return;
            }

            if ($campaign['status'] !== 'draft' && $campaign['status'] !== 'paused') {
                Response::error('Campaign cannot be sent in current status', 400);
                return;
            }

            // Update campaign status to sending
            $stmt = $pdo->prepare('UPDATE campaigns SET status = "sending" WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, $userId]);

            // Use SimpleMail service to send emails
            $mailService = new SimpleMail();
            $results = $mailService->sendCampaign((int)$id, $userId);

            Response::success([
                'message' => 'Campaign sending initiated',
                'results' => $results,
                'campaign_id' => $id
            ]);

        } catch (Throwable $e) {
            error_log('Campaign send failed: ' . $e->getMessage());
            Response::error('Failed to send campaign: ' . $e->getMessage(), 500);
        }
    }
    private static function map(array $c): array {
        return [
            'id' => (string)$c['id'],
            'name' => $c['name'],
            'subject' => $c['subject'] ?? '',
            'html_content' => $c['html_content'] ?? '',
            'status' => $c['status'] ?? 'draft',
            'sending_account_id' => $c['sending_account_id'] ?? null,
            'sequence_id' => $c['sequence_id'] ?? null,
            'scheduled_at' => $c['scheduled_at'] ?? null,
            'ab_test_id' => $c['ab_test_id'] ?? null,
            'created_at' => $c['created_at'] ?? null,
            'updated_at' => $c['updated_at'] ?? null,
            'total_recipients' => (int)($c['total_recipients'] ?? 0),
            'sent' => (int)($c['sent'] ?? 0),
            'opens' => (int)($c['opens'] ?? 0),
            'clicks' => (int)($c['clicks'] ?? 0),
            'bounces' => (int)($c['bounces'] ?? 0),
            'unsubscribes' => (int)($c['unsubscribes'] ?? 0),
            'folder_id' => $c['folder_id'] ?? null,
            'folder_name' => $c['folder_name'] ?? null,
        ];
    }
}