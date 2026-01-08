<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../services/JobQueueService.php';

class WebinarController {
    private static function getWorkspaceScope(): array {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return ['col' => 'workspace_id', 'val' => (int)$ctx->workspaceId];
        }
        return ['col' => 'user_id', 'val' => Auth::userIdOrFail()];
    }

    public static function list(): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT * FROM webinars WHERE {$scope['col']} = ? ORDER BY created_at DESC");
            $stmt->execute([$scope['val']]);
            Response::json($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function get(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT * FROM webinars WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            $webinar = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$webinar) throw new Exception("Webinar not found");
            Response::json($webinar);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function create(): void {
        Auth::userIdOrFail();
        try {
            $b = get_json_body();
            $pdo = Database::conn();
            $userId = Auth::userId();
            $workspaceId = ($GLOBALS['tenantContext'] ?? null)?->workspaceId ?? null;
            
            $stmt = $pdo->prepare("INSERT INTO webinars (user_id, workspace_id, title, description, thumbnail, scheduled_at, duration_minutes, is_evergreen, max_registrants) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $userId,
                $workspaceId,
                $b['title'],
                $b['description'] ?? null,
                $b['thumbnail'] ?? null,
                $b['scheduled_at'] ?? null,
                $b['duration_minutes'] ?? 60,
                $b['is_evergreen'] ?? false,
                $b['max_registrants'] ?? null
            ]);
            
            Response::json(['id' => $pdo->lastInsertId()]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function update(string $id): void {
        Auth::userIdOrFail();
        try {
            $b = get_json_body();
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            $allowedFields = ['title', 'description', 'thumbnail', 'scheduled_at', 'duration_minutes', 'status', 'is_evergreen', 'max_registrants'];
            $updates = [];
            $params = [];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $b)) {
                    $updates[] = "$field = ?";
                    $params[] = $b[$field];
                }
            }
            
            if (empty($updates)) {
                Response::json(['success' => true]);
                return;
            }
            
            $sql = "UPDATE webinars SET " . implode(', ', $updates) . " WHERE id = ? AND {$scope['col']} = ?";
            $params[] = $id;
            $params[] = $scope['val'];
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function delete(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("DELETE FROM webinars WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function getRegistrants(string $id): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("SELECT wr.*, r.first_name, r.last_name, r.email FROM webinar_registrants wr JOIN recipients r ON wr.contact_id = r.id WHERE wr.webinar_id = ? AND wr.{$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            Response::json($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function removeRegistrant(string $webinarId, string $registrantId): void {
        Auth::userIdOrFail();
        try {
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            $stmt = $pdo->prepare("DELETE FROM webinar_registrants WHERE id = ? AND webinar_id = ? AND {$scope['col']} = ?");
            $stmt->execute([$registrantId, $webinarId, $scope['val']]);
            Response::json(['success' => true]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    public static function invite(string $id): void {
        Auth::userIdOrFail();
        try {
            $b = get_json_body();
            $pdo = Database::conn();
            $scope = self::getWorkspaceScope();
            
            // Verify webinar exists
            $stmt = $pdo->prepare("SELECT * FROM webinars WHERE id = ? AND {$scope['col']} = ?");
            $stmt->execute([$id, $scope['val']]);
            $webinar = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$webinar) throw new Exception("Webinar not found");
            
            $contactIds = $b['contact_ids'] ?? [];
            $channels = $b['channels'] ?? ['email'];
            
            if (empty($contactIds)) {
                Response::json(['success' => true, 'sent_count' => 0]);
                return;
            }
            
            $sentCount = 0;
            $appUrl = getenv('APP_URL') ?: 'http://localhost:5173';
            $link = $appUrl . "/marketing/webinars/join/" . $id;
            
            foreach ($contactIds as $contactId) {
                // Fetch contact
                $stmt = $pdo->prepare("SELECT email, phone, first_name, last_name FROM contacts WHERE id = ?");
                $stmt->execute([$contactId]);
                $contact = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$contact) continue;
                
                $contactName = ($contact['first_name'] ?? '') . ' ' . ($contact['last_name'] ?? '');
                $contactName = trim($contactName) ?: 'Friend';
                
                // For each channel
                foreach ($channels as $channel) {
                    if ($channel === 'email' && !empty($contact['email'])) {
                        $subject = "Invitation: " . $webinar['title'];
                        $htmlBody = "
                            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto;'>
                                <h2>Hi {$contact['first_name']},</h2>
                                <p>You are invited to join our webinar: <strong>{$webinar['title']}</strong></p>
                                <p>{$webinar['description']}</p>
                                <div style='margin: 24px 0;'>
                                    <a href='{$link}' style='display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;'>Join Webinar</a>
                                </div>
                                <p style='color: #666; font-size: 14px;'>Or copy this link: <a href='{$link}'>{$link}</a></p>
                            </div>
                        ";
                        
                        JobQueueService::schedule('notification.email', [
                            'workspace_id' => (int)$scope['val'],
                            'to' => $contact['email'],
                            'subject' => $subject,
                            'html_body' => $htmlBody,
                            'text_body' => "You are invited to join {$webinar['title']}. Link: {$link}"
                        ], null, (int)$scope['val']);
                    }
                    
                    if ($channel === 'sms' && !empty($contact['phone'])) {
                        $message = "Hi {$contact['first_name']}, you're invited to webinar: {$webinar['title']}. Join here: {$link}";
                        
                        JobQueueService::schedule('notification.sms', [
                            'workspace_id' => (int)$scope['val'],
                            'to' => $contact['phone'],
                            'message' => $message
                        ], null, (int)$scope['val']);
                    }
                }
                $sentCount++;
            }
            
            Response::json(['success' => true, 'sent_count' => $sentCount]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
