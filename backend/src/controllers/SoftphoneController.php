<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class SoftphoneController {
    use WorkspaceScoped;
    public static function getSpeedDials(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Use workspace scoping for tenant isolation
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];

        $stmt = $pdo->prepare('SELECT id, label, phone_number, notes, sort_order, metadata, updated_at FROM call_speed_dials WHERE workspace_id = ? ORDER BY sort_order ASC, label ASC');
        $stmt->execute([$workspaceId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $contacts = array_map(function ($row) {
            return [
                'id' => (string) $row['id'],
                'name' => $row['label'],
                'number' => $row['phone_number'],
                'notes' => $row['notes'],
                'source' => 'custom',
                'updatedAt' => $row['updated_at'],
                'metadata' => $row['metadata'] ? json_decode($row['metadata'], true) : null
            ];
        }, $rows);

        if (empty($contacts)) {
            $contacts = self::recentNumbersFallback($pdo, $workspaceId);
        }

        Response::json(['contacts' => $contacts]);
    }

    public static function createSpeedDial(): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_body();
        
        // Use workspace scoping
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];

        $label = trim($data['label'] ?? '');
        $number = self::sanitizePhoneNumber($data['phone_number'] ?? $data['number'] ?? '');
        $sortOrder = isset($data['sort_order']) ? (int) $data['sort_order'] : 0;
        $notes = trim($data['notes'] ?? '');
        $metadata = !empty($data['metadata']) && is_array($data['metadata']) ? json_encode($data['metadata']) : null;

        if ($label === '' || $number === '') {
            Response::json(['error' => 'Label and phone number are required'], 422);
            return;
        }

        $pdo = Database::conn();
        $stmt = $pdo->prepare('INSERT INTO call_speed_dials (user_id, workspace_id, label, phone_number, notes, sort_order, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
        $stmt->execute([$userId, $workspaceId, $label, $number, $notes ?: null, $sortOrder, $metadata]);

        $id = (string) $pdo->lastInsertId();
        Response::json([
            'id' => $id,
            'name' => $label,
            'number' => $number,
            'notes' => $notes,
            'source' => 'custom'
        ], 201);
    }

    public static function updateSpeedDial(string $id): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_body();
        
        // Use workspace scoping
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];

        $pdo = Database::conn();

        $stmt = $pdo->prepare('SELECT id FROM call_speed_dials WHERE id = ? AND workspace_id = ?');
        $stmt->execute([$id, $workspaceId]);
        if (!$stmt->fetch()) {
            Response::json(['error' => 'Speed dial entry not found'], 404);
            return;
        }

        $fields = [];
        $params = [];

        if (isset($data['label'])) {
            $fields[] = 'label = ?';
            $params[] = trim($data['label']);
        }

        if (isset($data['phone_number']) || isset($data['number'])) {
            $number = self::sanitizePhoneNumber($data['phone_number'] ?? $data['number']);
            if ($number === '') {
                Response::json(['error' => 'Invalid phone number'], 422);
                return;
            }
            $fields[] = 'phone_number = ?';
            $params[] = $number;
        }

        if (array_key_exists('notes', $data)) {
            $fields[] = 'notes = ?';
            $params[] = trim($data['notes']);
        }

        if (isset($data['sort_order'])) {
            $fields[] = 'sort_order = ?';
            $params[] = (int) $data['sort_order'];
        }

        if (isset($data['metadata'])) {
            $fields[] = 'metadata = ?';
            $params[] = is_array($data['metadata']) ? json_encode($data['metadata']) : $data['metadata'];
        }

        if (empty($fields)) {
            Response::json(['error' => 'No valid fields provided'], 400);
            return;
        }

        $fields[] = 'updated_at = NOW()';

        $params[] = $id;
        $params[] = $workspaceId;

        $sql = 'UPDATE call_speed_dials SET ' . implode(', ', $fields) . ' WHERE id = ? AND workspace_id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        Response::json(['success' => true]);
    }

    public static function deleteSpeedDial(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Use workspace scoping
        $scope = self::workspaceWhere();
        $workspaceId = $scope['params'][0];

        $stmt = $pdo->prepare('DELETE FROM call_speed_dials WHERE id = ? AND workspace_id = ?');
        $stmt->execute([$id, $workspaceId]);

        if ($stmt->rowCount() === 0) {
            Response::json(['error' => 'Speed dial entry not found'], 404);
            return;
        }

        Response::json(['success' => true]);
    }

    private static function sanitizePhoneNumber(?string $input): string {
        if ($input === null) {
            return '';
        }

        $cleaned = preg_replace('/[^0-9+]/', '', $input);
        if (!$cleaned) {
            return '';
        }

        if ($cleaned[0] !== '+') {
            $cleaned = '+' . $cleaned;
        }

        return $cleaned;
    }

    private static function recentNumbersFallback(PDO $pdo, int $workspaceId): array {
        $sql = "
            SELECT phone_number, COUNT(*) as total_calls, MAX(created_at) as last_call
            FROM call_logs
            WHERE workspace_id = :ws_id AND phone_number IS NOT NULL AND phone_number <> ''
            GROUP BY phone_number
            ORDER BY total_calls DESC, last_call DESC
            LIMIT 6
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['ws_id' => $workspaceId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(function ($row) {
            $number = $row['phone_number'];
            return [
                'id' => 'recent-' . md5($number),
                'name' => $number,
                'number' => $number,
                'source' => 'recent',
                'metadata' => [
                    'totalCalls' => (int) $row['total_calls']
                ]
            ];
        }, $rows ?: []);
    }
}
