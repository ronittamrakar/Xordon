<?php
/**
 * Contact Outcomes Controller
 * Tracks and manages contact interaction outcomes across channels
 */

require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/FollowUpAutomationsController.php';
require_once __DIR__ . '/../services/SentimentAnalyzer.php';
require_once __DIR__ . '/../services/IntentDetector.php';
require_once __DIR__ . '/../services/AnalysisStorageService.php';
require_once __DIR__ . '/../services/ContactSentimentService.php';
require_once __DIR__ . '/../services/LeadOutcomeService.php';

class ContactOutcomesController {
    
    /**
     * Get outcomes for a contact
     */
    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $contactId = $_GET['contact_id'] ?? null;
        $channel = $_GET['channel'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 100);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $pdo = Database::conn();
        
        $sql = 'SELECT co.*, c.email, c.first_name, c.last_name, cam.name as campaign_name
                FROM contact_outcomes co
                LEFT JOIN contacts c ON co.contact_id = c.id
                LEFT JOIN campaigns cam ON co.campaign_id = cam.id
                WHERE co.user_id = ?';
        $params = [$userId];
        
        if ($contactId) {
            $sql .= ' AND co.contact_id = ?';
            $params[] = $contactId;
        }
        
        if ($channel) {
            $sql .= ' AND co.channel = ?';
            $params[] = $channel;
        }
        
        $sql .= ' ORDER BY co.created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $outcomes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'outcomes' => array_map([self::class, 'mapOutcome'], $outcomes),
        ]);
    }
    
    /**
     * Record a new outcome
     */
    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        $contactId = $body['contact_id'] ?? null;
        $channel = $body['channel'] ?? '';
        $outcomeType = $body['outcome_type'] ?? '';
        
        if (!$contactId) Response::error('Contact ID is required', 422);
        if (!$channel) Response::error('Channel is required', 422);
        if (!$outcomeType) Response::error('Outcome type is required', 422);
        
        $pdo = Database::conn();
        
        // Verify contact ownership
        $stmt = $pdo->prepare('SELECT * FROM contacts WHERE id = ? AND user_id = ?');
        $stmt->execute([$contactId, $userId]);
        if (!$stmt->fetch()) {
            Response::error('Contact not found', 404);
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO contact_outcomes 
            (contact_id, user_id, channel, campaign_id, outcome_type, outcome_data, sentiment, notes, recorded_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ');
        
        // Analyze notes for sentiment and intent if provided
        $notes = $body['notes'] ?? '';
        $sentimentResult = null;
        $intentResult = null;
        $analyzedSentiment = $body['sentiment'] ?? null;
        
        if (!empty($notes)) {
            try {
                $sentimentAnalyzer = new SentimentAnalyzer($userId);
                $intentDetector = new IntentDetector($userId);
                
                $sentimentResult = $sentimentAnalyzer->analyze($notes);
                $intentResult = $intentDetector->detectIntent($notes);
                
                // Use analyzed sentiment if not manually provided
                if (!$analyzedSentiment) {
                    $analyzedSentiment = $sentimentResult->sentiment;
                }
            } catch (Exception $e) {
                // Continue without analysis if it fails
                error_log("Sentiment analysis failed: " . $e->getMessage());
            }
        }
        
        $stmt->execute([
            $contactId,
            $userId,
            $channel,
            $body['campaign_id'] ?? null,
            $outcomeType,
            json_encode($body['outcome_data'] ?? []),
            $analyzedSentiment,
            $notes,
            $body['recorded_by'] ?? 'manual',
        ]);
        
        $id = $pdo->lastInsertId();
        
        // Store analysis results and update outcome with analysis data
        if ($sentimentResult || $intentResult) {
            try {
                $storageService = new AnalysisStorageService();
                $storageService->updateContactOutcomeAnalysis($id, $sentimentResult, $intentResult);
                
                // Store detailed analysis records
                if ($sentimentResult) {
                    $storageService->storeSentimentAnalysis($contactId, $channel, $id, $sentimentResult, $notes);
                }
                if ($intentResult) {
                    $storageService->storeIntentAnalysis($contactId, $channel, $id, $intentResult, $notes);
                }
                
                // Update contact sentiment tracking
                $contactSentimentService = new ContactSentimentService();
                $contactSentimentService->updateContactSentimentTracking($contactId);
                
                // Check for significant sentiment change
                if ($sentimentResult) {
                    $changeInfo = $contactSentimentService->checkSentimentChange($contactId, $sentimentResult);
                    if ($changeInfo['has_change']) {
                        $contactSentimentService->flagSentimentChange($contactId, $changeInfo);
                    }
                }
            } catch (Exception $e) {
                error_log("Failed to store analysis: " . $e->getMessage());
            }
        }
        
        // Trigger automations using intelligent processing
        $triggerData = array_merge(
            $body['outcome_data'] ?? [],
            [
                'outcome_type' => $outcomeType,
                'sentiment' => $analyzedSentiment,
                'campaign_id' => $body['campaign_id'] ?? null,
                'notes' => $notes,
            ]
        );
        
        // Add analysis results to trigger data
        if ($sentimentResult) {
            $triggerData['sentiment_confidence'] = $sentimentResult->confidenceScore;
            $triggerData['is_mixed_sentiment'] = $sentimentResult->isMixedSentiment;
        }
        if ($intentResult) {
            $triggerData['detected_intent'] = $intentResult->primaryIntent;
            $triggerData['intent_confidence'] = $intentResult->confidenceScore;
            $triggerData['has_conflict'] = $intentResult->hasConflict;
        }
        
        // Use intelligent trigger processing
        FollowUpAutomationsController::processIntelligentTrigger($userId, $channel, $contactId, $triggerData);
        
        $stmt = $pdo->prepare('SELECT * FROM contact_outcomes WHERE id = ?');
        $stmt->execute([$id]);
        $outcome = $stmt->fetch(PDO::FETCH_ASSOC);
        
        Response::json(['outcome' => self::mapOutcome($outcome)], 201);
    }
    
    /**
     * Get outcome statistics for a contact
     */
    public static function stats(): void {
        $userId = Auth::userIdOrFail();
        $contactId = $_GET['contact_id'] ?? null;
        
        if (!$contactId) {
            Response::error('Contact ID is required', 422);
        }
        
        $pdo = Database::conn();
        
        // Get outcome counts by channel and type
        $stmt = $pdo->prepare('
            SELECT channel, outcome_type, COUNT(*) as count
            FROM contact_outcomes
            WHERE user_id = ? AND contact_id = ?
            GROUP BY channel, outcome_type
        ');
        $stmt->execute([$userId, $contactId]);
        $counts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get sentiment distribution
        $stmt = $pdo->prepare('
            SELECT sentiment, COUNT(*) as count
            FROM contact_outcomes
            WHERE user_id = ? AND contact_id = ? AND sentiment IS NOT NULL
            GROUP BY sentiment
        ');
        $stmt->execute([$userId, $contactId]);
        $sentiments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get recent activity
        $stmt = $pdo->prepare('
            SELECT channel, outcome_type, created_at
            FROM contact_outcomes
            WHERE user_id = ? AND contact_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        ');
        $stmt->execute([$userId, $contactId]);
        $recent = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'counts' => $counts,
            'sentiments' => $sentiments,
            'recent_activity' => $recent,
        ]);
    }
    
    /**
     * Record a call disposition (convenience method)
     */
    public static function recordCallDisposition(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        $contactId = $body['contact_id'] ?? null;
        $dispositionId = $body['disposition_id'] ?? null;
        $callId = $body['call_id'] ?? null;
        
        if (!$contactId) Response::error('Contact ID is required', 422);
        if (!$dispositionId) Response::error('Disposition ID is required', 422);
        
        $pdo = Database::conn();
        
        // Get disposition details
        $stmt = $pdo->prepare('SELECT * FROM call_dispositions_types WHERE id = ? AND (user_id = ? OR user_id = 0)');
        $stmt->execute([$dispositionId, $userId]);
        $disposition = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$disposition) {
            Response::error('Disposition not found', 404);
        }
        
        // Map disposition category to sentiment
        $sentimentMap = [
            'positive' => 'positive',
            'negative' => 'negative',
            'neutral' => 'neutral',
            'callback' => 'neutral',
        ];
        
        // Create outcome record
        $stmt = $pdo->prepare('
            INSERT INTO contact_outcomes 
            (contact_id, user_id, channel, campaign_id, outcome_type, outcome_data, sentiment, notes, recorded_by, created_at)
            VALUES (?, ?, "call", ?, ?, ?, ?, ?, "agent", CURRENT_TIMESTAMP)
        ');
        
        $outcomeData = [
            'disposition_id' => $dispositionId,
            'disposition_name' => $disposition['name'],
            'call_id' => $callId,
            'call_duration' => $body['call_duration'] ?? null,
        ];
        
        $stmt->execute([
            $contactId,
            $userId,
            $body['campaign_id'] ?? null,
            'disposition_' . strtolower(str_replace(' ', '_', $disposition['name'])),
            json_encode($outcomeData),
            $sentimentMap[$disposition['category']] ?? 'neutral',
            $body['notes'] ?? null,
        ]);
        
        $outcomeId = $pdo->lastInsertId();

        // Update or create corresponding CRM lead and activity
        try {
            $campaignId = isset($body['campaign_id']) ? (int)$body['campaign_id'] : null;
            $sentiment = $sentimentMap[$disposition['category']] ?? 'neutral';

            LeadOutcomeService::recordOutcome(
                (int)$userId,
                (int)$contactId,
                $campaignId,
                'call',
                'disposition_' . strtolower(str_replace(' ', '_', $disposition['name'])),
                $sentiment,
                $body['notes'] ?? null,
                [
                    'campaign_id' => $campaignId,
                    'call_id' => $callId,
                    'disposition_id' => $dispositionId,
                ]
            );
        } catch (Exception $e) {
            // Fail soft: log but do not break existing outcome recording
            error_log('LeadOutcomeService recordOutcome failed for call disposition: ' . $e->getMessage());
        }
        
        // Update call log if call_id provided
        if ($callId) {
            $stmt = $pdo->prepare('
                UPDATE call_logs 
                SET disposition_id = ?, disposition_notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            ');
            $stmt->execute([$dispositionId, $body['notes'] ?? null, $callId, $userId]);
        }
        
        // Trigger automations
        FollowUpAutomationsController::processTrigger($userId, 'call', 'disposition_set', $contactId, [
            'disposition_id' => $dispositionId,
            'disposition_name' => $disposition['name'],
            'disposition_category' => $disposition['category'],
            'campaign_id' => $body['campaign_id'] ?? null,
            'requires_callback' => (bool)$disposition['requires_callback'],
        ]);
        
        // If callback required, create callback task
        if ($disposition['requires_callback'] && isset($body['callback_time'])) {
            // Implementation would create a scheduled callback
        }
        
        Response::json([
            'success' => true,
            'outcome_id' => $outcomeId,
            'disposition' => [
                'id' => $dispositionId,
                'name' => $disposition['name'],
                'category' => $disposition['category'],
            ],
        ]);
    }
    
    /**
     * Map outcome type to automation trigger type
     */
    private static function mapOutcomeToTrigger(string $channel, string $outcomeType): ?string {
        $mapping = [
            'email' => [
                'opened' => 'email_opened',
                'clicked' => 'email_clicked',
                'replied' => 'email_replied',
                'bounced' => 'email_bounced',
                'unsubscribed' => 'email_unsubscribed',
            ],
            'sms' => [
                'delivered' => 'sms_delivered',
                'replied' => 'sms_replied',
                'clicked' => 'sms_clicked',
                'failed' => 'sms_failed',
                'opted_out' => 'sms_opted_out',
            ],
            'call' => [
                'answered' => 'call_answered',
                'voicemail' => 'call_voicemail',
                'no_answer' => 'call_no_answer',
                'busy' => 'call_busy',
                'failed' => 'call_failed',
            ],
        ];
        
        return $mapping[$channel][$outcomeType] ?? null;
    }
    
    /**
     * Map outcome record to API response
     */
    private static function mapOutcome(array $o): array {
        return [
            'id' => (string)$o['id'],
            'contact_id' => (string)$o['contact_id'],
            'contact' => isset($o['email']) ? [
                'email' => $o['email'],
                'name' => trim(($o['first_name'] ?? '') . ' ' . ($o['last_name'] ?? '')),
            ] : null,
            'channel' => $o['channel'],
            'campaign_id' => $o['campaign_id'] ? (string)$o['campaign_id'] : null,
            'campaign_name' => $o['campaign_name'] ?? null,
            'outcome_type' => $o['outcome_type'],
            'outcome_data' => json_decode($o['outcome_data'], true) ?? [],
            'sentiment' => $o['sentiment'],
            'notes' => $o['notes'],
            'recorded_by' => $o['recorded_by'],
            'created_at' => $o['created_at'],
        ];
    }
}
