<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/SMSService.php';

class ConnectionsController {
    
    private static function getWorkspaceScope(): array {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return [
                'col' => 'workspace_id', 
                'val' => (int)$ctx->workspaceId,
                'userId' => $userId
            ];
        }
        return [
            'col' => 'user_id', 
            'val' => $userId,
            'userId' => $userId
        ];
    }
    
    private static function getWorkspaceId(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
    }
    
    public static function getConnections(): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();

        try {
            $connections = array_values(self::getUserConnections($scope['val'], $scope['col']));
            Response::json($connections);
        } catch (Exception $e) {
            error_log('Error getting connections: ' . $e->getMessage());
            Response::json(['error' => 'Failed to get connections'], 500);
        }
    }

    public static function getConnection(string $id): void {
        $userId = Auth::userIdOrFail();
        $connection = self::fetchConnection($id, $userId);

        if (!$connection) {
            Response::json(['error' => 'Connection not found'], 404);
            return;
        }

        Response::json($connection);
    }

    public static function createConnection(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();

        try {
            $db = Database::conn();
            $id = bin2hex(random_bytes(18));
            $name = $body['name'] ?? 'SignalWire Connection';
            $provider = $body['provider'] ?? 'signalwire';
            $config = $body['config'] ?? [];

            $workspaceId = self::getWorkspaceId();
            $stmt = $db->prepare('INSERT INTO connections (id, user_id, workspace_id, name, provider, config, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
            $stmt->execute([$id, $userId, $workspaceId, $name, $provider, json_encode($config), 'pending']);

            if ($provider === 'signalwire') {
                self::syncSignalWireSettings($userId, $config);
            }

            Response::json([
                'id' => $id,
                'user_id' => $userId,
                'name' => $name,
                'provider' => $provider,
                'config' => $config,
                'status' => 'pending'
            ]);
        } catch (Exception $e) {
            error_log('Error creating connection: ' . $e->getMessage());
            Response::json(['error' => 'Failed to create connection'], 500);
        }
    }

    public static function updateConnection(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $body = get_json_body();

        try {
            $db = Database::conn();
            $existingConnection = self::fetchConnectionScoped($id, $scope);
            if (!$existingConnection) {
                Response::json(['error' => 'Connection not found'], 404);
                return;
            }

            $updates = [];
            $params = [];

            if (isset($body['name'])) {
                $updates[] = 'name = ?';
                $params[] = $body['name'];
            }
            if (isset($body['config'])) {
                $updates[] = 'config = ?';
                $params[] = json_encode($body['config']);
                // Clear cached phone numbers when config changes to force fresh fetch
                $updates[] = 'phone_numbers = ?';
                $params[] = json_encode([]);
            }
            if (isset($body['status'])) {
                $updates[] = 'status = ?';
                $params[] = $body['status'];
            }
            if (isset($body['phone_numbers'])) {
                $updates[] = 'phone_numbers = ?';
                $params[] = json_encode($body['phone_numbers']);
            }

            $updates[] = 'updated_at = NOW()';
            $params[] = $id;
            $params[] = $userId;

            $params[count($params) - 1] = $scope['val'];
            $sql = 'UPDATE connections SET ' . implode(', ', $updates) . " WHERE id = ? AND {$scope['col']} = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            $updatedConnection = self::fetchConnectionScoped($id, $scope);
            if ($updatedConnection && $updatedConnection['provider'] === 'signalwire') {
                self::syncSignalWireSettings($userId, $updatedConnection['config']);
            }

            Response::json(['success' => true, 'message' => 'Connection updated']);
        } catch (Exception $e) {
            error_log('Error updating connection: ' . $e->getMessage());
            Response::json(['error' => 'Failed to update connection'], 500);
        }
    }

    public static function deleteConnection(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();

        try {
            $db = Database::conn();
            $stmt = $db->prepare("DELETE FROM connections WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);

            Response::json(['success' => true, 'message' => 'Connection deleted']);
        } catch (Exception $e) {
            error_log('Error deleting connection: ' . $e->getMessage());
            Response::json(['error' => 'Failed to delete connection'], 500);
        }
    }

    public static function getConnectionPhoneNumbers(string $connectionId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $connection = self::fetchConnectionScoped($connectionId, $scope);

        if (!$connection) {
            Response::json(['error' => 'Connection not found'], 404);
            return;
        }

        if ($connection['provider'] !== 'signalwire' && $connection['provider'] !== 'twilio') {
            Response::json(['error' => 'Phone number fetching not supported for this provider'], 400);
            return;
        }

        // Always try to fetch fresh numbers from SignalWire to ensure we have the latest data
        $config = self::validateSignalWireConfig($connection['config']);
        if (!$config) {
            // If config is invalid, check if we have cached numbers as fallback
            $cachedNumbers = $connection['phone_numbers'] ?? [];
            if (!empty($cachedNumbers) && is_array($cachedNumbers)) {
                Response::json(['phoneNumbers' => $cachedNumbers, 'cached' => true, 'warning' => 'Using cached data - connection config invalid']);
                return;
            }
            Response::json(['phoneNumbers' => [], 'error' => 'Invalid configuration']);
            return;
        }

        try {
            $smsService = new SMSService();
            $numbers = $smsService->getAvailableNumbers(
                $config['projectId'],
                $config['spaceUrl'],
                $config['apiToken']
            );

            // Cache the numbers in the database for future fast access
            if (!empty($numbers)) {
                self::cachePhoneNumbers($connectionId, $userId, $numbers);
            }

            Response::json(['phoneNumbers' => $numbers]);
        } catch (Exception $e) {
            error_log('Error fetching connection phone numbers: ' . $e->getMessage());
            
            // On error, try to use cached numbers as fallback
            $cachedNumbers = $connection['phone_numbers'] ?? [];
            if (!empty($cachedNumbers) && is_array($cachedNumbers)) {
                Response::json(['phoneNumbers' => $cachedNumbers, 'cached' => true, 'warning' => 'Using cached data - API fetch failed: ' . $e->getMessage()]);
                return;
            }
            
            // Return empty array instead of error to prevent blocking the UI
            Response::json(['phoneNumbers' => [], 'error' => $e->getMessage()]);
        }
    }

    private static function cachePhoneNumbers(string $connectionId, string $userId, array $numbers): void {
        try {
            $db = Database::conn();
            $stmt = $db->prepare('UPDATE connections SET phone_numbers = ?, updated_at = NOW() WHERE id = ? AND user_id = ?');
            $stmt->execute([json_encode($numbers), $connectionId, $userId]);
        } catch (Exception $e) {
            error_log('Failed to cache phone numbers: ' . $e->getMessage());
        }
    }

    public static function getConnectionToken(string $connectionId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        $connection = self::fetchConnectionScoped($connectionId, $scope);

        if (!$connection) {
            Response::json(['error' => 'Connection not found'], 404);
            return;
        }

        if ($connection['provider'] !== 'signalwire') {
            Response::json(['error' => 'Token generation only supported for SignalWire'], 400);
            return;
        }

        $config = self::validateSignalWireConfig($connection['config']);
        if (!$config) {
            return;
        }

        try {
            // Generate a simple JWT (Verto-style or specialized for SignalWire SDK)
            // Header
            $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
            $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));

            // Payload
            // Using userId as part of the identity allows this user to be dialed via <Client>user_{id}</Client>
            $identity = "user_" . $userId;
            $payload = json_encode([
                'iss' => $config['projectId'],
                'sub' => $identity,
                'exp' => time() + (60 * 60 * 12), // 12 hours
            ]);
            $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

            // Signature
            $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $config['apiToken'], true);
            $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

            $token = $base64Header . "." . $base64Payload . "." . $base64Signature;

            Response::json([
                'token' => $token,
                'identity' => $identity,
                'projectId' => $config['projectId']
            ]);
        } catch (Exception $e) {
            error_log('Error generating SignalWire token: ' . $e->getMessage());
            Response::json(['error' => 'Failed to generate token'], 500);
        }
    }

    public static function testConnection(string $connectionId): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();

        if (!$connectionId) {
            Response::json(['error' => 'Connection ID is required'], 400);
            return;
        }

        error_log("[ConnectionsController] Testing connection $connectionId for user $userId (scope: {$scope['col']}={$scope['val']})");

        $connection = self::fetchConnectionScoped($connectionId, $scope);
        if (!$connection) {
            error_log("[ConnectionsController] Connection $connectionId not found in scope");
            Response::json(['error' => 'Connection not found'], 404);
            return;
        }

        if ($connection['provider'] !== 'signalwire') {
            Response::json(['error' => 'Invalid connection configuration'], 400);
            return;
        }

        $config = self::validateSignalWireConfig($connection['config']);
        if (!$config) {
            return;
        }

        try {
            $smsService = new SMSService();
            $numbers = $smsService->getAvailableNumbers(
                $config['projectId'],
                $config['spaceUrl'],
                $config['apiToken']
            );

            // Update connection status to 'active' in database
            $pdo = Database::conn();
            if ($scope['col'] === 'workspace_id') {
                $stmt = $pdo->prepare("UPDATE connections SET status = ?, phone_numbers = ?, updated_at = NOW() WHERE id = ? AND (workspace_id = ? OR (workspace_id IS NULL AND user_id = ?))");
                $stmt->execute(['active', json_encode($numbers), $connectionId, $scope['val'], $scope['userId']]);
            } else {
                $stmt = $pdo->prepare("UPDATE connections SET status = ?, phone_numbers = ?, updated_at = NOW() WHERE id = ? AND user_id = ?");
                $stmt->execute(['active', json_encode($numbers), $connectionId, $scope['val']]);
            }

            Response::json([
                'success' => true,
                'message' => 'Successfully connected to SignalWire',
                'availableNumbers' => $numbers
            ]);
        } catch (Exception $e) {
            error_log("[ConnectionsController] SignalWire test failed: " . $e->getMessage());
            // Update connection status to 'error' in database
            $pdo = Database::conn();
            if ($scope['col'] === 'workspace_id') {
                $stmt = $pdo->prepare("UPDATE connections SET status = ?, updated_at = NOW() WHERE id = ? AND (workspace_id = ? OR (workspace_id IS NULL AND user_id = ?))");
                $stmt->execute(['error', $connectionId, $scope['val'], $scope['userId']]);
            } else {
                $stmt = $pdo->prepare("UPDATE connections SET status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?");
                $stmt->execute(['error', $connectionId, $scope['val']]);
            }

            Response::json([
                'success' => false,
                'error' => 'Failed to connect to SignalWire: ' . $e->getMessage()
            ], 400);
        }
    }

    public static function syncConnection(string $id): void {
        $userId = Auth::userIdOrFail();
        $scope = self::getWorkspaceScope();
        
        $connection = self::fetchConnectionScoped($id, $scope);

        if (!$connection) {
            Response::json(['error' => 'Connection not found'], 404);
            return;
        }

        if ($connection['provider'] !== 'signalwire') {
            Response::json(['error' => 'Sync not supported for this provider'], 400);
            return;
        }

        $config = self::validateSignalWireConfig($connection['config']);
        if (!$config) {
            return;
        }

        try {
            $smsService = new SMSService();
            $numbers = $smsService->getAvailableNumbers(
                $config['projectId'],
                $config['spaceUrl'],
                $config['apiToken']
            );

            $connection['status'] = 'active';
            $connection['lastTested'] = date('Y-m-d H:i:s');
            $connection['errorMessage'] = null;
            $connection['phoneNumbers'] = $numbers; // Cache the phone numbers

            self::storeConnectionExtended($userId, $connection, $scope);
            
            // Also cache in the dedicated method for consistency
            self::cachePhoneNumbers($id, $userId, $numbers);

            Response::json([
                'success' => true,
                'message' => 'Connection synced successfully',
                'connection' => $connection,
                'availableNumbers' => $numbers
            ]);
        } catch (Exception $e) {
            $connection['status'] = 'error';
            $connection['errorMessage'] = $e->getMessage();
            self::storeConnection($userId, $connection);

            Response::json([
                'success' => false,
                'error' => 'Failed to sync connection: ' . $e->getMessage(),
                'connection' => $connection
            ], 400);
        }
    }

    public static function testTwilioConnection(): void {
        Auth::userIdOrFail();
        $body = get_json_body();
        $required = ['accountSid', 'authToken', 'phoneNumber'];

        foreach ($required as $field) {
            if (empty($body[$field])) {
                Response::json(['error' => "Missing required field: $field"], 400);
                return;
            }
        }

        try {
            $smsService = new SMSService();
            $isValid = $smsService->testTwilioConnection(
                $body['accountSid'],
                $body['authToken'],
                $body['phoneNumber']
            );

            Response::json([
                'success' => true,
                'valid' => $isValid,
                'message' => $isValid ? 'Twilio connection successful' : 'Twilio connection failed'
            ]);
        } catch (Exception $e) {
            error_log('Error testing Twilio connection: ' . $e->getMessage());
            Response::json([
                'success' => false,
                'valid' => false,
                'error' => 'Failed to test Twilio connection'
            ], 500);
        }
    }

    private static function getUserConnections($scopeVal, string $scopeCol = 'user_id'): array {
        $pdo = Database::conn();
        
        // If we are searching by workspace, we should ALSO find connections that have NO workspace but belong to the user
        if ($scopeCol === 'workspace_id') {
            $userId = Auth::userId();
            $stmt = $pdo->prepare("SELECT * FROM connections WHERE (workspace_id = ? OR (workspace_id IS NULL AND user_id = ?))");
            $stmt->execute([$scopeVal, $userId]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM connections WHERE {$scopeCol} = ?");
            $stmt->execute([$scopeVal]);
        }
        
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $connections = [];
        foreach ($rows as $row) {
            $row['config'] = json_decode($row['config'], true) ?: [];
            $row['phone_numbers'] = json_decode($row['phone_numbers'] ?? '[]', true) ?: [];
            $row['phoneNumbers'] = $row['phone_numbers'];
            $row['lastTested'] = $row['last_sync_at'] ?? null;
            $row['errorMessage'] = $row['error_message'] ?? null;
            $connections[$row['id']] = $row;
        }

        return $connections;
    }

    private static function fetchConnection(string $id, string $userId): ?array {
        $db = Database::conn();
        $stmt = $db->prepare('SELECT * FROM connections WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $connection = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$connection) {
            return null;
        }

        $connection['config'] = json_decode($connection['config'], true) ?: [];
        if ($connection['phone_numbers']) {
            $connection['phone_numbers'] = json_decode($connection['phone_numbers'], true);
        }

        return $connection;
    }
    
    private static function fetchConnectionScoped(string $id, array $scope): ?array {
        $db = Database::conn();
        
        if ($scope['col'] === 'workspace_id') {
            $stmt = $db->prepare("SELECT * FROM connections WHERE id = ? AND (workspace_id = ? OR (workspace_id IS NULL AND user_id = ?))");
            $stmt->execute([$id, $scope['val'], $scope['userId']]);
        } else {
            $stmt = $db->prepare("SELECT * FROM connections WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
        }
        
        $connection = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$connection) {
            return null;
        }

        $connection['config'] = json_decode($connection['config'], true) ?: [];
        if ($connection['phone_numbers']) {
            $connection['phone_numbers'] = json_decode($connection['phone_numbers'], true);
        }

        return $connection;
    }

    private static function storeConnectionExtended(string $userId, array $connection, array $scope): void {
        $db = Database::conn();
        if ($scope['col'] === 'workspace_id') {
            $stmt = $db->prepare('UPDATE connections SET config = ?, status = ?, last_sync_at = ?, phone_numbers = ?, updated_at = NOW() WHERE id = ? AND (workspace_id = ? OR (workspace_id IS NULL AND user_id = ?))');
            $stmt->execute([
                json_encode($connection['config']),
                $connection['status'],
                $connection['lastTested'] ?? null,
                json_encode($connection['phoneNumbers'] ?? []),
                $connection['id'],
                $scope['val'],
                $userId
            ]);
        } else {
            $stmt = $db->prepare('UPDATE connections SET config = ?, status = ?, last_sync_at = ?, phone_numbers = ?, updated_at = NOW() WHERE id = ? AND user_id = ?');
            $stmt->execute([
                json_encode($connection['config']),
                $connection['status'],
                $connection['lastTested'] ?? null,
                json_encode($connection['phoneNumbers'] ?? []),
                $connection['id'],
                $userId
            ]);
        }
    }

    private static function storeConnection(string $userId, array $connection): void {
        $db = Database::conn();
        $stmt = $db->prepare('UPDATE connections SET config = ?, status = ?, last_sync_at = ?, phone_numbers = ?, updated_at = NOW() WHERE id = ? AND user_id = ?');
        $stmt->execute([
            json_encode($connection['config']),
            $connection['status'],
            $connection['lastTested'] ?? null,
            json_encode($connection['phoneNumbers'] ?? []),
            $connection['id'],
            $userId
        ]);
    }

    private static function validateSignalWireConfig(array $config): ?array {
        $required = ['projectId', 'spaceUrl', 'apiToken'];
        foreach ($required as $field) {
            if (empty($config[$field])) {
                Response::json(['error' => "Missing required field: $field"], 400);
                return null;
            }
        }

        return $config;
    }

    private static function syncSignalWireSettings(string $userId, array $config): void {
        $projectId = $config['projectId'] ?? null;
        $spaceUrl = $config['spaceUrl'] ?? null;
        $apiToken = $config['apiToken'] ?? null;

        if (!$projectId || !$spaceUrl || !$apiToken) {
            return;
        }

        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT data FROM sms_settings WHERE user_id = ? LIMIT 1');
            $stmt->execute([$userId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            $data = [];
            if ($row && isset($row['data'])) {
                $decoded = json_decode($row['data'], true);
                if (is_array($decoded)) {
                    $data = $decoded;
                }
            }

            $data['signalwireProjectId'] = $projectId;
            $data['signalwireSpaceUrl'] = $spaceUrl;
            $data['signalwireApiToken'] = $apiToken;

            if (!empty($config['defaultSenderNumber'])) {
                $data['defaultSenderNumber'] = $config['defaultSenderNumber'];
            }

            $json = json_encode($data, JSON_UNESCAPED_SLASHES);

            if ($row) {
                $update = $pdo->prepare('UPDATE sms_settings SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
                $update->execute([$json, $userId]);
            } else {
                $insert = $pdo->prepare('INSERT INTO sms_settings (user_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
                $insert->execute([$userId, $json]);
            }
        } catch (Exception $e) {
            error_log('Failed to sync SignalWire settings: ' . $e->getMessage());
        }
    }
    public static function testConnectionConfig(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $provider = $body['provider'] ?? 'signalwire';
        $config = $body['config'] ?? [];

        if ($provider !== 'signalwire') {
            Response::json(['error' => 'Only SignalWire is supported for config testing'], 400);
            return;
        }

        $validatedConfig = self::validateSignalWireConfig($config);
        if (!$validatedConfig) {
            return;
        }

        try {
            $smsService = new SMSService();
            $numbers = $smsService->getAvailableNumbers(
                $validatedConfig['projectId'],
                $validatedConfig['spaceUrl'],
                $validatedConfig['apiToken']
            );

            Response::json([
                'success' => true,
                'message' => 'Connection test successful',
                'availableNumbers' => $numbers
            ]);
        } catch (Exception $e) {
             Response::json([
                'success' => false,
                'error' => 'Failed to connect: ' . $e->getMessage()
            ], 400);
        }
    }
}
