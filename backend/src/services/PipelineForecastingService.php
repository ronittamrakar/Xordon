<?php
/**
 * Pipeline Forecasting Service
 * 
 * Handles pipeline management, deal tracking, velocity calculations, and revenue forecasting.
 * 
 * **Feature: crm-enhancements**
 * **Requirements: 6.1, 6.2, 6.3, 6.4**
 */

require_once __DIR__ . '/../Database.php';

class PipelineForecastingService {
    private $db;
    
    public function __construct() {
        $this->db = Database::conn();
    }
    
    /**
     * Get deals grouped by stage
     * **Requirement 6.1**: Pipeline view with deals grouped by stage
     */
    public function getDealsByStage(int $userId, array $filters = []): array {
        $where = ['d.user_id = ?'];
        $params = [$userId];
        
        // Apply filters
        if (!empty($filters['rep_id'])) {
            $where[] = 'd.assigned_to = ?';
            $params[] = $filters['rep_id'];
        }
        
        if (!empty($filters['campaign_id'])) {
            $where[] = 'd.source = ?';
            $params[] = 'campaign_' . $filters['campaign_id'];
        }
        
        if (!empty($filters['date_from'])) {
            $where[] = 'd.created_at >= ?';
            $params[] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $where[] = 'd.created_at <= ?';
            $params[] = $filters['date_to'];
        }
        
        if (!empty($filters['status'])) {
            $where[] = 'd.status = ?';
            $params[] = $filters['status'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get stages
        $stagesStmt = $this->db->prepare("
            SELECT * FROM pipeline_stages 
            WHERE user_id = ? 
            ORDER BY display_order ASC
        ");
        $stagesStmt->execute([$userId]);
        $stages = $stagesStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // If no custom stages, use defaults
        if (empty($stages)) {
            $stages = $this->getDefaultStages();
        }
        
        // Get deals
        $stmt = $this->db->prepare("
            SELECT d.*, c.name as contact_name, c.email as contact_email, c.company as contact_company
            FROM deals d
            LEFT JOIN contacts c ON d.contact_id = c.id
            WHERE {$whereClause}
            ORDER BY d.value DESC
        ");
        $stmt->execute($params);
        $deals = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group deals by stage
        $pipeline = [];
        foreach ($stages as $stage) {
            $stageDeals = array_filter($deals, fn($d) => $d['stage'] === $stage['name']);
            $pipeline[] = [
                'stage' => $stage,
                'deals' => array_values($stageDeals),
                'total_value' => array_sum(array_column($stageDeals, 'value')),
                'deal_count' => count($stageDeals),
                'weighted_value' => array_sum(array_map(
                    fn($d) => $d['value'] * ($d['probability'] / 100),
                    $stageDeals
                ))
            ];
        }
        
        return $pipeline;
    }
    
    /**
     * Calculate deal velocity metrics
     * **Requirement 6.2**: Deal velocity metrics
     */
    public function calculateVelocity(int $userId, array $filters = []): array {
        $where = ['d.user_id = ?'];
        $params = [$userId];
        
        if (!empty($filters['date_from'])) {
            $where[] = 'dsh.changed_at >= ?';
            $params[] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $where[] = 'dsh.changed_at <= ?';
            $params[] = $filters['date_to'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get stage transition times
        $stmt = $this->db->prepare("
            SELECT 
                dsh.from_stage,
                dsh.to_stage,
                AVG(dsh.days_in_previous_stage) as avg_days,
                COUNT(*) as transition_count
            FROM deal_stage_history dsh
            JOIN deals d ON dsh.deal_id = d.id
            WHERE {$whereClause}
            GROUP BY dsh.from_stage, dsh.to_stage
        ");
        $stmt->execute($params);
        $transitions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate overall metrics
        $stmt = $this->db->prepare("
            SELECT 
                AVG(DATEDIFF(COALESCE(d.actual_close_date, CURDATE()), d.created_at)) as avg_cycle_days,
                COUNT(CASE WHEN d.won = 1 THEN 1 END) as won_deals,
                COUNT(CASE WHEN d.won = 0 AND d.actual_close_date IS NOT NULL THEN 1 END) as lost_deals,
                COUNT(*) as total_deals,
                AVG(d.value) as avg_deal_value
            FROM deals d
            WHERE d.user_id = ?
            AND d.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        ");
        $stmt->execute([$userId]);
        $metrics = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $winRate = $metrics['total_deals'] > 0 
            ? ($metrics['won_deals'] / $metrics['total_deals']) * 100 
            : 0;
        
        return [
            'stage_transitions' => $transitions,
            'avg_cycle_days' => round($metrics['avg_cycle_days'] ?? 0, 1),
            'win_rate' => round($winRate, 1),
            'avg_deal_value' => round($metrics['avg_deal_value'] ?? 0, 2),
            'won_deals' => (int) $metrics['won_deals'],
            'lost_deals' => (int) $metrics['lost_deals'],
            'total_deals' => (int) $metrics['total_deals']
        ];
    }
    
    /**
     * Calculate revenue forecast
     * **Requirement 6.4**: Revenue forecast based on stage probabilities
     */
    public function calculateForecast(int $userId, array $filters = []): array {
        $where = ['d.user_id = ?', 'd.status = ?'];
        $params = [$userId, 'open'];
        
        if (!empty($filters['date_from'])) {
            $where[] = 'd.expected_close_date >= ?';
            $params[] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $where[] = 'd.expected_close_date <= ?';
            $params[] = $filters['date_to'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get open deals with probabilities
        $stmt = $this->db->prepare("
            SELECT 
                d.*,
                COALESCE(ps.probability, d.probability) as stage_probability
            FROM deals d
            LEFT JOIN pipeline_stages ps ON d.stage = ps.name AND ps.user_id = d.user_id
            WHERE {$whereClause}
        ");
        $stmt->execute($params);
        $deals = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate forecasts
        $totalPipeline = 0;
        $weightedForecast = 0;
        $bestCase = 0;
        $worstCase = 0;
        $byMonth = [];
        $byStage = [];
        
        foreach ($deals as $deal) {
            $value = (float) $deal['value'];
            $probability = (float) ($deal['stage_probability'] ?? $deal['probability'] ?? 50);
            $weighted = $value * ($probability / 100);
            
            $totalPipeline += $value;
            $weightedForecast += $weighted;
            
            // Best case: all deals with probability >= 50%
            if ($probability >= 50) {
                $bestCase += $value;
            }
            
            // Worst case: only deals with probability >= 75%
            if ($probability >= 75) {
                $worstCase += $value;
            }
            
            // Group by expected close month
            $month = $deal['expected_close_date'] 
                ? date('Y-m', strtotime($deal['expected_close_date']))
                : 'unscheduled';
            
            if (!isset($byMonth[$month])) {
                $byMonth[$month] = ['total' => 0, 'weighted' => 0, 'count' => 0];
            }
            $byMonth[$month]['total'] += $value;
            $byMonth[$month]['weighted'] += $weighted;
            $byMonth[$month]['count']++;
            
            // Group by stage
            $stage = $deal['stage'];
            if (!isset($byStage[$stage])) {
                $byStage[$stage] = ['total' => 0, 'weighted' => 0, 'count' => 0];
            }
            $byStage[$stage]['total'] += $value;
            $byStage[$stage]['weighted'] += $weighted;
            $byStage[$stage]['count']++;
        }
        
        return [
            'total_pipeline' => round($totalPipeline, 2),
            'weighted_forecast' => round($weightedForecast, 2),
            'best_case' => round($bestCase, 2),
            'worst_case' => round($worstCase, 2),
            'deal_count' => count($deals),
            'by_month' => $byMonth,
            'by_stage' => $byStage
        ];
    }

    
    /**
     * Create a new deal
     */
    public function createDeal(int $userId, array $data): int {
        $stmt = $this->db->prepare("
            INSERT INTO deals (
                user_id, contact_id, name, value, currency, stage, 
                probability, expected_close_date, source, notes, assigned_to, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $userId,
            $data['contact_id'] ?? null,
            $data['name'],
            $data['value'] ?? 0,
            $data['currency'] ?? 'USD',
            $data['stage'] ?? 'Lead',
            $data['probability'] ?? 10,
            $data['expected_close_date'] ?? null,
            $data['source'] ?? null,
            $data['notes'] ?? null,
            $data['assigned_to'] ?? $userId
        ]);
        
        $dealId = (int) $this->db->lastInsertId();
        
        // Log initial stage
        $this->logStageChange($dealId, null, $data['stage'] ?? 'Lead', $userId);
        
        return $dealId;
    }
    
    /**
     * Update deal stage
     */
    public function updateDealStage(int $dealId, string $newStage, int $userId): bool {
        // Get current deal
        $stmt = $this->db->prepare("SELECT * FROM deals WHERE id = ?");
        $stmt->execute([$dealId]);
        $deal = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$deal) {
            return false;
        }
        
        $oldStage = $deal['stage'];
        
        // Get stage probability
        $stageStmt = $this->db->prepare("
            SELECT probability, is_won_stage, is_lost_stage 
            FROM pipeline_stages 
            WHERE name = ? AND user_id = ?
        ");
        $stageStmt->execute([$newStage, $deal['user_id']]);
        $stageInfo = $stageStmt->fetch(PDO::FETCH_ASSOC);
        
        $probability = $stageInfo['probability'] ?? $deal['probability'];
        $status = 'open';
        $won = null;
        $actualCloseDate = null;
        
        if ($stageInfo) {
            if ($stageInfo['is_won_stage']) {
                $status = 'won';
                $won = true;
                $actualCloseDate = date('Y-m-d');
            } elseif ($stageInfo['is_lost_stage']) {
                $status = 'lost';
                $won = false;
                $actualCloseDate = date('Y-m-d');
            }
        }
        
        // Update deal
        $updateStmt = $this->db->prepare("
            UPDATE deals SET 
                stage = ?, 
                probability = ?,
                status = ?,
                won = ?,
                actual_close_date = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        $updateStmt->execute([$newStage, $probability, $status, $won, $actualCloseDate, $dealId]);
        
        // Log stage change
        $this->logStageChange($dealId, $oldStage, $newStage, $userId);
        
        return true;
    }
    
    /**
     * Log stage change for velocity tracking
     */
    private function logStageChange(int $dealId, ?string $fromStage, string $toStage, int $userId): void {
        // Calculate days in previous stage
        $daysInStage = 0;
        if ($fromStage) {
            $stmt = $this->db->prepare("
                SELECT DATEDIFF(NOW(), changed_at) as days
                FROM deal_stage_history
                WHERE deal_id = ? AND to_stage = ?
                ORDER BY changed_at DESC
                LIMIT 1
            ");
            $stmt->execute([$dealId, $fromStage]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $daysInStage = $result['days'] ?? 0;
        }
        
        $stmt = $this->db->prepare("
            INSERT INTO deal_stage_history (deal_id, from_stage, to_stage, changed_by, days_in_previous_stage, changed_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$dealId, $fromStage, $toStage, $userId, $daysInStage]);
    }
    
    /**
     * Update stage probabilities
     */
    public function updateStageProbabilities(int $userId, array $probabilities): bool {
        foreach ($probabilities as $stageName => $probability) {
            if ($probability < 0 || $probability > 100) {
                throw new InvalidArgumentException("Probability must be between 0 and 100");
            }
            
            $stmt = $this->db->prepare("
                UPDATE pipeline_stages 
                SET probability = ? 
                WHERE user_id = ? AND name = ?
            ");
            $stmt->execute([$probability, $userId, $stageName]);
        }
        
        return true;
    }
    
    /**
     * Get deal by ID
     */
    public function getDealById(int $dealId): ?array {
        $stmt = $this->db->prepare("
            SELECT d.*, c.name as contact_name, c.email as contact_email
            FROM deals d
            LEFT JOIN contacts c ON d.contact_id = c.id
            WHERE d.id = ?
        ");
        $stmt->execute([$dealId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    
    /**
     * Get default pipeline stages
     */
    private function getDefaultStages(): array {
        return [
            ['name' => 'Lead', 'display_order' => 1, 'probability' => 10, 'color' => '#94A3B8', 'is_won_stage' => false, 'is_lost_stage' => false],
            ['name' => 'Qualified', 'display_order' => 2, 'probability' => 25, 'color' => '#3B82F6', 'is_won_stage' => false, 'is_lost_stage' => false],
            ['name' => 'Proposal', 'display_order' => 3, 'probability' => 50, 'color' => '#8B5CF6', 'is_won_stage' => false, 'is_lost_stage' => false],
            ['name' => 'Negotiation', 'display_order' => 4, 'probability' => 75, 'color' => '#F59E0B', 'is_won_stage' => false, 'is_lost_stage' => false],
            ['name' => 'Closed Won', 'display_order' => 5, 'probability' => 100, 'color' => '#10B981', 'is_won_stage' => true, 'is_lost_stage' => false],
            ['name' => 'Closed Lost', 'display_order' => 6, 'probability' => 0, 'color' => '#EF4444', 'is_won_stage' => false, 'is_lost_stage' => true]
        ];
    }
    
    /**
     * Initialize default stages for a user
     */
    public function initializeDefaultStages(int $userId): void {
        $stages = $this->getDefaultStages();
        
        foreach ($stages as $stage) {
            $stmt = $this->db->prepare("
                INSERT IGNORE INTO pipeline_stages 
                (user_id, name, display_order, probability, color, is_won_stage, is_lost_stage, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $userId,
                $stage['name'],
                $stage['display_order'],
                $stage['probability'],
                $stage['color'],
                $stage['is_won_stage'],
                $stage['is_lost_stage']
            ]);
        }
    }
}
