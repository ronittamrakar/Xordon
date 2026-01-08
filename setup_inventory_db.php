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
        // Operations Center / Warehouse
        "CREATE TABLE IF NOT EXISTS inventory_warehouses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            code VARCHAR(50) UNIQUE,
            address_line1 VARCHAR(255),
            address_line2 VARCHAR(255),
            city VARCHAR(100),
            state VARCHAR(100),
            zip_code VARCHAR(20),
            country VARCHAR(100),
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_company (company_id)
        )",

        // Specific Bin Locations
        "CREATE TABLE IF NOT EXISTS inventory_locations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            warehouse_id INT NOT NULL,
            zone VARCHAR(50) COMMENT 'e.g. Zone A',
            aisle VARCHAR(50) COMMENT 'e.g. Aisle 12',
            rack VARCHAR(50) COMMENT 'e.g. Rack 3',
            shelf VARCHAR(50) COMMENT 'e.g. Shelf B',
            bin VARCHAR(50) COMMENT 'e.g. Bin 101',
            barcode VARCHAR(255) UNIQUE COMMENT 'Location barcode',
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (warehouse_id) REFERENCES inventory_warehouses(id) ON DELETE CASCADE
        )",

        // Live Stock Levels
        // Links to your existing 'products' or 'ecommerce_products' table
        // We'll use a generic 'product_id' assuming it links to one of those.
        // For strict integrity, we would Foreign Key to the specific products table if known.
        "CREATE TABLE IF NOT EXISTS inventory_stock (
            id INT AUTO_INCREMENT PRIMARY KEY,
            warehouse_id INT NOT NULL,
            location_id INT COMMENT 'Optional specific bin',
            product_id INT NOT NULL,
            sku VARCHAR(100),
            quantity_on_hand DECIMAL(12, 4) DEFAULT 0,
            quantity_reserved DECIMAL(12, 4) DEFAULT 0,
            quantity_available DECIMAL(12, 4) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
            reorder_point DECIMAL(12, 4) DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_stock (warehouse_id, location_id, product_id),
            FOREIGN KEY (warehouse_id) REFERENCES inventory_warehouses(id) ON DELETE CASCADE,
            FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE SET NULL
        )",

        // Stock Movement History (Audit Trail)
        "CREATE TABLE IF NOT EXISTS inventory_movements (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            company_id INT NOT NULL,
            product_id INT NOT NULL,
            from_warehouse_id INT,
            from_location_id INT,
            to_warehouse_id INT,
            to_location_id INT,
            quantity DECIMAL(12, 4) NOT NULL,
            reference_type VARCHAR(50) COMMENT 'order, adjustment, transfer, receipt',
            reference_id VARCHAR(100) COMMENT 'order ID or adjustment ID',
            reason VARCHAR(255),
            performed_by INT COMMENT 'User ID',
            performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_product (product_id),
            INDEX idx_date (performed_at)
        )"
    ];

    foreach ($queries as $sql) {
        $db->exec($sql);
        echo "Executed table creation.\n";
    }

    echo "Inventory tables setup complete.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
