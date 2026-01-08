<?php
// Load environment variables from .env file
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}

require_once __DIR__ . '/../src/bootstrap.php';
require_once __DIR__ . '/../src/Database.php';

$pdo = Database::conn();

echo "Starting phone system schema update...\n";

try {
    // 1. Update phone_numbers table
    echo "Updating phone_numbers table...\n";
    
    $columns = [
        'forwarding_number' => 'VARCHAR(20) DEFAULT NULL',
        'pass_call_id' => 'BOOLEAN DEFAULT FALSE',
        'whisper_message' => 'TEXT DEFAULT NULL',
        'call_recording' => 'BOOLEAN DEFAULT FALSE',
        'tracking_campaign' => 'VARCHAR(255) DEFAULT NULL',
        'destination_type' => "VARCHAR(20) DEFAULT 'forward'"
    ];

    foreach ($columns as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE phone_numbers ADD COLUMN $col $def");
            echo "Added column $col to phone_numbers\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
                echo "Column $col already exists in phone_numbers\n";
            } else {
                throw $e;
            }
        }
    }

    // 2. Update phone_call_logs table
    echo "Updating phone_call_logs table...\n";
    
    $logColumns = [
        'recording_url' => 'TEXT DEFAULT NULL',
        'tracking_campaign' => 'VARCHAR(255) DEFAULT NULL',
        'recording_sid' => 'VARCHAR(100) DEFAULT NULL',
        'recording_duration' => 'INTEGER DEFAULT NULL'
    ];

    foreach ($logColumns as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE phone_call_logs ADD COLUMN $col $def");
            echo "Added column $col to phone_call_logs\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
                echo "Column $col already exists in phone_call_logs\n";
            } else {
                throw $e;
            }
        }
    }

    // 3. Create voicemails table
    echo "Creating voicemails table...\n";
    
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS voicemails (
            id INT AUTO_INCREMENT PRIMARY KEY,
            phone_number_id INT NOT NULL,
            workspace_id INT NOT NULL,
            user_id INT NOT NULL,
            contact_id INT DEFAULT NULL,
            from_number VARCHAR(20) NOT NULL,
            audio_url TEXT NOT NULL,
            transcription TEXT DEFAULT NULL,
            duration_seconds INT DEFAULT 0,
            status VARCHAR(20) DEFAULT 'new',
            read_at TIMESTAMP NULL,
            received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE CASCADE,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Voicemails table created/verified\n";

    echo "Schema update completed successfully!\n";

} catch (Exception $e) {
    echo "Error updating schema: " . $e->getMessage() . "\n";
    exit(1);
}
