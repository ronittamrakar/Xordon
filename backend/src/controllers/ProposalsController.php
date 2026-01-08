<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';

class ProposalsController {
    
    public static function getAll(): void {
        $ctx = TenantContext::resolveOrFail();
        $db = Database::conn();
        
        $db = Database::conn();
        $status = $_GET['status'] ?? null;
        $search = $_GET['search'] ?? null;
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        $where = ['p.workspace_id = ?'];
        $params = [$ctx->workspaceId];
        
        if ($status && $status !== 'all') {
            $where[] = 'p.status = ?';
            $params[] = $status;
        }
        
        if ($search) {
            $where[] = '(p.name LIKE ? OR p.client_name LIKE ? OR p.client_email LIKE ? OR p.client_company LIKE ?)';
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM proposals p WHERE $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get proposals with template info
        $sql = "SELECT p.*, pt.name as template_name 
                FROM proposals p 
                LEFT JOIN proposal_templates pt ON p.template_id = pt.id 
                WHERE $whereClause 
                ORDER BY p.created_at DESC 
                LIMIT $limit OFFSET $offset";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $proposals = $stmt->fetchAll();
        
        // Parse JSON fields
        foreach ($proposals as &$proposal) {
            $proposal['sections'] = json_decode($proposal['sections'] ?? '[]', true);
            $proposal['pricing'] = json_decode($proposal['pricing'] ?? '{}', true);
            $proposal['custom_fields'] = json_decode($proposal['custom_fields'] ?? '{}', true);
            $proposal['styling'] = json_decode($proposal['styling'] ?? '{}', true);
        }
        
        Response::json([
            'items' => $proposals,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    public static function getOne(int $id): void {
        $ctx = TenantContext::resolveOrFail();
        
        $db = Database::conn();
        $stmt = $db->prepare("
            SELECT p.*, pt.name as template_name 
            FROM proposals p 
            LEFT JOIN proposal_templates pt ON p.template_id = pt.id 
            WHERE p.id = ? AND p.workspace_id = ?
        ");
        $stmt->execute([$id, $ctx->workspaceId]);
        $proposal = $stmt->fetch();
        
        if (!$proposal) {
            Response::json(['error' => 'Proposal not found'], 404);
            return;
        }
        
        // Parse JSON fields
        $proposal['sections'] = json_decode($proposal['sections'] ?? '[]', true);
        $proposal['pricing'] = json_decode($proposal['pricing'] ?? '{}', true);
        $proposal['custom_fields'] = json_decode($proposal['custom_fields'] ?? '{}', true);
        $proposal['styling'] = json_decode($proposal['styling'] ?? '{}', true);
        
        // Get line items
        $itemsStmt = $db->prepare("SELECT * FROM proposal_items WHERE proposal_id = ? ORDER BY sort_order");
        $itemsStmt->execute([$id]);
        $proposal['items'] = $itemsStmt->fetchAll();
        
        // Get activities
        $activitiesStmt = $db->prepare("SELECT * FROM proposal_activities WHERE proposal_id = ? ORDER BY created_at DESC LIMIT 50");
        $activitiesStmt->execute([$id]);
        $proposal['activities'] = $activitiesStmt->fetchAll();
        
        // Get comments
        $commentsStmt = $db->prepare("SELECT * FROM proposal_comments WHERE proposal_id = ? ORDER BY created_at ASC");
        $commentsStmt->execute([$id]);
        $proposal['comments'] = $commentsStmt->fetchAll();
        
        Response::json($proposal);
    }
    
    public static function create(): void {
        $ctx = TenantContext::resolveOrFail();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['name'])) {
            Response::json(['error' => 'Proposal name is required'], 400);
            return;
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO proposals (
                workspace_id, user_id, template_id, name, client_name, client_email, client_company,
                client_phone, client_address, token, content, sections, cover_image, logo,
                pricing, total_amount, currency, valid_until, status, notes,
                internal_notes, custom_fields, styling, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $token = bin2hex(random_bytes(16));
        
        $stmt->execute([
            $ctx->workspaceId,
            $ctx->userId,
            $data['template_id'] ?? null,
            $data['name'],
            $data['client_name'] ?? null,
            $data['client_email'] ?? null,
            $data['client_company'] ?? null,
            $data['client_phone'] ?? null,
            $data['client_address'] ?? null,
            $token,
            $data['content'] ?? '',
            json_encode($data['sections'] ?? []),
            $data['cover_image'] ?? null,
            $data['logo'] ?? null,
            json_encode($data['pricing'] ?? []),
            $data['total_amount'] ?? 0,
            $data['currency'] ?? 'USD',
            $data['valid_until'] ?? null,
            $data['status'] ?? 'draft',
            $data['notes'] ?? null,
            $data['internal_notes'] ?? null,
            json_encode($data['custom_fields'] ?? []),
            json_encode($data['styling'] ?? [])
        ]);
        
        $proposalId = $db->lastInsertId();
        
        // Insert line items if provided
        if (!empty($data['items'])) {
            self::saveItems($db, $proposalId, $data['items']);
        }
        
        // Log activity
        self::logActivity($db, $proposalId, 'created', 'Proposal created');
        
        Response::json(['id' => $proposalId, 'message' => 'Proposal created successfully'], 201);
    }
    
    public static function update(int $id): void {
        $ctx = TenantContext::resolveOrFail();
        
        $db = Database::conn();
        
        // Check ownership
        $checkStmt = $db->prepare("SELECT id FROM proposals WHERE id = ? AND workspace_id = ?");
        $checkStmt->execute([$id, $ctx->workspaceId]);
        if (!$checkStmt->fetch()) {
            Response::json(['error' => 'Proposal not found'], 404);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $fields = [];
        $params = [];
        
        $allowedFields = [
            'name', 'template_id', 'client_name', 'client_email', 'client_company',
            'client_phone', 'client_address', 'content', 'cover_image', 'logo',
            'total_amount', 'currency', 'valid_until', 'status', 'notes',
            'internal_notes', 'signature', 'signed_by'
        ];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        // Handle JSON fields
        $jsonFields = ['sections', 'pricing', 'custom_fields', 'styling'];
        foreach ($jsonFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = json_encode($data[$field]);
            }
        }
        
        // Handle status changes with timestamps
        if (isset($data['status'])) {
            switch ($data['status']) {
                case 'sent':
                    $fields[] = "sent_at = NOW()";
                    self::logActivity($db, $id, 'sent', 'Proposal sent to client');
                    break;
                case 'accepted':
                    $fields[] = "accepted_at = NOW()";
                    self::logActivity($db, $id, 'accepted', 'Proposal accepted by client');
                    break;
                case 'declined':
                    $fields[] = "declined_at = NOW()";
                    self::logActivity($db, $id, 'declined', 'Proposal declined by client');
                    break;
            }
        }
        
        if (isset($data['signature'])) {
            $fields[] = "signed_at = NOW()";
            self::logActivity($db, $id, 'signed', 'Proposal signed');
        }
        
        if (empty($fields)) {
            Response::json(['error' => 'No fields to update'], 400);
            return;
        }
        
        $fields[] = "updated_at = NOW()";
        $params[] = $id;
        
        $sql = "UPDATE proposals SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        // Update line items if provided
        if (isset($data['items'])) {
            // Delete existing items
            $db->prepare("DELETE FROM proposal_items WHERE proposal_id = ?")->execute([$id]);
            // Insert new items
            self::saveItems($db, $id, $data['items']);
        }
        
        self::logActivity($db, $id, 'updated', 'Proposal updated');
        
        Response::json(['message' => 'Proposal updated successfully']);
    }
    
    public static function delete(int $id): void {
        $ctx = TenantContext::resolveOrFail();
        
        $db = Database::conn();
        $stmt = $db->prepare("DELETE FROM proposals WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        
        if ($stmt->rowCount() === 0) {
            Response::json(['error' => 'Proposal not found'], 404);
            return;
        }
        
        Response::json(['message' => 'Proposal deleted successfully']);
    }

    public static function destroyPermanent(int $id): void {
        $ctx = TenantContext::resolveOrFail();
        
        $db = Database::conn();
        $stmt = $db->prepare("DELETE FROM proposals WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        
        if ($stmt->rowCount() === 0) {
            Response::json(['error' => 'Proposal not found'], 404);
            return;
        }
        
        Response::json(['message' => 'Proposal permanently deleted']);
    }
    
    public static function archive(int $id): void {
        $ctx = TenantContext::resolveOrFail();
        $db = Database::conn();
        
        // Check ownership
        $stmt = $db->prepare("SELECT id FROM proposals WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        if (!$stmt->fetch()) {
             Response::json(['error' => 'Proposal not found'], 404);
             return;
        }
        
        $db->prepare("UPDATE proposals SET status = 'archived', updated_at = NOW() WHERE id = ?")->execute([$id]);
        self::logActivity($db, $id, 'archived', 'Proposal archived');
        
        Response::json(['message' => 'Proposal archived successfully']);
    }

    public static function restore(int $id): void {
        $ctx = TenantContext::resolveOrFail();
        $db = Database::conn();
        
        // Check ownership
        $stmt = $db->prepare("SELECT id FROM proposals WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        if (!$stmt->fetch()) {
             Response::json(['error' => 'Proposal not found'], 404);
             return;
        }
        
        $db->prepare("UPDATE proposals SET status = 'draft', updated_at = NOW() WHERE id = ?")->execute([$id]);
        self::logActivity($db, $id, 'restored', 'Proposal restored from archive');
        
        Response::json(['message' => 'Proposal restored successfully']);
    }

    public static function getArchived(): void {
        // Reuse getAll logic but force status=archived
        $_GET['status'] = 'archived';
        self::getAll();
    }
    
    // Workflow Settings
    public static function getWorkflowSettings(): void {
         Response::json([
            'enabled' => false,
            'required_approvers' => 1,
            'approvers' => [],
            'auto_send' => true,
        ]);
    }
    
    public static function updateWorkflowSettings(): void {
         Response::json(['message' => 'Settings updated']);
    }
    
    // Integrations
    public static function getIntegrations(): void {
        Response::json(['items' => []]);
    }
    
    public static function duplicate(int $id): void {
        $ctx = TenantContext::resolveOrFail();
        
        $db = Database::conn();
        
        // Get original proposal
        $stmt = $db->prepare("SELECT * FROM proposals WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        $original = $stmt->fetch();
        
        if (!$original) {
            Response::json(['error' => 'Proposal not found'], 404);
            return;
        }
        
        // Create duplicate
        $newName = $original['name'] . ' (Copy)';
        $insertStmt = $db->prepare("
            INSERT INTO proposals (
                workspace_id, user_id, template_id, name, client_name, client_email, client_company,
                client_phone, client_address, token, content, sections, cover_image, logo,
                pricing, total_amount, currency, valid_until, status, notes,
                internal_notes, custom_fields, styling, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $newToken = bin2hex(random_bytes(16));

        $insertStmt->execute([
            $ctx->workspaceId,
            $ctx->userId,
            $original['template_id'],
            $newName,
            $original['client_name'],
            $original['client_email'],
            $original['client_company'],
            $original['client_phone'],
            $original['client_address'],
            $newToken,
            $original['content'],
            $original['sections'],
            $original['cover_image'],
            $original['logo'],
            $original['pricing'],
            $original['total_amount'],
            $original['currency'],
            $original['valid_until'],
            $original['notes'],
            $original['internal_notes'],
            $original['custom_fields'],
            $original['styling']
        ]);
        
        $newId = $db->lastInsertId();
        
        // Duplicate line items
        $itemsStmt = $db->prepare("SELECT * FROM proposal_items WHERE proposal_id = ?");
        $itemsStmt->execute([$id]);
        $items = $itemsStmt->fetchAll();
        
        foreach ($items as $item) {
            $db->prepare("
                INSERT INTO proposal_items (proposal_id, name, description, quantity, unit_price, discount_percent, tax_percent, total, sort_order, category, is_optional)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ")->execute([
                $newId,
                $item['name'],
                $item['description'],
                $item['quantity'],
                $item['unit_price'],
                $item['discount_percent'],
                $item['tax_percent'],
                $item['total'],
                $item['sort_order'],
                $item['category'],
                $item['is_optional']
            ]);
        }
        
        self::logActivity($db, $newId, 'created', 'Proposal duplicated from #' . $id);
        
        Response::json(['id' => $newId, 'message' => 'Proposal duplicated successfully'], 201);
    }
    
    public static function send(int $id): void {
        $ctx = TenantContext::resolveOrFail();
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM proposals WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user['id']]);
        $proposal = $stmt->fetch();
        
        if (!$proposal) {
            Response::json(['error' => 'Proposal not found'], 404);
            return;
        }
        
        if (empty($proposal['client_email'])) {
            Response::json(['error' => 'Client email is required to send proposal'], 400);
            return;
        }
        
        // Update status to sent
        $db->prepare("UPDATE proposals SET status = 'sent', sent_at = NOW(), updated_at = NOW() WHERE id = ?")->execute([$id]);
        
        self::logActivity($db, $id, 'sent', 'Proposal sent to ' . $proposal['client_email']);
        
        // Send email
        require_once __DIR__ . '/../services/SimpleMail.php';
        
        // Fetch sending account
        $accountStmt = $db->prepare("SELECT * FROM sending_accounts WHERE (user_id = ? OR workspace_id = ?) AND status = 'active' LIMIT 1");
        $accountStmt->execute([$ctx->userId, $ctx->workspaceId]);
        $sendingAccount = $accountStmt->fetch(PDO::FETCH_ASSOC);

        if (!$sendingAccount) {
             $sendingAccount = [
                 'id' => 0, // Dummy ID
                 'user_id' => $user['id'],
                 'email' => $user['email'],
                 'name' => $user['name'] ?? 'Xordon User',
                 'smtp_host' => '',
                 'smtp_password' => ''
             ];
        }

        $mailer = new SimpleMail();
        $appName = getenv('APP_NAME') ?: 'Xordon';
        $appUrl = getenv('APP_URL') ?: 'http://localhost:9000';
        
        $subject = "Proposal from " . ($sendingAccount['name'] ?: $appName) . ": " . $proposal['name'];
        $link = $appUrl . "/proposals/public/" . $proposal['token'];
        
        $content = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2 style='color: #333;'>New Proposal Received</h2>
                <p>Hello {$proposal['client_name']},</p>
                <p>You have received a new proposal <strong>{$proposal['name']}</strong>.</p>
                <div style='margin: 30px 0; text-align: center;'>
                    <a href='{$link}' style='background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'>View Proposal</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href='{$link}'>{$link}</a></p>
                <hr style='border: none; border-top: 1px solid #eee; margin: 30px 0;' />
                <p style='color: #666; font-size: 12px;'>Sent via {$appName}</p>
            </div>
        ";
        
        $emailSent = $mailer->sendEmail($sendingAccount, $proposal['client_email'], $subject, $content);
        
        if (!$emailSent) {
             // We return success but note the failure in logs, or we could return a warning.
             // For now, let's just log it self::logActivity handled previously? No, that was 'sent' updated.
             // Maybe add a note or log.
             error_log("Failed to send proposal email to " . $proposal['client_email']);
             Response::json(['message' => 'Proposal marked as sent, but email delivery failed. Please check server logs.'], 200); // 200 with warning? Or just standard message.
             return;
        }
        
        Response::json(['message' => 'Proposal sent successfully']);
    }
    
    public static function getPublic(string $token): void {
        // Public view for clients - no auth required
        $db = Database::conn();
        
        // Token could be proposal ID or a generated token
        $stmt = $db->prepare("SELECT p.*, pt.name as template_name FROM proposals p LEFT JOIN proposal_templates pt ON p.template_id = pt.id WHERE p.token = ?");
        $stmt->execute([$token]);
        $proposal = $stmt->fetch();
        
        if (!$proposal) {
            Response::json(['error' => 'Proposal not found'], 404);
            return;
        }
        
        // Log view activity
        if ($proposal['status'] === 'sent') {
            $db = Database::conn();
            $db->prepare("UPDATE proposals SET viewed_at = COALESCE(viewed_at, NOW()) WHERE id = ?")->execute([$proposal['id']]);
            self::logActivity($db, $proposal['id'], 'viewed', 'Proposal viewed by client', $_SERVER['REMOTE_ADDR'] ?? null);
        }
        
        // Parse JSON fields
        $proposal['sections'] = json_decode($proposal['sections'] ?? '[]', true);
        $proposal['pricing'] = json_decode($proposal['pricing'] ?? '{}', true);
        $proposal['styling'] = json_decode($proposal['styling'] ?? '{}', true);
        
        // Get line items
        $itemsStmt = $db->prepare("SELECT * FROM proposal_items WHERE proposal_id = ? ORDER BY sort_order");
        $itemsStmt->execute([$proposal['id']]);
        $proposal['items'] = $itemsStmt->fetchAll();
        
        // Remove sensitive fields
        unset($proposal['internal_notes']);
        unset($proposal['user_id']);
        
        Response::json($proposal);
    }
    
    public static function acceptPublic(string $token): void {
        $db = Database::conn();
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("SELECT * FROM proposals WHERE token = ? AND status = 'sent'");
        $stmt->execute([$token]);
        $proposal = $stmt->fetch();
        
        if (!$proposal) {
            Response::json(['error' => 'Proposal not found or already processed'], 404);
            return;
        }
        
        $db->prepare("
            UPDATE proposals SET 
                status = 'accepted', 
                accepted_at = NOW(), 
                signature = ?,
                signed_by = ?,
                signed_at = NOW(),
                updated_at = NOW() 
            WHERE id = ?
        ")->execute([
            $data['signature'] ?? null,
            $data['signed_by'] ?? $proposal['client_name'],
            $proposal['id']
        ]);
        
        self::logActivity($db, $proposal['id'], 'accepted', 'Proposal accepted by ' . ($data['signed_by'] ?? $proposal['client_name']), $_SERVER['REMOTE_ADDR'] ?? null);
        
        Response::json(['message' => 'Proposal accepted successfully']);
    }
    
    public static function declinePublic(string $token): void {
        $db = Database::conn();
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $db->prepare("SELECT * FROM proposals WHERE token = ? AND status = 'sent'");
        $stmt->execute([$token]);
        $proposal = $stmt->fetch();
        
        if (!$proposal) {
            Response::json(['error' => 'Proposal not found or already processed'], 404);
            return;
        }
        
        $db->prepare("UPDATE proposals SET status = 'declined', declined_at = NOW(), updated_at = NOW() WHERE id = ?")->execute([$proposal['id']]);
        
        self::logActivity($db, $proposal['id'], 'declined', 'Proposal declined. Reason: ' . ($data['reason'] ?? 'Not specified'), $_SERVER['REMOTE_ADDR'] ?? null);
        
        Response::json(['message' => 'Proposal declined']);
    }
    
    public static function addComment(int $id): void {
        $user = Auth::user();
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['content'])) {
            Response::json(['error' => 'Comment content is required'], 400);
            return;
        }
        
        $db = Database::conn();
        
        // Check if proposal exists
        $stmt = $db->prepare("SELECT id, user_id FROM proposals WHERE id = ?");
        $stmt->execute([$id]);
        $proposal = $stmt->fetch();
        
        if (!$proposal) {
            Response::json(['error' => 'Proposal not found'], 404);
            return;
        }
        
        $isInternal = $user && $proposal['user_id'] == $user['id'];
        
        $db->prepare("
            INSERT INTO proposal_comments (proposal_id, user_id, author_name, author_email, content, is_internal, parent_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ")->execute([
            $id,
            $user['id'] ?? null,
            $data['author_name'] ?? ($user['name'] ?? 'Anonymous'),
            $data['author_email'] ?? ($user['email'] ?? null),
            $data['content'],
            $isInternal ? ($data['is_internal'] ?? false) : false,
            $data['parent_id'] ?? null
        ]);
        
        $commentId = $db->lastInsertId();
        
        self::logActivity($db, $id, 'comment', 'Comment added');
        
        Response::json(['id' => $commentId, 'message' => 'Comment added successfully'], 201);
    }
    
    public static function getStats(): void {
        $ctx = TenantContext::resolveOrFail();
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'viewed' THEN 1 ELSE 0 END) as viewed,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as declined,
                SUM(CASE WHEN status = 'accepted' THEN total_amount ELSE 0 END) as total_accepted_value,
                SUM(CASE WHEN status = 'sent' THEN total_amount ELSE 0 END) as total_pending_value
            FROM proposals WHERE workspace_id = ?
        ");
        $stmt->execute([$ctx->workspaceId]);
        $stats = $stmt->fetch();
        
        // Calculate acceptance rate
        $sentCount = $stats['sent'] + $stats['accepted'] + $stats['declined'];
        $stats['acceptance_rate'] = $sentCount > 0 ? round(($stats['accepted'] / $sentCount) * 100, 1) : 0;
        
        Response::json($stats);
    }
    
    private static function saveItems(PDO $db, int $proposalId, array $items): void {
        $stmt = $db->prepare("
            INSERT INTO proposal_items (proposal_id, name, description, quantity, unit_price, discount_percent, tax_percent, total, sort_order, category, is_optional)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($items as $index => $item) {
            $quantity = floatval($item['quantity'] ?? 1);
            $unitPrice = floatval($item['unit_price'] ?? 0);
            $discount = floatval($item['discount_percent'] ?? 0);
            $tax = floatval($item['tax_percent'] ?? 0);
            
            $subtotal = $quantity * $unitPrice;
            $discountAmount = $subtotal * ($discount / 100);
            $afterDiscount = $subtotal - $discountAmount;
            $taxAmount = $afterDiscount * ($tax / 100);
            $total = $afterDiscount + $taxAmount;
            
            $stmt->execute([
                $proposalId,
                $item['name'] ?? '',
                $item['description'] ?? null,
                $quantity,
                $unitPrice,
                $discount,
                $tax,
                $total,
                $item['sort_order'] ?? $index,
                $item['category'] ?? null,
                $item['is_optional'] ?? false
            ]);
        }
    }
    
    private static function logActivity(PDO $db, int $proposalId, string $type, string $description, ?string $ip = null): void {
        $db->prepare("
            INSERT INTO proposal_activities (proposal_id, activity_type, description, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ")->execute([
            $proposalId,
            $type,
            $description,
            $ip ?? ($_SERVER['REMOTE_ADDR'] ?? null),
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
    }
}
