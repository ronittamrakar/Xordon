-- =============================================================================
-- ADDITIONAL COLUMN ENHANCEMENTS
-- Purpose: Add missing columns to existing tables as identified in the audit
-- =============================================================================

-- Enhance certificates table with course-related columns
ALTER TABLE certificates 
    ADD COLUMN IF NOT EXISTS course_id INT AFTER id,
    ADD COLUMN IF NOT EXISTS enrollment_id INT AFTER course_id,
    ADD COLUMN IF NOT EXISTS issued_to_email VARCHAR(255) AFTER issued_date,
    ADD COLUMN IF NOT EXISTS verification_code VARCHAR(100) UNIQUE AFTER issued_to_email,
    ADD COLUMN IF NOT EXISTS template_data JSON AFTER verification_code,
    ADD INDEX IF NOT EXISTS idx_course (course_id),
    ADD INDEX IF NOT EXISTS idx_enrollment (enrollment_id);

-- Enhance marketplace_leads table with additional columns
ALTER TABLE marketplace_leads
    ADD COLUMN IF NOT EXISTS lead_quality_score INT DEFAULT 0 AFTER price,
    ADD COLUMN IF NOT EXISTS verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending' AFTER lead_quality_score,
    ADD COLUMN IF NOT EXISTS exclusive BOOLEAN DEFAULT FALSE AFTER verification_status,
    ADD COLUMN IF NOT EXISTS max_buyers INT DEFAULT 1 AFTER exclusive,
    ADD COLUMN IF NOT EXISTS current_buyers INT DEFAULT 0 AFTER max_buyers,
    ADD INDEX IF NOT EXISTS idx_quality (lead_quality_score),
    ADD INDEX IF NOT EXISTS idx_verification (verification_status),
    ADD INDEX IF NOT EXISTS idx_exclusive (exclusive);
