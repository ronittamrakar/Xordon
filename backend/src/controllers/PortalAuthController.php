<?php
/**
 * Portal Auth Controller
 * Handles customer portal authentication via magic link (email) and OTP (SMS)
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../services/JobQueueService.php';
require_once __DIR__ . '/../services/NotificationSender.php';

class PortalAuthController {
    
    /**
     * Request magic link login (email)
     */
    public static function requestMagicLink() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $email = $data['email'] ?? null;
            $workspaceId = $data['workspace_id'] ?? null;
            $redirectUrl = $data['redirect_url'] ?? null;
            
            if (!$email || !$workspaceId) {
                return Response::error('Email and workspace_id are required', 400);
            }
            
            $db = Database::conn();
            
            // Find contact by email
            $stmt = $db->prepare("SELECT id FROM contacts WHERE workspace_id = ? AND email = ?");
            $stmt->execute([$workspaceId, $email]);
            $contact = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Generate token
            $token = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $token);
            $expiresAt = date('Y-m-d H:i:s', time() + 900); // 15 minutes
            
            // Store magic link
            $stmt = $db->prepare("
                INSERT INTO portal_magic_links 
                (workspace_id, email, contact_id, token_hash, expires_at, redirect_url)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $email,
                $contact ? $contact['id'] : null,
                $tokenHash,
                $expiresAt,
                $redirectUrl
            ]);
            
            // Send email via job queue
            JobQueueService::schedule('portal.send_magic_link', [
                'workspace_id' => $workspaceId,
                'email' => $email,
                'token' => $token
            ], null, $workspaceId);
            
            // Log attempt
            self::logLoginAttempt($db, $workspaceId, null, 'magic_link', $email, true);
            
            return Response::json([
                'success' => true,
                'message' => 'Login link sent to your email'
            ]);
            
        } catch (Exception $e) {
            return Response::error('Failed to send login link: ' . $e->getMessage());
        }
    }
    
    /**
     * Verify magic link token
     */
    public static function verifyMagicLink() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $token = $data['token'] ?? $_GET['token'] ?? null;
            
            if (!$token) {
                return Response::error('Token is required', 400);
            }
            
            $db = Database::conn();
            $tokenHash = hash('sha256', $token);
            
            // Find valid magic link
            $stmt = $db->prepare("
                SELECT * FROM portal_magic_links 
                WHERE token_hash = ? AND expires_at > NOW() AND used_at IS NULL
            ");
            $stmt->execute([$tokenHash]);
            $magicLink = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$magicLink) {
                self::logLoginAttempt($db, null, null, 'magic_link', 'unknown', false, 'Invalid or expired token');
                return Response::error('Invalid or expired login link', 401);
            }
            
            // Mark as used
            $stmt = $db->prepare("UPDATE portal_magic_links SET used_at = NOW(), used_ip = ? WHERE id = ?");
            $stmt->execute([$_SERVER['REMOTE_ADDR'] ?? null, $magicLink['id']]);
            
            // Get or create portal identity
            $identity = self::getOrCreateIdentity($db, $magicLink['workspace_id'], $magicLink['contact_id'], $magicLink['email'], null);
            
            // Create session
            $session = self::createSession($db, $identity['id']);
            
            // Log success
            self::logLoginAttempt($db, $magicLink['workspace_id'], $identity['id'], 'magic_link', $magicLink['email'], true);
            
            return Response::json([
                'success' => true,
                'data' => [
                    'token' => $session['token'],
                    'expires_at' => $session['expires_at'],
                    'redirect_url' => $magicLink['redirect_url'],
                    'identity' => [
                        'id' => $identity['id'],
                        'email' => $identity['email'],
                        'contact_id' => $identity['contact_id']
                    ]
                ]
            ]);
            
        } catch (Exception $e) {
            return Response::error('Verification failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Request OTP login (SMS)
     */
    public static function requestOtp() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $phone = $data['phone'] ?? null;
            $workspaceId = $data['workspace_id'] ?? null;
            
            if (!$phone || !$workspaceId) {
                return Response::error('Phone and workspace_id are required', 400);
            }
            
            $phone = self::normalizePhone($phone);
            $db = Database::conn();
            
            // Check rate limit
            $stmt = $db->prepare("
                SELECT * FROM portal_otps 
                WHERE phone = ? AND workspace_id = ? 
                AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
            ");
            $stmt->execute([$phone, $workspaceId]);
            if ($stmt->fetch()) {
                return Response::error('Please wait before requesting another code', 429);
            }
            
            // Check if locked
            $stmt = $db->prepare("
                SELECT * FROM portal_otps 
                WHERE phone = ? AND workspace_id = ? AND locked_until > NOW()
                ORDER BY created_at DESC LIMIT 1
            ");
            $stmt->execute([$phone, $workspaceId]);
            if ($stmt->fetch()) {
                return Response::error('Too many attempts. Please try again later.', 429);
            }
            
            // Find contact by phone
            $stmt = $db->prepare("SELECT id FROM contacts WHERE workspace_id = ? AND phone = ?");
            $stmt->execute([$workspaceId, $phone]);
            $contact = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Generate 6-digit code
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $codeHash = hash('sha256', $code);
            $expiresAt = date('Y-m-d H:i:s', time() + 300); // 5 minutes
            
            // Store OTP
            $stmt = $db->prepare("
                INSERT INTO portal_otps 
                (workspace_id, phone, contact_id, code_hash, expires_at)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $phone,
                $contact ? $contact['id'] : null,
                $codeHash,
                $expiresAt
            ]);
            
            // Send SMS via job queue
            JobQueueService::schedule('portal.send_otp', [
                'workspace_id' => $workspaceId,
                'phone' => $phone,
                'code' => $code
            ], null, $workspaceId);
            
            return Response::json([
                'success' => true,
                'message' => 'Verification code sent to your phone'
            ]);
            
        } catch (Exception $e) {
            return Response::error('Failed to send code: ' . $e->getMessage());
        }
    }
    
    /**
     * Verify OTP code
     */
    public static function verifyOtp() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $phone = $data['phone'] ?? null;
            $code = $data['code'] ?? null;
            $workspaceId = $data['workspace_id'] ?? null;
            
            if (!$phone || !$code || !$workspaceId) {
                return Response::error('Phone, code, and workspace_id are required', 400);
            }
            
            $phone = self::normalizePhone($phone);
            $codeHash = hash('sha256', $code);
            $db = Database::conn();
            
            // Find valid OTP
            $stmt = $db->prepare("
                SELECT * FROM portal_otps 
                WHERE phone = ? AND workspace_id = ? AND expires_at > NOW() AND used_at IS NULL
                ORDER BY created_at DESC LIMIT 1
            ");
            $stmt->execute([$phone, $workspaceId]);
            $otp = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$otp) {
                self::logLoginAttempt($db, $workspaceId, null, 'otp', $phone, false, 'No valid OTP found');
                return Response::error('Invalid or expired code', 401);
            }
            
            // Check attempts
            if ($otp['attempts'] >= $otp['max_attempts']) {
                // Lock for 15 minutes
                $stmt = $db->prepare("UPDATE portal_otps SET locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?");
                $stmt->execute([$otp['id']]);
                self::logLoginAttempt($db, $workspaceId, null, 'otp', $phone, false, 'Too many attempts');
                return Response::error('Too many attempts. Please try again later.', 429);
            }
            
            // Verify code
            if ($otp['code_hash'] !== $codeHash) {
                $stmt = $db->prepare("UPDATE portal_otps SET attempts = attempts + 1 WHERE id = ?");
                $stmt->execute([$otp['id']]);
                self::logLoginAttempt($db, $workspaceId, null, 'otp', $phone, false, 'Invalid code');
                return Response::error('Invalid code', 401);
            }
            
            // Mark as used
            $stmt = $db->prepare("UPDATE portal_otps SET used_at = NOW() WHERE id = ?");
            $stmt->execute([$otp['id']]);
            
            // Get or create portal identity
            $identity = self::getOrCreateIdentity($db, $workspaceId, $otp['contact_id'], null, $phone);
            
            // Create session
            $session = self::createSession($db, $identity['id']);
            
            // Log success
            self::logLoginAttempt($db, $workspaceId, $identity['id'], 'otp', $phone, true);
            
            return Response::json([
                'success' => true,
                'data' => [
                    'token' => $session['token'],
                    'expires_at' => $session['expires_at'],
                    'identity' => [
                        'id' => $identity['id'],
                        'phone' => $identity['phone'],
                        'contact_id' => $identity['contact_id']
                    ]
                ]
            ]);
            
        } catch (Exception $e) {
            return Response::error('Verification failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Validate session token
     */
    public static function validateSession() {
        try {
            $token = self::getBearerToken();
            
            if (!$token) {
                return Response::error('No token provided', 401);
            }
            
            $db = Database::conn();
            $tokenHash = hash('sha256', $token);
            
            $stmt = $db->prepare("
                SELECT ps.*, pi.workspace_id, pi.contact_id, pi.email, pi.phone
                FROM portal_sessions ps
                JOIN portal_identities pi ON ps.portal_identity_id = pi.id
                WHERE ps.token_hash = ? AND ps.expires_at > NOW() AND ps.is_active = 1
            ");
            $stmt->execute([$tokenHash]);
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$session) {
                return Response::error('Invalid or expired session', 401);
            }
            
            // Update last activity
            $stmt = $db->prepare("UPDATE portal_sessions SET last_activity_at = NOW() WHERE id = ?");
            $stmt->execute([$session['id']]);
            
            return Response::json([
                'valid' => true,
                'data' => [
                    'workspace_id' => $session['workspace_id'],
                    'contact_id' => $session['contact_id'],
                    'email' => $session['email'],
                    'phone' => $session['phone']
                ]
            ]);
            
        } catch (Exception $e) {
            return Response::error('Validation failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Logout (revoke session)
     */
    public static function logout() {
        try {
            $token = self::getBearerToken();
            
            if (!$token) {
                return Response::json(['success' => true]);
            }
            
            $db = Database::conn();
            $tokenHash = hash('sha256', $token);
            
            $stmt = $db->prepare("
                UPDATE portal_sessions 
                SET is_active = 0, revoked_at = NOW() 
                WHERE token_hash = ?
            ");
            $stmt->execute([$tokenHash]);
            
            return Response::json(['success' => true]);
            
        } catch (Exception $e) {
            return Response::error('Logout failed: ' . $e->getMessage());
        }
    }
    
    // ==================== HELPER METHODS ====================
    
    private static function getOrCreateIdentity(PDO $db, int $workspaceId, ?int $contactId, ?string $email, ?string $phone): array {
        // Try to find existing identity
        if ($contactId) {
            $stmt = $db->prepare("SELECT * FROM portal_identities WHERE workspace_id = ? AND contact_id = ?");
            $stmt->execute([$workspaceId, $contactId]);
            $identity = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($identity) {
                return $identity;
            }
        }
        
        if ($email) {
            $stmt = $db->prepare("SELECT * FROM portal_identities WHERE workspace_id = ? AND email = ?");
            $stmt->execute([$workspaceId, $email]);
            $identity = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($identity) {
                return $identity;
            }
        }
        
        if ($phone) {
            $stmt = $db->prepare("SELECT * FROM portal_identities WHERE workspace_id = ? AND phone = ?");
            $stmt->execute([$workspaceId, $phone]);
            $identity = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($identity) {
                return $identity;
            }
        }
        
        // Create new identity
        $stmt = $db->prepare("
            INSERT INTO portal_identities (workspace_id, contact_id, email, phone, email_verified, phone_verified)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $workspaceId,
            $contactId,
            $email,
            $phone,
            $email ? 1 : 0,
            $phone ? 1 : 0
        ]);
        
        $id = $db->lastInsertId();
        
        $stmt = $db->prepare("SELECT * FROM portal_identities WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    private static function createSession(PDO $db, int $identityId): array {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expiresAt = date('Y-m-d H:i:s', time() + 86400 * 30); // 30 days
        
        $stmt = $db->prepare("
            INSERT INTO portal_sessions 
            (portal_identity_id, token_hash, ip_address, user_agent, device_type, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $identityId,
            $tokenHash,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            self::detectDeviceType(),
            $expiresAt
        ]);
        
        // Update identity last login
        $stmt = $db->prepare("
            UPDATE portal_identities 
            SET last_login_at = NOW(), last_login_ip = ?, login_count = login_count + 1
            WHERE id = ?
        ");
        $stmt->execute([$_SERVER['REMOTE_ADDR'] ?? null, $identityId]);
        
        return [
            'token' => $token,
            'expires_at' => $expiresAt
        ];
    }
    
    private static function logLoginAttempt(PDO $db, ?int $workspaceId, ?int $identityId, string $method, string $identifier, bool $success, ?string $reason = null): void {
        try {
            $stmt = $db->prepare("
                INSERT INTO portal_login_logs 
                (workspace_id, portal_identity_id, auth_method, identifier, success, failure_reason, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $identityId,
                $method,
                $identifier,
                $success ? 1 : 0,
                $reason,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
        } catch (Exception $e) {
            error_log("Failed to log login attempt: " . $e->getMessage());
        }
    }
    
    private static function normalizePhone(string $phone): string {
        $phone = preg_replace('/[^0-9+]/', '', $phone);
        if (!str_starts_with($phone, '+')) {
            $phone = '+1' . $phone;
        }
        return $phone;
    }
    
    private static function getBearerToken(): ?string {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.+)$/i', $header, $matches)) {
            return $matches[1];
        }
        return $_GET['token'] ?? null;
    }
    
    private static function detectDeviceType(): string {
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        if (preg_match('/mobile|android|iphone|ipad/i', $ua)) {
            return preg_match('/ipad|tablet/i', $ua) ? 'tablet' : 'mobile';
        }
        return 'desktop';
    }
}
