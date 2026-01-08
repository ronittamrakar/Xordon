<?php
/**
 * DNI Controller - Dynamic Number Insertion
 * 
 * Handles number pools, visitor sessions, and number swapping for call attribution
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';

class DNIController {

    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    private static function getWorkspaceId(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
    }

    // ============================================
    // NUMBER POOLS
    // ============================================

    /**
     * GET /api/number-pools - List all number pools
     */
    public static function getPools(): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $stmt = $pdo->prepare("
                SELECT 
                    np.*,
                    COUNT(DISTINCT pn.id) as number_count,
                    COUNT(DISTINCT vs.id) as active_sessions
                FROM number_pools np
                LEFT JOIN pool_numbers pn ON np.id = pn.pool_id
                LEFT JOIN visitor_sessions vs ON np.id = vs.pool_id AND vs.expires_at > NOW()
                WHERE np.{$scope['col']} = ?
                GROUP BY np.id
                ORDER BY np.created_at DESC
            ");
            $stmt->execute([$scope['val']]);
            $pools = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Response::json(['items' => $pools]);
        } catch (Exception $e) {
            Response::error('Failed to fetch number pools: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/number-pools - Create a number pool
     */
    public static function createPool(): void {
        Auth::userIdOrFail();
        try {
            $b = get_json_body();
            
            if (empty($b['name']) || empty($b['target_number'])) {
                Response::validationError('Name and target number are required');
                return;
            }
            
            $pdo = Database::conn();
            $userId = Auth::userId();
            $workspaceId = self::getWorkspaceId();
            
            $stmt = $pdo->prepare('
                INSERT INTO number_pools 
                (user_id, workspace_id, name, description, source_type, custom_source, target_number, session_timeout_minutes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ');
            
            $stmt->execute([
                $userId,
                $workspaceId,
                $b['name'],
                $b['description'] ?? null,
                $b['source_type'] ?? 'custom',
                $b['custom_source'] ?? null,
                $b['target_number'],
                $b['session_timeout_minutes'] ?? 30
            ]);
            
            $poolId = $pdo->lastInsertId();
            
            // Add phone numbers to pool if provided
            if (!empty($b['phone_number_ids']) && is_array($b['phone_number_ids'])) {
                $insertStmt = $pdo->prepare('INSERT INTO pool_numbers (pool_id, phone_number_id) VALUES (?, ?)');
                foreach ($b['phone_number_ids'] as $phoneNumberId) {
                    $insertStmt->execute([$poolId, $phoneNumberId]);
                }
            }
            
            // Return created pool
            $stmt = $pdo->prepare('SELECT * FROM number_pools WHERE id = ?');
            $stmt->execute([$poolId]);
            $pool = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::json($pool, 201);
        } catch (Exception $e) {
            Response::error('Failed to create number pool: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/number-pools/{id} - Update a number pool
     */
    public static function updatePool(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $b = get_json_body();
            
            // Verify pool exists
            $stmt = $pdo->prepare("SELECT id FROM number_pools WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            if (!$stmt->fetch()) {
                Response::error('Number pool not found or access denied', 404);
                return;
            }
            
            $updates = [];
            $params = [];
            
            $fields = ['name', 'description', 'source_type', 'custom_source', 'target_number', 'session_timeout_minutes', 'is_active'];
            foreach ($fields as $field) {
                if (isset($b[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $b[$field];
                }
            }
            
            if (!empty($updates)) {
                $params[] = $id;
                $stmt = $pdo->prepare('UPDATE number_pools SET ' . implode(', ', $updates) . ' WHERE id = ?');
                $stmt->execute($params);
            }
            
            // Update phone numbers if provided
            if (isset($b['phone_number_ids']) && is_array($b['phone_number_ids'])) {
                // Remove existing
                $pdo->prepare('DELETE FROM pool_numbers WHERE pool_id = ?')->execute([$id]);
                // Add new
                $insertStmt = $pdo->prepare('INSERT INTO pool_numbers (pool_id, phone_number_id) VALUES (?, ?)');
                foreach ($b['phone_number_ids'] as $phoneNumberId) {
                    $insertStmt->execute([$id, $phoneNumberId]);
                }
            }
            
            // Return updated pool
            $stmt = $pdo->prepare('SELECT * FROM number_pools WHERE id = ?');
            $stmt->execute([$id]);
            $pool = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::json($pool);
        } catch (Exception $e) {
            Response::error('Failed to update number pool: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/number-pools/{id} - Delete a number pool
     */
    public static function deletePool(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $stmt = $pdo->prepare("DELETE FROM number_pools WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            
            if ($stmt->rowCount() === 0) {
                Response::error('Number pool not found or access denied', 404);
                return;
            }
            
            Response::json(['message' => 'Number pool deleted successfully']);
        } catch (Exception $e) {
            Response::error('Failed to delete number pool: ' . $e->getMessage(), 500);
        }
    }

    // ============================================
    // PUBLIC TRACKING ENDPOINTS (No Auth)
    // ============================================

    /**
     * GET /api/dni/swap - Get swap number for visitor (Public)
     * 
     * Called by tracking.js to get a number for the visitor
     */
    public static function getSwapNumber(): void {
        try {
            $poolId = $_GET['pool_id'] ?? null;
            $visitorId = $_GET['visitor_id'] ?? null;
            $utmSource = $_GET['utm_source'] ?? null;
            $utmMedium = $_GET['utm_medium'] ?? null;
            $utmCampaign = $_GET['utm_campaign'] ?? null;
            $utmTerm = $_GET['utm_term'] ?? null;
            $gclid = $_GET['gclid'] ?? null;
            $referrer = $_GET['referrer'] ?? null;
            $landingPage = $_GET['landing_page'] ?? null;
            
            if (!$poolId || !$visitorId) {
                Response::error('pool_id and visitor_id are required', 400);
                return;
            }
            
            $pdo = Database::conn();
            
            // Check if pool exists and is active
            $stmt = $pdo->prepare('SELECT * FROM number_pools WHERE id = ? AND is_active = 1');
            $stmt->execute([$poolId]);
            $pool = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$pool) {
                Response::error('Pool not found or inactive', 404);
                return;
            }
            
            // Check for existing session
            $stmt = $pdo->prepare('
                SELECT vs.*, pn.phone_number_id, ph.phone_number
                FROM visitor_sessions vs
                LEFT JOIN pool_numbers pn ON vs.assigned_number_id = pn.id
                LEFT JOIN phone_numbers ph ON pn.phone_number_id = ph.id
                WHERE vs.pool_id = ? AND vs.visitor_id = ? AND vs.expires_at > NOW()
            ');
            $stmt->execute([$poolId, $visitorId]);
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($session && $session['phone_number']) {
                // Extend session
                $expiresAt = date('Y-m-d H:i:s', strtotime("+{$pool['session_timeout_minutes']} minutes"));
                $pdo->prepare('UPDATE visitor_sessions SET expires_at = ?, last_activity_at = NOW() WHERE id = ?')
                    ->execute([$expiresAt, $session['id']]);
                
                Response::json([
                    'swap_number' => $session['phone_number'],
                    'target_number' => $pool['target_number'],
                    'session_id' => $session['id']
                ]);
                return;
            }
            
            // Find an available number from the pool
            $stmt = $pdo->prepare('
                SELECT pn.id, ph.phone_number
                FROM pool_numbers pn
                JOIN phone_numbers ph ON pn.phone_number_id = ph.id
                WHERE pn.pool_id = ? AND pn.is_available = 1
                ORDER BY pn.last_assigned_at ASC
                LIMIT 1
            ');
            $stmt->execute([$poolId]);
            $availableNumber = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$availableNumber) {
                // No available numbers, return target number (no swap)
                Response::json([
                    'swap_number' => $pool['target_number'],
                    'target_number' => $pool['target_number'],
                    'no_swap' => true
                ]);
                return;
            }
            
            // Create new session
            $expiresAt = date('Y-m-d H:i:s', strtotime("+{$pool['session_timeout_minutes']} minutes"));
            $deviceType = self::detectDeviceType($_SERVER['HTTP_USER_AGENT'] ?? '');
            
            $stmt = $pdo->prepare('
                INSERT INTO visitor_sessions 
                (pool_id, visitor_id, assigned_number_id, utm_source, utm_medium, utm_campaign, utm_term, gclid, referrer, landing_page, ip_address, user_agent, device_type, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $poolId,
                $visitorId,
                $availableNumber['id'],
                $utmSource,
                $utmMedium,
                $utmCampaign,
                $utmTerm,
                $gclid,
                $referrer,
                $landingPage,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null,
                $deviceType,
                $expiresAt
            ]);
            
            $sessionId = $pdo->lastInsertId();
            
            // Mark number as assigned
            $pdo->prepare('UPDATE pool_numbers SET is_available = 0, last_assigned_at = NOW() WHERE id = ?')
                ->execute([$availableNumber['id']]);
            
            Response::json([
                'swap_number' => $availableNumber['phone_number'],
                'target_number' => $pool['target_number'],
                'session_id' => $sessionId
            ]);
            
        } catch (Exception $e) {
            Response::error('Failed to get swap number: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/dni/track-page - Track page visit (Public)
     */
    public static function trackPageVisit(): void {
        try {
            $b = get_json_body();
            $sessionId = $b['session_id'] ?? null;
            $pageUrl = $b['page_url'] ?? null;
            $pageTitle = $b['page_title'] ?? null;
            
            if (!$sessionId || !$pageUrl) {
                Response::error('session_id and page_url are required', 400);
                return;
            }
            
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare('
                INSERT INTO visitor_page_visits (session_id, page_url, page_title)
                VALUES (?, ?, ?)
            ');
            $stmt->execute([$sessionId, $pageUrl, $pageTitle]);
            
            // Update session last activity
            $pdo->prepare('UPDATE visitor_sessions SET last_activity_at = NOW() WHERE id = ?')
                ->execute([$sessionId]);
            
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error('Failed to track page visit: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/dni/snippet - Generate tracking snippet (Authenticated)
     */
    public static function getTrackingSnippet(): void {
        Auth::userIdOrFail();
        try {
            $poolId = $_GET['pool_id'] ?? null;
            
            if (!$poolId) {
                Response::validationError('pool_id is required');
                return;
            }
            
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            // Verify pool exists
            $stmt = $pdo->prepare("SELECT * FROM number_pools WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$poolId, $scope['val']]);
            $pool = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$pool) {
                Response::error('Number pool not found', 404);
                return;
            }
            
            $apiUrl = ($_SERVER['HTTPS'] ?? 'off') === 'on' ? 'https://' : 'http://';
            $apiUrl .= $_SERVER['HTTP_HOST'] . '/api/dni';
            
            $snippet = <<<JS
<!-- Call Tracking Script -->
<script>
(function() {
  var POOL_ID = '{$poolId}';
  var TARGET_NUMBER = '{$pool['target_number']}';
  var API_URL = '{$apiUrl}';

  function getVisitorId() {
    var id = localStorage.getItem('_ct_vid');
    if (!id) {
      id = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('_ct_vid', id);
    }
    return id;
  }

  function getUrlParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || document.referrer.match(/google|bing|facebook|linkedin/i)?.[0] || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_term: params.get('utm_term') || '',
      gclid: params.get('gclid') || '',
      referrer: document.referrer,
      landing_page: window.location.href
    };
  }

  function swapNumbers(swapNumber) {
    var formatted = swapNumber.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+\$1 (\$2) \$3-\$4');
    var selectors = [
      'a[href*="tel:' + TARGET_NUMBER + '"]',
      'a[href*="tel:' + TARGET_NUMBER.replace(/\D/g, '') + '"]'
    ];
    
    selectors.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        el.href = 'tel:' + swapNumber;
        if (el.textContent.includes(TARGET_NUMBER)) {
          el.textContent = formatted;
        }
      });
    });

    // Replace text occurrences
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.includes(TARGET_NUMBER)) {
        walker.currentNode.nodeValue = walker.currentNode.nodeValue.replace(
          new RegExp(TARGET_NUMBER.replace(/[.*+?^\${}()|[\]\\\\]/g, '\\\\\\$&'), 'g'),
          formatted
        );
      }
    }
  }

  function init() {
    var visitorId = getVisitorId();
    var params = getUrlParams();
    var url = API_URL + '/swap?pool_id=' + POOL_ID + '&visitor_id=' + visitorId;
    
    Object.keys(params).forEach(function(key) {
      if (params[key]) url += '&' + key + '=' + encodeURIComponent(params[key]);
    });

    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.swap_number && !data.no_swap) {
          swapNumbers(data.swap_number);
          sessionStorage.setItem('_ct_sid', data.session_id);
        }
      })
      .catch(function(e) { console.warn('Call tracking error:', e); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
<!-- End Call Tracking Script -->
JS;

            Response::json([
                'snippet' => $snippet,
                'pool' => $pool
            ]);
        } catch (Exception $e) {
            Response::error('Failed to generate tracking snippet: ' . $e->getMessage(), 500);
        }
    }

    // ============================================
    // ATTRIBUTION / ANALYTICS
    // ============================================

    /**
     * GET /api/dni/analytics - Get DNI analytics (Authenticated)
     */
    public static function getAnalytics(): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $poolId = $_GET['pool_id'] ?? null;
            $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
            $endDate = $_GET['end_date'] ?? date('Y-m-d');
            
            $poolCondition = $poolId ? "AND np.id = ?" : "";
            $params = [$scope['val']];
            if ($poolId) $params[] = $poolId;
            $params[] = $startDate;
            $params[] = $endDate;
            
            // Get calls by source
            $stmt = $pdo->prepare("
                SELECT 
                    COALESCE(vs.utm_source, 'Direct') as source,
                    COALESCE(vs.utm_medium, 'none') as medium,
                    COALESCE(vs.utm_campaign, 'none') as campaign,
                    COUNT(DISTINCT pcl.id) as total_calls,
                    COUNT(DISTINCT CASE WHEN pcl.status = 'completed' THEN pcl.id END) as answered_calls,
                    AVG(pcl.duration_seconds) as avg_duration
                FROM number_pools np
                JOIN visitor_sessions vs ON np.id = vs.pool_id
                JOIN phone_call_logs pcl ON vs.id = pcl.visitor_session_id
                WHERE np.{$scope['col']} = ? $poolCondition
                    AND pcl.started_at BETWEEN ? AND ?
                GROUP BY vs.utm_source, vs.utm_medium, vs.utm_campaign
                ORDER BY total_calls DESC
            ");
            $stmt->execute($params);
            $callsBySource = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get total sessions vs calls
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(DISTINCT vs.id) as total_sessions,
                    COUNT(DISTINCT CASE WHEN vs.has_called = 1 THEN vs.id END) as sessions_with_calls
                FROM number_pools np
                JOIN visitor_sessions vs ON np.id = vs.pool_id
                WHERE np.{$scope['col']} = ? $poolCondition
                    AND vs.first_visit_at BETWEEN ? AND ?
            ");
            $stmt->execute($params);
            $sessionStats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            Response::json([
                'calls_by_source' => $callsBySource,
                'session_stats' => $sessionStats,
                'date_range' => ['start' => $startDate, 'end' => $endDate]
            ]);
        } catch (Exception $e) {
            Response::error('Failed to get analytics: ' . $e->getMessage(), 500);
        }
    }

    // ============================================
    // UTILITIES
    // ============================================

    private static function detectDeviceType(string $userAgent): string {
        if (preg_match('/mobile|android|iphone|ipad/i', $userAgent)) {
            if (preg_match('/ipad|tablet/i', $userAgent)) {
                return 'tablet';
            }
            return 'mobile';
        }
        return 'desktop';
    }
}
