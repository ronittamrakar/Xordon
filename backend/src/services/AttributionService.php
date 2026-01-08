<?php
/**
 * Attribution Service
 * 
 * Handles lead source capture, touchpoint tracking, and attribution calculations.
 * 
 * **Feature: crm-enhancements**
 * **Requirements: 9.1, 9.2, 9.3, 9.4**
 */

require_once __DIR__ . '/../Database.php';

class AttributionService {
    private $db;
    
    public function __construct() {
        $this->db = Database::conn();
    }
    
    /**
     * Capture lead source on creation
     * **Requirement 9.1**: Automatic source capture
     */
    public function captureSource(int $contactId, array $sourceData): int {
        $stmt = $this->db->prepare("
            INSERT INTO lead_sources (
                contact_id, source_type, source_id, campaign_id, form_id,
                utm_source, utm_medium, utm_campaign, utm_term, utm_content,
                referrer_url, landing_page, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $contactId,
            $sourceData['source_type'] ?? 'unknown',
            $sourceData['source_id'] ?? null,
            $sourceData['campaign_id'] ?? null,
            $sourceData['form_id'] ?? null,
            $sourceData['utm_source'] ?? null,
            $sourceData['utm_medium'] ?? null,
            $sourceData['utm_campaign'] ?? null,
            $sourceData['utm_term'] ?? null,
            $sourceData['utm_content'] ?? null,
            $sourceData['referrer_url'] ?? null,
            $sourceData['landing_page'] ?? null,
            json_encode($sourceData['metadata'] ?? [])
        ]);
        
        $sourceId = (int) $this->db->lastInsertId();
        
        // Also create first touchpoint
        $this->addTouchpoint($contactId, [
            'channel' => $this->mapSourceToChannel($sourceData['source_type'] ?? 'other'),
            'action' => 'lead_created',
            'campaign_id' => $sourceData['campaign_id'] ?? null,
            'metadata' => $sourceData
        ]);
        
        return $sourceId;
    }
    
    /**
     * Add touchpoint for journey tracking
     * **Requirement 9.2**: Touchpoint history
     */
    public function addTouchpoint(int $contactId, array $touchpointData): int {
        $channel = $touchpointData['channel'] ?? 'other';
        $validChannels = ['email', 'sms', 'call', 'form', 'linkedin', 'website', 'ad', 'referral', 'other'];
        
        if (!in_array($channel, $validChannels)) {
            $channel = 'other';
        }
        
        $stmt = $this->db->prepare("
            INSERT INTO touchpoints (
                contact_id, channel, action, campaign_id, content_id, 
                content_type, metadata, revenue_attributed, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $contactId,
            $channel,
            $touchpointData['action'] ?? 'interaction',
            $touchpointData['campaign_id'] ?? null,
            $touchpointData['content_id'] ?? null,
            $touchpointData['content_type'] ?? null,
            json_encode($touchpointData['metadata'] ?? []),
            $touchpointData['revenue_attributed'] ?? 0
        ]);
        
        return (int) $this->db->lastInsertId();
    }
    
    /**
     * Calculate attribution using different models
     * **Requirement 9.3**: Multi-model attribution
     */
    public function calculateAttribution(int $contactId, string $model = 'linear', float $revenue = 0): array {
        // Get all touchpoints for contact
        $touchpoints = $this->getContactJourney($contactId);
        
        if (empty($touchpoints)) {
            return [];
        }
        
        $attribution = [];
        $count = count($touchpoints);
        
        switch ($model) {
            case 'first_touch':
                // 100% credit to first touchpoint
                $attribution[$touchpoints[0]['id']] = [
                    'touchpoint' => $touchpoints[0],
                    'credit' => 1.0,
                    'revenue' => $revenue
                ];
                break;
                
            case 'last_touch':
                // 100% credit to last touchpoint
                $attribution[$touchpoints[$count - 1]['id']] = [
                    'touchpoint' => $touchpoints[$count - 1],
                    'credit' => 1.0,
                    'revenue' => $revenue
                ];
                break;
                
            case 'linear':
                // Equal credit to all touchpoints
                $creditPerTouch = 1.0 / $count;
                $revenuePerTouch = $revenue / $count;
                
                foreach ($touchpoints as $tp) {
                    $attribution[$tp['id']] = [
                        'touchpoint' => $tp,
                        'credit' => $creditPerTouch,
                        'revenue' => $revenuePerTouch
                    ];
                }
                break;
                
            case 'time_decay':
                // More credit to recent touchpoints
                $totalWeight = 0;
                $weights = [];
                
                foreach ($touchpoints as $i => $tp) {
                    $weight = pow(2, $i); // Exponential weight
                    $weights[$tp['id']] = $weight;
                    $totalWeight += $weight;
                }
                
                foreach ($touchpoints as $tp) {
                    $credit = $weights[$tp['id']] / $totalWeight;
                    $attribution[$tp['id']] = [
                        'touchpoint' => $tp,
                        'credit' => $credit,
                        'revenue' => $revenue * $credit
                    ];
                }
                break;
                
            case 'u_shaped':
                // 40% first, 40% last, 20% distributed to middle
                if ($count === 1) {
                    $attribution[$touchpoints[0]['id']] = [
                        'touchpoint' => $touchpoints[0],
                        'credit' => 1.0,
                        'revenue' => $revenue
                    ];
                } elseif ($count === 2) {
                    $attribution[$touchpoints[0]['id']] = [
                        'touchpoint' => $touchpoints[0],
                        'credit' => 0.5,
                        'revenue' => $revenue * 0.5
                    ];
                    $attribution[$touchpoints[1]['id']] = [
                        'touchpoint' => $touchpoints[1],
                        'credit' => 0.5,
                        'revenue' => $revenue * 0.5
                    ];
                } else {
                    $middleCount = $count - 2;
                    $middleCredit = 0.2 / $middleCount;
                    
                    $attribution[$touchpoints[0]['id']] = [
                        'touchpoint' => $touchpoints[0],
                        'credit' => 0.4,
                        'revenue' => $revenue * 0.4
                    ];
                    
                    for ($i = 1; $i < $count - 1; $i++) {
                        $attribution[$touchpoints[$i]['id']] = [
                            'touchpoint' => $touchpoints[$i],
                            'credit' => $middleCredit,
                            'revenue' => $revenue * $middleCredit
                        ];
                    }
                    
                    $attribution[$touchpoints[$count - 1]['id']] = [
                        'touchpoint' => $touchpoints[$count - 1],
                        'credit' => 0.4,
                        'revenue' => $revenue * 0.4
                    ];
                }
                break;
                
            default:
                throw new InvalidArgumentException("Unknown attribution model: {$model}");
        }
        
        return $attribution;
    }
    
    /**
     * Get attribution report aggregated by source/campaign/channel
     * **Requirement 9.4**: Attribution aggregation
     */
    public function getAttributionReport(int $userId, array $filters = []): array {
        $where = ['c.user_id = ?'];
        $params = [$userId];
        
        if (!empty($filters['date_from'])) {
            $where[] = 't.created_at >= ?';
            $params[] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $where[] = 't.created_at <= ?';
            $params[] = $filters['date_to'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        // By channel
        $stmt = $this->db->prepare("
            SELECT 
                t.channel,
                COUNT(DISTINCT t.contact_id) as contacts,
                COUNT(*) as touchpoints,
                SUM(t.revenue_attributed) as revenue
            FROM touchpoints t
            JOIN contacts c ON t.contact_id = c.id
            WHERE {$whereClause}
            GROUP BY t.channel
            ORDER BY revenue DESC
        ");
        $stmt->execute($params);
        $byChannel = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // By campaign
        $stmt = $this->db->prepare("
            SELECT 
                t.campaign_id,
                COUNT(DISTINCT t.contact_id) as contacts,
                COUNT(*) as touchpoints,
                SUM(t.revenue_attributed) as revenue
            FROM touchpoints t
            JOIN contacts c ON t.contact_id = c.id
            WHERE {$whereClause} AND t.campaign_id IS NOT NULL
            GROUP BY t.campaign_id
            ORDER BY revenue DESC
        ");
        $stmt->execute($params);
        $byCampaign = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // By source type
        $stmt = $this->db->prepare("
            SELECT 
                ls.source_type,
                COUNT(DISTINCT ls.contact_id) as contacts,
                COUNT(*) as sources
            FROM lead_sources ls
            JOIN contacts c ON ls.contact_id = c.id
            WHERE c.user_id = ?
            GROUP BY ls.source_type
            ORDER BY contacts DESC
        ");
        $stmt->execute([$userId]);
        $bySource = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'by_channel' => $byChannel,
            'by_campaign' => $byCampaign,
            'by_source' => $bySource,
            'totals' => [
                'total_revenue' => array_sum(array_column($byChannel, 'revenue')),
                'total_contacts' => array_sum(array_column($bySource, 'contacts')),
                'total_touchpoints' => array_sum(array_column($byChannel, 'touchpoints'))
            ]
        ];
    }
    
    /**
     * Get contact journey (all touchpoints)
     */
    public function getContactJourney(int $contactId): array {
        $stmt = $this->db->prepare("
            SELECT * FROM touchpoints 
            WHERE contact_id = ? 
            ORDER BY created_at ASC
        ");
        $stmt->execute([$contactId]);
        $touchpoints = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($touchpoints as &$tp) {
            $tp['metadata'] = json_decode($tp['metadata'], true) ?? [];
        }
        
        return $touchpoints;
    }
    
    /**
     * Get lead source for contact
     */
    public function getLeadSource(int $contactId): ?array {
        $stmt = $this->db->prepare("
            SELECT * FROM lead_sources 
            WHERE contact_id = ? 
            ORDER BY created_at ASC 
            LIMIT 1
        ");
        $stmt->execute([$contactId]);
        $source = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($source) {
            $source['metadata'] = json_decode($source['metadata'], true) ?? [];
        }
        
        return $source ?: null;
    }
    
    /**
     * Map source type to channel
     */
    private function mapSourceToChannel(string $sourceType): string {
        $mapping = [
            'form' => 'form',
            'call' => 'call',
            'campaign' => 'email',
            'referral' => 'referral',
            'import' => 'other',
            'api' => 'other'
        ];
        
        return $mapping[$sourceType] ?? 'other';
    }
}
