<?php
// Basic bootstrap
$env = getenv('APP_ENV') ?: '';
$isDev = ($env === 'development' || $env === 'dev');

$GLOBALS['isDev'] = $isDev;

ini_set('display_errors', '1'); // Enable errors for debugging
error_reporting(E_ALL);
date_default_timezone_set('UTC');

// Initialize comprehensive error handling and logging
ini_set('log_errors', '1');
ini_set('error_log', __DIR__ . '/../logs/app.log');
require_once __DIR__ . '/ErrorHandler.php';
require_once __DIR__ . '/Logger.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/Config.php';
require_once __DIR__ . '/TenantContext.php';
require_once __DIR__ . '/RBACMiddleware.php';
require_once __DIR__ . '/OwnershipCheck.php';

// Register error handlers - wrap in try-catch to prevent bootstrap failures
try {
    ErrorHandler::register();
} catch (Exception $e) {
    // If error handler registration fails, continue anyway
    error_log('Failed to register error handler: ' . $e->getMessage());
}

// Start request timing for performance monitoring
Response::startTiming();

// Simple autoloader for controllers and src files to avoid massive require_once blocks
spl_autoload_register(function ($class) {
    // Handle namespaces by taking the base name (for inconsistent project structure)
    $parts = explode('\\', $class);
    $className = end($parts);
    
    $controllersDir = __DIR__ . '/controllers/';
    $servicesDir = __DIR__ . '/services/';
    $srcDir = __DIR__ . '/';
    
    // Check controllers first
    $file = $controllersDir . $className . '.php';
    if (file_exists($file)) {
        require_once $file;
        return;
    }
    
    // Check services directory
    $file = $servicesDir . $className . '.php';
    if (file_exists($file)) {
        require_once $file;
        return;
    }
    
    // Check src directory
    $file = $srcDir . $className . '.php';
    if (file_exists($file)) {
        require_once $file;
        return;
    }
});

function get_json_body(): array {
    $raw = file_get_contents('php://input');
    if ($GLOBALS['isDev'] ?? false) {
        Logger::debug('Raw input: ' . $raw);
    }
    
    if ($raw) {
        $data = json_decode($raw, true);
        if ($GLOBALS['isDev'] ?? false) {
            Logger::debug('Decoded data: ' . json_encode($data));
        }
        if (is_array($data)) return $data;
    }
    
    // Fallbacks for non-JSON encodings
    if (!empty($_POST)) {
        if ($GLOBALS['isDev'] ?? false) {
            Logger::debug('Using $_POST: ' . json_encode($_POST));
        }
        return $_POST;
    }
    
    $params = [];
    parse_str($raw ?? '', $params);
    if (!empty($params)) {
        if ($GLOBALS['isDev'] ?? false) {
            Logger::debug('Using parsed params: ' . json_encode($params));
        }
        return $params;
    }
    
    if ($GLOBALS['isDev'] ?? false) {
        Logger::debug('No body data found');
    }
    return [];
}

function get_query(string $key, $default = null) {
    return $_GET[$key] ?? $default;
}

function get_header(string $name): ?string {
    // Check if getallheaders function exists (not available in CLI)
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $k => $v) {
            if (strtolower($k) === strtolower($name)) return $v;
        }
    }
    
    // Fallbacks for Authorization header in environments where getallheaders omits it
    if (strtolower($name) === 'authorization') {
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) return $_SERVER['HTTP_AUTHORIZATION'];
        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    
    // Check $_SERVER for other headers
    $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    if (!empty($_SERVER[$serverKey])) return $_SERVER[$serverKey];
    
    return null;
}

function get_json_input(): array {
    return get_json_body();
}

/**
 * Global compatibility functions for Helpdesk controllers
 */
if (!function_exists('getDBConnection')) {
    function getDBConnection() {
        return \Xordon\Database::conn();
    }
}

if (!function_exists('requireAuth')) {
    function requireAuth() {
        if (!class_exists('\\Auth')) {
             require_once __DIR__ . '/Auth.php';
        }
        $userId = \Auth::userIdOrFail();
        $workspace = \Auth::resolveWorkspace($userId);
        if (!$workspace) {
            if (class_exists('\\Xordon\\Response')) {
                \Xordon\Response::error('Workspace not found', 404);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Workspace not found']);
            }
            exit;
        }
        return [
            'id' => $userId,
            'workspace_id' => $workspace['id'],
            'name' => 'User' // placeholder
        ];
    }
}

if (!function_exists('jsonResponse')) {
    function jsonResponse($data, $status = 200) {
        if (class_exists('\\Xordon\\Response')) {
            \Xordon\Response::json($data, $status);
        } else {
            http_response_code($status);
            header('Content-Type: application/json');
            echo json_encode($data);
            exit;
        }
    }
}