<?php
/**
 * ResponseHelper - Standardized API Response Handler
 * 
 * This class provides consistent response formatting across all API endpoints,
 * ensuring uniform error handling and HTTP status codes.
 */
class ResponseHelper {
    
    /**
     * Send a successful JSON response
     * 
     * @param mixed $data Response data
     * @param int $statusCode HTTP status code (default: 200)
     */
    public static function success($data = null, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        
        $response = ['success' => true];
        
        if ($data !== null) {
            if (is_array($data) && isset($data['data'])) {
                // If data is already wrapped, use it directly
                $response = array_merge($response, $data);
            } else {
                $response['data'] = $data;
            }
        }
        
        echo json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Send an error JSON response
     * 
     * @param string $message Error message
     * @param int $statusCode HTTP status code (default: 400)
     * @param array $details Additional error details (optional)
     */
    public static function error(string $message, int $statusCode = 400, array $details = []): void {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        
        $response = [
            'success' => false,
            'error' => $message
        ];
        
        if (!empty($details)) {
            $response['details'] = $details;
        }
        
        echo json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Send a validation error response
     * 
     * @param array $errors Validation errors (field => message pairs)
     */
    public static function validationError(array $errors): void {
        self::error('Validation failed', 422, ['validation' => $errors]);
    }

    /**
     * Send a 401 Unauthorized response
     * 
     * @param string $message Error message (default: 'Unauthorized')
     */
    public static function unauthorized(string $message = 'Unauthorized'): void {
        self::error($message, 401);
    }

    /**
     * Send a 403 Forbidden response
     * 
     * @param string $message Error message (default: 'Forbidden')
     */
    public static function forbidden(string $message = 'Forbidden'): void {
        self::error($message, 403);
    }

    /**
     * Send a 404 Not Found response
     * 
     * @param string $message Error message (default: 'Resource not found')
     */
    public static function notFound(string $message = 'Resource not found'): void {
        self::error($message, 404);
    }

    /**
     * Send a 500 Internal Server Error response
     * 
     * @param string $message Error message (default: 'Internal server error')
     * @param Exception|null $exception Exception for logging (not sent to client)
     */
    public static function serverError(string $message = 'Internal server error', ?Exception $exception = null): void {
        if ($exception) {
            require_once __DIR__ . '/Logger.php';
            Logger::error('Server error', [
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => $exception->getTraceAsString()
            ]);
        }
        
        self::error($message, 500);
    }

    /**
     * Send a 503 Service Unavailable response
     * 
     * @param string $message Error message (default: 'Service unavailable')
     */
    public static function serviceUnavailable(string $message = 'Service unavailable'): void {
        self::error($message, 503);
    }

    /**
     * Send a 201 Created response
     * 
     * @param mixed $data Created resource data
     */
    public static function created($data = null): void {
        self::success($data, 201);
    }

    /**
     * Send a 204 No Content response
     */
    public static function noContent(): void {
        http_response_code(204);
        exit;
    }

    /**
     * Send a paginated response
     * 
     * @param array $items Items for current page
     * @param int $total Total number of items
     * @param int $page Current page number
     * @param int $perPage Items per page
     */
    public static function paginated(array $items, int $total, int $page, int $perPage): void {
        $totalPages = ceil($total / $perPage);
        
        self::success([
            'data' => $items,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => $totalPages,
                'has_more' => $page < $totalPages
            ]
        ]);
    }

    /**
     * Catch exceptions and send appropriate error response
     * 
     * @param callable $callback Code to execute
     */
    public static function tryCatch(callable $callback): void {
        try {
            $callback();
        } catch (PDOException $e) {
            require_once __DIR__ . '/Logger.php';
            Logger::error('Database error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            self::serverError('A database error occurred');
        } catch (Exception $e) {
            require_once __DIR__ . '/Logger.php';
            Logger::error('Unexpected error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            // In development, show detailed error
            $isDev = getenv('APP_ENV') === 'development';
            $message = $isDev ? $e->getMessage() : 'An unexpected error occurred';
            
            self::serverError($message, $e);
        }
    }

    /**
     * Send raw JSON response (for legacy compatibility)
     * 
     * @param mixed $data Data to encode
     * @param int $statusCode HTTP status code
     */
    public static function json($data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }
}
