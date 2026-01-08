<?php
/**
 * QR Codes API Routes
 */

require_once __DIR__ . '/../../src/controllers/QrCodeController.php';

$path = $_GET['path'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// List
if ($path === 'qr-codes' && $method === 'GET') {
    return QrCodeController::list();
}

// Create
if ($path === 'qr-codes' && $method === 'POST') {
    return QrCodeController::create();
}

// Quick Generate
if ($path === 'qr-codes/quick' && $method === 'POST') {
    return QrCodeController::quickGenerate();
}

// Analytics Overview
if ($path === 'qr-codes/analytics/overview' && $method === 'GET') {
    return QrCodeController::getOverviewAnalytics();
}

// Single Item Routes
if (preg_match('#^qr-codes/([0-9]+)$#', $path, $m)) {
    $id = $m[1];
    if ($method === 'GET') return QrCodeController::get($id);
    if ($method === 'PUT') return QrCodeController::update($id);
    if ($method === 'DELETE') return QrCodeController::delete($id);
}

// Single Analytics
if (preg_match('#^qr-codes/([0-9]+)/analytics$#', $path, $m) && $method === 'GET') {
    return QrCodeController::getAnalytics($m[1]);
}

// Entity Specific Generators (Proxies to Create)
if (preg_match('#^qr-codes/(booking-page|review|form|payment|website)$#', $path, $m) && $method === 'POST') {
    // Logic could be handled here or just call create with pre-filled type
    return QrCodeController::create();
}

Response::json(['error' => 'QR Code API endpoint not found', 'path' => $path], 404);
