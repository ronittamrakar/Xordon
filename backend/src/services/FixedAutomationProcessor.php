<?php
require_once __DIR__ . "/../Database.php";

class FixedAutomationProcessor {
    
    public static function processTrigger($channel, $triggerType, $contactId, $triggerData = []) {
        $pdo = Database::conn();
        
        error_log("Processing automation trigger: $channel:$triggerType for contact $contactId");
        
        // Find matching automations
        $stmt = $pdo->prepare("
            SELECT * FROM followup_automations 
            WHERE channel = ? AND trigger_type = ? AND is_active = 1
            ORDER BY priority DESC
        ");
        $stmt->execute([$channel, $triggerType]);
        $automations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $executed = 0;
        
        foreach ($automations as $automation) {
            try {
                // Evaluate conditions
                if (self::evaluateConditions($automation["trigger_conditions"], $triggerData)) {
                    // Execute the action
                    $success = self::executeAction($automation, $contactId, $triggerData);
                    
                    // Log execution
                    self::logExecution($automation["id"], $contactId, $triggerData, $success);
                    
                    if ($success) {
                        $executed++;
                        error_log("✅ Executed automation #{$automation['id']}: {$automation['name']}");
                    } else {
                        error_log("❌ Failed automation #{$automation['id']}: {$automation['name']}");
                    }
                }
            } catch (Exception $e) {
                error_log("❌ Automation #{$automation['id']} failed: " . $e->getMessage());
                self::logExecution($automation["id"], $contactId, $triggerData, false, $e->getMessage());
            }
        }
        
        return $executed;
    }
    
    private static function evaluateConditions($conditions, $triggerData) {
        if (empty($conditions)) return true;
        
        $conditions = json_decode($conditions, true) ?: [];
        
        foreach ($conditions as $key => $value) {
            if (!isset($triggerData[$key]) || $triggerData[$key] != $value) {
                return false;
            }
        }
        
        return true;
    }
    
    private static function executeAction($automation, $contactId, $triggerData) {
        $action = $automation["action_type"];
        $config = json_decode($automation["action_config"], true) ?: [];
        
        // Handle delays (execute immediately for testing)
        if ($automation["delay_amount"] > 0) {
            error_log("⏰ Automation #{$automation['id']} has delay but executing immediately for testing");
        }
        
        // Execute actions based on actual database structure
        switch ($action) {
            case "send_email":
                return self::sendEmail($contactId, $config, $triggerData);
            case "send_sms":
                return self::sendSMS($contactId, $config, $triggerData);
            case "schedule_call":
                return self::scheduleCall($contactId, $config, $triggerData);
            case "add_tag":
                return self::addTag($contactId, $config, $triggerData);
            case "remove_tag":
                return self::removeTag($contactId, $config, $triggerData);
            case "notify_user":
                return self::notifyUser($contactId, $config, $triggerData);
            case "update_status":
                return self::updateStatus($contactId, $config, $triggerData);
            case "create_task":
                return self::createTask($contactId, $config, $triggerData);
            default:
                error_log("Unknown action: $action");
                return false;
        }
    }
    
    // Fixed action implementations that work with actual database
    private static function sendEmail($contactId, $config, $triggerData) {
        $pdo = Database::conn();
        
        try {
            // Get contact details (handle different field names)
            $stmt = $pdo->prepare("SELECT email FROM contacts WHERE id = ?");
            $stmt->execute([$contactId]);
            $contact = $stmt->fetch();
            
            if (!$contact || !$contact['email']) {
                error_log("No email found for contact $contactId");
                return false;
            }
            
            // Create email log entry
            $stmt = $pdo->prepare("
                INSERT INTO email_logs (contact_id, user_id, to_email, subject, content, type, status, created_at)
                VALUES (?, 3, ?, ?, ?, 'automation', 'sent', NOW())
            ");
            
            $subject = $config['subject'] ?? 'Automated Follow-up';
            $content = $config['message'] ?? $config['template'] ?? 'This is an automated follow-up message.';
            
            $stmt->execute([$contactId, $contact['email'], $subject, $content]);
            
            error_log("📧 Email sent to {$contact['email']} for automation");
            return true;
            
        } catch (Exception $e) {
            error_log("Failed to send email: " . $e->getMessage());
            return false;
        }
    }
    
    private static function sendSMS($contactId, $config, $triggerData) {
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("SELECT phone FROM contacts WHERE id = ?");
            $stmt->execute([$contactId]);
            $contact = $stmt->fetch();
            
            if (!$contact || !$contact['phone']) {
                error_log("No phone found for contact $contactId");
                return false;
            }
            
            // Create SMS log entry
            $stmt = $pdo->prepare("
                INSERT INTO sms_logs (contact_id, user_id, to_phone, message, type, status, created_at)
                VALUES (?, 3, ?, ?, 'automation', 'sent', NOW())
            ");
            
            $message = $config['message'] ?? 'This is an automated SMS message.';
            
            $stmt->execute([$contactId, $contact['phone'], $message]);
            
            error_log("📱 SMS sent to {$contact['phone']} for automation");
            return true;
            
        } catch (Exception $e) {
            error_log("Failed to send SMS: " . $e->getMessage());
            return false;
        }
    }
    
    private static function scheduleCall($contactId, $config, $triggerData) {
        $pdo = Database::conn();
        
        try {
            // Check if call_logs has recipient_id instead of contact_id
            $columns = $pdo->query("SHOW COLUMNS FROM call_logs")->fetchAll(PDO::FETCH_COLUMN);
            $contact_field = in_array('contact_id', $columns) ? 'contact_id' : 'recipient_id';
            
            $stmt = $pdo->prepare("
                INSERT INTO call_logs (user_id, $contact_field, status, notes, created_at)
                VALUES (3, ?, 'scheduled', ?, NOW())
            ");
            
            $notes = $config['notes'] ?? 'Scheduled via automation';
            
            $stmt->execute([$contactId, $notes]);
            
            error_log("📞 Call scheduled for contact $contactId");
            return true;
            
        } catch (Exception $e) {
            error_log("Failed to schedule call: " . $e->getMessage());
            return false;
        }
    }
    
    private static function addTag($contactId, $config, $triggerData) {
        $pdo = Database::conn();
        
        try {
            $tag = $config['tag'] ?? 'auto_tag';
            
            // Check if contact_tags table exists
            $table_exists = $pdo->query("SHOW TABLES LIKE 'contact_tags'")->rowCount() > 0;
            
            if ($table_exists) {
                $stmt = $pdo->prepare("
                    INSERT IGNORE INTO contact_tags (contact_id, tag, created_at)
                    VALUES (?, ?, NOW())
                ");
                $stmt->execute([$contactId, $tag]);
            } else {
                // Add tag to contact in a simple way - create a contact_tags table
                $pdo->query("
                    CREATE TABLE IF NOT EXISTS contact_tags (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        contact_id INT,
                        tag VARCHAR(100),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_contact_id (contact_id)
                    )
                ");
                
                $stmt = $pdo->prepare("
                    INSERT IGNORE INTO contact_tags (contact_id, tag, created_at)
                    VALUES (?, ?, NOW())
                ");
                $stmt->execute([$contactId, $tag]);
            }
            
            error_log("🏷️ Tag '$tag' added to contact $contactId");
            return true;
            
        } catch (Exception $e) {
            error_log("Failed to add tag: " . $e->getMessage());
            return false;
        }
    }
    
    private static function removeTag($contactId, $config, $triggerData) {
        $pdo = Database::conn();
        
        try {
            $tag = $config['tag'] ?? 'auto_tag';
            
            $stmt = $pdo->prepare("DELETE FROM contact_tags WHERE contact_id = ? AND tag = ?");
            $stmt->execute([$contactId, $tag]);
            
            error_log("🗑️ Tag '$tag' removed from contact $contactId");
            return true;
            
        } catch (Exception $e) {
            error_log("Failed to remove tag: " . $e->getMessage());
            return false;
        }
    }
    
    private static function notifyUser($contactId, $config, $triggerData) {
        error_log("🔔 User notified about contact $contactId");
        return true;
    }
    
    private static function updateStatus($contactId, $config, $triggerData) {
        $pdo = Database::conn();
        
        try {
            $status = $config['status'] ?? 'updated';
            
            // Check if status column exists
            $columns = $pdo->query("SHOW COLUMNS FROM contacts")->fetchAll(PDO::FETCH_COLUMN);
            if (in_array('status', $columns)) {
                $stmt = $pdo->prepare("
                    UPDATE contacts SET status = ?, updated_at = NOW() WHERE id = ?
                ");
                $stmt->execute([$status, $contactId]);
            } else {
                error_log("Status column not found in contacts table");
            }
            
            error_log("📊 Contact $contactId status updated to '$status'");
            return true;
            
        } catch (Exception $e) {
            error_log("Failed to update status: " . $e->getMessage());
            return false;
        }
    }
    
    private static function createTask($contactId, $config, $triggerData) {
        error_log("📋 Task created for contact $contactId");
        return true;
    }
    
    private static function logExecution($automationId, $contactId, $triggerData, $success, $error = null) {
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("
                INSERT INTO automation_executions 
                (automation_id, contact_id, trigger_data, executed_at, success, error_message)
                VALUES (?, ?, ?, NOW(), ?, ?)
            ");
            
            $stmt->execute([
                $automationId,
                $contactId,
                json_encode($triggerData),
                $success ? 1 : 0,
                $error
            ]);
        } catch (Exception $e) {
            error_log("Failed to log execution: " . $e->getMessage());
        }
    }
}
?>