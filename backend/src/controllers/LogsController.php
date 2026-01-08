<?php
require_once __DIR__ . '/../Logger.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Response.php';

class LogsController {
    public function getLogFiles(): void {
        // Only allow authenticated users to view logs
        Auth::userIdOrFail();
        
        try {
            $files = Logger::getLogFiles();
            Response::success(['log_files' => $files]);
        } catch (Exception $e) {
            Logger::error('Failed to get log files', [
                'error' => $e->getMessage()
            ]);
            Response::serverError('Failed to retrieve log files', $e);
        }
    }
    
    public function getLogContent(): void {
        // Only allow authenticated users to view logs
        Auth::userIdOrFail();
        
        try {
            $filename = get_query('filename');
            $lines = (int)(get_query('lines', 100));
            
            if (!$filename) {
                Response::validationError('Filename is required');
                return;
            }
            
            // Validate filename to prevent directory traversal
            if (strpos($filename, '..') !== false || strpos($filename, '/') !== false || strpos($filename, '\\') !== false) {
                Response::validationError('Invalid filename');
                return;
            }
            
            $content = Logger::getLogContent($filename, $lines);
            
            if ($content === null) {
                Response::notFound('Log file not found');
                return;
            }
            
            Response::success([
                'filename' => $filename,
                'content' => $content,
                'lines_requested' => $lines
            ]);
        } catch (Exception $e) {
            Logger::error('Failed to get log content', [
                'error' => $e->getMessage(),
                'filename' => $filename ?? 'unknown'
            ]);
            Response::serverError('Failed to retrieve log content', $e);
        }
    }
    
    public function cleanOldLogs(): void {
        // Only allow authenticated users to clean logs
        Auth::userIdOrFail();
        
        try {
            $daysToKeep = (int)(get_query('days', 30));
            
            if ($daysToKeep < 1) {
                Response::validationError('Days to keep must be at least 1');
                return;
            }
            
            Logger::cleanOldLogs($daysToKeep);
            
            Response::success([
                'message' => 'Old logs cleaned successfully',
                'days_kept' => $daysToKeep
            ]);
        } catch (Exception $e) {
            Logger::error('Failed to clean old logs', [
                'error' => $e->getMessage(),
                'days_to_keep' => $daysToKeep ?? 30
            ]);
            Response::serverError('Failed to clean old logs', $e);
        }
    }
    
    public function getLogStats(): void {
        // Only allow authenticated users to view log stats
        Auth::userIdOrFail();
        
        try {
            $files = Logger::getLogFiles();
            $stats = [];
            
            foreach ($files as $file) {
                $filepath = __DIR__ . '/../../logs/' . $file;
                if (file_exists($filepath)) {
                    $stats[] = [
                        'filename' => $file,
                        'size' => filesize($filepath),
                        'size_human' => $this->formatBytes(filesize($filepath)),
                        'modified' => date('Y-m-d H:i:s', filemtime($filepath)),
                        'lines' => $this->countLines($filepath)
                    ];
                }
            }
            
            // Sort by modification time (newest first)
            usort($stats, function($a, $b) {
                return strcmp($b['modified'], $a['modified']);
            });
            
            Response::success([
                'log_stats' => $stats,
                'total_files' => count($stats)
            ]);
        } catch (Exception $e) {
            Logger::error('Failed to get log stats', [
                'error' => $e->getMessage()
            ]);
            Response::serverError('Failed to retrieve log statistics', $e);
        }
    }
    
    private function formatBytes(int $bytes, int $precision = 2): string {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
    
    private function countLines(string $filepath): int {
        try {
            $file = new SplFileObject($filepath, 'r');
            $file->seek(PHP_INT_MAX);
            return $file->key() + 1;
        } catch (Exception $e) {
            return 0;
        }
    }
}