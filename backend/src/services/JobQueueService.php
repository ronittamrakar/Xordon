<?php
/**
 * Job Queue Service
 * Handles background job scheduling, processing, and management
 */

require_once __DIR__ . '/../Database.php';

class JobQueueService {
    private static $workerId = null;
    
    /**
     * Get unique worker ID
     */
    private static function getWorkerId(): string {
        if (self::$workerId === null) {
            self::$workerId = gethostname() . '_' . getmypid() . '_' . bin2hex(random_bytes(4));
        }
        return self::$workerId;
    }
    
    /**
     * Schedule a job for execution
     */
    public static function schedule(
        string $jobType,
        array $payload,
        ?string $scheduledAt = null,
        ?int $workspaceId = null,
        ?string $jobKey = null,
        int $priority = 0,
        int $maxAttempts = 3
    ): ?int {
        try {
            $db = Database::conn();
            
            // If job key provided, check for existing pending job
            if ($jobKey) {
                $stmt = $db->prepare("
                    SELECT id FROM jobs_queue 
                    WHERE job_key = ? AND status IN ('pending', 'processing')
                ");
                $stmt->execute([$jobKey]);
                if ($stmt->fetch()) {
                    return null; // Job already scheduled
                }
            }
            
            $stmt = $db->prepare("
                INSERT INTO jobs_queue 
                (workspace_id, job_type, job_key, payload, scheduled_at, priority, max_attempts)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $workspaceId,
                $jobType,
                $jobKey,
                json_encode($payload),
                $scheduledAt ?? date('Y-m-d H:i:s'),
                $priority,
                $maxAttempts
            ]);
            
            return (int)$db->lastInsertId();
        } catch (Exception $e) {
            error_log("JobQueueService::schedule error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Schedule a job to run after a delay
     */
    public static function scheduleIn(
        string $jobType,
        array $payload,
        int $delaySeconds,
        ?int $workspaceId = null,
        ?string $jobKey = null
    ): ?int {
        $scheduledAt = date('Y-m-d H:i:s', time() + $delaySeconds);
        return self::schedule($jobType, $payload, $scheduledAt, $workspaceId, $jobKey);
    }
    
    /**
     * Cancel a pending job by key
     */
    public static function cancel(string $jobKey): bool {
        try {
            $db = Database::conn();
            $stmt = $db->prepare("
                UPDATE jobs_queue 
                SET status = 'cancelled', updated_at = NOW()
                WHERE job_key = ? AND status = 'pending'
            ");
            $stmt->execute([$jobKey]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log("JobQueueService::cancel error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Fetch and lock the next available job
     */
    public static function fetchNext(?array $jobTypes = null): ?array {
        try {
            $db = Database::conn();
            $workerId = self::getWorkerId();
            
            // Build query
            $sql = "
                SELECT * FROM jobs_queue 
                WHERE status = 'pending' 
                AND scheduled_at <= NOW()
                AND (locked_by IS NULL OR locked_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE))
            ";
            $params = [];
            
            if ($jobTypes) {
                $placeholders = implode(',', array_fill(0, count($jobTypes), '?'));
                $sql .= " AND job_type IN ($placeholders)";
                $params = $jobTypes;
            }
            
            $sql .= " ORDER BY priority DESC, scheduled_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED";
            
            $db->beginTransaction();
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $job = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$job) {
                $db->rollBack();
                return null;
            }
            
            // Lock the job
            $stmt = $db->prepare("
                UPDATE jobs_queue 
                SET status = 'processing', locked_by = ?, locked_at = NOW(), started_at = NOW(), attempts = attempts + 1
                WHERE id = ?
            ");
            $stmt->execute([$workerId, $job['id']]);
            
            $db->commit();
            
            $job['payload'] = json_decode($job['payload'], true);
            return $job;
            
        } catch (Exception $e) {
            if (isset($db) && $db->inTransaction()) {
                $db->rollBack();
            }
            error_log("JobQueueService::fetchNext error: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Mark job as completed
     */
    public static function complete(int $jobId, ?array $result = null): bool {
        try {
            $db = Database::conn();
            
            // Get job info for history
            $stmt = $db->prepare("SELECT * FROM jobs_queue WHERE id = ?");
            $stmt->execute([$jobId]);
            $job = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$job) return false;
            
            // Update job status
            $stmt = $db->prepare("
                UPDATE jobs_queue 
                SET status = 'completed', completed_at = NOW(), result = ?, locked_by = NULL
                WHERE id = ?
            ");
            $stmt->execute([json_encode($result), $jobId]);
            
            // Log to history
            $startedAt = $job['started_at'] ? strtotime($job['started_at']) : time();
            $durationMs = (time() - $startedAt) * 1000;
            
            $stmt = $db->prepare("
                INSERT INTO jobs_history 
                (job_id, workspace_id, job_type, payload, status, result, duration_ms, attempts)
                VALUES (?, ?, ?, ?, 'completed', ?, ?, ?)
            ");
            $stmt->execute([
                $jobId,
                $job['workspace_id'],
                $job['job_type'],
                $job['payload'],
                json_encode($result),
                $durationMs,
                $job['attempts']
            ]);
            
            return true;
        } catch (Exception $e) {
            error_log("JobQueueService::complete error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Mark job as failed
     */
    public static function fail(int $jobId, string $errorMessage, bool $retry = true): bool {
        try {
            $db = Database::conn();
            
            // Get job info
            $stmt = $db->prepare("SELECT * FROM jobs_queue WHERE id = ?");
            $stmt->execute([$jobId]);
            $job = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$job) return false;
            
            $shouldRetry = $retry && $job['attempts'] < $job['max_attempts'];
            
            if ($shouldRetry) {
                // Schedule retry with exponential backoff
                $backoffSeconds = pow(2, $job['attempts']) * 60; // 2min, 4min, 8min, etc.
                $nextRetry = date('Y-m-d H:i:s', time() + $backoffSeconds);
                
                $stmt = $db->prepare("
                    UPDATE jobs_queue 
                    SET status = 'pending', error_message = ?, next_retry_at = ?, 
                        scheduled_at = ?, locked_by = NULL, locked_at = NULL
                    WHERE id = ?
                ");
                $stmt->execute([$errorMessage, $nextRetry, $nextRetry, $jobId]);
            } else {
                // Mark as permanently failed
                $stmt = $db->prepare("
                    UPDATE jobs_queue 
                    SET status = 'failed', error_message = ?, completed_at = NOW(), locked_by = NULL
                    WHERE id = ?
                ");
                $stmt->execute([$errorMessage, $jobId]);
                
                // Log to history
                $startedAt = $job['started_at'] ? strtotime($job['started_at']) : time();
                $durationMs = (time() - $startedAt) * 1000;
                
                $stmt = $db->prepare("
                    INSERT INTO jobs_history 
                    (job_id, workspace_id, job_type, payload, status, error_message, duration_ms, attempts)
                    VALUES (?, ?, ?, ?, 'failed', ?, ?, ?)
                ");
                $stmt->execute([
                    $jobId,
                    $job['workspace_id'],
                    $job['job_type'],
                    $job['payload'],
                    $errorMessage,
                    $durationMs,
                    $job['attempts']
                ]);
            }
            
            return true;
        } catch (Exception $e) {
            error_log("JobQueueService::fail error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get pending job count
     */
    public static function getPendingCount(?int $workspaceId = null): int {
        try {
            $db = Database::conn();
            
            $sql = "SELECT COUNT(*) FROM jobs_queue WHERE status = 'pending'";
            $params = [];
            
            if ($workspaceId !== null) {
                $sql .= " AND workspace_id = ?";
                $params[] = $workspaceId;
            }
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            return (int)$stmt->fetchColumn();
        } catch (Exception $e) {
            error_log("JobQueueService::getPendingCount error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Get job stats
     */
    public static function getStats(?int $workspaceId = null): array {
        try {
            $db = Database::conn();
            
            $whereClause = $workspaceId !== null ? "WHERE workspace_id = ?" : "";
            $params = $workspaceId !== null ? [$workspaceId] : [];
            
            $stmt = $db->prepare("
                SELECT 
                    status,
                    COUNT(*) as count
                FROM jobs_queue
                $whereClause
                GROUP BY status
            ");
            $stmt->execute($params);
            
            $stats = [
                'pending' => 0,
                'processing' => 0,
                'completed' => 0,
                'failed' => 0,
                'cancelled' => 0
            ];
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $stats[$row['status']] = (int)$row['count'];
            }
            
            return $stats;
        } catch (Exception $e) {
            error_log("JobQueueService::getStats error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Cleanup old completed/failed jobs
     */
    public static function cleanup(int $daysToKeep = 7): int {
        try {
            $db = Database::conn();
            
            $stmt = $db->prepare("
                DELETE FROM jobs_queue 
                WHERE status IN ('completed', 'failed', 'cancelled')
                AND completed_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            ");
            $stmt->execute([$daysToKeep]);
            
            return $stmt->rowCount();
        } catch (Exception $e) {
            error_log("JobQueueService::cleanup error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Release stale locked jobs
     */
    public static function releaseStaleJobs(int $staleMinutes = 10): int {
        try {
            $db = Database::conn();
            
            $stmt = $db->prepare("
                UPDATE jobs_queue 
                SET status = 'pending', locked_by = NULL, locked_at = NULL
                WHERE status = 'processing'
                AND locked_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
            ");
            $stmt->execute([$staleMinutes]);
            
            return $stmt->rowCount();
        } catch (Exception $e) {
            error_log("JobQueueService::releaseStaleJobs error: " . $e->getMessage());
            return 0;
        }
    }
}
