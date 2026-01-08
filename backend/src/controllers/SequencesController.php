<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class SequencesController {
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    public static function index(): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        $stmt = $pdo->prepare("SELECT * FROM sequences WHERE {$scope['col']} = ? ORDER BY created_at DESC");
        $stmt->execute([$scope['val']]);
        $rows = $stmt->fetchAll();
        Response::json(['items' => array_map(fn($s) => self::map($s), $rows)]);
    }

    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $b = get_json_body();
        $name = trim($b['name'] ?? '');
        $status = $b['status'] ?? 'draft';
        $steps = $b['steps'] ?? [];
        $campaignId = $b['campaign_id'] ?? ($b['campaignId'] ?? null);
        if ($campaignId !== null) { $campaignId = (int)$campaignId; }
        
        if (!$name) Response::error('Missing name', 422);
        
        $pdo = Database::conn();
        
        // Validate campaign ownership if provided
        $scope = self::getWorkspaceScope();
        if ($campaignId) {
            $chk = $pdo->prepare("SELECT 1 FROM campaigns WHERE id = ? AND {$scope['col']} = ?");
            $chk->execute([$campaignId, $scope['val']]);
            if (!$chk->fetch()) Response::error('Invalid campaign', 422);
        }
        
        // Start transaction
        $pdo->beginTransaction();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
        
        try {
            // Create sequence
            $stmt = $pdo->prepare('INSERT INTO sequences (user_id, workspace_id, name, status, campaign_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
            $stmt->execute([$userId, $workspaceId, $name, $status, $campaignId]);
            $sequenceId = (int)$pdo->lastInsertId();
            
            // Create sequence steps if provided
            if (!empty($steps)) {
                $stepStmt = $pdo->prepare('INSERT INTO sequence_steps (sequence_id, subject, content, delay_days, step_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
                
                foreach ($steps as $index => $step) {
                    $subject = trim($step['subject'] ?? '');
                    $content = trim($step['content'] ?? '');
                    $delayDays = (int)($step['delay_days'] ?? 0);
                    $order = (int)($step['order'] ?? $index + 1);
                    
                    $stepStmt->execute([$sequenceId, $subject, $content, $delayDays, $order]);
                }
            }
            
            $pdo->commit();
            
            // Return the created sequence with steps
            $stmt = $pdo->prepare('SELECT * FROM sequences WHERE id = ?');
            $stmt->execute([$sequenceId]);
            $sequence = $stmt->fetch();
            
            Response::json(self::mapWithSteps($sequence), 201);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to create sequence: ' . $e->getMessage(), 500);
        }
    }

    public static function show(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        $stmt = $pdo->prepare("SELECT * FROM sequences WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $sequence = $stmt->fetch();
        if (!$sequence) Response::error('Sequence not found', 404);
        Response::json(self::mapWithSteps($sequence));
    }

    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $b = get_json_body();
        $name = trim($b['name'] ?? '');
        $status = $b['status'] ?? '';
        $steps = $b['steps'] ?? null;
        $campaignProvided = array_key_exists('campaign_id', $b) || array_key_exists('campaignId', $b);
        $campaignId = $b['campaign_id'] ?? ($b['campaignId'] ?? null);
        if ($campaignProvided) { $campaignId = $campaignId !== null ? (int)$campaignId : null; }
        
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Check if sequence exists and belongs to user/workspace
        $stmt = $pdo->prepare("SELECT * FROM sequences WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $sequence = $stmt->fetch();
        if (!$sequence) Response::error('Sequence not found', 404);
        
        // Validate campaign ownership if provided
        if ($campaignProvided && $campaignId) {
            $chk = $pdo->prepare("SELECT 1 FROM campaigns WHERE id = ? AND {$scope['col']} = ?");
            $chk->execute([$campaignId, $scope['val']]);
            if (!$chk->fetch()) Response::error('Invalid campaign', 422);
        }
        
        // Start transaction
        $pdo->beginTransaction();
        
        try {
            // Update sequence
            $updates = [];
            $params = [];
            
            if ($name) {
                $updates[] = 'name = ?';
                $params[] = $name;
            }
            if ($status) {
                $updates[] = 'status = ?';
                $params[] = $status;
            }
            if ($campaignProvided) {
                $updates[] = 'campaign_id = ?';
                $params[] = $campaignId; // can be null
            }
            
            if (!empty($updates)) {
                $updates[] = 'updated_at = CURRENT_TIMESTAMP';
                $params[] = $id;
                $params[] = $scope['val'];
                
                $sql = 'UPDATE sequences SET ' . implode(', ', $updates) . " WHERE id = ? AND {$scope['col']} = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }
            
            // Update steps if provided
            if ($steps !== null) {
                // Delete existing steps
                $stmt = $pdo->prepare('DELETE FROM sequence_steps WHERE sequence_id = ?');
                $stmt->execute([$id]);
                
                // Insert new steps
                if (!empty($steps)) {
                    $stepStmt = $pdo->prepare('INSERT INTO sequence_steps (sequence_id, subject, content, delay_days, step_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
                    
                    foreach ($steps as $index => $step) {
                        $subject = trim($step['subject'] ?? '');
                        $content = trim($step['content'] ?? '');
                        $delayDays = (int)($step['delay_days'] ?? 0);
                        $order = (int)($step['order'] ?? $index + 1);
                        
                        $stepStmt->execute([$id, $subject, $content, $delayDays, $order]);
                    }
                }
            }
            
            $pdo->commit();
            
            // Return updated sequence
            $stmt = $pdo->prepare('SELECT * FROM sequences WHERE id = ?');
            $stmt->execute([$id]);
            $sequence = $stmt->fetch();
            
            Response::json(self::mapWithSteps($sequence));
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to update sequence: ' . $e->getMessage(), 500);
        }
    }

    public static function delete(string $id): void {
        Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        $stmt = $pdo->prepare("DELETE FROM sequences WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        Response::json(['ok' => true]);
    }

    private static function map(array $s): array {
        $campaignId = $s['campaign_id'] ?? null;
        $campaignName = null;
        if (!empty($campaignId)) {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT name FROM campaigns WHERE id = ?');
            $stmt->execute([$campaignId]);
            $row = $stmt->fetch();
            if ($row) $campaignName = $row['name'] ?? null;
        }
        return [
            'id' => (string)$s['id'],
            'name' => $s['name'],
            'status' => $s['status'],
            'created_at' => $s['created_at'],
            'campaign_id' => $campaignId,
            'campaign_name' => $campaignName,
        ];
    }

    private static function mapWithSteps(array $s): array {
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM sequence_steps WHERE sequence_id = ? ORDER BY step_order ASC');
        $stmt->execute([$s['id']]);
        $steps = $stmt->fetchAll();
        $campaignId = $s['campaign_id'] ?? null;
        $campaignName = null;
        if (!empty($campaignId)) {
            $cstmt = $pdo->prepare('SELECT name FROM campaigns WHERE id = ?');
            $cstmt->execute([$campaignId]);
            $crow = $cstmt->fetch();
            if ($crow) $campaignName = $crow['name'] ?? null;
        }
        
        return [
            'id' => (string)$s['id'],
            'name' => $s['name'],
            'status' => $s['status'],
            'created_at' => $s['created_at'],
            'campaign_id' => $campaignId,
            'campaign_name' => $campaignName,
            'steps' => array_map(function($step) {
                return [
                    'id' => (string)$step['id'],
                    'subject' => $step['subject'],
                    'content' => $step['content'],
                    'delay_days' => (int)$step['delay_days'],
                    'order' => (int)$step['step_order'],
                ];
            }, $steps)
        ];
    }
}