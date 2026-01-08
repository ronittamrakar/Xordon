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

    // 1. Rename potentially legacy 'forms' table
    // Check if 'forms' exists and 'z_legacy_forms' does not
    $checkForms = $db->query("SHOW TABLES LIKE 'forms'")->fetch();
    $checkLegacy = $db->query("SHOW TABLES LIKE 'z_legacy_forms'")->fetch();

    if ($checkForms && !$checkLegacy) {
        $db->exec("RENAME TABLE forms TO z_legacy_forms");
        echo "Renamed 'forms' to 'z_legacy_forms'.\n";
    } elseif ($checkLegacy) {
        echo "'z_legacy_forms' already exists. Skipping rename.\n";
    } else {
        echo "'forms' table not found. Skipping rename.\n";
    }

    // 2. Drop unused 'fsm_jobs' table
    $checkFsm = $db->query("SHOW TABLES LIKE 'fsm_jobs'")->fetch();
    if ($checkFsm) {
        // Double check it's empty
        $count = $db->query("SELECT COUNT(*) FROM fsm_jobs")->fetchColumn();
        if ($count == 0) {
            $db->exec("DROP TABLE fsm_jobs");
            echo "Dropped empty and unused table 'fsm_jobs'.\n";
        } else {
            echo "Skipping 'fsm_jobs' drop: Table is not empty ($count rows).\n";
        }
    } else {
        echo "'fsm_jobs' table not found. Skipping drop.\n";
    }

    echo "Consolidation actions complete.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
