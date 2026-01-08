<?php

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';
require_once __DIR__ . '/../Logger.php';

use Xordon\Database;
use Xordon\Response;
use Xordon\Auth;

class SystemToolsController {
    
    /**
     * Check if user is admin, fail if not
     */
    private static function isAdminOrFail(): void {
        $user = Auth::user();
        if (!$user) {
            Response::json(['error' => 'Unauthorized'], 401);
            exit;
        }
        
        $rbac = RBACService::getInstance();
        if (!$rbac->isAdmin($user['id'])) {
            Response::json(['error' => 'Forbidden - Admin access required'], 403);
            exit;
        }
    }

    /**
     * Get application logs with filtering
     * GET /api/system/tools/logs?lines=100&level=ERROR
     */
    public static function getLogs(): void {
        try {
            self::isAdminOrFail();
            
            $lines = isset($_GET['lines']) ? (int)$_GET['lines'] : 100;
            $level = isset($_GET['level']) ? strtoupper($_GET['level']) : null;
            
            $logFile = __DIR__ . '/../../logs/app.log';
            
            if (!file_exists($logFile)) {
                Response::json([
                    'success' => true,
                    'logs' => [],
                    'message' => 'Log file not found'
                ]);
                return;
            }
            
            // Read last N lines efficiently
            $file = new SplFileObject($logFile, 'r');
            $file->seek(PHP_INT_MAX);
            $totalLines = $file->key() + 1;
            
            $startLine = max(0, $totalLines - $lines);
            $logs = [];
            
            $file->seek($startLine);
            while (!$file->eof()) {
                $line = trim($file->fgets());
                if (empty($line)) continue;
                
                // Parse log line (assuming format: [YYYY-MM-DD HH:MM:SS] LEVEL: message)
                if (preg_match('/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.+)$/', $line, $matches)) {
                    $logLevel = $matches[2];
                    
                    // Filter by level if specified
                    if ($level && $logLevel !== $level) {
                        continue;
                    }
                    
                    $logs[] = [
                        'timestamp' => $matches[1],
                        'level' => $logLevel,
                        'message' => $matches[3]
                    ];
                } else {
                    // If line doesn't match format, include it as-is
                    if (!$level) {
                        $logs[] = [
                            'timestamp' => '',
                            'level' => 'UNKNOWN',
                            'message' => $line
                        ];
                    }
                }
            }
            
            Response::json([
                'success' => true,
                'logs' => $logs,
                'total_lines' => $totalLines
            ]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get cache keys (file-based cache)
     * GET /api/system/tools/cache
     */
    public static function getCacheKeys(): void {
        try {
            self::isAdminOrFail();
            
            $cacheDir = __DIR__ . '/../../cache';
            $keys = [];
            
            if (is_dir($cacheDir)) {
                $files = scandir($cacheDir);
                foreach ($files as $file) {
                    if ($file === '.' || $file === '..') continue;
                    
                    $filePath = $cacheDir . '/' . $file;
                    if (is_file($filePath)) {
                        $keys[] = [
                            'key' => $file,
                            'size' => filesize($filePath),
                            'modified' => date('Y-m-d H:i:s', filemtime($filePath))
                        ];
                    }
                }
            }
            
            Response::json([
                'success' => true,
                'keys' => $keys,
                'count' => count($keys)
            ]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a specific cache key
     * DELETE /api/system/tools/cache/:key
     */
    public static function deleteCacheKey(string $key): void {
        try {
            self::isAdminOrFail();
            
            // Sanitize key to prevent directory traversal
            $key = basename($key);
            $cacheFile = __DIR__ . '/../../cache/' . $key;
            
            if (!file_exists($cacheFile)) {
                Response::json(['success' => false, 'error' => 'Cache key not found'], 404);
                return;
            }
            
            if (unlink($cacheFile)) {
                Response::json([
                    'success' => true,
                    'message' => 'Cache key deleted successfully'
                ]);
            } else {
                Response::json(['success' => false, 'error' => 'Failed to delete cache key'], 500);
            }
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get real-time server resource stats (CPU, RAM)
     * GET /api/system/tools/resources
     */
    public static function getServerResources(): void {
        try {
            self::isAdminOrFail();
            
            $stats = [
                'cpu' => self::getCpuUsage(),
                'memory' => self::getMemoryUsage(),
                'disk' => self::getDiskUsage(),
                'timestamp' => time()
            ];
            
            Response::json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get CPU usage (Windows/Linux compatible)
     */
    private static function getCpuUsage(): array {
        $cpuUsage = 0;
        $cores = 1;
        
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows
            try {
                $output = shell_exec('wmic cpu get loadpercentage');
                if ($output) {
                    preg_match('/\d+/', $output, $matches);
                    $cpuUsage = isset($matches[0]) ? (int)$matches[0] : 0;
                }
                
                $coreOutput = shell_exec('wmic cpu get NumberOfCores');
                if ($coreOutput) {
                    preg_match('/\d+/', $coreOutput, $coreMatches);
                    $cores = isset($coreMatches[0]) ? (int)$coreMatches[0] : 1;
                }
            } catch (Exception $e) {
                // Fallback
            }
        } else {
            // Linux/Unix
            try {
                $load = sys_getloadavg();
                $cores = (int)shell_exec('nproc') ?: 1;
                $cpuUsage = round(($load[0] / $cores) * 100, 2);
            } catch (Exception $e) {
                // Fallback
            }
        }
        
        return [
            'current' => $cpuUsage,
            'cores' => $cores
        ];
    }

    /**
     * Get memory usage
     */
    private static function getMemoryUsage(): array {
        $memoryUsed = memory_get_usage(true);
        $memoryLimit = ini_get('memory_limit');
        
        // Convert memory_limit to bytes
        $memoryLimitBytes = self::convertToBytes($memoryLimit);
        
        return [
            'used' => round($memoryUsed / 1024 / 1024, 2), // MB
            'total' => round($memoryLimitBytes / 1024 / 1024, 2), // MB
            'percent' => $memoryLimitBytes > 0 ? round(($memoryUsed / $memoryLimitBytes) * 100, 2) : 0
        ];
    }

    /**
     * Get disk usage
     */
    private static function getDiskUsage(): array {
        $diskTotal = disk_total_space(__DIR__);
        $diskFree = disk_free_space(__DIR__);
        $diskUsed = $diskTotal - $diskFree;
        
        return [
            'used' => round($diskUsed / 1024 / 1024 / 1024, 2), // GB
            'total' => round($diskTotal / 1024 / 1024 / 1024, 2), // GB
            'percent' => $diskTotal > 0 ? round(($diskUsed / $diskTotal) * 100, 2) : 0
        ];
    }

    /**
     * Convert PHP memory notation to bytes
     */
    private static function convertToBytes(string $value): int {
        $value = trim($value);
        $last = strtolower($value[strlen($value)-1]);
        $value = (int)$value;
        
        switch($last) {
            case 'g':
                $value *= 1024;
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }
        
        return $value;
    }

    /**
     * Test email configuration by sending a test email
     * POST /api/system/tools/test-email
     */
    public static function testEmail(): void {
        try {
            self::isAdminOrFail();
            
            $data = json_decode(file_get_contents('php://input'), true);
            $email = $data['email'] ?? null;
            
            if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Response::json(['success' => false, 'error' => 'Valid email address required'], 400);
                return;
            }
            
            require_once __DIR__ . '/../services/NotificationSender.php';
            
            // Assuming workspace_id 1 for system tests or fetch current user's workspace
            $workspaceId = Auth::user()['workspace_id'] ?? 1;
            
            $result = NotificationSender::sendEmail(
                $workspaceId,
                $email,
                'System Health Test Email',
                '<h1>It Works!</h1><p>This is a test email from your System Health Dashboard.</p><p>Time: ' . date('c') . '</p>',
                'It Works! This is a test email from your System Health Dashboard.'
            );
            
            if ($result['success']) {
                Response::json(['success' => true, 'message' => 'Test email sent successfully']);
            } else {
                Response::json(['success' => false, 'error' => $result['error']]);
            }
            
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get or set maintenance mode
     * GET /api/system/tools/maintenance
     * POST /api/system/tools/maintenance
     */
    public static function maintenanceMode(): void {
        try {
            self::isAdminOrFail();
            
            $maintenanceFile = __DIR__ . '/../../maintenance.flag';
            
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                Response::json([
                    'success' => true,
                    'enabled' => file_exists($maintenanceFile),
                    'timestamp' => file_exists($maintenanceFile) ? filemtime($maintenanceFile) : null
                ]);
                return;
            }
            
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $enable = $data['enabled'] ?? false;
                
                if ($enable) {
                    file_put_contents($maintenanceFile, json_encode([
                        'time' => time(),
                        'user' => Auth::user()['id']
                    ]));
                    Response::json(['success' => true, 'enabled' => true, 'message' => 'Maintenance mode enabled']);
                } else {
                    if (file_exists($maintenanceFile)) {
                        unlink($maintenanceFile);
                    }
                    Response::json(['success' => true, 'enabled' => false, 'message' => 'Maintenance mode disabled']);
                }
            }
            
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
