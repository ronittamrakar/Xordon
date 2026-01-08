<?php

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';

class FollowUpEmailsController {
    
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $campaignId = $_GET['campaign_id'] ?? null;
        
        if (!$campaignId) {
            Response::error('Campaign ID is required', 422);
        }
        
        $pdo = Database::conn();
        
        // Verify campaign ownership
        $stmt = $pdo->prepare('SELECT 1 FROM campaigns WHERE id = ? AND user_id = ?');
        $stmt->execute([$campaignId, $userId]);
        if (!$stmt->fetch()) {
            Response::error('Campaign not found', 404);
        }
        
        // Get follow-up emails for the campaign
        $stmt = $pdo->prepare('
            SELECT * FROM follow_up_emails 
            WHERE campaign_id = ? AND user_id = ? 
            ORDER BY email_order ASC
        ');
        $stmt->execute([$campaignId, $userId]);
        $followUps = $stmt->fetchAll();
        
        $result = array_map([self::class, 'map'], $followUps);
        Response::json($result);
    }
    
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $b = get_json_body();
        
        $campaignId = $b['campaign_id'] ?? null;
        $subject = trim($b['subject'] ?? '');
        $content = trim($b['content'] ?? '');
        $delayDays = (int)($b['delay_days'] ?? 1);
        $emailOrder = (int)($b['email_order'] ?? 1);
        
        if (!$campaignId) Response::error('Campaign ID is required', 422);
        if (!$subject) Response::error('Subject is required', 422);
        if (!$content) Response::error('Content is required', 422);
        if ($delayDays < 1 || $delayDays > 30) Response::error('Delay days must be between 1 and 30', 422);
        if ($emailOrder < 1 || $emailOrder > 5) Response::error('Email order must be between 1 and 5', 422);
        
        $pdo = Database::conn();
        
        // Verify campaign ownership
        $stmt = $pdo->prepare('SELECT 1 FROM campaigns WHERE id = ? AND user_id = ?');
        $stmt->execute([$campaignId, $userId]);
        if (!$stmt->fetch()) {
            Response::error('Campaign not found', 404);
        }
        
        // Check if we already have 5 follow-ups for this campaign
        $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM follow_up_emails WHERE campaign_id = ? AND user_id = ?');
        $stmt->execute([$campaignId, $userId]);
        $count = (int)$stmt->fetch()['count'];
        if ($count >= 5) {
            Response::error('Maximum 5 follow-up emails allowed per campaign', 422);
        }
        
        // Check if email_order is already taken
        $stmt = $pdo->prepare('SELECT 1 FROM follow_up_emails WHERE campaign_id = ? AND user_id = ? AND email_order = ?');
        $stmt->execute([$campaignId, $userId, $emailOrder]);
        if ($stmt->fetch()) {
            Response::error('Email order already exists for this campaign', 422);
        }
        
        // Create follow-up email
        $stmt = $pdo->prepare('
            INSERT INTO follow_up_emails (campaign_id, user_id, subject, content, delay_days, email_order, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ');
        $stmt->execute([$campaignId, $userId, $subject, $content, $delayDays, $emailOrder]);
        $id = (int)$pdo->lastInsertId();
        
        // Return the created follow-up email
        $stmt = $pdo->prepare('SELECT * FROM follow_up_emails WHERE id = ?');
        $stmt->execute([$id]);
        $followUp = $stmt->fetch();
        
        Response::json(self::map($followUp));
    }
    
    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        $b = get_json_body();
        
        $pdo = Database::conn();
        
        // Check if follow-up email exists and belongs to user
        $stmt = $pdo->prepare('
            SELECT fue.*, c.user_id as campaign_user_id 
            FROM follow_up_emails fue 
            JOIN campaigns c ON fue.campaign_id = c.id 
            WHERE fue.id = ? AND fue.user_id = ? AND c.user_id = ?
        ');
        $stmt->execute([$id, $userId, $userId]);
        $followUp = $stmt->fetch();
        if (!$followUp) {
            Response::error('Follow-up email not found', 404);
        }
        
        // Update fields
        $updates = [];
        $params = [];
        
        if (isset($b['subject'])) {
            $subject = trim($b['subject']);
            if (!$subject) Response::error('Subject cannot be empty', 422);
            $updates[] = 'subject = ?';
            $params[] = $subject;
        }
        
        if (isset($b['content'])) {
            $content = trim($b['content']);
            if (!$content) Response::error('Content cannot be empty', 422);
            $updates[] = 'content = ?';
            $params[] = $content;
        }
        
        if (isset($b['delay_days'])) {
            $delayDays = (int)$b['delay_days'];
            if ($delayDays < 1 || $delayDays > 30) Response::error('Delay days must be between 1 and 30', 422);
            $updates[] = 'delay_days = ?';
            $params[] = $delayDays;
        }
        
        if (isset($b['email_order'])) {
            $emailOrder = (int)$b['email_order'];
            if ($emailOrder < 1 || $emailOrder > 5) Response::error('Email order must be between 1 and 5', 422);
            
            // Check if new email_order conflicts with existing ones (excluding current)
            $stmt = $pdo->prepare('SELECT 1 FROM follow_up_emails WHERE campaign_id = ? AND user_id = ? AND email_order = ? AND id != ?');
            $stmt->execute([$followUp['campaign_id'], $userId, $emailOrder, $id]);
            if ($stmt->fetch()) {
                Response::error('Email order already exists for this campaign', 422);
            }
            
            $updates[] = 'email_order = ?';
            $params[] = $emailOrder;
        }
        
        if (isset($b['is_active'])) {
            $updates[] = 'is_active = ?';
            $params[] = $b['is_active'] ? 1 : 0;
        }
        
        if (empty($updates)) {
            Response::error('No fields to update', 422);
        }
        
        $updates[] = 'updated_at = CURRENT_TIMESTAMP';
        $params[] = $id;
        
        $sql = 'UPDATE follow_up_emails SET ' . implode(', ', $updates) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Return updated follow-up email
        $stmt = $pdo->prepare('SELECT * FROM follow_up_emails WHERE id = ?');
        $stmt->execute([$id]);
        $updated = $stmt->fetch();
        
        Response::json(self::map($updated));
    }
    
    public static function delete(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Check if follow-up email exists and belongs to user
        $stmt = $pdo->prepare('
            SELECT fue.* 
            FROM follow_up_emails fue 
            JOIN campaigns c ON fue.campaign_id = c.id 
            WHERE fue.id = ? AND fue.user_id = ? AND c.user_id = ?
        ');
        $stmt->execute([$id, $userId, $userId]);
        $followUp = $stmt->fetch();
        if (!$followUp) {
            Response::error('Follow-up email not found', 404);
        }
        
        // Delete follow-up email
        $stmt = $pdo->prepare('DELETE FROM follow_up_emails WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json(['success' => true]);
    }
    
    private static function map(array $f): array {
        return [
            'id' => (string)$f['id'],
            'campaign_id' => (string)$f['campaign_id'],
            'subject' => $f['subject'],
            'content' => $f['content'],
            'delay_days' => (int)$f['delay_days'],
            'email_order' => (int)$f['email_order'],
            'is_active' => (bool)$f['is_active'],
            'created_at' => $f['created_at'],
            'updated_at' => $f['updated_at'],
        ];
    }
}