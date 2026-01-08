<?php
$logFile = __DIR__ . '/backend/logs/app.log';
if (file_exists($logFile)) {
    $lines = file($logFile);
    $lastLines = array_slice($lines, -100);
    file_put_contents('last_logs.txt', implode("", $lastLines));
    echo "Done";
} else {
    echo "Log file not found";
}
