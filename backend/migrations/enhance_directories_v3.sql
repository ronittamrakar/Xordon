-- Enhance directories table
ALTER TABLE directories 
ADD COLUMN country VARCHAR(10) DEFAULT 'US',
ADD COLUMN type ENUM('general', 'niche', 'location', 'social', 'aggregator') DEFAULT 'general';

-- Add some real-world directory examples
-- Note: Using 'code' instead of 'slug' as per DESCRIBE output
INSERT IGNORE INTO directories (code, name, website_url, category, description, country, type, submission_url) VALUES
('google_business', 'Google Business Profile', 'https://business.google.com', 'Search', 'The most important local listing.', 'US', 'general', 'https://business.google.com/create'),
('yelp', 'Yelp', 'https://yelp.com', 'Reviews', 'Major review platform for local businesses.', 'US', 'general', 'https://biz.yelp.com'),
('facebook', 'Facebook Pages', 'https://facebook.com', 'Social', 'Social media presence for local businesses.', 'US', 'social', 'https://facebook.com/pages/create'),
('bing_places', 'Bing Places', 'https://bingplaces.com', 'Search', 'Microsoft\'s local business directory.', 'US', 'general', 'https://www.bingplaces.com/'),
('apple_maps', 'Apple Maps', 'https://mapsconnect.apple.com', 'Maps', 'Essential for iOS users.', 'US', 'general', 'https://mapsconnect.apple.com/'),
('yellowpages', 'Yellow Pages', 'https://yellowpages.com', 'Directory', 'Classic business directory.', 'US', 'general', 'https://adsolutions.yp.com/get-listed'),
('foursquare', 'Foursquare', 'https://foursquare.com', 'Location', 'Location-based social network.', 'US', 'location', 'https://foursquare.com/add-place'),
('angi', 'Angi', 'https://angi.com', 'Niche', 'Home services directory.', 'US', 'niche', 'https://www.angi.com/join'),
('tripadvisor', 'TripAdvisor', 'https://tripadvisor.com', 'Niche', 'Travel and hospitality directory.', 'US', 'niche', 'https://www.tripadvisor.com/Owners'),
('hotfrog', 'Hotfrog', 'https://hotfrog.com', 'Directory', 'Global business directory.', 'US', 'general', 'https://www.hotfrog.com/add-your-business');

-- Update existing listings to have a submission type
ALTER TABLE business_listings 
ADD COLUMN submission_type ENUM('manual', 'automated') DEFAULT 'manual',
ADD COLUMN country VARCHAR(10) DEFAULT 'US';
