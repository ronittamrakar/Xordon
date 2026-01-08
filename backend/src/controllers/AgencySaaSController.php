<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class AgencySaaSController {
    
    // ============================================================================
    // SNAPSHOTS
    // ============================================================================
    
    public static function createSnapshot() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        // Collect snapshot data
        $snapshotData = [];
        
        if ($data['includes_funnels'] ?? false) {
            $stmt = $db->prepare("SELECT * FROM funnels WHERE workspace_id = ?");
            $stmt->execute([$ctx->workspaceId]);
            $snapshotData['funnels'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }
        
        if ($data['includes_automations'] ?? false) {
            $stmt = $db->prepare("SELECT * FROM automations WHERE workspace_id = ?");
            $stmt->execute([$ctx->workspaceId]);
            $snapshotData['automations'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }
        
        if ($data['includes_templates'] ?? false) {
            $stmt = $db->prepare("SELECT * FROM templates WHERE workspace_id = ?");
            $stmt->execute([$ctx->workspaceId]);
            $snapshotData['templates'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }
        
        if ($data['includes_forms'] ?? false) {
            $stmt = $db->prepare("SELECT * FROM webforms_forms WHERE workspace_id = ?");
            $stmt->execute([$ctx->workspaceId]);
            $snapshotData['forms'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }
        
        if ($data['includes_pages'] ?? false) {
            $stmt = $db->prepare("SELECT * FROM landing_pages WHERE workspace_id = ?");
            $stmt->execute([$ctx->workspaceId]);
            $snapshotData['pages'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }
        
        if ($data['includes_workflows'] ?? false) {
            $stmt = $db->prepare("SELECT * FROM workflows WHERE workspace_id = ?");
            $stmt->execute([$ctx->workspaceId]);
            $snapshotData['workflows'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }
        
        // Save snapshot
        $stmt = $db->prepare("
            INSERT INTO snapshots 
            (workspace_id, name, description, category, thumbnail_url,
             includes_funnels, includes_automations, includes_templates, 
             includes_forms, includes_pages, includes_workflows,
             snapshot_data, is_public, is_premium, price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $data['name'],
            $data['description'] ?? null,
            $data['category'] ?? null,
            $data['thumbnail_url'] ?? null,
            $data['includes_funnels'] ?? false,
            $data['includes_automations'] ?? false,
            $data['includes_templates'] ?? false,
            $data['includes_forms'] ?? false,
            $data['includes_pages'] ?? false,
            $data['includes_workflows'] ?? false,
            json_encode($snapshotData),
            $data['is_public'] ?? false,
            $data['is_premium'] ?? false,
            $data['price'] ?? 0
        ]);
        
        Response::success(['snapshot_id' => $db->lastInsertId()]);
        return;
    }
    
    public static function listSnapshots() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $includePublic = $_GET['include_public'] ?? false;
        
        $db = Database::conn();
        
        $sql = "SELECT * FROM snapshots WHERE workspace_id = ?";
        $params = [$ctx->workspaceId];
        
        if ($includePublic) {
            $sql .= " OR is_public = 1";
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $snapshots = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        Response::success($snapshots);
        return;
    }
    
    public static function cloneSnapshot($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        // Get snapshot
        $stmt = $db->prepare("SELECT * FROM snapshots WHERE id = ? AND (workspace_id = ? OR is_public = 1)");
        $stmt->execute([$id, $ctx->workspaceId]);
        $snapshot = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$snapshot) {
            Response::error('Snapshot not found', 404);
            return;
        }
        
        $snapshotData = json_decode($snapshot['snapshot_data'], true);
        $targetCompanyId = $data['target_company_id'] ?? $ctx->activeCompanyId;
        
        // Clone data to target workspace/company
        $clonedItems = [];
        
        if (!empty($snapshotData['funnels'])) {
            foreach ($snapshotData['funnels'] as $funnel) {
                unset($funnel['id']);
                $funnel['workspace_id'] = $ctx->workspaceId;
                $funnel['company_id'] = $targetCompanyId;
                
                $columns = array_keys($funnel);
                $placeholders = array_fill(0, count($columns), '?');
                
                $sql = "INSERT INTO funnels (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";
                $stmt = $db->prepare($sql);
                $stmt->execute(array_values($funnel));
                
                $clonedItems['funnels'][] = $db->lastInsertId();
            }
        }
        
        // Similar cloning for other entities...
        
        // Update usage count
        $stmt = $db->prepare("UPDATE snapshots SET usage_count = usage_count + 1 WHERE id = ?");
        $stmt->execute([$id]);
        
        Response::success([
            'message' => 'Snapshot cloned successfully',
            'cloned_items' => $clonedItems
        ]);
        return;
    }
    
    // ============================================================================
    // USAGE TRACKING
    // ============================================================================
    
    public static function getUsageMetrics() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $date = $_GET['date'] ?? date('Y-m-d');
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT * FROM usage_metrics 
            WHERE workspace_id = ? AND metric_date = ?
        ");
        $stmt->execute([$ctx->workspaceId, $date]);
        $metrics = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$metrics) {
            // Calculate current usage
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM contacts WHERE workspace_id = ?");
            $stmt->execute([$ctx->workspaceId]);
            $contactsCount = $stmt->fetch(\PDO::FETCH_ASSOC)['count'];
            
            $metrics = [
                'workspace_id' => $ctx->workspaceId,
                'metric_date' => $date,
                'contacts_count' => $contactsCount,
                'emails_sent' => 0,
                'sms_sent' => 0,
                'storage_used_mb' => 0,
                'api_calls' => 0
            ];
        }
        
        Response::success($metrics);
        return;
    }
    
    public static function trackUsage() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $date = date('Y-m-d');
        
        $stmt = $db->prepare("
            INSERT INTO usage_metrics 
            (workspace_id, metric_date, emails_sent, sms_sent, api_calls)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            emails_sent = emails_sent + VALUES(emails_sent),
            sms_sent = sms_sent + VALUES(sms_sent),
            api_calls = api_calls + VALUES(api_calls)
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $date,
            $data['emails_sent'] ?? 0,
            $data['sms_sent'] ?? 0,
            $data['api_calls'] ?? 0
        ]);
        
        Response::success(['message' => 'Usage tracked']);
        return;
    }
    
    // ============================================================================
    // BILLING
    // ============================================================================
    
    public static function listPlans() {
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM billing_plans WHERE is_active = 1 ORDER BY sort_order");
        $stmt->execute();
        $plans = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($plans as &$plan) {
            $plan['features'] = json_decode($plan['features'], true);
        }
        
        Response::success($plans);
        return;
    }
    
    public static function getSubscription() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT s.*, p.name as plan_name, p.features
            FROM workspace_subscriptions s
            JOIN billing_plans p ON p.id = s.billing_plan_id
            WHERE s.workspace_id = ?
        ");
        $stmt->execute([$ctx->workspaceId]);
        $subscription = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if ($subscription) {
            $subscription['features'] = json_decode($subscription['features'], true);
        }
        
        Response::success($subscription);
        return;
    }
    
    public static function updateSubscription() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE workspace_subscriptions 
            SET billing_plan_id = ?, status = ?
            WHERE workspace_id = ?
        ");
        
        $stmt->execute([
            $data['billing_plan_id'],
            $data['status'] ?? 'active',
            $ctx->workspaceId
        ]);
        
        Response::success(['message' => 'Subscription updated']);
        return;
    }
}
