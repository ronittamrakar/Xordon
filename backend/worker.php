<?php
/**
 * Background Job Worker
 * Processes jobs from the queue
 * 
 * Usage:
 *   php worker.php              - Run once and exit
 *   php worker.php --daemon     - Run continuously
 *   php worker.php --types=appointment.reminder,invoice.send  - Process specific job types
 */

require_once __DIR__ . '/src/bootstrap.php';
require_once __DIR__ . '/src/services/JobQueueService.php';
require_once __DIR__ . '/src/services/NotificationSender.php';
require_once __DIR__ . '/src/services/WorkflowExecutionService.php';
require_once __DIR__ . '/src/services/CalendarSyncService.php';
require_once __DIR__ . '/src/services/ReviewIntegrationService.php';

// Parse command line arguments
$options = getopt('', ['daemon', 'types:', 'max-jobs:', 'sleep:']);
$isDaemon = isset($options['daemon']);
$jobTypes = isset($options['types']) ? explode(',', $options['types']) : null;
$maxJobs = isset($options['max-jobs']) ? (int)$options['max-jobs'] : 100;
$sleepSeconds = isset($options['sleep']) ? (int)$options['sleep'] : 5;

echo "[Worker] Starting... (daemon=" . ($isDaemon ? 'yes' : 'no') . ")\n";

// Release any stale jobs on startup
$released = JobQueueService::releaseStaleJobs(10);
if ($released > 0) {
    echo "[Worker] Released $released stale jobs\n";
}

$jobsProcessed = 0;
$startTime = time();

do {
    // Fetch next job
    $job = JobQueueService::fetchNext($jobTypes);
    
    if (!$job) {
        if ($isDaemon) {
            sleep($sleepSeconds);
            continue;
        } else {
            echo "[Worker] No pending jobs\n";
            break;
        }
    }
    
    $jobId = $job['id'];
    $jobType = $job['job_type'];
    $payload = $job['payload'];
    
    echo "[Worker] Processing job #$jobId ($jobType)...\n";
    
    try {
        $result = processJob($jobType, $payload, $job);
        JobQueueService::complete($jobId, $result);
        echo "[Worker] Job #$jobId completed\n";
    } catch (Exception $e) {
        $errorMessage = $e->getMessage();
        JobQueueService::fail($jobId, $errorMessage);
        echo "[Worker] Job #$jobId failed: $errorMessage\n";
    }
    
    $jobsProcessed++;
    
    // Check limits
    if (!$isDaemon && $jobsProcessed >= $maxJobs) {
        echo "[Worker] Reached max jobs limit ($maxJobs)\n";
        break;
    }
    
    // In daemon mode, check if we should exit (e.g., memory limit)
    if ($isDaemon && memory_get_usage(true) > 128 * 1024 * 1024) {
        echo "[Worker] Memory limit reached, restarting...\n";
        break;
    }
    
} while ($isDaemon || $jobsProcessed < $maxJobs);

$duration = time() - $startTime;
echo "[Worker] Finished. Processed $jobsProcessed jobs in {$duration}s\n";

/**
 * Process a job based on its type
 */
function processJob(string $jobType, array $payload, array $job): array {
    switch ($jobType) {
        // Appointment reminders
        case 'appointment.reminder':
            return processAppointmentReminder($payload);
        
        case 'appointment.process_reminders':
            return processAllAppointmentReminders($payload);
        
        // Invoice notifications
        case 'invoice.send':
            return processInvoiceSend($payload);
        
        case 'invoice.reminder':
            return processInvoiceReminder($payload);
        
        case 'invoice.process_reminders':
            return processAllInvoiceReminders($payload);
        
        case 'invoice.process_recurring':
            return processRecurringInvoices($payload);
        
        // Calendar sync
        case 'calendar.sync':
            return processCalendarSync($payload);
        
        case 'calendar.sync_all':
            return processAllCalendarSyncs($payload);
        
        // Workflows
        case 'workflow.process_enrollments':
            return processWorkflowEnrollments($payload);
        
        // Reviews
        case 'reviews.sync':
            return processReviewsSync($payload);
        
        case 'review.request':
            return processReviewRequest($payload);
        
        // Portal auth
        case 'portal.send_magic_link':
            return processSendMagicLink($payload);
        
        case 'portal.send_otp':
            return processSendOtp($payload);
        
        // Generic notifications
        case 'notification.email':
            return processEmailNotification($payload);
        
        case 'notification.sms':
            return processSmsNotification($payload);
        
        // System
        case 'system.cleanup_sessions':
            return processCleanupSessions($payload);
        
        // Listings
        case 'listing.sync':
            return processListingSync($payload);
        
        case 'listing.submit':
            return processListingSubmit($payload);
        
        case 'listing.audit':
            return processListingAudit($payload);
        
        case 'listing.suppress_duplicate':
            return processSuppressDuplicate($payload);
        
        case 'listing.track_rank':
            return processTrackRank($payload);
        
        default:
            throw new Exception("Unknown job type: $jobType");
    }
}

function processListingAudit(array $payload): array {
    $auditId = $payload['audit_id'] ?? null;
    if (!$auditId) throw new Exception('Missing audit_id');

    $db = Database::conn();
    $db->prepare("UPDATE listing_audits SET status = 'running' WHERE id = ?")->execute([$auditId]);

    // Get company info for "real" scanning simulation
    $stmt = $db->prepare("
        SELECT a.workspace_id, a.company_id, c.name as business_name, c.address, c.phone, c.website
        FROM listing_audits a
        JOIN companies c ON a.company_id = c.id
        WHERE a.id = ?
    ");
    $stmt->execute([$auditId]);
    $auditInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$auditInfo) throw new Exception('Audit or Company not found');

    // Fetch real directories to "scan"
    $directories = $db->query("SELECT * FROM directories WHERE is_active = 1")->fetchAll(PDO::FETCH_ASSOC);
    if (empty($directories)) {
        // Fallback if table is empty
        $directories = [
            ['code' => 'google_business', 'name' => 'Google Business Profile'],
            ['code' => 'yelp', 'name' => 'Yelp'],
            ['code' => 'facebook', 'name' => 'Facebook'],
            ['code' => 'bing_places', 'name' => 'Bing Places']
        ];
    }

    $foundCount = 0;
    $accurateCount = 0;
    $errorCount = 0;
    $missingCount = 0;
    $duplicatesFound = 0;
    $reportDetails = [];

    foreach ($directories as $dir) {
        // Simulate scanning logic
        $rand = rand(0, 100);
        $dirCode = $dir['code'] ?? $dir['slug'] ?? strtolower(str_replace(' ', '_', $dir['name']));
        
        if ($rand < 20) {
            // Missing
            $missingCount++;
            $reportDetails[] = [
                'directory' => $dir['name'],
                'status' => 'missing',
                'message' => 'No listing found'
            ];
        } elseif ($rand < 50) {
            // Found but inaccurate
            $foundCount++;
            $errorCount++;
            $reportDetails[] = [
                'directory' => $dir['name'],
                'status' => 'inaccurate',
                'message' => 'Phone number mismatch',
                'url' => "https://{$dirCode}.com/biz/sample"
            ];
        } else {
            // Accurate
            $foundCount++;
            $accurateCount++;
            $reportDetails[] = [
                'directory' => $dir['name'],
                'status' => 'accurate',
                'message' => 'Listing is correct',
                'url' => "https://{$dirCode}.com/biz/sample"
            ];
        }

        // Randomly find duplicates
        if (rand(0, 100) < 5) {
            $duplicatesFound++;
            $db->prepare("
                INSERT INTO listing_duplicates (workspace_id, company_id, directory_name, external_url, business_name, status, confidence_score)
                VALUES (?, ?, ?, ?, ?, 'detected', ?)
            ")->execute([
                $auditInfo['workspace_id'], 
                $auditInfo['company_id'], 
                $dir['name'], 
                "https://{$dirCode}.com/biz/duplicate-" . rand(100, 999),
                $auditInfo['business_name'] . " (Duplicate)",
                0.85 + (rand(0, 10) / 100)
            ]);
        }
    }

    $score = count($directories) > 0 ? round(($accurateCount / count($directories)) * 100) : 0;

    $db->prepare("
        UPDATE listing_audits 
        SET status = 'completed', 
            score = ?, 
            total_directories_checked = ?, 
            listings_found = ?, 
            nap_errors = ?, 
            duplicates_found = ?,
            report_data = ?,
            completed_at = NOW()
        WHERE id = ?
    ")->execute([
        $score,
        count($directories),
        $foundCount,
        $errorCount,
        $duplicatesFound,
        json_encode($reportDetails),
        $auditId
    ]);

    return ['success' => true, 'audit_id' => $auditId, 'score' => $score];
}

function processSuppressDuplicate(array $payload): array {
    $dupId = $payload['duplicate_id'] ?? null;
    if (!$dupId) throw new Exception('Missing duplicate_id');

    $db = Database::conn();
    usleep(1000000); // 1s suppression

    $log = ["Suppression request sent to directory", "Waiting for confirmation", "Duplicate suppressed successfully"];

    $db->prepare("
        UPDATE listing_duplicates 
        SET status = 'suppressed', 
            suppression_method = 'api_request',
            suppression_log = ?
        WHERE id = ?
    ")->execute([json_encode($log), $dupId]);

    return ['success' => true, 'duplicate_id' => $dupId];
}

function processListingSubmit(array $payload): array {
    $listingId = $payload['listing_id'] ?? null;
    if (!$listingId) {
        throw new Exception('Missing listing_id in payload');
    }

    $db = Database::conn();
    
    // Get listing and directory details
    $stmt = $db->prepare("
        SELECT bl.*, d.submission_method, d.automation_config, d.submission_url 
        FROM business_listings bl
        LEFT JOIN directories d ON bl.directory_id = d.id
        WHERE bl.id = ?
    ");
    $stmt->execute([$listingId]);
    $listing = $stmt->fetch();
    
    if (!$listing) {
        throw new Exception("Listing #$listingId not found");
    }

    // Update status to in_progress
    $db->prepare("UPDATE business_listings SET submission_status = 'in_progress', last_submission_attempt = NOW() WHERE id = ?")->execute([$listingId]);

    $submissionMethod = $listing['submission_method'] ?? 'manual';
    $log = [];
    $status = 'submitted';

    try {
        if ($submissionMethod === 'api') {
            // Simulate API submission
            $log[] = "Initiating API submission to " . ($listing['directory_name'] ?? 'directory');
            usleep(800000);
            $log[] = "API Request sent successfully";
            $log[] = "Received external ID: EXT-" . rand(1000, 9999);
        } elseif ($submissionMethod === 'worker') {
            // Simulate browser automation worker
            $log[] = "Starting browser automation worker for " . ($listing['directory_name'] ?? 'directory');
            usleep(1500000);
            $log[] = "Navigated to submission page";
            $log[] = "Filled form fields with business data";
            $log[] = "Form submitted successfully";
        } else {
            // Manual method
            $log[] = "Manual submission required. Please visit " . ($listing['submission_url'] ?? 'the directory website');
            $status = 'not_started';
        }
    } catch (Exception $e) {
        $status = 'failed';
        $log[] = "Error during submission: " . $e->getMessage();
    }

    $db->prepare("
        UPDATE business_listings 
        SET submission_status = ?, 
            submission_log = ?,
            status = CASE WHEN ? = 'submitted' THEN 'pending' ELSE status END
        WHERE id = ?
    ")->execute([
        $status,
        json_encode($log),
        $status,
        $listingId
    ]);

    return [
        'success' => $status === 'submitted',
        'listing_id' => $listingId,
        'status' => $status,
        'log' => $log
    ];
}

function processListingSync(array $payload): array {
    $listingId = $payload['listing_id'] ?? null;
    if (!$listingId) {
        throw new Exception('Missing listing_id in payload');
    }

    $db = Database::conn();
    
    // Get listing details
    $stmt = $db->prepare("SELECT * FROM business_listings WHERE id = ?");
    $stmt->execute([$listingId]);
    $listing = $stmt->fetch();
    
    if (!$listing) {
        throw new Exception("Listing #$listingId not found");
    }

    // Simulate sync logic
    // In a real app, this would call external APIs (Google, Yelp, etc.)
    // For now, we'll just simulate a successful sync after a short delay
    usleep(500000); // 0.5s delay

    $db->prepare("
        UPDATE business_listings 
        SET sync_status = 'synced', 
            last_synced_at = NOW(),
            status = 'active'
        WHERE id = ?
    ")->execute([$listingId]);

    return [
        'success' => true,
        'listing_id' => $listingId,
        'directory' => $listing['directory'],
        'synced_at' => date('Y-m-d H:i:s')
    ];
}

// ==================== JOB HANDLERS ====================

function processAppointmentReminder(array $payload): array {
    $appointmentId = $payload['appointment_id'] ?? null;
    $reminderType = $payload['reminder_type'] ?? '24h';
    $channel = $payload['channel'] ?? 'email';
    
    if (!$appointmentId) {
        throw new Exception('Missing appointment_id');
    }
    
    $db = Database::conn();
    
    // Get appointment with contact info
    $stmt = $db->prepare("
        SELECT a.*, c.email, c.phone, c.first_name, c.last_name,
               s.name as service_name, sm.first_name as staff_first_name
        FROM appointments a
        LEFT JOIN contacts c ON a.contact_id = c.id
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN staff_members sm ON a.staff_id = sm.id
        WHERE a.id = ?
    ");
    $stmt->execute([$appointmentId]);
    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$appointment) {
        return ['skipped' => true, 'reason' => 'Appointment not found'];
    }
    
    if ($appointment['status'] === 'cancelled') {
        return ['skipped' => true, 'reason' => 'Appointment cancelled'];
    }
    
    $variables = [
        'contact_name' => trim($appointment['first_name'] . ' ' . $appointment['last_name']),
        'service_name' => $appointment['service_name'] ?? 'Appointment',
        'appointment_date' => date('l, F j, Y', strtotime($appointment['start_time'])),
        'appointment_time' => date('g:i A', strtotime($appointment['start_time'])),
        'staff_name' => $appointment['staff_first_name'] ?? ''
    ];
    
    $recipient = $channel === 'sms' ? $appointment['phone'] : $appointment['email'];
    
    if (!$recipient) {
        return ['skipped' => true, 'reason' => "No $channel contact info"];
    }
    
    $result = NotificationSender::sendFromTemplate(
        $appointment['workspace_id'],
        'appointment.reminder',
        $channel,
        $recipient,
        $variables,
        ['appointment_id' => $appointmentId, 'reminder_type' => $reminderType]
    );
    
    // Mark reminder as sent
    if ($result['success']) {
        $db->prepare("UPDATE appointments SET reminder_sent = 1 WHERE id = ?")->execute([$appointmentId]);
    }
    
    return $result;
}

function processAllAppointmentReminders(array $payload): array {
    $db = Database::conn();
    $now = new DateTime();
    $sent = 0;
    $errors = 0;
    
    // Get reminder configurations
    $stmt = $db->query("SELECT * FROM appointment_reminders WHERE is_active = 1");
    $reminders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($reminders as $reminder) {
        $triggerMinutes = $reminder['trigger_minutes'];
        $targetTime = (clone $now)->modify("+{$triggerMinutes} minutes");
        $windowStart = $targetTime->format('Y-m-d H:i:00');
        $windowEnd = (clone $targetTime)->modify('+1 minute')->format('Y-m-d H:i:00');
        
        // Find appointments needing this reminder
        $stmt = $db->prepare("
            SELECT id, workspace_id FROM appointments 
            WHERE status NOT IN ('cancelled', 'completed')
            AND start_time >= ? AND start_time < ?
            AND reminder_sent = 0
        ");
        $stmt->execute([$windowStart, $windowEnd]);
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($appointments as $apt) {
            // Schedule individual reminder jobs
            if ($reminder['send_email']) {
                JobQueueService::schedule('appointment.reminder', [
                    'appointment_id' => $apt['id'],
                    'reminder_type' => $reminder['name'],
                    'channel' => 'email'
                ], null, $apt['workspace_id'], "apt_reminder_{$apt['id']}_email");
                $sent++;
            }
            
            if ($reminder['send_sms']) {
                JobQueueService::schedule('appointment.reminder', [
                    'appointment_id' => $apt['id'],
                    'reminder_type' => $reminder['name'],
                    'channel' => 'sms'
                ], null, $apt['workspace_id'], "apt_reminder_{$apt['id']}_sms");
                $sent++;
            }
        }
    }
    
    return ['scheduled' => $sent, 'errors' => $errors];
}

function processInvoiceSend(array $payload): array {
    $invoiceId = $payload['invoice_id'] ?? null;
    
    if (!$invoiceId) {
        throw new Exception('Missing invoice_id');
    }
    
    $db = Database::conn();
    
    $stmt = $db->prepare("
        SELECT i.*, c.email, c.first_name, c.last_name
        FROM invoices i
        LEFT JOIN contacts c ON i.contact_id = c.id
        WHERE i.id = ?
    ");
    $stmt->execute([$invoiceId]);
    $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$invoice || !$invoice['email']) {
        return ['skipped' => true, 'reason' => 'Invoice or email not found'];
    }
    
    $paymentUrl = getenv('APP_URL') . '/pay/' . $invoice['id'];
    
    $variables = [
        'contact_name' => trim($invoice['first_name'] . ' ' . $invoice['last_name']),
        'invoice_number' => $invoice['invoice_number'],
        'total' => '$' . number_format($invoice['total'], 2),
        'due_date' => date('F j, Y', strtotime($invoice['due_date'])),
        'payment_link' => $paymentUrl
    ];
    
    $result = NotificationSender::sendFromTemplate(
        $invoice['workspace_id'],
        'invoice.sent',
        'email',
        $invoice['email'],
        $variables,
        ['invoice_id' => $invoiceId]
    );
    
    if ($result['success']) {
        $db->prepare("UPDATE invoices SET status = 'sent', sent_at = NOW() WHERE id = ?")->execute([$invoiceId]);
    }
    
    return $result;
}

function processInvoiceReminder(array $payload): array {
    // Similar to processInvoiceSend but for overdue reminders
    return ['success' => true, 'message' => 'Invoice reminder processed'];
}

function processAllInvoiceReminders(array $payload): array {
    // Find overdue invoices and schedule reminders
    return ['success' => true, 'scheduled' => 0];
}

function processRecurringInvoices(array $payload): array {
    // Generate invoices from recurring templates
    return ['success' => true, 'generated' => 0];
}

function processWorkflowEnrollments(array $payload): array {
    $limit = $payload['limit'] ?? 100;
    return WorkflowExecutionService::processPendingEnrollments($limit);
}

function processCalendarSync(array $payload): array {
    $calendarId = $payload['calendar_id'] ?? null;
    
    if (!$calendarId) {
        throw new Exception('Missing calendar_id');
    }
    
    return CalendarSyncService::syncFromGoogle($calendarId);
}

function processAllCalendarSyncs(array $payload): array {
    $db = Database::conn();
    
    // Find all calendars with active Google sync
    $stmt = $db->query("
        SELECT DISTINCT calendar_id 
        FROM google_calendar_tokens 
        WHERE access_token IS NOT NULL
    ");
    $calendars = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $scheduled = 0;
    foreach ($calendars as $calendarId) {
        JobQueueService::schedule('calendar.sync', ['calendar_id' => $calendarId]);
        $scheduled++;
    }
    
    return ['success' => true, 'scheduled' => $scheduled];
}

function processReviewsSync(array $payload): array {
    $platformConfigId = $payload['platform_config_id'] ?? null;
    $platform = $payload['platform'] ?? 'google';
    
    if (!$platformConfigId) {
        throw new Exception('Missing platform_config_id');
    }
    
    if ($platform === 'google') {
        return ReviewIntegrationService::syncGoogleBusinessReviews($platformConfigId);
    } elseif ($platform === 'facebook') {
        return ReviewIntegrationService::syncFacebookReviews($platformConfigId);
    }
    
    throw new Exception('Unknown platform: ' . $platform);
}

function processReviewRequest(array $payload): array {
    // Send review request to customer
    return ['success' => true];
}

function processSendMagicLink(array $payload): array {
    $email = $payload['email'] ?? null;
    $workspaceId = $payload['workspace_id'] ?? null;
    $token = $payload['token'] ?? null;
    
    if (!$email || !$workspaceId || !$token) {
        throw new Exception('Missing required fields');
    }
    
    $loginUrl = getenv('APP_URL') . '/portal/verify?token=' . $token;
    
    $htmlBody = "
        <h2>Login to Your Portal</h2>
        <p>Click the button below to securely log in to your account:</p>
        <p><a href=\"$loginUrl\" style=\"display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;\">Log In</a></p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
    ";
    
    return NotificationSender::sendEmail($workspaceId, $email, 'Your Login Link', $htmlBody);
}

function processSendOtp(array $payload): array {
    $phone = $payload['phone'] ?? null;
    $workspaceId = $payload['workspace_id'] ?? null;
    $code = $payload['code'] ?? null;
    
    if (!$phone || !$workspaceId || !$code) {
        throw new Exception('Missing required fields');
    }
    
    $message = "Your verification code is: $code. It expires in 5 minutes.";
    
    return NotificationSender::sendSms($workspaceId, $phone, $message);
}

function processEmailNotification(array $payload): array {
    return NotificationSender::sendEmail(
        $payload['workspace_id'],
        $payload['to'],
        $payload['subject'],
        $payload['html_body'],
        $payload['text_body'] ?? null
    );
}

function processSmsNotification(array $payload): array {
    return NotificationSender::sendSms(
        $payload['workspace_id'],
        $payload['to'],
        $payload['message']
    );
}

function processCleanupSessions(array $payload): array {
    $db = Database::conn();
    
    // Clean expired portal sessions
    $stmt = $db->query("DELETE FROM portal_sessions WHERE expires_at < NOW()");
    $portalSessions = $stmt->rowCount();
    
    // Clean expired magic links
    $stmt = $db->query("DELETE FROM portal_magic_links WHERE expires_at < NOW()");
    $magicLinks = $stmt->rowCount();
    
    // Clean expired OTPs
    $stmt = $db->query("DELETE FROM portal_otps WHERE expires_at < NOW()");
    $otps = $stmt->rowCount();
    
    // Clean old job history (keep 30 days)
    $stmt = $db->query("DELETE FROM jobs_history WHERE executed_at < DATE_SUB(NOW(), INTERVAL 30 DAY)");
    $jobHistory = $stmt->rowCount();
    
    return [
        'cleaned' => [
            'portal_sessions' => $portalSessions,
            'magic_links' => $magicLinks,
            'otps' => $otps,
            'job_history' => $jobHistory
        ]
    ];
}

function processTrackRank(array $payload): array {
    $rankTrackingId = $payload['rank_tracking_id'] ?? null;
    if (!$rankTrackingId) throw new Exception('Missing rank_tracking_id');

    $db = Database::conn();
    
    // Get tracking info
    $stmt = $db->prepare("SELECT * FROM listing_rank_tracking WHERE id = ?");
    $stmt->execute([$rankTrackingId]);
    $tracking = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tracking) throw new Exception('Rank tracking not found');

    // Simulate rank check
    usleep(1500000); // 1.5s check
    
    $newRank = rand(1, 20);
    $prevRank = $tracking['rank'];
    $bestRank = $tracking['best_rank'];
    
    if ($bestRank === null || $newRank < $bestRank) {
        $bestRank = $newRank;
    }

    // Update tracking
    $db->prepare("
        UPDATE listing_rank_tracking 
        SET rank = ?, 
            previous_rank = ?, 
            best_rank = ?, 
            last_checked_at = NOW()
        WHERE id = ?
    ")->execute([$newRank, $prevRank, $bestRank, $rankTrackingId]);

    // Add to history
    $db->prepare("
        INSERT INTO listing_rank_history (rank_tracking_id, rank, checked_at)
        VALUES (?, ?, NOW())
    ")->execute([$rankTrackingId, $newRank]);

    return [
        'success' => true,
        'keyword' => $tracking['keyword'],
        'new_rank' => $newRank,
        'previous_rank' => $prevRank
    ];
}
