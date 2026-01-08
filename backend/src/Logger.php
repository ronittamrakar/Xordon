<?php
namespace Xordon;

class Logger {
    private static $logDir = null;
    private static $logLevel = 'INFO';
    private static $structured = false;
    
    const LEVELS = [
        'DEBUG' => 0,
        'INFO' => 1,
        'WARNING' => 2,
        'ERROR' => 3,
        'CRITICAL' => 4
    ];
    
    public static function init() {
        try {
            if (class_exists('\\Config')) {
                self::$logDir = \Config::get('LOG_FILE') ? dirname(\Config::get('LOG_FILE')) : __DIR__ . '/../logs';
                self::$logLevel = \Config::get('LOG_LEVEL', 'INFO');
                self::$structured = \Config::isProduction();
            } else {
                self::$logDir = __DIR__ . '/../logs';
                self::$logLevel = 'INFO';
                self::$structured = false;
            }
            if (!is_dir(self::$logDir)) {
                @mkdir(self::$logDir, 0755, true);
            }
        } catch (Exception $e) {
            self::$logDir = __DIR__ . '/../logs';
            self::$logLevel = 'INFO';
            self::$structured = false;
            error_log('Logger::init failed: ' . $e->getMessage());
        }
    }
    
    public static function debug($message, $context = []) {
        self::log('DEBUG', $message, $context);
    }
    
    public static function info($message, $context = []) {
        self::log('INFO', $message, $context);
    }
    
    public static function warning($message, $context = []) {
        self::log('WARNING', $message, $context);
    }
    
    public static function error($message, $context = []) {
        self::log('ERROR', $message, $context);
    }
    
    public static function critical($message, $context = []) {
        self::log('CRITICAL', $message, $context);
    }
    
    public static function apiRequest($method, $path, $userId = null, $responseTime = null) {
        $context = [
            'method' => $method,
            'path' => $path,
            'user_id' => $userId,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        if ($responseTime !== null) {
            $context['response_time_ms'] = round($responseTime * 1000, 2);
        }
        self::log('INFO', "API Request: $method $path", $context);
    }
    
    public static function apiError($method, $path, $error, $userId = null) {
        $context = [
            'method' => $method,
            'path' => $path,
            'user_id' => $userId,
            'error' => $error,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        self::log('ERROR', "API Error: $method $path - $error", $context);
    }
    
    public static function databaseQuery($query, $params = [], $executionTime = null) {
        $context = [
            'query' => $query,
            'params' => $params
        ];
        if ($executionTime !== null) {
            $context['execution_time_ms'] = round($executionTime * 1000, 2);
        }
        self::log('DEBUG', "Database Query", $context);
    }
    
    public static function databaseError($query, $error, $params = []) {
        $context = [
            'query' => $query,
            'params' => $params,
            'error' => $error
        ];
        self::log('ERROR', "Database Error", $context);
    }
    
    private static function log($level, $message, $context = []) {
        if (!self::$logDir) {
            self::init();
        }
        if (!isset(self::LEVELS[$level]) || self::LEVELS[$level] < self::LEVELS[self::$logLevel]) {
            return;
        }
        self::logToFile($level, $message, $context);
    }
    
    private static function formatLogEntry(string $level, string $message, array $context): string {
        $timestamp = date('Y-m-d H:i:s');
        if (self::$structured) {
            return json_encode([
                'timestamp' => $timestamp,
                'level' => $level,
                'message' => $message,
                'context' => $context
            ]) . PHP_EOL;
        }
        $contextStr = empty($context) ? '' : ' ' . json_encode($context);
        return "[$timestamp] [$level] $message$contextStr" . PHP_EOL;
    }
    
    public static function logToFile(string $level, string $message, array $context = []): void {
        if (!self::$logDir) {
            self::init();
        }
        try {
            $logFile = self::$logDir . '/app.log';
            $logEntry = self::formatLogEntry($level, $message, $context);
            @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
        } catch (Exception $e) {
            error_log('Logger::logToFile failed: ' . $e->getMessage());
        }
    }

    public static function getLogFiles(): array {
        if (!self::$logDir) {
            self::init();
        }
        
        $files = [];
        if (is_dir(self::$logDir)) {
            $dh = opendir(self::$logDir);
            if ($dh) {
                while (($file = readdir($dh)) !== false) {
                    if ($file !== '.' && $file !== '..' && is_file(self::$logDir . '/' . $file)) {
                        $files[] = $file;
                    }
                }
                closedir($dh);
            }
        }
        
        rsort($files);
        return $files;
    }
    
    public static function getLogContent(string $filename, int $lines = 100): ?string {
        if (!self::$logDir) {
            self::init();
        }
        
        $filename = basename($filename);
        $filepath = self::$logDir . '/' . $filename;
        
        if (!file_exists($filepath)) {
            return null;
        }
        
        try {
            $file = new SplFileObject($filepath, 'r');
            $file->seek(PHP_INT_MAX);
            $totalLines = $file->key();
            
            $start = max(0, $totalLines - $lines);
            $file->seek($start);
            
            $content = '';
            while (!$file->eof()) {
                $content .= $file->current();
                $file->next();
            }
            return $content;
        } catch (Exception $e) {
            $data = @file($filepath);
            if ($data === false) return null;
            return implode("", array_slice($data, -$lines));
        }
    }
    
    public static function cleanOldLogs(int $daysToKeep = 30): void {
        if (!self::$logDir) {
            self::init();
        }
        
        if (!is_dir(self::$logDir)) return;
        
        $threshold = time() - ($daysToKeep * 86400);
        $dh = opendir(self::$logDir);
        if ($dh) {
            while (($file = readdir($dh)) !== false) {
                if ($file !== '.' && $file !== '..' && $file !== 'app.log') {
                    $filepath = self::$logDir . '/' . $file;
                    if (filemtime($filepath) < $threshold) {
                        @unlink($filepath);
                    }
                }
            }
            closedir($dh);
        }
    }
}

// Global alias for compatibility
if (!class_exists('\\Logger')) {
    class_alias('\\Xordon\\Logger', '\\Logger');
}
