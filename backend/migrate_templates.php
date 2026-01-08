<?php
// Load environment variables from .env file
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

require_once __DIR__ . '/src/Database.php';

try {
    $pdo = Database::conn();
    $sql = file_get_contents(__DIR__ . '/migrations/add_ai_templates_table.sql');
    $pdo->exec($sql);
    echo "Migration run successfully: ai_templates table created.\n";

    // Seed data if empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM ai_templates");
    if ($stmt->fetchColumn() == 0) {
        echo "Seeding default templates...\n";
        
        $templates = [
            [
                'name' => 'Abigail - Global Support Unit',
                'description' => 'A high-performance conversational unit engineered for complex multi-lingual support and sentiment-aware interaction.',
                'category' => 'Customer Excellence',
                'author' => 'Neural Systems',
                'type' => 'chat',
                'business_niches' => json_encode(['Agency', 'SaaS', 'E-commerce']),
                'use_cases' => json_encode(['Global Support', 'Sentiment Analysis']),
                'downloads' => 42100,
                'rating' => 4.9,
                'reviews_count' => 128,
                'price' => 'Free',
                'image_url' => 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                'is_official' => 1,
                'is_verified' => 1,
                'config' => json_encode(['role' => 'support', 'tone' => 'empathetic'])
            ],
            [
                'name' => 'Bio-Medical Appointment Node',
                'description' => 'A precision-tuned scheduling engine designed for medical environments requiring strict compliance and complex booking logic.',
                'category' => 'Health & Sciences',
                'author' => 'MedTech AI',
                'type' => 'chat',
                'business_niches' => json_encode(['Medical Clinic', 'Surgical Centers']),
                'use_cases' => json_encode(['Critical Scheduling', 'Patient Triage']),
                'downloads' => 31400,
                'rating' => 4.8,
                'reviews_count' => 94,
                'price' => 'Premium',
                'image_url' => 'https://cdn-icons-png.flaticon.com/512/3467/3467831.png',
                'is_official' => 1,
                'is_verified' => 1,
                'config' => json_encode(['role' => 'scheduler', 'domain' => 'medical'])
            ],
             [
                'name' => 'Sales Outreach Pro',
                'description' => 'Aggressive yet polite sales agent optimized for cold outreach and lead qualification.',
                'category' => 'Sales',
                'author' => 'SalesGenius',
                'type' => 'voice',
                'business_niches' => json_encode(['Real Estate', 'Insurance']),
                'use_cases' => json_encode(['Cold Calling', 'Lead Qual']),
                'downloads' => 15200,
                'rating' => 4.7,
                'reviews_count' => 45,
                'price' => 'Paid',
                'image_url' => 'https://cdn-icons-png.flaticon.com/512/4233/4233830.png',
                'is_official' => 0,
                'is_verified' => 1,
                'config' => json_encode(['role' => 'sales', 'tone' => 'persuasive'])
            ]
        ];

        $insertSql = "INSERT INTO ai_templates (name, description, category, author, type, business_niches, use_cases, downloads, rating, reviews_count, price, image_url, is_official, is_verified, config) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($insertSql);

        foreach ($templates as $t) {
            $stmt->execute([
                $t['name'], $t['description'], $t['category'], $t['author'], $t['type'], 
                $t['business_niches'], $t['use_cases'], $t['downloads'], $t['rating'], 
                $t['reviews_count'], $t['price'], $t['image_url'], $t['is_official'], 
                $t['is_verified'], $t['config']
            ]);
        }
        echo "Seeding complete.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
