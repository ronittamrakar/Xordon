<?php
/**
 * Database Query Optimizer
 * Analyzes and optimizes slow queries
 */

namespace Xordon;

class DatabaseOptimizer {
    private static $slowQueryLog = [];
    private static $threshold = 1000; // 1 second in ms
    
    /**
     * Log a query execution time
     */
    public static function logQuery(string $sql, float $executionTime, array $params = []): void {
        $timeMs = $executionTime * 1000;
        
        if ($timeMs > self::$threshold) {
            self::$slowQueryLog[] = [
                'sql' => $sql,
                'time_ms' => round($timeMs, 2),
                'params' => $params,
                'timestamp' => date('Y-m-d H:i:s'),
                'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5)
            ];
            
            // Log to file in development
            if (Config::get('APP_ENV') === 'development') {
                error_log(sprintf(
                    "[SLOW QUERY] %.2fms - %s - Params: %s",
                    $timeMs,
                    $sql,
                    json_encode($params)
                ));
            }
        }
    }
    
    /**
     * Get slow queries
     */
    public static function getSlowQueries(): array {
        return self::$slowQueryLog;
    }
    
    /**
     * Suggest indexes for a table
     */
    public static function suggestIndexes(string $table): array {
        $pdo = Database::conn();
        $suggestions = [];
        
        try {
            // Get table columns
            $stmt = $pdo->query("SHOW COLUMNS FROM `$table`");
            $columns = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            // Get existing indexes
            $stmt = $pdo->query("SHOW INDEX FROM `$table`");
            $indexes = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            $indexedColumns = array_column($indexes, 'Column_name');
            
            // Suggest indexes for foreign key columns
            foreach ($columns as $column) {
                $columnName = $column['Field'];
                
                // Skip if already indexed
                if (in_array($columnName, $indexedColumns)) {
                    continue;
                }
                
                // Suggest index for ID-like columns
                if (preg_match('/_(id|key)$/', $columnName)) {
                    $suggestions[] = [
                        'column' => $columnName,
                        'reason' => 'Foreign key or lookup column',
                        'sql' => "ALTER TABLE `$table` ADD INDEX `idx_$columnName` (`$columnName`);"
                    ];
                }
                
                // Suggest index for timestamp columns used in WHERE clauses
                if (in_array($column['Type'], ['timestamp', 'datetime', 'date']) && 
                    in_array($columnName, ['created_at', 'updated_at', 'deleted_at', 'scheduled_at'])) {
                    $suggestions[] = [
                        'column' => $columnName,
                        'reason' => 'Timestamp column often used in filters',
                        'sql' => "ALTER TABLE `$table` ADD INDEX `idx_$columnName` (`$columnName`);"
                    ];
                }
            }
        } catch (\Exception $e) {
            error_log("Error suggesting indexes: " . $e->getMessage());
        }
        
        return $suggestions;
    }
    
    /**
     * Analyze table statistics
     */
    public static function analyzeTable(string $table): array {
        $pdo = Database::conn();
        $stats = [];
        
        try {
            // Get table status
            $stmt = $pdo->query("SHOW TABLE STATUS LIKE '$table'");
            $status = $stmt->fetch(\PDO::FETCH_ASSOC);
            
            if ($status) {
                $stats = [
                    'rows' => $status['Rows'],
                    'avg_row_length' => $status['Avg_row_length'],
                    'data_length' => $status['Data_length'],
                    'index_length' => $status['Index_length'],
                    'data_free' => $status['Data_free'],
                    'engine' => $status['Engine']
                ];
            }
        } catch (\Exception $e) {
            error_log("Error analyzing table: " . $e->getMessage());
        }
        
        return $stats;
    }
    
    /**
     * Check for missing indexes on foreign keys
     */
    public static function checkMissingIndexes(): array {
        $pdo = Database::conn();
        $missing = [];
        
        try {
            $dbName = Config::get('DB_NAME', 'xordon');
            
            // Query to find foreign keys without indexes
            $sql = "
                SELECT 
                    TABLE_NAME,
                    COLUMN_NAME,
                    CONSTRAINT_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = ?
                AND REFERENCED_TABLE_NAME IS NOT NULL
                AND COLUMN_NAME NOT IN (
                    SELECT COLUMN_NAME 
                    FROM information_schema.STATISTICS 
                    WHERE TABLE_SCHEMA = ?
                    AND TABLE_NAME = KEY_COLUMN_USAGE.TABLE_NAME
                )
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$dbName, $dbName]);
            $missing = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            error_log("Error checking missing indexes: " . $e->getMessage());
        }
        
        return $missing;
    }
}
