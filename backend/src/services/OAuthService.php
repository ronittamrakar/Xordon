<?php

namespace Xordon\Services;

/**
 * OAuth Integration Service
 * Handles OAuth 2.0 flows for third-party integrations
 */
class OAuthService {
    
    /**
     * QuickBooks OAuth Configuration
     */
    public static function getQuickBooksConfig() {
        return [
            'client_id' => getenv('QUICKBOOKS_CLIENT_ID'),
            'client_secret' => getenv('QUICKBOOKS_CLIENT_SECRET'),
            'redirect_uri' => getenv('QUICKBOOKS_REDIRECT_URI'),
            'authorization_endpoint' => 'https://appcenter.intuit.com/connect/oauth2',
            'token_endpoint' => 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
            'scope' => 'com.intuit.quickbooks.accounting',
        ];
    }
    
    /**
     * Generate QuickBooks authorization URL
     */
    public static function getQuickBooksAuthUrl($state) {
        $config = self::getQuickBooksConfig();
        
        $params = [
            'client_id' => $config['client_id'],
            'redirect_uri' => $config['redirect_uri'],
            'response_type' => 'code',
            'scope' => $config['scope'],
            'state' => $state
        ];
        
        return $config['authorization_endpoint'] . '?' . http_build_query($params);
    }
    
    /**
     * Exchange QuickBooks authorization code for tokens
     */
    public static function exchangeQuickBooksCode($code) {
        $config = self::getQuickBooksConfig();
        
        $ch = curl_init($config['token_endpoint']);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $config['redirect_uri']
            ]),
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Content-Type: application/x-www-form-urlencoded',
                'Authorization: Basic ' . base64_encode($config['client_id'] . ':' . $config['client_secret'])
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new \Exception('Failed to exchange QuickBooks code');
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Refresh QuickBooks access token
     */
    public static function refreshQuickBooksToken($refreshToken) {
        $config = self::getQuickBooksConfig();
        
        $ch = curl_init($config['token_endpoint']);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'grant_type' => 'refresh_token',
                'refresh_token' => $refreshToken
            ]),
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Content-Type: application/x-www-form-urlencoded',
                'Authorization: Basic ' . base64_encode($config['client_id'] . ':' . $config['client_secret'])
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new \Exception('Failed to refresh QuickBooks token');
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Google OAuth Configuration
     */
    public static function getGoogleConfig() {
        return [
            'client_id' => getenv('GOOGLE_CLIENT_ID'),
            'client_secret' => getenv('GOOGLE_CLIENT_SECRET'),
            'redirect_uri' => getenv('GOOGLE_REDIRECT_URI'),
            'authorization_endpoint' => 'https://accounts.google.com/o/oauth2/v2/auth',
            'token_endpoint' => 'https://oauth2.googleapis.com/token',
            'scope' => 'https://www.googleapis.com/auth/business.manage',
        ];
    }
    
    /**
     * Generate Google authorization URL (for GMB)
     */
    public static function getGoogleAuthUrl($state) {
        $config = self::getGoogleConfig();
        
        $params = [
            'client_id' => $config['client_id'],
            'redirect_uri' => $config['redirect_uri'],
            'response_type' => 'code',
            'scope' => $config['scope'],
            'state' => $state,
            'access_type' => 'offline',
            'prompt' => 'consent'
        ];
        
        return $config['authorization_endpoint'] . '?' . http_build_query($params);
    }
    
    /**
     * Exchange Google authorization code for tokens
     */
    public static function exchangeGoogleCode($code) {
        $config = self::getGoogleConfig();
        
        $ch = curl_init($config['token_endpoint']);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $config['redirect_uri'],
                'client_id' => $config['client_id'],
                'client_secret' => $config['client_secret']
            ]),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/x-www-form-urlencoded'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new \Exception('Failed to exchange Google code');
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Facebook OAuth Configuration
     */
    public static function getFacebookConfig() {
        return [
            'app_id' => getenv('FACEBOOK_APP_ID'),
            'app_secret' => getenv('FACEBOOK_APP_SECRET'),
            'redirect_uri' => getenv('FACEBOOK_REDIRECT_URI'),
            'authorization_endpoint' => 'https://www.facebook.com/v18.0/dialog/oauth',
            'token_endpoint' => 'https://graph.facebook.com/v18.0/oauth/access_token',
            'scope' => 'pages_messaging,pages_manage_metadata,instagram_basic,instagram_manage_messages',
        ];
    }
    
    /**
     * Generate Facebook authorization URL
     */
    public static function getFacebookAuthUrl($state) {
        $config = self::getFacebookConfig();
        
        $params = [
            'client_id' => $config['app_id'],
            'redirect_uri' => $config['redirect_uri'],
            'state' => $state,
            'scope' => $config['scope']
        ];
        
        return $config['authorization_endpoint'] . '?' . http_build_query($params);
    }
    
    /**
     * Exchange Facebook authorization code for tokens
     */
    public static function exchangeFacebookCode($code) {
        $config = self::getFacebookConfig();
        
        $params = [
            'client_id' => $config['app_id'],
            'client_secret' => $config['app_secret'],
            'redirect_uri' => $config['redirect_uri'],
            'code' => $code
        ];
        
        $url = $config['token_endpoint'] . '?' . http_build_query($params);
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new \Exception('Failed to exchange Facebook code');
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Generate secure state parameter for OAuth
     */
    public static function generateState() {
        return bin2hex(random_bytes(16));
    }
    
    /**
     * Verify OAuth state parameter
     */
    public static function verifyState($state, $expectedState) {
        return hash_equals($expectedState, $state);
    }
}
