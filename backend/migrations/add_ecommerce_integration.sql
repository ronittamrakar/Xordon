-- Ecommerce Integration (Shopify, WooCommerce, etc.)

CREATE TABLE IF NOT EXISTS ecommerce_stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_id INT DEFAULT NULL,
    platform ENUM('shopify', 'woocommerce', 'magento', 'bigcommerce', 'custom') NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    store_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(500),
    api_secret VARCHAR(500),
    access_token TEXT,
    webhook_secret VARCHAR(255),
    sync_status ENUM('pending', 'syncing', 'synced', 'error') DEFAULT 'pending',
    last_sync_at DATETIME,
    settings JSON,
    status ENUM('active', 'paused', 'disconnected') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ecommerce_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    external_id VARCHAR(100) NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    image_url VARCHAR(500),
    product_url VARCHAR(500),
    category VARCHAR(255),
    tags JSON,
    inventory_quantity INT DEFAULT 0,
    status ENUM('active', 'draft', 'archived') DEFAULT 'active',
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_store_product (store_id, external_id),
    FOREIGN KEY (store_id) REFERENCES ecommerce_stores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ecommerce_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    contact_id INT,
    external_id VARCHAR(100) NOT NULL,
    order_number VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    status ENUM('pending', 'processing', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
    subtotal DECIMAL(10,2),
    shipping_total DECIMAL(10,2),
    tax_total DECIMAL(10,2),
    discount_total DECIMAL(10,2),
    total DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    items JSON,
    shipping_address JSON,
    billing_address JSON,
    order_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_store_order (store_id, external_id),
    FOREIGN KEY (store_id) REFERENCES ecommerce_stores(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS abandoned_carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    contact_id INT,
    external_id VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    items JSON,
    subtotal DECIMAL(10,2),
    total DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    checkout_url VARCHAR(500),
    recovery_status ENUM('pending', 'email_sent', 'sms_sent', 'recovered', 'expired') DEFAULT 'pending',
    recovery_emails_sent INT DEFAULT 0,
    recovery_sms_sent INT DEFAULT 0,
    recovered_at DATETIME,
    abandoned_at DATETIME,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES ecommerce_stores(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS revenue_attribution (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    store_id INT,
    order_id INT,
    contact_id INT,
    attribution_type ENUM('campaign', 'sequence', 'automation', 'form', 'landing_page') NOT NULL,
    attribution_id INT NOT NULL,
    channel ENUM('email', 'sms', 'call', 'form', 'landing_page') NOT NULL,
    revenue DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    attributed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
