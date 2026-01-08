-- Phase 6: PayPal Payments Integration
-- PayPal as alternative payment provider alongside Stripe

-- PayPal account connection per workspace
CREATE TABLE IF NOT EXISTS paypal_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- PayPal credentials (encrypted in application)
    client_id_encrypted TEXT NULL,
    client_secret_encrypted TEXT NULL,
    
    -- Mode
    mode ENUM('sandbox', 'live') DEFAULT 'sandbox',
    
    -- Account info
    merchant_id VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    
    -- Status
    status ENUM('pending', 'connected', 'error', 'disabled') DEFAULT 'pending',
    error_message TEXT NULL,
    
    -- Webhook
    webhook_id VARCHAR(255) NULL,
    
    connected_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PayPal orders (tracks PayPal checkout sessions)
CREATE TABLE IF NOT EXISTS paypal_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    
    -- References
    invoice_id INT NULL,
    contact_id INT NULL,
    
    -- PayPal order details
    paypal_order_id VARCHAR(255) NOT NULL,
    
    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status
    status ENUM('created', 'approved', 'completed', 'cancelled', 'failed') DEFAULT 'created',
    
    -- Payer info (filled after approval)
    payer_id VARCHAR(255) NULL,
    payer_email VARCHAR(255) NULL,
    payer_name VARCHAR(255) NULL,
    
    -- Capture info
    capture_id VARCHAR(255) NULL,
    captured_at TIMESTAMP NULL,
    
    -- URLs
    approval_url VARCHAR(1000) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_paypal_order (paypal_order_id),
    INDEX idx_paypal_orders_workspace (workspace_id, status),
    INDEX idx_paypal_orders_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PayPal webhook events log
CREATE TABLE IF NOT EXISTS paypal_webhook_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NULL,
    
    -- Event details
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NULL,
    resource_id VARCHAR(255) NULL,
    
    -- Payload
    payload JSON NOT NULL,
    
    -- Processing
    status ENUM('received', 'processing', 'processed', 'failed', 'ignored') DEFAULT 'received',
    error_message TEXT NULL,
    processed_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_event_id (event_id),
    INDEX idx_paypal_events_type (event_type, created_at DESC),
    INDEX idx_paypal_events_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add PayPal reference to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(255) NULL AFTER stripe_charge_id,
ADD COLUMN IF NOT EXISTS paypal_capture_id VARCHAR(255) NULL AFTER paypal_order_id,
ADD INDEX IF NOT EXISTS idx_payments_paypal (paypal_order_id);
