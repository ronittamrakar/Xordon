<?php

class RequestsController {
    
    /**
     * Get workspace scope for queries
     */
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }

    private static function getCompanyScope(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return $ctx && isset($ctx->activeCompanyId) ? (int)$ctx->activeCompanyId : null;
    }

    private static function getWorkspaceIdOrFail(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId) && $ctx->workspaceId) {
            return (int)$ctx->workspaceId;
        }
        Response::error('Workspace context required', 400);
    }

    private static function generateRequestNumber(): string {
        $prefix = 'REQ';
        $timestamp = time();
        $random = rand(1000, 9999);
        return $prefix . '-' . $timestamp . '-' . $random;
    }

    public static function list(): void {
        try {
            $db = Database::conn();
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyScope();

            $status = $_GET['status'] ?? null;
            $priority = $_GET['priority'] ?? null;
            $assignedTo = $_GET['assigned_to'] ?? null;
            $contactId = $_GET['contact_id'] ?? null;
            
            $sql = "SELECT r.*, 
                    c.first_name as contact_first_name, 
                    c.last_name as contact_last_name,
                    c.email as contact_email,
                    c.phone as contact_phone,
                    u.name as assigned_staff_name
                    FROM requests r
                    LEFT JOIN contacts c ON r.contact_id = c.id
                    LEFT JOIN users u ON r.assigned_to = u.id
                    WHERE r.{$scope['col']} = ?";
            
            $bindings = [$scope['val']];
            
            if ($companyId) {
                $sql .= " AND r.company_id = ?";
                $bindings[] = $companyId;
            }
            
            if ($status) {
                $sql .= " AND r.status = ?";
                $bindings[] = $status;
            }
            
            if ($priority) {
                $sql .= " AND r.priority = ?";
                $bindings[] = $priority;
            }
            
            if ($assignedTo) {
                $sql .= " AND r.assigned_to = ?";
                $bindings[] = $assignedTo;
            }
            
            if ($contactId) {
                $sql .= " AND r.contact_id = ?";
                $bindings[] = $contactId;
            }
            
            $sql .= " ORDER BY r.created_at DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($bindings);
            $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($requests as &$req) {
                $req['contact'] = [
                    'firstName' => $req['contact_first_name'],
                    'lastName' => $req['contact_last_name'],
                    'email' => $req['contact_email'],
                    'phone' => $req['contact_phone']
                ];
                unset($req['contact_first_name'], $req['contact_last_name'], 
                      $req['contact_email'], $req['contact_phone']);
                
                if ($req['assigned_staff_name']) {
                    $req['assignedStaff'] = ['name' => $req['assigned_staff_name']];
                }
                unset($req['assigned_staff_name']);
                
                if ($req['images']) {
                    $req['images'] = json_decode($req['images'], true);
                }
                
                $req['requestNumber'] = $req['request_number'];
                $req['contactId'] = $req['contact_id'];
                $req['assignedTo'] = $req['assigned_to'];
                $req['requestType'] = $req['request_type'];
                $req['serviceDetails'] = $req['service_details'];
                $req['serviceAddress'] = $req['service_address'];
                $req['serviceCity'] = $req['service_city'];
                $req['serviceState'] = $req['service_state'];
                $req['serviceZip'] = $req['service_zip'];
                $req['requestedDate'] = $req['requested_date'];
                $req['scheduledDate'] = $req['scheduled_date'];
                $req['scheduledTimeStart'] = $req['scheduled_time_start'];
                $req['scheduledTimeEnd'] = $req['scheduled_time_end'];
                $req['estimatedCost'] = $req['estimated_cost'];
                $req['internalNotes'] = $req['internal_notes'];
                $req['customerNotes'] = $req['customer_notes'];
                $req['onSiteAssessment'] = (bool)$req['on_site_assessment'];
                $req['assessmentNotes'] = $req['assessment_notes'];
                $req['createdAt'] = $req['created_at'];
                $req['updatedAt'] = $req['updated_at'];
            }

            Response::json(['items' => $requests]);
            
        } catch (\Exception $e) {
            error_log("Error listing requests: " . $e->getMessage());
            Response::error('Server Error', 500);
        }
    }

    public static function get(int $id): void {
        try {
            $db = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $sql = "SELECT r.*, 
                    c.first_name as contact_first_name, 
                    c.last_name as contact_last_name,
                    c.email as contact_email,
                    c.phone as contact_phone,
                    u.name as assigned_staff_name
                    FROM requests r
                    LEFT JOIN contacts c ON r.contact_id = c.id
                    LEFT JOIN users u ON r.assigned_to = u.id
                    WHERE r.id = ? AND r.{$scope['col']} = ?";
            
            $stmt = $db->prepare($sql);
            $stmt->execute([$id, $scope['val']]);
            $req = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$req) {
                Response::error('Not Found', 404);
            }
            
            $req['contact'] = [
                'firstName' => $req['contact_first_name'],
                'lastName' => $req['contact_last_name'],
                'email' => $req['contact_email'],
                'phone' => $req['contact_phone']
            ];
            unset($req['contact_first_name'], $req['contact_last_name'], 
                  $req['contact_email'], $req['contact_phone']);
            
            if ($req['assigned_staff_name']) {
                $req['assignedStaff'] = ['name' => $req['assigned_staff_name']];
            }
            unset($req['assigned_staff_name']);
            
            if ($req['images']) {
                $req['images'] = json_decode($req['images'], true);
            }
            
            $itemsStmt = $db->prepare("SELECT * FROM request_items WHERE request_id = ? ORDER BY sort_order");
            $itemsStmt->execute([$id]);
            $req['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $req['requestNumber'] = $req['request_number'];
            $req['contactId'] = $req['contact_id'];
            $req['assignedTo'] = $req['assigned_to'];
            $req['requestType'] = $req['request_type'];
            $req['serviceDetails'] = $req['service_details'];
            $req['serviceAddress'] = $req['service_address'];
            $req['serviceCity'] = $req['service_city'];
            $req['serviceState'] = $req['service_state'];
            $req['serviceZip'] = $req['service_zip'];
            $req['requestedDate'] = $req['requested_date'];
            $req['scheduledDate'] = $req['scheduled_date'];
            $req['scheduledTimeStart'] = $req['scheduled_time_start'];
            $req['scheduledTimeEnd'] = $req['scheduled_time_end'];
            $req['estimatedCost'] = $req['estimated_cost'];
            $req['internalNotes'] = $req['internal_notes'];
            $req['customerNotes'] = $req['customer_notes'];
            $req['onSiteAssessment'] = (bool)$req['on_site_assessment'];
            $req['assessmentNotes'] = $req['assessment_notes'];
            $req['createdAt'] = $req['created_at'];
            $req['updatedAt'] = $req['updated_at'];
            
            Response::json($req);
            
        } catch (\Exception $e) {
            error_log("Error getting request: " . $e->getMessage());
            Response::error('Server Error', 500);
        }
    }

    public static function create(): void {
        try {
            $db = Database::conn();
            $scope = self::getWorkspaceScope();
            $companyId = self::getCompanyScope();
            $userId = Auth::userIdOrFail();
            $data = get_json_input();
            
            $requestNumber = self::generateRequestNumber();
            
            $sql = "INSERT INTO requests (
                workspace_id, company_id, request_number, contact_id, title, description,
                status, priority, request_type, service_details,
                service_address, service_city, service_state, service_zip,
                requested_date, scheduled_date, scheduled_time_start, scheduled_time_end,
                assigned_to, estimated_cost, subtotal, tax_amount, total,
                internal_notes, customer_notes, images, on_site_assessment,
                assessment_notes, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $workspaceId = $scope['col'] === 'workspace_id' ? (int)$scope['val'] : self::getWorkspaceIdOrFail();
            
            $stmt = $db->prepare($sql);
            $stmt->execute([
                $workspaceId,
                $companyId,
                $requestNumber,
                (int)($data['contact_id'] ?? 0),
                (string)($data['title'] ?? ''),
                $data['description'] ?? null,
                $data['status'] ?? 'new',
                $data['priority'] ?? 'normal',
                $data['request_type'] ?? null,
                $data['service_details'] ?? null,
                $data['service_address'] ?? null,
                $data['service_city'] ?? null,
                $data['service_state'] ?? null,
                $data['service_zip'] ?? null,
                $data['requested_date'] ?? null,
                $data['scheduled_date'] ?? null,
                $data['scheduled_time_start'] ?? null,
                $data['scheduled_time_end'] ?? null,
                $data['assigned_to'] ?? null,
                $data['estimated_cost'] ?? 0,
                $data['subtotal'] ?? 0,
                $data['tax_amount'] ?? 0,
                $data['total'] ?? 0,
                $data['internal_notes'] ?? null,
                $data['customer_notes'] ?? null,
                isset($data['images']) ? json_encode($data['images']) : null,
                $data['on_site_assessment'] ?? false,
                $data['assessment_notes'] ?? null,
                $userId
            ]);
            
            $requestId = $db->lastInsertId();
            
            if (!empty($data['items'])) {
                $itemSql = "INSERT INTO request_items (request_id, description, quantity, unit_price, total, item_type, sort_order) 
                           VALUES (?, ?, ?, ?, ?, ?, ?)";
                $itemStmt = $db->prepare($itemSql);
                
                foreach ($data['items'] as $index => $item) {
                    $itemStmt->execute([
                        $requestId,
                        $item['description'],
                        $item['quantity'] ?? 1,
                        $item['unit_price'] ?? 0,
                        $item['total'] ?? 0,
                        $item['item_type'] ?? 'service',
                        $index
                    ]);
                }
            }
            
            Response::json([
                'id' => $requestId,
                'request_number' => $requestNumber,
                'message' => 'Request created successfully'
            ], 201);
            
        } catch (\Exception $e) {
            error_log("Error creating request: " . $e->getMessage());
            Response::error('Server Error', 500);
        }
    }

    public static function update(int $id): void {
        try {
            $db = Database::conn();
            $scope = self::getWorkspaceScope();
            $data = get_json_input();
            
            $checkSql = "SELECT id FROM requests WHERE id = ? AND {$scope['col']} = ?";
            $checkStmt = $db->prepare($checkSql);
            $checkStmt->execute([$id, $scope['val']]);
            if (!$checkStmt->fetch()) {
                Response::error('Not Found', 404);
            }
            
            $updates = [];
            $bindings = [];
            
            $allowedFields = [
                'title', 'description', 'status', 'priority', 'request_type', 'service_details',
                'service_address', 'service_city', 'service_state', 'service_zip',
                'requested_date', 'scheduled_date', 'scheduled_time_start', 'scheduled_time_end',
                'assigned_to', 'estimated_cost', 'subtotal', 'tax_amount', 'total',
                'internal_notes', 'customer_notes', 'on_site_assessment', 'assessment_notes'
            ];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $bindings[] = $data[$field];
                }
            }
            
            if (array_key_exists('images', $data)) {
                $updates[] = "images = ?";
                $bindings[] = json_encode($data['images']);
            }
            
            if (!empty($updates)) {
                $sql = "UPDATE requests SET " . implode(', ', $updates) . " WHERE id = ?";
                $bindings[] = $id;
                
                $stmt = $db->prepare($sql);
                $stmt->execute($bindings);
            }
            
            if (isset($data['status'])) {
                $userId = Auth::userIdOrFail();
                $historySql = "INSERT INTO request_status_history (request_id, from_status, to_status, notes, changed_by) 
                              SELECT ?, status, ?, ?, ? FROM requests WHERE id = ?";
                $historyStmt = $db->prepare($historySql);
                $historyStmt->execute([$id, $data['status'], $data['status_notes'] ?? null, $userId, $id]);
            }
            
            Response::json(['message' => 'Request updated successfully']);
            
        } catch (\Exception $e) {
            error_log("Error updating request: " . $e->getMessage());
            Response::error('Server Error', 500);
        }
    }

    public static function delete(int $id): void {
        try {
            $db = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $sql = "DELETE FROM requests WHERE id = ? AND {$scope['col']} = ?";
            $stmt = $db->prepare($sql);
            $stmt->execute([$id, $scope['val']]);
            
            if ($stmt->rowCount() === 0) {
                Response::error('Not Found', 404);
            }

            Response::json(['message' => 'Request deleted successfully']);
            
        } catch (\Exception $e) {
            error_log("Error deleting request: " . $e->getMessage());
            Response::error('Server Error', 500);
        }
    }
}
