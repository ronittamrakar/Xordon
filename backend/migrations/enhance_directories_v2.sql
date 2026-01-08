-- Enhance directories table
ALTER TABLE directories 
ADD COLUMN country VARCHAR(10) DEFAULT 'US',
ADD COLUMN type ENUM('general', 'niche', 'location', 'social', 'aggregator') DEFAULT 'general',
ADD COLUMN submission_url VARCHAR(255) DEFAULT NULL;

-- Add some real-world directory examples (placeholders for the 250+ list)
INSERT INTO directories (name, slug, url, category, description, country, type, submission_url) VALUES
('Google Business Profile', 'google_business', 'https://business.google.com', 'Search', 'The most important local listing.', 'US', 'general', 'https://business.google.com/create'),
('Yelp', 'yelp', 'https://yelp.com', 'Reviews', 'Major review platform for local businesses.', 'US', 'general', 'https://biz.yelp.com'),
('Facebook Pages', 'facebook', 'https://facebook.com', 'Social', 'Social media presence for local businesses.', 'US', 'social', 'https://facebook.com/pages/create'),
('Bing Places', 'bing_places', 'https://bingplaces.com', 'Search', 'Microsoft''s local business directory.', 'US', 'general', 'https://www.bingplaces.com/'),
('Apple Maps', 'apple_maps', 'https://mapsconnect.apple.com', 'Maps', 'Essential for iOS users.', 'US', 'general', 'https://mapsconnect.apple.com/'),
('Yellow Pages', 'yellowpages', 'https://yellowpages.com', 'Directory', 'Classic business directory.', 'US', 'general', 'https://adsolutions.yp.com/get-listed'),
('Foursquare', 'foursquare', 'https://foursquare.com', 'Location', 'Location-based social network.', 'US', 'location', 'https://foursquare.com/add-place'),
('Angi', 'angi', 'https://angi.com', 'Niche', 'Home services directory.', 'US', 'niche', 'https://www.angi.com/join'),
('TripAdvisor', 'tripadvisor', 'https://tripadvisor.com', 'Niche', 'Travel and hospitality directory.', 'US', 'niche', 'https://www.tripadvisor.com/Owners'),
('Hotfrog', 'hotfrog', 'https://hotfrog.com', 'Directory', 'Global business directory.', 'US', 'general', 'https://www.hotfrog.com/add-your-business');

-- Update existing listings to have a submission type
ALTER TABLE business_listings 
ADD COLUMN submission_type ENUM('manual', 'automated') DEFAULT 'manual',
ADD COLUMN country VARCHAR(10) DEFAULT 'US';
