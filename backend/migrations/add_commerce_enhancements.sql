-- Commerce Enhancements: Payment Links & Fulfillment

-- Payment Links: Public checkout pages for products
CREATE TABLE IF NOT EXISTS payment_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    active BOOLEAN DEFAULT 1,
    collect_shipping BOOLEAN DEFAULT 1,
    collect_billing BOOLEAN DEFAULT 1,
    allow_promotion_codes BOOLEAN DEFAULT 0,
    success_url VARCHAR(500),
    cancel_url VARCHAR(500),
    settings JSON COMMENT 'Branding, custom fields, etc.',
    metadata JSON COMMENT 'Custom data',
    total_sales DECIMAL(12,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_slug (slug),
    INDEX idx_user_active (user_id, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payment Link Orders: Track orders made via payment links
CREATE TABLE IF NOT EXISTS payment_link_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_link_id INT NOT NULL,
    invoice_id INT,
    contact_id INT,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_intent_id VARCHAR(255),
    payment_method VARCHAR(50),
    shipping_address JSON,
    billing_address JSON,
    metadata JSON,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_link_id) REFERENCES payment_links(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    INDEX idx_link (payment_link_id),
    INDEX idx_status (status),
    INDEX idx_customer_email (customer_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fulfillments: Track shipping status for orders
CREATE TABLE IF NOT EXISTS fulfillments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    invoice_id INT,
    order_id INT COMMENT 'Ecommerce order or payment link order',
    order_type ENUM('invoice', 'ecommerce_order', 'payment_link_order') DEFAULT 'invoice',
    status ENUM('unfulfilled', 'processing', 'partially_shipped', 'shipped', 'delivered', 'cancelled') DEFAULT 'unfulfilled',
    tracking_number VARCHAR(255),
    courier VARCHAR(100) COMMENT 'USPS, FedEx, UPS, DHL, etc.',
    tracking_url VARCHAR(500),
    shipping_address JSON,
    line_items JSON COMMENT 'Array of {product_id, quantity, shipped_quantity}',
    notes TEXT,
    shipped_at DATETIME,
    delivered_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_invoice (invoice_id),
    INDEX idx_tracking (tracking_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory Logs (Optional - for future stock tracking)
CREATE TABLE IF NOT EXISTS inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    change_type ENUM('adjustment', 'sale', 'return', 'restock') NOT NULL,
    quantity_before INT NOT NULL,
    quantity_change INT NOT NULL,
    quantity_after INT NOT NULL,
    reference_type VARCHAR(50) COMMENT 'invoice, order, manual',
    reference_id INT,
    notes TEXT,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product (product_id),
    INDEX idx_reference (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add inventory tracking to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;
