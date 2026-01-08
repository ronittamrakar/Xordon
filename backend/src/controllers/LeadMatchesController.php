<?php

namespace App\Controllers;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Config.php';
require_once __DIR__ . '/../services/LeadNotificationService.php';

use \Xordon\Database;
use Auth;
use App\Services\LeadNotificationService;

class LeadMatchesController
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

    public static function scoreLeadQuality(array $data): array
    {
        $score = 0.0;
        $reasons = [];

        $name = trim((string)($data['consumer_name'] ?? ''));
        $email = trim((string)($data['consumer_email'] ?? ''));
        $phone = trim((string)($data['consumer_phone'] ?? ''));
        $postal = trim((string)($data['postal_code'] ?? ''));
        $desc = trim((string)($data['description'] ?? ''));
        $title = trim((string)($data['title'] ?? ''));

        if ($phone !== '') $score += 30;
        if ($email !== '') $score += 30;
        if ($name !== '') $score += 10;
        if ($postal !== '') $score += 10;
        if ($title !== '') $score += 5;
        if (strlen($desc) >= 20) $score += 10;
        if (!empty($data['budget_min']) || !empty($data['budget_max'])) $score += 5;

        $text = strtolower($title . ' ' . $desc);
        if (!empty($data['answers']) && is_array($data['answers'])) {
            $text .= ' ' . strtolower(json_encode($data['answers']));
        }

        $spamKeywords = ['viagra', 'casino', 'crypto', 'loan', 'porn', 'sex', 'escort', 'bitcoin', 'betting'];
        foreach ($spamKeywords as $kw) {
            if ($kw !== '' && strpos($text, $kw) !== false) {
                $reasons[] = "keyword:$kw";
                $score -= 40;
                break;
            }
        }

        $urlCount = preg_match_all('#https?://#i', $text, $m);
        if ($urlCount && $urlCount >= 2) {
            $reasons[] = 'many_urls';
            $score -= 25;
        }

        if ($name !== '' && preg_match('/\b(test|asdf|qwer)\b/i', $name)) {
            $reasons[] = 'test_name';
            $score -= 20;
        }

        $score = max(0, min(100, round($score, 2)));
        $isSpam = ($score < 20);

        return [
            'quality_score' => $score,
            'is_spam' => $isSpam,
            'reasons' => $reasons,
        ];
    }

    // ==================== LEAD REQUESTS (PUBLIC + ADMIN) ====================

    public static function createLeadRequest(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $data = json_decode(file_get_contents('php://input'), true);

        // Validate input
        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid JSON payload']);
            return;
        }

        if (empty($data['consumer_name']) && empty($data['consumer_email']) && empty($data['consumer_phone'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'At least one contact method required']);
            return;
        }
        if (empty($data['services']) || !is_array($data['services'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'At least one service required']);
            return;
        }

        $pdo = Database::conn();

        // Normalize contact details
        $phone = trim($data['consumer_phone'] ?? '');
        $email = trim(strtolower($data['consumer_email'] ?? ''));
        
        // Validate email format if provided
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Invalid email format']);
            return;
        }

        // Dedupe check (24h cooldown)
        if ($phone || $email) {
            try {
                $stmt = $pdo->prepare("SELECT id FROM lead_requests WHERE workspace_id = :workspaceId AND (consumer_phone = :phone OR consumer_email = :email) AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) AND status NOT IN ('closed', 'expired', 'spam', 'duplicate')");
                $stmt->execute(['workspaceId' => $workspaceId, 'phone' => $phone, 'email' => $email]);
                if ($existing = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                    http_response_code(409);
                    echo json_encode(['success' => false, 'error' => 'Duplicate request', 'existing_id' => $existing['id']]);
                    return;
                }
            } catch (\PDOException $e) {
                error_log("LeadMatchesController::createLeadRequest - Dedupe check failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Database error during validation']);
                return;
            }
        }

        // Calculate price
        $leadPrice = self::calculateLeadPrice($workspaceId, $data);

        $quality = self::scoreLeadQuality($data);
        $qualityScore = $quality['quality_score'] ?? null;
        $status = ($quality['is_spam'] ?? false) ? 'spam' : 'new';

        // Begin transaction for atomic insert
        try {
            $pdo->beginTransaction();
        } catch (\PDOException $e) {
            error_log("LeadMatchesController::createLeadRequest - Failed to begin transaction: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database transaction error']);
            return;
        }

        // Insert lead
        $stmt = $pdo->prepare("INSERT INTO lead_requests (workspace_id, source, consumer_name, consumer_email, consumer_phone, city, region, country, postal_code, latitude, longitude, budget_min, budget_max, timing, title, description, property_type, media, answers, consent_contact, is_exclusive, max_sold_count, lead_price_base, lead_price_final, quality_score, status) VALUES (:workspaceId, :source, :consumerName, :consumerEmail, :consumerPhone, :city, :region, :country, :postal, :lat, :lng, :budgetMin, :budgetMax, :timing, :title, :description, :propertyType, :media, :answers, :consent, :exclusive, :maxSold, :leadPriceBase, :leadPriceFinal, :qualityScore, :status)");
        
        $source = $data['source'] ?? 'form';
        $name = $data['consumer_name'] ?? null;
        $city = $data['city'] ?? null;
        $region = $data['region'] ?? null;
        $country = $data['country'] ?? 'US';
        $postal = $data['postal_code'] ?? null;
        $lat = $data['latitude'] ?? null;
        $lng = $data['longitude'] ?? null;
        $budgetMin = $data['budget_min'] ?? null;
        $budgetMax = $data['budget_max'] ?? null;
        $timing = $data['timing'] ?? 'flexible';
        $title = $data['title'] ?? null;
        $desc = $data['description'] ?? null;
        $propType = $data['property_type'] ?? null;
        $media = isset($data['media']) ? json_encode($data['media']) : null;
        $answers = isset($data['answers']) ? json_encode($data['answers']) : null;
        $consent = ($data['consent_contact'] ?? true) ? 1 : 0;
        $exclusive = ($data['is_exclusive'] ?? false) ? 1 : 0;
        $maxSold = $data['max_sold_count'] ?? 3;
        if ($exclusive && (!$maxSold || (int)$maxSold > 1)) {
            $maxSold = 1;
        }

        try {
            if (!$stmt->execute([
                'workspaceId' => $workspaceId,
                'source' => $source,
                'consumerName' => $name,
                'consumerEmail' => $email,
                'consumerPhone' => $phone,
                'city' => $city,
                'region' => $region,
                'country' => $country,
                'postal' => $postal,
                'lat' => $lat,
                'lng' => $lng,
                'budgetMin' => $budgetMin,
                'budgetMax' => $budgetMax,
                'timing' => $timing,
                'title' => $title,
                'description' => $desc,
                'propertyType' => $propType,
                'media' => $media,
                'answers' => $answers,
                'consent' => $consent,
                'exclusive' => $exclusive,
                'maxSold' => $maxSold,
                'leadPriceBase' => $leadPrice,
                'leadPriceFinal' => $leadPrice,
                'qualityScore' => $qualityScore,
                'status' => $status,
            ])) {
                throw new \Exception('Failed to insert lead request');
            }

            $leadId = (int)$pdo->lastInsertId();

            // Insert services
            $stmtSvc = $pdo->prepare('INSERT INTO lead_request_services (workspace_id, lead_request_id, service_id, quantity) VALUES (:workspaceId, :leadId, :serviceId, :qty)');
            foreach ($data['services'] as $svc) {
                $svcId = is_array($svc) ? $svc['service_id'] : $svc;
                $qty = is_array($svc) ? ($svc['quantity'] ?? 1) : 1;
                if (!$stmtSvc->execute(['workspaceId' => $workspaceId, 'leadId' => $leadId, 'serviceId' => $svcId, 'qty' => $qty])) {
                    throw new \Exception('Failed to insert lead service');
                }
            }

            // Queue for routing (do not route spam)
            if ($status !== 'spam') {
                $stmt = $pdo->prepare("INSERT INTO lead_routing_queue (workspace_id, lead_request_id, status) VALUES (:workspaceId, :leadId, 'pending')");
                if (!$stmt->execute(['workspaceId' => $workspaceId, 'leadId' => $leadId])) {
                    throw new \Exception('Failed to queue lead for routing');
                }
            }

            self::logActivity($workspaceId, $leadId, null, null, 'lead_created', 'Lead request created');

            $pdo->commit();
            echo json_encode(['success' => true, 'data' => ['id' => $leadId, 'lead_price' => $leadPrice, 'quality_score' => $qualityScore, 'status' => $status]]);
        } catch (\Exception $e) {
            $pdo->rollBack();
            error_log("LeadMatchesController::createLeadRequest - Transaction failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to create lead request']);
            return;
        }
    }

    public static function getLeadRequests(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $status = $_GET['status'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);

        $pdo = Database::conn();
        $sql = "SELECT lr.*, (SELECT GROUP_CONCAT(sc.name SEPARATOR ', ') FROM lead_request_services lrs JOIN service_catalog sc ON sc.id = lrs.service_id WHERE lrs.lead_request_id = lr.id) as service_names FROM lead_requests lr WHERE lr.workspace_id = :workspaceId";
        if ($status) { $sql .= " AND lr.status = :status"; }
        $sql .= " ORDER BY lr.created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':workspaceId', $workspaceId, \PDO::PARAM_INT);
        if ($status) { $stmt->bindValue(':status', $status, \PDO::PARAM_STR); }
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);
        $stmt->execute();

        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    public static function exportLeadMatchesCsv(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        // Reuse filtering via $_GET
        $_GET['limit'] = min((int)($_GET['limit'] ?? 5000), 20000);

        $pdo = Database::conn();
        $status = $_GET['status'] ?? null;
        $serviceId = isset($_GET['service_id']) ? (int)$_GET['service_id'] : null;
        $minQuality = isset($_GET['min_quality']) ? (float)$_GET['min_quality'] : null;
        $maxPrice = isset($_GET['max_price']) ? (float)$_GET['max_price'] : null;
        $maxDistance = isset($_GET['max_distance_km']) ? (float)$_GET['max_distance_km'] : null;
        $limit = (int)$_GET['limit'];

        $sql = "SELECT lm.id as match_id, lm.status as match_status, lm.lead_price, lm.distance_km, lm.offered_at, lm.viewed_at, lm.accepted_at, lm.expires_at,
                lr.id as lead_id, lr.source as lead_source, lr.quality_score, lr.city, lr.region, lr.postal_code, lr.timing, lr.budget_min, lr.budget_max, lr.title,
                (SELECT GROUP_CONCAT(sc.name SEPARATOR ', ') FROM lead_request_services lrs JOIN service_catalog sc ON sc.id = lrs.service_id WHERE lrs.lead_request_id = lr.id) as service_names
                FROM lead_matches lm
                JOIN lead_requests lr ON lr.id = lm.lead_request_id
                WHERE lm.workspace_id = ? AND lm.company_id = ?";
        $params = [$workspaceId, $companyId];

        if ($status) {
            $statuses = array_values(array_filter(array_map('trim', explode(',', $status))));
            if (!empty($statuses)) {
                $sql .= ' AND lm.status IN (' . implode(',', array_fill(0, count($statuses), '?')) . ')';
                foreach ($statuses as $s) { $params[] = $s; }
            }
        }
        if ($serviceId) {
            $sql .= ' AND EXISTS (SELECT 1 FROM lead_request_services lrs2 WHERE lrs2.lead_request_id = lr.id AND lrs2.service_id = ?)';
            $params[] = $serviceId;
        }
        if ($minQuality !== null) {
            $sql .= ' AND (lr.quality_score IS NULL OR lr.quality_score >= ?)';
            $params[] = $minQuality;
        }
        if ($maxPrice !== null) {
            $sql .= ' AND lm.lead_price <= ?';
            $params[] = $maxPrice;
        }
        if ($maxDistance !== null) {
            $sql .= ' AND (lm.distance_km IS NULL OR lm.distance_km <= ?)';
            $params[] = $maxDistance;
        }

        $sql .= ' ORDER BY lm.created_at DESC LIMIT ?';
        $params[] = $limit;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="lead_matches.csv"');

        $out = fopen('php://output', 'w');
        fputcsv($out, ['match_id','match_status','lead_price','distance_km','offered_at','viewed_at','accepted_at','expires_at','lead_id','lead_source','quality_score','service_names','title','city','region','postal_code','timing','budget_min','budget_max']);
        foreach ($rows as $r) {
            fputcsv($out, [
                $r['match_id'] ?? null,
                $r['match_status'] ?? null,
                $r['lead_price'] ?? null,
                $r['distance_km'] ?? null,
                $r['offered_at'] ?? null,
                $r['viewed_at'] ?? null,
                $r['accepted_at'] ?? null,
                $r['expires_at'] ?? null,
                $r['lead_id'] ?? null,
                $r['lead_source'] ?? null,
                $r['quality_score'] ?? null,
                $r['service_names'] ?? null,
                $r['title'] ?? null,
                $r['city'] ?? null,
                $r['region'] ?? null,
                $r['postal_code'] ?? null,
                $r['timing'] ?? null,
                $r['budget_min'] ?? null,
                $r['budget_max'] ?? null,
            ]);
        }
        fclose($out);
    }

    public static function getProviderMatchStats(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $pdo = Database::conn();

        $stmt = $pdo->prepare("SELECT status, COUNT(*) as cnt FROM lead_matches WHERE workspace_id = :workspaceId AND company_id = :companyId GROUP BY status");
        $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);
        $byStatus = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('accepted','won','lost') THEN 1 ELSE 0 END) as accepted_cnt,
                SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won_cnt,
                AVG(CASE WHEN response_time_minutes IS NOT NULL THEN response_time_minutes ELSE NULL END) as avg_response_time
            FROM lead_matches
            WHERE workspace_id = :workspaceId AND company_id = :companyId");
        $stmt->execute(['workspaceId' => $workspaceId, 'companyId' => $companyId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC) ?: ['total' => 0, 'accepted_cnt' => 0, 'won_cnt' => 0, 'avg_response_time' => null];

        $total = (int)($row['total'] ?? 0);
        $acceptedCnt = (int)($row['accepted_cnt'] ?? 0);
        $wonCnt = (int)($row['won_cnt'] ?? 0);
        $acceptanceRate = $total > 0 ? round(($acceptedCnt / $total) * 100, 1) : 0;
        $winRate = $acceptedCnt > 0 ? round(($wonCnt / $acceptedCnt) * 100, 1) : 0;

        echo json_encode([
            'success' => true,
            'data' => [
                'matches_by_status' => $byStatus,
                'total_matches' => $total,
                'accepted_count' => $acceptedCnt,
                'won_count' => $wonCnt,
                'acceptance_rate' => $acceptanceRate,
                'win_rate' => $winRate,
                'avg_response_time_minutes' => $row['avg_response_time'] !== null ? round((float)$row['avg_response_time'], 1) : null,
            ]
        ]);
    }

    public static function getLeadRequest(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $pdo = Database::conn();

        $stmt = $pdo->prepare('SELECT * FROM lead_requests WHERE id = :id AND workspace_id = :workspaceId');
        $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId]);
        $lead = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$lead) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Not found']); return; }

        // Services
        $stmt = $pdo->prepare('SELECT lrs.*, sc.name as service_name FROM lead_request_services lrs LEFT JOIN service_catalog sc ON sc.id = lrs.service_id WHERE lrs.lead_request_id = :leadId');
        $stmt->execute(['leadId' => $id]);
        $lead['services'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Matches
        $stmt = $pdo->prepare('SELECT lm.*, sp.business_name, sp.avg_rating FROM lead_matches lm LEFT JOIN service_pros sp ON sp.company_id = lm.company_id WHERE lm.lead_request_id = :leadId');
        $stmt->execute(['leadId' => $id]);
        $lead['matches'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        if ($lead['media']) $lead['media'] = json_decode($lead['media'], true);
        if ($lead['answers']) $lead['answers'] = json_decode($lead['answers'], true);

        echo json_encode(['success' => true, 'data' => $lead]);
    }

    public static function routeLeadRequest(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        
        // Validate input
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid lead ID']);
            return;
        }

        try {
            $pdo = Database::conn();
        } catch (\Exception $e) {
            error_log("LeadMatchesController::routeLeadRequest - DB connection failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database connection error']);
            return;
        }

        try {
            $stmt = $pdo->prepare('SELECT * FROM lead_requests WHERE id = :id AND workspace_id = :workspaceId');
            $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId]);
            $lead = $stmt->fetch(\PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            error_log("LeadMatchesController::routeLeadRequest - Query failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database query error']);
            return;
        }

        if (!$lead) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Lead request not found']); return; }
        if (!in_array($lead['status'], ['new', 'routing'])) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Lead already routed or closed']); return; }

        // Update status
        try {
            $stmt = $pdo->prepare("UPDATE lead_requests SET status = 'routing' WHERE id = :id AND workspace_id = :workspaceId");
            $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId]);
        } catch (\PDOException $e) {
            error_log("LeadMatchesController::routeLeadRequest - Status update failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to update lead status']);
            return;
        }

        // Get services
        try {
            $stmt = $pdo->prepare('SELECT service_id FROM lead_request_services WHERE workspace_id = :workspaceId AND lead_request_id = :leadId');
            $stmt->execute(['workspaceId' => $workspaceId, 'leadId' => $id]);
            $serviceIds = array_column($stmt->fetchAll(\PDO::FETCH_ASSOC), 'service_id');
        } catch (\PDOException $e) {
            error_log("LeadMatchesController::routeLeadRequest - Service query failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to fetch services']);
            return;
        }
        
        if (empty($serviceIds)) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'No services found for this lead']); return; }

        // Find eligible pros
        $svcPlaceholders = implode(',', array_fill(0, count($serviceIds), '?'));
        $sql = "SELECT DISTINCT sp.company_id, sp.id as pro_id, pp.min_budget, pp.pause_when_balance_zero, cw.balance
                FROM service_pros sp
                JOIN service_pro_offerings spo ON spo.company_id = sp.company_id AND spo.workspace_id = sp.workspace_id AND spo.service_id IN ($svcPlaceholders)
                LEFT JOIN pro_preferences pp ON pp.company_id = sp.company_id AND pp.workspace_id = sp.workspace_id
                LEFT JOIN credits_wallets cw ON cw.company_id = sp.company_id AND cw.workspace_id = sp.workspace_id
                WHERE sp.workspace_id = ? AND sp.status = 'active'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([...$serviceIds, $workspaceId]);
        $candidates = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $leadPrice = $lead['lead_price_final'] ?? 25.00;
        $maxSold = $lead['max_sold_count'] ?? 3;
        $leadLat = $lead['latitude'];
        $leadLng = $lead['longitude'];

        $eligible = [];
        foreach ($candidates as $pro) {
            if ($lead['budget_max'] && $pro['min_budget'] && $lead['budget_max'] < $pro['min_budget']) continue;
            if ($pro['pause_when_balance_zero'] && ($pro['balance'] ?? 0) < $leadPrice) continue;

            // Geo check
            $distance = null;
            if ($leadLat && $leadLng) {
                $stmtArea = $pdo->prepare('SELECT latitude, longitude, radius_km FROM service_areas WHERE company_id = :companyId AND workspace_id = :workspaceId AND latitude IS NOT NULL');
                $stmtArea->execute(['companyId' => $pro['company_id'], 'workspaceId' => $workspaceId]);
                $areas = $stmtArea->fetchAll(\PDO::FETCH_ASSOC);
                $inRange = false;
                foreach ($areas as $area) {
                    $d = self::haversine($leadLat, $leadLng, $area['latitude'], $area['longitude']);
                    if ($d <= $area['radius_km']) { $inRange = true; $distance = $d; break; }
                }
                if (!$inRange && !empty($areas)) continue;
            }

            // Not already matched
            $stmtEx = $pdo->prepare('SELECT id FROM lead_matches WHERE workspace_id = :workspaceId AND lead_request_id = :leadId AND company_id = :companyId LIMIT 1');
            $stmtEx->execute(['workspaceId' => $workspaceId, 'leadId' => $id, 'companyId' => $pro['company_id']]);
            if ($stmtEx->fetch(\PDO::FETCH_ASSOC)) continue;

            $score = 0.0;
            // Prefer closer providers
            if ($distance !== null) {
                $score += max(0, 50 - ($distance * 2));
            } else {
                $score += 10;
            }
            // Prefer providers with sufficient balance
            $bal = (float)($pro['balance'] ?? 0);
            $score += min(30, $bal);
            // Prefer providers with lower minimum budgets
            $minBudget = (float)($pro['min_budget'] ?? 0);
            $score += max(0, 20 - ($minBudget / 100));

            $eligible[] = ['company_id' => $pro['company_id'], 'pro_id' => $pro['pro_id'], 'distance_km' => $distance, 'score' => $score];
        }

        usort($eligible, function($a, $b) {
            return ($b['score'] ?? 0) <=> ($a['score'] ?? 0);
        });
        $eligible = array_slice($eligible, 0, $maxSold);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
        $matchCount = 0;

        $stmtM = $pdo->prepare("INSERT INTO lead_matches (workspace_id, lead_request_id, company_id, pro_id, distance_km, lead_price, status, expires_at) VALUES (:workspaceId, :leadId, :companyId, :proId, :distanceKm, :leadPrice, 'offered', :expiresAt)");
        foreach ($eligible as $pro) {
            if ($stmtM->execute([
                'workspaceId' => $workspaceId,
                'leadId' => $id,
                'companyId' => $pro['company_id'],
                'proId' => $pro['pro_id'],
                'distanceKm' => $pro['distance_km'],
                'leadPrice' => $leadPrice,
                'expiresAt' => $expiresAt,
            ])) {
                $matchId = (int)$pdo->lastInsertId();
                $matchCount++;
                self::logActivity($workspaceId, $id, $matchId, $pro['company_id'], 'lead_offered', 'Lead offered');
                
                // Send notification to provider
                try {
                    LeadNotificationService::notifyNewLead($matchId);
                } catch (\Exception $e) {
                    error_log("Failed to notify provider for match $matchId: " . $e->getMessage());
                }
            }
        }
        
        // Notify consumer that their request was matched
        if ($matchCount > 0) {
            try {
                LeadNotificationService::notifyConsumerMatched($id, $matchCount);
            } catch (\Exception $e) {
                error_log("Failed to notify consumer for lead $id: " . $e->getMessage());
            }
        }

        $newStatus = $matchCount > 0 ? 'routed' : 'closed';
        $stmt = $pdo->prepare('UPDATE lead_requests SET status = :status, routed_at = NOW(), expires_at = :expiresAt WHERE id = :id AND workspace_id = :workspaceId');
        $stmt->execute(['status' => $newStatus, 'expiresAt' => $expiresAt, 'id' => $id, 'workspaceId' => $workspaceId]);

        echo json_encode(['success' => true, 'data' => ['matches_created' => $matchCount, 'status' => $newStatus]]);
    }

    public static function refundLead(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $data = json_decode(file_get_contents('php://input'), true);
        $matchId = $data['lead_match_id'] ?? null;
        if (!$matchId) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'lead_match_id required']); return; }

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM lead_matches WHERE id = :matchId AND workspace_id = :workspaceId AND lead_request_id = :leadId');
        $stmt->execute(['matchId' => $matchId, 'workspaceId' => $workspaceId, 'leadId' => $id]);
        $match = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$match) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Not found']); return; }
        if ($match['status'] !== 'accepted') { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Not accepted']); return; }

        $refundAmt = $data['amount'] ?? $match['lead_price'];

        $stmt = $pdo->prepare('SELECT * FROM credits_wallets WHERE company_id = :companyId AND workspace_id = :workspaceId');
        $stmt->execute(['companyId' => $match['company_id'], 'workspaceId' => $workspaceId]);
        $wallet = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$wallet) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'No wallet']); return; }

        $newBal = (float)$wallet['balance'] + (float)$refundAmt;
        $stmt = $pdo->prepare('UPDATE credits_wallets SET balance = :balance, lifetime_refunded = lifetime_refunded + :refundAmt WHERE id = :walletId');
        $stmt->execute(['balance' => $newBal, 'refundAmt' => $refundAmt, 'walletId' => $wallet['id']]);

        $stmt = $pdo->prepare("INSERT INTO credit_transactions (workspace_id, company_id, wallet_id, lead_match_id, lead_request_id, type, amount, balance_before, balance_after, description) VALUES (:workspaceId, :companyId, :walletId, :matchId, :leadId, 'refund', :amount, :before, :after, 'Lead refund')");
        $stmt->execute([
            'workspaceId' => $workspaceId,
            'companyId' => $match['company_id'],
            'walletId' => $wallet['id'],
            'matchId' => $matchId,
            'leadId' => $id,
            'amount' => $refundAmt,
            'before' => $wallet['balance'],
            'after' => $newBal,
        ]);
        $txnId = (int)$pdo->lastInsertId();

        $stmt = $pdo->prepare("UPDATE lead_matches SET status = 'refunded', refund_transaction_id = :txnId WHERE id = :matchId AND workspace_id = :workspaceId");
        $stmt->execute(['txnId' => $txnId, 'matchId' => $matchId, 'workspaceId' => $workspaceId]);

        self::logActivity($workspaceId, $id, $matchId, $match['company_id'], 'lead_refunded', "Refunded $refundAmt");

        echo json_encode(['success' => true, 'data' => ['balance_after' => $newBal]]);
    }

    // ==================== LEAD MATCHES (PROVIDER) ====================

    public static function getLeadMatches(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $status = $_GET['status'] ?? null;
        $serviceId = isset($_GET['service_id']) ? (int)$_GET['service_id'] : null;
        $minQuality = isset($_GET['min_quality']) ? (float)$_GET['min_quality'] : null;
        $maxPrice = isset($_GET['max_price']) ? (float)$_GET['max_price'] : null;
        $maxDistance = isset($_GET['max_distance_km']) ? (float)$_GET['max_distance_km'] : null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);

        $pdo = Database::conn();
        $sql = "SELECT lm.*, lr.consumer_name, lr.city, lr.region, lr.postal_code, lr.timing, lr.budget_min, lr.budget_max, lr.title, lr.description, lr.quality_score,
                (SELECT GROUP_CONCAT(sc.name SEPARATOR ', ') FROM lead_request_services lrs JOIN service_catalog sc ON sc.id = lrs.service_id WHERE lrs.lead_request_id = lr.id) as service_names
                FROM lead_matches lm JOIN lead_requests lr ON lr.id = lm.lead_request_id WHERE lm.workspace_id = ? AND lm.company_id = ?";
        $params = [$workspaceId, $companyId];

        if ($status) {
            $statuses = array_values(array_filter(array_map('trim', explode(',', $status))));
            if (!empty($statuses)) {
                $sql .= ' AND lm.status IN (' . implode(',', array_fill(0, count($statuses), '?')) . ')';
                foreach ($statuses as $s) {
                    $params[] = $s;
                }
            }
        }

        if ($serviceId) {
            $sql .= ' AND EXISTS (SELECT 1 FROM lead_request_services lrs2 WHERE lrs2.lead_request_id = lr.id AND lrs2.service_id = ?)';
            $params[] = $serviceId;
        }
        if ($minQuality !== null) {
            $sql .= ' AND (lr.quality_score IS NULL OR lr.quality_score >= ?)';
            $params[] = $minQuality;
        }
        if ($maxPrice !== null) {
            $sql .= ' AND lm.lead_price <= ?';
            $params[] = $maxPrice;
        }
        if ($maxDistance !== null) {
            $sql .= ' AND (lm.distance_km IS NULL OR lm.distance_km <= ?)';
            $params[] = $maxDistance;
        }

        $sql .= ' ORDER BY lm.created_at DESC LIMIT ?';
        $params[] = $limit;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(\PDO::FETCH_ASSOC)]);
    }

    public static function getLeadMatch(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT lm.*, lr.* FROM lead_matches lm JOIN lead_requests lr ON lr.id = lm.lead_request_id WHERE lm.id = :id AND lm.workspace_id = :workspaceId AND lm.company_id = :companyId');
        $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId, 'companyId' => $companyId]);
        $match = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$match) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Not found']); return; }

        // Mark viewed
        if ($match['status'] === 'offered' && !$match['viewed_at']) {
            $stmt = $pdo->prepare("UPDATE lead_matches SET status = 'viewed', viewed_at = NOW() WHERE id = :id AND workspace_id = :workspaceId");
            $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId]);
            $match['status'] = 'viewed';
            self::logActivity($workspaceId, $match['lead_request_id'], $id, $companyId, 'lead_viewed', 'Lead viewed');
        }

        // Services
        $stmt = $pdo->prepare('SELECT lrs.*, sc.name as service_name FROM lead_request_services lrs LEFT JOIN service_catalog sc ON sc.id = lrs.service_id WHERE lrs.workspace_id = :workspaceId AND lrs.lead_request_id = :leadId');
        $stmt->execute(['workspaceId' => $workspaceId, 'leadId' => $match['lead_request_id']]);
        $match['services'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Quotes
        $stmt = $pdo->prepare('SELECT * FROM lead_quotes WHERE workspace_id = :workspaceId AND lead_match_id = :matchId ORDER BY created_at ASC');
        $stmt->execute(['workspaceId' => $workspaceId, 'matchId' => $id]);
        $match['quotes'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        if ($match['media']) $match['media'] = json_decode($match['media'], true);
        if ($match['answers']) $match['answers'] = json_decode($match['answers'], true);

        echo json_encode(['success' => true, 'data' => $match]);
    }

    public static function acceptLeadMatch(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $pdo = \Xordon\Database::conn();

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare('SELECT * FROM lead_matches WHERE id = :id AND workspace_id = :workspaceId AND company_id = :companyId FOR UPDATE');
            $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId, 'companyId' => $companyId]);
            $match = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$match) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Not found']);
                return;
            }
            if (!in_array($match['status'], ['offered', 'viewed'])) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Cannot accept']);
                return;
            }
            if ($match['expires_at'] && strtotime($match['expires_at']) < time()) {
                $stmt = $pdo->prepare("UPDATE lead_matches SET status = 'expired' WHERE id = :id AND workspace_id = :workspaceId");
                $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId]);
                $pdo->commit();
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Expired']);
                return;
            }

            $stmt = $pdo->prepare('SELECT * FROM lead_requests WHERE id = :leadId AND workspace_id = :workspaceId FOR UPDATE');
            $stmt->execute(['leadId' => $match['lead_request_id'], 'workspaceId' => $workspaceId]);
            $lead = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$lead) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Lead not found']);
                return;
            }

            $maxSold = (int)($lead['max_sold_count'] ?? 1);
            $currentSold = (int)($lead['current_sold_count'] ?? 0);
            if ($currentSold >= $maxSold) {
                $pdo->rollBack();
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => 'Lead already sold out']);
                return;
            }

            $stmt = $pdo->prepare('SELECT * FROM credits_wallets WHERE company_id = :companyId AND workspace_id = :workspaceId FOR UPDATE');
            $stmt->execute(['companyId' => $companyId, 'workspaceId' => $workspaceId]);
            $wallet = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$wallet || $wallet['balance'] < $match['lead_price']) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Insufficient credits', 'balance' => $wallet['balance'] ?? 0, 'required' => $match['lead_price']]);
                return;
            }

            $newBal = (float)$wallet['balance'] - (float)$match['lead_price'];
            $stmt = $pdo->prepare('UPDATE credits_wallets SET balance = :balance, lifetime_spent = lifetime_spent + :spent, last_charge_at = NOW() WHERE id = :walletId');
            $stmt->execute(['balance' => $newBal, 'spent' => $match['lead_price'], 'walletId' => $wallet['id']]);

            $stmt = $pdo->prepare("INSERT INTO credit_transactions (workspace_id, company_id, wallet_id, lead_match_id, lead_request_id, type, amount, balance_before, balance_after, description) VALUES (:workspaceId, :companyId, :walletId, :matchId, :leadId, :type, :amount, :before, :after, :description)");
            $negAmt = -((float)$match['lead_price']);
            $stmt->execute([
                'workspaceId' => $workspaceId,
                'companyId' => $companyId,
                'walletId' => $wallet['id'],
                'matchId' => $id,
                'leadId' => $match['lead_request_id'],
                'type' => 'charge',
                'amount' => $negAmt,
                'before' => $wallet['balance'],
                'after' => $newBal,
                'description' => 'Lead accepted',
            ]);
            $txnId = (int)$pdo->lastInsertId();

            $responseTime = $match['offered_at'] ? round((time() - strtotime($match['offered_at'])) / 60) : null;
            $stmt = $pdo->prepare("UPDATE lead_matches SET status = 'accepted', accepted_at = NOW(), credit_transaction_id = :txnId, response_time_minutes = :rt WHERE id = :id AND workspace_id = :workspaceId");
            $stmt->execute(['txnId' => $txnId, 'rt' => $responseTime, 'id' => $id, 'workspaceId' => $workspaceId]);

            $newSold = $currentSold + 1;
            $newLeadStatus = $newSold >= $maxSold ? 'closed' : 'partial';
            $stmt = $pdo->prepare("UPDATE lead_requests SET current_sold_count = :cnt, status = :status, closed_at = CASE WHEN :newStatus = 'closed' THEN NOW() ELSE closed_at END WHERE id = :leadId AND workspace_id = :workspaceId");
            $stmt->execute(['cnt' => $newSold, 'status' => $newLeadStatus, 'newStatus' => $newLeadStatus, 'leadId' => $lead['id'], 'workspaceId' => $workspaceId]);

            if ($newSold >= $maxSold) {
                $stmt = $pdo->prepare("UPDATE lead_matches SET status = 'expired' WHERE workspace_id = :workspaceId AND lead_request_id = :leadId AND id <> :matchId AND status IN ('offered','viewed')");
                $stmt->execute(['workspaceId' => $workspaceId, 'leadId' => $lead['id'], 'matchId' => $id]);
            }

            $stmt = $pdo->prepare('UPDATE service_pros SET total_leads_accepted = total_leads_accepted + 1 WHERE company_id = :companyId AND workspace_id = :workspaceId');
            $stmt->execute(['companyId' => $companyId, 'workspaceId' => $workspaceId]);

            self::logActivity($workspaceId, $match['lead_request_id'], $id, $companyId, 'lead_accepted', 'Lead accepted');

            $pdo->commit();
            echo json_encode(['success' => true, 'data' => ['balance_after' => $newBal, 'sold_count' => $newSold, 'max_sold_count' => $maxSold, 'lead_status' => $newLeadStatus]]);
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to accept lead']);
        }
    }

    public static function declineLeadMatch(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $data = json_decode(file_get_contents('php://input'), true);
        $reason = $data['reason'] ?? null;

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM lead_matches WHERE id = :id AND workspace_id = :workspaceId AND company_id = :companyId');
        $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId, 'companyId' => $companyId]);
        $match = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$match) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Not found']); return; }
        if (!in_array($match['status'], ['offered', 'viewed'])) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Cannot decline']); return; }

        $stmt = $pdo->prepare("UPDATE lead_matches SET status = 'declined', declined_at = NOW(), declined_reason = :reason WHERE id = :id AND workspace_id = :workspaceId");
        $stmt->execute(['reason' => $reason, 'id' => $id, 'workspaceId' => $workspaceId]);

        self::logActivity($workspaceId, $match['lead_request_id'], $id, $companyId, 'lead_declined', 'Lead declined');

        echo json_encode(['success' => true]);
    }

    public static function sendQuote(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $data = json_decode(file_get_contents('php://input'), true);

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM lead_matches WHERE id = :id AND workspace_id = :workspaceId AND company_id = :companyId');
        $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId, 'companyId' => $companyId]);
        $match = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$match) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Not found']); return; }

        $stmt = $pdo->prepare('INSERT INTO lead_quotes (workspace_id, lead_match_id, lead_request_id, company_id, quote_type, message, price_min, price_max, eta, created_by) VALUES (:workspaceId, :matchId, :leadId, :companyId, :type, :msg, :priceMin, :priceMax, :eta, :createdBy)');
        $type = $data['quote_type'] ?? 'quote';
        $msg = $data['message'] ?? null;
        $priceMin = $data['price_min'] ?? null;
        $priceMax = $data['price_max'] ?? null;
        $eta = $data['eta'] ?? null;
        $userId = Auth::userId();
        if ($stmt->execute([
            'workspaceId' => $workspaceId,
            'matchId' => $id,
            'leadId' => $match['lead_request_id'],
            'companyId' => $companyId,
            'type' => $type,
            'msg' => $msg,
            'priceMin' => $priceMin,
            'priceMax' => $priceMax,
            'eta' => $eta,
            'createdBy' => $userId,
        ])) {
            self::logActivity($workspaceId, $match['lead_request_id'], $id, $companyId, 'quote_sent', 'Quote sent');
            echo json_encode(['success' => true, 'data' => ['id' => (int)$pdo->lastInsertId()]]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed']);
        }
    }

    public static function markOutcome(int $id): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $companyId = self::getCompanyIdOrFail();

        $data = json_decode(file_get_contents('php://input'), true);
        $outcome = $data['outcome'] ?? null;
        if (!in_array($outcome, ['won', 'lost'])) { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Invalid outcome']); return; }

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM lead_matches WHERE id = :id AND workspace_id = :workspaceId AND company_id = :companyId');
        $stmt->execute(['id' => $id, 'workspaceId' => $workspaceId, 'companyId' => $companyId]);
        $match = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$match) { http_response_code(404); echo json_encode(['success' => false, 'error' => 'Not found']); return; }
        if ($match['status'] !== 'accepted') { http_response_code(400); echo json_encode(['success' => false, 'error' => 'Not accepted']); return; }

        if ($outcome === 'won') {
            $value = $data['value'] ?? null;
            $stmt = $pdo->prepare("UPDATE lead_matches SET status = 'won', won_at = NOW(), won_value = :value WHERE id = :id AND workspace_id = :workspaceId");
            $stmt->execute(['value' => $value, 'id' => $id, 'workspaceId' => $workspaceId]);
            $stmt = $pdo->prepare('UPDATE service_pros SET total_leads_won = total_leads_won + 1 WHERE company_id = :companyId AND workspace_id = :workspaceId');
            $stmt->execute(['companyId' => $companyId, 'workspaceId' => $workspaceId]);
        } else {
            $reason = $data['reason'] ?? null;
            $stmt = $pdo->prepare("UPDATE lead_matches SET status = 'lost', lost_at = NOW(), lost_reason = :reason WHERE id = :id AND workspace_id = :workspaceId");
            $stmt->execute(['reason' => $reason, 'id' => $id, 'workspaceId' => $workspaceId]);
        }

        self::logActivity($workspaceId, $match['lead_request_id'], $id, $companyId, "lead_$outcome", "Lead marked $outcome");

        echo json_encode(['success' => true]);
    }

    // ==================== STATS ====================

    public static function getLeadStats(): void
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? 1;
        $pdo = Database::conn();

        $stats = [];

        // Lead counts by status
        $stmt = $pdo->prepare('SELECT status, COUNT(*) as cnt FROM lead_requests WHERE workspace_id = :workspaceId GROUP BY status');
        $stmt->execute(['workspaceId' => $workspaceId]);
        $stats['leads_by_status'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Match counts by status
        $stmt = $pdo->prepare('SELECT status, COUNT(*) as cnt FROM lead_matches WHERE workspace_id = :workspaceId GROUP BY status');
        $stmt->execute(['workspaceId' => $workspaceId]);
        $stats['matches_by_status'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Revenue
        $stmt = $pdo->prepare("SELECT SUM(ABS(amount)) as total FROM credit_transactions WHERE workspace_id = :workspaceId AND type = 'charge'");
        $stmt->execute(['workspaceId' => $workspaceId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        $stats['total_revenue'] = $row['total'] ?? 0;

        // Acceptance rate
        $stmt = $pdo->prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'accepted' OR status = 'won' OR status = 'lost' THEN 1 ELSE 0 END) as accepted FROM lead_matches WHERE workspace_id = :workspaceId");
        $stmt->execute(['workspaceId' => $workspaceId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC) ?: ['total' => 0, 'accepted' => 0];
        $stats['acceptance_rate'] = $row['total'] > 0 ? round(($row['accepted'] / $row['total']) * 100, 1) : 0;

        echo json_encode(['success' => true, 'data' => $stats]);
    }

    // ==================== HELPERS ====================

    public static function calculateLeadPrice($workspaceId, $data): float
    {
        $pdo = Database::conn();
        $serviceIds = array_map(fn($s) => is_array($s) ? $s['service_id'] : $s, $data['services'] ?? []);
        $timing = $data['timing'] ?? 'flexible';
        $isExclusive = $data['is_exclusive'] ?? false;

        $stmt = $pdo->prepare('SELECT * FROM lead_pricing_rules WHERE workspace_id = :workspaceId AND is_active = 1 ORDER BY priority DESC, id ASC');
        $stmt->execute(['workspaceId' => $workspaceId]);
        $rules = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $basePrice = 25.00;
        $surge = 1.0;
        $exclusive = 3.0;

        foreach ($rules as $rule) {
            $match = true;
            if ($rule['service_id'] && !in_array($rule['service_id'], $serviceIds)) $match = false;
            if ($rule['timing'] && $rule['timing'] !== $timing) $match = false;
            if ($match) {
                $basePrice = (float)$rule['base_price'];
                $surge = (float)($rule['surge_multiplier'] ?? 1.0);
                $exclusive = (float)($rule['exclusive_multiplier'] ?? 3.0);
                break;
            }
        }

        $price = $basePrice;
        if (in_array($timing, ['asap', 'within_24h'])) $price *= $surge;
        if ($isExclusive) $price *= $exclusive;

        return round($price, 2);
    }

    private static function haversine($lat1, $lon1, $lat2, $lon2): float
    {
        $r = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        return $r * 2 * asin(sqrt($a));
    }

    private static function logActivity($workspaceId, $leadId, $matchId, $companyId, $type, $desc): void
    {
        $pdo = \Xordon\Database::conn();
        $stmt = $pdo->prepare('INSERT INTO lead_activity_log (workspace_id, lead_request_id, lead_match_id, company_id, activity_type, description, ip_address) VALUES (:workspaceId, :leadId, :matchId, :companyId, :type, :desc, :ip)');
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $stmt->execute([
            'workspaceId' => $workspaceId,
            'leadId' => $leadId,
            'matchId' => $matchId,
            'companyId' => $companyId,
            'type' => $type,
            'desc' => $desc,
            'ip' => $ip,
        ]);
    }
}
