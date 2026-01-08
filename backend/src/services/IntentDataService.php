<?php
/**
 * IntentDataService - Intent data feeds integration
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

require_once __DIR__ . '/../Database.php';

class IntentDataService {
    private $db;
    private const STALE_DAYS = 30;
    
    public function __construct() {
        $this->db = Database::conn();
    }
    
    /**
     * Ingest intent data from providers
     * Requirements: 5.1
     * 
     * @param array $signals Array of intent signals
     * @return int Number of signals ingested
     */
    public function ingestIntentData(array $signals): int {
        $ingested = 0;
        
        foreach ($signals as $signal) {
            try {
                // Validate required fields
                if (empty($signal['topic']) || empty($signal['strength']) || empty($signal['source'])) {
                    continue;
                }
                
                // Validate strength
                $validStrengths = ['low', 'medium', 'high'];
                if (!in_array($signal['strength'], $validStrengths)) {
                    continue;
                }
                
                // Try to match to existing contact
                $matchResult = null;
                if (!empty($signal['email_domain']) || !empty($signal['company_name'])) {
                    $matchResult = $this->matchToContact(
                        $signal['email_domain'] ?? null,
                        $signal['company_name'] ?? null
                    );
                }
                
                $stmt = $this->db->prepare("
                    INSERT INTO intent_signals 
                    (contact_id, topic, strength, source, source_url, detected_at, 
                     match_type, match_confidence, metadata, is_stale, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, NOW())
                ");
                
                $stmt->execute([
                    $matchResult ? $matchResult['contact_id'] : null,
                    $signal['topic'],
                    $signal['strength'],
                    $signal['source'],
                    $signal['source_url'] ?? null,
                    $signal['detected_at'] ?? date('Y-m-d H:i:s'),
                    $matchResult ? $matchResult['match_type'] : null,
                    $matchResult ? $matchResult['confidence'] : null,
                    isset($signal['metadata']) ? json_encode($signal['metadata']) : null
                ]);
                
                $ingested++;
                
            } catch (Exception $e) {
                error_log("IntentDataService::ingestIntentData error: " . $e->getMessage());
            }
        }
        
        return $ingested;
    }
    
    /**
     * Match intent signals to contacts by domain or company name
     * Requirements: 5.1
     * 
     * @param string|null $emailDomain
     * @param string|null $companyName
     * @return array|null Match result with contact_id, match_type, confidence
     */
    public function matchToContact(?string $emailDomain, ?string $companyName): ?array {
        // Try email domain match first (higher confidence)
        if ($emailDomain) {
            $stmt = $this->db->prepare("
                SELECT id FROM contacts 
                WHERE email LIKE ? 
                LIMIT 1
            ");
            $stmt->execute(['%@' . $emailDomain]);
            $contact = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($contact) {
                return [
                    'contact_id' => $contact['id'],
                    'match_type' => 'email_domain',
                    'confidence' => 0.9
                ];
            }
        }
        
        // Try company name match
        if ($companyName) {
            $stmt = $this->db->prepare("
                SELECT id FROM contacts 
                WHERE company LIKE ? 
                LIMIT 1
            ");
            $stmt->execute(['%' . $companyName . '%']);
            $contact = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($contact) {
                return [
                    'contact_id' => $contact['id'],
                    'match_type' => 'company_name',
                    'confidence' => 0.7
                ];
            }
        }
        
        return null;
    }
    
    /**
     * Match multiple signals to contacts
     * Requirements: 5.1
     * 
     * @param array $signals
     * @return array Match results
     */
    public function matchToContacts(array $signals): array {
        $results = [];
        
        foreach ($signals as $signal) {
            $match = $this->matchToContact(
                $signal['email_domain'] ?? null,
                $signal['company_name'] ?? null
            );
            
            if ($match) {
                $results[] = [
                    'signal_id' => $signal['id'] ?? null,
                    'contact_id' => $match['contact_id'],
                    'match_type' => $match['match_type'],
                    'confidence' => $match['confidence']
                ];
            }
        }
        
        return $results;
    }
    
    /**
     * Get intent signals for a contact
     * Requirements: 5.2
     * 
     * @param int $contactId
     * @param bool $includeStale
     * @return array
     */
    public function getContactIntentSignals(int $contactId, bool $includeStale = false): array {
        $sql = "
            SELECT * FROM intent_signals 
            WHERE contact_id = ?
        ";
        
        if (!$includeStale) {
            $sql .= " AND is_stale = FALSE";
        }
        
        $sql .= " ORDER BY detected_at DESC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$contactId]);
        
        return array_map(function($signal) {
            return [
                'id' => (int) $signal['id'],
                'topic' => $signal['topic'],
                'strength' => $signal['strength'],
                'source' => $signal['source'],
                'source_url' => $signal['source_url'],
                'detected_at' => $signal['detected_at'],
                'is_stale' => (bool) $signal['is_stale'],
                'match_type' => $signal['match_type'],
                'match_confidence' => $signal['match_confidence'] ? (float) $signal['match_confidence'] : null,
                'metadata' => $signal['metadata'] ? json_decode($signal['metadata'], true) : null
            ];
        }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    
    /**
     * Get high-strength intent signals for automation triggers
     * Requirements: 5.3
     * 
     * @return array
     */
    public function getHighIntentSignals(): array {
        $stmt = $this->db->prepare("
            SELECT s.*, c.name as contact_name, c.email as contact_email
            FROM intent_signals s
            LEFT JOIN contacts c ON c.id = s.contact_id
            WHERE s.strength = 'high' 
            AND s.is_stale = FALSE
            AND s.contact_id IS NOT NULL
            ORDER BY s.detected_at DESC
        ");
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Mark signals older than 30 days as stale
     * Requirements: 5.4
     * 
     * @return int Number of signals marked stale
     */
    public function markStaleSignals(): int {
        $staleDate = date('Y-m-d H:i:s', strtotime('-' . self::STALE_DAYS . ' days'));
        
        $stmt = $this->db->prepare("
            UPDATE intent_signals 
            SET is_stale = TRUE 
            WHERE detected_at < ? AND is_stale = FALSE
        ");
        $stmt->execute([$staleDate]);
        
        return $stmt->rowCount();
    }
    
    /**
     * Check if a signal is stale based on detection date
     * Requirements: 5.4
     * 
     * @param string $detectedAt
     * @return bool
     */
    public function isSignalStale(string $detectedAt): bool {
        $detectedTime = strtotime($detectedAt);
        $staleTime = strtotime('-' . self::STALE_DAYS . ' days');
        
        return $detectedTime < $staleTime;
    }
    
    /**
     * Get intent signal by ID
     */
    public function getSignalById(int $signalId): ?array {
        $stmt = $this->db->prepare("
            SELECT s.*, c.name as contact_name, c.email as contact_email
            FROM intent_signals s
            LEFT JOIN contacts c ON c.id = s.contact_id
            WHERE s.id = ?
        ");
        $stmt->execute([$signalId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }
    
    /**
     * Update signal contact association
     */
    public function updateSignalContact(int $signalId, int $contactId, string $matchType, float $confidence): bool {
        $stmt = $this->db->prepare("
            UPDATE intent_signals 
            SET contact_id = ?, match_type = ?, match_confidence = ?
            WHERE id = ?
        ");
        return $stmt->execute([$contactId, $matchType, $confidence, $signalId]);
    }
    
    /**
     * Get all active (non-stale) signals
     */
    public function getActiveSignals(int $limit = 100): array {
        $stmt = $this->db->prepare("
            SELECT s.*, c.name as contact_name, c.email as contact_email
            FROM intent_signals s
            LEFT JOIN contacts c ON c.id = s.contact_id
            WHERE s.is_stale = FALSE
            ORDER BY s.detected_at DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get signals by topic
     */
    public function getSignalsByTopic(string $topic): array {
        $stmt = $this->db->prepare("
            SELECT s.*, c.name as contact_name, c.email as contact_email
            FROM intent_signals s
            LEFT JOIN contacts c ON c.id = s.contact_id
            WHERE s.topic LIKE ? AND s.is_stale = FALSE
            ORDER BY s.detected_at DESC
        ");
        $stmt->execute(['%' . $topic . '%']);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
