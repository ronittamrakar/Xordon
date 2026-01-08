<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ESignatureController {

    private static function getWorkspaceId() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    private static function userId() {
        return Auth::userIdOrFail();
    }

    private static function uuid() {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    private static function auditLog($requestId, $action, $details = []) {
        try {
            $db = Database::conn();
            $stmt = $db->prepare("
                INSERT INTO signature_audit_trail (signature_request_id, action, actor, details, ip_address)
                VALUES (?, ?, ?, ?, ?)
            ");
            $userId = self::userId(); // Can be null if public signer
            $stmt->execute([
                $requestId,
                $action,
                $userId ? "User #$userId" : 'Signer',
                json_encode($details),
                $_SERVER['REMOTE_ADDR'] ?? null
            ]);
        } catch (Exception $e) {
            // Ignore audit log failures
        }
    }

    public static function listRequests() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $status = $_GET['status'] ?? null;
            $sql = "SELECT * FROM signature_requests WHERE workspace_id = ?";
            $params = [$workspaceId];

            if ($status) {
                $sql .= " AND status = ?";
                $params[] = $status;
            }
            $sql .= " ORDER BY created_at DESC";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch signers for each request
            foreach ($requests as &$req) {
                $sStmt = $db->prepare("SELECT * FROM signers WHERE signature_request_id = ? ORDER BY signing_order");
                $sStmt->execute([$req['id']]);
                $req['signers'] = $sStmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Decode settings
                if (!empty($req['settings'])) {
                    $req['settings'] = json_decode($req['settings'], true);
                }
            }

            return Response::json(['data' => $requests]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    public static function createRequest() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::userId();
            $data = json_decode(file_get_contents('php://input'), true);
            $db = Database::conn();

            if (empty($data['document_type']) || empty($data['document_id']) || empty($data['signers'])) {
                return Response::error('Missing required fields', 400);
            }

            $id = self::uuid();
            // Fetch document title (mocking or fetching based on type)
            // Ideally we query the estimates/proposals table
            $docTitle = "{$data['document_type']} #{$data['document_id']}"; 
            

            // Try to fetch real title
            if ($data['document_type'] === 'estimate') {
                $estStmt = $db->prepare("SELECT title FROM estimates WHERE id = ? AND workspace_id = ?");
                $estStmt->execute([$data['document_id'], $workspaceId]);
                $est = $estStmt->fetch();
                if ($est) {
                    $docTitle = $est['title'];
                } else {
                    // Fallback to fsm_estimates
                    $estStmt = $db->prepare("SELECT title FROM fsm_estimates WHERE id = ? AND workspace_id = ?");
                    $estStmt->execute([$data['document_id'], $workspaceId]);
                    $est = $estStmt->fetch();
                    if ($est) $docTitle = $est['title'];
                }
            }


            $stmt = $db->prepare("
                INSERT INTO signature_requests 
                (id, workspace_id, document_type, document_id, document_title, status, created_by, message, expires_at, reminder_frequency)
                VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
            ");

            $expiresAt = null;
            if (!empty($data['expires_in_days'])) {
                $expiresAt = date('Y-m-d H:i:s', strtotime("+{$data['expires_in_days']} days"));
            }

            $stmt->execute([
                $id,
                $workspaceId,
                $data['document_type'],
                $data['document_id'],
                $docTitle,
                $userId,
                $data['message'] ?? null,
                $expiresAt,
                $data['reminder_frequency'] ?? 'none'
            ]);

            // Add Signers
            $signerStmt = $db->prepare("
                INSERT INTO signers (id, signature_request_id, email, name, role, signing_order, status, token)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
            ");

            $signers = $data['signers'];
            foreach ($signers as $i => $signer) {
                $signerId = self::uuid();
                $token = bin2hex(random_bytes(32));
                $signerStmt->execute([
                    $signerId,
                    $id,
                    $signer['email'],
                    $signer['name'],
                    $signer['role'] ?? 'Signer',
                    $signer['order'] ?? $i,
                    $token
                ]);
            }

            self::auditLog($id, 'Created request');

            if ($data['send_immediately'] ?? false) {
                self::send($id);
            }

            return Response::json(['data' => ['id' => $id]]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    public static function getRequest($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM signature_requests WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $request = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$request) return Response::error('Request not found', 404);

            $stmt = $db->prepare("SELECT * FROM signers WHERE signature_request_id = ? ORDER BY signing_order");
            $stmt->execute([$id]);
            $request['signers'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($request['settings']) $request['settings'] = json_decode($request['settings'], true);

            return Response::json(['data' => $request]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }


    public static function send($id) {
        try {
            $db = Database::conn();
            
            // Get request and signers
            $stmt = $db->prepare("SELECT * FROM signature_requests WHERE id = ?");
            $stmt->execute([$id]);
            $request = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$request) return Response::error('Request not found', 404);

            $stmt = $db->prepare("SELECT * FROM signers WHERE signature_request_id = ? AND status != 'signed'");
            $stmt->execute([$id]);
            $signers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            require_once __DIR__ . '/../services/SystemEmailService.php';
            $emailService = new SystemEmailService();
            $sentCount = 0;
            $errors = [];

            foreach ($signers as $signer) {
                $success = $emailService->sendSignatureRequest(
                    $signer['email'],
                    $signer['name'],
                    $request['document_title'],
                    $request['message'] ?? '',
                    $signer['token']
                );
                
                if ($success) {
                    $sentCount++;
                    $db->prepare("UPDATE signers SET status = 'sent' WHERE id = ?")->execute([$signer['id']]);
                } else {
                    $errors[] = "Failed to send to {$signer['email']}";
                }
            }

            $db->prepare("UPDATE signature_requests SET status = 'pending' WHERE id = ?")->execute([$id]);
            self::auditLog($id, 'Sent to signers', ['emails_sent' => $sentCount, 'errors' => $errors]);

            return Response::json([
                'success' => true,
                'sent_count' => $sentCount,
                'errors' => $errors
            ]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    /**
     * Public Method: Get signer context for the signing page
     */
    public static function getSignerContext($token) {
        try {
            $db = Database::conn();
            
            // Find signer by token
            $stmt = $db->prepare("SELECT * FROM signers WHERE token = ?");
            $stmt->execute([$token]);
            $signer = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$signer) return Response::error('Invalid or expired token', 404);

            // Get request details
            $stmt = $db->prepare("SELECT * FROM signature_requests WHERE id = ?");
            $stmt->execute([$signer['signature_request_id']]);
            $request = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$request) return Response::error('Request not found', 404);

            // Fetch document content based on type
            $documentContent = null;
            if ($request['document_type'] === 'estimate') {
                require_once __DIR__ . '/../public/api/operations/estimates.php';
                // We need to simulate the handleOperationsEstimates logic or just query here
                $estStmt = $db->prepare("SELECT * FROM fsm_estimates WHERE id = ?");
                $estStmt->execute([$request['document_id']]);
                $documentContent = $estStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($documentContent) {
                    $itemStmt = $db->prepare("SELECT * FROM fsm_estimate_line_items WHERE estimate_id = ? ORDER BY sort_order");
                    $itemStmt->execute([$documentContent['id']]);
                    $documentContent['line_items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
                }
            }

            return Response::json([
                'signer' => [
                    'id' => $signer['id'],
                    'name' => $signer['name'],
                    'email' => $signer['email'],
                    'status' => $signer['status']
                ],
                'request' => [
                    'id' => $request['id'],
                    'title' => $request['document_title'],
                    'message' => $request['message'],
                    'status' => $request['status']
                ],
                'document' => $documentContent
            ]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    /**
     * Public Method: Complete signing
     */
    public static function completeSignature($token) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $signatureImage = $data['signature_image'] ?? null; // base64
            
            if (!$signatureImage) return Response::error('Signature image required', 400);

            $db = Database::conn();
            $stmt = $db->prepare("SELECT * FROM signers WHERE token = ?");
            $stmt->execute([$token]);
            $signer = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$signer) return Response::error('Invalid token', 404);

            if ($signer['status'] === 'signed') return Response::error('Document already signed', 400);

            // Update signer
            $stmt = $db->prepare("
                UPDATE signers 
                SET status = 'signed', 
                    signed_at = CURRENT_TIMESTAMP, 
                    signature_image_url = ?, 
                    ip_address = ?, 
                    user_agent = ? 
                WHERE id = ?
            ");
            $stmt->execute([
                $signatureImage, // Storing as base64 for now, could save to file
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null,
                $signer['id']
            ]);

            $id = $signer['signature_request_id'];
            self::auditLog($id, 'Signer signed document', ['signer_email' => $signer['email']]);

            // Check if all signers have signed
            $checkStmt = $db->prepare("SELECT COUNT(*) FROM signers WHERE signature_request_id = ? AND status != 'signed'");
            $checkStmt->execute([$id]);
            $remaining = $checkStmt->fetchColumn();

            if ($remaining == 0) {
                $db->beginTransaction();
                try {
                    $db->prepare("UPDATE signature_requests SET status = 'completed' WHERE id = ?")->execute([$id]);
                    self::auditLog($id, 'Request completed (all signers signed)');
                    
                    // If it's an estimate, update estimate status too
                    $stmt = $db->prepare("SELECT document_type, document_id FROM signature_requests WHERE id = ?");
                    $stmt->execute([$id]);
                    $req = $stmt->fetch();
                    if ($req && $req['document_type'] === 'estimate') {
                        // Update Operations/FSM estimate
                        $db->prepare("UPDATE fsm_estimates SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP, signature_url = ? WHERE id = ?")
                           ->execute([$signatureImage, $req['document_id']]);
                        
                        // Update Finance estimate
                        $db->prepare("UPDATE estimates SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP, signature_url = ? WHERE id = ?")
                           ->execute([$signatureImage, $req['document_id']]);
                    }
                    $db->commit();
                } catch (Exception $e) {
                    $db->rollBack();
                    throw $e;
                }
            }


            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }


    public static function voidRequest($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $db->prepare("UPDATE signature_requests SET status = 'voided' WHERE id = ? AND workspace_id = ?")
               ->execute([$id, $workspaceId]);
            
            self::auditLog($id, 'Voided request');
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    public static function deleteRequest($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            // Cascading delete handles signers etc.
            $db->prepare("DELETE FROM signature_requests WHERE id = ? AND workspace_id = ?")->execute([$id, $workspaceId]);
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    public static function getAuditTrail($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            // Verify access
            $check = $db->prepare("SELECT id FROM signature_requests WHERE id = ? AND workspace_id = ?");
            $check->execute([$id, $workspaceId]);
            if (!$check->fetch()) return Response::error('Access denied', 403);

            $stmt = $db->prepare("SELECT * FROM signature_audit_trail WHERE signature_request_id = ? ORDER BY timestamp DESC");
            $stmt->execute([$id]);
            $trail = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json($trail); // Direct array as per API
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    public static function getTemplates() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $stmt = $db->prepare("SELECT * FROM signature_templates WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return Response::json($templates);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    public static function getSettings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $stmt = $db->prepare("SELECT * FROM signature_settings WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$settings) {
                // Return defaults
                return Response::json([
                    'default_expiration_days' => 7,
                    'default_reminder_frequency' => 'weekly'
                ]);
            }
            return Response::json($settings);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    public static function updateSettings() {
         try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true);
            $db = Database::conn();

            $stmt = $db->prepare("
                INSERT INTO signature_settings (workspace_id, default_expiration_days, default_reminder_frequency, terms_text, redirect_url)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                default_expiration_days = VALUES(default_expiration_days),
                default_reminder_frequency = VALUES(default_reminder_frequency),
                terms_text = VALUES(terms_text),
                redirect_url = VALUES(redirect_url)
            ");

            $stmt->execute([
                $workspaceId,
                $data['default_expiration_days'] ?? 7,
                $data['default_reminder_frequency'] ?? 'weekly',
                $data['terms_text'] ?? null,
                $data['redirect_url'] ?? null
            ]);
            
            return self::getSettings();
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }
}
