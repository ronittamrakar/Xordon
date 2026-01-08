<?php

require_once __DIR__ . '/../Response.php';
 require_once __DIR__ . '/../traits/WorkspaceScoped.php';

class SMSRepliesController {
     use WorkspaceScoped;
    
    public function getReplies() {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            
            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 50);
            $search = $_GET['search'] ?? '';
            $campaignId = $_GET['campaign_id'] ?? '';
            $status = $_GET['status'] ?? 'all'; // all, unread, starred, archived
            $offset = ($page - 1) * $limit;
            
            $scope = self::workspaceWhere('sr');
            $wsSql = str_replace('?', ':ws_id', $scope['sql']);
            $workspaceId = $scope['params'][0];
            
            $whereConditions = [$wsSql];
            $params = ['ws_id' => $workspaceId];
            
            if (!empty($search)) {
                $whereConditions[] = '(sr.from_phone LIKE :search OR sr.message LIKE :search OR c.name LIKE :search)';
                $params['search'] = '%' . $search . '%';
            }
            
            if (!empty($campaignId)) {
                $whereConditions[] = 'sr.campaign_id = :campaign_id';
                $params['campaign_id'] = $campaignId;
            }
            
            if ($status === 'unread') {
                $whereConditions[] = 'sr.is_read = 0';
            } elseif ($status === 'starred') {
                $whereConditions[] = 'sr.is_starred = 1';
            } elseif ($status === 'archived') {
                $whereConditions[] = 'sr.is_archived = 1';
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            // Get total count
            $countStmt = $db->prepare("
                SELECT COUNT(*) as total 
                FROM sms_replies sr
                LEFT JOIN sms_campaigns c ON sr.campaign_id = c.id
                WHERE $whereClause
            ");
            $countStmt->execute($params);
            $totalCount = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get replies
            $stmt = $db->prepare("
                SELECT 
                    sr.id,
                    sr.campaign_id,
                    c.name as campaign_name,
                    sr.phone_number,
                    sr.message,
                    sr.sender_id,
                    sr.external_id,
                    sr.is_read,
                    sr.is_starred,
                    sr.is_archived,
                    sr.created_at
                FROM sms_replies sr
                LEFT JOIN sms_campaigns c ON sr.campaign_id = c.id
                WHERE $whereClause
                ORDER BY sr.created_at DESC
                LIMIT :limit OFFSET :offset
            ");
            
            $params['limit'] = $limit;
            $params['offset'] = $offset;
            $stmt->execute($params);
            
            $replies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json([
                'replies' => array_map(function($reply) {
                    return [
                        'id' => (string)$reply['id'],
                        'campaign_id' => $reply['campaign_id'] ?? '',
                        'campaign_name' => $reply['campaign_name'] ?? 'Direct',
                        'phone_number' => $reply['phone_number'],
                        'message' => $reply['message'],
                        'sender_id' => $reply['sender_id'],
                        'external_id' => $reply['external_id'],
                        'is_read' => (bool)$reply['is_read'],
                        'is_starred' => (bool)$reply['is_starred'],
                        'is_archived' => (bool)$reply['is_archived'],
                        'created_at' => $reply['created_at'],
                        'user_id' => $userId,
                        'recipient_id' => null // Will be null for now, can be enhanced later
                    ];
                }, $replies),
                'pagination' => [
                    'total' => $totalCount,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($totalCount / $limit)
                ]
            ]);
            
        } catch (Exception $e) {
            error_log('Get SMS replies error: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to fetch SMS replies: ' . $e->getMessage()]);
        }
    }
    
    public function getCampaignReplies($campaignId) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            // Verify campaign ownership
            $campaignStmt = $db->prepare('SELECT id FROM sms_campaigns WHERE id = :id AND ' . str_replace('?', ':ws_id', $scope['sql']));
            $campaignStmt->execute(['id' => $campaignId, 'ws_id' => $workspaceId]);
            if (!$campaignStmt->fetch()) {
                http_response_code(404);
                return Response::json(['error' => 'Campaign not found']);
            }
            
            $stmt = $db->prepare("
                SELECT 
                    sr.id,
                    sr.campaign_id,
                    c.name as campaign_name,
                    sr.phone_number,
                    sr.message,
                    sr.sender_id,
                    sr.external_id,
                    sr.is_read,
                    sr.is_starred,
                    sr.is_archived,
                    sr.created_at
                FROM sms_replies sr
                LEFT JOIN sms_campaigns c ON sr.campaign_id = c.id
                WHERE sr.campaign_id = :campaign_id AND sr.workspace_id = :ws_id
                ORDER BY sr.created_at DESC
            ");
            
            $stmt->execute([
                'campaign_id' => $campaignId,
                'ws_id' => $workspaceId
            ]);
            
            $replies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json([
                'replies' => array_map(function($reply) use ($userId) {
                    return [
                        'id' => (string)$reply['id'],
                        'campaign_id' => $reply['campaign_id'] ?? '',
                        'campaign_name' => $reply['campaign_name'] ?? 'Direct',
                        'phone_number' => $reply['phone_number'],
                        'message' => $reply['message'],
                        'sender_id' => $reply['sender_id'],
                        'external_id' => $reply['external_id'],
                        'is_read' => (bool)$reply['is_read'],
                        'is_starred' => (bool)$reply['is_starred'],
                        'is_archived' => (bool)$reply['is_archived'],
                        'created_at' => $reply['created_at'],
                        'user_id' => $userId,
                        'recipient_id' => null // Will be null for now, can be enhanced later
                    ];
                }, $replies)
            ]);
            
        } catch (Exception $e) {
            error_log('Get campaign SMS replies error: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to fetch campaign SMS replies: ' . $e->getMessage()]);
        }
    }
    
    public function markAsRead($replyId) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            $stmt = $db->prepare("
                UPDATE sms_replies 
                SET is_read = 1 
                WHERE id = :id AND workspace_id = :ws_id
            ");
            
            $stmt->execute([
                'id' => $replyId,
                'ws_id' => $workspaceId
            ]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                return Response::json(['error' => 'SMS reply not found']);
            }
            
            return Response::json(['message' => 'SMS reply marked as read']);
            
        } catch (Exception $e) {
            error_log('Mark SMS reply as read error: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to mark SMS reply as read: ' . $e->getMessage()]);
        }
    }
    
    public function markAsUnread($replyId) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            $stmt = $db->prepare("
                UPDATE sms_replies 
                SET is_read = 0 
                WHERE id = :id AND workspace_id = :ws_id
            ");
            
            $stmt->execute([
                'id' => $replyId,
                'ws_id' => $workspaceId
            ]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                return Response::json(['error' => 'SMS reply not found']);
            }
            
            return Response::json(['message' => 'SMS reply marked as unread']);
            
        } catch (Exception $e) {
            error_log('Mark SMS reply as unread error: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to mark SMS reply as unread: ' . $e->getMessage()]);
        }
    }
    
    public function toggleStar($replyId) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            $stmt = $db->prepare("
                UPDATE sms_replies 
                SET is_starred = NOT is_starred 
                WHERE id = :id AND workspace_id = :ws_id
            ");
            
            $stmt->execute([
                'id' => $replyId,
                'ws_id' => $workspaceId
            ]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                return Response::json(['error' => 'SMS reply not found']);
            }
            
            return Response::json(['message' => 'SMS reply star status toggled']);
            
        } catch (Exception $e) {
            error_log('Toggle SMS reply star error: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to toggle SMS reply star: ' . $e->getMessage()]);
        }
    }
    
    public function toggleArchive($replyId) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            $stmt = $db->prepare("
                UPDATE sms_replies 
                SET is_archived = NOT is_archived 
                WHERE id = :id AND workspace_id = :ws_id
            ");
            
            $stmt->execute([
                'id' => $replyId,
                'ws_id' => $workspaceId
            ]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                return Response::json(['error' => 'SMS reply not found']);
            }
            
            return Response::json(['message' => 'SMS reply archive status toggled']);
            
        } catch (Exception $e) {
            error_log('Toggle SMS reply archive error: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to toggle SMS reply archive: ' . $e->getMessage()]);
        }
    }
    
    public function deleteReply($replyId) {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            $stmt = $db->prepare("
                DELETE FROM sms_replies 
                WHERE id = :id AND workspace_id = :ws_id
            ");
            
            $stmt->execute([
                'id' => $replyId,
                'ws_id' => $workspaceId
            ]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                return Response::json(['error' => 'SMS reply not found']);
            }
            
            return Response::json(['message' => 'SMS reply deleted successfully']);
            
        } catch (Exception $e) {
            error_log('Delete SMS reply error: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to delete SMS reply: ' . $e->getMessage()]);
        }
    }
    
    public function bulkAction() {
        try {
            $userId = Auth::userIdOrFail();
            $db = Database::conn();
            $scope = self::workspaceWhere();
            $workspaceId = $scope['params'][0];
            
            $data = json_decode(file_get_contents('php://input'), true);
            $action = $data['action'] ?? '';
            $replyIds = $data['reply_ids'] ?? [];
            
            if (empty($action) || empty($replyIds) || !is_array($replyIds)) {
                http_response_code(400);
                return Response::json(['error' => 'Invalid request data']);
            }
            
            // Verify all replies belong to user
            $placeholders = str_repeat('?,', count($replyIds) - 1) . '?';
            $verifyStmt = $db->prepare("
                SELECT id FROM sms_replies 
                WHERE id IN ($placeholders) AND workspace_id = ?
            ");
            $verifyStmt->execute(array_merge($replyIds, [$workspaceId]));
            $validIds = array_column($verifyStmt->fetchAll(PDO::FETCH_ASSOC), 'id');
            
            if (count($validIds) !== count($replyIds)) {
                http_response_code(403);
                return Response::json(['error' => 'Some SMS replies not found or unauthorized']);
            }
            
            switch ($action) {
                case 'mark_read':
                    $stmt = $db->prepare("
                        UPDATE sms_replies 
                        SET is_read = 1 
                        WHERE id IN ($placeholders)
                    ");
                    break;
                    
                case 'mark_unread':
                    $stmt = $db->prepare("
                        UPDATE sms_replies 
                        SET is_read = 0 
                        WHERE id IN ($placeholders)
                    ");
                    break;
                    
                case 'star':
                    $stmt = $db->prepare("
                        UPDATE sms_replies 
                        SET is_starred = 1 
                        WHERE id IN ($placeholders)
                    ");
                    break;
                    
                case 'unstar':
                    $stmt = $db->prepare("
                        UPDATE sms_replies 
                        SET is_starred = 0 
                        WHERE id IN ($placeholders)
                    ");
                    break;
                    
                case 'archive':
                    $stmt = $db->prepare("
                        UPDATE sms_replies 
                        SET is_archived = 1 
                        WHERE id IN ($placeholders)
                    ");
                    break;
                    
                case 'unarchive':
                    $stmt = $db->prepare("
                        UPDATE sms_replies 
                        SET is_archived = 0 
                        WHERE id IN ($placeholders)
                    ");
                    break;
                    
                case 'delete':
                    $stmt = $db->prepare("
                        DELETE FROM sms_replies 
                        WHERE id IN ($placeholders)
                    ");
                    break;
                    
                default:
                    http_response_code(400);
                    return Response::json(['error' => 'Invalid action']);
            }
            
            $stmt->execute($validIds);
            
            return Response::json(['message' => 'Bulk action completed successfully']);
            
        } catch (Exception $e) {
            error_log('SMS replies bulk action error: ' . $e->getMessage());
            http_response_code(500);
            return Response::json(['error' => 'Failed to perform bulk action: ' . $e->getMessage()]);
        }
    }
}