<?php
/**
 * Operations Estimates Handler
 * 
 * Handles CRUD operations for estimates/quotes.
 * Contact data is hydrated from the main database.
 */

/**
 * Hydrate contact information from main DB for estimates
 */
function hydrateEstimateContacts($mainDb, $estimates, $workspaceId) {
    if (empty($estimates)) return $estimates;
    
    $contactIds = array_unique(array_filter(array_column($estimates, 'contact_id')));
    if (empty($contactIds)) return $estimates;
    
    $placeholders = implode(',', array_fill(0, count($contactIds), '?'));
    $stmt = $mainDb->prepare("
        SELECT id, first_name, last_name, email, phone 
        FROM contacts 
        WHERE id IN ($placeholders) AND workspace_id = ?
    ");
    $params = array_merge($contactIds, [$workspaceId]);
    $stmt->execute($params);
    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $contactMap = [];
    foreach ($contacts as $c) {
        $contactMap[$c['id']] = $c;
    }
    
    foreach ($estimates as &$est) {
        if (!empty($est['contact_id']) && isset($contactMap[$est['contact_id']])) {
            $c = $contactMap[$est['contact_id']];
            $est['contact_email'] = $c['email'];
            $est['contact_first_name'] = $c['first_name'];
            $est['contact_last_name'] = $c['last_name'];
            $est['contact_phone'] = $c['phone'];
        }
    }
    
    return $estimates;
}

function handleOperationsEstimates($opsDb, $mainDb, $method, $userId, $workspaceId, $id) {
    if ($method === 'GET') {
        if ($id) {
            $stmt = $opsDb->prepare("
                SELECT e.* 
                FROM fsm_estimates e
                WHERE e.id = ? AND e.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $estimate = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($estimate) {
                // Hydrate contact
                $estimates = hydrateEstimateContacts($mainDb, [$estimate], $workspaceId);
                $estimate = $estimates[0];
                
                // Get line items
                $stmt = $opsDb->prepare("SELECT * FROM fsm_estimate_line_items WHERE estimate_id = ? ORDER BY sort_order");
                $stmt->execute([$id]);
                $estimate['line_items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            echo json_encode($estimate ?: ['error' => 'Not found']);
            return;
        }
        
        // List estimates
        $status = $_GET['status'] ?? null;
        $contactId = $_GET['contact_id'] ?? null;
        
        $sql = "SELECT e.* FROM fsm_estimates e WHERE e.workspace_id = ?";
        $params = [$workspaceId];
        
        if ($status) {
            $sql .= " AND e.status = ?";
            $params[] = $status;
        }
        if ($contactId) {
            $sql .= " AND e.contact_id = ?";
            $params[] = $contactId;
        }
        
        $sql .= " ORDER BY e.created_at DESC";
        
        $stmt = $opsDb->prepare($sql);
        $stmt->execute($params);
        $estimates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Hydrate contacts
        $estimates = hydrateEstimateContacts($mainDb, $estimates, $workspaceId);
        
        echo json_encode(['items' => $estimates]);
        
    } elseif ($method === 'POST') {
        // Check if this is a convert action
        $path = $_SERVER['REQUEST_URI'] ?? '';
        if ($id && strpos($path, '/convert') !== false) {
            // Convert estimate to invoice
            try {
                // Get estimate
                $stmt = $opsDb->prepare("SELECT * FROM fsm_estimates WHERE id = ? AND workspace_id = ?");
                $stmt->execute([$id, $workspaceId]);
                $estimate = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$estimate) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Estimate not found']);
                    return;
                }
                
                if ($estimate['converted_to_invoice_id']) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Estimate already converted']);
                    return;
                }
                
                // Generate invoice number
                $stmt = $opsDb->prepare("SELECT COUNT(*) FROM invoices WHERE workspace_id = ?");
                $stmt->execute([$workspaceId]);
                $count = $stmt->fetchColumn();
                $invoiceNumber = 'INV-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
                
                // Create invoice
                $stmt = $opsDb->prepare("
                    INSERT INTO invoices (
                        workspace_id, contact_id, estimate_id, invoice_number, title,
                        issue_date, due_date, status, subtotal, tax_rate, tax_amount, total, currency, notes, terms
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    $workspaceId,
                    $estimate['contact_id'],
                    $id,
                    $invoiceNumber,
                    $estimate['title'],
                    date('Y-m-d'),
                    date('Y-m-d', strtotime('+30 days')),
                    $estimate['subtotal'],
                    $estimate['tax_rate'],
                    $estimate['tax_amount'],
                    $estimate['total'],
                    'USD',
                    $estimate['notes'],
                    $estimate['terms']
                ]);
                
                $invoiceId = $opsDb->lastInsertId();
                
                // Copy line items
                $stmt = $opsDb->prepare("SELECT * FROM fsm_estimate_line_items WHERE estimate_id = ?");
                $stmt->execute([$id]);
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $insertStmt = $opsDb->prepare("
                    INSERT INTO invoice_items (
                        invoice_id, service_id, name, description, quantity, unit_price, total, sort_order
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                foreach ($items as $item) {
                    $insertStmt->execute([
                        $invoiceId,
                        $item['service_id'],
                        $item['description'],
                        $item['description'],
                        $item['quantity'],
                        $item['unit_price'],
                        $item['total'],
                        $item['sort_order']
                    ]);
                }
                
                // Update estimate
                $stmt = $opsDb->prepare("UPDATE fsm_estimates SET status = 'converted', converted_to_invoice_id = ? WHERE id = ?");
                $stmt->execute([$invoiceId, $id]);
                
                echo json_encode([
                    'success' => true,
                    'invoice_id' => $invoiceId,
                    'invoice_number' => $invoiceNumber
                ]);
                return;
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to convert: ' . $e->getMessage()]);
                return;
            }
        }
        
        // Regular create
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Generate estimate number
        $stmt = $opsDb->prepare("SELECT COUNT(*) FROM fsm_estimates WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        $count = $stmt->fetchColumn();
        $estimateNumber = 'EST-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);
        
        $stmt = $opsDb->prepare("
            INSERT INTO fsm_estimates (
                workspace_id, user_id, contact_id, company_id, job_id,
                estimate_number, title, description, status,
                subtotal, tax_rate, tax_amount, discount_amount, total,
                valid_until, terms, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $workspaceId,
            $userId,
            $data['contact_id'] ?? null,
            $data['company_id'] ?? null,
            $data['job_id'] ?? null,
            $estimateNumber,
            $data['title'] ?? null,
            $data['description'] ?? null,
            $data['status'] ?? 'draft',
            $data['subtotal'] ?? 0,
            $data['tax_rate'] ?? 0,
            $data['tax_amount'] ?? 0,
            $data['discount_amount'] ?? 0,
            $data['total'] ?? 0,
            $data['valid_until'] ?? null,
            $data['terms'] ?? null,
            $data['notes'] ?? null
        ]);
        
        $estimateId = $opsDb->lastInsertId();
        
        // Add line items
        if (!empty($data['line_items'])) {
            $stmt = $opsDb->prepare("INSERT INTO fsm_estimate_line_items (estimate_id, service_id, description, quantity, unit_price, total, item_type, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $sortOrder = 0;
            foreach ($data['line_items'] as $item) {
                $stmt->execute([
                    $estimateId,
                    $item['service_id'] ?? null,
                    $item['description'],
                    $item['quantity'] ?? 1,
                    $item['unit_price'] ?? 0,
                    $item['total'] ?? (($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0)),
                    $item['item_type'] ?? 'service',
                    $sortOrder++
                ]);
            }
        }
        
        echo json_encode(['success' => true, 'id' => $estimateId, 'estimate_number' => $estimateNumber]);
        
    } elseif ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = [
            'contact_id', 'company_id', 'job_id', 'title', 'description', 'status',
            'subtotal', 'tax_rate', 'tax_amount', 'discount_amount', 'total',
            'valid_until', 'terms', 'notes', 'sent_at', 'viewed_at', 'accepted_at', 'signature_url'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $params[] = $workspaceId;
            $stmt = $opsDb->prepare("UPDATE fsm_estimates SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
            $stmt->execute($params);
        }
        
        // Update line items if provided
        if (isset($data['line_items'])) {
            // Delete existing
            $stmt = $opsDb->prepare("DELETE FROM fsm_estimate_line_items WHERE estimate_id = ?");
            $stmt->execute([$id]);
            
            // Insert new
            $stmt = $opsDb->prepare("INSERT INTO fsm_estimate_line_items (estimate_id, service_id, description, quantity, unit_price, total, item_type, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $sortOrder = 0;
            foreach ($data['line_items'] as $item) {
                $stmt->execute([
                    $id,
                    $item['service_id'] ?? null,
                    $item['description'],
                    $item['quantity'] ?? 1,
                    $item['unit_price'] ?? 0,
                    $item['total'] ?? (($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0)),
                    $item['item_type'] ?? 'service',
                    $sortOrder++
                ]);
            }
        }
        
        echo json_encode(['success' => true]);
        
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $opsDb->prepare("DELETE FROM fsm_estimates WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
}
