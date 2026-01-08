-- Local Payments Module
-- Tables for point-of-sale transactions and payment terminals

-- Payment Transactions (for local/in-person payments)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    transaction_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method ENUM('card', 'cash', 'check', 'mobile', 'bank_transfer') NOT NULL DEFAULT 'card',
    status ENUM('pending', 'completed', 'failed', 'refunded', 'void') NOT NULL DEFAULT 'pending',
    customer_name VARCHAR(255) NULL,
    customer_email VARCHAR(255) NULL,
    contact_id INT NULL,
    invoice_id INT NULL,
    terminal_id INT NULL,
    card_last_four VARCHAR(4) NULL,
    card_brand VARCHAR(50) NULL,
    processor_response TEXT NULL,
    notes TEXT NULL,
    refunded_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pt_workspace (workspace_id),
    INDEX idx_pt_transaction (transaction_id),
    INDEX idx_pt_status (status),
    INDEX idx_pt_method (payment_method),
    INDEX idx_pt_contact (contact_id),
    INDEX idx_pt_terminal (terminal_id),
    INDEX idx_pt_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payment Terminals (POS devices)
CREATE TABLE IF NOT EXISTS payment_terminals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    terminal_name VARCHAR(255) NOT NULL,
    terminal_id VARCHAR(100) NOT NULL,
    provider ENUM('stripe', 'square', 'clover', 'custom', 'manual') NOT NULL DEFAULT 'stripe',
    status ENUM('active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active',
    location VARCHAR(255) NULL,
    device_type VARCHAR(100) NULL,
    serial_number VARCHAR(100) NULL,
    api_key_encrypted TEXT NULL,
    settings JSON NULL,
    last_heartbeat_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pterm_workspace (workspace_id),
    INDEX idx_pterm_terminal_id (terminal_id),
    INDEX idx_pterm_status (status),
    INDEX idx_pterm_provider (provider),
    UNIQUE KEY uk_workspace_terminal (workspace_id, terminal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Daily transaction summaries for reporting
CREATE TABLE IF NOT EXISTS payment_daily_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    summary_date DATE NOT NULL,
    total_volume DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    transaction_count INT NOT NULL DEFAULT 0,
    successful_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    refunded_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    avg_transaction DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    card_volume DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    cash_volume DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    check_volume DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    mobile_volume DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pds_workspace (workspace_id),
    INDEX idx_pds_date (summary_date),
    UNIQUE KEY uk_workspace_date (workspace_id, summary_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
