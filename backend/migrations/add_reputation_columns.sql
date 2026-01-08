-- Add Reputation Management Columns to Existing Reviews Table
-- This migration adds columns needed for the reputation module

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS author_name VARCHAR(255) AFTER reviewer_name,
ADD COLUMN IF NOT EXISTS author_email VARCHAR(255) AFTER author_name,
ADD COLUMN IF NOT EXISTS review_text TEXT AFTER title,
ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20) DEFAULT 'neutral' AFTER review_text,
ADD COLUMN IF NOT EXISTS replied BOOLEAN DEFAULT FALSE AFTER sentiment,
ADD COLUMN IF NOT EXISTS reply_text TEXT AFTER replied,
ADD COLUMN IF NOT EXISTS reply_date DATETIME AFTER reply_text,
ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT FALSE AFTER reply_date,
ADD COLUMN IF NOT EXISTS source_url TEXT AFTER is_spam,
ADD COLUMN IF NOT EXISTS contact_id INT AFTER user_id,
ADD COLUMN IF NOT EXISTS platform VARCHAR(50) AFTER contact_id;

-- Add indexes for better performance
ALTER TABLE reviews
ADD INDEX IF NOT EXISTS idx_sentiment (sentiment),
ADD INDEX IF NOT EXISTS idx_replied (replied),
ADD INDEX IF NOT EXISTS idx_is_spam (is_spam),
ADD INDEX IF NOT EXISTS idx_contact_id (contact_id),
ADD INDEX IF NOT EXISTS idx_platform (platform);

-- Update existing records to populate new fields from old ones
UPDATE reviews SET 
    author_name = COALESCE(reviewer_name, 'Unknown'),
    platform = CASE 
        WHEN platform_id = 1 THEN 'Google'
        WHEN platform_id = 2 THEN 'Facebook'
        WHEN platform_id = 3 THEN 'Yelp'
        ELSE 'Other'
    END,
    review_text = COALESCE(content, ''),
    sentiment = CASE 
        WHEN rating >= 4 THEN 'positive'
        WHEN rating <= 2 THEN 'negative'
        ELSE 'neutral'
    END
WHERE author_name IS NULL OR platform IS NULL;
