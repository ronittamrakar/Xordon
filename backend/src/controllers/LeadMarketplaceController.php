<?php

namespace App\Controllers;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Config.php';

use Xordon\Database;
use Auth;

class LeadMarketplaceController
{
    /**
     * Helper to get companyId with dev mode fallback
     */
    private static function getCompanyIdOrFail(): int
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $companyId = $ctx->activeCompanyId ?? null;
        
        if ($companyId) {
            return (int)$companyId;
        }
        
        // Dev mode: auto-create company if needed
        $appEnv = \Config::get('APP_ENV', 'development');
        if ($appEnv !== 'production') {
            $workspaceId = $ctx->workspaceId ?? 1;
            $userId = $ctx->userId ?? 1;
            $pdo = Database::conn();
            
            // Try to get existing company first
            $stmt = $pdo->prepare('SELECT id FROM companies WHERE workspace_id = ? LIMIT 1');
            $stmt->execute([$workspaceId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if ($row) {
                return (int)$row['id'];
            }
            
            // Create one
            $stmt = $pdo->prepare('INSERT INTO companies (workspace_id, user_id, name, status, is_client, created_at) VALUES (?, ?, ?, ?, 0, NOW())');
            $stmt->execute([$workspaceId, $userId, 'Development Company', 'active']);
            return (int)$pdo->lastInsertId();
        }
        
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Company required']);
        exit;
    }

    // ==================== SERVICE CATALOG ====================

    public static function getServices(): void
    {
        error_log("LeadMarketplaceController::getServices called");
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $parentId = $_GET['parent_id'] ?? null;
        $includeInactive = ($_GET['include_inactive'] ?? '0') === '1';

        $pdo = Database::conn();
        $sql = "SELECT * FROM service_catalog WHERE workspace_id = :workspaceId";
        $params = ['workspaceId' => $workspaceId];

        if ($parentId !== null) {
            if ($parentId === 'null' || $parentId === '') {
                $sql .= " AND parent_id IS NULL";
            } else {
                $sql .= " AND parent_id = :parentId";
                $params['parentId'] = (int)$parentId;
            }
        }
        if (!$includeInactive) $sql .= " AND is_active = 1";
        $sql .= " ORDER BY sort_order ASC, name ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    public static function getService(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $pdo = Database::conn();
        $stmt = $pdo->prepare("SELECT * FROM service_catalog WHERE id = :id AND workspace_id = :workspaceId");
        $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId]);
        $service = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$service) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Not found']); return; }
        $stmt = $pdo->prepare("SELECT * FROM service_catalog WHERE parent_id = :id AND workspace_id = :workspaceId ORDER BY sort_order ASC");
        $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId]);
        $service['subcategories'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $service]);
    }

    public static function createService(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $data = json_decode(file_get_contents('php://input'), true);
        $name = trim($data['name'] ?? '');
        if (empty($name)) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Name required']); return; }
        $slug = $data['slug'] ?? self::slugify($name);
        $pdo = Database::conn();
        $stmt = $pdo->prepare('INSERT INTO service_catalog (workspace_id, parent_id, name, slug, description, icon, attributes, sort_order, is_active) VALUES (:workspaceId, :parentId, :name, :slug, :description, :icon, :attributes, :sortOrder, :isActive)');
        $stmt->execute([
            'workspaceId' => $workspaceId,
            'parentId' => array_key_exists('parent_id', $data) ? $data['parent_id'] : null,
            'name' => $name,
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'icon' => $data['icon'] ?? null,
            'attributes' => isset($data['attributes']) ? json_encode($data['attributes']) : null,
            'sortOrder' => $data['sort_order'] ?? 0,
            'isActive' => isset($data['is_active']) ? (($data['is_active'] ?? true) ? 1 : 0) : 1,
        ]);
        echo json_encode(['success' => true, 'data' => ['id' => (int)$pdo->lastInsertId()]]);
    }

    public static function updateService(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $data = json_decode(file_get_contents('php://input'), true);
        $allowed = ['name', 'slug', 'description', 'icon', 'sort_order', 'is_active', 'parent_id', 'attributes'];
        $fields = [];
        $params = ['id' => $id, 'workspaceId' => $workspaceId];
        foreach ($allowed as $f) {
            if (!array_key_exists($f, $data)) {
                continue;
            }
            if ($f === 'attributes') {
                $fields[] = 'attributes = :attributes';
                $params['attributes'] = $data['attributes'] !== null ? json_encode($data['attributes']) : null;
                continue;
            }
            $fields[] = "$f = :$f";
            $params[$f] = $data[$f];
        }
        if (empty($fields)) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'No fields']); return; }
        $pdo = Database::conn();
        $stmt = $pdo->prepare('UPDATE service_catalog SET ' . implode(', ', $fields) . ' WHERE id = :id AND workspace_id = :workspaceId');
        echo json_encode(['success' => $stmt->execute($params)]);
    }

    public static function deleteService(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT COUNT(*) as cnt FROM service_catalog WHERE parent_id = :id AND workspace_id = :workspaceId');
        $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (($row['cnt'] ?? 0) > 0) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Has subcategories']); return; }
        $stmt = $pdo->prepare('DELETE FROM service_catalog WHERE id = :id AND workspace_id = :workspaceId');
        echo json_encode(['success' => $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId])]);
    }

    // ==================== SERVICE PROS ====================

    public static function getPros(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;

        $status = $_GET['status'] ?? null;
        $serviceId = isset($_GET['service_id']) && $_GET['service_id'] !== '' ? (int)$_GET['service_id'] : null;

        $pdo = Database::conn();

        $sql = "SELECT sp.* FROM service_pros sp WHERE sp.workspace_id = :workspaceId";
        $params = ['workspaceId' => $workspaceId];

        if ($status) {
            $sql .= ' AND sp.status = :status';
            $params['status'] = $status;
        }
        if ($serviceId) {
            $sql .= ' AND EXISTS (SELECT 1 FROM service_pro_offerings spo WHERE spo.workspace_id = sp.workspace_id AND spo.company_id = sp.company_id AND spo.service_id = :serviceId)';
            $params['serviceId'] = $serviceId;
        }

        $sql .= ' ORDER BY sp.created_at DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $pros = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $pros]);
    }

    public static function getPro(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $pdo = Database::conn();

        $stmt = $pdo->prepare('SELECT * FROM service_pros WHERE id = :id AND workspace_id = :workspaceId');
        $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId]);
        $pro = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$pro) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Not found']); return; }

        $stmt = $pdo->prepare('SELECT spo.*, sc.name as service_name FROM service_pro_offerings spo LEFT JOIN service_catalog sc ON sc.id = spo.service_id WHERE spo.workspace_id = :workspaceId AND spo.company_id = :companyId AND spo.is_active = 1');
        $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $pro['company_id']]);
        $pro['offerings'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare('SELECT * FROM service_areas WHERE workspace_id = :workspaceId AND company_id = :companyId ORDER BY is_primary DESC, id ASC');
        $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $pro['company_id']]);
        $pro['service_areas'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare('SELECT * FROM pro_preferences WHERE workspace_id = :workspaceId AND company_id = :companyId LIMIT 1');
        $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $pro['company_id']]);
        $pro['preferences'] = $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;

        echo json_encode(['success' => true, 'data' => $pro]);
    }

    public static function getMyProProfile(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM service_pros WHERE workspace_id = :workspaceId AND company_id = :companyId LIMIT 1');
        $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);
        $pro = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$pro) {
            echo json_encode(['success' => true, 'data' => null, 'registered' => false]);
            return;
        }

        $stmt = $pdo->prepare('SELECT spo.*, sc.name as service_name FROM service_pro_offerings spo LEFT JOIN service_catalog sc ON sc.id = spo.service_id WHERE spo.workspace_id = :workspaceId AND spo.company_id = :companyId AND spo.is_active = 1');
        $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);
        $pro['offerings'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare('SELECT * FROM service_areas WHERE workspace_id = :workspaceId AND company_id = :companyId ORDER BY is_primary DESC, id ASC');
        $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);
        $pro['service_areas'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare('SELECT * FROM pro_preferences WHERE workspace_id = :workspaceId AND company_id = :companyId LIMIT 1');
        $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);
        $pro['preferences'] = $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;

        echo json_encode(['success' => true, 'data' => $pro, 'registered' => true]);
    }

    public static function registerPro(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $data = json_decode(file_get_contents('php://input'), true);

        $businessName = trim($data['business_name'] ?? '');
        if ($businessName === '') { http_response_code(400); echo json_encode(['success' => false, 'error' => 'business_name required']); return; }

        $pdo = Database::conn();

        $stmt = $pdo->prepare('SELECT id FROM service_pros WHERE workspace_id = :workspaceId AND company_id = :companyId LIMIT 1');
        $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);
        if ($stmt->fetch(\PDO::FETCH_ASSOC)) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Already registered']);
            return;
        }

        $userId = Auth::userId();
        $stmt = $pdo->prepare('INSERT INTO service_pros (workspace_id, company_id, user_id, business_name, contact_name, contact_email, contact_phone, bio, status) VALUES (:workspaceId, :companyId, :userId, :businessName, :contactName, :contactEmail, :contactPhone, :bio, "active")');
        $stmt->execute([
            'workspaceId' => $workspaceId,
            'companyId' => $companyId,
            'userId' => $userId,
            'businessName' => $businessName,
            'contactName' => $data['contact_name'] ?? null,
            'contactEmail' => $data['contact_email'] ?? null,
            'contactPhone' => $data['contact_phone'] ?? null,
            'bio' => $data['bio'] ?? null,
        ]);
        $proId = (int)$pdo->lastInsertId();

        $serviceIds = $data['service_ids'] ?? [];
        if (is_array($serviceIds) && count($serviceIds) > 0) {
            $stmt = $pdo->prepare('INSERT INTO service_pro_offerings (workspace_id, company_id, service_id, is_active) VALUES (:workspaceId, :companyId, :serviceId, 1)');
            foreach ($serviceIds as $sid) {
                $sid = (int)$sid;
                if ($sid <= 0) continue;
                try {
                    $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId, 'serviceId' => $sid]);
                } catch (\Throwable $e) {
                }
            }
        }

        $areas = $data['service_areas'] ?? [];
        if (is_array($areas) && count($areas) > 0) {
            $stmt = $pdo->prepare('INSERT INTO service_areas (workspace_id, company_id, area_type, city, region, country, postal_code, latitude, longitude, radius_km, is_primary) VALUES (:workspaceId, :companyId, :areaType, :city, :region, :country, :postal, :lat, :lng, :radiusKm, :isPrimary)');
            $isFirst = true;
            foreach ($areas as $a) {
                if (!is_array($a)) continue;
                $stmt->execute([
                    'workspaceId' => $workspaceId,
                    'companyId' => $companyId,
                    'areaType' => $a['area_type'] ?? 'radius',
                    'city' => $a['city'] ?? null,
                    'region' => $a['region'] ?? null,
                    'country' => $a['country'] ?? 'US',
                    'postal' => $a['postal_code'] ?? null,
                    'lat' => $a['latitude'] ?? null,
                    'lng' => $a['longitude'] ?? null,
                    'radiusKm' => $a['radius_km'] ?? 25,
                    'isPrimary' => $isFirst ? 1 : ((($a['is_primary'] ?? false) ? 1 : 0)),
                ]);
                $isFirst = false;
            }
        }

        echo json_encode(['success' => true, 'data' => ['id' => $proId]]);
    }

    public static function updatePro(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $data = json_decode(file_get_contents('php://input'), true);

        $allowed = ['business_name', 'contact_name', 'contact_email', 'contact_phone', 'bio', 'website_url', 'years_in_business', 'license_number', 'status'];
        $fields = [];
        $params = ['id' => $id, 'workspaceId' => $workspaceId];

        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = :$f";
                $params[$f] = $data[$f];
            }
        }

        if (empty($fields)) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'No fields']); return; }

        $pdo = Database::conn();
        $stmt = $pdo->prepare('UPDATE service_pros SET ' . implode(', ', $fields) . ' WHERE id = :id AND workspace_id = :workspaceId');
        echo json_encode(['success' => $stmt->execute($params)]);
    }

    // ==================== PRO PREFERENCES & SETTINGS ====================

    public static function updatePreferences(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) $data = [];

        $allowed = ['min_budget', 'max_budget', 'max_radius_km', 'max_leads_per_day', 'max_leads_per_week', 'notify_email', 'notify_sms', 'notify_push', 'auto_recharge_enabled', 'auto_recharge_threshold', 'auto_recharge_amount', 'pause_when_balance_zero'];
        $fields = [];
        $params = ['workspaceId' => $workspaceId, 'companyId' => $companyId];

        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = :$f";
                $params[$f] = $data[$f];
            }
        }

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT id FROM pro_preferences WHERE workspace_id = :workspaceId AND company_id = :companyId LIMIT 1');
        $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);
        $existing = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$existing) {
            $stmt = $pdo->prepare('INSERT INTO pro_preferences (workspace_id, company_id) VALUES (:workspaceId, :companyId)');
            $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);
        }

        if (empty($fields)) {
            echo json_encode(['success' => true]);
            return;
        }

        $stmt = $pdo->prepare('UPDATE pro_preferences SET ' . implode(', ', $fields) . ' WHERE workspace_id = :workspaceId AND company_id = :companyId');
        echo json_encode(['success' => $stmt->execute($params)]);
    }

    public static function updateServiceOfferings(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $data = json_decode(file_get_contents('php://input'), true);
        $serviceIds = $data['service_ids'] ?? [];
        if (!is_array($serviceIds)) $serviceIds = [];

        $pdo = Database::conn();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('UPDATE service_pro_offerings SET is_active = 0 WHERE workspace_id = :workspaceId AND company_id = :companyId');
            $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);

            $stmtUpsert = $pdo->prepare('INSERT INTO service_pro_offerings (workspace_id, company_id, service_id, is_active) VALUES (:workspaceId, :companyId, :serviceId, 1) ON DUPLICATE KEY UPDATE is_active = 1');
            foreach ($serviceIds as $sid) {
                $sid = (int)$sid;
                if ($sid <= 0) continue;
                $stmtUpsert->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId, 'serviceId' => $sid]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        echo json_encode(['success' => true]);
    }

    public static function updateServiceAreas(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $data = json_decode(file_get_contents('php://input'), true);
        $areas = $data['areas'] ?? [];
        if (!is_array($areas)) $areas = [];

        $pdo = Database::conn();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('DELETE FROM service_areas WHERE workspace_id = :workspaceId AND company_id = :companyId');
            $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);

            if (count($areas) > 0) {
                $stmtIns = $pdo->prepare('INSERT INTO service_areas (workspace_id, company_id, area_type, city, region, country, postal_code, latitude, longitude, radius_km, is_primary) VALUES (:workspaceId, :companyId, :areaType, :city, :region, :country, :postal, :lat, :lng, :radiusKm, :isPrimary)');
                $first = true;
                foreach ($areas as $a) {
                    if (!is_array($a)) continue;
                    $stmtIns->execute([
                        'workspaceId' => $workspaceId,
                        'companyId' => $companyId,
                        'areaType' => $a['area_type'] ?? 'radius',
                        'city' => $a['city'] ?? null,
                        'region' => $a['region'] ?? null,
                        'country' => $a['country'] ?? 'US',
                        'postal' => $a['postal_code'] ?? null,
                        'lat' => $a['latitude'] ?? null,
                        'lng' => $a['longitude'] ?? null,
                        'radiusKm' => $a['radius_km'] ?? 25,
                        'isPrimary' => $first ? 1 : ((($a['is_primary'] ?? false) ? 1 : 0)),
                    ]);
                    $first = false;
                }
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        echo json_encode(['success' => true]);
    }

    // ==================== HELPERS ====================

    private static function slugify(string $text): string
    {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        return strtolower($text);
    }

    private static function haversineDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * asin(sqrt($a));
        return $earthRadius * $c;
    }

    private static function logActivity($workspaceId, $leadId, $matchId, $companyId, $type, $desc, $meta = null): void
    {
        $pdo = Database::conn();
        $stmt = $pdo->prepare('INSERT INTO lead_activity_log (workspace_id, lead_request_id, lead_match_id, company_id, activity_type, description, meta, ip_address) VALUES (:workspaceId, :leadId, :matchId, :companyId, :type, :description, :meta, :ip)');
        $metaJson = $meta ? json_encode($meta) : null;
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $stmt->execute([
            'workspaceId' => $workspaceId,
            'leadId' => $leadId,
            'matchId' => $matchId,
            'companyId' => $companyId,
            'type' => $type,
            'description' => $desc,
            'meta' => $metaJson,
            'ip' => $ip,
        ]);
    }

    private static function calculateLeadPrice($workspaceId, $data): float
    {
        $pdo = Database::conn();
        $serviceIds = array_map(fn($s) => is_array($s) ? $s['service_id'] : $s, $data['services'] ?? []);
        $timing = $data['timing'] ?? 'flexible';
        $postalCode = $data['postal_code'] ?? null;
        $isExclusive = $data['is_exclusive'] ?? false;

        $sql = 'SELECT * FROM lead_pricing_rules WHERE workspace_id = :workspaceId AND is_active = 1 ORDER BY priority DESC, id ASC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['workspaceId' => $workspaceId]);
        $rules = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $basePrice = 25.00;
        $surgeMultiplier = 1.0;
        $exclusiveMultiplier = 3.0;

        foreach ($rules as $rule) {
            $match = true;
            if ($rule['service_id'] && !in_array($rule['service_id'], $serviceIds)) $match = false;
            if ($rule['postal_code'] && $rule['postal_code'] !== $postalCode) $match = false;
            if ($rule['timing'] && $rule['timing'] !== $timing) $match = false;
            if ($match) {
                $basePrice = (float)$rule['base_price'];
                $surgeMultiplier = (float)($rule['surge_multiplier'] ?? 1.0);
                $exclusiveMultiplier = (float)($rule['exclusive_multiplier'] ?? 3.0);
                break;
            }
        }

        $price = $basePrice;
        if (in_array($timing, ['asap', 'within_24h'])) $price *= $surgeMultiplier;
        if ($isExclusive) $price *= $exclusiveMultiplier;

        return round($price, 2);
    }
}
