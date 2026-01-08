<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class EmailRepliesController {
    private $db;

    public function __construct() {
        $this->db = Database::conn();
    }

    public function handleRequest($method, $path) {
        switch ($method) {
            case 'GET':
                if (preg_match('/^\/email-replies\/(\d+)$/', $path, $matches)) {
                    return $this->getEmailReply($matches[1]);
                } elseif (preg_match('/^\/email-replies\/thread\/(.+)$/', $path, $matches)) {
                    return $this->getThreadedConversation($matches[1]);
                } else {
                    return $this->getEmailReplies();
                }
            case 'POST':
                if (preg_match('/^\/email-replies\/(\d+)\/mark-read$/', $path, $matches)) {
                    return $this->markAsRead($matches[1]);
                } elseif (preg_match('/^\/email-replies\/(\d+)\/mark-unread$/', $path, $matches)) {
                    return $this->markAsUnread($matches[1]);
                } elseif (preg_match('/^\/email-replies\/(\d+)\/star$/', $path, $matches)) {
                    return $this->toggleStar($matches[1]);
                } elseif (preg_match('/^\/email-replies\/(\d+)\/archive$/', $path, $matches)) {
                    return $this->toggleArchive($matches[1]);
                } elseif ($path === '/email-replies/send') {
                    return $this->sendReply();
                } elseif ($path === '/email-replies/send-individual') {
                    return $this->sendIndividualEmail();
                } elseif ($path === '/email-replies/incoming') {
                    return $this->storeIncomingReply(json_decode(file_get_contents('php://input'), true));
                } else {
                    return $this->createEmailReply();
                }
            case 'PUT':
                if (preg_match('/^\/email-replies\/(\d+)$/', $path, $matches)) {
                    return $this->updateEmailReply($matches[1]);
                }
                break;
            case 'DELETE':
                if (preg_match('/^\/email-replies\/(\d+)$/', $path, $matches)) {
                    return $this->deleteEmailReply($matches[1]);
                }
                break;
        }
        
        return Response::error('Not found', 404);
    }

    public function getEmailReplies() {
        try {
            $userId = Auth::userIdOrFail();

            $page = $_GET['page'] ?? 1;
            $limit = $_GET['limit'] ?? 20;
            $offset = ($page - 1) * $limit;
            $filter = $_GET['filter'] ?? 'all'; // all, unread, read, starred, archived

            $whereClause = "WHERE er.user_id = ?";
            $params = [$userId];

            if ($filter === 'unread') {
                $whereClause .= " AND er.is_read = FALSE";
            } elseif ($filter === 'read') {
                $whereClause .= " AND er.is_read = TRUE";
            } elseif ($filter === 'starred') {
                $whereClause .= " AND er.is_starred = TRUE";
            } elseif ($filter === 'archived') {
                $whereClause .= " AND er.is_archived = TRUE";
            }

            // By default, exclude archived emails unless specifically requested
            if ($filter !== 'archived') {
                $whereClause .= " AND er.is_archived = FALSE";
            }

            // Get total count
            $countStmt = $this->db->prepare("SELECT COUNT(*) FROM email_replies er $whereClause");
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();

            // Get replies with pagination
            $stmt = $this->db->prepare("
                SELECT er.id, er.user_id, er.campaign_id, er.recipient_id, er.from_email, er.to_email, 
                       er.subject, er.body, er.is_read, er.is_starred, er.is_archived, er.created_at,
                       er.thread_id, er.parent_id, er.message_id,
                       c.name as campaign_name, r.email as recipient_email 
                FROM email_replies er
                LEFT JOIN campaigns c ON er.campaign_id = c.id
                LEFT JOIN recipients r ON er.recipient_id = r.id
                $whereClause
                ORDER BY er.created_at DESC
                LIMIT ? OFFSET ?
            ");
            
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $replies = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::success([
                'replies' => $replies,
                'pagination' => [
                    'page' => (int)$page,
                    'limit' => (int)$limit,
                    'total' => (int)$total,
                    'pages' => ceil($total / $limit)
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch email replies: ' . $e->getMessage());
        }
    }

    public function getEmailReply($id) {
        try {
            $userId = Auth::userIdOrFail();

            $stmt = $this->db->prepare("
                SELECT er.id, er.user_id, er.campaign_id, er.recipient_id, er.from_email, er.to_email, 
                       er.subject, er.body, er.is_read, er.is_starred, er.is_archived, er.created_at,
                       er.thread_id, er.parent_id, er.message_id,
                       c.name as campaign_name, r.email as recipient_email 
                FROM email_replies er
                LEFT JOIN campaigns c ON er.campaign_id = c.id
                LEFT JOIN recipients r ON er.recipient_id = r.id
                WHERE er.id = ? AND er.user_id = ?
            ");
            $stmt->execute([$id, $userId]);
            $reply = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$reply) {
                return Response::error('Email reply not found', 404);
            }

            return Response::success($reply);
        } catch (Exception $e) {
            return Response::error('Failed to fetch email reply: ' . $e->getMessage());
        }
    }

    public function createEmailReply() {
        try {
            $userId = Auth::userIdOrFail();

            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['from_email']) || !isset($input['to_email']) || 
                !isset($input['subject']) || !isset($input['body'])) {
                return Response::error('Missing required fields');
            }

            $stmt = $this->db->prepare("
                INSERT INTO email_replies (user_id, campaign_id, recipient_id, from_email, to_email, subject, body, is_read) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                $input['campaign_id'] ?? null,
                $input['recipient_id'] ?? null,
                $input['from_email'],
                $input['to_email'],
                $input['subject'],
                $input['body'],
                false
            ]);

            $replyId = $this->db->lastInsertId();
            return Response::success(['id' => $replyId, 'message' => 'Email reply created successfully']);
        } catch (Exception $e) {
            return Response::error('Failed to create email reply: ' . $e->getMessage());
        }
    }

    public function markAsRead($id) {
        try {
            $userId = Auth::userIdOrFail();

            $stmt = $this->db->prepare("UPDATE email_replies SET is_read = TRUE WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);

            if ($stmt->rowCount() === 0) {
                return Response::error('Email reply not found', 404);
            }

            return Response::success(['message' => 'Email reply marked as read']);
        } catch (Exception $e) {
            return Response::error('Failed to mark email reply as read: ' . $e->getMessage());
        }
    }

    public function markAsUnread($id) {
        try {
            $userId = Auth::userIdOrFail();

            $stmt = $this->db->prepare("UPDATE email_replies SET is_read = FALSE WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);

            if ($stmt->rowCount() === 0) {
                return Response::error('Email reply not found', 404);
            }

            return Response::success(['message' => 'Email reply marked as unread']);
        } catch (Exception $e) {
            return Response::error('Failed to mark email reply as unread: ' . $e->getMessage());
        }
    }

    public function sendReply() {
        try {
            $userId = Auth::userIdOrFail();

            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                return Response::error('Invalid JSON input');
            }

            // Validate required fields
            if (empty($input['to_email']) || empty($input['subject']) || empty($input['body'])) {
                return Response::error('Missing required fields: to_email, subject, body');
            }

            // Get user's sending account for reply - prioritize SMTP configured accounts
            $stmt = $this->db->prepare("
                SELECT * FROM sending_accounts 
                WHERE user_id = ? AND status = 'active' 
                ORDER BY 
                    CASE WHEN smtp_host IS NOT NULL AND smtp_password IS NOT NULL THEN 1 ELSE 2 END,
                    id ASC
                LIMIT 1
            ");
            $stmt->execute([$userId]);
            $sendingAccount = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$sendingAccount) {
                return Response::error('No active sending account found');
            }

            // Use SimpleMail service to send the email
            require_once __DIR__ . '/../services/SimpleMail.php';
            $mailService = new SimpleMail();
            
            $emailSent = $mailService->sendEmail(
                $sendingAccount,
                $input['to_email'],
                $input['subject'],
                $input['body']
            );

            if (!$emailSent) {
                return Response::error('Failed to send email');
            }
            
            // Store the reply in database
            $stmt = $this->db->prepare("
                INSERT INTO email_replies (user_id, campaign_id, recipient_id, from_email, to_email, subject, body, is_read) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                $input['campaign_id'] ?? null,
                $input['recipient_id'] ?? null,
                $sendingAccount['email'],
                $input['to_email'],
                $input['subject'],
                $input['body'],
                true // Mark as read since it's an outgoing reply
            ]);

            return Response::success(['message' => 'Reply sent successfully']);
        } catch (Exception $e) {
            return Response::error('Failed to send reply: ' . $e->getMessage());
        }
    }

    public function sendIndividualEmail() {
        try {
            $userId = Auth::userIdOrFail();

            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                return Response::error('Invalid JSON input');
            }

            // Validate required fields
            if (empty($input['to_email']) || empty($input['subject']) || empty($input['body'])) {
                return Response::error('Missing required fields: to_email, subject, body');
            }

            // Get sending account (use specified one or default to first active)
            $sendingAccountId = $input['sending_account_id'] ?? null;
            if ($sendingAccountId) {
                $stmt = $this->db->prepare("SELECT * FROM sending_accounts WHERE id = ? AND user_id = ? AND status = 'active'");
                $stmt->execute([$sendingAccountId, $userId]);
            } else {
                $stmt = $this->db->prepare("SELECT * FROM sending_accounts WHERE user_id = ? AND status = 'active' LIMIT 1");
                $stmt->execute([$userId]);
            }
            
            $sendingAccount = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$sendingAccount) {
                return Response::error('No active sending account found');
            }

            // Check daily limit
            if ($sendingAccount['sent_today'] >= $sendingAccount['daily_limit']) {
                return Response::error('Daily sending limit reached for this account');
            }

            // Use SimpleMail service to send the email
            require_once __DIR__ . '/../services/SimpleMail.php';
            $mailService = new SimpleMail();
            
            $emailSent = $mailService->sendEmail(
                $sendingAccount,
                $input['to_email'],
                $input['subject'],
                $input['body']
            );

            if (!$emailSent) {
                return Response::error('Failed to send email');
            }

            $parentId = $input['parent_id'] ?? null;
            $threadId = null;
            $campaignId = $input['campaign_id'] ?? null;
            $recipientId = $input['recipient_id'] ?? null;

            if ($parentId) {
                $stmt = $this->db->prepare("SELECT thread_id, campaign_id, recipient_id FROM email_replies WHERE id = ? AND user_id = ?");
                $stmt->execute([$parentId, $userId]);
                $parent = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($parent) {
                    $threadId = $parent['thread_id'] ?? null;
                    $campaignId = $campaignId ?? ($parent['campaign_id'] ?? null);
                    $recipientId = $recipientId ?? ($parent['recipient_id'] ?? null);
                }
            }

            if (!$threadId) {
                $normalizedSubject = preg_replace('/^(Re:|Fwd?:|RE:|FWD?:)\s*/i', '', $input['subject']);
                $threadId = md5($normalizedSubject . $sendingAccount['email'] . $input['to_email']);
            }

            $messageId = '<' . uniqid() . '@' . parse_url($_ENV['APP_URL'] ?? 'localhost', PHP_URL_HOST) . '>';

            // Log the sent email (optional - store in email_replies for tracking)
            if ($input['save_to_sent'] ?? true) {
                $stmt = $this->db->prepare("
                    INSERT INTO email_replies (
                        user_id, campaign_id, recipient_id, from_email, to_email, subject, body,
                        is_read, is_starred, is_archived, thread_id, parent_id, message_id, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $userId,
                    $campaignId,
                    $recipientId,
                    $sendingAccount['email'],
                    $input['to_email'],
                    $input['subject'],
                    $input['body'],
                    true, // Mark as read since it's an outgoing email
                    false,
                    false,
                    $threadId,
                    $parentId,
                    $messageId
                ]);
            }

            return Response::success([
                'message' => 'Email sent successfully',
                'from' => $sendingAccount['email'],
                'to' => $input['to_email'],
                'subject' => $input['subject']
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to send email: ' . $e->getMessage());
        }
    }

    public function deleteEmailReply($id) {
        try {
            $userId = Auth::userIdOrFail();

            $stmt = $this->db->prepare("DELETE FROM email_replies WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);

            if ($stmt->rowCount() === 0) {
                return Response::error('Email reply not found', 404);
            }

            return Response::success(['message' => 'Email reply deleted successfully']);
        } catch (Exception $e) {
            return Response::error('Failed to delete email reply: ' . $e->getMessage());
        }
    }

    public function updateEmailReply($id) {
        try {
            $userId = Auth::userIdOrFail();

            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                return Response::error('Invalid JSON input');
            }

            // Build update query dynamically based on provided fields
            $allowedFields = ['from_email', 'to_email', 'subject', 'body', 'is_read'];
            $updateFields = [];
            $params = [];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $input)) {
                    $updateFields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }

            if (empty($updateFields)) {
                return Response::error('No fields to update');
            }

            $params[] = $id;
            $params[] = $userId;

            $sql = "UPDATE email_replies SET " . implode(', ', $updateFields) . " WHERE id = ? AND user_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) {
                return Response::error('Email reply not found', 404);
            }

            return Response::success(['message' => 'Email reply updated successfully']);
        } catch (Exception $e) {
            return Response::error('Failed to update email reply: ' . $e->getMessage());
        }
    }

    public function getUnreadCount() {
        try {
            $userId = Auth::userIdOrFail();

            $stmt = $this->db->prepare("SELECT COUNT(*) FROM email_replies WHERE user_id = ? AND is_read = FALSE");
            $stmt->execute([$userId]);
            $count = $stmt->fetchColumn();

            return Response::success(['unread_count' => (int)$count]);
        } catch (Exception $e) {
            return Response::error('Failed to get unread count: ' . $e->getMessage());
        }
    }

    public function toggleStar($id) {
        try {
            $userId = Auth::userIdOrFail();

            // Get current star status
            $stmt = $this->db->prepare("SELECT is_starred FROM email_replies WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            $reply = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$reply) {
                return Response::error('Email reply not found', 404);
            }

            // Toggle star status
            $newStarStatus = !$reply['is_starred'];
            $stmt = $this->db->prepare("UPDATE email_replies SET is_starred = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$newStarStatus, $id, $userId]);

            return Response::success([
                'message' => $newStarStatus ? 'Email starred' : 'Email unstarred',
                'is_starred' => $newStarStatus
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to toggle star: ' . $e->getMessage());
        }
    }

    public function toggleArchive($id) {
        try {
            $userId = Auth::userIdOrFail();

            // Get current archive status
            $stmt = $this->db->prepare("SELECT is_archived FROM email_replies WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            $reply = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$reply) {
                return Response::error('Email reply not found', 404);
            }

            // Toggle archive status
            $newArchiveStatus = !$reply['is_archived'];
            $stmt = $this->db->prepare("UPDATE email_replies SET is_archived = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$newArchiveStatus, $id, $userId]);

            return Response::success([
                'message' => $newArchiveStatus ? 'Email archived' : 'Email unarchived',
                'is_archived' => $newArchiveStatus
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to toggle archive: ' . $e->getMessage());
        }
    }

    /**
     * Get threaded conversation for a specific thread ID
     */
    public function getThreadedConversation($threadId) {
        try {
            $userId = Auth::userIdOrFail();

            $stmt = $this->db->prepare("
                SELECT er.id, er.user_id, er.campaign_id, er.recipient_id, er.from_email, er.to_email, 
                       er.subject, er.body, er.is_read, er.is_starred, er.is_archived, er.created_at,
                       er.thread_id, er.parent_id, er.message_id,
                       c.name as campaign_name, r.email as recipient_email 
                FROM email_replies er
                LEFT JOIN campaigns c ON er.campaign_id = c.id
                LEFT JOIN recipients r ON er.recipient_id = r.id
                WHERE er.thread_id = ? AND er.user_id = ?
                ORDER BY er.created_at ASC
            ");
            $stmt->execute([$threadId, $userId]);
            $replies = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::success(['replies' => $replies]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch threaded conversation: ' . $e->getMessage());
        }
    }

    /**
     * Store incoming email reply and link it to the original thread
     */
    public function storeIncomingReply($data) {
        try {
            $userId = Auth::userIdOrFail();

            // Extract reply information
            $fromEmail = $data['from_email'];
            $toEmail = $data['to_email'];
            $subject = $data['subject'];
            $body = $data['body'];
            $inReplyTo = $data['in_reply_to'] ?? null; // Message ID of the original email

            // Find the original email by message ID if provided
            $parentId = null;
            $threadId = null;
            $campaignId = null;
            $recipientId = null;

            if ($inReplyTo) {
                $stmt = $this->db->prepare("
                    SELECT id, thread_id, campaign_id, recipient_id 
                    FROM email_replies 
                    WHERE message_id = ? AND user_id = ?
                ");
                $stmt->execute([$inReplyTo, $userId]);
                $originalEmail = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($originalEmail) {
                    $parentId = $originalEmail['id'];
                    $threadId = $originalEmail['thread_id'];
                    $campaignId = $originalEmail['campaign_id'];
                    $recipientId = $originalEmail['recipient_id'];
                }
            }

            // If no thread found, create a new thread ID
            if (!$threadId) {
                $normalizedSubject = preg_replace('/^(Re:|Fwd?:|RE:|FWD?:)\s*/i', '', $subject);
                $threadId = md5($normalizedSubject . $fromEmail . $toEmail);
            }

            // Generate message ID for this reply
            $messageId = '<' . uniqid() . '@' . parse_url($_ENV['APP_URL'] ?? 'localhost', PHP_URL_HOST) . '>';

            // Store the incoming reply
            $stmt = $this->db->prepare("
                INSERT INTO email_replies (user_id, campaign_id, recipient_id, from_email, to_email, subject, body, 
                                         is_read, is_starred, is_archived, thread_id, parent_id, message_id, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([
                $userId,
                $campaignId,
                $recipientId,
                $fromEmail,
                $toEmail,
                $subject,
                $body,
                false, // Mark as unread since it's an incoming reply
                false, // is_starred
                false, // is_archived
                $threadId,
                $parentId,
                $messageId
            ]);

            $replyId = $this->db->lastInsertId();

            return Response::success([
                'message' => 'Incoming reply stored successfully',
                'reply_id' => $replyId,
                'thread_id' => $threadId
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to store incoming reply: ' . $e->getMessage());
        }
    }
}