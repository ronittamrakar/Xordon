-- Add SMTP credentials columns to sending_accounts table

ALTER TABLE sending_accounts 
ADD COLUMN smtp_host VARCHAR(255) NULL,
ADD COLUMN smtp_port INT NULL DEFAULT 587,
ADD COLUMN smtp_username VARCHAR(255) NULL,
ADD COLUMN smtp_password VARCHAR(255) NULL,
ADD COLUMN smtp_encryption VARCHAR(32) NULL DEFAULT 'tls',
ADD COLUMN access_token TEXT NULL,
ADD COLUMN refresh_token TEXT NULL,
ADD COLUMN token_expires_at DATETIME NULL;