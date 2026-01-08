<?php
/**
 * Database Backup Script
 * Creates compressed backups of the database
 */

require_once __DIR__ . '/../src/bootstrap.php';

$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbName = getenv('DB_NAME') ?: 'xordon';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';

$backupDir = __DIR__ . '/../storage/backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

$date = date('Y-m-d_H-i-s');
$backupFile = $backupDir . "/backup_$dbName_$date.sql";
$gzFile = $backupFile . '.gz';

echo "[" . date('Y-m-d H:i:s') . "] Starting database backup...\n";

try {
    // Use mysqldump command
    $command = sprintf(
        'mysqldump -h%s -u%s %s %s > %s',
        escapeshellarg($dbHost),
        escapeshellarg($dbUser),
        $dbPass ? '-p' . escapeshellarg($dbPass) : '',
        escapeshellarg($dbName),
        escapeshellarg($backupFile)
    );
    
    exec($command, $output, $returnCode);
    
    if ($returnCode !== 0) {
        throw new Exception("mysqldump failed with code $returnCode");
    }
    
    echo "[" . date('Y-m-d H:i:s') . "] Backup created: $backupFile\n";
    
    // Compress backup
    if (file_exists($backupFile)) {
        $gz = gzopen($gzFile, 'w9');
        $fp = fopen($backupFile, 'r');
        
        while (!feof($fp)) {
            gzwrite($gz, fread($fp, 8192));
        }
        
        fclose($fp);
        gzclose($gz);
        unlink($backupFile);
        
        $size = round(filesize($gzFile) / 1024 / 1024, 2);
        echo "[" . date('Y-m-d H:i:s') . "] Compressed backup: $gzFile ({$size}MB)\n";
    }
    
    // Clean up old backups (keep last 30 days)
    $files = glob($backupDir . '/backup_*.sql.gz');
    foreach ($files as $file) {
        if (time() - filemtime($file) > 30 * 86400) {
            unlink($file);
            echo "[" . date('Y-m-d H:i:s') . "] Deleted old backup: " . basename($file) . "\n";
        }
    }
    
    echo "[" . date('Y-m-d H:i:s') . "] Database backup completed\n";
    
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] Error: " . $e->getMessage() . "\n";
    exit(1);
}

exit(0);
