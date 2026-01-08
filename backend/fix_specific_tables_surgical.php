<?php
require_once __DIR__ . '/src/Database.php';
use Xordon\Database;

echo "Starting Surgical Table Repair...\n";

$pdo = Database::conn();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$tables = [
    'ad_performance_metrics' => "
        CREATE TABLE IF NOT EXISTS ad_performance_metrics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            campaign_id INT NOT NULL,
            date DATE NOT NULL,
            impressions INT DEFAULT 0,
            clicks INT DEFAULT 0,
            spent DECIMAL(10, 2) DEFAULT 0,
            conversions INT DEFAULT 0,
            conversion_value DECIMAL(10, 2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'ticket_merge_history' => "
         CREATE TABLE IF NOT EXISTS ticket_merge_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id INT NOT NULL,
            merged_ticket_id INT NOT NULL,
            merged_by INT NOT NULL,
            merged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
            -- Note: merged_ticket_id might refer to a deleted ticket, so usually no strict FK or it points to tickets too. 
            -- We'll omit FK for merged_ticket_id to be safe or assuming references tickets(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'ticket_split_history' => "
        CREATE TABLE IF NOT EXISTS ticket_split_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id INT NOT NULL,
            new_ticket_id INT NOT NULL,
            split_by INT NOT NULL,
            split_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
            FOREIGN KEY (new_ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ",

    'ticket_csat_survey_sends' => "
        CREATE TABLE IF NOT EXISTS ticket_csat_survey_sends (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id INT NOT NULL,
            contact_id INT NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(50) DEFAULT 'sent',
            FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    "
];

foreach ($tables as $name => $sql) {
    echo "Creating table: $name ... ";
    try {
        $pdo->exec($sql);
        echo "SUCCESS\n";
    } catch (PDOException $e) {
        echo "FAILED: " . $e->getMessage() . "\n";
    }
}

echo "Surgical repair completed.\n";
