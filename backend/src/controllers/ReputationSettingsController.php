<?php
namespace Xordon\Controllers;

use Xordon\Database;
use Xordon\Response;
use PDO;

class ReputationSettingsController {
    
    /**
     * Get all reputation settings and AI agents
     */
    public function get() {
        return self::getSettings();
    }

    public static function getSettings() {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            // Get settings
            $stmt = $db->prepare("SELECT * FROM reputation_settings WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($settings) {
                $settings['review_platforms'] = json_decode($settings['review_platforms'] ?? '[]', true);
            } else {
                // Initialize default settings if none exist
                $settings = [
                    'workspace_id' => $workspaceId,
                    'ai_mode' => 'off',
                    'drip_mode_enabled' => 0,
                    'review_link' => '',
                    'review_balancing_enabled' => 0,
                    'review_platforms' => [],
                    'sms_enabled' => 1,
                    'sms_timing' => 'immediately',
                    'sms_repeat' => 'dont-repeat',
                    'sms_max_retries' => 3,
                    'email_enabled' => 1,
                    'email_timing' => 'immediately',
                    'email_repeat' => 'dont-repeat',
                    'email_max_retries' => 1,
                    'whatsapp_enabled' => 0,
                    'spam_detection_enabled' => 1
                ];
                
                // Save defaults
                $insertStmt = $db->prepare("INSERT INTO reputation_settings (workspace_id) VALUES (?)");
                $insertStmt->execute([$workspaceId]);
            }
            
            // Get AI Agents
            $agentStmt = $db->prepare("SELECT * FROM reputation_ai_agents WHERE workspace_id = ? ORDER BY created_at DESC");
            $agentStmt->execute([$workspaceId]);
            $agents = $agentStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($agents as &$agent) {
                $agent['tone'] = json_decode($agent['tone'] ?? '[]', true);
                $agent['review_sources'] = json_decode($agent['review_sources'] ?? '[]', true);
                $agent['review_types'] = json_decode($agent['review_types'] ?? '[]', true);
            }
            
            // Get templates
            $tmplStmt = $db->prepare("SELECT * FROM review_request_templates WHERE workspace_id = ? OR workspace_id IS NULL ORDER BY created_at DESC");
            $tmplStmt->execute([$workspaceId]);
            $templates = $tmplStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($templates as &$tmpl) {
                $tmpl['variables'] = json_decode($tmpl['variables'] ?? '[]', true);
            }
            
            return Response::json([
                'settings' => $settings,
                'ai_agents' => $agents,
                'templates' => $templates
            ]);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Save reputation settings
     */
    public function update() {
        return self::saveSettings();
    }

    public static function saveSettings() {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            $data = json_decode(file_get_contents('php://input'), true);
            
            $allowedFields = [
                'ai_mode', 'drip_mode_enabled', 'review_link', 'review_balancing_enabled',
                'sms_enabled', 'sms_timing', 'sms_repeat', 'sms_max_retries',
                'email_enabled', 'email_timing', 'email_repeat', 'email_max_retries',
                'whatsapp_enabled', 'spam_detection_enabled'
            ];
            
            $updates = [];
            $params = [];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (isset($data['review_platforms'])) {
                $updates[] = "review_platforms = ?";
                $params[] = json_encode($data['review_platforms']);
            }
            
            if (empty($updates)) {
                return Response::json(['error' => 'No fields to update'], 400);
            }
            
            $params[] = $workspaceId;
            $sql = "UPDATE reputation_settings SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE workspace_id = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json(['success' => true, 'message' => 'Settings saved successfully']);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Save AI Agent
     */
    public static function saveAIAgent() {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['name']) || !isset($data['instructions'])) {
                return Response::json(['error' => 'Missing agent name or instructions'], 400);
            }
            
            $tone = json_encode($data['tone'] ?? []);
            $sources = json_encode($data['review_sources'] ?? []);
            $types = json_encode($data['review_types'] ?? []);
            
            if (isset($data['id']) && !empty($data['id'])) {
                $stmt = $db->prepare("
                    UPDATE reputation_ai_agents 
                    SET name = ?, instructions = ?, tone = ?, language = ?, 
                        review_sources = ?, review_types = ?, footer = ?,
                        is_active = ?, updated_at = NOW() 
                    WHERE id = ? AND workspace_id = ?
                ");
                $stmt->execute([
                    $data['name'], $data['instructions'], $tone, 
                    $data['language'] ?? 'en', $sources, $types, $data['footer'] ?? '',
                    isset($data['is_active']) ? (int)$data['is_active'] : 1,
                    $data['id'], $workspaceId
                ]);
                $id = $data['id'];
            } else {
                $stmt = $db->prepare("
                    INSERT INTO reputation_ai_agents (
                        workspace_id, name, instructions, tone, language, 
                        review_sources, review_types, footer, is_active, 
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([
                    $workspaceId, $data['name'], $data['instructions'], 
                    $tone, $data['language'] ?? 'en', $sources, $types,
                    $data['footer'] ?? '', isset($data['is_active']) ? (int)$data['is_active'] : 1
                ]);
                $id = $db->lastInsertId();
            }
            
            return Response::json(['success' => true, 'id' => (int)$id, 'message' => 'AI Agent saved successfully']);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Delete AI Agent
     */
    public static function deleteAIAgent($id) {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $stmt = $db->prepare("DELETE FROM reputation_ai_agents WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            return Response::json(['success' => true]);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }
}

