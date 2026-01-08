<?php

require_once __DIR__ . '/../services/HunterService.php';
require_once __DIR__ . '/../Auth.php';

class HunterController {
    private $hunterService;

    public function __construct() {
        $this->hunterService = new HunterService();
    }

    /**
     * Search for emails in a domain
     * GET /api/hunter/domain-search?domain=example.com&limit=10&offset=0
     */
    public function domainSearch() {
        try {
            $userId = Auth::userIdOrFail();
            
            $domain = $_GET['domain'] ?? null;
            $limit = (int)($_GET['limit'] ?? 10);
            $offset = (int)($_GET['offset'] ?? 0);

            if (!$domain) {
                http_response_code(400);
                echo json_encode(['error' => 'Domain parameter is required']);
                return;
            }

            // Validate domain format
            if (!filter_var('http://' . $domain, FILTER_VALIDATE_URL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid domain format']);
                return;
            }

            $result = $this->hunterService->domainSearch($domain, $limit, $offset);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $result
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Find email for a specific person
     * POST /api/hunter/email-finder
     * Body: {"domain": "example.com", "first_name": "John", "last_name": "Doe"}
     */
    public function emailFinder() {
        try {
            $userId = Auth::userIdOrFail();
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            $domain = $input['domain'] ?? null;
            $firstName = $input['first_name'] ?? null;
            $lastName = $input['last_name'] ?? null;
            $fullName = $input['full_name'] ?? null;

            if (!$domain) {
                http_response_code(400);
                echo json_encode(['error' => 'Domain parameter is required']);
                return;
            }

            if (!$firstName && !$lastName && !$fullName) {
                http_response_code(400);
                echo json_encode(['error' => 'At least one name parameter is required']);
                return;
            }

            $result = $this->hunterService->emailFinder($domain, $firstName, $lastName, $fullName);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $result
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Verify an email address
     * POST /api/hunter/email-verifier
     * Body: {"email": "john@example.com"}
     */
    public function emailVerifier() {
        try {
            $userId = Auth::userIdOrFail();
            
            $input = json_decode(file_get_contents('php://input'), true);
            $email = $input['email'] ?? null;

            if (!$email) {
                http_response_code(400);
                echo json_encode(['error' => 'Email parameter is required']);
                return;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid email format']);
                return;
            }

            $result = $this->hunterService->emailVerifier($email);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $result
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Bulk email verification
     * POST /api/hunter/bulk-verifier
     * Body: {"emails": ["email1@example.com", "email2@example.com"]}
     */
    public function bulkEmailVerifier() {
        try {
            $userId = Auth::userIdOrFail();
            
            $input = json_decode(file_get_contents('php://input'), true);
            $emails = $input['emails'] ?? [];

            if (empty($emails) || !is_array($emails)) {
                http_response_code(400);
                echo json_encode(['error' => 'Emails array is required']);
                return;
            }

            if (count($emails) > 50) {
                http_response_code(400);
                echo json_encode(['error' => 'Maximum 50 emails allowed per request']);
                return;
            }

            // Validate all emails
            foreach ($emails as $email) {
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    http_response_code(400);
                    echo json_encode(['error' => "Invalid email format: {$email}"]);
                    return;
                }
            }

            $result = $this->hunterService->bulkEmailVerifier($emails);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $result
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get Hunter.io account information
     * GET /api/hunter/account
     */
    public function getAccount() {
        try {
            $userId = Auth::userIdOrFail();
            
            $result = $this->hunterService->getAccountInfo();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $result
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Save found emails as recipients
     * POST /api/hunter/save-recipients
     * Body: {"emails": [...], "campaign_id": 1}
     */
    public function saveAsRecipients() {
        try {
            $userId = Auth::userIdOrFail();
            
            $input = json_decode(file_get_contents('php://input'), true);
            $emails = $input['emails'] ?? [];
            $campaignId = $input['campaign_id'] ?? null;

            if (empty($emails) || !is_array($emails)) {
                http_response_code(400);
                echo json_encode(['error' => 'Emails array is required']);
                return;
            }

            $result = $this->hunterService->saveEmailsAsRecipients($emails, $userId, $campaignId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $result
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Search domain and save results as recipients
     * POST /api/hunter/domain-search-save
     * Body: {"domain": "example.com", "campaign_id": 1, "limit": 10}
     */
    public function domainSearchAndSave() {
        try {
            $userId = Auth::userIdOrFail();
            
            $input = json_decode(file_get_contents('php://input'), true);
            $domain = $input['domain'] ?? null;
            $campaignId = $input['campaign_id'] ?? null;
            $limit = (int)($input['limit'] ?? 10);

            if (!$domain) {
                http_response_code(400);
                echo json_encode(['error' => 'Domain parameter is required']);
                return;
            }

            // Search for emails
            $searchResult = $this->hunterService->domainSearch($domain, $limit);
            
            if (empty($searchResult['emails'])) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'search_results' => $searchResult,
                        'save_results' => ['saved' => 0, 'skipped' => 0, 'errors' => []]
                    ]
                ]);
                return;
            }

            // Save emails as recipients
            $saveResult = $this->hunterService->saveEmailsAsRecipients($searchResult['emails'], $userId, $campaignId);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'search_results' => $searchResult,
                    'save_results' => $saveResult
                ]
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => $e->getMessage()
            ]);
        }
    }
}
?>