<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/SimpleMail.php';
require_once __DIR__ . '/SMSService.php';
require_once __DIR__ . '/CallService.php';

class HybridCampaignProcessor
{
    private PDO $db;
    private array $maxStepCache = [];

    public function __construct()
    {
        $this->db = Database::conn();
    }

    public function addContacts(int $userId, string $campaignId, array $contacts): array
    {
        $campaign = $this->getCampaign($campaignId, $userId);
        if (empty($contacts)) {
            throw new InvalidArgumentException('Contacts payload cannot be empty');
        }

        $inserted = [];
        foreach ($contacts as $contactData) {
            $contactId = $this->generateId();
            $stmt = $this->db->prepare(" 
                INSERT INTO hybrid_campaign_contacts (
                    id, user_id, campaign_id, first_name, last_name, email, phone, company,
                    status, metadata, last_step_order, created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
            ");
            $metadata = !empty($contactData['metadata']) ? json_encode($contactData['metadata']) : null;
            $stmt->execute([
                $contactId,
                $userId,
                $campaignId,
                $contactData['first_name'] ?? $contactData['firstName'] ?? null,
                $contactData['last_name'] ?? $contactData['lastName'] ?? null,
                $contactData['email'] ?? null,
                $contactData['phone'] ?? $contactData['phone_number'] ?? null,
                $contactData['company'] ?? null,
                $metadata
            ]);

            $inserted[] = $contactId;

            if ($campaign['status'] === 'active') {
                $this->scheduleStepsForContact($campaign, $contactId);
            }
        }

        return $inserted;
    }

    public function startCampaign(int $userId, string $campaignId): array
    {
        $campaign = $this->getCampaign($campaignId, $userId);
        if ($campaign['status'] === 'active') {
            return $campaign;
        }

        $stmt = $this->db->prepare("UPDATE hybrid_campaigns SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?");
        $stmt->execute([$campaignId, $userId]);

        $contacts = $this->db->prepare("SELECT id FROM hybrid_campaign_contacts WHERE campaign_id = ? AND (status = 'pending' OR status = 'paused')");
        $contacts->execute([$campaignId]);
        foreach ($contacts->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $this->scheduleStepsForContact($campaign, $row['id']);
        }

        return $this->getCampaign($campaignId, $userId);
    }

    public function processPendingRuns(int $limit = 100): array
    {
        $stmt = $this->db->prepare(" 
            SELECT r.*, 
                   s.channel AS step_channel, s.subject AS step_subject, s.content AS step_content, s.metadata AS step_metadata,
                   c.user_id AS campaign_user_id,
                   contact.first_name AS contact_first_name, contact.last_name AS contact_last_name,
                   contact.email AS contact_email, contact.phone AS contact_phone, contact.company AS contact_company,
                   contact.metadata AS contact_metadata,
                   contact.id AS hybrid_contact_id,
                   c.name AS campaign_name
            FROM hybrid_campaign_step_runs r
            JOIN hybrid_campaign_steps s ON r.step_id = s.id
            JOIN hybrid_campaigns c ON r.campaign_id = c.id
            JOIN hybrid_campaign_contacts contact ON r.contact_id = contact.id
            WHERE r.status IN ('pending','queued') AND r.scheduled_at <= NOW()
            ORDER BY r.scheduled_at ASC
            LIMIT :limit
        ");
        $stmt->bindValue(':limit', max(1, min($limit, 500)), PDO::PARAM_INT);
        $stmt->execute();
        $runs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $processed = 0;
        $failed = 0;

        foreach ($runs as $run) {
            try {
                $this->executeRun($run);
                $processed++;
            } catch (Throwable $e) {
                $failed++;
                $this->markRunFailed($run['id'], $e->getMessage());
            }
        }

        return [
            'processed' => $processed,
            'failed' => $failed,
            'total' => count($runs)
        ];
    }

    public function getCampaignContacts(int $userId, string $campaignId): array
    {
        $this->getCampaign($campaignId, $userId);
        $stmt = $this->db->prepare('SELECT * FROM hybrid_campaign_contacts WHERE campaign_id = ? ORDER BY created_at DESC');
        $stmt->execute([$campaignId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    private function executeRun(array $run): void
    {
        $this->db->prepare("UPDATE hybrid_campaign_step_runs SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            ->execute([$run['id']]);

        $campaignUserId = (int)$run['campaign_user_id'];
        $contact = [
            'id' => $run['contact_id'],
            'first_name' => $run['contact_first_name'],
            'last_name' => $run['contact_last_name'],
            'email' => $run['contact_email'],
            'phone' => $run['contact_phone'],
            'company' => $run['contact_company'],
            'metadata' => $this->decodeJson($run['contact_metadata'])
        ];

        $stepMetadata = $this->decodeJson($run['step_metadata']);
        $subject = $this->personalize($run['step_subject'], $contact);
        $content = $this->personalize($run['step_content'], $contact);

        $payload = null;
        switch ($run['step_channel']) {
            case 'email':
                $payload = $this->sendEmailStep($campaignUserId, $contact, $subject, $content, $stepMetadata);
                break;
            case 'sms':
                $payload = $this->sendSmsStep($campaignUserId, $contact, $content, $stepMetadata);
                break;
            case 'call':
                $payload = $this->sendCallStep($campaignUserId, $contact, $stepMetadata);
                break;
            default:
                throw new InvalidArgumentException('Unsupported channel: ' . $run['step_channel']);
        }

        $this->db->prepare(" 
            UPDATE hybrid_campaign_step_runs 
            SET status = 'sent', processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, channel_payload = :payload 
            WHERE id = :id
        ")->execute([
            ':payload' => $payload ? json_encode($payload) : null,
            ':id' => $run['id']
        ]);

        $this->updateContactProgress($run['campaign_id'], $run['contact_id'], (int)$run['step_order']);
    }

    private function sendEmailStep(int $userId, array $contact, ?string $subject, string $content, ?array $metadata): array
    {
        if (empty($contact['email'])) {
            throw new Exception('Contact email missing for email step');
        }

        $accountId = $metadata['sending_account_id'] ?? null;
        if (!$accountId) {
            throw new Exception('sending_account_id missing in email step metadata');
        }

        $account = $this->fetchSendingAccount($userId, $accountId);
        if (!$account) {
            throw new Exception('Sending account not found');
        }

        $mail = new SimpleMail();
        $mail->sendEmail($account, $contact['email'], $subject ?? 'Follow up', $content);

        return ['type' => 'email', 'sending_account_id' => $accountId];
    }

    private function sendSmsStep(int $userId, array $contact, string $content, ?array $metadata): array
    {
        if (empty($contact['phone'])) {
            throw new Exception('Contact phone missing for SMS step');
        }

        $from = $metadata['from_number'] ?? null;
        $sms = new SMSService(null, (string)$userId);
        $sms->sendMessage($contact['phone'], $content, $from);

        return ['type' => 'sms', 'from' => $from];
    }

    private function sendCallStep(int $userId, array $contact, ?array $metadata): array
    {
        if (empty($contact['phone'])) {
            throw new Exception('Contact phone missing for call step');
        }

        $from = $metadata['caller_id'] ?? null;
        $webhook = $metadata['webhook_url'] ?? null;
        $call = new CallService(null, (string)$userId);
        $result = $call->makeCall($contact['phone'], $from, $webhook);

        return ['type' => 'call', 'result' => $result];
    }

    private function scheduleStepsForContact(array $campaign, string $contactId): void
    {
        $steps = $this->getCampaignSteps($campaign['id']);
        if (empty($steps)) {
            return;
        }

        $baseTime = new DateTimeImmutable('now');
        $stmt = $this->db->prepare(" 
            INSERT IGNORE INTO hybrid_campaign_step_runs (
                id, user_id, campaign_id, contact_id, step_id, step_order, status, scheduled_at, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
        ");

        $currentTime = $baseTime;
        foreach ($steps as $step) {
            $delayDays = max(0, (int)($step['delay_days'] ?? 0));
            $delayHours = max(0, (int)($step['delay_hours'] ?? 0));
            $interval = new DateInterval(sprintf('P%dDT%dH', $delayDays, $delayHours));
            $currentTime = $currentTime->add($interval);

            $stmt->execute([
                $this->generateId(),
                $campaign['user_id'],
                $campaign['id'],
                $contactId,
                $step['id'],
                $step['step_order'],
                'pending',
                $currentTime->format('Y-m-d H:i:s')
            ]);
        }

        $this->db->prepare("UPDATE hybrid_campaign_contacts SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
            ->execute([$contactId]);
    }

    private function updateContactProgress(string $campaignId, string $contactId, int $stepOrder): void
    {
        $maxOrder = $this->getMaxStepOrder($campaignId);
        $status = $stepOrder >= $maxOrder ? 'completed' : 'in_progress';

        $stmt = $this->db->prepare("UPDATE hybrid_campaign_contacts SET status = ?, last_step_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$status, $stepOrder, $contactId]);
    }

    private function getMaxStepOrder(string $campaignId): int
    {
        if (!isset($this->maxStepCache[$campaignId])) {
            $stmt = $this->db->prepare("SELECT MAX(step_order) AS max_order FROM hybrid_campaign_steps WHERE campaign_id = ?");
            $stmt->execute([$campaignId]);
            $value = (int)($stmt->fetchColumn() ?: 0);
            $this->maxStepCache[$campaignId] = $value;
        }
        return $this->maxStepCache[$campaignId];
    }

    private function getCampaign(string $campaignId, int $userId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM hybrid_campaigns WHERE id = ? AND user_id = ?");
        $stmt->execute([$campaignId, $userId]);
        $campaign = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$campaign) {
            throw new Exception('Campaign not found');
        }
        return $campaign;
    }

    private function getCampaignSteps(string $campaignId): array
    {
        $stmt = $this->db->prepare("SELECT * FROM hybrid_campaign_steps WHERE campaign_id = ? ORDER BY step_order ASC");
        $stmt->execute([$campaignId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    private function fetchSendingAccount(int $userId, int $accountId): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM sending_accounts WHERE id = ? AND user_id = ?");
        $stmt->execute([$accountId, $userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    private function personalize(?string $template, array $contact): string
    {
        if ($template === null) {
            return '';
        }

        $replacements = [
            '{{firstName}}' => $contact['first_name'] ?? '',
            '{{lastName}}' => $contact['last_name'] ?? '',
            '{{fullName}}' => trim(($contact['first_name'] ?? '') . ' ' . ($contact['last_name'] ?? '')),
            '{{company}}' => $contact['company'] ?? '',
            '{{email}}' => $contact['email'] ?? '',
            '{{phone}}' => $contact['phone'] ?? ''
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }

    private function markRunFailed(string $runId, string $error): void
    {
        $stmt = $this->db->prepare("UPDATE hybrid_campaign_step_runs SET status = 'failed', error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$error, $runId]);
    }

    private function decodeJson(?string $value): ?array
    {
        if (!$value) {
            return null;
        }
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : null;
    }

    private function generateId(): string
    {
        return bin2hex(random_bytes(16));
    }
}
