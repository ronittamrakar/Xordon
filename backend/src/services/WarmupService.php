<?php

require_once __DIR__ . '/../Database.php';

class WarmupService {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::conn();
    }

    public function getAccountSummary(int $userId): array {
        $sql = "
            SELECT
                sa.*,
                wp.id AS profile_id,
                wp.domain AS profile_domain,
                wp.start_volume,
                wp.ramp_increment,
                wp.ramp_interval_days,
                wp.target_volume,
                wp.maintenance_volume,
                wp.pause_on_issue,
                wp.status AS profile_status,
                wp.created_at AS profile_created_at,
                wr.run_date AS last_run_date,
                wr.planned_volume AS last_planned_volume,
                wr.sent_volume AS last_sent_volume,
                wr.inbox_hits AS last_inbox_hits,
                wr.spam_hits AS last_spam_hits,
                wr.replies AS last_replies,
                wr.status AS last_run_status,
                wr.last_error AS last_run_error
            FROM sending_accounts sa
            LEFT JOIN warmup_profiles wp ON wp.sending_account_id = sa.id
            LEFT JOIN (
                SELECT wr1.*
                FROM warmup_runs wr1
                INNER JOIN (
                    SELECT sending_account_id, MAX(run_date) AS max_date
                    FROM warmup_runs
                    GROUP BY sending_account_id
                ) latest ON latest.sending_account_id = wr1.sending_account_id AND latest.max_date = wr1.run_date
            ) wr ON wr.sending_account_id = sa.id
            WHERE sa.user_id = :user_id
            ORDER BY sa.created_at DESC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['user_id' => $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(fn(array $row) => $this->formatAccountRow($row), $rows);
    }

    public function upsertProfile(int $userId, array $payload): array {
        $accountId = (int)($payload['sending_account_id'] ?? 0);
        if ($accountId <= 0) {
            throw new InvalidArgumentException('Missing sending_account_id');
        }

        $account = $this->findAccount($userId, $accountId);
        if (!$account) {
            throw new InvalidArgumentException('Sending account not found');
        }

        $existing = $this->findProfileByAccount($accountId);
        if ($existing) {
            return $this->updateProfile($userId, (int)$existing['id'], $payload);
        }

        $domain = $this->sanitizeDomain($payload['domain'] ?? ($account['domain'] ?? $this->inferDomainFromEmail($account['email'])));
        if (!$domain) {
            throw new InvalidArgumentException('Domain is required for warmup');
        }

        $data = $this->normalizeProfilePayload($payload);
        $insert = $this->pdo->prepare('
            INSERT INTO warmup_profiles (
                user_id, sending_account_id, domain, start_volume, ramp_increment,
                ramp_interval_days, target_volume, maintenance_volume, pause_on_issue, status,
                created_at, updated_at
            ) VALUES (
                :user_id, :sending_account_id, :domain, :start_volume, :ramp_increment,
                :ramp_interval_days, :target_volume, :maintenance_volume, :pause_on_issue, :status,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
        ');

        $insert->execute([
            'user_id' => $userId,
            'sending_account_id' => $accountId,
            'domain' => $domain,
            'start_volume' => $data['start_volume'],
            'ramp_increment' => $data['ramp_increment'],
            'ramp_interval_days' => $data['ramp_interval_days'],
            'target_volume' => $data['target_volume'],
            'maintenance_volume' => $data['maintenance_volume'],
            'pause_on_issue' => $data['pause_on_issue'],
            'status' => 'active',
        ]);

        $this->updateAccountWarmupMetadata($accountId, [
            'domain' => $domain,
            'warmup_daily_limit' => $payload['warmup_daily_limit'] ?? $account['warmup_daily_limit'] ?? $data['target_volume'],
            'warmup_status' => 'active',
            'warmup_paused_reason' => null,
        ]);

        return $this->getProfile($userId, (int)$this->pdo->lastInsertId());
    }

    public function updateProfile(int $userId, int $profileId, array $payload): array {
        $profile = $this->getProfile($userId, $profileId);
        if (!$profile) {
            throw new InvalidArgumentException('Warmup profile not found');
        }

        $data = $this->normalizeProfilePayload($payload, $profile);
        $updates = [];
        $params = ['id' => $profileId];
        foreach (['domain','start_volume','ramp_increment','ramp_interval_days','target_volume','maintenance_volume','pause_on_issue'] as $field) {
            if ($data[$field] !== null) {
                $updates[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }

        if (!empty($updates)) {
            $sql = 'UPDATE warmup_profiles SET ' . implode(', ', $updates) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id';
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        }

        if (!empty($payload['domain'])) {
            $this->updateAccountWarmupMetadata((int)$profile['sending_account_id'], ['domain' => $this->sanitizeDomain($payload['domain'])]);
        }
        if (isset($payload['warmup_daily_limit'])) {
            $this->updateAccountWarmupMetadata((int)$profile['sending_account_id'], [
                'warmup_daily_limit' => (int)$payload['warmup_daily_limit'],
            ]);
        }

        return $this->getProfile($userId, $profileId);
    }

    public function setPauseStatus(int $userId, int $profileId, bool $paused, ?string $reason = null): array {
        $profile = $this->getProfile($userId, $profileId);
        if (!$profile) {
            throw new InvalidArgumentException('Warmup profile not found');
        }

        $status = $paused ? 'paused' : 'active';
        $stmt = $this->pdo->prepare('UPDATE warmup_profiles SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
        $stmt->execute(['status' => $status, 'id' => $profileId]);

        $this->updateAccountWarmupMetadata((int)$profile['sending_account_id'], [
            'warmup_status' => $paused ? 'paused' : 'active',
            'warmup_paused_reason' => $paused ? ($reason ?: 'Paused manually') : null,
        ]);

        return $this->getProfile($userId, $profileId);
    }

    public function scheduleDailyRuns(int $userId, ?string $day = null): int {
        $day = $day ? date('Y-m-d', strtotime($day)) : date('Y-m-d');
        $profiles = $this->getActiveProfiles($userId);
        if (empty($profiles)) {
            return 0;
        }

        $created = 0;
        $checkStmt = $this->pdo->prepare('SELECT id FROM warmup_runs WHERE sending_account_id = :account_id AND run_date = :run_date LIMIT 1');
        $lastRunStmt = $this->pdo->prepare('
            SELECT planned_volume, sent_volume, run_date
            FROM warmup_runs
            WHERE sending_account_id = :account_id AND run_date < :run_date
            ORDER BY run_date DESC
            LIMIT 1
        ');
        $insertStmt = $this->pdo->prepare('
            INSERT INTO warmup_runs (
                profile_id, sending_account_id, run_date, planned_volume, status,
                created_at, updated_at
            ) VALUES (
                :profile_id, :sending_account_id, :run_date, :planned_volume, :status,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
        ');

        foreach ($profiles as $profile) {
            $checkStmt->execute([
                'account_id' => $profile['sending_account_id'],
                'run_date' => $day,
            ]);
            if ($checkStmt->fetch()) {
                continue;
            }

            $lastRunStmt->execute([
                'account_id' => $profile['sending_account_id'],
                'run_date' => $day,
            ]);
            $lastRun = $lastRunStmt->fetch(PDO::FETCH_ASSOC) ?: null;
            $planned = $this->calculatePlannedVolume($profile, $lastRun);

            $insertStmt->execute([
                'profile_id' => $profile['id'],
                'sending_account_id' => $profile['sending_account_id'],
                'run_date' => $day,
                'planned_volume' => $planned,
                'status' => 'scheduled',
            ]);

            $this->updateAccountWarmupMetadata($profile['sending_account_id'], [
                'warmup_next_run' => $day,
                'warmup_status' => 'scheduled',
            ]);
            $created++;
        }

        return $created;
    }

    public function getProfile(int $userId, int $profileId): ?array {
        $stmt = $this->pdo->prepare('
            SELECT wp.*, sa.email AS account_email
            FROM warmup_profiles wp
            JOIN sending_accounts sa ON sa.id = wp.sending_account_id
            WHERE wp.id = :id AND wp.user_id = :user_id
        ');
        $stmt->execute(['id' => $profileId, 'user_id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    private function findAccount(int $userId, int $accountId): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM sending_accounts WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $accountId, 'user_id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    private function findProfileByAccount(int $accountId): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM warmup_profiles WHERE sending_account_id = :id LIMIT 1');
        $stmt->execute(['id' => $accountId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    private function getActiveProfiles(int $userId): array {
        $stmt = $this->pdo->prepare('
            SELECT wp.*, sa.warmup_daily_limit, sa.id AS sending_account_id
            FROM warmup_profiles wp
            JOIN sending_accounts sa ON sa.id = wp.sending_account_id AND sa.user_id = :user_id
            WHERE wp.user_id = :user_id AND wp.status = "active"
        ');
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function calculatePlannedVolume(array $profile, ?array $lastRun): int {
        $planned = (int)($profile['start_volume'] ?? 10);
        if ($lastRun) {
            $lastSent = (int)($lastRun['sent_volume'] ?? 0);
            $lastPlanned = (int)($lastRun['planned_volume'] ?? $lastSent);
            if ($lastSent >= (int)$profile['target_volume']) {
                $planned = (int)$profile['maintenance_volume'];
            } else {
                $planned = min(
                    (int)$profile['target_volume'],
                    max($planned, $lastPlanned + (int)$profile['ramp_increment'])
                );
            }
        }

        if (!empty($profile['warmup_daily_limit'])) {
            $planned = min($planned, (int)$profile['warmup_daily_limit']);
        }

        return max(1, $planned);
    }

    private function normalizeProfilePayload(array $payload, ?array $existing = null): array {
        return [
            'domain' => isset($payload['domain']) ? $this->sanitizeDomain($payload['domain']) : ($existing['domain'] ?? null),
            'start_volume' => isset($payload['start_volume']) ? max(1, (int)$payload['start_volume']) : ($existing['start_volume'] ?? 10),
            'ramp_increment' => isset($payload['ramp_increment']) ? max(1, (int)$payload['ramp_increment']) : ($existing['ramp_increment'] ?? 5),
            'ramp_interval_days' => isset($payload['ramp_interval_days']) ? max(1, (int)$payload['ramp_interval_days']) : ($existing['ramp_interval_days'] ?? 3),
            'target_volume' => isset($payload['target_volume']) ? max(1, (int)$payload['target_volume']) : ($existing['target_volume'] ?? 150),
            'maintenance_volume' => isset($payload['maintenance_volume']) ? max(1, (int)$payload['maintenance_volume']) : ($existing['maintenance_volume'] ?? 20),
            'pause_on_issue' => isset($payload['pause_on_issue']) ? (int)!!$payload['pause_on_issue'] : ($existing['pause_on_issue'] ?? 1),
        ];
    }

    private function updateAccountWarmupMetadata(int $accountId, array $fields): void {
        $allowed = ['domain','warmup_daily_limit','warmup_status','warmup_next_run','warmup_last_run_at','warmup_paused_reason'];
        $set = [];
        $params = ['id' => $accountId];
        foreach ($fields as $key => $value) {
            if (in_array($key, $allowed, true)) {
                $set[] = "$key = :$key";
                $params[$key] = $value;
            }
        }
        if (empty($set)) {
            return;
        }
        $sql = 'UPDATE sending_accounts SET ' . implode(', ', $set) . ', updated_at = CURRENT_TIMESTAMP WHERE id = :id';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
    }

    private function formatAccountRow(array $row): array {
        $lastInbox = (int)($row['last_inbox_hits'] ?? 0);
        $lastSpam = (int)($row['last_spam_hits'] ?? 0);
        $deliverability = null;
        $total = $lastInbox + $lastSpam;
        if ($total > 0) {
            $deliverability = round(($lastInbox / $total) * 100, 2);
        }

        return [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'domain' => $row['domain'] ?? null,
            'status' => $row['status'],
            'warmup_status' => $row['warmup_status'] ?? 'idle',
            'warmup_daily_limit' => (int)($row['warmup_daily_limit'] ?? 0),
            'warmup_next_run' => $row['warmup_next_run'] ?? null,
            'warmup_last_run_at' => $row['warmup_last_run_at'] ?? null,
            'warmup_paused_reason' => $row['warmup_paused_reason'] ?? null,
            'deliverability_score' => (int)($row['deliverability_score'] ?? 100),
            'dns' => [
                'spf' => $row['spf_status'] ?? 'unknown',
                'dkim' => $row['dkim_status'] ?? 'unknown',
                'dmarc' => $row['dmarc_status'] ?? 'unknown',
                'last_checked_at' => $row['last_dns_check_at'] ?? null,
            ],
            'profile' => $row['profile_id'] ? [
                'id' => (int)$row['profile_id'],
                'domain' => $row['profile_domain'],
                'status' => $row['profile_status'],
                'start_volume' => (int)$row['start_volume'],
                'ramp_increment' => (int)$row['ramp_increment'],
                'ramp_interval_days' => (int)$row['ramp_interval_days'],
                'target_volume' => (int)$row['target_volume'],
                'maintenance_volume' => (int)$row['maintenance_volume'],
                'pause_on_issue' => (bool)$row['pause_on_issue'],
                'created_at' => $row['profile_created_at'],
            ] : null,
            'last_run' => $row['last_run_date'] ? [
                'date' => $row['last_run_date'],
                'planned_volume' => (int)$row['last_planned_volume'],
                'sent_volume' => (int)$row['last_sent_volume'],
                'inbox_hits' => $lastInbox,
                'spam_hits' => $lastSpam,
                'replies' => (int)($row['last_replies'] ?? 0),
                'status' => $row['last_run_status'],
                'error' => $row['last_run_error'],
                'deliverability_rate' => $deliverability,
            ] : null,
        ];
    }

    private function sanitizeDomain(?string $domain): ?string {
        if (!$domain) {
            return null;
        }
        $domain = trim(strtolower($domain));
        $domain = preg_replace('/^https?:\/\//', '', $domain);
        $domain = preg_replace('/^www\./', '', $domain);
        return $domain ?: null;
    }

    private function inferDomainFromEmail(string $email): ?string {
        if (strpos($email, '@') === false) {
            return null;
        }
        return $this->sanitizeDomain(substr(strrchr($email, '@'), 1));
    }
}
