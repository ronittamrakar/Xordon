<?php

require_once __DIR__ . '/../Database.php';

class HunterService {
    private $apiKey;
    private $baseUrl = 'https://api.hunter.io/v2';
    private $pdo;

    public function __construct() {
        $this->apiKey = $_ENV['HUNTER_API_KEY'] ?? null;
        $this->pdo = Database::conn();
    }

    /**
     * Find email addresses for a given domain
     */
    public function domainSearch(string $domain, int $limit = 10, int $offset = 0): array {
        if (!$this->apiKey) {
            throw new Exception('Hunter.io API key not configured');
        }

        $url = $this->baseUrl . '/domain-search?' . http_build_query([
            'domain' => $domain,
            'api_key' => $this->apiKey,
            'limit' => $limit,
            'offset' => $offset
        ]);

        $response = $this->makeRequest($url);
        
        if (!$response || !isset($response['data'])) {
            throw new Exception('Invalid response from Hunter.io API');
        }

        return [
            'domain' => $response['data']['domain'] ?? $domain,
            'organization' => $response['data']['organization'] ?? null,
            'emails' => $response['data']['emails'] ?? [],
            'meta' => [
                'results' => $response['data']['meta']['results'] ?? 0,
                'limit' => $response['data']['meta']['limit'] ?? $limit,
                'offset' => $response['data']['meta']['offset'] ?? $offset
            ]
        ];
    }

    /**
     * Find email address for a specific person and domain
     */
    public function emailFinder(string $domain, string $firstName = null, string $lastName = null, string $fullName = null): array {
        if (!$this->apiKey) {
            throw new Exception('Hunter.io API key not configured');
        }

        $params = [
            'domain' => $domain,
            'api_key' => $this->apiKey
        ];

        if ($firstName) $params['first_name'] = $firstName;
        if ($lastName) $params['last_name'] = $lastName;
        if ($fullName) $params['full_name'] = $fullName;

        $url = $this->baseUrl . '/email-finder?' . http_build_query($params);
        $response = $this->makeRequest($url);

        if (!$response || !isset($response['data'])) {
            throw new Exception('Invalid response from Hunter.io API');
        }

        return [
            'email' => $response['data']['email'] ?? null,
            'score' => $response['data']['score'] ?? 0,
            'first_name' => $response['data']['first_name'] ?? $firstName,
            'last_name' => $response['data']['last_name'] ?? $lastName,
            'position' => $response['data']['position'] ?? null,
            'twitter' => $response['data']['twitter'] ?? null,
            'linkedin_url' => $response['data']['linkedin_url'] ?? null,
            'phone_number' => $response['data']['phone_number'] ?? null,
            'company' => $response['data']['company'] ?? null
        ];
    }

    /**
     * Verify an email address
     */
    public function emailVerifier(string $email): array {
        if (!$this->apiKey) {
            throw new Exception('Hunter.io API key not configured');
        }

        $url = $this->baseUrl . '/email-verifier?' . http_build_query([
            'email' => $email,
            'api_key' => $this->apiKey
        ]);

        $response = $this->makeRequest($url);

        if (!$response || !isset($response['data'])) {
            throw new Exception('Invalid response from Hunter.io API');
        }

        return [
            'email' => $response['data']['email'] ?? $email,
            'result' => $response['data']['result'] ?? 'unknown',
            'score' => $response['data']['score'] ?? 0,
            'regexp' => $response['data']['regexp'] ?? false,
            'gibberish' => $response['data']['gibberish'] ?? false,
            'disposable' => $response['data']['disposable'] ?? false,
            'webmail' => $response['data']['webmail'] ?? false,
            'mx_records' => $response['data']['mx_records'] ?? false,
            'smtp_server' => $response['data']['smtp_server'] ?? false,
            'smtp_check' => $response['data']['smtp_check'] ?? false,
            'accept_all' => $response['data']['accept_all'] ?? false,
            'block' => $response['data']['block'] ?? false
        ];
    }

    /**
     * Get account information and usage
     */
    public function getAccountInfo(): array {
        if (!$this->apiKey) {
            throw new Exception('Hunter.io API key not configured');
        }

        $url = $this->baseUrl . '/account?' . http_build_query([
            'api_key' => $this->apiKey
        ]);

        $response = $this->makeRequest($url);

        if (!$response || !isset($response['data'])) {
            throw new Exception('Invalid response from Hunter.io API');
        }

        return [
            'first_name' => $response['data']['first_name'] ?? null,
            'last_name' => $response['data']['last_name'] ?? null,
            'email' => $response['data']['email'] ?? null,
            'plan_name' => $response['data']['plan_name'] ?? null,
            'plan_level' => $response['data']['plan_level'] ?? 0,
            'reset_date' => $response['data']['reset_date'] ?? null,
            'calls' => [
                'used' => $response['data']['calls']['used'] ?? 0,
                'available' => $response['data']['calls']['available'] ?? 0
            ]
        ];
    }

    /**
     * Bulk email verification
     */
    public function bulkEmailVerifier(array $emails): array {
        if (!$this->apiKey) {
            throw new Exception('Hunter.io API key not configured');
        }

        // Hunter.io bulk verification requires creating a list first
        $listResponse = $this->createVerificationList($emails);
        
        if (!$listResponse || !isset($listResponse['data']['id'])) {
            throw new Exception('Failed to create verification list');
        }

        $listId = $listResponse['data']['id'];
        
        // Poll for results (in a real implementation, you might want to do this asynchronously)
        $maxAttempts = 30;
        $attempts = 0;
        
        while ($attempts < $maxAttempts) {
            sleep(2); // Wait 2 seconds between checks
            $results = $this->getVerificationList($listId);
            
            if ($results && isset($results['data']['results'])) {
                return [
                    'list_id' => $listId,
                    'status' => $results['data']['status'] ?? 'processing',
                    'results' => $results['data']['results'] ?? []
                ];
            }
            
            $attempts++;
        }

        throw new Exception('Bulk verification timeout');
    }

    /**
     * Create a verification list for bulk operations
     */
    private function createVerificationList(array $emails): ?array {
        $url = $this->baseUrl . '/email-verifier/bulk';
        
        $data = [
            'api_key' => $this->apiKey,
            'emails' => $emails
        ];

        return $this->makeRequest($url, 'POST', $data);
    }

    /**
     * Get verification list results
     */
    private function getVerificationList(int $listId): ?array {
        $url = $this->baseUrl . '/email-verifier/bulk/' . $listId . '?' . http_build_query([
            'api_key' => $this->apiKey
        ]);

        return $this->makeRequest($url);
    }

    /**
     * Make HTTP request to Hunter.io API
     */
    private function makeRequest(string $url, string $method = 'GET', array $data = null): ?array {
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_USERAGENT => 'Xordon/1.0',
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Content-Type: application/json'
            ]
        ]);

        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log("Hunter.io API cURL error: " . $error);
            return null;
        }

        if ($httpCode !== 200) {
            error_log("Hunter.io API HTTP error: " . $httpCode . " - " . $response);
            return null;
        }

        $decoded = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("Hunter.io API JSON decode error: " . json_last_error_msg());
            return null;
        }

        return $decoded;
    }

    /**
     * Save found emails to database as recipients
     */
    public function saveEmailsAsRecipients(array $emails, int $userId, int $campaignId = null): array {
        $saved = 0;
        $skipped = 0;
        $errors = [];

        foreach ($emails as $emailData) {
            try {
                $email = is_array($emailData) ? $emailData['value'] : $emailData;
                $firstName = is_array($emailData) ? ($emailData['first_name'] ?? '') : '';
                $lastName = is_array($emailData) ? ($emailData['last_name'] ?? '') : '';
                $position = is_array($emailData) ? ($emailData['position'] ?? '') : '';
                $company = is_array($emailData) ? ($emailData['company'] ?? '') : '';

                // Check if email already exists for this user/campaign
                $checkStmt = $this->pdo->prepare('SELECT id FROM recipients WHERE email = ? AND (campaign_id = ? OR campaign_id IS NULL)');
                $checkStmt->execute([$email, $campaignId]);
                
                if ($checkStmt->fetch()) {
                    $skipped++;
                    continue;
                }

                // Generate tracking token
                $trackToken = bin2hex(random_bytes(16));

                // Insert recipient
                $stmt = $this->pdo->prepare('
                    INSERT INTO recipients (campaign_id, email, first_name, last_name, position, company, track_token, status, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, "pending", CURRENT_TIMESTAMP)
                ');
                
                $stmt->execute([
                    $campaignId,
                    $email,
                    $firstName,
                    $lastName,
                    $position,
                    $company,
                    $trackToken
                ]);

                $saved++;

            } catch (Exception $e) {
                $errors[] = "Failed to save {$email}: " . $e->getMessage();
            }
        }

        return [
            'saved' => $saved,
            'skipped' => $skipped,
            'errors' => $errors
        ];
    }
}
?>