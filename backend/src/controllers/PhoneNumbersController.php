<?php
/**
 * PhoneNumbersController - Handles dedicated business phone lines
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class PhoneNumbersController {
    
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    private static function getWorkspaceId(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return ($ctx && isset($ctx->workspaceId)) ? (int)$ctx->workspaceId : null;
    }
    
    // ==================== PHONE NUMBERS ====================
    
    public static function getPhoneNumbers(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("SELECT * FROM phone_numbers WHERE {$scope['col']} = ? ORDER BY is_primary DESC, created_at DESC");
        $stmt->execute([$scope['val']]);
        $numbers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($numbers as &$number) {
            if ($number['capabilities']) {
                $number['capabilities'] = json_decode($number['capabilities'], true);
            }
        }
        
        Response::json(['items' => $numbers]);
    }
    
    /**
     * Get active phone numbers for softphone caller ID selection
     */
    public static function getActivePhoneNumbers(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("
            SELECT id, phone_number, friendly_name, is_primary, capabilities, provider
            FROM phone_numbers 
            WHERE {$scope['col']} = ? AND status = 'active'
            ORDER BY is_primary DESC, friendly_name ASC
        ");
        $stmt->execute([$scope['val']]);
        $numbers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($numbers as &$number) {
            if ($number['capabilities']) {
                $number['capabilities'] = json_decode($number['capabilities'], true);
            }
            // Convert is_primary to boolean
            $number['is_primary'] = (bool)$number['is_primary'];
        }
        
        Response::json(['items' => $numbers]);
    }
    
    public static function getPhoneNumber(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("SELECT * FROM phone_numbers WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $number = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$number) {
            Response::notFound('Phone number not found');
            return;
        }
        
        if ($number['capabilities']) {
            $number['capabilities'] = json_decode($number['capabilities'], true);
        }
        
        // Get routing rules
        $stmt = $pdo->prepare('SELECT * FROM call_routing_rules WHERE phone_number_id = ? ORDER BY priority');
        $stmt->execute([$id]);
        $number['routing_rules'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json($number);
    }
    
    public static function searchAvailableNumbers(): void {
        $userId = Auth::userIdOrFail();
        
        $countryCode = $_GET['country'] ?? 'US';
        $areaCode = $_GET['area_code'] ?? '';
        $type = $_GET['type'] ?? 'local';
        
        require_once __DIR__ . '/../services/PhoneProvisioningService.php';
        
        try {
            $pattern = $_GET['pattern'] ?? $_GET['contains'] ?? null;
            
            // PhoneProvisioningService::searchAvailableNumbers returns ['success' => true, 'numbers' => [...]]
            $result = PhoneProvisioningService::searchAvailableNumbers($areaCode, $countryCode, 10, $type, $pattern);
            
            if (!$result['success']) {
                Response::error($result['error'] ?? 'Failed to search for available numbers');
                return;
            }
            
            Response::json(['items' => $result['numbers']]);
        } catch (Exception $e) {
            Response::serverError('Error searching for phone numbers', $e);
        }
    }
    
    public static function purchaseNumber(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['phone_number'])) {
            Response::validationError('Phone number is required');
            return;
        }
        
        // Check if number already exists in our DB
        $stmt = $pdo->prepare("SELECT id FROM phone_numbers WHERE phone_number = ? AND status != 'released'");
        $stmt->execute([$body['phone_number']]);
        if ($stmt->fetch()) {
            Response::error('Phone number already in use');
            return;
        }
        
        $workspaceId = self::getWorkspaceId();
        
        require_once __DIR__ . '/../services/PhoneProvisioningService.php';
        
        try {
            // Actually purchase the number via API
            // PhoneProvisioningService::purchaseNumber handles both API call and DB insert
            // But we might want to ensure user_id and is_primary are set correctly as well.
            // Let's modify PhoneProvisioningService::purchaseNumber or handle it here.
            
            // To maintain compatibility with the controller's logic, let's call the API part
            // and handle the DB part here to ensure all fields like user_id are set.
            
            $result = PhoneProvisioningService::purchaseNumber($workspaceId ?? 0, $userId, $body['phone_number'], $body['friendly_name'] ?? null);
            
            if (!$result['success']) {
                Response::error($result['error'] ?? 'Failed to purchase number from provider');
                return;
            }
            
            // Check if this should be the primary number
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM phone_numbers WHERE {$scope['col']} = ? AND id != ?");
            $stmt->execute([$scope['val'], $result['number_id']]);
            $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            if ($count == 0) {
                $stmt = $pdo->prepare("UPDATE phone_numbers SET is_primary = 1 WHERE id = ?");
                $stmt->execute([$result['number_id']]);
            }
            
            Response::json(['id' => $result['number_id'], 'message' => 'Phone number purchased successfully'], 201);
        } catch (Exception $e) {
            Response::serverError('Failed to purchase phone number', $e);
        }
    }
    
    public static function updatePhoneNumber(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("SELECT * FROM phone_numbers WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$id, $scope['val']]);
        $existingNumber = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existingNumber) {
            Response::notFound('Phone number not found');
            return;
        }
        
        $updates = [];
        $params = [];
        
        $fields = ['friendly_name', 'voice_enabled', 'sms_enabled', 'is_primary', 
                   'forwarding_number', 'pass_call_id', 'whisper_message', 'call_recording', 
                   'tracking_campaign', 'destination_type', 'voicemail_greeting', 'call_flow_id'];
        
        $settingsForProvider = [];
        
        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                // Handle booleans
                if (in_array($field, ['pass_call_id', 'call_recording', 'is_primary', 'voice_enabled', 'sms_enabled'])) {
                    $params[] = (int)$body[$field];
                    $settingsForProvider[$field] = (bool)$body[$field];
                } else {
                    $params[] = $body[$field];
                    $settingsForProvider[$field] = $body[$field];
                }
            }
        }
        
        if (empty($updates)) {
            Response::json(['message' => 'No updates provided']);
            return;
        }
        
        // If setting as primary, unset other primaries
        if (!empty($body['is_primary'])) {
            $stmt = $pdo->prepare("UPDATE phone_numbers SET is_primary = 0 WHERE {$scope['col']} = ?");
            $stmt->execute([$scope['val']]);
        }
        
        $params[] = $id;
        $params[] = $scope['val'];
        
        $stmt = $pdo->prepare("UPDATE phone_numbers SET " . implode(', ', $updates) . " WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute($params);
        
        // Sync to provider (SignalWire/Twilio)
        require_once __DIR__ . '/../services/PhoneProvisioningService.php';
        
        try {
            $providerResult = PhoneProvisioningService::updatePhoneNumberConfig((int)$id, $settingsForProvider);
            
            Response::json([
                'success' => true,
                'message' => 'Phone number updated successfully',
                'provider_synced' => $providerResult['provider_updated'] ?? false,
                'provider_message' => $providerResult['message'] ?? null
            ]);
        } catch (Exception $e) {
            // Database update succeeded, but provider sync failed
            error_log("Provider sync failed for phone number {$id}: " . $e->getMessage());
            
            Response::json([
                'success' => true,
                'message' => 'Phone number updated in database. Provider sync pending.',
                'provider_synced' => false,
                'provider_error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Bulk update multiple phone numbers
     */
    public static function bulkUpdatePhoneNumbers(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        if (empty($body['ids']) || !is_array($body['ids'])) {
            Response::validationError('Phone number IDs are required');
            return;
        }
        
        if (empty($body['updates']) || !is_array($body['updates'])) {
            Response::validationError('Updates are required');
            return;
        }
        
        $ids = array_map('intval', $body['ids']);
        $updates = $body['updates'];
        
        // Validate the IDs belong to this user/workspace
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare("SELECT id FROM phone_numbers WHERE id IN ({$placeholders}) AND {$scope['col']} = ?");
        $stmt->execute([...$ids, $scope['val']]);
        $validIds = array_column($stmt->fetchAll(PDO::FETCH_ASSOC), 'id');
        
        if (empty($validIds)) {
            Response::error('No valid phone numbers found');
            return;
        }
        
        $successCount = 0;
        $failedCount = 0;
        $errors = [];
        
        // Build update SQL
        $setClauses = [];
        $setParams = [];
        $allowedFields = ['call_recording', 'pass_call_id', 'destination_type', 'forwarding_number', 
                         'whisper_message', 'voicemail_greeting', 'tracking_campaign', 'voice_enabled', 'sms_enabled', 'call_flow_id'];
        
        foreach ($allowedFields as $field) {
            if (isset($updates[$field])) {
                $setClauses[] = "$field = ?";
                if (in_array($field, ['call_recording', 'pass_call_id', 'voice_enabled', 'sms_enabled'])) {
                    $setParams[] = (int)$updates[$field];
                } else {
                    $setParams[] = $updates[$field];
                }
            }
        }
        
        if (empty($setClauses)) {
            Response::json(['message' => 'No valid updates provided', 'updated' => 0]);
            return;
        }
        
        // Update all in database
        $validPlaceholders = implode(',', array_fill(0, count($validIds), '?'));
        $sql = "UPDATE phone_numbers SET " . implode(', ', $setClauses) . " WHERE id IN ({$validPlaceholders})";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([...$setParams, ...$validIds]);
        
        // Sync each to provider
        require_once __DIR__ . '/../services/PhoneProvisioningService.php';
        
        foreach ($validIds as $numberId) {
            try {
                $result = PhoneProvisioningService::updatePhoneNumberConfig((int)$numberId, $updates);
                if ($result['success']) {
                    $successCount++;
                } else {
                    $failedCount++;
                    $errors[] = "Number {$numberId}: " . ($result['error'] ?? 'Unknown error');
                }
            } catch (Exception $e) {
                $failedCount++;
                $errors[] = "Number {$numberId}: " . $e->getMessage();
            }
        }
        
        Response::json([
            'success' => true,
            'message' => "Updated {$successCount} phone number(s)" . ($failedCount > 0 ? ", {$failedCount} failed provider sync" : ""),
            'updated' => $successCount,
            'failed' => $failedCount,
            'errors' => $errors
        ]);
    }
    
    public static function releaseNumber(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM phone_numbers WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $number = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$number) {
            Response::notFound('Phone number not found');
            return;
        }
        
        require_once __DIR__ . '/../services/PhoneProvisioningService.php';
        
        try {
            $result = PhoneProvisioningService::releaseNumber((int)$id);
            
            if (!$result['success']) {
                Response::error($result['error'] ?? 'Failed to release phone number from provider');
                return;
            }
            
            Response::json(['message' => 'Phone number released successfully']);
        } catch (Exception $e) {
            Response::serverError('Error releasing phone number', $e);
        }
    }
    
    public static function syncFromConnection(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['connection_id'])) {
            Response::validationError('Connection ID is required');
            return;
        }
        
        $connectionId = $body['connection_id'];
        
        // Verify connection ownership and get connection details
        require_once __DIR__ . '/ConnectionsController.php';
        $scope = self::getWorkspaceScope();
        
        $stmt = $pdo->prepare("SELECT * FROM connections WHERE id = ? AND {$scope['col']} = ?");
        $stmt->execute([$connectionId, $scope['val']]);
        $connection = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$connection) {
            Response::notFound('Connection not found');
            return;
        }
        
        if ($connection['provider'] !== 'signalwire') {
            Response::error('Only SignalWire connections are supported');
            return;
        }
        
        // Always fetch fresh phone numbers from SignalWire to ensure we have the latest data
        require_once __DIR__ . '/../services/SMSService.php';
        $config = json_decode($connection['config'], true);
        
        if (empty($config['projectId']) || empty($config['spaceUrl']) || empty($config['apiToken'])) {
            Response::error('Invalid SignalWire configuration');
            return;
        }
        
        try {
            $smsService = new SMSService();
            $phoneNumbers = $smsService->getAvailableNumbers(
                $config['projectId'],
                $config['spaceUrl'],
                $config['apiToken']
            );
            
            // Cache the numbers in the connection
            $stmt = $pdo->prepare('UPDATE connections SET phone_numbers = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([json_encode($phoneNumbers), $connectionId]);
        } catch (Exception $e) {
            error_log('Failed to fetch numbers from SignalWire: ' . $e->getMessage());
            Response::error('Failed to fetch numbers from SignalWire: ' . $e->getMessage());
            return;
        }
        
        $workspaceId = self::getWorkspaceId();
        $synced = 0;
        $updated = 0;
        
        foreach ($phoneNumbers as $number) {
            $phoneNumber = $number['phone_number'] ?? $number['phoneNumber'] ?? $number['number'] ?? null;
            if (!$phoneNumber) continue;
            
            $friendlyName = $number['friendly_name'] ?? $number['friendlyName'] ?? $phoneNumber;
            
            // Check if number already exists
            $stmt = $pdo->prepare('SELECT id FROM phone_numbers WHERE phone_number = ?');
            $stmt->execute([$phoneNumber]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                // Update existing number
                $stmt = $pdo->prepare('
                    UPDATE phone_numbers 
                    SET friendly_name = ?, status = ?, provider = ?, updated_at = NOW()
                    WHERE phone_number = ?
                ');
                $stmt->execute([$friendlyName, 'active', 'signalwire', $phoneNumber]);
                $updated++;
            } else {
                // Insert new number
                $stmt = $pdo->prepare('
                    INSERT INTO phone_numbers (user_id, workspace_id, phone_number, friendly_name, provider, 
                        country_code, capabilities, type, status, monthly_cost, is_primary, purchased_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ');
                
                // Check if this is the first number (make it primary)
                $stmt2 = $pdo->prepare("SELECT COUNT(*) as count FROM phone_numbers WHERE {$scope['col']} = ?");
                $stmt2->execute([$scope['val']]);
                $isPrimary = $stmt2->fetch(PDO::FETCH_ASSOC)['count'] == 0;
                
                $stmt->execute([
                    $userId,
                    $workspaceId,
                    $phoneNumber,
                    $friendlyName,
                    'signalwire',
                    'US', // Default to US, could be extracted from number format
                    json_encode(['voice' => true, 'sms' => true, 'mms' => true]),
                    'local',
                    'active',
                    1.00,
                    $isPrimary
                ]);
                $synced++;
            }
        }
        
        Response::json([
            'success' => true,
            'synced' => $synced,
            'updated' => $updated,
            'total' => count($phoneNumbers),
            'message' => "Synced $synced new and updated $updated existing phone numbers"
        ]);
    }
    
    // ==================== ROUTING RULES ====================
    
    public static function getRoutingRules(string $phoneNumberId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Verify ownership
        $stmt = $pdo->prepare('SELECT id FROM phone_numbers WHERE id = ? AND user_id = ?');
        $stmt->execute([$phoneNumberId, $userId]);
        if (!$stmt->fetch()) {
            Response::notFound('Phone number not found');
            return;
        }
        
        $stmt = $pdo->prepare('SELECT * FROM call_routing_rules WHERE phone_number_id = ? ORDER BY priority');
        $stmt->execute([$phoneNumberId]);
        $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($rules as &$rule) {
            if ($rule['condition_data']) {
                $rule['condition_data'] = json_decode($rule['condition_data'], true);
            }
        }
        
        Response::json(['items' => $rules]);
    }
    
    public static function createRoutingRule(string $phoneNumberId): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Verify ownership
        $stmt = $pdo->prepare('SELECT id FROM phone_numbers WHERE id = ? AND user_id = ?');
        $stmt->execute([$phoneNumberId, $userId]);
        if (!$stmt->fetch()) {
            Response::notFound('Phone number not found');
            return;
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO call_routing_rules (phone_number_id, name, priority, is_active, condition_type, 
                condition_data, action_type, forward_to, voicemail_greeting_url, ivr_menu_id, play_message_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $phoneNumberId,
            $body['name'] ?? 'New Rule',
            $body['priority'] ?? 0,
            $body['is_active'] ?? true,
            $body['condition_type'] ?? 'always',
            isset($body['condition_data']) ? json_encode($body['condition_data']) : null,
            $body['action_type'] ?? 'forward',
            $body['forward_to'] ?? null,
            $body['voicemail_greeting_url'] ?? null,
            $body['ivr_menu_id'] ?? null,
            $body['play_message_url'] ?? null
        ]);
        
        $id = $pdo->lastInsertId();
        
        Response::json(['id' => $id, 'message' => 'Routing rule created successfully'], 201);
    }
    
    public static function updateRoutingRule(string $phoneNumberId, string $ruleId): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Verify ownership
        $stmt = $pdo->prepare('
            SELECT r.id FROM call_routing_rules r
            JOIN phone_numbers p ON r.phone_number_id = p.id
            WHERE r.id = ? AND p.id = ? AND p.user_id = ?
        ');
        $stmt->execute([$ruleId, $phoneNumberId, $userId]);
        if (!$stmt->fetch()) {
            Response::notFound('Routing rule not found');
            return;
        }
        
        $updates = [];
        $params = [];
        
        $fields = ['name', 'priority', 'is_active', 'condition_type', 'action_type', 
                   'forward_to', 'voicemail_greeting_url', 'ivr_menu_id', 'play_message_url'];
        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        if (isset($body['condition_data'])) {
            $updates[] = 'condition_data = ?';
            $params[] = json_encode($body['condition_data']);
        }
        
        if (empty($updates)) {
            Response::json(['message' => 'No updates provided']);
            return;
        }
        
        $params[] = $ruleId;
        
        $stmt = $pdo->prepare('UPDATE call_routing_rules SET ' . implode(', ', $updates) . ' WHERE id = ?');
        $stmt->execute($params);
        
        Response::json(['message' => 'Routing rule updated successfully']);
    }
    
    public static function deleteRoutingRule(string $phoneNumberId, string $ruleId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            DELETE r FROM call_routing_rules r
            JOIN phone_numbers p ON r.phone_number_id = p.id
            WHERE r.id = ? AND p.id = ? AND p.user_id = ?
        ');
        $stmt->execute([$ruleId, $phoneNumberId, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Routing rule not found');
            return;
        }
        
        Response::json(['message' => 'Routing rule deleted successfully']);
    }
    
    // ==================== VOICEMAILS ====================
    
    public static function getVoicemails(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $status = $_GET['status'] ?? null;
        $phoneNumberId = $_GET['phone_number_id'] ?? null;
        
        $sql = 'SELECT v.*, p.phone_number, p.friendly_name as phone_name,
                       c.first_name, c.last_name, c.email as contact_email
                FROM voicemails v
                JOIN phone_numbers p ON v.phone_number_id = p.id
                LEFT JOIN contacts c ON v.contact_id = c.id
                WHERE v.user_id = ?';
        $params = [$userId];
        
        if ($status) {
            $sql .= ' AND v.status = ?';
            $params[] = $status;
        }
        
        if ($phoneNumberId) {
            $sql .= ' AND v.phone_number_id = ?';
            $params[] = $phoneNumberId;
        }
        
        $sql .= ' ORDER BY v.received_at DESC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    public static function getVoicemail(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT v.*, p.phone_number, p.friendly_name as phone_name,
                   c.first_name, c.last_name, c.email as contact_email, c.phone as contact_phone
            FROM voicemails v
            JOIN phone_numbers p ON v.phone_number_id = p.id
            LEFT JOIN contacts c ON v.contact_id = c.id
            WHERE v.id = ? AND v.user_id = ?
        ');
        $stmt->execute([$id, $userId]);
        $voicemail = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$voicemail) {
            Response::notFound('Voicemail not found');
            return;
        }
        
        // Mark as read
        if ($voicemail['status'] === 'new') {
            $stmt = $pdo->prepare('UPDATE voicemails SET status = ?, read_at = NOW() WHERE id = ?');
            $stmt->execute(['read', $id]);
            $voicemail['status'] = 'read';
        }
        
        Response::json($voicemail);
    }
    
    public static function updateVoicemail(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT id FROM voicemails WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            Response::notFound('Voicemail not found');
            return;
        }
        
        $updates = [];
        $params = [];
        
        if (isset($body['status'])) {
            $updates[] = 'status = ?';
            $params[] = $body['status'];
            
            if ($body['status'] === 'read' || $body['status'] === 'archived') {
                $updates[] = 'read_at = COALESCE(read_at, NOW())';
            }
        }
        
        if (isset($body['contact_id'])) {
            $updates[] = 'contact_id = ?';
            $params[] = $body['contact_id'];
        }
        
        if (empty($updates)) {
            Response::json(['message' => 'No updates provided']);
            return;
        }
        
        $params[] = $id;
        
        $stmt = $pdo->prepare('UPDATE voicemails SET ' . implode(', ', $updates) . ' WHERE id = ?');
        $stmt->execute($params);
        
        Response::json(['message' => 'Voicemail updated successfully']);
    }
    
    public static function deleteVoicemail(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('UPDATE voicemails SET status = ? WHERE id = ? AND user_id = ?');
        $stmt->execute(['deleted', $id, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Voicemail not found');
            return;
        }
        
        Response::json(['message' => 'Voicemail deleted successfully']);
    }
    
    // ==================== CALL LOGS ====================
    
    public static function getCallLogs(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $direction = $_GET['direction'] ?? null;
        $phoneNumberId = $_GET['phone_number_id'] ?? null;
        $from = $_GET['from'] ?? null;
        $to = $_GET['to'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        
        $sql = 'SELECT cl.*, p.phone_number as line_number, p.friendly_name as line_name,
                       c.first_name, c.last_name, c.email as contact_email
                FROM phone_call_logs cl
                LEFT JOIN phone_numbers p ON cl.phone_number_id = p.id
                LEFT JOIN contacts c ON cl.contact_id = c.id
                WHERE cl.user_id = ?';
        $params = [$userId];
        
        if ($direction) {
            $sql .= ' AND cl.direction = ?';
            $params[] = $direction;
        }
        
        if ($phoneNumberId) {
            $sql .= ' AND cl.phone_number_id = ?';
            $params[] = $phoneNumberId;
        }
        
        if ($from) {
            $sql .= ' AND cl.started_at >= ?';
            $params[] = $from;
        }
        
        if ($to) {
            $sql .= ' AND cl.started_at <= ?';
            $params[] = $to;
        }
        
        $sql .= ' ORDER BY cl.started_at DESC LIMIT ?';
        $params[] = $limit;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    public static function getCallLog(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT cl.*, p.phone_number as line_number, p.friendly_name as line_name,
                   c.first_name, c.last_name, c.email as contact_email, c.phone as contact_phone
            FROM phone_call_logs cl
            LEFT JOIN phone_numbers p ON cl.phone_number_id = p.id
            LEFT JOIN contacts c ON cl.contact_id = c.id
            WHERE cl.id = ? AND cl.user_id = ?
        ');
        $stmt->execute([$id, $userId]);
        $log = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$log) {
            Response::notFound('Call log not found');
            return;
        }
        
        Response::json($log);
    }
    
    // ==================== SMS CONVERSATIONS ====================
    
    public static function getSMSConversations(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $phoneNumberId = $_GET['phone_number_id'] ?? null;
        
        $sql = 'SELECT sc.*, p.phone_number as line_number, p.friendly_name as line_name,
                       c.first_name, c.last_name
                FROM phone_sms_conversations sc
                JOIN phone_numbers p ON sc.phone_number_id = p.id
                LEFT JOIN contacts c ON sc.contact_id = c.id
                WHERE sc.user_id = ? AND sc.status = ?';
        $params = [$userId, 'active'];
        
        if ($phoneNumberId) {
            $sql .= ' AND sc.phone_number_id = ?';
            $params[] = $phoneNumberId;
        }
        
        $sql .= ' ORDER BY sc.last_message_at DESC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    public static function getSMSConversation(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT sc.*, p.phone_number as line_number, p.friendly_name as line_name,
                   c.first_name, c.last_name, c.email as contact_email
            FROM phone_sms_conversations sc
            JOIN phone_numbers p ON sc.phone_number_id = p.id
            LEFT JOIN contacts c ON sc.contact_id = c.id
            WHERE sc.id = ? AND sc.user_id = ?
        ');
        $stmt->execute([$id, $userId]);
        $conversation = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$conversation) {
            Response::notFound('Conversation not found');
            return;
        }
        
        // Get messages
        $stmt = $pdo->prepare('SELECT * FROM phone_sms_messages WHERE conversation_id = ? ORDER BY created_at ASC');
        $stmt->execute([$id]);
        $conversation['messages'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Mark as read
        $stmt = $pdo->prepare('UPDATE phone_sms_conversations SET unread_count = 0 WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($conversation);
    }
    
    public static function sendSMS(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['phone_number_id']) || empty($body['to']) || empty($body['body'])) {
            Response::validationError('Phone number, recipient, and message body are required');
            return;
        }
        
        // Verify phone number ownership
        $stmt = $pdo->prepare('SELECT * FROM phone_numbers WHERE id = ? AND user_id = ? AND sms_enabled = 1');
        $stmt->execute([$body['phone_number_id'], $userId]);
        $phoneNumber = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$phoneNumber) {
            Response::error('Phone number not found or SMS not enabled');
            return;
        }
        
        $pdo->beginTransaction();
        
        try {
            // Get or create conversation
            $stmt = $pdo->prepare('SELECT id FROM phone_sms_conversations WHERE phone_number_id = ? AND contact_number = ?');
            $stmt->execute([$body['phone_number_id'], $body['to']]);
            $conversation = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($conversation) {
                $conversationId = $conversation['id'];
            } else {
                // Try to find contact
                $stmt = $pdo->prepare('SELECT id FROM contacts WHERE user_id = ? AND phone = ?');
                $stmt->execute([$userId, $body['to']]);
                $contact = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $stmt = $pdo->prepare('
                    INSERT INTO phone_sms_conversations (user_id, phone_number_id, contact_number, contact_id, last_message_at, last_message_preview)
                    VALUES (?, ?, ?, ?, NOW(), ?)
                ');
                $stmt->execute([
                    $userId,
                    $body['phone_number_id'],
                    $body['to'],
                    $contact['id'] ?? null,
                    substr($body['body'], 0, 255)
                ]);
                $conversationId = $pdo->lastInsertId();
            }
            
            // Create message
            $stmt = $pdo->prepare('
                INSERT INTO phone_sms_messages (conversation_id, direction, from_number, to_number, body, status, sent_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ');
            $stmt->execute([
                $conversationId,
                'outbound',
                $phoneNumber['phone_number'],
                $body['to'],
                $body['body'],
                'sent' // Would be 'queued' if actually sending via API
            ]);
            
            $messageId = $pdo->lastInsertId();
            
            // Update conversation
            $stmt = $pdo->prepare('UPDATE phone_sms_conversations SET last_message_at = NOW(), last_message_preview = ? WHERE id = ?');
            $stmt->execute([substr($body['body'], 0, 255), $conversationId]);
            
            // Send via Twilio/SignalWire using SMSService
            require_once __DIR__ . '/../services/SMSService.php';
            try {
                $smsService = new SMSService(null, (string)$userId);
                $result = $smsService->sendMessage(
                    $body['to'], 
                    $body['body'], 
                    $phoneNumber['phone_number']
                );
                
                // Update implementation status if external ID received
                if (isset($result['external_id'])) {
                    $stmt = $pdo->prepare('UPDATE phone_sms_messages SET external_id = ?, status = ? WHERE id = ?');
                    $stmt->execute([$result['external_id'], 'sent', $messageId]);
                }
            } catch (Exception $e) {
                // Log but don't fail the request (it's saved in DB)
                error_log("Failed to send real SMS: " . $e->getMessage());
                // Optional: Update status to failed
                $stmt = $pdo->prepare('UPDATE phone_sms_messages SET status = ?, error_message = ? WHERE id = ?');
                $stmt->execute(['failed', $e->getMessage(), $messageId]);
            }
            
            $pdo->commit();
            
            Response::json([
                'id' => $messageId,
                'conversation_id' => $conversationId,
                'message' => 'SMS sent successfully'
            ], 201);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to send SMS: ' . $e->getMessage());
        }
    }

    // ==================== WEBHOOK HANDLERS ====================

    /**
     * Handle incoming voice calls (Webhook)
     */
    public static function handleVoiceWebhook(string $id): void {
        $pdo = Database::conn();
        
        // Find the phone number
        $stmt = $pdo->prepare('SELECT * FROM phone_numbers WHERE id = ?');
        $stmt->execute([$id]);
        $number = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$number) {
            header('Content-Type: text/xml');
            echo '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Phone number not found.</Say></Response>';
            return;
        }

        // Get parameters from URL (sent by our setup) or use defaults from DB
        $destination = $_GET['destination'] ?? $number['destination_type'] ?? 'forward';
        $forwardTo = $_GET['forward_to'] ?? $number['forwarding_number'] ?? null;
        $recording = ($_GET['recording'] ?? ($number['call_recording'] ? '1' : '0')) === '1';
        $whisper = $_GET['whisper'] ?? $number['whisper_message'] ?? null;
        $voicemail = $_GET['voicemail'] ?? $number['voicemail_greeting'] ?? null;
        $passCallerId = ($_GET['pass_caller_id'] ?? ($number['pass_call_id'] ? '1' : '0')) === '1';

        header('Content-Type: text/xml');
        $xml = '<?xml version="1.0" encoding="UTF-8"?><Response>';

        if ($destination === 'forward' && $forwardTo) {
            // Forwarding logic
            if ($whisper) {
                $xml .= '<Say>' . htmlspecialchars($whisper) . '</Say>';
            }

            $dialAttrs = '';
            if ($recording) {
                $dialAttrs .= ' record="record-from-answer"';
            }
            if (!$passCallerId) {
                $dialAttrs .= ' callerId="' . htmlspecialchars($number['phone_number']) . '"';
            }

            $xml .= '<Dial' . $dialAttrs . ' timeout="30">';
            $xml .= '<Number>' . htmlspecialchars($forwardTo) . '</Number>';
            $xml .= '</Dial>';

            // If Dial fails or times out, go to voicemail
            if ($voicemail) {
                $xml .= '<Say>' . htmlspecialchars($voicemail) . '</Say>';
                $xml .= '<Record maxLength="120" action="/api/phone/voicemail-callback/' . $id . '" />';
            }
        } else if ($destination === 'voice_bot') {
            $xml .= '<Say>Welcome to our voice bot service. This feature is coming soon.</Say>';
        } else if ($destination === 'ivr_flow' && ($number['call_flow_id'] ?? null)) {
            // Delegate to IVR Engine
            echo \Xordon\Services\IVREngineService::execute($number['call_flow_id']);
            return;
        } else {
            $xml .= '<Say>Thank you for calling. No destination is configured for this number.</Say>';
        }

        $xml .= '</Response>';
        echo $xml;
    }

    /**
     * Handle incoming SMS (Webhook)
     */
    public static function handleSMSWebhook(string $id): void {
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM phone_numbers WHERE id = ?');
        $stmt->execute([$id]);
        $number = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$number) return;

        $from = $_POST['From'] ?? null;
        $body = $_POST['Body'] ?? '';
        
        if (!$from) return;

        $userId = $number['user_id'];
        
        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare('SELECT id FROM phone_sms_conversations WHERE phone_number_id = ? AND contact_number = ?');
            $stmt->execute([$id, $from]);
            $conversation = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($conversation) {
                $conversationId = $conversation['id'];
                $stmt = $pdo->prepare('UPDATE phone_sms_conversations SET last_message_at = NOW(), last_message_preview = ?, unread_count = unread_count + 1 WHERE id = ?');
                $stmt->execute([substr($body, 0, 255), $conversationId]);
            } else {
                $stmt = $pdo->prepare('
                    INSERT INTO phone_sms_conversations (user_id, workspace_id, phone_number_id, contact_number, last_message_at, last_message_preview, unread_count)
                    VALUES (?, ?, ?, ?, NOW(), ?, 1)
                ');
                $stmt->execute([$userId, $number['workspace_id'], $id, $from, substr($body, 0, 255)]);
                $conversationId = $pdo->lastInsertId();
            }

            $stmt = $pdo->prepare('
                INSERT INTO phone_sms_messages (conversation_id, direction, from_number, to_number, body, status, received_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ');
            $stmt->execute([$conversationId, 'inbound', $from, $number['phone_number'], $body, 'received']);

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Failed to process inbound SMS: " . $e->getMessage());
        }
    }
    
    // ==================== PHONE SETTINGS ====================
    
    public static function getSettings(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM phone_settings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$settings) {
            $settings = [
                'provider' => 'twilio',
                'voicemail_enabled' => true,
                'voicemail_transcription' => true,
                'call_recording_enabled' => false,
                'business_hours_enabled' => false,
                'after_hours_action' => 'voicemail'
            ];
        }
        
        // Don't expose encrypted tokens
        unset($settings['twilio_auth_token_encrypted']);
        unset($settings['signalwire_api_token_encrypted']);
        
        Response::json($settings);
    }
    
    public static function updateSettings(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT id FROM phone_settings WHERE user_id = ?');
        $stmt->execute([$userId]);
        $exists = $stmt->fetch();
        
        if ($exists) {
            $updates = [];
            $params = [];
            
            $fields = ['provider', 'twilio_account_sid', 'signalwire_space_url', 'signalwire_project_id',
                       'default_caller_id', 'voicemail_enabled', 'voicemail_greeting_url', 'voicemail_transcription',
                       'call_recording_enabled', 'call_recording_consent_message', 'business_hours_enabled',
                       'after_hours_action', 'after_hours_forward_to', 'after_hours_message'];
            
            foreach ($fields as $field) {
                if (isset($body[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $body[$field];
                }
            }
            
            if (!empty($updates)) {
                $params[] = $userId;
                $stmt = $pdo->prepare('UPDATE phone_settings SET ' . implode(', ', $updates) . ' WHERE user_id = ?');
                $stmt->execute($params);
            }
        } else {
            $stmt = $pdo->prepare('
                INSERT INTO phone_settings (user_id, provider, voicemail_enabled, voicemail_transcription, 
                    call_recording_enabled, business_hours_enabled, after_hours_action)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $userId,
                $body['provider'] ?? 'twilio',
                $body['voicemail_enabled'] ?? true,
                $body['voicemail_transcription'] ?? true,
                $body['call_recording_enabled'] ?? false,
                $body['business_hours_enabled'] ?? false,
                $body['after_hours_action'] ?? 'voicemail'
            ]);
        }
        
        Response::json(['message' => 'Phone settings updated successfully']);
    }
    
    // ==================== DASHBOARD STATS ====================
    
    public static function getDashboardStats(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Active phone numbers
        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM phone_numbers WHERE user_id = ? AND status = ?');
        $stmt->execute([$userId, 'active']);
        $activeNumbers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // New voicemails
        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM voicemails WHERE user_id = ? AND status = ?');
        $stmt->execute([$userId, 'new']);
        $newVoicemails = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Calls today
        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM phone_call_logs WHERE user_id = ? AND DATE(started_at) = CURDATE()');
        $stmt->execute([$userId]);
        $callsToday = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Unread SMS
        $stmt = $pdo->prepare('SELECT SUM(unread_count) as count FROM phone_sms_conversations WHERE user_id = ?');
        $stmt->execute([$userId]);
        $unreadSMS = $stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;
        
        // Call minutes this month
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(duration_seconds), 0) as seconds FROM phone_call_logs WHERE user_id = ? AND MONTH(started_at) = MONTH(NOW()) AND YEAR(started_at) = YEAR(NOW())');
        $stmt->execute([$userId]);
        $callMinutes = round($stmt->fetch(PDO::FETCH_ASSOC)['seconds'] / 60);
        
        Response::json([
            'active_numbers' => (int) $activeNumbers,
            'new_voicemails' => (int) $newVoicemails,
            'calls_today' => (int) $callsToday,
            'unread_sms' => (int) $unreadSMS,
            'call_minutes_this_month' => (int) $callMinutes
        ]);
    }
}
