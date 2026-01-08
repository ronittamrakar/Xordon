<?php
namespace Xordon;

/**
 * Secure Configuration Manager
 * Handles all environment variables and secrets securely
 */

class Config {
    private static $config = null;
    private static $requiredEnvVars = [
        'DB_HOST',
        'DB_NAME',
        'DB_USER',
        'DB_PASS',
        'JWT_SECRET',
        'ENCRYPTION_KEY'
    ];
    
    public static function get(string $key, $default = null) {
        if (self::$config === null) {
            self::loadConfig();
        }
        
        return self::$config[$key] ?? $default;
    }
    
    public static function getDatabaseConfig(): array {
        return [
            'driver' => self::get('DB_DRIVER', 'mysql'),
            'host' => self::get('DB_HOST'),
            'port' => self::get('DB_PORT', 3306),
            'database' => self::get('DB_NAME'),
            'username' => self::get('DB_USER'),
            'password' => self::get('DB_PASS'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'options' => [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => self::get('DB_SSL_MODE') === 'REQUIRED' ? false : true
            ]
        ];
    }
    
    public static function getSignalWireConfig(): array {
        return [
            'project_id' => self::get('SIGNALWIRE_PROJECT_ID'),
            'api_token' => self::get('SIGNALWIRE_API_TOKEN'),
            'space_url' => self::get('SIGNALWIRE_SPACE_URL'),
            'phone_number' => self::get('SIGNALWIRE_PHONE_NUMBER')
        ];
    }
    
    public static function getAIConfig(): array {
        return [
            'openai' => [
                'api_key' => self::get('OPENAI_API_KEY'),
                'base_url' => self::get('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
                'model' => self::get('OPENAI_MODEL', 'gpt-4o-mini')
            ],
            'gemini' => [
                'api_key' => self::get('GEMINI_API_KEY'),
                'base_url' => self::get('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
                'model' => self::get('GEMINI_MODEL', 'gemini-1.5-flash')
            ]
        ];
    }
    
    public static function getSecurityConfig(): array {
        return [
            'jwt_secret' => self::get('JWT_SECRET'),
            'encryption_key' => self::get('ENCRYPTION_KEY'),
            'rate_limit_requests' => (int)self::get('RATE_LIMIT_REQUESTS', 100),
            'rate_limit_window' => (int)self::get('RATE_LIMIT_WINDOW', 3600),
            'cors_origins' => explode(',', self::get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000'))
        ];
    }
    
    public static function isProduction(): bool {
        return self::get('APP_ENV') === 'production';
    }
    
    public static function validateEnvironment(): array {
        $errors = [];
        
        foreach (self::$requiredEnvVars as $var) {
            if (empty(self::get($var))) {
                $errors[] = "Missing required environment variable: $var";
            }
        }
        
        // Validate JWT secret length
        $jwtSecret = self::get('JWT_SECRET');
        if ($jwtSecret && strlen($jwtSecret) < 32) {
            $errors[] = "JWT_SECRET must be at least 32 characters long";
        }
        
        // Validate encryption key
        $encKey = self::get('ENCRYPTION_KEY');
        if ($encKey && strlen($encKey) < 32) {
            $errors[] = "ENCRYPTION_KEY must be at least 32 characters long";
        }
        
        return $errors;
    }
    
    private static function loadConfig(): void {
        // Load from environment
        self::$config = $_ENV + $_SERVER;
        
        // Load .env file if exists
        $envFile = __DIR__ . '/../../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos($line, '#') === 0) {
                    continue; // Skip comments
                }
                
                if (strpos($line, '=') !== false) {
                    list($key, $value) = explode('=', $line, 2);
                    self::$config[trim($key)] = trim($value);
                }
            }
        }
        
        // Validate critical configuration
        if (self::isProduction()) {
            $errors = self::validateEnvironment();
            if (!empty($errors)) {
                throw new Exception('Production environment validation failed: ' . implode(', ', $errors));
            }
        }
    }
    
    public static function encrypt(string $data): string {
        $key = self::get('ENCRYPTION_KEY');
        if (!$key) {
            throw new Exception('Encryption key not configured');
        }
        
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv);
        return base64_encode($iv . $encrypted);
    }
    
    public static function decrypt(string $encryptedData): string {
        $key = self::get('ENCRYPTION_KEY');
        if (!$key) {
            throw new Exception('Encryption key not configured');
        }
        
        $data = base64_decode($encryptedData);
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        
        return openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv);
    }
}

// Global alias for compatibility
if (!class_exists('\\Config')) {
    class_alias('\\Xordon\\Config', '\\Config');
}

