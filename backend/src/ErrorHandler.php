<?php
namespace Xordon;

use Throwable;
use Exception;

require_once __DIR__ . '/Config.php';
require_once __DIR__ . '/Logger.php';
require_once __DIR__ . '/Response.php';

class ErrorHandler {
    public static function register(): void {
        // Set custom error handler
        set_error_handler([self::class, 'handleError']);
        
        // Set custom exception handler
        set_exception_handler([self::class, 'handleException']);
        
        // Register shutdown function to catch fatal errors
        register_shutdown_function([self::class, 'handleShutdown']);
        
        // Initialize logger
        Logger::init();
    }
    
    public static function handleError($severity, $message, $file, $line): bool {
        // Don't handle errors that are suppressed with @
        if (!(error_reporting() & $severity)) {
            return false;
        }
        
        $context = [
            'severity' => $severity,
            'file' => $file,
            'line' => $line,
            'error_type' => self::getErrorType($severity)
        ];
        
        // Log based on severity
        if ($severity & (E_ERROR | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR)) {
            Logger::critical("PHP Error: $message", $context);
        } elseif ($severity & (E_WARNING | E_CORE_WARNING | E_COMPILE_WARNING | E_USER_WARNING)) {
            Logger::warning("PHP Warning: $message", $context);
        } else {
            Logger::info("PHP Notice: $message", $context);
        }
        
        // Don't execute PHP internal error handler
        return true;
    }
    
    public static function handleException(\Throwable $exception): void {
        // Log detailed error information
        $context = [
            'exception_class' => get_class($exception),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'message' => $exception->getMessage(),
            'code' => $exception->getCode(),
            'trace' => $exception->getTraceAsString(),
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'CLI',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'N/A',
            'query_string' => $_SERVER['QUERY_STRING'] ?? '',
            'request_headers' => function_exists('getallheaders') ? getallheaders() : [],
            'request_body' => file_get_contents('php://input'),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString()
        ];
        
        Logger::critical("Unhandled Exception: " . $exception->getMessage(), $context);
        
        // If we're in an API context, return JSON error
        if (self::isApiRequest()) {
            if (Config::isProduction()) {
                Response::serverError('An unexpected error occurred');
            } else {
                Response::serverError($exception->getMessage(), $exception);
            }
        } else {
            // For non-API requests, show a generic error page
            http_response_code(500);
            if (!Config::isProduction()) {
                echo "<h1>Unhandled Exception</h1>";
                echo "<p><strong>Message:</strong> " . htmlspecialchars($exception->getMessage()) . "</p>";
                echo "<p><strong>File:</strong> " . htmlspecialchars($exception->getFile()) . "</p>";
                echo "<p><strong>Line:</strong> " . $exception->getLine() . "</p>";
                echo "<pre>" . htmlspecialchars($exception->getTraceAsString()) . "</pre>";
            } else {
                echo "<h1>Internal Server Error</h1>";
                echo "<p>An unexpected error occurred. Please try again later.</p>";
            }
        }
    }
    
    public static function handleShutdown(): void {
        $error = error_get_last();
        
        if ($error && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE])) {
            $context = [
                'type' => $error['type'],
                'file' => $error['file'],
                'line' => $error['line'],
                'error_type' => self::getErrorType($error['type'])
            ];
            
            Logger::critical("PHP Fatal Error: " . $error['message'], $context);
            
            // If we're in an API context and haven't sent headers yet
            if (self::isApiRequest() && !headers_sent()) {
                if (Config::isProduction()) {
                    Response::serverError('A fatal error occurred');
                } else {
                    Response::json([
                        'error' => $error['message'],
                        'file' => $error['file'],
                        'line' => $error['line']
                    ], 500);
                }
            }
        }
    }
    
    private static function isApiRequest(): bool {
        $requestUri = $_SERVER['REQUEST_URI'] ?? '';
        return strpos($requestUri, '/api/') === 0 || 
               (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);
    }
    
    private static function getErrorType(int $type): string {
        switch ($type) {
            case E_ERROR:
                return 'E_ERROR';
            case E_WARNING:
                return 'E_WARNING';
            case E_PARSE:
                return 'E_PARSE';
            case E_NOTICE:
                return 'E_NOTICE';
            case E_CORE_ERROR:
                return 'E_CORE_ERROR';
            case E_CORE_WARNING:
                return 'E_CORE_WARNING';
            case E_COMPILE_ERROR:
                return 'E_COMPILE_ERROR';
            case E_COMPILE_WARNING:
                return 'E_COMPILE_WARNING';
            case E_USER_ERROR:
                return 'E_USER_ERROR';
            case E_USER_WARNING:
                return 'E_USER_WARNING';
            case E_USER_NOTICE:
                return 'E_USER_NOTICE';
            case E_STRICT:
                return 'E_STRICT';
            case E_RECOVERABLE_ERROR:
                return 'E_RECOVERABLE_ERROR';
            case E_DEPRECATED:
                return 'E_DEPRECATED';
            case E_USER_DEPRECATED:
                return 'E_USER_DEPRECATED';
            default:
                return 'UNKNOWN';
        }
    }
    
    public static function logDatabaseError(string $query, string $error, array $params = []): void {
        Logger::databaseError($query, $error, $params);
    }
    
    public static function logAuthAttempt(string $email, bool $success): void {
        Logger::authAttempt($email, $success);
    }
    
    public static function logEmailSent(string $to, string $subject, ?int $campaignId = null, bool $success = true): void {
        Logger::emailSent($to, $subject, $campaignId, $success);
    }
}

// Global alias for compatibility
if (!class_exists('\\ErrorHandler')) {
    class_alias('\\Xordon\\ErrorHandler', '\\ErrorHandler');
}
