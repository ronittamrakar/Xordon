<?php
/**
 * Audit Controller
 * API endpoints for viewing RBAC audit logs
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';

class AuditController {
    
    /**
     * Get audit log entries with filtering
     * GET /rbac/audit-log
     */
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Only admins can view audit logs
        if (!$rbac->isAdmin($userId)) {
            Response::forbidden('Only administrators can view audit logs');
            return;
        }
        
        try {
            // Parse query parameters
            $filters = [];
            
            if (!empty($_GET['action'])) {
                $filters['action'] = $_GET['action'];
            }
            if (!empty($_GET['actor_id'])) {
                $filters['actor_id'] = (int)$_GET['actor_id'];
            }
            if (!empty($_GET['target_type'])) {
                $filters['target_type'] = $_GET['target_type'];
            }
            if (!empty($_GET['date_from'])) {
                $filters['date_from'] = $_GET['date_from'];
            }
            if (!empty($_GET['date_to'])) {
                $filters['date_to'] = $_GET['date_to'];
            }
            
            $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 500) : 100;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            
            $entries = $rbac->getAuditLog($filters, $limit, $offset);
            
            // Get total count for pagination
            $pdo = Database::conn();
            $where = ['1=1'];
            $params = [];
            
            if (!empty($filters['action'])) {
                $where[] = 'action = ?';
                $params[] = $filters['action'];
            }
            if (!empty($filters['actor_id'])) {
                $where[] = 'actor_id = ?';
                $params[] = $filters['actor_id'];
            }
            if (!empty($filters['target_type'])) {
                $where[] = 'target_type = ?';
                $params[] = $filters['target_type'];
            }
            if (!empty($filters['date_from'])) {
                $where[] = 'created_at >= ?';
                $params[] = $filters['date_from'];
            }
            if (!empty($filters['date_to'])) {
                $where[] = 'created_at <= ?';
                $params[] = $filters['date_to'];
            }
            
            $countSql = 'SELECT COUNT(*) FROM rbac_audit_log WHERE ' . implode(' AND ', $where);
            $stmt = $pdo->prepare($countSql);
            $stmt->execute($params);
            $total = (int)$stmt->fetchColumn();
            
            Response::json([
                'success' => true,
                'data' => $entries,
                'pagination' => [
                    'total' => $total,
                    'limit' => $limit,
                    'offset' => $offset,
                    'has_more' => ($offset + count($entries)) < $total
                ]
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Get available action types for filtering
     * GET /rbac/audit-log/actions
     */
    public static function getActionTypes(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->isAdmin($userId)) {
            Response::forbidden('Only administrators can view audit logs');
            return;
        }
        
        try {
            $pdo = Database::conn();
            $stmt = $pdo->query('SELECT DISTINCT action FROM rbac_audit_log ORDER BY action');
            $actions = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            Response::json(['success' => true, 'data' => $actions]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Get audit log summary/statistics
     * GET /rbac/audit-log/summary
     */
    public static function getSummary(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        if (!$rbac->isAdmin($userId)) {
            Response::forbidden('Only administrators can view audit logs');
            return;
        }
        
        try {
            $pdo = Database::conn();
            
            // Get counts by action type
            $stmt = $pdo->query('
                SELECT action, COUNT(*) as count 
                FROM rbac_audit_log 
                GROUP BY action 
                ORDER BY count DESC
            ');
            $byAction = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get counts by target type
            $stmt = $pdo->query('
                SELECT target_type, COUNT(*) as count 
                FROM rbac_audit_log 
                WHERE target_type IS NOT NULL
                GROUP BY target_type 
                ORDER BY count DESC
            ');
            $byTargetType = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get recent activity (last 24 hours)
            $stmt = $pdo->query('
                SELECT COUNT(*) FROM rbac_audit_log 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ');
            $last24Hours = (int)$stmt->fetchColumn();
            
            // Get total count
            $stmt = $pdo->query('SELECT COUNT(*) FROM rbac_audit_log');
            $total = (int)$stmt->fetchColumn();
            
            Response::json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'last_24_hours' => $last24Hours,
                    'by_action' => $byAction,
                    'by_target_type' => $byTargetType
                ]
            ]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
