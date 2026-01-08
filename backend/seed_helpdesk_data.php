<?php
// Seed helpdesk data script - Updated for actual schema

$host = 'localhost';
$dbname = 'xordon';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== SEEDING HELPDESK DATA ===\n\n";
    
    // Add default team if missing
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM ticket_teams WHERE workspace_id = 1");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['count'] == 0) {
        echo "Adding default team...\n";
        $pdo->exec("INSERT INTO ticket_teams (workspace_id, name, description, email) VALUES (1, 'Support Team', 'General customer support', 'support@company.com')");
        echo "  ✓ Default team added\n";
    } else {
        echo "  ✓ Teams already exist ({$result['count']} teams)\n";
    }
    
    // Add KB categories if missing
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM kb_categories WHERE workspace_id = 1");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['count'] == 0) {
        echo "\nAdding KB categories...\n";
        $pdo->exec("INSERT INTO kb_categories (workspace_id, name, slug, description, icon, sequence) VALUES
            (1, 'Getting Started', 'getting-started', 'Everything you need to know to get started', 'Rocket', 1),
            (1, 'FAQs', 'faqs', 'Frequently asked questions', 'HelpCircle', 2),
            (1, 'Troubleshooting', 'troubleshooting', 'Common issues and how to resolve them', 'Wrench', 3)");
        echo "  ✓ KB categories added\n";
    } else {
        echo "  ✓ KB categories already exist ({$result['count']} categories)\n";
    }
    
    // Add sample KB articles
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM kb_articles WHERE workspace_id = 1");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['count'] == 0) {
        echo "\nAdding sample KB articles...\n";
        
        // Get category IDs
        $stmt = $pdo->query("SELECT id, slug FROM kb_categories WHERE workspace_id = 1");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $categoryMap = [];
        foreach ($categories as $cat) {
            $categoryMap[$cat['slug']] = $cat['id'];
        }
        
        $articles = [
            [
                'title' => 'How to Get Started',
                'slug' => 'how-to-get-started',
                'body' => 'Welcome to our platform! This guide will help you get started quickly.\n\n1. Create your account\n2. Set up your profile\n3. Explore the dashboard\n4. Start using features',
                'category' => 'getting-started',
                'summary' => 'A quick guide to getting started with our platform'
            ],
            [
                'title' => 'How to Create a Ticket',
                'slug' => 'how-to-create-ticket',
                'body' => 'Creating a support ticket is easy:\n\n1. Click on "New Ticket" button\n2. Fill in the subject and description\n3. Select priority level\n4. Submit the ticket\n\nOur team will respond within 24 hours.',
                'category' => 'getting-started',
                'summary' => 'Learn how to create and submit support tickets'
            ],
            [
                'title' => 'What are the system requirements?',
                'slug' => 'system-requirements',
                'body' => 'Our platform works on:\n\n- Modern web browsers (Chrome, Firefox, Safari, Edge)\n- Minimum screen resolution: 1024x768\n- Stable internet connection\n- JavaScript enabled',
                'category' => 'faqs',
                'summary' => 'System requirements for using our platform'
            ],
            [
                'title' => 'How do I reset my password?',
                'slug' => 'reset-password',
                'body' => 'To reset your password:\n\n1. Click "Forgot Password" on the login page\n2. Enter your email address\n3. Check your email for reset link\n4. Click the link and set a new password\n\nIf you don\'t receive the email, check your spam folder.',
                'category' => 'faqs',
                'summary' => 'Steps to reset your account password'
            ],
            [
                'title' => 'Page Not Loading - Troubleshooting',
                'slug' => 'page-not-loading',
                'body' => 'If a page is not loading, try these steps:\n\n1. Refresh the page (Ctrl+R or Cmd+R)\n2. Clear your browser cache\n3. Try a different browser\n4. Check your internet connection\n5. Disable browser extensions\n\nIf the issue persists, contact support.',
                'category' => 'troubleshooting',
                'summary' => 'Solutions for pages that won\'t load'
            ],
            [
                'title' => 'Login Issues - Common Solutions',
                'slug' => 'login-issues',
                'body' => 'Having trouble logging in? Try these solutions:\n\n1. Verify your email and password are correct\n2. Check if Caps Lock is on\n3. Clear browser cookies\n4. Try incognito/private mode\n5. Reset your password\n\nStill having issues? Contact our support team.',
                'category' => 'troubleshooting',
                'summary' => 'Common solutions for login problems'
            ]
        ];
        
        foreach ($articles as $article) {
            $categoryId = $categoryMap[$article['category']] ?? null;
            
            $stmt = $pdo->prepare("INSERT INTO kb_articles (workspace_id, title, slug, body, excerpt, category_id, is_published, view_count) VALUES (?, ?, ?, ?, ?, ?, 1, 0)");
            $stmt->execute([
                1,
                $article['title'],
                $article['slug'],
                $article['body'],
                $article['summary'],
                $categoryId
            ]);
            
            echo "  ✓ Added: {$article['title']}\n";
        }
    } else {
        echo "  ✓ KB articles already exist ({$result['count']} articles)\n";
    }
    
    // Add sample tickets
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM tickets WHERE workspace_id = 1");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['count'] == 0) {
        echo "\nAdding sample tickets...\n";
        
        $tickets = [
            [
                'number' => 'TCK-1001',
                'title' => 'Website widget not loading',
                'description' => 'The chat widget on our website is not appearing for visitors.',
                'status' => 'open',
                'priority' => 'high',
                'requester_name' => 'John Doe',
                'requester_email' => 'john@example.com',
                'source' => 'email'
            ],
            [
                'number' => 'TCK-1002',
                'title' => 'Billing question about invoice',
                'description' => 'I have a question about the charges on my latest invoice.',
                'status' => 'pending',
                'priority' => 'medium',
                'requester_name' => 'Jane Smith',
                'requester_email' => 'jane@company.com',
                'source' => 'webchat'
            ],
            [
                'number' => 'TCK-1003',
                'title' => 'Feature Request: Dark Mode',
                'description' => 'It would be great if the dashboard supported dark mode.',
                'status' => 'new',
                'priority' => 'low',
                'requester_name' => 'Mike Brown',
                'requester_email' => 'mike@startup.io',
                'source' => 'form'
            ]
        ];
        
        foreach ($tickets as $ticket) {
            $stmt = $pdo->prepare("INSERT INTO tickets (workspace_id, ticket_number, title, description, status, priority, requester_name, requester_email, source_channel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                1,
                $ticket['number'],
                $ticket['title'],
                $ticket['description'],
                $ticket['status'],
                $ticket['priority'],
                $ticket['requester_name'],
                $ticket['requester_email'],
                $ticket['source']
            ]);
            
            echo "  ✓ Added: {$ticket['number']} - {$ticket['title']}\n";
        }
    } else {
        echo "  ✓ Tickets already exist ({$result['count']} tickets)\n";
    }
    
    echo "\n=== SEEDING COMPLETE ===\n";
    echo "\nRun 'php check_helpdesk_db.php' to verify the data.\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
