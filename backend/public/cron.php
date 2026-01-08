<?php
/**
 * Cron Endpoint
 * Hit this endpoint every minute via cron or external service
 * 
 * Example cron: * * * * * curl -s http://localhost:8001/cron.php > /dev/null
 */

require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/services/JobQueueService.php';

// Simple auth check (use a secret token in production)
$cronSecret = getenv('CRON_SECRET');
$providedSecret = $_GET['secret'] ?? $_SERVER['HTTP_X_CRON_SECRET'] ?? null;

if ($cronSecret && $cronSecret !== $providedSecret) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

try {
    $db = Database::conn();
    $results = [];
    
    // 1. Process scheduled jobs that are due
    $stmt = $db->prepare("
        SELECT * FROM scheduled_jobs 
        WHERE is_active = 1 
        AND (next_run_at IS NULL OR next_run_at <= NOW())
        LIMIT 10
    ");
    $stmt->execute();
    $scheduledJobs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($scheduledJobs as $scheduled) {
        // Create a job in the queue
        $payload = $scheduled['payload_template'] ? json_decode($scheduled['payload_template'], true) : [];
        
        JobQueueService::schedule(
            $scheduled['job_type'],
            $payload,
            null,
            $scheduled['workspace_id'],
            "scheduled_{$scheduled['id']}_" . date('YmdHi')
        );
        
        // Calculate next run time
        $nextRun = calculateNextRun($scheduled);
        
        $db->prepare("
            UPDATE scheduled_jobs 
            SET last_run_at = NOW(), next_run_at = ?, last_status = 'success'
            WHERE id = ?
        ")->execute([$nextRun, $scheduled['id']]);
        
        $results['scheduled_triggered'][] = $scheduled['name'];
    }
    
    // 2. Process pending jobs (up to 10 per cron run)
    $jobsProcessed = 0;
    $maxJobs = 10;
    
    while ($jobsProcessed < $maxJobs) {
        $job = JobQueueService::fetchNext();
        
        if (!$job) {
            break;
        }
        
        try {
            // Include worker functions
            require_once __DIR__ . '/../worker.php';
            $result = processJob($job['job_type'], $job['payload'], $job);
            JobQueueService::complete($job['id'], $result);
            $results['jobs_completed'][] = $job['job_type'];
        } catch (Exception $e) {
            JobQueueService::fail($job['id'], $e->getMessage());
            $results['jobs_failed'][] = ['type' => $job['job_type'], 'error' => $e->getMessage()];
        }
        
        $jobsProcessed++;
    }
    
    // 3. Release stale jobs
    $released = JobQueueService::releaseStaleJobs(10);
    if ($released > 0) {
        $results['stale_released'] = $released;
    }
    
    // 4. Get queue stats
    $results['queue_stats'] = JobQueueService::getStats();
    
    echo json_encode(['success' => true, 'results' => $results]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Calculate next run time for a scheduled job
 */
function calculateNextRun(array $job): string {
    $now = new DateTime();
    
    switch ($job['schedule_type']) {
        case 'interval':
            $minutes = $job['interval_minutes'] ?? 60;
            return $now->modify("+{$minutes} minutes")->format('Y-m-d H:i:s');
            
        case 'daily':
            $time = $job['run_at_time'] ?? '00:00:00';
            $next = new DateTime($now->format('Y-m-d') . ' ' . $time);
            if ($next <= $now) {
                $next->modify('+1 day');
            }
            return $next->format('Y-m-d H:i:s');
            
        case 'weekly':
            $dayOfWeek = $job['run_on_day'] ?? 1; // Monday
            $time = $job['run_at_time'] ?? '00:00:00';
            $next = new DateTime();
            $next->modify("next " . ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][$dayOfWeek]);
            $next->setTime(...explode(':', $time));
            return $next->format('Y-m-d H:i:s');
            
        case 'monthly':
            $dayOfMonth = $job['run_on_day'] ?? 1;
            $time = $job['run_at_time'] ?? '00:00:00';
            $next = new DateTime($now->format('Y-m') . '-' . str_pad($dayOfMonth, 2, '0', STR_PAD_LEFT) . ' ' . $time);
            if ($next <= $now) {
                $next->modify('+1 month');
            }
            return $next->format('Y-m-d H:i:s');
            
        default:
            return $now->modify('+1 hour')->format('Y-m-d H:i:s');
    }
}
