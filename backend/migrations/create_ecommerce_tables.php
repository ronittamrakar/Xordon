<?php
/**
 * Ecommerce Tables Migration
 * Creates all necessary tables for ecommerce functionality
 * 
 * Tables created:
 * - ecommerce_stores
 * - ecommerce_abandoned_carts
 * - ecommerce_warehouses
 * - ecommerce_inventory
 * - ecommerce_coupons
 * - ecommerce_shipping_methods
 * - ecommerce_collections
 * - ecommerce_collection_products
 */

require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::conn();
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Starting ecommerce tables migration...\n\n";
    
    // 1. Ecommerce Stores
    echo "Creating ecommerce_stores table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ecommerce_stores (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id INT NOT NULL,
            platform ENUM('shopify', 'woocommerce', 'magento', 'bigcommerce', 'custom') NOT NULL,
            store_name VARCHAR(255) NOT NULL,
            store_url VARCHAR(500) NOT NULL,
            api_key VARCHAR(500),
            api_secret VARCHAR(500),
            sync_status ENUM('pending', 'syncing', 'synced', 'error') DEFAULT 'pending',
            last_sync_at TIMESTAMP NULL,
            status ENUM('active', 'paused', 'disconnected') DEFAULT 'active',
            product_count INT DEFAULT 0,
            order_count INT DEFAULT 0,
            total_revenue DECIMAL(12,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_status (status),
            INDEX idx_platform (platform)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ ecommerce_stores created\n\n";
    
    // 2. Abandoned Carts
    echo "Creating ecommerce_abandoned_carts table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ecommerce_abandoned_carts (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id INT NOT NULL,
            store_id INT,
            contact_id INT,
            email VARCHAR(255) NOT NULL,
            contact_name VARCHAR(255),
            items JSON NOT NULL,
            total DECIMAL(10,2) NOT NULL,
            recovery_status ENUM('pending', 'email_sent', 'sms_sent', 'recovered', 'expired') DEFAULT 'pending',
            abandoned_at TIMESTAMP NOT NULL,
            recovered_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_store (store_id),
            INDEX idx_contact (contact_id),
            INDEX idx_recovery_status (recovery_status),
            INDEX idx_abandoned_at (abandoned_at),
            FOREIGN KEY (store_id) REFERENCES ecommerce_stores(id) ON DELETE SET NULL,
            FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ ecommerce_abandoned_carts created\n\n";
    
    // 3. Warehouses
    echo "Creating ecommerce_warehouses table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ecommerce_warehouses (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255),
            address TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ ecommerce_warehouses created\n\n";
    
    // 4. Inventory
    echo "Creating ecommerce_inventory table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ecommerce_inventory (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id INT NOT NULL,
            product_id INT NOT NULL,
            warehouse_id INT NOT NULL,
            quantity_on_hand INT DEFAULT 0,
            quantity_available INT DEFAULT 0,
            quantity_reserved INT DEFAULT 0,
            reorder_point INT DEFAULT 0,
            reorder_quantity INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_product (product_id),
            INDEX idx_warehouse (warehouse_id),
            INDEX idx_low_stock (quantity_available, reorder_point),
            UNIQUE KEY unique_product_warehouse (product_id, warehouse_id),
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (warehouse_id) REFERENCES ecommerce_warehouses(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ ecommerce_inventory created\n\n";
    
    // 5. Coupons
    echo "Creating ecommerce_coupons table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ecommerce_coupons (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id INT NOT NULL,
            code VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            type ENUM('percentage', 'fixed', 'free_shipping') NOT NULL,
            value DECIMAL(10,2) NOT NULL,
            min_purchase DECIMAL(10,2) DEFAULT 0.00,
            max_discount DECIMAL(10,2) NULL,
            usage_limit INT NULL,
            used_count INT DEFAULT 0,
            valid_from TIMESTAMP NULL,
            valid_until TIMESTAMP NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_code (code),
            INDEX idx_active (is_active),
            INDEX idx_valid_dates (valid_from, valid_until),
            UNIQUE KEY unique_tenant_code (tenant_id, code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ ecommerce_coupons created\n\n";
    
    // 6. Shipping Methods
    echo "Creating ecommerce_shipping_methods table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ecommerce_shipping_methods (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            carrier VARCHAR(100),
            rate_type ENUM('flat', 'per_item', 'per_weight', 'calculated') DEFAULT 'flat',
            base_rate DECIMAL(10,2) DEFAULT 0.00,
            per_item_rate DECIMAL(10,2) DEFAULT 0.00,
            per_weight_rate DECIMAL(10,2) DEFAULT 0.00,
            min_delivery_days INT DEFAULT 0,
            max_delivery_days INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ ecommerce_shipping_methods created\n\n";
    
    // 7. Collections
    echo "Creating ecommerce_collections table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ecommerce_collections (
            id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            image_url VARCHAR(500),
            sort_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant (tenant_id),
            INDEX idx_active (is_active),
            INDEX idx_sort (sort_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ ecommerce_collections created\n\n";
    
    // 8. Collection Products (Junction Table)
    echo "Creating ecommerce_collection_products table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS ecommerce_collection_products (
            id INT PRIMARY KEY AUTO_INCREMENT,
            collection_id INT NOT NULL,
            product_id INT NOT NULL,
            sort_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_collection (collection_id),
            INDEX idx_product (product_id),
            INDEX idx_sort (sort_order),
            UNIQUE KEY unique_collection_product (collection_id, product_id),
            FOREIGN KEY (collection_id) REFERENCES ecommerce_collections(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✓ ecommerce_collection_products created\n\n";
    
    echo "===========================================\n";
    echo "✅ All ecommerce tables created successfully!\n";
    echo "===========================================\n\n";
    
    echo "Tables created:\n";
    echo "  1. ecommerce_stores\n";
    echo "  2. ecommerce_abandoned_carts\n";
    echo "  3. ecommerce_warehouses\n";
    echo "  4. ecommerce_inventory\n";
    echo "  5. ecommerce_coupons\n";
    echo "  6. ecommerce_shipping_methods\n";
    echo "  7. ecommerce_collections\n";
    echo "  8. ecommerce_collection_products\n\n";
    
} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
