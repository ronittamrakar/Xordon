<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';

class SecurityController {
    
    private static function isAdminOrFail(): void {
        $userId = Auth::userIdOrFail();
        $rbac = \RBACService::getInstance();
        if (!$rbac->isAdmin($userId)) {
            \Xordon\Response::json(['error' => 'Unauthorized. Admin access required.'], 403);
            die();
        }
    }

    /**
     * Get recent security events
     * GET /api/system/security/events
     */
    public static function getEvents(): void {
        self::isAdminOrFail();
        
        try {
            $pdo = \Xordon\Database::conn();
            $stmt = $pdo->query('SELECT * FROM security_events ORDER BY created_at DESC LIMIT 100');
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decode metadata
            foreach ($events as &$event) {
                if ($event['metadata']) {
                    $event['metadata'] = json_decode($event['metadata'], true);
                }
            }

            \Xordon\Response::json([
                'success' => true,
                'data' => $events
            ]);
        } catch (Exception $e) {
            \Xordon\Response::error($e->getMessage());
        }
    }

    /**
     * Get security statistics for dashboard
     * GET /api/system/security/stats
     */
    public static function getStats(): void {
        self::isAdminOrFail();

        try {
            $pdo = \Xordon\Database::conn();
            
            // Stats for last 24 hours
            $stmt = $pdo->query("
                SELECT 
                    COUNT(*) as total_events,
                    SUM(CASE WHEN type = 'rate_limit_exceeded' THEN 1 ELSE 0 END) as rate_limit_blocks,
                    SUM(CASE WHEN type = 'login_fail' THEN 1 ELSE 0 END) as failed_logins,
                    COUNT(DISTINCT ip_address) as unique_ips
                FROM security_events 
                WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ");
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Top offending IPs
            $stmt = $pdo->query("
                SELECT ip_address, COUNT(*) as count 
                FROM security_events 
                WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY ip_address 
                ORDER BY count DESC 
                LIMIT 5
            ");
            $topIps = $stmt->fetchAll(PDO::FETCH_ASSOC);

            \Xordon\Response::json([
                'success' => true,
                'data' => [
                    'summary' => $stats,
                    'top_ips' => $topIps
                ]
            ]);
        } catch (Exception $e) {
            \Xordon\Response::error($e->getMessage());
        }
    }
}
