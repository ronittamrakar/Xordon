<?php
namespace Xordon\Controllers;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';
require_once __DIR__ . '/../services/AISettingsService.php';

use Xordon\Services\AISettingsService;
use Auth;
use TenantContext;
use Response;

class AISettingsController {
    
    /**
     * Get AI settings for the current workspace
     * GET /api/ai/settings
     */
    public static function getSettings(): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $settings = AISettingsService::getSettings($workspaceId);
        
        if (!$settings) {
            Response::error('Settings not found', 404);
            return;
        }
        
        // Parse JSON fields
        $settings['call_answering_hours'] = json_decode($settings['call_answering_hours'] ?? '[]', true) ?: [];
        $settings['escalation_keywords'] = json_decode($settings['escalation_keywords'] ?? '[]', true) ?: [];
        
        Response::json($settings);
    }
    
    /**
     * Update AI settings
     * PUT /api/ai/settings
     */
    public static function updateSettings(): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            Response::error('Invalid input', 400);
            return;
        }
        
        $success = AISettingsService::updateSettings($workspaceId, $input);
        
        if ($success) {
            $settings = AISettingsService::getSettings($workspaceId);
            
            // Parse JSON fields
            $settings['call_answering_hours'] = json_decode($settings['call_answering_hours'] ?? '[]', true) ?: [];
            $settings['escalation_keywords'] = json_decode($settings['escalation_keywords'] ?? '[]', true) ?: [];
            
            Response::json([
                'success' => true,
                'message' => 'Settings updated successfully',
                'data' => $settings
            ]);
        } else {
            Response::error('Failed to update settings', 500);
        }
    }
    
    /**
     * Check if a specific AI feature is enabled
     * GET /api/ai/settings/feature/{feature}
     */
    public static function checkFeature(string $feature): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $enabled = AISettingsService::isFeatureEnabled($workspaceId, $feature);
        
        Response::json([
            'feature' => $feature,
            'enabled' => $enabled
        ]);
    }
    
    /**
     * Get chatbot configuration
     * GET /api/ai/chatbot/config
     */
    public static function getChatbotConfig(): void {
        try {
            $ctx = TenantContext::resolveOrFail();
            $workspaceId = $ctx->workspaceId;
        } catch (\Exception $e) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $config = AISettingsService::getChatbotConfig($workspaceId);
        
        if (!$config) {
            Response::error('Chatbot not enabled or configured', 404);
            return;
        }
        
        Response::json($config);
    }
}
