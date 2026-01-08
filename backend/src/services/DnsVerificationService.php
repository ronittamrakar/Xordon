<?php

require_once __DIR__ . '/../Database.php';

class DnsVerificationService {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = Database::conn();
    }

    /**
     * Perform SPF/DKIM/DMARC checks for a domain and persist results.
     */
    public function checkDomain(int $userId, string $domain, array $options = []): array {
        $domain = $this->sanitizeDomain($domain);
        if (!$domain) {
            throw new InvalidArgumentException('Domain is required');
        }

        $selector = $options['dkim_selector'] ?? 'default';

        $spf = $this->lookupSpf($domain);
        $dkim = $this->lookupDkim($domain, $selector);
        $dmarc = $this->lookupDmarc($domain);

        $result = [
            'domain' => $domain,
            'spf' => $spf,
            'dkim' => $dkim,
            'dmarc' => $dmarc,
            'issues' => array_values(array_filter(array_merge($spf['issues'], $dkim['issues'], $dmarc['issues'])))
        ];

        $this->storeResult($userId, $result);
        $this->updateSendingAccounts($userId, $domain, $result);

        return $result;
    }

    private function lookupSpf(string $domain): array {
        $record = $this->fetchTxtRecord($domain, function (array $txt) {
            return stripos($txt, 'v=spf1') === 0;
        });

        if (!$record) {
            return [
                'status' => 'missing',
                'record' => null,
                'issues' => ['SPF record not found for domain']
            ];
        }

        $issues = [];
        if (!str_contains($record, '-all') && !str_contains($record, '~all')) {
            $issues[] = 'SPF record should end with -all or ~all';
        }

        return [
            'status' => empty($issues) ? 'valid' : 'warning',
            'record' => $record,
            'issues' => $issues,
        ];
    }

    private function lookupDkim(string $domain, string $selector): array {
        $selector = trim($selector) ?: 'default';
        $recordDomain = $selector . '._domainkey.' . $domain;
        $record = $this->fetchTxtRecord($recordDomain, function (array $txt) {
            return stripos($txt, 'v=DKIM1') === 0;
        });

        if (!$record) {
            return [
                'status' => 'missing',
                'selector' => $selector,
                'record' => null,
                'issues' => ["DKIM record not found for selector '{$selector}'"],
            ];
        }

        $issues = [];
        if (!str_contains($record, 'p=')) {
            $issues[] = 'DKIM record missing public key (p=) value';
        }

        return [
            'status' => empty($issues) ? 'valid' : 'warning',
            'selector' => $selector,
            'record' => $record,
            'issues' => $issues,
        ];
    }

    private function lookupDmarc(string $domain): array {
        $recordDomain = '_dmarc.' . $domain;
        $record = $this->fetchTxtRecord($recordDomain, function (array $txt) {
            return stripos($txt, 'v=DMARC1') === 0;
        });

        if (!$record) {
            return [
                'status' => 'missing',
                'record' => null,
                'issues' => ['DMARC record not found for domain'],
                'policy' => null,
            ];
        }

        $policy = $this->extractTag($record, 'p');
        $issues = [];
        if (!$policy) {
            $issues[] = 'DMARC policy (p=) is missing';
        } elseif (!in_array($policy, ['none', 'quarantine', 'reject'], true)) {
            $issues[] = 'DMARC policy should be none, quarantine, or reject';
        }

        return [
            'status' => empty($issues) ? 'valid' : 'warning',
            'policy' => $policy,
            'record' => $record,
            'issues' => $issues,
        ];
    }

    private function fetchTxtRecord(string $domain, callable $filter): ?string {
        if (!function_exists('dns_get_record')) {
            return null;
        }
        $records = @dns_get_record($domain, DNS_TXT) ?: [];
        foreach ($records as $record) {
            if (!empty($record['txt']) && $filter($record['txt'])) {
                return is_array($record['txt']) ? implode('', $record['txt']) : $record['txt'];
            }
        }
        return null;
    }

    private function extractTag(string $record, string $tag): ?string {
        $pattern = sprintf('/%s=([^;]+)/i', preg_quote($tag, '/'));
        if (preg_match($pattern, $record, $matches)) {
            return trim($matches[1]);
        }
        return null;
    }

    private function storeResult(int $userId, array $result): void {
        $existing = $this->pdo->prepare('SELECT id FROM dns_checks WHERE user_id = :user_id AND domain = :domain LIMIT 1');
        $existing->execute([
            'user_id' => $userId,
            'domain' => $result['domain'],
        ]);
        $row = $existing->fetch(PDO::FETCH_ASSOC);

        $payload = [
            'user_id' => $userId,
            'domain' => $result['domain'],
            'spf_record' => $result['spf']['record'] ?? null,
            'spf_status' => $result['spf']['status'] ?? 'unknown',
            'dkim_selector' => $result['dkim']['selector'] ?? null,
            'dkim_record' => $result['dkim']['record'] ?? null,
            'dkim_status' => $result['dkim']['status'] ?? 'unknown',
            'dmarc_record' => $result['dmarc']['record'] ?? null,
            'dmarc_policy' => $result['dmarc']['policy'] ?? null,
            'dmarc_status' => $result['dmarc']['status'] ?? 'unknown',
            'issues' => empty($result['issues']) ? null : json_encode($result['issues']),
        ];

        if ($row) {
            $sql = 'UPDATE dns_checks SET
                spf_record = :spf_record,
                spf_status = :spf_status,
                dkim_selector = :dkim_selector,
                dkim_record = :dkim_record,
                dkim_status = :dkim_status,
                dmarc_record = :dmarc_record,
                dmarc_policy = :dmarc_policy,
                dmarc_status = :dmarc_status,
                issues = :issues,
                checked_at = CURRENT_TIMESTAMP
            WHERE id = :id';
            $payload['id'] = $row['id'];
        } else {
            $sql = 'INSERT INTO dns_checks (
                user_id, domain, spf_record, spf_status, dkim_selector, dkim_record,
                dkim_status, dmarc_record, dmarc_policy, dmarc_status, issues, checked_at
            ) VALUES (
                :user_id, :domain, :spf_record, :spf_status, :dkim_selector, :dkim_record,
                :dkim_status, :dmarc_record, :dmarc_policy, :dmarc_status, :issues, CURRENT_TIMESTAMP
            )';
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($payload);
    }

    private function updateSendingAccounts(int $userId, string $domain, array $result): void {
        $stmt = $this->pdo->prepare('SELECT id, email, domain FROM sending_accounts WHERE user_id = :user_id');
        $stmt->execute(['user_id' => $userId]);
        $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($accounts)) {
            return;
        }

        $update = $this->pdo->prepare('
            UPDATE sending_accounts SET
                domain = COALESCE(domain, :domain),
                spf_status = :spf_status,
                dkim_status = :dkim_status,
                dmarc_status = :dmarc_status,
                last_dns_check_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ');

        foreach ($accounts as $account) {
            $accountDomain = $this->sanitizeDomain($account['domain'] ?? $this->inferDomainFromEmail($account['email'] ?? ''));
            if ($accountDomain !== $domain) {
                continue;
            }

            $update->execute([
                'domain' => $domain,
                'spf_status' => $result['spf']['status'] ?? 'unknown',
                'dkim_status' => $result['dkim']['status'] ?? 'unknown',
                'dmarc_status' => $result['dmarc']['status'] ?? 'unknown',
                'id' => $account['id'],
            ]);
        }
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

    private function inferDomainFromEmail(?string $email): ?string {
        if (!$email || strpos($email, '@') === false) {
            return null;
        }
        return $this->sanitizeDomain(substr(strrchr($email, '@'), 1));
    }
}
