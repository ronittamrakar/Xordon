<?php
require_once __DIR__ . '/../../src/auth_check.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_SESSION['user_id'];
$workspaceId = $_SESSION['workspace_id'] ?? null;

if (!$workspaceId) {
    http_response_code(400);
    echo json_encode(['error' => 'No workspace selected']);
    exit;
}

// Extract platform from URL
$uri = $_SERVER['REQUEST_URI'];
preg_match('/\/oauth\/([^\/]+)/', $uri, $matches);
$platform = $matches[1] ?? null;

if (!$platform) {
    http_response_code(400);
    echo json_encode(['error' => 'Platform not specified']);
    exit;
}

// OAuth configuration for different platforms
$oauthConfigs = [
    'google' => [
        'auth_url' => 'https://accounts.google.com/o/oauth2/v2/auth',
        'token_url' => 'https://oauth2.googleapis.com/token',
        'client_id' => getenv('GOOGLE_ADS_CLIENT_ID'),
        'client_secret' => getenv('GOOGLE_ADS_CLIENT_SECRET'),
        'scopes' => 'https://www.googleapis.com/auth/adwords',
        'redirect_uri' => getenv('APP_URL') . '/api/ads/oauth/google/callback'
    ],
    'facebook' => [
        'auth_url' => 'https://www.facebook.com/v18.0/dialog/oauth',
        'token_url' => 'https://graph.facebook.com/v18.0/oauth/access_token',
        'client_id' => getenv('FACEBOOK_APP_ID'),
        'client_secret' => getenv('FACEBOOK_APP_SECRET'),
        'scopes' => 'ads_management,ads_read',
        'redirect_uri' => getenv('APP_URL') . '/api/ads/oauth/facebook/callback'
    ],
    'linkedin' => [
        'auth_url' => 'https://www.linkedin.com/oauth/v2/authorization',
        'token_url' => 'https://www.linkedin.com/oauth/v2/accessToken',
        'client_id' => getenv('LINKEDIN_CLIENT_ID'),
        'client_secret' => getenv('LINKEDIN_CLIENT_SECRET'),
        'scopes' => 'r_ads r_ads_reporting',
        'redirect_uri' => getenv('APP_URL') . '/api/ads/oauth/linkedin/callback'
    ]
];

if (!isset($oauthConfigs[$platform])) {
    http_response_code(400);
    echo json_encode(['error' => 'Unsupported platform']);
    exit;
}

$config = $oauthConfigs[$platform];

if ($method === 'GET') {
    // Handle callback
    if (strpos($uri, '/callback') !== false) {
        $code = $_GET['code'] ?? null;
        $error = $_GET['error'] ?? null;
        
        if ($error) {
            // Redirect to frontend with error
            header('Location: /growth/ads-manager?error=' . urlencode($error));
            exit;
        }
        
        if (!$code) {
            http_response_code(400);
            echo json_encode(['error' => 'Authorization code not provided']);
            exit;
        }
        
        // Exchange code for access token
        $tokenData = [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'redirect_uri' => $config['redirect_uri']
        ];
        
        $ch = curl_init($config['token_url']);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);
        
        $tokens = json_decode($response, true);
        
        if (!isset($tokens['access_token'])) {
            // Redirect to frontend with error
            header('Location: /growth/ads-manager?error=token_exchange_failed');
            exit;
        }
        
        // TODO: Fetch account details from platform and save to database
        // For now, redirect back to frontend with success
        header('Location: /growth/ads-manager?connected=' . $platform);
        exit;
    }
    
    // Initiate OAuth flow
    $state = bin2hex(random_bytes(16));
    $_SESSION['oauth_state'] = $state;
    $_SESSION['oauth_platform'] = $platform;
    
    $authUrl = $config['auth_url'] . '?' . http_build_query([
        'client_id' => $config['client_id'],
        'redirect_uri' => $config['redirect_uri'],
        'response_type' => 'code',
        'scope' => $config['scopes'],
        'state' => $state
    ]);
    
    echo json_encode([
        'auth_url' => $authUrl,
        'platform' => $platform
    ]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
