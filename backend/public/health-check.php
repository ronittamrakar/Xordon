<?php
/**
 * Database Health Check Endpoint
 * Can be called periodically to ensure database connection is alive
 */

require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Response.php';
require_once __DIR__ . '/../src/Auth.php';

header('Content-Type: application/json');

// Load environment variables from .env file (mirrors backend/public/index.php)
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);

            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}

try {
    $env = getenv('APP_ENV') ?: '';
    $isDev = ($env === 'development' || $env === 'dev');
    $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '';
    $isLocal = ($remoteAddr === '127.0.0.1' || $remoteAddr === '::1');
    if (!$isDev && !$isLocal) {
        Auth::userIdOrFail();
    }

    // Ensure we attempt a connection so health-check is meaningful.
    // Database::getHealthStatus() only reports on an already-established connection.
    try {
        Database::conn();
    } catch (Exception $e) {
        // Connection errors will be reflected below via getHealthStatus() message.
    }

    $health = Database::getHealthStatus();
    
    // Try to get some basic stats
    if ($health['connected']) {
        $db = Database::conn();
        
        // Get table count
        $stmt = $db->query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()");
        $result = $stmt->fetch();
        $health['table_count'] = $result['count'];
        
        // Get user count
        $stmt = $db->query("SELECT COUNT(*) as count FROM users");
        $result = $stmt->fetch();
        $health['user_count'] = $result['count'];
        
        // Get uptime info
        $health['php_version'] = PHP_VERSION;
        $health['timestamp'] = date('Y-m-d H:i:s');
    }
    
    $statusCode = $health['connected'] ? 200 : 503;
    http_response_code($statusCode);
    
    echo json_encode([
        'status' => $health['connected'] ? 'healthy' : 'unhealthy',
        'health' => $health
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(503);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
