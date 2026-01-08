<?php
/**
 * Security Headers Manager
 * Implements comprehensive security headers for production
 */

class SecurityHeaders {
    
    public static function apply(): void {
        if (headers_sent()) {
            return;
        }
        
        // Content Security Policy (CSP)
        self::setContentSecurityPolicy();
        
        // Strict Transport Security (HSTS) - HTTPS only
        self::setHSTS();
        
        // X-Frame-Options - Prevent clickjacking
        header('X-Frame-Options: DENY');
        
        // X-Content-Type-Options - Prevent MIME sniffing
        header('X-Content-Type-Options: nosniff');
        
        // X-XSS-Protection - XSS protection
        header('X-XSS-Protection: 1; mode=block');
        
        // Referrer Policy
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Permissions Policy (Feature Policy)
        self::setPermissionsPolicy();
        
        // Content-Type Options
        header('Content-Type: application/json; charset=UTF-8');
        
        // Cache Control for API responses
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        
        // Remove server signature
        header_remove('Server');
        header_remove('X-Powered-By');
    }
    
    private static function setContentSecurityPolicy(): void {
        if (Config::isProduction()) {
            // Production CSP - strict
            $csp = "default-src 'self'; " .
                   "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " . // Allow inline scripts for React
                   "style-src 'self' 'unsafe-inline'; " . // Allow inline styles
                   "img-src 'self' data: https:; " . // Allow images and data URIs
                   "font-src 'self' data:; " . // Allow fonts and data URIs
                   "connect-src 'self' " . self::getAllowedConnectSources() . "; " .
                   "frame-ancestors 'none'; " . // Prevent framing
                   "base-uri 'self'; " . // Restrict base URI
                   "form-action 'self'; " . // Restrict form submissions
                   "upgrade-insecure-requests; " . // Upgrade HTTP to HTTPS
                   "block-all-mixed-content;"; // Block mixed content
        } else {
            // Development CSP - more relaxed
            $csp = "default-src 'self' 'unsafe-inline' 'unsafe-eval' ws: wss:; " .
                   "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " .
                   "style-src 'self' 'unsafe-inline'; " .
                   "img-src 'self' data: https:; " .
                   "font-src 'self' data:; " .
                   "connect-src 'self' ws: wss: http://localhost:* https://localhost:*;";
        }
        
        header("Content-Security-Policy: $csp");
    }
    
    private static function setHSTS(): void {
        if (Config::isProduction() && self::isHTTPS()) {
            // HSTS for production with HTTPS
            $maxAge = 31536000; // 1 year
            $includeSubDomains = true;
            $preload = true;
            
            $hsts = "max-age=$maxAge";
            if ($includeSubDomains) {
                $hsts .= "; includeSubDomains";
            }
            if ($preload) {
                $hsts .= "; preload";
            }
            
            header("Strict-Transport-Security: $hsts");
        }
    }
    
    private static function setPermissionsPolicy(): void {
        // Disable unused features for security
        $permissions = [
            'geolocation' => '()',
            'microphone' => '()',
            'camera' => '()',
            'payment' => '()',
            'usb' => '()',
            'magnetometer' => '()',
            'gyroscope' => '()',
            'accelerometer' => '()',
            'ambient-light-sensor' => '()',
            'autoplay' => '()',
            'encrypted-media' => '()',
            'fullscreen' => '()',
            'picture-in-picture' => '()',
            'publickey-credentials-get' => '()'
        ];
        
        $policyString = '';
        foreach ($permissions as $feature => $allowList) {
            if ($policyString) {
                $policyString .= ', ';
            }
            $policyString .= "$feature=$allowList";
        }
        
        header("Permissions-Policy: $policyString");
    }
    
    private static function getAllowedConnectSources(): string {
        $sources = [];
        
        // Add SignalWire domains
        $signalWireConfig = Config::getSignalWireConfig();
        if ($signalWireConfig['space_url']) {
            $sources[] = 'https://' . $signalWireConfig['space_url'];
            $sources[] = 'wss://' . $signalWireConfig['space_url'];
        }
        
        // Add AI provider domains
        $aiConfig = Config::getAIConfig();
        if ($aiConfig['openai']['base_url']) {
            $sources[] = $aiConfig['openai']['base_url'];
        }
        if ($aiConfig['gemini']['base_url']) {
            $sources[] = $aiConfig['gemini']['base_url'];
        }
        
        // Add CORS allowed origins
        $corsOrigins = Config::get('CORS_ALLOWED_ORIGINS', []);
        foreach ($corsOrigins as $origin) {
            if ($origin && $origin !== '*') {
                $sources[] = $origin;
            }
        }
        
        return implode(' ', array_unique($sources));
    }
    
    private static function isHTTPS(): bool {
        return (
            (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
            $_SERVER['SERVER_PORT'] == 443 ||
            (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
        );
    }
    
    public static function applyCorsHeaders(): void {
        if (headers_sent()) {
            return;
        }
        
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowedOrigins = Config::get('CORS_ALLOWED_ORIGINS', ['http://localhost:3000']);
        if (is_string($allowedOrigins)) {
            $allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $allowedOrigins))));
        }
        if (!is_array($allowedOrigins)) {
            $allowedOrigins = ['http://localhost:3000'];
        }
        $allowedOrigins = array_values(array_filter($allowedOrigins, fn($o) => is_string($o) && trim($o) !== ''));
        $hasWildcard = in_array('*', $allowedOrigins, true);
        
        // Only echo back Origin when present (required for credentials)
        // If credentials are allowed, we must NOT use '*' for Access-Control-Allow-Origin.
        // To avoid a dangerous misconfiguration, we only reflect explicit allowed origins.
        if ($origin !== '' && !$hasWildcard && in_array($origin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: $origin");
        }
        
        // Allow specific headers
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token, X-Workspace-Id');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400'); // 24 hours
    }
    
    public static function nonce(): string {
        // Generate nonce for CSP
        return base64_encode(random_bytes(16));
    }
    
    public static function applyWithNonce(string $nonce = null): string {
        $nonce = $nonce ?? self::nonce();
        
        // Apply CSP with nonce for inline scripts
        if (Config::isProduction()) {
            $csp = "default-src 'self'; " .
                   "script-src 'self' 'nonce-$nonce'; " .
                   "style-src 'self' 'nonce-$nonce'; " .
                   "img-src 'self' data: https:; " .
                   "font-src 'self' data:; " .
                   "connect-src 'self' " . self::getAllowedConnectSources() . "; " .
                   "frame-ancestors 'none'; " .
                   "base-uri 'self'; " .
                   "form-action 'self';";
            
            header("Content-Security-Policy: $csp");
        } else {
            self::apply(); // Use regular CSP for development
        }
        
        // Return nonce for use in templates
        return $nonce;
    }
}

// Apply security headers automatically
SecurityHeaders::apply();
?>
