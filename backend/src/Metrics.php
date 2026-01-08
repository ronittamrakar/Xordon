<?php
/**
 * Application Metrics Collector
 * 
 * Collects performance metrics for monitoring dashboards
 * Compatible with New Relic, Datadog, and Prometheus
 */

namespace Xordon;

class Metrics {
    
    private static array $timings = [];
    private static array $counters = [];
    private static array $gauges = [];
    private static float $requestStartTime = 0;
    
    /**
     * Initialize metrics collection for this request
     */
    public static function init(): void {
        self::$requestStartTime = microtime(true);
        
        // Register shutdown function to record final metrics
        register_shutdown_function([self::class, 'recordRequestMetrics']);
    }
    
    /**
     * Start a timer for a specific operation
     */
    public static function startTimer(string $name): void {
        self::$timings[$name] = [
            'start' => microtime(true),
            'end' => null,
            'duration' => null,
        ];
    }
    
    /**
     * Stop a timer and record the duration
     */
    public static function stopTimer(string $name): ?float {
        if (!isset(self::$timings[$name])) {
            return null;
        }
        
        self::$timings[$name]['end'] = microtime(true);
        self::$timings[$name]['duration'] = self::$timings[$name]['end'] - self::$timings[$name]['start'];
        
        // Send to APM if available
        self::sendTimingToAPM($name, self::$timings[$name]['duration']);
        
        return self::$timings[$name]['duration'];
    }
    
    /**
     * Time a callback function
     */
    public static function time(string $name, callable $callback): mixed {
        self::startTimer($name);
        try {
            $result = $callback();
            return $result;
        } finally {
            self::stopTimer($name);
        }
    }
    
    /**
     * Increment a counter metric
     */
    public static function increment(string $name, int $value = 1): void {
        if (!isset(self::$counters[$name])) {
            self::$counters[$name] = 0;
        }
        self::$counters[$name] += $value;
    }
    
    /**
     * Set a gauge metric (current value, not cumulative)
     */
    public static function gauge(string $name, float $value): void {
        self::$gauges[$name] = $value;
    }
    
    /**
     * Record database query metrics
     */
    public static function recordQuery(string $query, float $duration, bool $success = true): void {
        self::increment('db.queries.total');
        self::increment($success ? 'db.queries.success' : 'db.queries.error');
        
        // Categorize query type
        $queryType = self::getQueryType($query);
        self::increment("db.queries.{$queryType}");
        
        // Record slow queries (>100ms)
        if ($duration > 0.100) {
            self::increment('db.queries.slow');
            
            // Log slow queries for analysis
            if (getenv('LOG_SLOW_QUERIES') === 'true') {
                $sanitizedQuery = self::sanitizeQuery($query);
                error_log("SLOW_QUERY ({$duration}s): {$sanitizedQuery}");
            }
        }
        
        // Track average query time
        self::$timings['db.query'][] = $duration;
    }
    
    /**
     * Record HTTP request metrics
     */
    public static function recordRequestMetrics(): void {
        $duration = microtime(true) - self::$requestStartTime;
        
        $metrics = [
            'request.duration_ms' => $duration * 1000,
            'request.method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown',
            'request.path' => self::sanitizePath($_SERVER['REQUEST_URI'] ?? '/'),
            'request.status_code' => http_response_code() ?: 200,
            'request.memory_peak_mb' => memory_get_peak_usage(true) / 1024 / 1024,
            'db.queries.count' => self::$counters['db.queries.total'] ?? 0,
        ];
        
        // Send to monitoring backend
        self::sendMetricsToBackend($metrics);
        
        // Log for local analysis
        if (getenv('LOG_REQUEST_METRICS') === 'true') {
            $logLine = json_encode($metrics);
            file_put_contents(
                __DIR__ . '/../logs/metrics.log',
                date('Y-m-d H:i:s') . " $logLine\n",
                FILE_APPEND | LOCK_EX
            );
        }
    }
    
    /**
     * Get all collected metrics
     */
    public static function getAll(): array {
        return [
            'timings' => self::$timings,
            'counters' => self::$counters,
            'gauges' => self::$gauges,
            'request_duration' => microtime(true) - self::$requestStartTime,
            'memory_usage' => memory_get_usage(true),
            'peak_memory' => memory_get_peak_usage(true),
        ];
    }
    
    /**
     * Send timing to APM (New Relic, Datadog, etc.)
     */
    private static function sendTimingToAPM(string $name, float $duration): void {
        // New Relic
        if (function_exists('newrelic_custom_metric')) {
            newrelic_custom_metric("Custom/{$name}", $duration * 1000);
        }
        
        // Datadog (using StatsD)
        self::sendToStatsD("xordon.timing.{$name}", $duration * 1000, 'ms');
    }
    
    /**
     * Send metrics to monitoring backend
     */
    private static function sendMetricsToBackend(array $metrics): void {
        // New Relic
        if (function_exists('newrelic_add_custom_parameter')) {
            foreach ($metrics as $key => $value) {
                newrelic_add_custom_parameter($key, $value);
            }
        }
        
        // Datadog StatsD
        foreach ($metrics as $key => $value) {
            $type = is_int($value) || is_float($value) ? 'g' : 's';
            self::sendToStatsD("xordon.{$key}", $value, $type);
        }
    }
    
    /**
     * Send metric to StatsD (Datadog, Graphite, etc.)
     */
    private static function sendToStatsD(string $name, $value, string $type = 'g'): void {
        $host = getenv('STATSD_HOST') ?: null;
        $port = (int)(getenv('STATSD_PORT') ?: 8125);
        
        if (!$host) {
            return;
        }
        
        try {
            $message = "{$name}:{$value}|{$type}";
            $socket = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP);
            if ($socket) {
                socket_sendto($socket, $message, strlen($message), 0, $host, $port);
                socket_close($socket);
            }
        } catch (\Exception $e) {
            // Silently fail - metrics should never break the app
        }
    }
    
    /**
     * Determine query type from SQL
     */
    private static function getQueryType(string $query): string {
        $query = strtoupper(trim($query));
        
        if (strpos($query, 'SELECT') === 0) return 'select';
        if (strpos($query, 'INSERT') === 0) return 'insert';
        if (strpos($query, 'UPDATE') === 0) return 'update';
        if (strpos($query, 'DELETE') === 0) return 'delete';
        if (strpos($query, 'CREATE') === 0) return 'ddl';
        if (strpos($query, 'ALTER') === 0) return 'ddl';
        if (strpos($query, 'DROP') === 0) return 'ddl';
        
        return 'other';
    }
    
    /**
     * Sanitize query for logging (remove sensitive data)
     */
    private static function sanitizeQuery(string $query): string {
        // Truncate long queries
        $query = substr($query, 0, 500);
        
        // Remove potential password/secret values
        $query = preg_replace("/'[^']{20,}'/", "'[REDACTED]'", $query);
        
        return $query;
    }
    
    /**
     * Sanitize path for metrics (remove IDs)
     */
    private static function sanitizePath(string $path): string {
        // Remove query string
        $path = explode('?', $path)[0];
        
        // Replace numeric IDs with placeholder
        $path = preg_replace('/\/\d+/', '/:id', $path);
        
        // Replace UUIDs with placeholder
        $path = preg_replace('/\/[a-f0-9-]{36}/', '/:uuid', $path);
        
        return $path;
    }
}
