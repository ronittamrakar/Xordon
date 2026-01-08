<?php
require_once __DIR__ . '/../../../src/bootstrap.php';
require_once __DIR__ . '/../../../src/Auth.php';
require_once __DIR__ . '/../../../src/SecurityHeaders.php';

header('Content-Type: application/json');
SecurityHeaders::applyCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    Auth::userIdOrFail();

    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }

    $file = $_FILES['file'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!class_exists('finfo')) {
        throw new Exception('File upload unavailable: missing fileinfo extension');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    if (!in_array($mime, $allowedTypes, true)) {
        throw new Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }

    if ($file['size'] > 5 * 1024 * 1024) { // 5MB limit
        throw new Exception('File too large. Maximum size is 5MB.');
    }

    $uploadDir = realpath(__DIR__ . '/../../../storage') ?: (__DIR__ . '/../../../storage');
    $uploadDir = rtrim($uploadDir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $extMap = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
    ];
    $ext = $extMap[$mime] ?? 'bin';
    $filename = bin2hex(random_bytes(16)) . '.' . $ext;
    $filepath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to move uploaded file.');
    }

    @chmod($filepath, 0644);

    $publicUrl = '/storage/uploads/' . $filename;
    
    echo json_encode([
        'success' => true,
        'data' => [
            'url' => $publicUrl,
            'filename' => $filename,
            'size' => $file['size'],
            'type' => $mime
        ]
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
