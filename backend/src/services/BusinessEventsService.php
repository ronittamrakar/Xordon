<?php
/**
 * BusinessEventsService - Centralized event emission for automations
 * Emits events to business_events table for automation triggers
 */

require_once __DIR__ . '/../Database.php';

class BusinessEventsService {
    
    /**
     * Emit a business event
     */
    public static function emit(
        int $workspaceId,
        ?int $companyId,
        string $eventType,
        string $entityType,
        ?int $entityId = null,
        array $payload = [],
        string $actorType = 'system',
        ?int $actorId = null
    ): ?int {
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare("
                INSERT INTO business_events 
                (workspace_id, company_id, event_type, entity_type, entity_id, actor_type, actor_id, payload, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $eventType,
                $entityType,
                $entityId,
                $actorType,
                $actorId,
                json_encode($payload)
            ]);
            return (int)$pdo->lastInsertId();
        } catch (Exception $e) {
            error_log("BusinessEventsService::emit failed: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Emit form submission event and optionally create/update conversation
     */
    public static function onFormSubmission(
        int $workspaceId,
        ?int $companyId,
        int $formId,
        int $submissionId,
        array $submissionData,
        ?int $contactId = null
    ): void {
        // Emit form.submitted event
        self::emit(
            $workspaceId,
            $companyId,
            'form.submitted',
            'form_submission',
            $submissionId,
            [
                'form_id' => $formId,
                'contact_id' => $contactId,
                'data' => $submissionData
            ],
            'contact',
            $contactId
        );
        
        // If we have a contact, create/update conversation with form submission message
        if ($contactId) {
            self::createFormSubmissionMessage($workspaceId, $companyId, $contactId, $formId, $submissionData);
        }
    }
    
    /**
     * Create a conversation message for a form submission
     */
    private static function createFormSubmissionMessage(
        int $workspaceId,
        ?int $companyId,
        int $contactId,
        int $formId,
        array $submissionData
    ): void {
        try {
            $pdo = Database::conn();
            
            // Get or create conversation for this contact
            $sql = "SELECT id FROM conversations WHERE contact_id = ? AND workspace_id = ?";
            $params = [$contactId, $workspaceId];
            if ($companyId) {
                $sql .= ' AND company_id = ?';
                $params[] = $companyId;
            }
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $conv = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($conv) {
                $conversationId = (int)$conv['id'];
            } else {
                // Create new conversation
                $insertStmt = $pdo->prepare("
                    INSERT INTO conversations (workspace_id, company_id, contact_id, status, created_at)
                    VALUES (?, ?, ?, 'open', NOW())
                ");
                $insertStmt->execute([$workspaceId, $companyId, $contactId]);
                $conversationId = (int)$pdo->lastInsertId();
            }
            
            // Get form name
            $formName = 'Form';
            $formStmt = $pdo->prepare("SELECT name FROM webforms_forms WHERE id = ?");
            $formStmt->execute([$formId]);
            $form = $formStmt->fetch(PDO::FETCH_ASSOC);
            if ($form) {
                $formName = $form['name'];
            }
            
            // Format submission data as message body
            $bodyLines = ["Form submitted: **$formName**", ""];
            foreach ($submissionData as $key => $value) {
                if (is_array($value)) {
                    $value = implode(', ', $value);
                }
                $bodyLines[] = "**$key**: $value";
            }
            $body = implode("\n", $bodyLines);
            
            // Insert form submission message
            $msgStmt = $pdo->prepare("
                INSERT INTO conversation_messages 
                (workspace_id, company_id, conversation_id, channel, direction, sender_type, sender_id, body, metadata, status, created_at)
                VALUES (?, ?, ?, 'form', 'inbound', 'contact', ?, ?, ?, 'delivered', NOW())
            ");
            $msgStmt->execute([
                $workspaceId,
                $companyId,
                $conversationId,
                $contactId,
                $body,
                json_encode(['form_id' => $formId, 'submission_data' => $submissionData])
            ]);
            
            // Update conversation
            $pdo->prepare("
                UPDATE conversations 
                SET last_message_at = NOW(), unread_count = unread_count + 1, status = 'open' 
                WHERE id = ?
            ")->execute([$conversationId]);
            
        } catch (Exception $e) {
            error_log("BusinessEventsService::createFormSubmissionMessage failed: " . $e->getMessage());
        }
    }
    
    /**
     * Emit opportunity stage change event
     */
    public static function onOpportunityStageChange(
        int $workspaceId,
        ?int $companyId,
        int $opportunityId,
        int $oldStageId,
        int $newStageId,
        string $newStatus,
        ?int $userId = null
    ): void {
        self::emit(
            $workspaceId,
            $companyId,
            'opportunity.stage_changed',
            'opportunity',
            $opportunityId,
            [
                'old_stage_id' => $oldStageId,
                'new_stage_id' => $newStageId,
                'status' => $newStatus
            ],
            'user',
            $userId
        );
        
        // Emit specific events for won/lost
        if ($newStatus === 'won') {
            self::emit($workspaceId, $companyId, 'opportunity.won', 'opportunity', $opportunityId, [], 'user', $userId);
        } elseif ($newStatus === 'lost') {
            self::emit($workspaceId, $companyId, 'opportunity.lost', 'opportunity', $opportunityId, [], 'user', $userId);
        }
    }
    
    /**
     * Emit contact created event
     */
    public static function onContactCreated(
        int $workspaceId,
        ?int $companyId,
        int $contactId,
        array $contactData,
        ?int $userId = null,
        ?string $source = null
    ): void {
        self::emit(
            $workspaceId,
            $companyId,
            'contact.created',
            'contact',
            $contactId,
            [
                'source' => $source ?? 'manual',
                'email' => $contactData['email'] ?? null,
                'phone' => $contactData['phone'] ?? null
            ],
            $userId ? 'user' : 'system',
            $userId
        );
    }
    
    /**
     * Emit appointment booked event
     */
    public static function onAppointmentBooked(
        int $workspaceId,
        ?int $companyId,
        int $appointmentId,
        ?int $contactId,
        array $appointmentData
    ): void {
        self::emit(
            $workspaceId,
            $companyId,
            'appointment.booked',
            'appointment',
            $appointmentId,
            [
                'contact_id' => $contactId,
                'start_time' => $appointmentData['start_time'] ?? null,
                'type' => $appointmentData['type'] ?? null
            ],
            'contact',
            $contactId
        );
    }
    
    /**
     * Emit message received event (for inbound SMS/email)
     */
    public static function onMessageReceived(
        int $workspaceId,
        ?int $companyId,
        int $conversationId,
        int $messageId,
        string $channel,
        int $contactId
    ): void {
        self::emit(
            $workspaceId,
            $companyId,
            'message.received',
            'message',
            $messageId,
            [
                'conversation_id' => $conversationId,
                'channel' => $channel,
                'contact_id' => $contactId
            ],
            'contact',
            $contactId
        );
    }
    
    /**
     * Get unprocessed events for automation processing
     */
    public static function getUnprocessedEvents(int $limit = 100): array {
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare("
                SELECT * FROM business_events 
                WHERE processed = 0 
                ORDER BY created_at ASC 
                LIMIT ?
            ");
            $stmt->execute([$limit]);
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($events as &$event) {
                $event['payload'] = $event['payload'] ? json_decode($event['payload'], true) : [];
            }
            
            return $events;
        } catch (Exception $e) {
            error_log("BusinessEventsService::getUnprocessedEvents failed: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Mark events as processed
     */
    public static function markProcessed(array $eventIds): void {
        if (empty($eventIds)) return;
        
        try {
            $pdo = Database::conn();
            $placeholders = implode(',', array_fill(0, count($eventIds), '?'));
            $stmt = $pdo->prepare("UPDATE business_events SET processed = 1 WHERE id IN ($placeholders)");
            $stmt->execute($eventIds);
        } catch (Exception $e) {
            error_log("BusinessEventsService::markProcessed failed: " . $e->getMessage());
        }
    }
}
