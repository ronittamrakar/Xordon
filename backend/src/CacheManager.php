<?php
/**
 * Cache Manager
 * Implements Redis-based caching for improved performance
 * 
 * Features:
 * - Automatic cache invalidation
 * - Cache warming for frequently accessed data
 * - Memory fallback when Redis unavailable
 * - Cache statistics and monitoring
 */

require_once __DIR__ . '/Database.php';

class CacheManager {
    private static $redis = null;
    private static $memoryStore = [];
    private static $stats = [
        'hits' => 0,
        'misses' => 0,
        'sets' => 0,
        'deletes' => 0
    ];
    
    /**
     * Initialize Redis connection
     */
    private static function initRedis(): bool {
        if (self::$redis !== null) {
            return true;
        }
        
        try {
            if (!class_exists('Redis')) {
                error_log("Redis extension not available, using memory cache");
                return false;
            }
            
            $redisHost = Config::get('REDIS_HOST', '127.0.0.1');
            $redisPort = Config::get('REDIS_PORT', 6379);
            $redisPassword = Config::get('REDIS_PASSWORD');
            
            self::$redis = new Redis();
            $connected = self::$redis->connect($redisHost, $redisPort, 2);
            
            if ($connected && $redisPassword) {
                self::$redis->auth($redisPassword);
            }
            
            return $connected;
        } catch (Exception $e) {
            error_log("Redis connection failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get cached data
     */
    public static function get(string $key, callable $callback = null, int $ttl = 3600): ?array {
        $cacheKey = self::normalizeKey($key);
        
        // Try Redis first
        if (self::initRedis()) {
            $data = self::$redis->get($cacheKey);
            if ($data !== false) {
                self::$stats['hits']++;
                return json_decode($data, true);
            }
        } else {
            // Fallback to memory cache
            if (isset(self::$memoryStore[$cacheKey])) {
                $item = self::$memoryStore[$cacheKey];
                if ($item['expires'] > time()) {
                    self::$stats['hits']++;
                    return $item['data'];
                } else {
                    unset(self::$memoryStore[$cacheKey]);
                }
            }
        }
        
        self::$stats['misses']++;
        
        // Generate data if callback provided
        if ($callback) {
            $data = $callback();
            if ($data !== null) {
                self::set($key, $data, $ttl);
                return $data;
            }
        }
        
        return null;
    }
    
    /**
     * Set cached data
     */
    public static function set(string $key, $data, int $ttl = 3600): bool {
        $cacheKey = self::normalizeKey($key);
        $serialized = json_encode($data);
        
        if ($serialized === false) {
            return false;
        }
        
        // Try Redis first
        if (self::initRedis()) {
            $result = self::$redis->setex($cacheKey, $ttl, $serialized);
            if ($result) {
                self::$stats['sets']++;
                return true;
            }
        }
        
        // Fallback to memory cache
        self::$memoryStore[$cacheKey] = [
            'data' => $data,
            'expires' => time() + $ttl
        ];
        self::$stats['sets']++;
        
        return true;
    }
    
    /**
     * Delete cached data
     */
    public static function delete(string $key): bool {
        $cacheKey = self::normalizeKey($key);
        
        if (self::initRedis()) {
            $result = self::$redis->del($cacheKey);
            self::$stats['deletes']++;
            return $result > 0;
        }
        
        // Memory cache
        if (isset(self::$memoryStore[$cacheKey])) {
            unset(self::$memoryStore[$cacheKey]);
            self::$stats['deletes']++;
            return true;
        }
        
        return false;
    }
    
    /**
     * Delete multiple keys by pattern
     */
    public static function deletePattern(string $pattern): int {
        $count = 0;
        
        if (self::initRedis()) {
            $keys = self::$redis->keys($pattern);
            if (!empty($keys)) {
                $count = self::$redis->del($keys);
            }
        } else {
            // Memory cache pattern matching
            foreach (self::$memoryStore as $key => $item) {
                if (fnmatch($pattern, $key)) {
                    unset(self::$memoryStore[$key]);
                    $count++;
                }
            }
        }
        
        self::$stats['deletes'] += $count;
        return $count;
    }
    
    /**
     * Clear all cache
     */
    public static function clear(): bool {
        if (self::initRedis()) {
            self::$redis->flushAll();
        }
        
        self::$memoryStore = [];
        return true;
    }
    
    /**
     * Get cache statistics
     */
    public static function getStats(): array {
        $hitRate = 0;
        $total = self::$stats['hits'] + self::$stats['misses'];
        if ($total > 0) {
            $hitRate = round((self::$stats['hits'] / $total) * 100, 2);
        }
        
        return array_merge(self::$stats, [
            'hit_rate' => $hitRate,
            'total_requests' => $total,
            'memory_items' => count(self::$memoryStore)
        ]);
    }
    
    /**
     * Warm cache for frequently accessed data
     */
    public static function warmCache(): void {
        try {
            $pdo = Database::conn();
            
            // Warm user settings cache
            $stmt = $pdo->query("SELECT user_id, data FROM settings");
            while ($row = $stmt->fetch()) {
                self::set("user_settings:{$row['user_id']}", json_decode($row['data'], true), 1800);
            }
            
            // Warm workspace cache
            $stmt = $pdo->query("SELECT id, name, slug FROM workspaces LIMIT 100");
            while ($row = $stmt->fetch()) {
                self::set("workspace:{$row['id']}", $row, 3600);
                self::set("workspace:slug:{$row['slug']}", $row, 3600);
            }
            
            // Warm company cache
            $stmt = $pdo->query("SELECT id, name, workspace_id FROM companies LIMIT 200");
            while ($row = $stmt->fetch()) {
                self::set("company:{$row['id']}", $row, 1800);
                self::set("companies:workspace:{$row['workspace_id']}", [], 1800);
            }
            
        } catch (Exception $e) {
            error_log("Cache warming failed: " . $e->getMessage());
        }
    }
    
    /**
     * Normalize cache key for consistency
     */
    private static function normalizeKey(string $key): string {
        // Remove special characters and ensure consistent format
        return preg_replace('/[^a-zA-Z0-9:_-]/', '_', $key);
    }
    
    /**
     * Cache wrapper for database queries
     */
    public static function query(string $key, callable $queryCallback, int $ttl = 3600): array {
        return self::get($key, function() use ($queryCallback) {
            return $queryCallback();
        }, $ttl) ?? [];
    }
    
    /**
     * Invalidate related cache when data changes
     */
    public static function invalidateRelated(string $type, int $id): void {
        $patterns = [
            "{$type}:{$id}",
            "{$type}s:*",
            "list:{$type}:*",
            "stats:{$type}:*"
        ];
        
        foreach ($patterns as $pattern) {
            self::deletePattern($pattern);
        }
    }
    
    /**
     * Health check for cache system
     */
    public static function healthCheck(): array {
        $health = [
            'redis_available' => self::initRedis(),
            'memory_items' => count(self::$memoryStore),
            'stats' => self::getStats()
        ];
        
        if ($health['redis_available']) {
            try {
                $health['redis_ping'] = self::$redis->ping();
            } catch (Exception $e) {
                $health['redis_error'] = $e->getMessage();
            }
        }
        
        return $health;
    }
}
?>
