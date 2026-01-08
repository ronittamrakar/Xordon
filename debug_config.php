<?php
require_once __DIR__ . '/backend/src/Config.php';
use Xordon\Config;

echo "DBHOST: " . Config::get('DB_HOST') . "\n";
echo "DBNAME: " . Config::get('DB_NAME') . "\n";
echo "DBUSER: " . Config::get('DB_USER') . "\n";
echo "DBPASS: " . (Config::get('DB_PASS') ? '***' : 'EMPTY') . "\n";
echo "APP_ENV: " . Config::get('APP_ENV') . "\n";
