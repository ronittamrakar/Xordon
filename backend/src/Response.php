<?php
namespace Xordon;

use Exception;
use Throwable;

class Response {
    private static $requestStartTime = null;

    public static function startTiming() {
        self::$requestStartTime = microtime(true);
    }
    
    public static function json($data, $status = 200) {
        // Ensure status is a valid HTTP status code
        $status = (int)$status;
        if ($status < 100 || $status > 599) {
            $status = 500;
        }

        $method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
        $path = $_SERVER['REQUEST_URI'] ?? 'unknown';
        $responseTime = self::$requestStartTime ? microtime(true) - self::$requestStartTime : null;
        
        $userId = null;
        try {
            if (class_exists('\\Auth')) {
                $userId = \Auth::userId();
            }
        } catch (Exception $e) {
        }
        
        if ($status >= 400) {
            if (class_exists('\\Logger')) {
                \Logger::apiError($method, $path, $data['error'] ?? 'Unknown error', $userId);
            }
        } else {
            if (class_exists('\\Logger')) {
                \Logger::apiRequest($method, $path, $userId, $responseTime);
            }
        }
        
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    public static function error(string $message, int $status = 400, array $context = []) {
        if (class_exists('\\Logger')) {
            \Logger::error("API Error Response: $message", array_merge($context, [
                'status_code' => $status,
                'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
                'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
            ]));
        }
        self::json(['error' => $message], $status);
    }

    public static function success($data, int $status = 200) {
        self::json($data, $status);
    }
    
    public static function unauthorized(string $message = 'Unauthorized') {
        self::error($message, 401);
    }
    
    public static function forbidden(string $message = 'Forbidden') {
        self::error($message, 403);
    }
    
    public static function notFound(string $message = 'Not found') {
        self::error($message, 404);
    }
    
    public static function validationError(string $message, array $errors = []) {
        $data = ['error' => $message];
        if (!empty($errors)) {
            $data['validation_errors'] = $errors;
        }
        if (class_exists('\\Logger')) {
            \Logger::warning("Validation Error: $message", ['validation_errors' => $errors]);
        }
        self::json($data, 422);
    }
    
    public static function serverError(string $message = 'Internal server error', ?Throwable $exception = null) {
        $context = [];
        if ($exception) {
            $context = [
                'exception_message' => $exception->getMessage(),
                'exception_file' => $exception->getFile(),
                'exception_line' => $exception->getLine(),
                'exception_trace' => $exception->getTraceAsString()
            ];
        }
        if (class_exists('\\Logger')) {
            \Logger::critical("Server Error: $message", $context);
        }
        self::error($message, 500, $context);
    }
    
    public static function tooManyRequests(string $message = 'Too many requests', array $context = []) {
        if (class_exists('\\Logger')) {
            \Logger::warning("Rate limit exceeded: $message", $context);
        }
        if (!headers_sent()) {
            if (isset($context['retry_after'])) {
                header('Retry-After: ' . $context['retry_after']);
            }
            if (isset($context['limit'])) {
                header('X-RateLimit-Limit: ' . $context['limit']);
            }
            header('X-RateLimit-Remaining: 0');
        }
        self::json(['error' => $message, 'retry_after' => $context['retry_after'] ?? null], 429);
    }
    
    public static function text(string $text, int $status = 200) {
        http_response_code($status);
        header('Content-Type: text/plain');
        echo $text;
        exit;
    }
}

// Global alias for compatibility
if (!class_exists('\\Response')) {
    class_alias('\\Xordon\\Response', '\\Response');
}