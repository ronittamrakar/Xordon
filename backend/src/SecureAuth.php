<?php
require_once __DIR__ . '/Logger.php';
require_once __DIR__ . '/ErrorHandler.php';
require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/Database.php';

class SecureAuth {
    private static $tokenCache = [];
    private static $rateLimitCache = [];
    
    public static function userIdOrFail(): int {
        $userId = self::userId();
        if ($userId === null) {
            Logger::warning('Unauthorized access attempt', [
                'ip' => self::getClientIp(),
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
            ]);
            Response::unauthorized();
        }
        return $userId;
    }
    
    public static function userId(): ?int {
        try {
            // Rate limiting check
            if (!self::checkRateLimit()) {
                Logger::warning('Rate limit exceeded', [
                    'ip' => self::getClientIp()
                ]);
                Response::error('Too many requests', 429);
                return null;
            }
            
            $token = self::extractToken();
            if (!$token) {
                return null;
            }
            
            // Development mode bypass with proper security
            if (self::isDevelopmentMode()) {
                // Only allow specific development tokens
                $devTokens = [
                    '304d8effeab40cea4f89cfe0b871f8fef998569171681c5a' => 16, // Admin
                    'email-specialist-token' => 4, // Email Specialist
                ];
                
                if (isset($devTokens[$token])) {
                    return $devTokens[$token];
                }
                
                // If in development but token doesn't match, continue to normal validation
            }
            
            // Check cache first
            if (isset(self::$tokenCache[$token])) {
                $cached = self::$tokenCache[$token];
                if ($cached['expires'] > time()) {
                    return $cached['userId'];
                } else {
                    unset(self::$tokenCache[$token]);
                }
            }
            
            $pdo = Database::conn();
            
            // Use prepared statement to prevent SQL injection
            $stmt = $pdo->prepare("
                SELECT at.user_id, at.expires_at, u.status 
                FROM auth_tokens at 
                JOIN users u ON at.user_id = u.id 
                WHERE at.token = ? AND (at.expires_at IS NULL OR at.expires_at > NOW())
            ");
            $stmt->execute([$token]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$result) {
                Logger::warning('Invalid or expired token', [
                    'ip' => self::getClientIp(),
                    'token_hash' => hash('sha256', $token)
                ]);
                return null;
            }
            
            // Check if user is active
            if ($result['status'] !== 'active') {
                Logger::warning('Inactive user access attempt', [
                    'user_id' => $result['user_id'],
                    'status' => $result['status'],
                    'ip' => self::getClientIp()
                ]);
                return null;
            }
            
            $userId = (int)$result['user_id'];
            
            // Cache the result for 5 minutes
            self::$tokenCache[$token] = [
                'userId' => $userId,
                'expires' => time() + 300
            ];
            
            return $userId;
            
        } catch (Exception $e) {
            Logger::error('Authentication error', [
                'error' => $e->getMessage(),
                'ip' => self::getClientIp()
            ]);
            return null;
        }
    }
    
    private static function extractToken(): ?string {
        // Try Authorization header first (Bearer token)
        $auth = self::getHeader('Authorization');
        if ($auth && preg_match('/Bearer\s+(.+)/i', $auth, $matches)) {
            return trim($matches[1]);
        }
        
        // Fallback to X-Auth-Token header
        $xToken = self::getHeader('X-Auth-Token');
        if ($xToken) {
            return trim($xToken);
        }
        
        return null;
    }
    
    private static function getHeader(string $name): ?string {
        // Try getallheaders() if available (Apache)
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if ($headers && isset($headers[$name])) {
                return $headers[$name];
            }
            // Try lowercase version
            $nameLower = strtolower($name);
            if (isset($headers[$nameLower])) {
                return $headers[$nameLower];
            }
        }
        
        // Try $_SERVER superglobal
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (isset($_SERVER[$serverKey])) {
            return $_SERVER[$serverKey];
        }
        
        return null;
    }
    
    private static function getClientIp(): string {
        $ipKeys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ips = explode(',', $_SERVER[$key]);
                $ip = trim($ips[0]);
                
                // Validate IP address
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    private static function isDevelopmentMode(): bool {
        // Check multiple development indicators
        $envChecks = [
            getenv('APP_ENV') === 'development',
            $_ENV['APP_ENV'] === 'development' ?? false,
            isset($_SERVER['HTTP_HOST']) && (
                strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
                strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false ||
                strpos($_SERVER['HTTP_HOST'], '0.0.0.0') !== false
            )
        ];
        
        return in_array(true, $envChecks, true);
    }
    
    private static function checkRateLimit(): bool {
        $ip = self::getClientIp();
        $now = time();
        $window = 300; // 5 minutes
        $maxRequests = 100; // Max 100 requests per 5 minutes
        
        // Clean old entries
        foreach (self::$rateLimitCache as $key => $timestamps) {
            self::$rateLimitCache[$key] = array_filter($timestamps, function($timestamp) use ($now, $window) {
                return $timestamp > ($now - $window);
            });
            
            if (empty(self::$rateLimitCache[$key])) {
                unset(self::$rateLimitCache[$key]);
            }
        }
        
        // Check current IP
        if (!isset(self::$rateLimitCache[$ip])) {
            self::$rateLimitCache[$ip] = [];
        }
        
        // Remove old requests for this IP
        self::$rateLimitCache[$ip] = array_filter(self::$rateLimitCache[$ip], function($timestamp) use ($now, $window) {
            return $timestamp > ($now - $window);
        });
        
        // Check if under limit
        if (count(self::$rateLimitCache[$ip]) >= $maxRequests) {
            return false;
        }
        
        // Add current request
        self::$rateLimitCache[$ip][] = $now;
        
        return true;
    }
    
    public static function generateToken(int $userId, int $expiresInSeconds = 3600): string {
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + $expiresInSeconds);
        
        try {
            $pdo = Database::conn();
            
            // Delete any existing tokens for this user
            $stmt = $pdo->prepare("DELETE FROM auth_tokens WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // Insert new token
            $stmt = $pdo->prepare("
                INSERT INTO auth_tokens (user_id, token, created_at, expires_at) 
                VALUES (?, ?, NOW(), ?)
            ");
            $stmt->execute([$userId, $token, $expires]);
            
            // Cache the new token
            self::$tokenCache[$token] = [
                'userId' => $userId,
                'expires' => time() + $expiresInSeconds
            ];
            
            return $token;
            
        } catch (Exception $e) {
            Logger::error('Token generation failed', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            throw new Exception('Failed to generate authentication token');
        }
    }
    
    public static function revokeToken(string $token): bool {
        try {
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare("DELETE FROM auth_tokens WHERE token = ?");
            $result = $stmt->execute([$token]);
            
            // Remove from cache
            unset(self::$tokenCache[$token]);
            
            return $result;
            
        } catch (Exception $e) {
            Logger::error('Token revocation failed', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    public static function revokeAllUserTokens(int $userId): bool {
        try {
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare("DELETE FROM auth_tokens WHERE user_id = ?");
            $result = $stmt->execute([$userId]);
            
            // Remove user's tokens from cache
            foreach (self::$tokenCache as $token => $cached) {
                if ($cached['userId'] === $userId) {
                    unset(self::$tokenCache[$token]);
                }
            }
            
            return $result;
            
        } catch (Exception $e) {
            Logger::error('User token revocation failed', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    public static function validatePasswordStrength(string $password): array {
        $errors = [];
        
        if (strlen($password) < 8) {
            $errors[] = 'Password must be at least 8 characters long';
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter';
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter';
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain at least one number';
        }
        
        if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
            $errors[] = 'Password must contain at least one special character';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
    
    public static function hashPassword(string $password): string {
        return password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 3
        ]);
    }
    
    public static function verifyPassword(string $password, string $hash): bool {
        return password_verify($password, $hash);
    }
}
