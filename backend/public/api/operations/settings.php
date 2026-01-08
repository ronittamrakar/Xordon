<?php
/**
 * Operations Industry Settings Handler
 * 
 * Handles CRUD operations for industry-specific settings.
 */

function handleOperationsIndustrySettings($opsDb, $method, $userId, $workspaceId) {
    if ($method === 'GET') {
        $stmt = $opsDb->prepare("SELECT * FROM fsm_industry_settings WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($settings) {
            $settings['settings'] = json_decode($settings['settings'] ?? '{}', true);
        } else {
            // Return default settings if none exist
            $settings = [
                'workspace_id' => $workspaceId,
                'industry_type' => null,
                'settings' => []
            ];
        }
        
        echo json_encode($settings);
        
    } elseif ($method === 'POST' || $method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Check if settings exist
        $stmt = $opsDb->prepare("SELECT id FROM fsm_industry_settings WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update
            $stmt = $opsDb->prepare("
                UPDATE fsm_industry_settings 
                SET industry_type = ?, settings = ?
                WHERE workspace_id = ?
            ");
            $stmt->execute([
                $data['industry_type'] ?? null,
                json_encode($data['settings'] ?? []),
                $workspaceId
            ]);
        } else {
            // Insert
            $stmt = $opsDb->prepare("
                INSERT INTO fsm_industry_settings (workspace_id, user_id, industry_type, settings)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $userId,
                $data['industry_type'] ?? null,
                json_encode($data['settings'] ?? [])
            ]);
        }
        
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
