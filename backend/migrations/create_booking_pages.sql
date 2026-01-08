-- Booking Pages Migration
-- Shareable booking pages with native/external scheduler support

CREATE TABLE IF NOT EXISTS booking_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    source ENUM('native', 'calendly', 'acuity') NOT NULL DEFAULT 'native',
    
    -- External embed config (for calendly/acuity)
    source_config JSON NULL COMMENT 'embed_url, widget_code, api_token, etc.',
    
    -- Native booking config
    native_config JSON NULL COMMENT 'service_ids[], staff_mode, duration_override, buffers, min_notice, max_advance',
    
    -- Form fields to collect
    form_schema JSON NULL COMMENT 'fields array with name, type, required, options',
    
    -- Branding & customization
    branding JSON NULL COMMENT 'logo_url, primary_color, hero_text, success_message, redirect_url',
    
    -- Payment configuration
    payment_config JSON NULL COMMENT 'requires_payment, provider, amount_type, fixed_amount, terms',
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_workspace_slug (workspace_id, slug),
    KEY idx_workspace (workspace_id),
    KEY idx_company (company_id),
    KEY idx_source (source),
    KEY idx_active (is_active),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- External booking leads (before webhook confirmation)
CREATE TABLE IF NOT EXISTS booking_leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    company_id INT NULL,
    booking_page_id INT NOT NULL,
    contact_id INT NULL,
    
    -- Lead data
    guest_name VARCHAR(255) NULL,
    guest_email VARCHAR(255) NULL,
    guest_phone VARCHAR(50) NULL,
    form_data JSON NULL,
    
    -- External booking metadata
    external_source VARCHAR(50) NULL COMMENT 'calendly, acuity',
    external_booking_id VARCHAR(255) NULL,
    external_event_url TEXT NULL,
    
    -- Status tracking
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    appointment_id INT NULL COMMENT 'Set when converted to appointment',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    KEY idx_workspace (workspace_id),
    KEY idx_booking_page (booking_page_id),
    KEY idx_contact (contact_id),
    KEY idx_status (status),
    KEY idx_external_booking (external_booking_id),
    
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_page_id) REFERENCES booking_pages(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add booking_page_id to appointments for tracking source
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS booking_page_id INT NULL AFTER source,
ADD COLUMN IF NOT EXISTS payment_status ENUM('none', 'pending', 'paid', 'failed', 'refunded') DEFAULT 'none' AFTER price,
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255) NULL AFTER payment_status,
ADD KEY idx_booking_page (booking_page_id),
ADD FOREIGN KEY (booking_page_id) REFERENCES booking_pages(id) ON DELETE SET NULL;
