<?php

class ConcurrencyManager {
    private static $locks = [];
    private static $lockTimeout = 30; // 30 seconds default timeout
    
    /**
     * Acquire a distributed lock for a resource
     */
    public static function acquireLock(string $resourceKey, int $timeout = 30): bool {
        $lockKey = "lock:{$resourceKey}";
        $lockValue = uniqid() . '_' . time();
        $expiry = time() + $timeout;
        
        try {
            $pdo = Database::conn();
            
            // Try to acquire lock using INSERT IGNORE
            $stmt = $pdo->prepare("
                INSERT INTO distributed_locks (lock_key, lock_value, expires_at, created_at) 
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE lock_key = IF(expires_at < NOW(), VALUES(lock_key), lock_key)
            ");
            $stmt->execute([$lockKey, $lockValue, date('Y-m-d H:i:s', $expiry)]);
            
            // Check if we got the lock
            $stmt = $pdo->prepare("
                SELECT lock_value FROM distributed_locks 
                WHERE lock_key = ? AND lock_value = ? AND expires_at > NOW()
            ");
            $stmt->execute([$lockKey, $lockValue]);
            $result = $stmt->fetch();
            
            if ($result) {
                self::$locks[$resourceKey] = $lockValue;
                return true;
            }
            
            return false;
            
        } catch (Exception $e) {
            Logger::error('Failed to acquire lock', [
                'resource' => $resourceKey,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    /**
     * Release a distributed lock
     */
    public static function releaseLock(string $resourceKey): bool {
        if (!isset(self::$locks[$resourceKey])) {
            return false;
        }
        
        $lockKey = "lock:{$resourceKey}";
        $lockValue = self::$locks[$resourceKey];
        
        try {
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare("
                DELETE FROM distributed_locks 
                WHERE lock_key = ? AND lock_value = ?
            ");
            $result = $stmt->execute([$lockKey, $lockValue]);
            
            if ($result) {
                unset(self::$locks[$resourceKey]);
                return true;
            }
            
            return false;
            
        } catch (Exception $e) {
            Logger::error('Failed to release lock', [
                'resource' => $resourceKey,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    /**
     * Execute a callback with automatic lock management
     */
    public static function withLock(string $resourceKey, callable $callback, int $timeout = 30) {
        if (!self::acquireLock($resourceKey, $timeout)) {
            throw new Exception("Could not acquire lock for resource: {$resourceKey}");
        }
        
        try {
            return $callback();
        } finally {
            self::releaseLock($resourceKey);
        }
    }
    
    /**
     * Clean up expired locks
     */
    public static function cleanupExpiredLocks(): int {
        try {
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare("
                DELETE FROM distributed_locks 
                WHERE expires_at <= NOW()
            ");
            $stmt->execute();
            
            return $stmt->rowCount();
            
        } catch (Exception $e) {
            Logger::error('Failed to cleanup expired locks', [
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }
    
    /**
     * Atomic counter increment
     */
    public static function atomicIncrement(string $counterKey, int $increment = 1): int {
        return self::withLock("counter:{$counterKey}", function() use ($counterKey, $increment) {
            try {
                $pdo = Database::conn();
                
                // Initialize counter if it doesn't exist
                $stmt = $pdo->prepare("
                    INSERT INTO atomic_counters (counter_key, value, updated_at) 
                    VALUES (?, 1, NOW())
                    ON DUPLICATE KEY UPDATE value = value + ?, updated_at = NOW()
                ");
                $stmt->execute([$counterKey, $increment]);
                
                // Get the new value
                $stmt = $pdo->prepare("
                    SELECT value FROM atomic_counters 
                    WHERE counter_key = ?
                ");
                $stmt->execute([$counterKey]);
                $result = $stmt->fetch();
                
                return (int)$result['value'];
                
            } catch (Exception $e) {
                Logger::error('Failed atomic increment', [
                    'counter' => $counterKey,
                    'error' => $e->getMessage()
                ]);
                throw $e;
            }
        });
    }
    
    /**
     * Prevent double submission of forms/requests
     */
    public static function preventDoubleSubmit(string $submitKey, int $timeout = 300): bool {
        $lockKey = "submit:{$submitKey}";
        
        if (self::acquireLock($lockKey, $timeout)) {
            // Auto-release after timeout to prevent permanent locks
            register_shutdown_function(function() use ($lockKey) {
                self::releaseLock($lockKey);
            });
            return true;
        }
        
        return false;
    }
    
    /**
     * Queue task for background processing
     */
    public static function queueTask(string $taskType, array $taskData, int $priority = 0): bool {
        try {
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare("
                INSERT INTO task_queue (task_type, task_data, priority, status, created_at) 
                VALUES (?, ?, ?, 'pending', NOW())
            ");
            
            return $stmt->execute([
                $taskType,
                json_encode($taskData),
                $priority
            ]);
            
        } catch (Exception $e) {
            Logger::error('Failed to queue task', [
                'task_type' => $taskType,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    /**
     * Process queued tasks
     */
    public static function processTasks(int $limit = 10): array {
        $processed = [];
        
        try {
            $pdo = Database::conn();
            
            // Get pending tasks ordered by priority
            $stmt = $pdo->prepare("
                SELECT * FROM task_queue 
                WHERE status = 'pending' 
                ORDER BY priority DESC, created_at ASC 
                LIMIT ?
            ");
            $stmt->execute([$limit]);
            $tasks = $stmt->fetchAll();
            
            foreach ($tasks as $task) {
                $taskId = $task['id'];
                
                // Mark task as processing
                $updateStmt = $pdo->prepare("
                    UPDATE task_queue 
                    SET status = 'processing', started_at = NOW() 
                    WHERE id = ?
                ");
                $updateStmt->execute([$taskId]);
                
                try {
                    // Process task based on type
                    $result = self::executeTask($task['task_type'], json_decode($task['task_data'], true));
                    
                    // Mark as completed
                    $updateStmt = $pdo->prepare("
                        UPDATE task_queue 
                        SET status = 'completed', completed_at = NOW(), result = ? 
                        WHERE id = ?
                    ");
                    $updateStmt->execute([json_encode($result), $taskId]);
                    
                    $processed[] = [
                        'task_id' => $taskId,
                        'status' => 'completed',
                        'result' => $result
                    ];
                    
                } catch (Exception $e) {
                    // Mark as failed
                    $updateStmt = $pdo->prepare("
                        UPDATE task_queue 
                        SET status = 'failed', error_message = ?, completed_at = NOW() 
                        WHERE id = ?
                    ");
                    $updateStmt->execute([$e->getMessage(), $taskId]);
                    
                    $processed[] = [
                        'task_id' => $taskId,
                        'status' => 'failed',
                        'error' => $e->getMessage()
                    ];
                }
            }
            
        } catch (Exception $e) {
            Logger::error('Failed to process tasks', [
                'error' => $e->getMessage()
            ]);
        }
        
        return $processed;
    }
    
    /**
     * Execute specific task type
     */
    private static function executeTask(string $taskType, array $taskData) {
        switch ($taskType) {
            case 'send_email':
                return self::executeSendEmailTask($taskData);
                
            case 'send_sms':
                return self::executeSendSmsTask($taskData);
                
            case 'process_webhook':
                return self::executeWebhookTask($taskData);
                
            case 'cleanup_temp_files':
                return self::executeCleanupTask($taskData);
                
            default:
                throw new Exception("Unknown task type: {$taskType}");
        }
    }
    
    /**
     * Execute email sending task
     */
    private static function executeSendEmailTask(array $data) {
        // Implementation would depend on your email service
        Logger::info('Processing email task', $data);
        return ['sent' => true, 'message_id' => uniqid()];
    }
    
    /**
     * Execute SMS sending task
     */
    private static function executeSendSmsTask(array $data) {
        // Implementation would depend on your SMS service
        Logger::info('Processing SMS task', $data);
        return ['sent' => true, 'sms_id' => uniqid()];
    }
    
    /**
     * Execute webhook processing task
     */
    private static function executeWebhookTask(array $data) {
        // Implementation for webhook processing
        Logger::info('Processing webhook task', $data);
        return ['processed' => true];
    }
    
    /**
     * Execute cleanup task
     */
    private static function executeCleanupTask(array $data) {
        // Implementation for cleanup operations
        Logger::info('Processing cleanup task', $data);
        return ['cleaned' => true];
    }
    
    /**
     * Get task queue statistics
     */
    public static function getQueueStats(): array {
        try {
            $pdo = Database::conn();
            
            $stmt = $pdo->prepare("
                SELECT status, COUNT(*) as count 
                FROM task_queue 
                GROUP BY status
            ");
            $stmt->execute();
            $statusCounts = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
            
            return [
                'pending' => (int)($statusCounts['pending'] ?? 0),
                'processing' => (int)($statusCounts['processing'] ?? 0),
                'completed' => (int)($statusCounts['completed'] ?? 0),
                'failed' => (int)($statusCounts['failed'] ?? 0),
                'total' => array_sum($statusCounts)
            ];
            
        } catch (Exception $e) {
            Logger::error('Failed to get queue stats', [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
    
    /**
     * Release all locks held by this process
     */
    public static function releaseAllLocks(): void {
        foreach (array_keys(self::$locks) as $resourceKey) {
            self::releaseLock($resourceKey);
        }
    }
}

// Register cleanup on script termination
register_shutdown_function(function() {
    ConcurrencyManager::releaseAllLocks();
});
