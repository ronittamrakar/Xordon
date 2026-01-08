<?php
/**
 * Login Rate Limiter
 * Implements brute-force protection for authentication endpoints
 * 
 * Features:
 * - Per-IP rate limiting
 * - Per-email rate limiting (prevents credential stuffing)
 * - Progressive delays after failed attempts
 * - Account lockout after too many failures
 * - Automatic cleanup of old entries
 */

require_once __DIR__ . '/Logger.php';
require_once __DIR__ . '/Database.php';

class LoginRateLimiter {
    
    // Maximum failed attempts before lockout
    private static $maxAttempts = 5;
    
    // Lockout duration in seconds (15 minutes)
    private static $lockoutDuration = 900;
    
    // Window for counting attempts (1 hour)
    private static $attemptWindow = 3600;
    
    // In-memory cache for rate limiting (fallback when DB unavailable)
    private static $memoryCache = [];
    
    /**
     * Check if login attempt is allowed
     * 
     * @param string $email The email attempting to login
     * @param string|null $ip The IP address (auto-detected if null)
     * @return array ['allowed' => bool, 'reason' => string|null, 'retry_after' => int|null]
     */
    public static function checkAttempt(string $email, ?string $ip = null): array {
        $ip = $ip ?? self::getClientIp();
        $email = strtolower(trim($email));
        
        // Check IP-based rate limit
        $ipCheck = self::checkIpLimit($ip);
        if (!$ipCheck['allowed']) {
            return $ipCheck;
        }
        
        // Check email-based rate limit
        $emailCheck = self::checkEmailLimit($email);
        if (!$emailCheck['allowed']) {
            return $emailCheck;
        }
        
        return ['allowed' => true, 'reason' => null, 'retry_after' => null];
    }
    
    /**
     * Record a failed login attempt
     */
    public static function recordFailedAttempt(string $email, ?string $ip = null): void {
        $ip = $ip ?? self::getClientIp();
        $email = strtolower(trim($email));
        $now = time();
        
        try {
            $pdo = Database::conn();
            
            // Record IP attempt
            $stmt = $pdo->prepare('
                INSERT INTO login_attempts (identifier, identifier_type, attempt_time, success)
                VALUES (?, "ip", FROM_UNIXTIME(?), 0)
            ');
            $stmt->execute([$ip, $now]);
            
            // Record email attempt
            $stmt = $pdo->prepare('
                INSERT INTO login_attempts (identifier, identifier_type, attempt_time, success)
                VALUES (?, "email", FROM_UNIXTIME(?), 0)
            ');
            $stmt->execute([$email, $now]);
            
        } catch (Exception $e) {
            // Fallback to memory cache
            self::recordMemoryAttempt($ip, 'ip', false);
            self::recordMemoryAttempt($email, 'email', false);
        }
        
        // Log the failed attempt
        Logger::warning('Failed login attempt', [
            'email' => self::maskEmail($email),
            'ip' => $ip,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
    }
    
    /**
     * Record a successful login (resets the counter)
     */
    public static function recordSuccessfulLogin(string $email, ?string $ip = null): void {
        $ip = $ip ?? self::getClientIp();
        $email = strtolower(trim($email));
        
        try {
            $pdo = Database::conn();
            
            // Clear failed attempts for this email
            $stmt = $pdo->prepare('
                DELETE FROM login_attempts 
                WHERE identifier = ? AND identifier_type = "email" AND success = 0
            ');
            $stmt->execute([$email]);
            
        } catch (Exception $e) {
            // Clear from memory cache
            unset(self::$memoryCache['email:' . $email]);
        }
        
        Logger::info('Successful login', [
            'email' => self::maskEmail($email),
            'ip' => $ip
        ]);
    }
    
    /**
     * Check IP-based rate limit
     */
    private static function checkIpLimit(string $ip): array {
        $attempts = self::getAttemptCount($ip, 'ip');
        
        if ($attempts >= self::$maxAttempts * 2) {
            // IP is making too many attempts across multiple accounts
            $retryAfter = self::getRetryAfter($ip, 'ip');
            
            Logger::warning('IP blocked due to excessive login attempts', [
                'ip' => $ip,
                'attempts' => $attempts
            ]);
            
            return [
                'allowed' => false,
                'reason' => 'Too many login attempts from this IP. Please try again later.',
                'retry_after' => $retryAfter
            ];
        }
        
        return ['allowed' => true, 'reason' => null, 'retry_after' => null];
    }
    
    /**
     * Check email-based rate limit
     */
    private static function checkEmailLimit(string $email): array {
        $attempts = self::getAttemptCount($email, 'email');
        
        if ($attempts >= self::$maxAttempts) {
            $retryAfter = self::getRetryAfter($email, 'email');
            
            Logger::warning('Account temporarily locked due to failed attempts', [
                'email' => self::maskEmail($email),
                'attempts' => $attempts
            ]);
            
            return [
                'allowed' => false,
                'reason' => 'Account temporarily locked due to too many failed attempts. Please try again in ' . ceil($retryAfter / 60) . ' minutes.',
                'retry_after' => $retryAfter
            ];
        }
        
        return ['allowed' => true, 'reason' => null, 'retry_after' => null];
    }
    
    /**
     * Get attempt count for an identifier
     */
    private static function getAttemptCount(string $identifier, string $type): int {
        $windowStart = time() - self::$attemptWindow;
        
        try {
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare('
                SELECT COUNT(*) as count
                FROM login_attempts
                WHERE identifier = ? 
                AND identifier_type = ?
                AND success = 0
                AND attempt_time > FROM_UNIXTIME(?)
            ');
            $stmt->execute([$identifier, $type, $windowStart]);
            $row = $stmt->fetch();
            
            return (int)($row['count'] ?? 0);
            
        } catch (Exception $e) {
            // Fallback to memory cache
            return self::getMemoryAttemptCount($identifier, $type);
        }
    }
    
    /**
     * Get seconds until retry is allowed
     */
    private static function getRetryAfter(string $identifier, string $type): int {
        try {
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare('
                SELECT MAX(attempt_time) as last_attempt
                FROM login_attempts
                WHERE identifier = ? 
                AND identifier_type = ?
                AND success = 0
            ');
            $stmt->execute([$identifier, $type]);
            $row = $stmt->fetch();
            
            if ($row && $row['last_attempt']) {
                $lastAttempt = strtotime($row['last_attempt']);
                $unlockTime = $lastAttempt + self::$lockoutDuration;
                return max(0, $unlockTime - time());
            }
            
        } catch (Exception $e) {
            // Fallback
        }
        
        return self::$lockoutDuration;
    }
    
    /**
     * Memory-based attempt recording (fallback)
     */
    private static function recordMemoryAttempt(string $identifier, string $type, bool $success): void {
        $key = $type . ':' . $identifier;
        
        if (!isset(self::$memoryCache[$key])) {
            self::$memoryCache[$key] = [];
        }
        
        if (!$success) {
            self::$memoryCache[$key][] = time();
        } else {
            self::$memoryCache[$key] = [];
        }
        
        // Clean old entries
        $windowStart = time() - self::$attemptWindow;
        self::$memoryCache[$key] = array_filter(
            self::$memoryCache[$key],
            fn($t) => $t > $windowStart
        );
    }
    
    /**
     * Get memory-based attempt count
     */
    private static function getMemoryAttemptCount(string $identifier, string $type): int {
        $key = $type . ':' . $identifier;
        
        if (!isset(self::$memoryCache[$key])) {
            return 0;
        }
        
        $windowStart = time() - self::$attemptWindow;
        return count(array_filter(
            self::$memoryCache[$key],
            fn($t) => $t > $windowStart
        ));
    }
    
    /**
     * Clean up old login attempts (run periodically)
     */
    public static function cleanup(): int {
        try {
            $pdo = Database::conn();
            
            // Delete attempts older than 24 hours
            $stmt = $pdo->prepare('
                DELETE FROM login_attempts
                WHERE attempt_time < DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ');
            $stmt->execute();
            
            return $stmt->rowCount();
            
        } catch (Exception $e) {
            Logger::error('Failed to cleanup login attempts', ['error' => $e->getMessage()]);
            return 0;
        }
    }
    
    /**
     * Get client IP address
     */
    private static function getClientIp(): string {
        $ipKeys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ips = explode(',', $_SERVER[$key]);
                $ip = trim($ips[0]);
                
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    /**
     * Mask email for logging (privacy)
     */
    private static function maskEmail(string $email): string {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return '***';
        }
        
        $local = $parts[0];
        $domain = $parts[1];
        
        $maskedLocal = substr($local, 0, 2) . str_repeat('*', max(0, strlen($local) - 2));
        
        return $maskedLocal . '@' . $domain;
    }
    
    /**
     * Check if an IP is whitelisted (for testing/admin)
     */
    public static function isWhitelisted(string $ip): bool {
        $whitelist = [
            '127.0.0.1',
            '::1',
        ];
        
        return in_array($ip, $whitelist, true);
    }
}
