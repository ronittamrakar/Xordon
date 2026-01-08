<?php
$file = 'backend/logs/app.log';
if (!file_exists($file)) {
    echo "Log file not found";
    exit;
}
$fp = fopen($file, 'r');
fseek($fp, -2000, SEEK_END);
echo fread($fp, 2000);
fclose($fp);
