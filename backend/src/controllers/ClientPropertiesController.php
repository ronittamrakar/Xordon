<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ClientPropertiesController {
    
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }
    
    /**
     * Get all properties for a client
     */
    public static function index(string $companyId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify company access
        $checkStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$companyId, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        $stmt = $pdo->prepare("
            SELECT * FROM client_properties 
            WHERE company_id = ? 
            ORDER BY is_primary DESC, created_at DESC
        ");
        $stmt->execute([$companyId]);
        $properties = $stmt->fetchAll();
        
        $formatted = array_map(function($row) {
            return [
                'id' => (string)$row['id'],
                'companyId' => (string)$row['company_id'],
                'propertyType' => $row['property_type'],
                'street1' => $row['street1'],
                'street2' => $row['street2'],
                'city' => $row['city'],
                'state' => $row['state'],
                'postalCode' => $row['postal_code'],
                'country' => $row['country'],
                'isPrimary' => (bool)$row['is_primary'],
                'taxRate' => $row['tax_rate'] ? (float)$row['tax_rate'] : null,
                'notes' => $row['notes'],
                'customFields' => $row['custom_fields'] ? json_decode($row['custom_fields'], true) : null,
                'createdAt' => $row['created_at'],
                'updatedAt' => $row['updated_at'],
            ];
        }, $properties);
        
        Response::json(['properties' => $formatted]);
    }
    
    /**
     * Create a new property
     */
    public static function create(string $companyId): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_input();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify company access
        $checkStmt = $pdo->prepare("SELECT id, {$scope['col']} FROM companies WHERE id = ? AND {$scope['col']} = ?");
        $checkStmt->execute([$companyId, $scope['val']]);
        $company = $checkStmt->fetch();
        if (!$company) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        $workspaceId = $company[$scope['col']];
        
        // If this is set as primary, unset other primaries
        if (!empty($data['isPrimary'])) {
            $pdo->prepare("UPDATE client_properties SET is_primary = FALSE WHERE company_id = ?")
                ->execute([$companyId]);
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO client_properties (
                workspace_id, company_id, property_type, street1, street2, 
                city, state, postal_code, country, is_primary, tax_rate, notes, 
                custom_fields, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $result = $stmt->execute([
            $workspaceId,
            $companyId,
            $data['propertyType'] ?? 'residential',
            $data['street1'] ?? null,
            $data['street2'] ?? null,
            $data['city'] ?? null,
            $data['state'] ?? null,
            $data['postalCode'] ?? null,
            $data['country'] ?? 'United States',
            !empty($data['isPrimary']) ? 1 : 0,
            $data['taxRate'] ?? null,
            $data['notes'] ?? null,
            isset($data['customFields']) ? json_encode($data['customFields']) : null,
        ]);
        
        if ($result) {
            Response::json(['id' => $pdo->lastInsertId(), 'message' => 'Property created successfully'], 201);
        } else {
            Response::json(['error' => 'Failed to create property'], 500);
        }
    }
    
    /**
     * Update a property
     */
    public static function update(string $companyId, string $propertyId): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_input();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify property belongs to company
        $checkStmt = $pdo->prepare("
            SELECT cp.* FROM client_properties cp
            JOIN companies c ON c.id = cp.company_id
            WHERE cp.id = ? AND cp.company_id = ? AND c.{$scope['col']} = ?
        ");
        $checkStmt->execute([$propertyId, $companyId, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Property not found'], 404);
            return;
        }
        
        // If this is set as primary, unset other primaries
        if (!empty($data['isPrimary'])) {
            $pdo->prepare("UPDATE client_properties SET is_primary = FALSE WHERE company_id = ? AND id != ?")
                ->execute([$companyId, $propertyId]);
        }
        
        $updateFields = [];
        $params = [];
        
        $fieldMapping = [
            'propertyType' => 'property_type',
            'street1' => 'street1',
            'street2' => 'street2',
            'city' => 'city',
            'state' => 'state',
            'postalCode' => 'postal_code',
            'country' => 'country',
            'isPrimary' => 'is_primary',
            'taxRate' => 'tax_rate',
            'notes' => 'notes',
        ];
        
        foreach ($data as $key => $value) {
            if (isset($fieldMapping[$key])) {
                $updateFields[] = $fieldMapping[$key] . " = ?";
                $params[] = $key === 'isPrimary' ? ($value ? 1 : 0) : $value;
            }
        }
        
        if (isset($data['customFields'])) {
            $updateFields[] = "custom_fields = ?";
            $params[] = json_encode($data['customFields']);
        }
        
        if (empty($updateFields)) {
            Response::json(['message' => 'No changes']);
            return;
        }
        
        $params[] = $propertyId;
        $sql = "UPDATE client_properties SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        if ($result) {
            Response::json(['message' => 'Property updated successfully']);
        } else {
            Response::json(['error' => 'Failed to update property'], 500);
        }
    }
    
    /**
     * Delete a property
     */
    public static function delete(string $companyId, string $propertyId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $scope = self::getWorkspaceScope();
        
        // Verify property belongs to company
        $checkStmt = $pdo->prepare("
            SELECT cp.* FROM client_properties cp
            JOIN companies c ON c.id = cp.company_id
            WHERE cp.id = ? AND cp.company_id = ? AND c.{$scope['col']} = ?
        ");
        $checkStmt->execute([$propertyId, $companyId, $scope['val']]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Property not found'], 404);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM client_properties WHERE id = ?");
        $result = $stmt->execute([$propertyId]);
        
        if ($result) {
            Response::json(['message' => 'Property deleted successfully']);
        } else {
            Response::json(['error' => 'Failed to delete property'], 500);
        }
    }
}
