<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';

class LeadOutcomeService {
    public static function recordOutcome(
        int $userId,
        int $contactId,
        ?int $campaignId,
        string $channel,      // 'email' | 'sms' | 'call'
        string $outcomeType,  // e.g. 'opened', 'clicked', 'replied', 'disposition_interested', ...
        ?string $sentiment = null,
        ?string $notes = null,
        array $extra = []
    ): void {
        $db = Database::conn();

        // 1) Find or create lead
        $leadId = self::findOrCreateLead($db, $userId, $contactId, $campaignId, $channel);

        // 2) Insert lead activity
        self::insertLeadActivity($db, $leadId, $contactId, $channel, $outcomeType, $notes, $extra);

        // 3) Update lead stage/score/last_activity_at
        self::updateLeadFromOutcome($db, $leadId, $channel, $outcomeType, $sentiment);
    }

    private static function findOrCreateLead(PDO $db, int $userId, int $contactId, ?int $campaignId, string $channel): int {
        // Try to find existing lead for this contact + campaign
        $sql = 'SELECT id FROM leads WHERE user_id = ? AND contact_id = ?';
        $params = [$userId, $contactId];
        if ($campaignId !== null) {
            $sql .= ' AND campaign_id = ?';
            $params[] = $campaignId;
        }
        $sql .= ' ORDER BY id LIMIT 1';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && isset($row['id'])) {
            return (int)$row['id'];
        }

        // Otherwise create a new lead in 'new' stage with default score
        $insert = $db->prepare('
            INSERT INTO leads (user_id, contact_id, campaign_id, source, lead_stage, lead_score, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ');
        $insert->execute([
            $userId,
            $contactId,
            $campaignId,
            $channel,
            'new',
            0,
        ]);

        return (int)$db->lastInsertId();
    }

    private static function insertLeadActivity(
        PDO $db,
        int $leadId,
        int $contactId,
        string $channel,
        string $outcomeType,
        ?string $notes,
        array $extra
    ): void {
        // Map channel to ActivityType-like value
        $activityType = $channel; // 'email' | 'sms' | 'call'
        $title = ucfirst($channel) . ' ' . str_replace('_', ' ', $outcomeType);
        $description = $notes ?? null;

        $stmt = $db->prepare('
            INSERT INTO lead_activities (
                lead_id, contact_id, activity_type, activity_title, activity_description,
                activity_date, duration_minutes, outcome, next_action, next_action_date,
                campaign_id, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, NOW(), NULL, ?, NULL, NULL, ?, NOW()
            )
        ');

        $campaignId = isset($extra['campaign_id']) ? $extra['campaign_id'] : null;

        $stmt->execute([
            $leadId,
            $contactId,
            $activityType,
            $title,
            $description,
            $outcomeType,
            $campaignId,
        ]);
    }

    private static function updateLeadFromOutcome(
        PDO $db,
        int $leadId,
        string $channel,
        string $outcomeType,
        ?string $sentiment
    ): void {
        // Very simple rules to start with; can be tuned later
        $stageUpdate = null;
        $scoreDelta = 0;

        if ($channel === 'email') {
            if ($outcomeType === 'opened') {
                $stageUpdate = 'contacted';
                $scoreDelta = 5;
            } elseif ($outcomeType === 'clicked') {
                $stageUpdate = 'qualified';
                $scoreDelta = 10;
            } elseif ($outcomeType === 'replied') {
                $stageUpdate = 'qualified';
                $scoreDelta = 15;
            } elseif (in_array($outcomeType, ['bounced', 'unsubscribed'], true)) {
                $stageUpdate = 'closed_lost';
                $scoreDelta = -10;
            }
        } elseif ($channel === 'sms') {
            if ($outcomeType === 'replied') {
                $stageUpdate = 'qualified';
                $scoreDelta = 10;
            } elseif ($outcomeType === 'opted_out') {
                $stageUpdate = 'closed_lost';
                $scoreDelta = -10;
            }
        } elseif ($channel === 'call') {
            // outcomeType for calls is like 'disposition_xxx'
            if (strpos($outcomeType, 'disposition_') === 0) {
                $key = substr($outcomeType, strlen('disposition_'));
                // crude mapping based on keyword
                if (stripos($key, 'interested') !== false || stripos($key, 'positive') !== false) {
                    $stageUpdate = 'qualified';
                    $scoreDelta = 15;
                } elseif (stripos($key, 'won') !== false || stripos($key, 'closed_won') !== false) {
                    $stageUpdate = 'closed_won';
                    $scoreDelta = 30;
                } elseif (stripos($key, 'lost') !== false || stripos($key, 'not_interested') !== false) {
                    $stageUpdate = 'closed_lost';
                    $scoreDelta = -20;
                } elseif (stripos($key, 'callback') !== false) {
                    $stageUpdate = 'contacted';
                    $scoreDelta = 5;
                }
            }
        }

        // Fallback to sentiment if provided
        if ($sentiment && !$stageUpdate) {
            if ($sentiment === 'positive') {
                $scoreDelta = max($scoreDelta, 5);
            } elseif ($sentiment === 'negative') {
                $scoreDelta = min($scoreDelta, -5);
            }
        }

        // Build update SQL
        $setParts = ['last_activity_at = NOW()', 'updated_at = NOW()'];
        $params = [];

        if ($stageUpdate !== null) {
            $setParts[] = 'lead_stage = ?';
            $params[] = $stageUpdate;
        }
        if ($scoreDelta !== 0) {
            $setParts[] = 'lead_score = LEAST(100, GREATEST(0, COALESCE(lead_score, 0) + ?))';
            $params[] = $scoreDelta;
        }

        $params[] = $leadId;

        $sql = 'UPDATE leads SET ' . implode(', ', $setParts) . ' WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    }
}
