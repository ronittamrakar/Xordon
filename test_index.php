<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/auth/me';
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer def05a1a88c2653a6ee5aa27485575b0546b6286a712c3e1';
$_SERVER['HTTP_HOST'] = 'localhost';

try {
    require_once 'backend/public/index.php';
} catch (Throwable $e) {
    echo "Caught: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
