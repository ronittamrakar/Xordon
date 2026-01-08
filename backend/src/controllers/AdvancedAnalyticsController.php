<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class AdvancedAnalyticsController {
    
    // ============================================================================
    // CUSTOM DASHBOARDS
    // ============================================================================
    
    public static function listDashboards() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT * FROM custom_dashboards 
            WHERE workspace_id = ? AND (user_id = ? OR is_shared = 1)
            ORDER BY is_default DESC, name ASC
        ");
        $stmt->execute([$ctx->workspaceId, Auth::userId()]);
        $dashboards = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($dashboards as &$dashboard) {
            $dashboard['layout'] = json_decode($dashboard['layout'], true);
            $dashboard['widgets'] = json_decode($dashboard['widgets'], true);
        }
        
        return Response::success($dashboards);
    }
    
    public static function createDashboard() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO custom_dashboards 
            (workspace_id, user_id, name, description, layout, widgets, is_default, is_shared)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $ctx->workspaceId,
            Auth::userId(),
            $data['name'],
            $data['description'] ?? null,
            json_encode($data['layout'] ?? []),
            json_encode($data['widgets'] ?? []),
            $data['is_default'] ?? false,
            $data['is_shared'] ?? false
        ]);
        
        return Response::success(['dashboard_id' => $db->lastInsertId()]);
    }
    
    public static function updateDashboard($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE custom_dashboards 
            SET name = ?, description = ?, layout = ?, widgets = ?, is_default = ?, is_shared = ?
            WHERE id = ? AND workspace_id = ?
        ");
        $stmt->execute([
            $data['name'],
            $data['description'] ?? null,
            json_encode($data['layout'] ?? []),
            json_encode($data['widgets'] ?? []),
            $data['is_default'] ?? false,
            $data['is_shared'] ?? false,
            $id,
            $ctx->workspaceId
        ]);
        
        return Response::success(['message' => 'Dashboard updated']);
    }
    
    // ============================================================================
    // ANALYTICS EVENTS
    // ============================================================================
    
    public static function trackEvent() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO analytics_events 
            (workspace_id, event_type, event_name, properties, user_id, contact_id, 
             session_id, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $ctx->workspaceId,
            $data['event_type'],
            $data['event_name'],
            json_encode($data['properties'] ?? []),
            Auth::userId(),
            $data['contact_id'] ?? null,
            $data['session_id'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
        
        return Response::success(['event_id' => $db->lastInsertId()]);
    }
    
    public static function getEvents() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $eventType = $_GET['event_type'] ?? null;
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        $limit = (int)($_GET['limit'] ?? 1000);
        
        $db = Database::conn();
        
        $sql = "SELECT * FROM analytics_events WHERE workspace_id = ? AND created_at BETWEEN ? AND ?";
        $params = [$ctx->workspaceId, $startDate, $endDate];
        
        if ($eventType) {
            $sql .= " AND event_type = ?";
            $params[] = $eventType;
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $events = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($events as &$event) {
            $event['properties'] = json_decode($event['properties'], true);
        }
        
        return Response::success($events);
    }
    
    // ============================================================================
    // FUNNEL ANALYTICS
    // ============================================================================
    
    public static function getFunnelAnalytics() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $funnelId = $_GET['funnel_id'] ?? null;
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        
        $db = Database::conn();
        
        $sql = "
            SELECT * FROM funnel_analytics 
            WHERE workspace_id = ? AND date BETWEEN ? AND ?
        ";
        $params = [$ctx->workspaceId, $startDate, $endDate];
        
        if ($funnelId) {
            $sql .= " AND funnel_id = ?";
            $params[] = $funnelId;
        }
        
        $sql .= " ORDER BY date DESC, step_order ASC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $analytics = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($analytics);
    }
    
    // ============================================================================
    // COHORT ANALYSIS
    // ============================================================================
    
    public static function getCohortAnalysis() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $cohortType = $_GET['cohort_type'] ?? 'signup';
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-90 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT * FROM cohort_analysis 
            WHERE workspace_id = ? AND cohort_type = ? AND cohort_date BETWEEN ? AND ?
            ORDER BY cohort_date DESC, period_number ASC
        ");
        $stmt->execute([$ctx->workspaceId, $cohortType, $startDate, $endDate]);
        $cohorts = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($cohorts);
    }
}
