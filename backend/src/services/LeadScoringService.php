<?php
/**
 * Lead Scoring Service
 * 
 * AI-powered lead scoring based on behavioral signals.
 * Calculates scores (0-100) using weighted signals including:
 * - Email opens (default weight: 5)
 * - Link clicks (default weight: 10)
 * - Call duration over 2 minutes (default weight: 15)
 * - Form submissions (default weight: 20)
 * - Reply sentiment (default weight: 25)
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

class LeadScoringService {
    private PDO $pdo;
    private array $defaultWeights = [
        'email_opens' => 5,
        'link_clicks' => 10,
        'call_duration' => 15,
        'form_submissions' => 20,
        'reply_sentiment' => 25
    ];
    
    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Calculate lead score for a contact
     * Requirements: 1.1
     * 
     * @param int $contactId
     * @return array Score data with factors
     */
    public function calculateScore(int $contactId): array {
        $weights = $this->getWeightsForContact($contactId);
        $signals = $this->getBehavioralSignals($contactId);
        
        $factors = [];
        $totalScore = 0;
        
        // Email opens
        if ($signals['email_opens'] > 0) {
            $contribution = min($signals['email_opens'] * $weights['email_opens'], 100);
            $factors[] = [
                'signal' => 'email_opens',
                'weight' => $weights['email_opens'],
                'value' => $signals['email_opens'],
                'contribution' => $contribution
            ];
            $totalScore += $contribution;
        }
        
        // Link clicks
        if ($signals['link_clicks'] > 0) {
            $contribution = min($signals['link_clicks'] * $weights['link_clicks'], 100);
            $factors[] = [
                'signal' => 'link_clicks',
                'weight' => $weights['link_clicks'],
                'value' => $signals['link_clicks'],
                'contribution' => $contribution
            ];
            $totalScore += $contribution;
        }
        
        // Call duration (over 2 minutes)
        if ($signals['call_duration_minutes'] > 2) {
            $durationFactor = min(($signals['call_duration_minutes'] - 2) / 5, 5); // Max 5x multiplier
            $contribution = min($durationFactor * $weights['call_duration'], 100);
            $factors[] = [
                'signal' => 'call_duration',
                'weight' => $weights['call_duration'],
                'value' => $signals['call_duration_minutes'],
                'contribution' => round($contribution, 2)
            ];
            $totalScore += $contribution;
        }
        
        // Form submissions
        if ($signals['form_submissions'] > 0) {
            $contribution = min($signals['form_submissions'] * $weights['form_submissions'], 100);
            $factors[] = [
                'signal' => 'form_submissions',
                'weight' => $weights['form_submissions'],
                'value' => $signals['form_submissions'],
                'contribution' => $contribution
            ];
            $totalScore += $contribution;
        }
        
        // Reply sentiment (positive replies)
        if ($signals['positive_replies'] > 0) {
            $contribution = min($signals['positive_replies'] * $weights['reply_sentiment'], 100);
            $factors[] = [
                'signal' => 'reply_sentiment',
                'weight' => $weights['reply_sentiment'],
                'value' => $signals['positive_replies'],
                'contribution' => $contribution
            ];
            $totalScore += $contribution;
        }
        
        // Cap score at 100
        $score = min((int)round($totalScore), 100);
        
        // Store the score
        $this->storeScore($contactId, $score, $factors);
        
        return [
            'contact_id' => $contactId,
            'score' => $score,
            'factors' => $factors,
            'calculated_at' => date('Y-m-d H:i:s')
        ];
    }

    
    /**
     * Store calculated score
     * Requirements: 1.2, 1.4
     */
    private function storeScore(int $contactId, int $score, array $factors): void {
        // Get previous score for change logging
        $previousScore = $this->getLatestScore($contactId);
        
        // Insert new score
        $stmt = $this->pdo->prepare("
            INSERT INTO lead_scores (contact_id, score, factors, calculated_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$contactId, $score, json_encode($factors)]);
        
        // Log score change if > 10 points difference (Requirement 1.4)
        if ($previousScore !== null && abs($score - $previousScore['score']) > 10) {
            $triggeringSignal = !empty($factors) ? $factors[0]['signal'] : 'unknown';
            $this->logScoreChange($contactId, $previousScore['score'], $score, $triggeringSignal);
        }
    }
    
    /**
     * Log significant score changes
     * Requirements: 1.4
     */
    private function logScoreChange(int $contactId, int $previousScore, int $newScore, string $triggeringSignal): void {
        $stmt = $this->pdo->prepare("
            INSERT INTO score_changes (contact_id, previous_score, new_score, triggering_signal)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$contactId, $previousScore, $newScore, $triggeringSignal]);
    }
    
    /**
     * Get latest score for a contact
     */
    public function getLatestScore(int $contactId): ?array {
        $stmt = $this->pdo->prepare("
            SELECT * FROM lead_scores 
            WHERE contact_id = ? 
            ORDER BY calculated_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$contactId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            $result['factors'] = json_decode($result['factors'], true);
        }
        
        return $result ?: null;
    }
    
    /**
     * Get top leads sorted by score
     * Requirements: 1.3
     */
    public function getTopLeads(int $limit = 20, ?int $userId = null): array {
        $sql = "
            SELECT ls.*, c.first_name, c.last_name, c.email, c.company
            FROM lead_scores ls
            INNER JOIN (
                SELECT contact_id, MAX(calculated_at) as max_date
                FROM lead_scores
                GROUP BY contact_id
            ) latest ON ls.contact_id = latest.contact_id AND ls.calculated_at = latest.max_date
            INNER JOIN contacts c ON ls.contact_id = c.id
        ";
        
        $params = [];
        if ($userId !== null) {
            $sql .= " WHERE c.user_id = ?";
            $params[] = $userId;
        }
        
        $sql .= " ORDER BY ls.score DESC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($results as &$result) {
            $result['factors'] = json_decode($result['factors'], true);
        }
        
        return $results;
    }
    
    /**
     * Get score history for a contact
     */
    public function getScoreHistory(int $contactId, int $limit = 30): array {
        $stmt = $this->pdo->prepare("
            SELECT * FROM lead_scores 
            WHERE contact_id = ? 
            ORDER BY calculated_at DESC 
            LIMIT ?
        ");
        $stmt->execute([$contactId, $limit]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($results as &$result) {
            $result['factors'] = json_decode($result['factors'], true);
        }
        
        return $results;
    }
    
    /**
     * Get score changes for a contact
     */
    public function getScoreChanges(int $contactId, int $limit = 20): array {
        $stmt = $this->pdo->prepare("
            SELECT * FROM score_changes 
            WHERE contact_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        ");
        $stmt->execute([$contactId, $limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Update signal weights
     * Requirements: 1.5
     */
    public function updateWeights(int $userId, array $weights): bool {
        // Validate weights
        foreach ($weights as $signal => $weight) {
            if (!isset($this->defaultWeights[$signal])) {
                throw new InvalidArgumentException("Invalid signal: $signal");
            }
            if ($weight < 0 || $weight > 100) {
                throw new InvalidArgumentException("Weight for $signal must be between 0 and 100");
            }
        }
        
        $stmt = $this->pdo->prepare("
            INSERT INTO signal_weights (user_id, email_opens, link_clicks, call_duration, form_submissions, reply_sentiment)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                email_opens = VALUES(email_opens),
                link_clicks = VALUES(link_clicks),
                call_duration = VALUES(call_duration),
                form_submissions = VALUES(form_submissions),
                reply_sentiment = VALUES(reply_sentiment),
                updated_at = CURRENT_TIMESTAMP
        ");
        
        return $stmt->execute([
            $userId,
            $weights['email_opens'] ?? $this->defaultWeights['email_opens'],
            $weights['link_clicks'] ?? $this->defaultWeights['link_clicks'],
            $weights['call_duration'] ?? $this->defaultWeights['call_duration'],
            $weights['form_submissions'] ?? $this->defaultWeights['form_submissions'],
            $weights['reply_sentiment'] ?? $this->defaultWeights['reply_sentiment']
        ]);
    }
    
    /**
     * Get weights for a contact's owner
     */
    private function getWeightsForContact(int $contactId): array {
        // Get user_id from contact
        $stmt = $this->pdo->prepare("SELECT user_id FROM contacts WHERE id = ?");
        $stmt->execute([$contactId]);
        $contact = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$contact || !$contact['user_id']) {
            return $this->defaultWeights;
        }
        
        return $this->getWeightsForUser($contact['user_id']);
    }
    
    /**
     * Get weights for a user
     */
    public function getWeightsForUser(int $userId): array {
        $stmt = $this->pdo->prepare("SELECT * FROM signal_weights WHERE user_id = ?");
        $stmt->execute([$userId]);
        $weights = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$weights) {
            return $this->defaultWeights;
        }
        
        return [
            'email_opens' => (int)$weights['email_opens'],
            'link_clicks' => (int)$weights['link_clicks'],
            'call_duration' => (int)$weights['call_duration'],
            'form_submissions' => (int)$weights['form_submissions'],
            'reply_sentiment' => (int)$weights['reply_sentiment']
        ];
    }
    
    /**
     * Get behavioral signals for a contact
     */
    private function getBehavioralSignals(int $contactId): array {
        $signals = [
            'email_opens' => 0,
            'link_clicks' => 0,
            'call_duration_minutes' => 0,
            'form_submissions' => 0,
            'positive_replies' => 0
        ];
        
        // Email opens from campaign analytics (if table exists)
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as opens FROM campaign_analytics 
                WHERE contact_id = ? AND event_type = 'open'
            ");
            $stmt->execute([$contactId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $signals['email_opens'] = (int)($result['opens'] ?? 0);
        } catch (PDOException $e) {
            // Table may not exist
        }
        
        // Link clicks
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as clicks FROM campaign_analytics 
                WHERE contact_id = ? AND event_type = 'click'
            ");
            $stmt->execute([$contactId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $signals['link_clicks'] = (int)($result['clicks'] ?? 0);
        } catch (PDOException $e) {
            // Table may not exist
        }
        
        // Call duration (sum of all calls)
        try {
            $stmt = $this->pdo->prepare("
                SELECT COALESCE(SUM(duration), 0) / 60 as total_minutes 
                FROM call_logs WHERE contact_id = ?
            ");
            $stmt->execute([$contactId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $signals['call_duration_minutes'] = (float)($result['total_minutes'] ?? 0);
        } catch (PDOException $e) {
            // Table may not exist
        }
        
        // Form submissions
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as submissions FROM form_submissions 
                WHERE contact_id = ?
            ");
            $stmt->execute([$contactId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $signals['form_submissions'] = (int)($result['submissions'] ?? 0);
        } catch (PDOException $e) {
            // Table may not exist
        }
        
        // Positive replies (from sentiment analysis if available)
        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as positive FROM contact_sentiment 
                WHERE contact_id = ? AND sentiment = 'positive'
            ");
            $stmt->execute([$contactId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $signals['positive_replies'] = (int)($result['positive'] ?? 0);
        } catch (PDOException $e) {
            // Table may not exist
        }
        
        return $signals;
    }
    
    /**
     * Recalculate scores for all contacts of a user
     */
    public function recalculateAllScores(int $userId): int {
        $stmt = $this->pdo->prepare("SELECT id FROM contacts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $contacts = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $count = 0;
        foreach ($contacts as $contactId) {
            try {
                $this->calculateScore($contactId);
                $count++;
            } catch (Exception $e) {
                error_log("Failed to calculate score for contact $contactId: " . $e->getMessage());
            }
        }
        
        return $count;
    }
    
    /**
     * Get default weights
     */
    public function getDefaultWeights(): array {
        return $this->defaultWeights;
    }
}
