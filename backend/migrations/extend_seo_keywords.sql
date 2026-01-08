-- Extend seo_keywords table with additional fields for keyword research
-- Ahrefs/SEMRush-style keyword data

ALTER TABLE seo_keywords
ADD COLUMN IF NOT EXISTS search_volume INT DEFAULT NULL COMMENT 'Monthly search volume',
ADD COLUMN IF NOT EXISTS keyword_difficulty INT DEFAULT NULL COMMENT '0-100 difficulty score',
ADD COLUMN IF NOT EXISTS cpc DECIMAL(10,2) DEFAULT NULL COMMENT 'Cost per click in USD',
ADD COLUMN IF NOT EXISTS competition VARCHAR(50) DEFAULT NULL COMMENT 'low, medium, high',
ADD COLUMN IF NOT EXISTS serp_features JSON DEFAULT NULL COMMENT 'Featured snippet, local pack, etc',
ADD COLUMN IF NOT EXISTS trend_data JSON DEFAULT NULL COMMENT '12-month search volume trend',
ADD COLUMN IF NOT EXISTS parent_keyword VARCHAR(500) DEFAULT NULL COMMENT 'Main keyword if this is a variation',
ADD INDEX idx_search_volume (search_volume),
ADD INDEX idx_keyword_difficulty (keyword_difficulty),
ADD INDEX idx_competition (competition);
