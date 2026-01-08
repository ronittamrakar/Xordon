<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class RecipientsController {
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $campaignId = get_query('campaignId');
        $pdo = Database::conn();
        
        // Build base WHERE with workspace scoping
        $baseWhere = '';
        $baseParams = [];
        if ($ctx && isset($ctx->workspaceId)) {
            $baseWhere = 'r.workspace_id = ?';
            $baseParams[] = (int)$ctx->workspaceId;
        } else {
            $baseWhere = 'r.user_id = ?';
            $baseParams[] = $userId;
        }
        
        // Fetch recipients with their tags (use LEFT JOIN to include contacts without campaigns)
        if ($campaignId) {
            $stmt = $pdo->prepare("SELECT r.* FROM recipients r LEFT JOIN campaigns c ON r.campaign_id = c.id WHERE r.campaign_id = ? AND $baseWhere ORDER BY r.id DESC");
            $stmt->execute([$campaignId, ...$baseParams]);
        } else {
            $stmt = $pdo->prepare("SELECT r.* FROM recipients r WHERE $baseWhere ORDER BY r.id DESC");
            $stmt->execute($baseParams);
        }
        $rows = $stmt->fetchAll();
        
        // Fetch tags for all recipients
        if (!empty($rows)) {
            $recipientIds = array_column($rows, 'id');
            $placeholders = str_repeat('?,', count($recipientIds) - 1) . '?';
            $tagStmt = $pdo->prepare("
                SELECT rt.recipient_id, t.id, t.name, t.color 
                FROM recipient_tags rt 
                JOIN tags t ON rt.tag_id = t.id 
                WHERE rt.recipient_id IN ($placeholders)
                ORDER BY t.name
            ");
            $tagStmt->execute($recipientIds);
            $tagRows = $tagStmt->fetchAll();
            
            // Group tags by recipient_id
            $tagsByRecipient = [];
            foreach ($tagRows as $tagRow) {
                $recipientId = $tagRow['recipient_id'];
                if (!isset($tagsByRecipient[$recipientId])) {
                    $tagsByRecipient[$recipientId] = [];
                }
                $tagsByRecipient[$recipientId][] = [
                    'id' => $tagRow['id'],
                    'name' => $tagRow['name'],
                    'color' => $tagRow['color']
                ];
            }
            
            // Add tags to each recipient
            foreach ($rows as &$row) {
                $row['tags'] = $tagsByRecipient[$row['id']] ?? [];
            }
        }
        
        Response::json(['items' => array_map(fn($r) => self::map($r), $rows)]);
    }
    public static function bulkCreate(): void {
        $userId = Auth::userIdOrFail();
        $b = get_json_body();
        $items = $b['items'] ?? [];
        if (!is_array($items) || empty($items)) Response::error('No recipients', 422);
        
        try {
            $pdo = Database::conn();

            // Determine if we need to auto-create a default campaign
            $needsDefault = false;
            foreach ($items as $i) {
                $cidCheck = $i['campaignId'] ?? $i['campaign_id'] ?? null;
                if (!$cidCheck) { $needsDefault = true; break; }
            }
            $defaultCampaignId = null;
            if ($needsDefault) {
                // Find a sending account for the user (required by DB schema)
                $sa = $pdo->prepare('SELECT id FROM sending_accounts WHERE user_id = ? ORDER BY id LIMIT 1');
                $sa->execute([$userId]);
                $saRow = $sa->fetch();
                if (!$saRow) { Response::error('No sending account found to create default campaign', 422); return; }
                // Find or create a default campaign
                $cfind = $pdo->prepare('SELECT id FROM campaigns WHERE user_id = ? AND name = ? LIMIT 1');
                $cfind->execute([$userId, 'Default Contacts']);
                $crow = $cfind->fetch();
                if ($crow) {
                    $defaultCampaignId = (int)$crow['id'];
                } else {
                    $cins = $pdo->prepare('INSERT INTO campaigns (user_id, name, subject, html_content, status, sending_account_id, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
                    $cins->execute([$userId, 'Default Contacts', 'Default Contacts', '<p>Default contacts campaign</p>', 'draft', (int)$saRow['id']]);
                    $defaultCampaignId = (int)$pdo->lastInsertId();
                }
            }

            // Insert with track_token and custom_fields
            $ins = $pdo->prepare('INSERT INTO recipients (campaign_id, email, name, company, status, track_token, custom_fields, created_at) VALUES (?, ?, ?, ?, "pending", ?, ?, CURRENT_TIMESTAMP)');
            $created = [];
            $counts = [];
            $errors = [];
            
            foreach ($items as $i) {
                $cid = $i['campaignId'] ?? $i['campaign_id'] ?? null;
                $email = trim($i['email'] ?? '');
                $firstName = trim($i['firstName'] ?? $i['first_name'] ?? '');
                $lastName = trim($i['lastName'] ?? $i['last_name'] ?? '');
                $name = trim($firstName . ' ' . $lastName);
                if (empty($name)) {
                    $name = trim($i['name'] ?? '');
                }
                $company = trim($i['company'] ?? '');
                
                // Handle custom fields
                $customFields = [];
                if (isset($i['custom_fields']) && is_array($i['custom_fields'])) {
                    $customFields = $i['custom_fields'];
                } else {
                    // Extract any additional fields that aren't standard
                    $standardFields = ['campaignId', 'campaign_id', 'email', 'firstName', 'first_name', 'lastName', 'last_name', 'name', 'company'];
                    foreach ($i as $key => $value) {
                        if (!in_array($key, $standardFields) && !empty($value)) {
                            $customFields[$key] = $value;
                        }
                    }
                }
                $customFieldsJson = !empty($customFields) ? json_encode($customFields) : null;
                
                if (!$email) {
                    $errors[] = "Skipped recipient: missing email address";
                    continue;
                }
                if (!$cid) { $cid = $defaultCampaignId; }
                if (!$cid) {
                    $errors[] = "Skipped recipient $email: no valid campaign ID";
                    continue;
                }
                
                // Ensure campaign belongs to user
                $stmt = $pdo->prepare('SELECT 1 FROM campaigns WHERE id = ? AND user_id = ?');
                $stmt->execute([$cid, $userId]);
                if (!$stmt->fetch()) {
                    $errors[] = "Skipped recipient $email: campaign $cid not found or unauthorized";
                    continue;
                }
                
                // Generate tracking token
                try { $token = bin2hex(random_bytes(16)); } catch (Throwable $e) { $token = sha1(uniqid('', true)); }
                
                // Insert recipient
                try {
                    $ins->execute([$cid, $email, $name, $company, $token, $customFieldsJson]);
                    $id = (int)$pdo->lastInsertId();
                    $created[] = self::map([
                        'id' => $id,
                        'campaign_id' => $cid,
                        'email' => $email,
                        'name' => $name,
                        'company' => $company,
                        'status' => 'pending',
                        'created_at' => date('Y-m-d H:i:s'),
                    ]);
                    $counts[$cid] = ($counts[$cid] ?? 0) + 1;
                } catch (Exception $e) {
                    // Check if it's a duplicate email error
                    if (strpos($e->getMessage(), 'Duplicate entry') !== false || strpos($e->getMessage(), 'UNIQUE constraint') !== false) {
                        $errors[] = "Skipped recipient $email: already exists in campaign $cid";
                    } else {
                        $errors[] = "Failed to add recipient $email: " . $e->getMessage();
                    }
                }
            }

            // Update campaign aggregate for total recipients
            foreach ($counts as $cid => $count) {
                try {
                    $upd = $pdo->prepare('UPDATE campaigns SET total_recipients = total_recipients + ? WHERE id = ? AND user_id = ?');
                    $upd->execute([$count, $cid, $userId]);
                } catch (Exception $e) {
                    $errors[] = "Failed to update campaign $cid recipient count: " . $e->getMessage();
                }
            }

            // Return response with created items and any errors
            $response = ['items' => $created];
            if (!empty($errors)) {
                $response['warnings'] = $errors;
            }
            
            Response::json($response, 201);
            
        } catch (Exception $e) {
            Response::error('Failed to add recipients to campaign: ' . $e->getMessage(), 500);
        }
    }
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $b = get_json_body();
        $map = [
            'status' => 'status',
            'sent_at' => 'sent_at',
            'opens' => 'opens',
            'clicks' => 'clicks',
            'bounces' => 'bounces',
        ];
        $sets = [];
        $vals = [];
        foreach ($map as $k => $col) {
            if (array_key_exists($k, $b)) { $sets[] = "$col = ?"; $vals[] = $b[$k]; }
        }
        if (empty($sets)) Response::error('No changes', 422);
        
        // Build WHERE with workspace scoping
        $whereConditions = ['id = ?'];
        $vals[] = $id;
        if ($ctx && isset($ctx->workspaceId)) {
            $whereConditions[] = 'workspace_id = ?';
            $vals[] = (int)$ctx->workspaceId;
        } else {
            $whereConditions[] = 'user_id = ?';
            $vals[] = $userId;
        }
        $whereClause = implode(' AND ', $whereConditions);
        
        $pdo = Database::conn();
        $sql = 'UPDATE recipients SET ' . implode(', ', $sets) . " WHERE $whereClause";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($vals);
        Response::json(['ok' => true]);
    }
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        // Build WHERE with workspace scoping
        $whereConditions = ['id = ?'];
        $params = [$id];
        if ($ctx && isset($ctx->workspaceId)) {
            $whereConditions[] = 'workspace_id = ?';
            $params[] = (int)$ctx->workspaceId;
        } else {
            $whereConditions[] = 'user_id = ?';
            $params[] = $userId;
        }
        $whereClause = implode(' AND ', $whereConditions);
        
        $stmt = $pdo->prepare("DELETE FROM recipients WHERE $whereClause");
        $stmt->execute($params);
        Response::json(['ok' => true]);
    }

    public static function unsubscribed(): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $campaignId = get_query('campaignId');
        $pdo = Database::conn();
        
        // Build base WHERE with workspace scoping
        $baseWhere = '';
        $baseParams = [];
        if ($ctx && isset($ctx->workspaceId)) {
            $baseWhere = 'r.workspace_id = ?';
            $baseParams[] = (int)$ctx->workspaceId;
        } else {
            $baseWhere = 'r.user_id = ?';
            $baseParams[] = $userId;
        }
        
        if ($campaignId) {
            $stmt = $pdo->prepare("
                SELECT r.*, c.name as campaign_name 
                FROM recipients r 
                LEFT JOIN campaigns c ON r.campaign_id = c.id 
                WHERE r.campaign_id = ? AND $baseWhere AND r.unsubscribed_at IS NOT NULL 
                ORDER BY r.unsubscribed_at DESC
            ");
            $stmt->execute([$campaignId, ...$baseParams]);
        } else {
            $stmt = $pdo->prepare("
                SELECT r.*, c.name as campaign_name 
                FROM recipients r 
                LEFT JOIN campaigns c ON r.campaign_id = c.id 
                WHERE $baseWhere AND r.unsubscribed_at IS NOT NULL 
                ORDER BY r.unsubscribed_at DESC
            ");
            $stmt->execute($baseParams);
        }
        
        $rows = $stmt->fetchAll();
        $items = array_map(function($r) {
            $mapped = self::map($r);
            $mapped['campaign_name'] = $r['campaign_name'] ?? '';
            $mapped['unsubscribed_at'] = $r['unsubscribed_at'];
            $mapped['unsubscribes'] = (int)($r['unsubscribes'] ?? 0);
            return $mapped;
        }, $rows);
        
        Response::json(['items' => $items]);
    }

    public static function bulkUnsubscribe(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $emails = $body['emails'] ?? [];
        
        if (!is_array($emails) || empty($emails)) {
            Response::error('No emails provided', 422);
            return;
        }
        
        $pdo = Database::conn();
        $success = [];
        $failed = [];
        
        foreach ($emails as $email) {
            $email = trim($email);
            if (empty($email)) {
                $failed[] = $email;
                continue;
            }
            
            try {
                $recipientIds = [];
                
                // Check if it's a domain pattern (starts with @)
                if (strpos($email, '@') === 0) {
                    $domain = substr($email, 1);
                    if (empty($domain)) {
                        $failed[] = $email;
                        continue;
                    }
                    
                    // Find recipients with emails ending with this domain
                    $stmt = $pdo->prepare('
                        SELECT id 
                        FROM recipients 
                        WHERE email LIKE ? AND user_id = ? AND unsubscribed_at IS NULL
                    ');
                    $stmt->execute(['%@' . $domain, $userId]);
                    $recipientIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
                } else {
                    // Validate individual email address
                    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        $failed[] = $email;
                        continue;
                    }
                    
                    // Find recipients with this exact email that belong to user's campaigns
                    $stmt = $pdo->prepare('
                        SELECT id 
                        FROM recipients 
                        WHERE email = ? AND user_id = ? AND unsubscribed_at IS NULL
                    ');
                    $stmt->execute([$email, $userId]);
                    $recipientIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
                }
                
                if (empty($recipientIds)) {
                    $failed[] = $email;
                    continue;
                }
                
                // Update all matching recipients to unsubscribed
                $placeholders = str_repeat('?,', count($recipientIds) - 1) . '?';
                $updateStmt = $pdo->prepare("
                    UPDATE recipients 
                    SET unsubscribed_at = NOW(), unsubscribes = unsubscribes + 1 
                    WHERE id IN ($placeholders)
                ");
                $updateStmt->execute($recipientIds);
                
                // Update campaign unsubscribe counts
                $campaignStmt = $pdo->prepare('
                    UPDATE campaigns c 
                    SET unsubscribes = unsubscribes + 1 
                    WHERE c.id IN (
                        SELECT DISTINCT r.campaign_id 
                        FROM recipients r 
                        WHERE r.id IN (' . $placeholders . ')
                    )
                ');
                $campaignStmt->execute($recipientIds);
                
                $success[] = $email . ' (' . count($recipientIds) . ' recipients)';
            } catch (Exception $e) {
                error_log('Bulk unsubscribe error: ' . $e->getMessage());
                $failed[] = $email;
            }
        }
        
        Response::json([
            'success' => $success,
            'failed' => $failed,
            'total_processed' => count($emails),
            'success_count' => count($success),
            'failed_count' => count($failed)
        ]);
    }

    private static function map(array $r): array {
        $name = '';
        if (!empty($r['first_name']) || !empty($r['last_name'])) {
            $name = trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? ''));
        } elseif (!empty($r['name'])) {
            $name = $r['name'];
        }
        
        // Parse custom fields
        $customFields = [];
        if (!empty($r['custom_fields'])) {
            $decoded = json_decode($r['custom_fields'], true);
            if (is_array($decoded)) {
                $customFields = $decoded;
            }
        }
        
        return [
            'id' => (string)$r['id'],
            'campaign_id' => isset($r['campaign_id']) ? (string)$r['campaign_id'] : null,
            'email' => $r['email'],
            'name' => $name,
            'company' => $r['company'] ?? '',
            'status' => $r['status'] ?? 'pending',
            'opens' => (int)($r['opens'] ?? 0),
            'clicks' => (int)($r['clicks'] ?? 0),
            'bounces' => (int)($r['bounces'] ?? 0),
            'sent_at' => $r['sent_at'] ?? null,
            'custom_fields' => $customFields,
            'tags' => $r['tags'] ?? [],
        ];
    }
}