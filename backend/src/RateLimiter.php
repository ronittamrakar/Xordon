<?php
/**
 * Rate Limiter Class
 * Implements token bucket algorithm for API rate limiting
 */

require_once __DIR__ . '/Database.php';

class RateLimiter {
    private static $redis = null;
    
    public static function checkRateLimit(string $identifier, int $requests = 100, int $window = 3600, string $scope = 'default'): array {
        $key = "rate_limit:$scope:$identifier";
        $now = time();
        
        // Try Redis first (production)
        if (self::$redis !== null || self::initRedis()) {
            $result = self::checkRedisRateLimit($key, $requests, $window, $now);
        } else {
            // Fallback to file-based store (standard PHP env without Redis)
            $result = self::checkFileRateLimit($key, $requests, $window, $now);
        }
        
        // Add rate limit headers
        if (!headers_sent()) {
            header("X-RateLimit-Limit: $requests");
            header("X-RateLimit-Remaining: " . $result['remaining']);
            header("X-RateLimit-Reset: " . $result['reset_time']);
        }
        
        return $result;
    }

    private static function logEvent(string $type, string $severity, string $ip, array $metadata = []): void {
        try {
            $pdo = \Xordon\Database::conn();
            $stmt = $pdo->prepare("INSERT INTO security_events (type, severity, ip_address, metadata) VALUES (?, ?, ?, ?)");
            $stmt->execute([$type, $severity, $ip, json_encode($metadata)]);
        } catch (Exception $e) {
            // Silently fail to not break the request flow
            error_log("Failed to log security event: " . $e->getMessage());
        }
    }
    
    private static function initRedis(): bool {
        try {
            // Check if Redis extension is available
            if (!class_exists('Redis')) {
                // Determine if we should log based on ENV to avoid spamming logs in simple development
                // error_log("Redis extension not available, using file store");
                return false;
            }
            
            $redisHost = Config::get('REDIS_HOST', '127.0.0.1');
            $redisPort = Config::get('REDIS_PORT', 6379);
            
            self::$redis = new Redis();
            $connected = self::$redis->connect($redisHost, $redisPort, 2);
            
            if ($connected) {
                $redisPassword = Config::get('REDIS_PASSWORD');
                if ($redisPassword) {
                    self::$redis->auth($redisPassword);
                }
                return true;
            }
        } catch (Exception $e) {
            error_log("Redis connection failed: " . $e->getMessage());
        }
        
        return false;
    }
    
    private static function checkRedisRateLimit(string $key, int $requests, int $window, int $now): array {
        // Clean old entries
        self::$redis->zRemRangeByScore($key, 0, $now - $window);
        
        // Count current requests
        $current = self::$redis->zCard($key);
        
        if ($current >= $requests) {
            // Get oldest request to calculate reset time
            $oldest = self::$redis->zRange($key, 0, 0, ['withscores' => true]);
            $resetTime = $oldest ? $oldest[0][1] + $window : $now + $window;
            
            return [
                'allowed' => false,
                'remaining' => 0,
                'reset_time' => $resetTime,
                'total_requests' => $current
            ];
        }
        
        // Add current request
        self::$redis->zAdd($key, $now, uniqid());
        self::$redis->expire($key, $window);
        
        return [
            'allowed' => true,
            'remaining' => $requests - $current - 1,
            'reset_time' => $now + $window,
            'total_requests' => $current + 1
        ];
    }
    
    private static function checkFileRateLimit(string $key, int $requests, int $window, int $now): array {
        $tmpDir = sys_get_temp_dir();
        $safeKey = md5($key);
        $file = $tmpDir . '/rl_' . $safeKey . '.json';
        
        $data = [];
        if (file_exists($file)) {
            $content = @file_get_contents($file);
            if ($content) {
                $data = json_decode($content, true) ?: [];
            }
        }
        
        // Clean old entries
        $data = array_filter($data, function($timestamp) use ($now, $window) {
            return $timestamp > $now - $window;
        });
        
        $current = count($data);
        
        if ($current >= $requests) {
            // Find oldest timestamp
            $oldest = empty($data) ? $now : min($data);
            $resetTime = $oldest + $window;
            
            return [
                'allowed' => false,
                'remaining' => 0,
                'reset_time' => $resetTime,
                'total_requests' => $current
            ];
        }
        
        // Add current request
        $data[] = $now;
        
        // Save back to file (atomic write attempt)
        @file_put_contents($file, json_encode(array_values($data)), LOCK_EX);
        
        return [
            'allowed' => true,
            'remaining' => $requests - $current - 1,
            'reset_time' => $now + $window,
            'total_requests' => $current + 1
        ];
    }
    
    public static function getClientIdentifier(): string {
        // Use IP address for rate limiting
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        // Add user ID if authenticated (for per-user limits)
        $userId = Auth::userId();
        if ($userId) {
            return "user:$userId";
        }
        
        return "ip:$ip";
    }
    
    public static function applyRateLimitHeaders(array $rateLimitInfo): void {
        if (!headers_sent()) {
            header('X-RateLimit-Limit: ' . Config::get('RATE_LIMIT_REQUESTS', 100));
            header('X-RateLimit-Remaining: ' . $rateLimitInfo['remaining']);
            header('X-RateLimit-Reset: ' . $rateLimitInfo['reset_time']);
            
            if (!$rateLimitInfo['allowed']) {
                header('Retry-After: ' . ($rateLimitInfo['reset_time'] - time()));
            }
        }
    }
    
    public static function middleware(int $requests = null, int $window = null, string $scope = 'default'): callable {
        $requests = $requests ?? Config::get('RATE_LIMIT_REQUESTS', 100);
        $window = $window ?? Config::get('RATE_LIMIT_WINDOW', 3600);
        
        return function() use ($requests, $window, $scope) {
            // Dev bypass: skip rate limiting if enabled
            $devBypass = Config::get('RATE_LIMIT_DEV_BYPASS', 'false');
            if (strtolower($devBypass) === 'true' || $devBypass === '1') {
                if (!headers_sent()) {
                    header("X-RateLimit-Limit: $requests");
                    header("X-RateLimit-Remaining: $requests");
                    header("X-RateLimit-Reset: " . (time() + $window));
                    header('X-RateLimit-Dev-Bypass: true');
                }
                return;
            }
            
            $identifier = self::getClientIdentifier();
            
            // Extract IP for logging
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

            $rateLimitInfo = self::checkRateLimit($identifier, $requests, $window, $scope);
            
            self::applyRateLimitHeaders($rateLimitInfo);
            
            if (!$rateLimitInfo['allowed']) {
                // Log security event
                self::logEvent('rate_limit_exceeded', 'warning', $ip, [
                    'identifier' => $identifier,
                    'limit' => $requests,
                    'scope' => $scope,
                    'url' => $_SERVER['REQUEST_URI'] ?? 'unknown'
                ]);

                Response::tooManyRequests('Rate limit exceeded. Try again later.', [
                    'retry_after' => $rateLimitInfo['reset_time'] - time(),
                    'limit' => $requests,
                    'window' => $window,
                    'scope' => $scope
                ]);
            }
        };
    }
}
