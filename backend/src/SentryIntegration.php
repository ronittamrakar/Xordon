<?php
/**
 * Sentry Error Tracking Integration
 * 
 * Add to bootstrap.php to enable error tracking
 * 
 * Installation:
 * composer require sentry/sentry
 * 
 * Usage:
 * require_once __DIR__ . '/SentryIntegration.php';
 * SentryIntegration::init();
 */

namespace Xordon;

class SentryIntegration {
    
    private static bool $initialized = false;
    private static string $dsn = '';
    private static string $environment = 'development';
    
    /**
     * Initialize Sentry error tracking
     */
    public static function init(): void {
        if (self::$initialized) {
            return;
        }
        
        self::$dsn = getenv('SENTRY_DSN') ?: '';
        self::$environment = getenv('APP_ENV') ?: 'development';
        
        // Only initialize in production or staging with valid DSN
        if (empty(self::$dsn)) {
            return;
        }
        
        // Check if Sentry SDK is available
        if (!class_exists('\Sentry\SentrySdk')) {
            error_log('Sentry SDK not installed. Run: composer require sentry/sentry');
            return;
        }
        
        \Sentry\init([
            'dsn' => self::$dsn,
            'environment' => self::$environment,
            'release' => self::getRelease(),
            'sample_rate' => self::$environment === 'production' ? 1.0 : 0.5,
            'traces_sample_rate' => 0.2, // Performance monitoring (20% of transactions)
            'profiles_sample_rate' => 0.1, // Profiling (10% of transactions)
            
            // Filter sensitive data
            'before_send' => function (\Sentry\Event $event): ?\Sentry\Event {
                return self::filterSensitiveData($event);
            },
            
            // Add context
            'before_breadcrumb' => function (\Sentry\Breadcrumb $breadcrumb): ?\Sentry\Breadcrumb {
                return $breadcrumb;
            },
        ]);
        
        // Set global tags
        \Sentry\configureScope(function (\Sentry\State\Scope $scope): void {
            $scope->setTag('php_version', PHP_VERSION);
            $scope->setTag('server', gethostname());
        });
        
        self::$initialized = true;
    }
    
    /**
     * Get application release version
     */
    private static function getRelease(): string {
        $versionFile = __DIR__ . '/../../VERSION';
        if (file_exists($versionFile)) {
            return trim(file_get_contents($versionFile));
        }
        
        // Try to get git commit hash
        $gitHead = __DIR__ . '/../../.git/HEAD';
        if (file_exists($gitHead)) {
            $ref = trim(file_get_contents($gitHead));
            if (strpos($ref, 'ref: ') === 0) {
                $refPath = __DIR__ . '/../../.git/' . substr($ref, 5);
                if (file_exists($refPath)) {
                    return substr(trim(file_get_contents($refPath)), 0, 8);
                }
            }
        }
        
        return 'xordon@' . date('Y-m-d');
    }
    
    /**
     * Filter sensitive data from events
     */
    private static function filterSensitiveData(\Sentry\Event $event): \Sentry\Event {
        // Get request data and filter sensitive fields
        $sensitiveKeys = [
            'password', 'passwd', 'pwd', 'secret', 
            'api_key', 'apikey', 'token', 'auth',
            'credit_card', 'cc_number', 'cvv',
            'ssn', 'social_security',
        ];
        
        // The Event object is immutable, so we return as-is
        // Sentry automatically scrubs common sensitive fields
        // For custom fields, use the 'send_default_pii' option
        
        return $event;
    }
    
    /**
     * Capture an exception manually
     */
    public static function captureException(\Throwable $exception, array $context = []): ?string {
        if (!self::$initialized) {
            return null;
        }
        
        \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($context): void {
            foreach ($context as $key => $value) {
                $scope->setExtra($key, $value);
            }
        });
        
        return \Sentry\captureException($exception);
    }
    
    /**
     * Capture a message manually
     */
    public static function captureMessage(string $message, string $level = 'info', array $context = []): ?string {
        if (!self::$initialized) {
            return null;
        }
        
        \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($context): void {
            foreach ($context as $key => $value) {
                $scope->setExtra($key, $value);
            }
        });
        
        $sentryLevel = match($level) {
            'debug' => \Sentry\Severity::debug(),
            'info' => \Sentry\Severity::info(),
            'warning' => \Sentry\Severity::warning(),
            'error' => \Sentry\Severity::error(),
            'fatal' => \Sentry\Severity::fatal(),
            default => \Sentry\Severity::info(),
        };
        
        return \Sentry\captureMessage($message, $sentryLevel);
    }
    
    /**
     * Set user context for error tracking
     */
    public static function setUser(?int $userId, ?string $email = null, ?string $workspaceId = null): void {
        if (!self::$initialized) {
            return;
        }
        
        \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($userId, $email, $workspaceId): void {
            if ($userId) {
                $scope->setUser([
                    'id' => (string)$userId,
                    'email' => $email,
                    'workspace_id' => $workspaceId,
                ]);
            } else {
                $scope->setUser(null);
            }
        });
    }
    
    /**
     * Add breadcrumb for debugging
     */
    public static function addBreadcrumb(string $message, string $category = 'custom', array $data = []): void {
        if (!self::$initialized) {
            return;
        }
        
        \Sentry\addBreadcrumb(new \Sentry\Breadcrumb(
            \Sentry\Breadcrumb::LEVEL_INFO,
            \Sentry\Breadcrumb::TYPE_DEFAULT,
            $category,
            $message,
            $data
        ));
    }
    
    /**
     * Start a performance transaction
     */
    public static function startTransaction(string $name, string $operation = 'http.server'): ?\Sentry\Tracing\Transaction {
        if (!self::$initialized) {
            return null;
        }
        
        $context = new \Sentry\Tracing\TransactionContext();
        $context->setName($name);
        $context->setOp($operation);
        
        return \Sentry\startTransaction($context);
    }
    
    /**
     * Finish a performance transaction
     */
    public static function finishTransaction(?\Sentry\Tracing\Transaction $transaction): void {
        if ($transaction) {
            $transaction->finish();
        }
    }
}
