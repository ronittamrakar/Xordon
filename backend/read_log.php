<?php
$logFile = 'd:/Backup/App Backups/Xordon/backend/logs/app.log';
if (file_exists($logFile)) {
    $f = fopen($logFile, 'rb');
    fseek($f, -5000, SEEK_END);
    echo fread($f, 5000);
    fclose($f);
} else {
    echo "Log file not found\n";
}
