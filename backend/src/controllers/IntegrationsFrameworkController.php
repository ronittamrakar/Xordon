<?php
/**
 * Integrations Framework Controller
 * Standard connector framework for third-party services (Stripe, Google, etc.)
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class IntegrationsFrameworkController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required');
    }

    private static function getUserId(): int {
        return Auth::userIdOrFail();
    }

    /**
     * List all integrations for workspace
     */
    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT 
                    id, workspace_id, provider, provider_account_id, provider_account_name,
                    status, error_message, last_error_at, scopes, config,
                    last_sync_at, last_sync_status, connected_by, connected_at,
                    created_at, updated_at
                FROM integrations 
                WHERE workspace_id = ?
                ORDER BY provider
            ");
            $stmt->execute([$workspaceId]);
            $integrations = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($integrations as &$i) {
                $i['scopes'] = $i['scopes'] ? json_decode($i['scopes'], true) : null;
                $i['config'] = $i['config'] ? json_decode($i['config'], true) : null;
                // Never expose credentials
            }

            return Response::json(['data' => $integrations]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch integrations: ' . $e->getMessage());
        }
    }

    /**
     * Get single integration
     */
    public static function show($provider) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT 
                    id, workspace_id, provider, provider_account_id, provider_account_name,
                    status, error_message, last_error_at, scopes, config,
                    last_sync_at, last_sync_status, connected_by, connected_at,
                    created_at, updated_at
                FROM integrations 
                WHERE workspace_id = ? AND provider = ?
            ");
            $stmt->execute([$workspaceId, $provider]);
            $integration = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$integration) {
                return Response::json(['data' => null]);
            }

            $integration['scopes'] = $integration['scopes'] ? json_decode($integration['scopes'], true) : null;
            $integration['config'] = $integration['config'] ? json_decode($integration['config'], true) : null;

            return Response::json(['data' => $integration]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch integration: ' . $e->getMessage());
        }
    }

    /**
     * Get available providers
     */
    public static function providers() {
        $providers = [
            [
                'id' => 'stripe',
                'name' => 'Stripe',
                'category' => 'payments',
                'description' => 'Accept payments, create invoices, and manage subscriptions',
                'icon' => 'credit-card',
                'oauth' => true,
                'scopes' => ['read_write'],
                'features' => ['payments', 'invoices', 'subscriptions', 'customers']
            ],
            [
                'id' => 'google',
                'name' => 'Google',
                'category' => 'productivity',
                'description' => 'Connect Google Calendar, Gmail, and Business Profile',
                'icon' => 'mail',
                'oauth' => true,
                'scopes' => ['calendar', 'gmail', 'business_profile'],
                'features' => ['calendar_sync', 'email_sync', 'gbp_reviews', 'gbp_posts']
            ],
            [
                'id' => 'signalwire',
                'name' => 'SignalWire',
                'category' => 'communications',
                'description' => 'SMS, MMS, and voice calling',
                'icon' => 'phone',
                'oauth' => false,
                'scopes' => [],
                'features' => ['sms', 'mms', 'voice', 'phone_numbers']
            ],
            [
                'id' => 'twilio',
                'name' => 'Twilio',
                'category' => 'communications',
                'description' => 'SMS, MMS, and voice calling',
                'icon' => 'phone',
                'oauth' => false,
                'scopes' => [],
                'features' => ['sms', 'mms', 'voice', 'phone_numbers']
            ],
            [
                'id' => 'facebook',
                'name' => 'Facebook & Instagram',
                'category' => 'social',
                'description' => 'Manage Facebook and Instagram pages, ads, and messaging',
                'icon' => 'facebook',
                'oauth' => true,
                'scopes' => ['pages_manage', 'instagram_basic', 'ads_management'],
                'features' => ['pages', 'posts', 'ads', 'messenger', 'instagram']
            ],
            [
                'id' => 'linkedin',
                'name' => 'LinkedIn',
                'category' => 'social',
                'description' => 'Post to LinkedIn and manage company pages',
                'icon' => 'linkedin',
                'oauth' => true,
                'scopes' => ['w_member_social', 'r_organization_social'],
                'features' => ['posts', 'company_pages']
            ],
            [
                'id' => 'quickbooks',
                'name' => 'QuickBooks',
                'category' => 'accounting',
                'description' => 'Sync invoices, payments, and customers',
                'icon' => 'calculator',
                'oauth' => true,
                'scopes' => ['accounting'],
                'features' => ['invoices', 'payments', 'customers', 'expenses']
            ],
            [
                'id' => 'zapier',
                'name' => 'Zapier',
                'category' => 'automation',
                'description' => 'Connect to 5000+ apps via Zapier',
                'icon' => 'zap',
                'oauth' => false,
                'scopes' => [],
                'features' => ['triggers', 'actions', 'webhooks']
            ]
        ];

        return Response::json(['data' => $providers]);
    }

    /**
     * Start OAuth flow
     */
    public static function startOAuth($provider) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Generate state
            $state = bin2hex(random_bytes(32));

            // Store state
            $stmt = $db->prepare("
                INSERT INTO oauth_states (state, workspace_id, user_id, provider, redirect_uri, scopes, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
            ");
            $stmt->execute([
                $state,
                $workspaceId,
                $userId,
                $provider,
                $data['redirect_uri'] ?? null,
                isset($data['scopes']) ? json_encode($data['scopes']) : null
            ]);

            // Build OAuth URL based on provider
            $authUrl = self::buildOAuthUrl($provider, $state, $data['scopes'] ?? []);

            if (!$authUrl) {
                return Response::error('Provider not supported for OAuth', 400);
            }

            return Response::json(['data' => ['auth_url' => $authUrl, 'state' => $state]]);
        } catch (Exception $e) {
            return Response::error('Failed to start OAuth: ' . $e->getMessage());
        }
    }

    /**
     * Handle OAuth callback
     */
    public static function handleOAuthCallback() {
        try {
            $db = Database::conn();
            
            $state = $_GET['state'] ?? null;
            $code = $_GET['code'] ?? null;
            $error = $_GET['error'] ?? null;

            if ($error) {
                return Response::error('OAuth error: ' . ($error['error_description'] ?? $error), 400);
            }

            if (!$state || !$code) {
                return Response::error('Missing state or code', 400);
            }

            // Verify state
            $stmt = $db->prepare("
                SELECT * FROM oauth_states 
                WHERE state = ? AND expires_at > NOW() AND used_at IS NULL
            ");
            $stmt->execute([$state]);
            $oauthState = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$oauthState) {
                return Response::error('Invalid or expired state', 400);
            }

            // Mark state as used
            $db->prepare("UPDATE oauth_states SET used_at = NOW() WHERE id = ?")->execute([$oauthState['id']]);

            // Exchange code for tokens
            $tokens = self::exchangeCodeForTokens($oauthState['provider'], $code);

            if (!$tokens) {
                return Response::error('Failed to exchange code for tokens', 500);
            }

            // Get account info from provider
            $accountInfo = self::getProviderAccountInfo($oauthState['provider'], $tokens['access_token']);

            // Encrypt credentials
            $encryptedCredentials = self::encryptCredentials($tokens);

            // Upsert integration
            $stmt = $db->prepare("
                INSERT INTO integrations 
                (workspace_id, provider, provider_account_id, provider_account_name, status, 
                 credentials_encrypted, access_token_expires_at, scopes, connected_by, connected_at)
                VALUES (?, ?, ?, ?, 'connected', ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    provider_account_id = VALUES(provider_account_id),
                    provider_account_name = VALUES(provider_account_name),
                    status = 'connected',
                    credentials_encrypted = VALUES(credentials_encrypted),
                    access_token_expires_at = VALUES(access_token_expires_at),
                    scopes = VALUES(scopes),
                    error_message = NULL,
                    last_error_at = NULL,
                    connected_by = VALUES(connected_by),
                    connected_at = NOW()
            ");

            $expiresAt = isset($tokens['expires_in']) 
                ? date('Y-m-d H:i:s', time() + $tokens['expires_in']) 
                : null;

            $stmt->execute([
                $oauthState['workspace_id'],
                $oauthState['provider'],
                $accountInfo['id'] ?? null,
                $accountInfo['name'] ?? null,
                $encryptedCredentials,
                $expiresAt,
                $oauthState['scopes'],
                $oauthState['user_id']
            ]);

            // Redirect to success page
            $redirectUri = $oauthState['redirect_uri'] ?? '/settings#integrations';
            header('Location: ' . $redirectUri . '?success=1&provider=' . $oauthState['provider']);
            exit;

        } catch (Exception $e) {
            return Response::error('OAuth callback failed: ' . $e->getMessage());
        }
    }

    /**
     * Connect with API keys (non-OAuth)
     */
    public static function connectWithKeys($provider) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Validate required keys based on provider
            $requiredKeys = self::getRequiredKeys($provider);
            foreach ($requiredKeys as $key) {
                if (empty($data[$key])) {
                    return Response::error("$key is required", 400);
                }
            }

            // Test connection
            $testResult = self::testProviderConnection($provider, $data);
            if (!$testResult['success']) {
                return Response::error('Connection test failed: ' . ($testResult['error'] ?? 'Unknown error'), 400);
            }

            // Encrypt credentials
            $encryptedCredentials = self::encryptCredentials($data);

            // Upsert integration
            $stmt = $db->prepare("
                INSERT INTO integrations 
                (workspace_id, provider, provider_account_id, provider_account_name, status, 
                 credentials_encrypted, config, connected_by, connected_at)
                VALUES (?, ?, ?, ?, 'connected', ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    provider_account_id = VALUES(provider_account_id),
                    provider_account_name = VALUES(provider_account_name),
                    status = 'connected',
                    credentials_encrypted = VALUES(credentials_encrypted),
                    config = VALUES(config),
                    error_message = NULL,
                    last_error_at = NULL,
                    connected_by = VALUES(connected_by),
                    connected_at = NOW()
            ");

            $stmt->execute([
                $workspaceId,
                $provider,
                $testResult['account_id'] ?? null,
                $testResult['account_name'] ?? null,
                $encryptedCredentials,
                isset($data['config']) ? json_encode($data['config']) : null,
                $userId
            ]);

            return Response::json(['success' => true, 'data' => [
                'provider' => $provider,
                'status' => 'connected',
                'account_name' => $testResult['account_name'] ?? null
            ]]);
        } catch (Exception $e) {
            return Response::error('Connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Disconnect integration
     */
    public static function disconnect($provider) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                UPDATE integrations 
                SET status = 'disconnected', credentials_encrypted = NULL, 
                    access_token_expires_at = NULL, refresh_token_expires_at = NULL
                WHERE workspace_id = ? AND provider = ?
            ");
            $stmt->execute([$workspaceId, $provider]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Disconnect failed: ' . $e->getMessage());
        }
    }

    /**
     * Test integration connection
     */
    public static function test($provider) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT credentials_encrypted, config FROM integrations 
                WHERE workspace_id = ? AND provider = ? AND status = 'connected'
            ");
            $stmt->execute([$workspaceId, $provider]);
            $integration = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$integration) {
                return Response::error('Integration not connected', 404);
            }

            $credentials = self::decryptCredentials($integration['credentials_encrypted']);
            $testResult = self::testProviderConnection($provider, $credentials);

            if (!$testResult['success']) {
                // Update status to error
                $db->prepare("
                    UPDATE integrations SET status = 'error', error_message = ?, last_error_at = NOW()
                    WHERE workspace_id = ? AND provider = ?
                ")->execute([$testResult['error'] ?? 'Connection test failed', $workspaceId, $provider]);
            }

            return Response::json(['data' => $testResult]);
        } catch (Exception $e) {
            return Response::error('Test failed: ' . $e->getMessage());
        }
    }

    /**
     * Update integration config
     */
    public static function updateConfig($provider) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("
                UPDATE integrations SET config = ?
                WHERE workspace_id = ? AND provider = ?
            ");
            $stmt->execute([json_encode($data['config'] ?? []), $workspaceId, $provider]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Update failed: ' . $e->getMessage());
        }
    }

    /**
     * Trigger sync for integration
     */
    public static function sync($provider) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Get integration
            $stmt = $db->prepare("
                SELECT id FROM integrations 
                WHERE workspace_id = ? AND provider = ? AND status = 'connected'
            ");
            $stmt->execute([$workspaceId, $provider]);
            $integration = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$integration) {
                return Response::error('Integration not connected', 404);
            }

            // Create sync job
            $stmt = $db->prepare("
                INSERT INTO integration_sync_jobs 
                (workspace_id, integration_id, job_type, entity_type, status)
                VALUES (?, ?, ?, ?, 'pending')
            ");
            $stmt->execute([
                $workspaceId,
                $integration['id'],
                $data['job_type'] ?? 'incremental_sync',
                $data['entity_type'] ?? null
            ]);

            $jobId = $db->lastInsertId();

            return Response::json(['data' => ['job_id' => (int)$jobId, 'status' => 'pending']]);
        } catch (Exception $e) {
            return Response::error('Sync failed: ' . $e->getMessage());
        }
    }

    /**
     * Get sync job status
     */
    public static function getSyncJob($jobId) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM integration_sync_jobs 
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([$jobId, $workspaceId]);
            $job = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$job) {
                return Response::error('Job not found', 404);
            }

            $job['error_log'] = $job['error_log'] ? json_decode($job['error_log'], true) : null;

            return Response::json(['data' => $job]);
        } catch (Exception $e) {
            return Response::error('Failed to get job: ' . $e->getMessage());
        }
    }

    // ==================== HELPER METHODS ====================

    private static function buildOAuthUrl(string $provider, string $state, array $scopes): ?string {
        $baseUrl = getenv('APP_URL') ?: 'http://localhost:8001';
        $callbackUrl = $baseUrl . '/api/integrations/oauth/callback';

        switch ($provider) {
            case 'google':
                $clientId = getenv('GOOGLE_CLIENT_ID');
                if (!$clientId) return null;
                $googleScopes = [
                    'https://www.googleapis.com/auth/calendar',
                    'https://www.googleapis.com/auth/gmail.readonly',
                    'https://www.googleapis.com/auth/business.manage'
                ];
                return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
                    'client_id' => $clientId,
                    'redirect_uri' => $callbackUrl,
                    'response_type' => 'code',
                    'scope' => implode(' ', $googleScopes),
                    'state' => $state,
                    'access_type' => 'offline',
                    'prompt' => 'consent'
                ]);

            case 'stripe':
                $clientId = getenv('STRIPE_CLIENT_ID');
                if (!$clientId) return null;
                return 'https://connect.stripe.com/oauth/authorize?' . http_build_query([
                    'client_id' => $clientId,
                    'response_type' => 'code',
                    'scope' => 'read_write',
                    'state' => $state,
                    'redirect_uri' => $callbackUrl
                ]);

            case 'facebook':
                $clientId = getenv('FACEBOOK_APP_ID');
                if (!$clientId) return null;
                $fbScopes = ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish'];
                return 'https://www.facebook.com/v18.0/dialog/oauth?' . http_build_query([
                    'client_id' => $clientId,
                    'redirect_uri' => $callbackUrl,
                    'scope' => implode(',', $fbScopes),
                    'state' => $state
                ]);

            case 'linkedin':
                $clientId = getenv('LINKEDIN_CLIENT_ID');
                if (!$clientId) return null;
                return 'https://www.linkedin.com/oauth/v2/authorization?' . http_build_query([
                    'client_id' => $clientId,
                    'redirect_uri' => $callbackUrl,
                    'response_type' => 'code',
                    'scope' => 'w_member_social r_organization_social',
                    'state' => $state
                ]);

            default:
                return null;
        }
    }

    private static function exchangeCodeForTokens(string $provider, string $code): ?array {
        $baseUrl = getenv('APP_URL') ?: 'http://localhost:8001';
        $callbackUrl = $baseUrl . '/api/integrations/oauth/callback';

        switch ($provider) {
            case 'google':
                $response = self::httpPost('https://oauth2.googleapis.com/token', [
                    'code' => $code,
                    'client_id' => getenv('GOOGLE_CLIENT_ID'),
                    'client_secret' => getenv('GOOGLE_CLIENT_SECRET'),
                    'redirect_uri' => $callbackUrl,
                    'grant_type' => 'authorization_code'
                ]);
                return $response;

            case 'stripe':
                $response = self::httpPost('https://connect.stripe.com/oauth/token', [
                    'code' => $code,
                    'client_secret' => getenv('STRIPE_SECRET_KEY'),
                    'grant_type' => 'authorization_code'
                ]);
                return $response;

            // Add other providers...
            default:
                return null;
        }
    }

    private static function getProviderAccountInfo(string $provider, string $accessToken): array {
        switch ($provider) {
            case 'google':
                $response = self::httpGet('https://www.googleapis.com/oauth2/v2/userinfo', $accessToken);
                return [
                    'id' => $response['id'] ?? null,
                    'name' => $response['email'] ?? $response['name'] ?? null
                ];

            case 'stripe':
                // For Stripe Connect, the account ID is returned in the token response
                return ['id' => null, 'name' => null];

            default:
                return ['id' => null, 'name' => null];
        }
    }

    private static function getRequiredKeys(string $provider): array {
        switch ($provider) {
            case 'signalwire':
                return ['project_id', 'api_token', 'space_url'];
            case 'twilio':
                return ['account_sid', 'auth_token'];
            case 'zapier':
                return ['api_key'];
            default:
                return [];
        }
    }

    private static function testProviderConnection(string $provider, array $credentials): array {
        switch ($provider) {
            case 'signalwire':
                // Test SignalWire connection
                $url = 'https://' . $credentials['space_url'] . '/api/laml/2010-04-01/Accounts/' . $credentials['project_id'];
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_USERPWD, $credentials['project_id'] . ':' . $credentials['api_token']);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($httpCode === 200) {
                    return ['success' => true, 'account_id' => $credentials['project_id'], 'account_name' => 'SignalWire'];
                }
                return ['success' => false, 'error' => 'Invalid credentials'];

            case 'twilio':
                $url = 'https://api.twilio.com/2010-04-01/Accounts/' . $credentials['account_sid'] . '.json';
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_USERPWD, $credentials['account_sid'] . ':' . $credentials['auth_token']);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($httpCode === 200) {
                    $data = json_decode($response, true);
                    return ['success' => true, 'account_id' => $credentials['account_sid'], 'account_name' => $data['friendly_name'] ?? 'Twilio'];
                }
                return ['success' => false, 'error' => 'Invalid credentials'];

            default:
                return ['success' => true]; // Assume success for unknown providers
        }
    }

    private static function encryptCredentials(array $credentials): string {
        $key = getenv('APP_KEY') ?: 'default-encryption-key-change-me';
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt(json_encode($credentials), 'AES-256-CBC', $key, 0, $iv);
        return base64_encode($iv . $encrypted);
    }

    private static function decryptCredentials(string $encrypted): array {
        $key = getenv('APP_KEY') ?: 'default-encryption-key-change-me';
        $data = base64_decode($encrypted);
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
        return json_decode($decrypted, true) ?: [];
    }

    private static function httpPost(string $url, array $data): ?array {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }

    private static function httpGet(string $url, string $accessToken): ?array {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $accessToken]);
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }

    /**
     * Get decrypted credentials for a provider (internal use)
     */
    public static function getCredentials(int $workspaceId, string $provider): ?array {
        try {
            $db = Database::conn();
            $stmt = $db->prepare("
                SELECT credentials_encrypted FROM integrations 
                WHERE workspace_id = ? AND provider = ? AND status = 'connected'
            ");
            $stmt->execute([$workspaceId, $provider]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row || !$row['credentials_encrypted']) {
                return null;
            }

            return self::decryptCredentials($row['credentials_encrypted']);
        } catch (Exception $e) {
            return null;
        }
    }
}
