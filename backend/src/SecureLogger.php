<?php

class SecureLogger {
    private static $logLevels = [
        'DEBUG' => 0,
        'INFO' => 1,
        'WARNING' => 2,
        'ERROR' => 3,
        'CRITICAL' => 4
    ];
    
    private static $currentLevel = 'INFO';
    private static $logFile = null;
    private static $maxFileSize = 10485760; // 10MB
    private static $maxFiles = 5;
    
    public static function configure(array $config): void {
        self::$currentLevel = $config['level'] ?? 'INFO';
        self::$logFile = $config['file'] ?? null;
        self::$maxFileSize = $config['max_file_size'] ?? 10485760;
        self::$maxFiles = $config['max_files'] ?? 5;
    }
    
    public static function debug(string $message, array $context = []): void {
        self::log('DEBUG', $message, $context);
    }
    
    public static function info(string $message, array $context = []): void {
        self::log('INFO', $message, $context);
    }
    
    public static function warning(string $message, array $context = []): void {
        self::log('WARNING', $message, $context);
    }
    
    public static function error(string $message, array $context = []): void {
        self::log('ERROR', $message, $context);
    }
    
    public static function critical(string $message, array $context = []): void {
        self::log('CRITICAL', $message, $context);
    }
    
    public static function security(string $message, array $context = []): void {
        self::log('CRITICAL', "[SECURITY] " . $message, $context);
    }
    
    private static function log(string $level, string $message, array $context = []): void {
        if (self::$logLevels[$level] < self::$logLevels[self::$currentLevel]) {
            return;
        }
        
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' ' . json_encode(self::sanitizeContext($context)) : '';
        $logEntry = "[{$timestamp}] {$level}: {$message}{$contextStr}" . PHP_EOL;
        
        // Write to file if configured
        if (self::$logFile) {
            self::writeToFile($logEntry);
        }
        
        // Write to error_log for critical errors
        if (in_array($level, ['ERROR', 'CRITICAL'])) {
            error_log(self::sanitizeForErrorLog($message));
        }
        
        // Send to external monitoring for critical issues
        if ($level === 'CRITICAL' && function_exists('mail') && isset($_ENV['ADMIN_EMAIL'])) {
            $subject = 'Critical Error: ' . $_ENV['APP_NAME'] ?? 'Application';
            $body = "Time: {$timestamp}\nLevel: {$level}\nMessage: {$message}\nContext: " . json_encode($context, JSON_PRETTY_PRINT);
            mail($_ENV['ADMIN_EMAIL'], $subject, $body);
        }
    }
    
    private static function sanitizeContext(array $context): array {
        $sensitiveKeys = ['password', 'token', 'secret', 'key', 'credit_card', 'ssn', 'api_key'];
        
        return array_map(function($value) use ($sensitiveKeys) {
            if (is_array($value)) {
                return self::sanitizeContext($value);
            }
            
            if (is_string($value)) {
                foreach ($sensitiveKeys as $key) {
                    if (stripos($value, $key) !== false) {
                        return '[REDACTED]';
                    }
                }
            }
            
            return $value;
        }, $context);
    }
    
    private static function sanitizeForErrorLog(string $message): string {
        // Remove potentially sensitive information
        return preg_replace('/(password|token|secret|key|credit_card|ssn|api_key)[=:]\s*[^\s]+/i', '$1=[REDACTED]', $message);
    }
    
    private static function writeToFile(string $logEntry): void {
        if (!self::$logFile) {
            return;
        }
        
        // Check if file rotation is needed
        if (file_exists(self::$logFile) && filesize(self::$logFile) > self::$maxFileSize) {
            self::rotateLogFiles();
        }
        
        // Write log entry
        file_put_contents(self::$logFile, $logEntry, FILE_APPEND | LOCK_EX);
        
        // Set appropriate permissions
        if (!file_exists(self::$logFile)) {
            chmod(self::$logFile, 0640);
        }
    }
    
    private static function rotateLogFiles(): void {
        if (!self::$logFile) {
            return;
        }
        
        $pathInfo = pathinfo(self::$logFile);
        $baseName = $pathInfo['filename'];
        $extension = $pathInfo['extension'] ?? '';
        $directory = $pathInfo['dirname'];
        
        // Rotate existing files
        for ($i = self::$maxFiles - 1; $i > 0; $i--) {
            $oldFile = $directory . '/' . $baseName . '.' . $i . '.' . $extension;
            $newFile = $directory . '/' . $baseName . '.' . ($i + 1) . '.' . $extension;
            
            if (file_exists($oldFile)) {
                if ($i === self::$maxFiles - 1) {
                    unlink($oldFile); // Delete oldest file
                } else {
                    rename($oldFile, $newFile);
                }
            }
        }
        
        // Move current file to .1
        if (file_exists(self::$logFile)) {
            $rotatedFile = $directory . '/' . $baseName . '.1.' . $extension;
            rename(self::$logFile, $rotatedFile);
        }
    }
    
    public static function audit(string $action, string $resourceType, $resourceId = null, array $oldValues = null, array $newValues = null): void {
        $userId = Auth::userId() ?? null;
        
        $auditData = [
            'user_id' => $userId,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => self::getClientIp(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        
        try {
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare("
                INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $auditData['user_id'],
                $auditData['action'],
                $auditData['resource_type'],
                $auditData['resource_id'],
                json_encode($auditData['old_values']),
                json_encode($auditData['new_values']),
                $auditData['ip_address'],
                $auditData['user_agent']
            ]);
            
        } catch (Exception $e) {
            self::error('Failed to write audit log', [
                'error' => $e->getMessage(),
                'audit_data' => $auditData
            ]);
        }
        
        // Also log to regular log
        self::info("AUDIT: {$action} on {$resourceType}" . ($resourceId ? " (ID: {$resourceId})" : ""), [
            'user_id' => $userId,
            'ip' => $auditData['ip_address']
        ]);
    }
    
    private static function getClientIp(): string {
        $ipKeys = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ips = explode(',', $_SERVER[$key]);
                $ip = trim($ips[0]);
                
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    public static function getRecentLogs(int $limit = 100, string $level = null): array {
        if (!self::$logFile || !file_exists(self::$logFile)) {
            return [];
        }
        
        $logs = [];
        $lines = file(self::$logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        // Get last N lines
        $recentLines = array_slice($lines, -$limit);
        
        foreach ($recentLines as $line) {
            if (preg_match('/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+): (.+)$/', $line, $matches)) {
                if ($level === null || $matches[2] === $level) {
                    $logs[] = [
                        'timestamp' => $matches[1],
                        'level' => $matches[2],
                        'message' => $matches[3]
                    ];
                }
            }
        }
        
        return array_reverse($logs);
    }
    
    public static function getAuditLogs(array $filters = [], int $limit = 100): array {
        try {
            $pdo = Database::conn();
            
            $whereConditions = [];
            $params = [];
            
            if (!empty($filters['user_id'])) {
                $whereConditions[] = 'user_id = ?';
                $params[] = $filters['user_id'];
            }
            
            if (!empty($filters['action'])) {
                $whereConditions[] = 'action = ?';
                $params[] = $filters['action'];
            }
            
            if (!empty($filters['resource_type'])) {
                $whereConditions[] = 'resource_type = ?';
                $params[] = $filters['resource_type'];
            }
            
            if (!empty($filters['date_from'])) {
                $whereConditions[] = 'created_at >= ?';
                $params[] = $filters['date_from'];
            }
            
            if (!empty($filters['date_to'])) {
                $whereConditions[] = 'created_at <= ?';
                $params[] = $filters['date_to'];
            }
            
            $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
            
            $stmt = $pdo->prepare("
                SELECT * FROM audit_logs 
                {$whereClause} 
                ORDER BY created_at DESC 
                LIMIT ?
            ");
            $params[] = $limit;
            $stmt->execute($params);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            self::error('Failed to retrieve audit logs', [
                'error' => $e->getMessage(),
                'filters' => $filters
            ]);
            return [];
        }
    }
    
    public static function cleanupOldLogs(int $daysToKeep = 30): void {
        try {
            $pdo = Database::conn();
            
            // Clean up old audit logs
            $stmt = $pdo->prepare("
                DELETE FROM audit_logs 
                WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            ");
            $stmt->execute([$daysToKeep]);
            
            self::info('Cleaned up old audit logs', [
                'deleted_count' => $stmt->rowCount(),
                'days_kept' => $daysToKeep
            ]);
            
        } catch (Exception $e) {
            self::error('Failed to cleanup old logs', [
                'error' => $e->getMessage(),
                'days_to_keep' => $daysToKeep
            ]);
        }
    }
}
