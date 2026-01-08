<?php
/**
 * Affiliates Controller
 * Affiliate program management - partners, referrals, payouts
 * 
 * SCOPING: Workspace-scoped
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class AffiliatesController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    private static function getUserId(): ?int {
        try {
            return Auth::userIdOrFail();
        } catch (Exception $e) {
            return null;
        }
    }

    // Generate unique affiliate code
    private static function generateUniqueCode(): string {
        $db = Database::conn();
        do {
            $code = strtoupper(substr(md5(uniqid(rand(), true)), 0, 10));
            $stmt = $db->prepare("SELECT id FROM affiliates WHERE unique_code = ?");
            $stmt->execute([$code]);
        } while ($stmt->fetch());
        return $code;
    }

    // ==================== AFFILIATES ====================

    public static function getAffiliates() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT id, workspace_id, name, email, status, commission_rate, unique_code,
                       total_referrals, total_earnings, unpaid_balance, phone, company_name,
                       payment_method, payment_email, created_at
                FROM affiliates
                WHERE workspace_id = ?
                ORDER BY created_at DESC
            ");
            $stmt->execute([$workspaceId]);
            $affiliates = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $affiliates]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch affiliates: ' . $e->getMessage());
        }
    }

    public static function getAffiliate($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM affiliates WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $affiliate = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$affiliate) {
                return Response::error('Affiliate not found', 404);
            }

            // Get recent referrals
            $referralsStmt = $db->prepare("
                SELECT * FROM affiliate_referrals
                WHERE affiliate_id = ?
                ORDER BY referred_at DESC
                LIMIT 20
            ");
            $referralsStmt->execute([$id]);
            $affiliate['recent_referrals'] = $referralsStmt->fetchAll(PDO::FETCH_ASSOC);

            // Get payout history
            $payoutsStmt = $db->prepare("
                SELECT * FROM affiliate_payouts
                WHERE affiliate_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            ");
            $payoutsStmt->execute([$id]);
            $affiliate['payout_history'] = $payoutsStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $affiliate]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch affiliate: ' . $e->getMessage());
        }
    }

    public static function createAffiliate() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name']) || empty($data['email'])) {
                return Response::error('name and email required', 400);
            }

            // Check if email already exists for this workspace
            $checkStmt = $db->prepare("SELECT id FROM affiliates WHERE workspace_id = ? AND email = ?");
            $checkStmt->execute([$workspaceId, $data['email']]);
            if ($checkStmt->fetch()) {
                return Response::error('An affiliate with this email already exists', 400);
            }

            $uniqueCode = self::generateUniqueCode();
        
        // Use workspace name or default for base URL
        $settingsStmt = $db->prepare("SELECT * FROM affiliate_settings WHERE workspace_id = ?");
        $settingsStmt->execute([$workspaceId]);
        $settings = $settingsStmt->fetch(PDO::FETCH_ASSOC);
        
        // Base URL should ideally come from workspace settings or environment
        $baseUrl = $_SERVER['HTTP_ORIGIN'] ?? 'https://yoursite.com';
        $referralUrl = $baseUrl . "/ref/" . $uniqueCode;

        $stmt = $db->prepare("
            INSERT INTO affiliates 
            (workspace_id, name, email, status, commission_rate, unique_code, referral_url,
             phone, company_name, payment_method, payment_email, notes, welcome_message,
             cookie_duration_days, invited_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $commissionRate = $data['commission_rate'] ?? ($settings['default_commission_rate'] ?? 20.00);
        $cookieDuration = $data['cookie_duration_days'] ?? ($settings['cookie_duration_days'] ?? 30);

        $stmt->execute([
            $workspaceId,
            $data['name'],
            $data['email'],
            $data['status'] ?? 'pending',
            $commissionRate,
            $uniqueCode,
            $referralUrl,
            $data['phone'] ?? null,
            $data['company_name'] ?? null,
            $data['payment_method'] ?? null,
            $data['payment_email'] ?? $data['email'],
            $data['notes'] ?? null,
            $data['welcome_message'] ?? null,
            $cookieDuration,
            $userId
        ]);

        $affiliateId = $db->lastInsertId();

        // MOCK: Send invitation email
        // In a real app, this would use a Mailer service
        error_log("Affiliate Invitation Sent: To {$data['email']}, Link: {$referralUrl}");

        return Response::json(['data' => ['id' => (int)$affiliateId, 'unique_code' => $uniqueCode, 'referral_url' => $referralUrl]]);
    } catch (Exception $e) {
        return Response::error('Failed to create affiliate: ' . $e->getMessage());
    }
}

    public static function updateAffiliate($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Verify ownership
            $checkStmt = $db->prepare("SELECT id FROM affiliates WHERE id = ? AND workspace_id = ?");
            $checkStmt->execute([$id, $workspaceId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Affiliate not found', 404);
            }

            $updates = [];
            $params = [];

            $allowedFields = ['name', 'email', 'status', 'commission_rate', 'phone', 'company_name',
                'payment_method', 'payment_email', 'notes', 'cookie_duration_days'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (!empty($updates)) {
                $params[] = $id;
                $stmt = $db->prepare("UPDATE affiliates SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update affiliate: ' . $e->getMessage());
        }
    }

    public static function deleteAffiliate($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Set to inactive instead of deleting
            $stmt = $db->prepare("UPDATE affiliates SET status = 'inactive' WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete affiliate: ' . $e->getMessage());
        }
    }

    // ==================== REFERRALS ====================

    public static function getReferrals() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $where = ['r.workspace_id = ?'];
            $params = [$workspaceId];

            if (!empty($_GET['affiliate_id'])) {
                $where[] = 'r.affiliate_id = ?';
                $params[] = (int)$_GET['affiliate_id'];
            }

            if (!empty($_GET['status'])) {
                $where[] = 'r.status = ?';
                $params[] = $_GET['status'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT r.*, a.name as affiliate_name, a.email as affiliate_email
                FROM affiliate_referrals r
                JOIN affiliates a ON a.id = r.affiliate_id
                WHERE $whereClause
                ORDER BY r.referred_at DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $referrals = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $countParams = array_slice($params, 0, -2);
            $countStmt = $db->prepare("SELECT COUNT(*) FROM affiliate_referrals r WHERE $whereClause");
            $countStmt->execute($countParams);
            $total = (int)$countStmt->fetchColumn();

            return Response::json([
                'data' => $referrals,
                'meta' => ['total' => $total, 'limit' => $limit, 'offset' => $offset]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch referrals: ' . $e->getMessage());
        }
    }

    public static function createReferral() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['affiliate_id'])) {
                return Response::error('affiliate_id required', 400);
            }

            // Verify affiliate exists and get commission rate
            $affiliateStmt = $db->prepare("SELECT id, commission_rate FROM affiliates WHERE id = ? AND workspace_id = ?");
            $affiliateStmt->execute([$data['affiliate_id'], $workspaceId]);
            $affiliate = $affiliateStmt->fetch(PDO::FETCH_ASSOC);

            if (!$affiliate) {
                return Response::error('Affiliate not found', 404);
            }

            // Calculate commission
            $commissionAmount = 0;
            if (!empty($data['conversion_value'])) {
                $commissionRate = $data['commission_rate'] ?? $affiliate['commission_rate'];
                $commissionAmount = ($data['conversion_value'] * $commissionRate) / 100;
            }

            // Insert referral
            $stmt = $db->prepare("
                INSERT INTO affiliate_referrals
                (workspace_id, affiliate_id, contact_id, customer_email, customer_name, 
                 status, conversion_type, conversion_value, commission_amount,
                 referral_source, landing_page, utm_source, utm_medium, utm_campaign,
                 ip_address, user_agent, referred_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $workspaceId,
                $data['affiliate_id'],
                $data['contact_id'] ?? null,
                $data['customer_email'] ?? null,
                $data['customer_name'] ?? null,
                $data['status'] ?? 'pending',
                $data['conversion_type'] ?? null,
                $data['conversion_value'] ?? 0,
                $commissionAmount,
                $data['referral_source'] ?? null,
                $data['landing_page'] ?? null,
                $data['utm_source'] ?? null,
                $data['utm_medium'] ?? null,
                $data['utm_campaign'] ?? null,
                $data['ip_address'] ?? $_SERVER['REMOTE_ADDR'] ?? null,
                $data['user_agent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);

            $referralId = $db->lastInsertId();

            // Update affiliate totals if converted
            if ($data['status'] === 'converted') {
                $db->prepare("
                    UPDATE affiliates 
                    SET total_referrals = total_referrals + 1,
                        total_earnings = total_earnings + ?,
                        unpaid_balance = unpaid_balance + ?
                    WHERE id = ? AND workspace_id = ?
                ")->execute([$commissionAmount, $commissionAmount, $data['affiliate_id'], $workspaceId]);
            }

            return Response::json(['data' => ['id' => (int)$referralId]], 201);
        } catch (Exception $e) {
            return Response::error('Failed to create referral: ' . $e->getMessage());
        }
    }

    // ==================== PAYOUTS ====================

    public static function getPayouts() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT p.*, a.name as affiliate_name, a.email as affiliate_email
                FROM affiliate_payouts p
                JOIN affiliates a ON a.id = p.affiliate_id
                WHERE p.workspace_id = ?
                ORDER BY p.created_at DESC
            ");
            $stmt->execute([$workspaceId]);
            $payouts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $payouts]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch payouts: ' . $e->getMessage());
        }
    }

    public static function createPayout() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['affiliate_id']) || empty($data['amount'])) {
                return Response::error('affiliate_id and amount required', 400);
            }

            // Verify affiliate exists and has sufficient balance
            $affiliateStmt = $db->prepare("SELECT unpaid_balance FROM affiliates WHERE id = ? AND workspace_id = ?");
            $affiliateStmt->execute([$data['affiliate_id'], $workspaceId]);
            $affiliate = $affiliateStmt->fetch(PDO::FETCH_ASSOC);

            if (!$affiliate) {
                return Response::error('Affiliate not found', 404);
            }

            if ($affiliate['unpaid_balance'] < $data['amount']) {
                return Response::error('Insufficient unpaid balance', 400);
            }

            $db->beginTransaction();

            try {
                // Create payout record
                $stmt = $db->prepare("
                    INSERT INTO affiliate_payouts 
                    (workspace_id, affiliate_id, amount, currency, payment_method, payment_reference,
                     status, period_start, period_end, notes, processed_by, processed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $workspaceId,
                    $data['affiliate_id'],
                    $data['amount'],
                    $data['currency'] ?? 'USD',
                    $data['payment_method'] ?? null,
                    $data['payment_reference'] ?? null,
                    $data['status'] ?? 'processing',
                    $data['period_start'] ?? null,
                    $data['period_end'] ?? null,
                    $data['notes'] ?? null,
                    $userId
                ]);

                $payoutId = $db->lastInsertId();

                // Update affiliate balance
                $db->prepare("UPDATE affiliates SET unpaid_balance = unpaid_balance - ? WHERE id = ?")
                    ->execute([$data['amount'], $data['affiliate_id']]);

                $db->commit();

                return Response::json(['data' => ['id' => (int)$payoutId]]);
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
        } catch (Exception $e) {
            return Response::error('Failed to create payout: ' . $e->getMessage());
        }
    }

    // ==================== ANALYTICS ====================

    public static function getAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            // Affiliates summary
            $affiliatesStmt = $db->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
                FROM affiliates
                WHERE workspace_id = ?
            ");
            $affiliatesStmt->execute([$workspaceId]);
            $affiliates = $affiliatesStmt->fetch(PDO::FETCH_ASSOC);

            // Referrals summary
            $referralsStmt = $db->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
                    SUM(commission_amount) as total_commissions
                FROM affiliate_referrals
                WHERE workspace_id = ?
            ");
            $referralsStmt->execute([$workspaceId]);
            $referrals = $referralsStmt->fetch(PDO::FETCH_ASSOC);

            // Payouts summary
            $payoutsStmt = $db->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_paid
                FROM affiliate_payouts
                WHERE workspace_id = ?
            ");
            $payoutsStmt->execute([$workspaceId]);
            $payouts = $payoutsStmt->fetch(PDO::FETCH_ASSOC);

            // Get pending amount from unpaid balances
            $pendingStmt = $db->prepare("
                SELECT SUM(unpaid_balance) as pending_amount
                FROM affiliates
                WHERE workspace_id = ?
            ");
            $pendingStmt->execute([$workspaceId]);
            $pending = $pendingStmt->fetch(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'affiliates' => $affiliates,
                    'referrals' => $referrals,
                    'payouts' => [
                        'total' => (int)$payouts['total'],
                        'total_paid' => (float)($payouts['total_paid'] ?? 0),
                        'pending_amount' => (float)($pending['pending_amount'] ?? 0)
                    ]
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }
    // ==================== CLICKS ====================

    public static function recordClick() {
        try {
            // Clicks can be recorded without auth (public visitors)
            // But we need to know the workspace_id based on the affiliate code
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $code = $data['code'] ?? $_GET['code'] ?? null;

            if (!$code) {
                return Response::error('Affiliate code required', 400);
            }

            $db = Database::conn();
            
            // Find affiliate by code
            $affiliateStmt = $db->prepare("SELECT id, workspace_id, cookie_duration_days FROM affiliates WHERE unique_code = ? AND status = 'active'");
            $affiliateStmt->execute([$code]);
            $affiliate = $affiliateStmt->fetch(PDO::FETCH_ASSOC);

            if (!$affiliate) {
                return Response::error('Invalid or inactive affiliate code', 404);
            }

            // Record click
        $stmt = $db->prepare("
            INSERT INTO affiliate_clicks
            (workspace_id, affiliate_id, referral_url, landing_page, ip_address, user_agent,
             utm_source, utm_medium, utm_campaign, utm_content, utm_term,
             cookie_set, cookie_expires_at, clicked_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $cookieDuration = $affiliate['cookie_duration_days'];
        
        if (empty($cookieDuration)) {
            $settingsStmt = $db->prepare("SELECT cookie_duration_days FROM affiliate_settings WHERE workspace_id = ?");
            $settingsStmt->execute([$affiliate['workspace_id']]);
            $settings = $settingsStmt->fetch(PDO::FETCH_ASSOC);
            $cookieDuration = $settings['cookie_duration_days'] ?? 30;
        }
        
        $expiresAt = date('Y-m-d H:i:s', strtotime("+$cookieDuration days"));

            $stmt->execute([
                $affiliate['workspace_id'],
                $affiliate['id'],
                $data['referral_url'] ?? $_SERVER['HTTP_REFERER'] ?? null,
                $data['landing_page'] ?? null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null,
                $data['utm_source'] ?? null,
                $data['utm_medium'] ?? null,
                $data['utm_campaign'] ?? null,
                $data['utm_content'] ?? null,
                $data['utm_term'] ?? null,
                true,
                $expiresAt
            ]);

            return Response::json([
                'success' => true,
                'data' => [
                    'affiliate_id' => $affiliate['id'],
                    'expires_at' => $expiresAt
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to record click: ' . $e->getMessage());
        }
    }
    // ==================== SETTINGS ====================

    public static function getSettings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM affiliate_settings WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$settings) {
                // Return defaults
                return Response::json(['data' => [
                    'default_commission_rate' => 20.00,
                    'cookie_duration_days' => 30,
                    'min_payout_amount' => 50.00,
                    'payout_methods' => ['paypal', 'bank_transfer'],
                    'allow_self_referral' => false,
                    'auto_approve_affiliates' => false
                ]]);
            }

            // Decode JSON fields
            if (isset($settings['payout_methods'])) {
                $settings['payout_methods'] = json_decode($settings['payout_methods'], true);
            }

            return Response::json(['data' => $settings]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch settings: ' . $e->getMessage());
        }
    }

    public static function updateSettings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("
                INSERT INTO affiliate_settings 
                (workspace_id, default_commission_rate, cookie_duration_days, min_payout_amount, 
                 payout_methods, allow_self_referral, auto_approve_affiliates)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                default_commission_rate = VALUES(default_commission_rate),
                cookie_duration_days = VALUES(cookie_duration_days),
                min_payout_amount = VALUES(min_payout_amount),
                payout_methods = VALUES(payout_methods),
                allow_self_referral = VALUES(allow_self_referral),
                auto_approve_affiliates = VALUES(auto_approve_affiliates)
            ");

            $stmt->execute([
                $workspaceId,
                $data['default_commission_rate'] ?? 20.00,
                $data['cookie_duration_days'] ?? 30,
                $data['min_payout_amount'] ?? 50.00,
                json_encode($data['payout_methods'] ?? ['paypal', 'bank_transfer']),
                isset($data['allow_self_referral']) ? (int)$data['allow_self_referral'] : 0,
                isset($data['auto_approve_affiliates']) ? (int)$data['auto_approve_affiliates'] : 0
            ]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update settings: ' . $e->getMessage());
        }
    }

    // ==================== EXPORT ====================

    public static function exportPayouts() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT p.id, a.name as affiliate_name, a.email as affiliate_email, 
                       p.amount, p.currency, p.payment_method, p.payment_reference, 
                       p.status, p.created_at
                FROM affiliate_payouts p
                JOIN affiliates a ON a.id = p.affiliate_id
                WHERE p.workspace_id = ?
                ORDER BY p.created_at DESC
            ");
            $stmt->execute([$workspaceId]);
            $payouts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="affiliate_payouts_' . date('Y-m-d') . '.csv"');

            $output = fopen('php://output', 'w');
            fputcsv($output, ['ID', 'Affiliate Name', 'Affiliate Email', 'Amount', 'Currency', 'Payment Method', 'Reference', 'Status', 'Date']);

            foreach ($payouts as $payout) {
                fputcsv($output, $payout);
            }

            fclose($output);
            exit;
        } catch (Exception $e) {
            return Response::error('Failed to export payouts: ' . $e->getMessage());
        }
    }
}
