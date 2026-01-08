<?php
/**
 * Helpdesk Test Data Generator
 * Populates database with sample tickets and KB articles
 * Updated to match actual DB schema
 */

require_once __DIR__ . '/../vendor/autoload.php';

try {
    $db = new PDO('mysql:host=localhost;dbname=xordon', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $workspaceId = 1;
    
    echo "=== Creating Helpdesk Test Data ===\n\n";

    // 1. Get KB Categories (if table exists)
    $kbCats = [];
    try {
        $stmt = $db->prepare('SELECT id FROM kb_categories WHERE workspace_id = ?');
        $stmt->execute([$workspaceId]);
        $kbCats = $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $ex) {
        echo "Warning: kb_categories table issue: " . $ex->getMessage() . "\n";
    }

    // 2. Create Tickets
    echo "1. Creating Support Tickets...\n";
    $tickets = [
        [
            'title' => 'Cannot access account',
            'description' => 'I am getting a 403 error when trying to login.',
            'status' => 'new',
            'priority' => 'high',
            'type' => 'incident' 
        ],
        [
            'title' => 'Feature Request: Dark Mode',
            'description' => 'It would be great to have a dark mode for the dashboard.',
            'status' => 'open',
            'priority' => 'medium',
            'type' => 'feature_request' 
        ],
        [
            'title' => 'Billing Question',
            'description' => 'I was charged twice for this month.',
            'status' => 'pending',
            'priority' => 'urgent',
            'type' => 'question' 
        ],
        [
            'title' => 'How to export reports?',
            'description' => 'I cannot find the export button.',
            'status' => 'resolved',
            'priority' => 'low',
            'type' => 'question' 
        ],
         [
            'title' => 'Integration Error',
            'description' => 'Zapier integration is failing with error 500.',
            'status' => 'new',
            'priority' => 'high',
            'type' => 'problem' 
        ]
    ];

    // Check valid ENUMs or fall back
    // We'll just try inserting.

    foreach ($tickets as $t) {
        // Check if exists
        $stmt = $db->prepare('SELECT id FROM tickets WHERE workspace_id = ? AND subject = ?');
        $stmt->execute([$workspaceId, $t['title']]);
        if ($stmt->fetch()) {
             echo "  - Ticket exists: {$t['title']}\n";
             continue;
        }

        $stmt = $db->prepare('INSERT INTO tickets (workspace_id, ticket_number, subject, description, status, priority, type, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, "web", NOW())');
        
        $ticketNum = 'TKT-' . rand(1000, 9999);
        
        // Handle potential ENUM mismatches by defaulting if needed, but assuming standard values
        $type = $t['type'];
        // If type column is strictly enum, we might need to be careful.
        // Assuming 'incident', 'question' etc are valid based on truncated output.
        
        try {
            $stmt->execute([
                $workspaceId,
                $ticketNum,
                $t['title'],
                $t['description'],
                $t['status'],
                $t['priority'],
                $type
            ]);
            echo "  - Created ticket: {$t['title']} ($ticketNum)\n";
        } catch (Exception $e) {
            echo "  - Failed to create ticket {$t['title']}: " . $e->getMessage() . "\n";
        }
    }

    // 3. Create KB Articles
    echo "\n2. Creating KB Articles...\n";
    $articles = [
        [
            'title' => 'How to reset your password',
            'slug' => 'how-to-reset-password',
            'body' => 'Go to settings and click reset password.',
            'cat_idx' => 0
        ],
        [
            'title' => 'Understanding Billing Cycles',
            'slug' => 'billing-cycles',
            'body' => 'Billing happens on the 1st of every month.',
            'cat_idx' => 1
        ],
        [
            'title' => 'Troubleshooting API Errors',
            'slug' => 'troubleshooting-api',
            'body' => 'Check your API keys and permissions.',
            'cat_idx' => 2
        ]
    ];

    foreach ($articles as $a) {
         $stmt = $db->prepare('SELECT id FROM kb_articles WHERE workspace_id = ? AND slug = ?');
         $stmt->execute([$workspaceId, $a['slug']]);
         if ($stmt->fetch()) {
             echo "  - Article exists: {$a['title']}\n";
             continue;
         }

         $catId = isset($kbCats[$a['cat_idx']]) ? $kbCats[$a['cat_idx']] : null;

         $stmt = $db->prepare('INSERT INTO kb_articles (workspace_id, title, slug, body, category_id, is_published, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())');
         $stmt->execute([
             $workspaceId,
             $a['title'],
             $a['slug'],
             $a['body'],
             $catId
         ]);
         echo "  - Created article: {$a['title']}\n";
    }

    echo "\n=== Helpdesk Data Creation Complete! ===\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
