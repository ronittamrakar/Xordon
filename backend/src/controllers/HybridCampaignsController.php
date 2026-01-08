<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../services/HybridCampaignProcessor.php';

class HybridCampaignsController {
    private const ALLOWED_STATUS = ['draft', 'active', 'paused', 'completed', 'archived'];
    private const ALLOWED_ENTRY_CHANNELS = ['email', 'sms', 'call'];
    private const ALLOWED_FOLLOW_UP_MODES = ['single', 'hybrid'];
    private const ALLOWED_AUDIENCE_SOURCES = ['contacts', 'csv', 'manual'];
    private const ALLOWED_STEP_CHANNELS = ['email', 'sms', 'call'];

    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('SELECT * FROM hybrid_campaigns WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$userId]);
        $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        Response::json([
            'campaigns' => array_map([self::class, 'mapCampaign'], $campaigns)
        ]);
    }

    public static function show(string $id): void {
        $campaign = self::getCampaignOrFail($id);
        Response::json(self::mapCampaign($campaign));
    }

    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $data = get_json_body();

        $name = trim($data['name'] ?? '');
        if ($name === '') {
            Response::error('Campaign name is required', 422);
            return;
        }

        $campaignId = self::generateId();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('INSERT INTO hybrid_campaigns (id, user_id, name, description, status, entry_channel, follow_up_mode, audience_source, audience_payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
        $stmt->execute([
            $campaignId,
            $userId,
            $name,
            $data['description'] ?? null,
            self::normalizeStatus($data['status'] ?? 'draft'),
            self::normalizeEntryChannel($data['entry_channel'] ?? 'email'),
            self::normalizeFollowUpMode($data['follow_up_mode'] ?? 'hybrid'),
            self::normalizeAudienceSource($data['audience_source'] ?? 'contacts'),
            self::encodeJson($data['audience_payload'] ?? null)
        ]);

        $campaign = self::getCampaignOrFail($campaignId);
        Response::json(self::mapCampaign($campaign), 201);
    }

    public static function update(string $id): void {
        $campaign = self::getCampaignOrFail($id);
        $data = get_json_body();

        $fields = [];
        $values = [];

        if (isset($data['name'])) {
            $name = trim((string)$data['name']);
            if ($name === '') {
                Response::error('Campaign name cannot be empty', 422);
                return;
            }
            $fields[] = 'name = ?';
            $values[] = $name;
        }

        if (array_key_exists('description', $data)) {
            $fields[] = 'description = ?';
            $values[] = $data['description'];
        }

        if (isset($data['status'])) {
            $fields[] = 'status = ?';
            $values[] = self::normalizeStatus($data['status']);
        }

        if (isset($data['entry_channel'])) {
            $fields[] = 'entry_channel = ?';
            $values[] = self::normalizeEntryChannel($data['entry_channel']);
        }

        if (isset($data['follow_up_mode'])) {
            $fields[] = 'follow_up_mode = ?';
            $values[] = self::normalizeFollowUpMode($data['follow_up_mode']);
        }

        if (isset($data['audience_source'])) {
            $fields[] = 'audience_source = ?';
            $values[] = self::normalizeAudienceSource($data['audience_source']);
        }

        if (array_key_exists('audience_payload', $data)) {
            $fields[] = 'audience_payload = ?';
            $values[] = self::encodeJson($data['audience_payload']);
        }

        if (empty($fields)) {
            Response::error('No valid fields to update', 422);
            return;
        }

        $fields[] = 'updated_at = CURRENT_TIMESTAMP';
        $values[] = $id;
        $values[] = $campaign['user_id'];

        $pdo = Database::conn();
        $sql = 'UPDATE hybrid_campaigns SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);

        $updated = self::getCampaignOrFail($id);
        Response::json(self::mapCampaign($updated));
    }

    public static function delete(string $id): void {
        $campaign = self::getCampaignOrFail($id);
        $pdo = Database::conn();
        $stmt = $pdo->prepare('DELETE FROM hybrid_campaigns WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $campaign['user_id']]);
        Response::json(['message' => 'Campaign deleted']);
    }

    public static function getSteps(string $campaignId): void {
        $campaign = self::getCampaignOrFail($campaignId);
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM hybrid_campaign_steps WHERE campaign_id = ? ORDER BY step_order ASC');
        $stmt->execute([$campaignId]);
        $steps = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        Response::json([
            'campaign' => self::mapCampaign($campaign),
            'steps' => array_map([self::class, 'mapStep'], $steps)
        ]);
    }

    public static function saveSteps(string $campaignId): void {
        $campaign = self::getCampaignOrFail($campaignId);
        $data = get_json_body();
        $steps = $data['steps'] ?? [];

        if (!is_array($steps)) {
            Response::error('Steps must be an array', 422);
            return;
        }

        $pdo = Database::conn();
        $pdo->beginTransaction();
        try {
            $pdo->prepare('DELETE FROM hybrid_campaign_steps WHERE campaign_id = ?')->execute([$campaignId]);

            if (!empty($steps)) {
                $insert = $pdo->prepare('INSERT INTO hybrid_campaign_steps (id, campaign_id, step_order, channel, subject, content, delay_days, delay_hours, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
                foreach ($steps as $index => $step) {
                    $channel = self::normalizeStepChannel($step['channel'] ?? null);
                    $delayDays = isset($step['delay_days']) ? (int)$step['delay_days'] : 0;
                    $delayHours = isset($step['delay_hours']) ? (int)$step['delay_hours'] : 0;
                    $metadata = self::encodeJson($step['metadata'] ?? null);

                    $insert->execute([
                        self::generateId(),
                        $campaignId,
                        $index + 1,
                        $channel,
                        $step['subject'] ?? null,
                        $step['content'] ?? null,
                        $delayDays,
                        $delayHours,
                        $metadata
                    ]);
                }
            }

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            Response::error('Failed to save steps: ' . $e->getMessage(), 500);
            return;
        }

        self::getSteps($campaignId);
    }

    public static function addContacts(string $campaignId): void {
        $campaign = self::getCampaignOrFail($campaignId);
        $data = get_json_body();
        $contacts = $data['contacts'] ?? [];

        if (empty($contacts) || !is_array($contacts)) {
            Response::error('contacts must be a non-empty array', 422);
            return;
        }

        $processor = new HybridCampaignProcessor();
        $inserted = $processor->addContacts((int)$campaign['user_id'], $campaignId, $contacts);

        Response::json([
            'campaign' => self::mapCampaign($campaign),
            'added' => $inserted
        ]);
    }

    public static function getContacts(string $campaignId): void {
        $campaign = self::getCampaignOrFail($campaignId);
        $processor = new HybridCampaignProcessor();
        $contacts = $processor->getCampaignContacts((int)$campaign['user_id'], $campaignId);

        Response::json([
            'campaign' => self::mapCampaign($campaign),
            'contacts' => $contacts
        ]);
    }

    public static function start(string $campaignId): void {
        $campaign = self::getCampaignOrFail($campaignId);
        $processor = new HybridCampaignProcessor();
        $updated = $processor->startCampaign((int)$campaign['user_id'], $campaignId);

        Response::json(self::mapCampaign($updated));
    }

    public static function processPending(): void {
        Auth::userIdOrFail();
        $processor = new HybridCampaignProcessor();
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        $result = $processor->processPendingRuns($limit);

        Response::json(['result' => $result]);
    }

    private static function getCampaignOrFail(string $id): array {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM hybrid_campaigns WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$campaign) {
            Response::error('Campaign not found', 404);
            exit;
        }
        return $campaign;
    }

    private static function mapCampaign(array $campaign): array {
        return [
            'id' => $campaign['id'],
            'name' => $campaign['name'],
            'description' => $campaign['description'] ?? null,
            'status' => $campaign['status'],
            'entry_channel' => $campaign['entry_channel'],
            'follow_up_mode' => $campaign['follow_up_mode'],
            'audience_source' => $campaign['audience_source'],
            'audience_payload' => self::decodeJson($campaign['audience_payload'] ?? null),
            'created_at' => $campaign['created_at'],
            'updated_at' => $campaign['updated_at']
        ];
    }

    private static function mapStep(array $step): array {
        return [
            'id' => $step['id'],
            'campaign_id' => $step['campaign_id'],
            'step_order' => (int)$step['step_order'],
            'channel' => $step['channel'],
            'subject' => $step['subject'],
            'content' => $step['content'],
            'delay_days' => (int)$step['delay_days'],
            'delay_hours' => (int)$step['delay_hours'],
            'metadata' => self::decodeJson($step['metadata'] ?? null),
            'created_at' => $step['created_at'],
            'updated_at' => $step['updated_at']
        ];
    }

    private static function normalizeStatus(string $status): string {
        $status = strtolower($status);
        return in_array($status, self::ALLOWED_STATUS, true) ? $status : 'draft';
    }

    private static function normalizeEntryChannel(string $channel): string {
        $channel = strtolower($channel);
        return in_array($channel, self::ALLOWED_ENTRY_CHANNELS, true) ? $channel : 'email';
    }

    private static function normalizeFollowUpMode(string $mode): string {
        $mode = strtolower($mode);
        return in_array($mode, self::ALLOWED_FOLLOW_UP_MODES, true) ? $mode : 'hybrid';
    }

    private static function normalizeAudienceSource(string $source): string {
        $source = strtolower($source);
        return in_array($source, self::ALLOWED_AUDIENCE_SOURCES, true) ? $source : 'contacts';
    }

    private static function normalizeStepChannel(?string $channel): string {
        $channel = strtolower((string)$channel);
        if (!in_array($channel, self::ALLOWED_STEP_CHANNELS, true)) {
            throw new InvalidArgumentException('Invalid step channel: ' . $channel);
        }
        return $channel;
    }

    private static function encodeJson($value): ?string {
        if ($value === null) {
            return null;
        }
        if (is_string($value)) {
            return $value;
        }
        return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private static function decodeJson(?string $value) {
        if ($value === null || $value === '') {
            return null;
        }
        $decoded = json_decode($value, true);
        return $decoded === null ? null : $decoded;
    }

    private static function generateId(): string {
        return bin2hex(random_bytes(16));
    }
}
