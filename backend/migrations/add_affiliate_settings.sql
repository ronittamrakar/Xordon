-- Affiliate Settings Table
CREATE TABLE IF NOT EXISTS affiliate_settings (
    workspace_id INT PRIMARY KEY,
    default_commission_rate DECIMAL(5,2) DEFAULT 20.00,
    cookie_duration_days INT DEFAULT 30,
    min_payout_amount DECIMAL(10,2) DEFAULT 50.00,
    payout_methods JSON NULL,
    allow_self_referral BOOLEAN DEFAULT FALSE,
    auto_approve_affiliates BOOLEAN DEFAULT FALSE,
    terms_and_conditions TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
