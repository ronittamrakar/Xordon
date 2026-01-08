<?php
require 'backend/src/Database.php';
$pdo = Xordon\Database::conn();

function addColumn($pdo, $table, $column, $definition) {
    try {
        $pdo->exec("ALTER TABLE $table ADD COLUMN $column $definition");
        echo "Added $column to $table\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "Column $column already exists in $table\n";
        } else {
            echo "Error adding $column to $table: " . $e->getMessage() . "\n";
        }
    }
}

addColumn($pdo, 'directories', 'country', "VARCHAR(10) DEFAULT 'US'");
addColumn($pdo, 'directories', 'type', "ENUM('general', 'niche', 'location', 'social', 'aggregator') DEFAULT 'general'");
addColumn($pdo, 'business_listings', 'submission_type', "ENUM('manual', 'automated') DEFAULT 'manual'");
addColumn($pdo, 'business_listings', 'country', "VARCHAR(10) DEFAULT 'US'");

$directories = [
    ['google_business', 'Google Business Profile', 'https://business.google.com', 'Search', 'The most important local listing.', 'US', 'general', 'https://business.google.com/create'],
    ['yelp', 'Yelp', 'https://yelp.com', 'Reviews', 'Major review platform for local businesses.', 'US', 'general', 'https://biz.yelp.com'],
    ['facebook', 'Facebook Pages', 'https://facebook.com', 'Social', 'Social media presence for local businesses.', 'US', 'social', 'https://facebook.com/pages/create'],
    ['bing_places', 'Bing Places', 'https://bingplaces.com', 'Search', 'Microsoft\'s local business directory.', 'US', 'general', 'https://www.bingplaces.com/'],
    ['apple_maps', 'Apple Maps', 'https://mapsconnect.apple.com', 'Maps', 'Essential for iOS users.', 'US', 'general', 'https://mapsconnect.apple.com/'],
    ['yellowpages', 'Yellow Pages', 'https://yellowpages.com', 'Directory', 'Classic business directory.', 'US', 'general', 'https://adsolutions.yp.com/get-listed'],
    ['foursquare', 'Foursquare', 'https://foursquare.com', 'Location', 'Location-based social network.', 'US', 'location', 'https://foursquare.com/add-place'],
    ['angi', 'Angi', 'https://angi.com', 'Niche', 'Home services directory.', 'US', 'niche', 'https://www.angi.com/join'],
    ['tripadvisor', 'TripAdvisor', 'https://tripadvisor.com', 'Niche', 'Travel and hospitality directory.', 'US', 'niche', 'https://www.tripadvisor.com/Owners'],
    ['hotfrog', 'Hotfrog', 'https://hotfrog.com', 'Directory', 'Global business directory.', 'US', 'general', 'https://www.hotfrog.com/add-your-business']
];

$stmt = $pdo->prepare("INSERT IGNORE INTO directories (code, name, website_url, category, description, country, type, submission_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($directories as $dir) {
    $stmt->execute($dir);
}
echo "Directories populated.\n";
