<?php
/**
 * Query Optimizer
 * Provides database query optimization and performance monitoring
 * 
 * Features:
 * - Query analysis and optimization suggestions
 * - Index recommendations
 * - Slow query logging
 * - Query caching integration
 */

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/CacheManager.php';

class QueryOptimizer {
    private static $slowQueryThreshold = 1.0; // seconds
    private static $queryCache = [];
    
    /**
     * Execute optimized query with caching and monitoring
     */
    public static function execute(string $sql, array $params = [], int $cacheTtl = 300): array {
        $startTime = microtime(true);
        $queryHash = md5($sql . serialize($params));
        
        // Check cache first
        if ($cacheTtl > 0) {
            $cacheKey = "query:" . $queryHash;
            $cached = CacheManager::get($cacheKey);
            if ($cached !== null) {
                return $cached;
            }
        }
        
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $executionTime = microtime(true) - $startTime;
            
            // Log slow queries
            if ($executionTime > self::$slowQueryThreshold) {
                self::logSlowQuery($sql, $params, $executionTime);
            }
            
            // Cache result if caching enabled
            if ($cacheTtl > 0 && !empty($result)) {
                CacheManager::set($cacheKey, $result, $cacheTtl);
            }
            
            return $result;
            
        } catch (Exception $e) {
            error_log("Query execution failed: " . $e->getMessage() . " SQL: " . $sql);
            throw $e;
        }
    }
    
    /**
     * Get optimized query for common operations
     */
    public static function getPaginatedResults(string $baseSql, array $params, int $page = 1, int $limit = 20): array {
        $offset = ($page - 1) * $limit;
        
        // Add pagination to SQL
        $paginatedSql = $baseSql . " LIMIT ? OFFSET ?";
        $allParams = array_merge($params, [$limit, $offset]);
        
        // Get total count for pagination
        $countSql = "SELECT COUNT(*) as total FROM (" . $baseSql . ") as subquery";
        $countResult = self::execute($countSql, $params, 60);
        $total = (int)($countResult[0]['total'] ?? 0);
        
        // Get paginated results
        $results = self::execute($paginatedSql, $allParams, 300);
        
        return [
            'data' => $results,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit),
                'has_next' => $page < ceil($total / $limit),
                'has_prev' => $page > 1
            ]
        ];
    }
    
    /**
     * Optimize WHERE clauses for better performance
     */
    public static function optimizeWhereClause(array $conditions): string {
        $whereParts = [];
        
        foreach ($conditions as $column => $value) {
            if (is_array($value)) {
                // IN clause optimization
                if (!empty($value)) {
                    $placeholders = str_repeat('?,', count($value) - 1) . '?';
                    $whereParts[] = "$column IN ($placeholders)";
                }
            } elseif ($value !== null) {
                // Equality condition
                $whereParts[] = "$column = ?";
            } else {
                // NULL check
                $whereParts[] = "$column IS NULL";
            }
        }
        
        return implode(' AND ', $whereParts);
    }
    
    /**
     * Analyze query performance and suggest optimizations
     */
    public static function analyzeQuery(string $sql): array {
        $suggestions = [];
        
        // Check for missing LIMIT
        if (stripos($sql, 'SELECT') === 0 && stripos($sql, 'LIMIT') === false) {
            $suggestions[] = "Consider adding LIMIT clause to prevent scanning entire table";
        }
        
        // Check for SELECT *
        if (preg_match('/SELECT\s+\*/i', $sql)) {
            $suggestions[] = "Avoid SELECT * - specify only needed columns";
        }
        
        // Check for subqueries that could be JOINs
        if (preg_match('/SELECT.*FROM.*\(.*SELECT/i', $sql)) {
            $suggestions[] = "Consider converting subqueries to JOINs for better performance";
        }
        
        // Check for ORDER BY without LIMIT
        if (stripos($sql, 'ORDER BY') !== false && stripos($sql, 'LIMIT') === false) {
            $suggestions[] = "ORDER BY without LIMIT may cause performance issues on large datasets";
        }
        
        // Check for functions in WHERE clause
        if (preg_match('/WHERE\s+.*\w+\s*\(/i', $sql)) {
            $suggestions[] = "Functions in WHERE clause may prevent index usage - consider indexing computed columns";
        }
        
        return $suggestions;
    }
    
    /**
     * Get index recommendations for a table
     */
    public static function getIndexRecommendations(string $table): array {
        try {
            $pdo = Database::conn();
            
            // Get table statistics
            $stmt = $pdo->prepare("SHOW TABLE STATUS LIKE ?");
            $stmt->execute([$table]);
            $tableStatus = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get current indexes
            $stmt = $pdo->prepare("SHOW INDEX FROM `$table`");
            $stmt->execute();
            $indexes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $recommendations = [];
            
            // Analyze WHERE clauses from slow queries
            $slowQueries = self::getSlowQueriesForTable($table);
            foreach ($slowQueries as $query) {
                $whereColumns = self::extractWhereColumns($query['sql']);
                foreach ($whereColumns as $column) {
                    $hasIndex = false;
                    foreach ($indexes as $index) {
                        if ($index['Column_name'] === $column) {
                            $hasIndex = true;
                            break;
                        }
                    }
                    
                    if (!$hasIndex) {
                        $recommendations[] = [
                            'type' => 'single_column',
                            'column' => $column,
                            'sql' => "CREATE INDEX idx_{$table}_{$column} ON `{$table}`(`{$column}`)",
                            'reason' => "Column used in WHERE clause without index"
                        ];
                    }
                }
            }
            
            // Check for composite index opportunities
            $whereCombinations = self::findCommonWhereCombinations($slowQueries);
            foreach ($whereCombinations as $combination) {
                if (count($combination) > 1) {
                    $columns = implode('_', $combination);
                    $recommendations[] = [
                        'type' => 'composite',
                        'columns' => $combination,
                        'sql' => "CREATE INDEX idx_{$table}_{$columns} ON `{$table}`(`" . implode('`, `', $combination) . "`)",
                        'reason' => "Common combination of columns in WHERE clauses"
                    ];
                }
            }
            
            return $recommendations;
            
        } catch (Exception $e) {
            error_log("Index analysis failed: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Log slow queries for analysis
     */
    private static function logSlowQuery(string $sql, array $params, float $executionTime): void {
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'sql' => $sql,
            'params' => $params,
            'execution_time' => $executionTime,
            'hash' => md5($sql . serialize($params))
        ];
        
        // Store in database for analysis
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('
                INSERT INTO slow_query_log (query_hash, sql_text, execution_time, parameters, created_at)
                VALUES (?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE 
                    execution_count = execution_count + 1,
                    avg_execution_time = (avg_execution_time * execution_count + ?) / (execution_count + 1),
                    max_execution_time = GREATEST(max_execution_time, ?),
                    last_seen = NOW()
            ');
            $stmt->execute([
                $logEntry['hash'],
                $sql,
                $executionTime,
                json_encode($params),
                $executionTime,
                $executionTime
            ]);
        } catch (Exception $e) {
            error_log("Failed to log slow query: " . $e->getMessage());
        }
    }
    
    /**
     * Get slow queries for a specific table
     */
    private static function getSlowQueriesForTable(string $table): array {
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('
                SELECT sql_text, execution_count, avg_execution_time
                FROM slow_query_log 
                WHERE sql_text LIKE ?
                ORDER BY avg_execution_time DESC
                LIMIT 10
            ');
            $stmt->execute(["%FROM `$table`%"]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            return [];
        }
    }
    
    /**
     * Extract column names from WHERE clauses
     */
    private static function extractWhereColumns(string $sql): array {
        $columns = [];
        
        // Simple regex to extract column names from WHERE clause
        if (preg_match_all('/WHERE\s+(.+?)(?:GROUP|ORDER|LIMIT|$)/is', $sql, $matches)) {
            $whereClause = $matches[1][0];
            
            // Extract column names (basic pattern matching)
            if (preg_match_all('/([a-zA-Z_][a-zA-Z0-9_]*)\s*[=<>]/', $whereClause, $colMatches)) {
                $columns = array_unique($colMatches[1]);
            }
        }
        
        return $columns;
    }
    
    /**
     * Find common column combinations in WHERE clauses
     */
    private static function findCommonWhereCombinations(array $queries): array {
        $combinations = [];
        
        foreach ($queries as $query) {
            $columns = self::extractWhereColumns($query['sql']);
            if (count($columns) > 1) {
                sort($columns);
                $combination = implode('|', $columns);
                if (!isset($combinations[$combination])) {
                    $combinations[$combination] = [];
                }
                $combinations[$combination] = array_merge($combinations[$combination], $columns);
            }
        }
        
        // Return unique combinations
        return array_values(array_unique($combinations, SORT_REGULAR));
    }
    
    /**
     * Get database performance metrics
     */
    public static function getPerformanceMetrics(): array {
        try {
            $pdo = Database::conn();
            
            // Get table sizes
            $stmt = $pdo->query('
                SELECT 
                    table_name,
                    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
                    table_rows
                FROM information_schema.TABLES 
                WHERE table_schema = DATABASE()
                ORDER BY (data_length + index_length) DESC
                LIMIT 20
            ');
            $tableSizes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get slow query statistics
            $stmt = $pdo->query('
                SELECT 
                    COUNT(*) as total_slow_queries,
                    AVG(execution_time) as avg_execution_time,
                    MAX(execution_time) as max_execution_time
                FROM slow_query_log
                WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ');
            $slowQueryStats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get index usage statistics
            $stmt = $pdo->query('
                SELECT 
                    OBJECT_SCHEMA,
                    OBJECT_NAME,
                    INDEX_NAME,
                    COUNT_FETCH,
                    COUNT_INSERT,
                    COUNT_UPDATE,
                    COUNT_DELETE
                FROM performance_schema.table_io_waits_summary_by_index_usage
                WHERE OBJECT_SCHEMA = DATABASE()
                ORDER BY COUNT_FETCH DESC
                LIMIT 20
            ');
            $indexUsage = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return [
                'table_sizes' => $tableSizes,
                'slow_query_stats' => $slowQueryStats,
                'index_usage' => $indexUsage,
                'generated_at' => date('Y-m-d H:i:s')
            ];
            
        } catch (Exception $e) {
            error_log("Performance metrics collection failed: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Clean up old slow query logs
     */
    public static function cleanupSlowQueryLogs(int $daysToKeep = 30): int {
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('
                DELETE FROM slow_query_log 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            ');
            $stmt->execute([$daysToKeep]);
            
            return $stmt->rowCount();
            
        } catch (Exception $e) {
            error_log("Slow query log cleanup failed: " . $e->getMessage());
            return 0;
        }
    }
}
?>
