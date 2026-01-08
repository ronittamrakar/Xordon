<?php
require_once __DIR__ . '/Config.php';

class Cors {
    public static function handle(): void {
        // Get the origin from the request
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        $allowed = Config::get('CORS_ALLOWED_ORIGINS', [
            'http://localhost:9000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:3003',
            'http://localhost:3000',
            'http://localhost:8081',
            'http://localhost:8082',
            'http://localhost:8083',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:4173'
        ]);
        if (is_string($allowed)) {
            $allowed = array_values(array_filter(array_map('trim', explode(',', $allowed))));
        }
        if (!is_array($allowed)) {
            $allowed = [];
        }
        
        // Check if the origin is allowed
        if ($origin !== '' && (in_array($origin, $allowed, true) || in_array('*', $allowed, true))) {
            header("Access-Control-Allow-Origin: $origin");
        }
        
        // Set other CORS headers
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Workspace-Id');
        header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours
        
        // Handle preflight OPTIONS request
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}