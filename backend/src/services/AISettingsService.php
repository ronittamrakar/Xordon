<?php
namespace Xordon\Services;

require_once __DIR__ . '/../Database.php';

use Xordon\Database;
use PDO;

class AISettingsService {
    
    /**
     * Get AI settings for a workspace
     */
    public static function getSettings(int $workspaceId): ?array {
        $sql = "SELECT * FROM ai_settings WHERE workspace_id = ?";
        $result = Database::first($sql, [$workspaceId]);
        
        // If no settings exist, create default ones
        if (!$result) {
            self::createDefaultSettings($workspaceId);
            $result = Database::first($sql, [$workspaceId]);
        }
        
        return $result;
    }
    
    /**
     * Update AI settings
     */
    public static function updateSettings(int $workspaceId, array $settings): bool {
        $allowedFields = [
            'chatbot_enabled',
            'chatbot_name',
            'chatbot_greeting',
            'chatbot_model',
            'call_answering_enabled',
            'call_answering_hours',
            'conversation_booking_enabled',
            'analytics_insights_enabled',
            'facebook_messenger_enabled',
            'auto_response_delay',
            'escalation_keywords',
            'business_context'
        ];
        
        $updates = [];
        $params = [];
        
        foreach ($settings as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $updates[] = "$key = ?";
                // JSON encode arrays
                if (in_array($key, ['call_answering_hours', 'escalation_keywords'])) {
                    $params[] = is_array($value) ? json_encode($value) : $value;
                } else {
                    $params[] = $value;
                }
            }
        }
        
        if (empty($updates)) {
            return false;
        }
        
        $params[] = $workspaceId;
        
        $sql = "UPDATE ai_settings SET " . implode(', ', $updates) . " WHERE workspace_id = ?";
        
        try {
            $stmt = Database::conn()->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            error_log("Error updating AI settings: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Create default AI settings for a workspace
     */
    public static function createDefaultSettings(int $workspaceId): bool {
        $sql = "INSERT INTO ai_settings (
            workspace_id,
            chatbot_enabled,
            chatbot_name,
            chatbot_greeting,
            chatbot_model,
            call_answering_enabled,
            conversation_booking_enabled,
            analytics_insights_enabled,
            facebook_messenger_enabled,
            auto_response_delay
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $params = [
            $workspaceId,
            false, // chatbot_enabled
            'AI Assistant', // chatbot_name
            'Hello! How can I help you today?', // chatbot_greeting
            'gpt-4', // chatbot_model
            false, // call_answering_enabled
            false, // conversation_booking_enabled
            true, // analytics_insights_enabled
            false, // facebook_messenger_enabled
            2 // auto_response_delay
        ];
        
        try {
            $stmt = Database::conn()->prepare($sql);
            return $stmt->execute($params);
        } catch (\PDOException $e) {
            // Ignore duplicate key errors
            if ($e->getCode() == 23000) {
                return true;
            }
            error_log("Error creating AI settings: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if a specific AI feature is enabled
     */
    public static function isFeatureEnabled(int $workspaceId, string $feature): bool {
        $settings = self::getSettings($workspaceId);
        
        if (!$settings) {
            return false;
        }
        
        $featureMap = [
            'chatbot' => 'chatbot_enabled',
            'call_answering' => 'call_answering_enabled',
            'conversation_booking' => 'conversation_booking_enabled',
            'analytics_insights' => 'analytics_insights_enabled',
            'facebook_messenger' => 'facebook_messenger_enabled'
        ];
        
        $field = $featureMap[$feature] ?? null;
        
        if (!$field) {
            return false;
        }
        
        return (bool) $settings[$field];
    }
    
    /**
     * Get chatbot configuration
     */
    public static function getChatbotConfig(int $workspaceId): ?array {
        $settings = self::getSettings($workspaceId);
        
        if (!$settings || !$settings['chatbot_enabled']) {
            return null;
        }
        
        return [
            'name' => $settings['chatbot_name'],
            'greeting' => $settings['chatbot_greeting'],
            'model' => $settings['chatbot_model'],
            'auto_response_delay' => $settings['auto_response_delay'],
            'escalation_keywords' => json_decode($settings['escalation_keywords'] ?? '[]', true),
            'business_context' => $settings['business_context']
        ];
    }
}
