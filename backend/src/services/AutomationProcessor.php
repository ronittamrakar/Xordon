<?php
/**
 * Automation Processor
 * Handles execution of follow-up automations based on trigger events
 */

require_once __DIR__ . "\\..\\Database.php";
require_once __DIR__ . "\\..\\Response.php";

class AutomationProcessor {
    
    /**
     * Process a trigger event and execute matching automations
     */
    public static function processTrigger($channel, $triggerType, $contactId, $triggerData = []) {
        $pdo = Database::conn();
        
        // Find matching automations for this user
        $stmt = $pdo->prepare("
            SELECT * FROM followup_automations 
            WHERE channel = ? 
            AND trigger_type = ? 
            AND is_active = 1
            ORDER BY priority DESC
        ");
        $stmt->execute([$channel, $triggerType]);
        $automations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $executed = 0;
        
        foreach ($automations as $automation) {
            // Check trigger conditions
            if (self::evaluateConditions($automation["trigger_conditions"], $triggerData)) {
                // Execute the automation
                $success = self::executeAutomation($automation, $contactId, $triggerData);
                
                // Log execution
                self::logExecution($automation["id"], $contactId, $triggerData, $success);
                
                if ($success) $executed++;
            }
        }
        
        return $executed;
    }
    
    /**
     * Evaluate trigger conditions
     */
    private static function evaluateConditions($conditions, $triggerData) {
        // Handle JSON string
        if (is_string($conditions)) {
            $conditions = json_decode($conditions, true) ?: [];
        }
        
        if (empty($conditions)) return true;
        
        foreach ($conditions as $key => $value) {
            if (!isset($triggerData[$key]) || $triggerData[$key] != $value) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Execute automation action
     */
    private static function executeAutomation($automation, $contactId, $triggerData) {
        try {
            $action = $automation["action_type"];
            $config = json_decode($automation["action_config"], true) ?: [];
            
            // Add delay if specified
            if ($automation["delay_amount"] > 0) {
                $delay = $automation["delay_amount"] . " " . $automation["delay_unit"];
                // In production, this would use a job queue
                error_log("Automation #{$automation["id"]} scheduled with $delay delay");
            }
            
            // Execute based on action type
            switch ($action) {
                case "send_email":
                    return self::sendEmail($contactId, $config);
                case "send_sms":
                    return self::sendSMS($contactId, $config);
                case "schedule_call":
                    return self::scheduleCall($contactId, $config);
                case "add_tag":
                    return self::addTag($contactId, $config);
                case "remove_tag":
                    return self::removeTag($contactId, $config);
                case "notify_user":
                    return self::notifyUser($contactId, $config);
                case "update_status":
                    return self::updateStatus($contactId, $config);
                default:
                    error_log("Unknown automation action: $action");
                    return false;
            }
            
        } catch (Exception $e) {
            error_log("Automation execution failed: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Log automation execution
     */
    private static function logExecution($automationId, $contactId, $triggerData, $success, $error = null) {
        $pdo = Database::conn();
        
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
    }
    
    // Action implementation methods (simplified for testing)
    private static function sendEmail($contactId, $config) {
        error_log("Sending email to contact $contactId: " . json_encode($config));
        return true;
    }
    
    private static function sendSMS($contactId, $config) {
        error_log("Sending SMS to contact $contactId: " . json_encode($config));
        return true;
    }
    
    private static function scheduleCall($contactId, $config) {
        error_log("Scheduling call for contact $contactId: " . json_encode($config));
        return true;
    }
    
    private static function addTag($contactId, $config) {
        error_log("Adding tag to contact $contactId: " . json_encode($config));
        return true;
    }
    
    private static function removeTag($contactId, $config) {
        error_log("Removing tag from contact $contactId: " . json_encode($config));
        return true;
    }
    
    private static function notifyUser($contactId, $config) {
        error_log("Notifying user about contact $contactId: " . json_encode($config));
        return true;
    }
    
    private static function updateStatus($contactId, $config) {
        error_log("Updating status for contact $contactId: " . json_encode($config));
        return true;
    }
}
?>