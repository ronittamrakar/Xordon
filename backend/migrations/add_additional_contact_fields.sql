-- Add additional contact fields that were missing

-- Add additional_details field (for extra notes/information)
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS additional_details TEXT NULL;

-- Add company_size_selection field (for dropdown selection)
ALTER TABLE recipients ADD COLUMN IF NOT EXISTS company_size_selection VARCHAR(50) NULL;
