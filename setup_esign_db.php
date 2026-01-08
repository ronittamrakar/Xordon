<?php
require_once __DIR__ . '/backend/src/Database.php';

// Load .env
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim($value);
            putenv(sprintf('%s=%s', trim($name), trim($value)));
        }
    }
}

try {
    $db = Database::conn();
    echo "Connected to database.\n";

    $queries = [
        // E-Sign Envelopes (The container for the signing process)
        "CREATE TABLE IF NOT EXISTS esign_envelopes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            email_subject VARCHAR(255),
            email_body TEXT,
            status ENUM('draft', 'sent', 'completed', 'declined', 'voided', 'expired') DEFAULT 'draft',
            created_by INT COMMENT 'User ID',
            sent_at DATETIME,
            completed_at DATETIME,
            expires_at DATETIME,
            metadata TEXT COMMENT 'JSON',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_company (company_id),
            INDEX idx_status (status)
        )",

        // E-Sign Documents (Files inside the envelope)
        "CREATE TABLE IF NOT EXISTS esign_documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            envelope_id INT NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) DEFAULT 'application/pdf',
            file_size INT,
            document_order INT DEFAULT 0,
            original_checksum VARCHAR(64) COMMENT 'SHA-256',
            signed_checksum VARCHAR(64) COMMENT 'SHA-256 after signing',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (envelope_id) REFERENCES esign_envelopes(id) ON DELETE CASCADE
        )",

        // E-Sign Signers (Recipients)
        "CREATE TABLE IF NOT EXISTS esign_signers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            envelope_id INT NOT NULL,
            recipient_email VARCHAR(255) NOT NULL,
            recipient_name VARCHAR(255) NOT NULL,
            routing_order INT DEFAULT 1,
            role_name VARCHAR(50) DEFAULT 'Signer 1',
            status ENUM('created', 'sent', 'viewed', 'signed', 'declined') DEFAULT 'created',
            access_code VARCHAR(50) COMMENT 'Optional security',
            signing_url_token VARCHAR(255) UNIQUE,
            viewed_at DATETIME,
            signed_at DATETIME,
            ip_address VARCHAR(45),
            signature_image_path VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (envelope_id) REFERENCES esign_envelopes(id) ON DELETE CASCADE
        )",

        // E-Sign Audit Log (Legal Compliance)
        "CREATE TABLE IF NOT EXISTS esign_audit_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            envelope_id INT NOT NULL,
            user_id INT COMMENT 'If action by internal user',
            signer_email VARCHAR(255) COMMENT 'If action by external signer',
            action VARCHAR(100) NOT NULL COMMENT 'sent, viewed, signed, downloaded',
            description TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (envelope_id) REFERENCES esign_envelopes(id) ON DELETE CASCADE
        )"
    ];

    foreach ($queries as $sql) {
        $db->exec($sql);
        echo "Executed table creation.\n";
    }

    echo "E-Sign tables setup complete.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
