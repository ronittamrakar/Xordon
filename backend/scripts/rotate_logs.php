<?php
/**
 * Log Rotation Script
 * Automatically archives old logs and prevents disk space issues
 */

// Configuration
$logDir = __DIR__ . '/../logs';
$archiveDir = __DIR__ . '/../logs/archive';
$maxLogSize = 10 * 1024 * 1024; // 10MB
$maxAge = 7; // days

// Ensure archive directory exists
if (!is_dir($archiveDir)) {
    mkdir($archiveDir, 0755, true);
}

// Get current timestamp
$now = time();

// Scan log directory
$files = glob($logDir . '/*.log');

foreach ($files as $file) {
    $filename = basename($file);
    $filesize = filesize($file);
    $filemtime = filemtime($file);
    $age = ($now - $filemtime) / 86400; // days

    // Archive if too large or too old
    if ($filesize > $maxLogSize || $age > $maxAge) {
        $archiveName = $archiveDir . '/' . pathinfo($filename, PATHINFO_FILENAME) . '_' . date('Y-m-d_H-i-s', $filemtime) . '.log';
        
        // Compress and move to archive
        if (function_exists('gzopen')) {
            $gzFile = $archiveName . '.gz';
            $gz = gzopen($gzFile, 'w9');
            $fp = fopen($file, 'r');
            
            while (!feof($fp)) {
                gzwrite($gz, fread($fp, 8192));
            }
            
            fclose($fp);
            gzclose($gz);
            unlink($file);
            
            echo "Archived and compressed: $filename -> " . basename($gzFile) . "\n";
        } else {
            // Just move if compression not available
            rename($file, $archiveName);
            echo "Archived: $filename -> " . basename($archiveName) . "\n";
        }
        
        // Create new empty log file
        touch($file);
        chmod($file, 0644);
    }
}

// Clean up very old archives (older than 30 days)
$archiveFiles = glob($archiveDir . '/*');
foreach ($archiveFiles as $archiveFile) {
    $filemtime = filemtime($archiveFile);
    $age = ($now - $filemtime) / 86400;
    
    if ($age > 30) {
        unlink($archiveFile);
        echo "Deleted old archive: " . basename($archiveFile) . "\n";
    }
}

echo "Log rotation completed.\n";
