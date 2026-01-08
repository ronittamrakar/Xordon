<?php
/**
 * Push Notification Background Worker
 * Processes queued push notifications and sends them via FCM/APNS
 * 
 * Usage:
 *   php push_notification_worker.php          # Run once
 *   php push_notification_worker.php --daemon # Run continuously
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/Database.php';

// Configuration
$isDaemon = in_array('--daemon', $argv);
$sleepSeconds = 5;
$batchSize = 100;
$maxRetries = 3;

echo "Push Notification Worker Started\n";
echo "Mode: " . ($isDaemon ? "Daemon" : "One-shot") . "\n";
echo "Batch Size: $batchSize\n";
echo "Sleep: {$sleepSeconds}s\n\n";

// Load environment
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($key, $value) = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($value));
    }
}

// Check for Firebase credentials
$firebaseCredsPath = getenv('FIREBASE_CREDENTIALS');
$hasFirebase = $firebaseCredsPath && file_exists($firebaseCredsPath);

if (!$hasFirebase) {
    echo "WARNING: Firebase credentials not configured. Notifications will be logged only.\n";
    echo "Set FIREBASE_CREDENTIALS in .env to enable real push notifications.\n\n";
}

do {
    try {
        $db = Database::conn();
        
        // Get pending notifications
        $stmt = $db->prepare("
            SELECT n.*, d.device_token, d.device_type, d.device_name
            FROM push_notifications n
            JOIN mobile_devices d ON n.device_id = d.id
            WHERE n.status = 'queued' AND d.is_active = 1
            ORDER BY n.created_at ASC
            LIMIT ?
        ");
        $stmt->execute([$batchSize]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($notifications)) {
            if (!$isDaemon) {
                echo "No pending notifications. Exiting.\n";
                break;
            }
            echo "[" . date('Y-m-d H:i:s') . "] No pending notifications. Sleeping...\n";
            sleep($sleepSeconds);
            continue;
        }
        
        echo "[" . date('Y-m-d H:i:s') . "] Processing " . count($notifications) . " notifications...\n";
        
        foreach ($notifications as $notif) {
            try {
                $success = false;
                $errorMessage = null;
                
                if ($hasFirebase) {
                    // Send via Firebase (real implementation)
                    $result = sendViaFirebase($notif);
                    $success = $result['success'];
                    $errorMessage = $result['error'] ?? null;
                } else {
                    // Mock send (for testing without Firebase)
                    echo "  [MOCK] Sending to {$notif['device_type']} device: {$notif['title']}\n";
                    $success = true;
                }
                
                if ($success) {
                    // Update as sent
                    $updateStmt = $db->prepare("
                        UPDATE push_notifications 
                        SET status = 'sent', sent_at = NOW()
                        WHERE id = ?
                    ");
                    $updateStmt->execute([$notif['id']]);
                    
                    echo "  ✓ Sent notification #{$notif['id']} to {$notif['device_name']}\n";
                } else {
                    // Handle failure
                    $attemptCount = ($notif['attempt_count'] ?? 0) + 1;
                    
                    if ($attemptCount >= $maxRetries) {
                        // Max retries reached, mark as failed
                        $updateStmt = $db->prepare("
                            UPDATE push_notifications 
                            SET status = 'failed', error_message = ?
                            WHERE id = ?
                        ");
                        $updateStmt->execute([$errorMessage, $notif['id']]);
                        echo "  ✗ Failed notification #{$notif['id']} (max retries)\n";
                    } else {
                        // Schedule retry
                        $nextRetry = date('Y-m-d H:i:s', strtotime("+5 minutes"));
                        $updateStmt = $db->prepare("
                            UPDATE push_notifications 
                            SET attempt_count = ?, error_message = ?
                            WHERE id = ?
                        ");
                        $updateStmt->execute([$attemptCount, $errorMessage, $notif['id']]);
                        echo "  ⟳ Retry scheduled for notification #{$notif['id']} (attempt $attemptCount)\n";
                    }
                }
                
            } catch (Exception $e) {
                echo "  ✗ Error processing notification #{$notif['id']}: " . $e->getMessage() . "\n";
                
                // Log error
                $updateStmt = $db->prepare("
                    UPDATE push_notifications 
                    SET error_message = ?
                    WHERE id = ?
                ");
                $updateStmt->execute([$e->getMessage(), $notif['id']]);
            }
        }
        
        echo "\n";
        
    } catch (Exception $e) {
        echo "Worker Error: " . $e->getMessage() . "\n";
        sleep($sleepSeconds);
    }
    
    if ($isDaemon) {
        sleep($sleepSeconds);
    }
    
} while ($isDaemon);

echo "Push Notification Worker Stopped\n";

/**
 * Send notification via Firebase Cloud Messaging
 */
function sendViaFirebase($notification) {
    try {
        $firebaseCredsPath = getenv('FIREBASE_CREDENTIALS');
        
        if (!$firebaseCredsPath || !file_exists($firebaseCredsPath)) {
            return ['success' => false, 'error' => 'Firebase credentials not found'];
        }
        
        // Initialize Firebase (requires kreait/firebase-php)
        if (!class_exists('Kreait\Firebase\Factory')) {
            return ['success' => false, 'error' => 'Firebase SDK not installed'];
        }
        
        $factory = (new \Kreait\Firebase\Factory)->withServiceAccount($firebaseCredsPath);
        $messaging = $factory->createMessaging();
        
        // Prepare message
        $data = json_decode($notification['data'] ?? '{}', true);
        
        $message = \Kreait\Firebase\Messaging\CloudMessage::withTarget('token', $notification['device_token'])
            ->withNotification([
                'title' => $notification['title'],
                'body' => $notification['body']
            ])
            ->withData($data);
        
        // Add platform-specific config
        if ($notification['device_type'] === 'ios') {
            $message = $message->withApnsConfig([
                'payload' => [
                    'aps' => [
                        'sound' => 'default',
                        'badge' => 1
                    ]
                ]
            ]);
        }
        
        // Send message
        $messaging->send($message);
        
        return ['success' => true];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}
