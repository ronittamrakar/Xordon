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
        // GPS Devices (Trackers or Phones)
        "CREATE TABLE IF NOT EXISTS gps_devices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            device_identifier VARCHAR(255) NOT NULL UNIQUE COMMENT 'IMEI or App Instance ID',
            type ENUM('mobile_app', 'vehicle_tracker', 'asset_tracker') DEFAULT 'mobile_app',
            assigned_user_id INT,
            assigned_vehicle_id INT,
            battery_level INT,
            last_location_lat DECIMAL(10, 8),
            last_location_lng DECIMAL(11, 8),
            last_seen_at DATETIME,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_company (company_id),
            INDEX idx_user (assigned_user_id)
        )",

        // GPS Logs (Historical Path)
        // Optimization: In production, this might go to a TSDB, but MySQL is fine for now
        "CREATE TABLE IF NOT EXISTS gps_logs (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            device_id INT NOT NULL,
            user_id INT,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            speed DECIMAL(8, 2) COMMENT 'km/h',
            heading DECIMAL(5, 2) COMMENT 'degrees',
            altitude DECIMAL(8, 2),
            accuracy DECIMAL(8, 2) COMMENT 'meters',
            captured_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_device_time (device_id, captured_at),
            FOREIGN KEY (device_id) REFERENCES gps_devices(id) ON DELETE CASCADE
        )",

        // Geofences (Zones)
        "CREATE TABLE IF NOT EXISTS geofences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            geometry_type ENUM('circle', 'polygon') DEFAULT 'circle',
            center_lat DECIMAL(10, 8),
            center_lng DECIMAL(11, 8),
            radius_meters INT,
            polygon_coords TEXT COMMENT 'JSON array of lat/lng',
            color VARCHAR(50) DEFAULT '#3B82F6',
            trigger_enter BOOLEAN DEFAULT 1,
            trigger_exit BOOLEAN DEFAULT 1,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )",

        // Geofence Events (Audit Trail)
        "CREATE TABLE IF NOT EXISTS geofence_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            geofence_id INT NOT NULL,
            device_id INT NOT NULL,
            user_id INT,
            event_type ENUM('enter', 'exit', 'dwell') NOT NULL,
            timestamp DATETIME NOT NULL,
            duration_seconds INT COMMENT 'For exit events',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_geofence (geofence_id),
            FOREIGN KEY (geofence_id) REFERENCES geofences(id) ON DELETE CASCADE
        )"
    ];

    foreach ($queries as $sql) {
        $db->exec($sql);
        echo "Executed table creation.\n";
    }

    echo "GPS tables setup complete.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
