<?php

class CacheService {
    private static $cache = [];
    private static $ttl = [];
    
    /**
     * Simple in-memory cache with TTL support
     * For production, consider using Redis or Memcached
     */
    
    public static function get(string $key) {
        if (!isset(self::$cache[$key])) {
            return null;
        }
        
        // Check if cache has expired
        if (isset(self::$ttl[$key]) && time() > self::$ttl[$key]) {
            self::forget($key);
            return null;
        }
        
        return self::$cache[$key];
    }
    
    public static function put(string $key, $value, int $seconds = 300): void {
        self::$cache[$key] = $value;
        self::$ttl[$key] = time() + $seconds;
    }
    
    public static function forget(string $key): void {
        unset(self::$cache[$key]);
        unset(self::$ttl[$key]);
    }
    
    public static function flush(): void {
        self::$cache = [];
        self::$ttl = [];
    }
    
    public static function remember(string $key, callable $callback, int $seconds = 300) {
        $value = self::get($key);
        
        if ($value !== null) {
            return $value;
        }
        
        $value = $callback();
        self::put($key, $value, $seconds);
        
        return $value;
    }
    
    /**
     * Generate cache key based on user and parameters
     */
    public static function generateKey(string $prefix, int $userId, array $params = []): string {
        $paramString = !empty($params) ? md5(serialize($params)) : '';
        return "{$prefix}:user:{$userId}" . ($paramString ? ":{$paramString}" : '');
    }
    
    /**
     * Clear cache for specific user
     */
    public static function clearUserCache(int $userId): void {
        $prefix = "user:{$userId}";
        foreach (array_keys(self::$cache) as $key) {
            if (strpos($key, $prefix) !== false) {
                self::forget($key);
            }
        }
    }
    
    /**
     * Get cache statistics
     */
    public static function getStats(): array {
        return [
            'size' => count(self::$cache),
            'keys' => array_keys(self::$cache)
        ];
    }
}
