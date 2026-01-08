<?php
/**
 * Lead Attribution Controller
 * Track lead sources and attribution for ROI analysis
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class LeadAttributionController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    // ==================== LEAD SOURCES ====================

    /**
     * List lead sources
     */
    public static function getSources() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT ls.*, 
                    (SELECT COUNT(*) FROM lead_attributions la WHERE la.lead_source_id = ls.id) as lead_count,
                    (SELECT SUM(la.conversion_value) FROM lead_attributions la WHERE la.lead_source_id = ls.id) as total_value
                FROM lead_sources ls
                WHERE ls.workspace_id = ?
                ORDER BY ls.name
            ");
            $stmt->execute([$workspaceId]);
            $sources = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $sources]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch lead sources: ' . $e->getMessage());
        }
    }

    /**
     * Create lead source
     */
    public static function createSource() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name'])) {
                return Response::error('name required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO lead_sources 
                (workspace_id, name, type, cost_per_lead, monthly_budget, color)
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['type'] ?? 'other',
                $data['cost_per_lead'] ?? null,
                $data['monthly_budget'] ?? null,
                $data['color'] ?? '#6366f1'
            ]);

            $id = $db->lastInsertId();

            return Response::json(['data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                return Response::error('Lead source name already exists', 400);
            }
            return Response::error('Failed to create lead source: ' . $e->getMessage());
        }
    }

    /**
     * Update lead source
     */
    public static function updateSource($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $updates = [];
            $params = [];

            $allowedFields = ['name', 'type', 'cost_per_lead', 'monthly_budget', 'color', 'is_active'];
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (empty($updates)) {
                return Response::error('No valid fields to update', 400);
            }

            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $db->prepare("UPDATE lead_sources SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update lead source: ' . $e->getMessage());
        }
    }

    /**
     * Delete lead source
     */
    public static function deleteSource($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM lead_sources WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete lead source: ' . $e->getMessage());
        }
    }

    // ==================== ATTRIBUTIONS ====================

    /**
     * Get attributions for a contact
     */
    public static function getContactAttributions($contactId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT la.*, ls.name as source_name, ls.type as source_type, ls.color as source_color
                FROM lead_attributions la
                LEFT JOIN lead_sources ls ON ls.id = la.lead_source_id
                WHERE la.workspace_id = ? AND la.contact_id = ?
                ORDER BY la.attributed_at DESC
            ");
            $stmt->execute([$workspaceId, $contactId]);
            $attributions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $attributions]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch attributions: ' . $e->getMessage());
        }
    }

    /**
     * Create attribution for a contact
     */
    public static function createAttribution() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['contact_id'])) {
                return Response::error('contact_id required', 400);
            }

            // Check if this is first touch
            $checkStmt = $db->prepare("SELECT COUNT(*) FROM lead_attributions WHERE contact_id = ?");
            $checkStmt->execute([$data['contact_id']]);
            $firstTouch = $checkStmt->fetchColumn() == 0;

            $stmt = $db->prepare("
                INSERT INTO lead_attributions 
                (workspace_id, contact_id, lead_source_id, source, medium, campaign, term, content,
                 referrer_url, landing_page, device_type, browser, os, ip_address,
                 first_touch, conversion_type, conversion_value)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $workspaceId,
                $data['contact_id'],
                $data['lead_source_id'] ?? null,
                $data['source'] ?? null,
                $data['medium'] ?? null,
                $data['campaign'] ?? null,
                $data['term'] ?? null,
                $data['content'] ?? null,
                $data['referrer_url'] ?? null,
                $data['landing_page'] ?? null,
                $data['device_type'] ?? null,
                $data['browser'] ?? null,
                $data['os'] ?? null,
                $data['ip_address'] ?? null,
                $firstTouch ? 1 : 0,
                $data['conversion_type'] ?? null,
                $data['conversion_value'] ?? null
            ]);

            $id = $db->lastInsertId();

            // Update contact's lead_source_id if first touch
            if ($firstTouch && !empty($data['lead_source_id'])) {
                $db->prepare("UPDATE contacts SET lead_source_id = ? WHERE id = ? AND workspace_id = ?")
                    ->execute([$data['lead_source_id'], $data['contact_id'], $workspaceId]);
            }

            return Response::json(['data' => ['id' => (int)$id]]);
        } catch (Exception $e) {
            return Response::error('Failed to create attribution: ' . $e->getMessage());
        }
    }

    /**
     * Get attribution analytics
     */
    public static function getAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
            $to = $_GET['to'] ?? date('Y-m-d');

            // By source
            $bySourceStmt = $db->prepare("
                SELECT 
                    ls.id, ls.name, ls.type, ls.color, ls.cost_per_lead,
                    COUNT(la.id) as lead_count,
                    SUM(CASE WHEN la.first_touch = 1 THEN 1 ELSE 0 END) as first_touch_count,
                    SUM(la.conversion_value) as total_value,
                    AVG(la.conversion_value) as avg_value
                FROM lead_sources ls
                LEFT JOIN lead_attributions la ON la.lead_source_id = ls.id 
                    AND la.attributed_at BETWEEN ? AND ?
                WHERE ls.workspace_id = ?
                GROUP BY ls.id
                ORDER BY lead_count DESC
            ");
            $bySourceStmt->execute([$from, $to . ' 23:59:59', $workspaceId]);
            $bySource = $bySourceStmt->fetchAll(PDO::FETCH_ASSOC);

            // By campaign
            $byCampaignStmt = $db->prepare("
                SELECT 
                    campaign,
                    COUNT(*) as lead_count,
                    SUM(conversion_value) as total_value
                FROM lead_attributions
                WHERE workspace_id = ? AND campaign IS NOT NULL
                    AND attributed_at BETWEEN ? AND ?
                GROUP BY campaign
                ORDER BY lead_count DESC
                LIMIT 10
            ");
            $byCampaignStmt->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $byCampaign = $byCampaignStmt->fetchAll(PDO::FETCH_ASSOC);

            // By conversion type
            $byTypeStmt = $db->prepare("
                SELECT 
                    conversion_type,
                    COUNT(*) as count,
                    SUM(conversion_value) as total_value
                FROM lead_attributions
                WHERE workspace_id = ? AND conversion_type IS NOT NULL
                    AND attributed_at BETWEEN ? AND ?
                GROUP BY conversion_type
                ORDER BY count DESC
            ");
            $byTypeStmt->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $byType = $byTypeStmt->fetchAll(PDO::FETCH_ASSOC);

            // Daily trend
            $trendStmt = $db->prepare("
                SELECT 
                    DATE(attributed_at) as date,
                    COUNT(*) as lead_count,
                    SUM(conversion_value) as total_value
                FROM lead_attributions
                WHERE workspace_id = ? AND attributed_at BETWEEN ? AND ?
                GROUP BY DATE(attributed_at)
                ORDER BY date
            ");
            $trendStmt->execute([$workspaceId, $from, $to . ' 23:59:59']);
            $trend = $trendStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'by_source' => $bySource,
                    'by_campaign' => $byCampaign,
                    'by_conversion_type' => $byType,
                    'daily_trend' => $trend,
                    'period' => ['from' => $from, 'to' => $to]
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch analytics: ' . $e->getMessage());
        }
    }

    /**
     * Track attribution from web (called from tracking pixel/script)
     */
    public static function track() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Parse UTM parameters
            $utmParams = [
                'source' => $data['utm_source'] ?? null,
                'medium' => $data['utm_medium'] ?? null,
                'campaign' => $data['utm_campaign'] ?? null,
                'term' => $data['utm_term'] ?? null,
                'content' => $data['utm_content'] ?? null,
            ];

            // Get device info from user agent
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            $deviceType = 'desktop';
            if (preg_match('/mobile/i', $userAgent)) {
                $deviceType = 'mobile';
            } elseif (preg_match('/tablet|ipad/i', $userAgent)) {
                $deviceType = 'tablet';
            }

            // Store tracking data in session or return for client-side storage
            $trackingData = [
                'workspace_id' => $workspaceId,
                'source' => $utmParams['source'],
                'medium' => $utmParams['medium'],
                'campaign' => $utmParams['campaign'],
                'term' => $utmParams['term'],
                'content' => $utmParams['content'],
                'referrer_url' => $data['referrer'] ?? $_SERVER['HTTP_REFERER'] ?? null,
                'landing_page' => $data['landing_page'] ?? null,
                'device_type' => $deviceType,
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'tracked_at' => date('Y-m-d H:i:s')
            ];

            return Response::json(['data' => $trackingData]);
        } catch (Exception $e) {
            return Response::error('Failed to track: ' . $e->getMessage());
        }
    }
}
