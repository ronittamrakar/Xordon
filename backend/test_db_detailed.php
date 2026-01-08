<?php
// Load environment variables manually since we don't have the full app context
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port = $_ENV['DB_PORT'] ?? '3306';
$db   = $_ENV['DB_NAME'] ?? 'xordon';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '';

echo "Attempting to connect to database: $db on $host:$port with user: $user\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Successfully connected to the database!\n";
    
    // Check if tables exist
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Found " . count($tables) . " tables.\n";
    if (count($tables) < 5) {
        echo "Warning: Very few tables found. Database might be empty.\n";
        print_r($tables);
    }
    
    // Check listings table specifically
    if (in_array('business_listings', $tables)) {
        $count = $pdo->query("SELECT COUNT(*) FROM business_listings")->fetchColumn();
        echo "business_listings table has $count rows.\n";
    } else {
        echo "Error: business_listings table NOT found!\n";
    }

} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
    // Check if it's a "Unknown database" error
    if (strpos($e->getMessage(), 'Unknown database') !== false) {
        echo "The database '$db' does not exist. Please create it.\n";
        try {
            // Try connecting without db to create it
            $pdoRoot = new PDO("mysql:host=$host;port=$port", $user, $pass);
            echo "Connected to server without DB. Attempting to create '$db'...\n";
            $pdoRoot->exec("CREATE DATABASE `$db`");
            echo "Database '$db' created successfully!\n";
        } catch (PDOException $e2) {
            echo "Could not create database: " . $e2->getMessage() . "\n";
        }
    }
}
