<?php
require_once __DIR__ . '/backend/src/Database.php';

// Load .env
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim($value);
            putenv(sprintf('%s=%s', trim($name), trim($value)));
        }
    }
}

try {
    $db = Database::conn();
    echo "Connected to database.\n";

    $workspaceId = 1; // Assuming default
    $companyId = 1; // Assuming default

    // 1. Create Social Accounts
    $accounts = [
        ['facebook', 'Facebook Page', 'fb_user', 'My Awesome Brand', 'https://facebook.com/mybrand', 'connected'],
        ['instagram', 'Instagram Business', 'ig_user', 'myawesomebrand', 'https://instagram.com/myawesomebrand', 'connected'],
        ['linkedin', 'LinkedIn Company', 'li_user', 'My Awesome Brand', 'https://linkedin.com/u/mybrand', 'connected'],
        ['twitter', 'X (Twitter)', 'x_user', 'mybrand_official', 'https://x.com/mybrand_official', 'disconnected']
    ];

    foreach ($accounts as $acc) {
        $stmt = $db->prepare("SELECT id FROM social_accounts WHERE platform = ? AND workspace_id = ?");
        $stmt->execute([$acc[0], $workspaceId]);
        
        if (!$stmt->fetch()) {
            $sql = "INSERT INTO social_accounts (workspace_id, company_id, platform, account_type, platform_account_id, account_name, account_username, account_url, status, followers_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $db->prepare($sql)->execute([
                $workspaceId, $companyId, $acc[0], 'page', uniqid(), $acc[3], $acc[2], $acc[4], $acc[5], rand(100, 5000)
            ]);
            echo "Created account: {$acc[3]}\n";
        }
    }

    $accountIds = $db->query("SELECT id FROM social_accounts WHERE workspace_id = $workspaceId")->fetchAll(PDO::FETCH_COLUMN);

    // 2. Create Posts
    $posts = [
        ['Hello world! This is my first scheduled post.', 'scheduled', date('Y-m-d H:i:s', strtotime('+1 day'))],
        ['Check out our new product launch! 🚀', 'draft', null],
        ['Just published this amazing update.', 'published', date('Y-m-d H:i:s', strtotime('-2 hours'))]
    ];

    foreach ($posts as $post) {
        $stmt = $db->prepare("SELECT id FROM social_posts WHERE content = ? AND workspace_id = ?");
        $stmt->execute([$post[0], $workspaceId]);

        if (!$stmt->fetch()) {
            $sql = "INSERT INTO social_posts (workspace_id, company_id, content, status, scheduled_at, published_at, target_accounts) VALUES (?, ?, ?, ?, ?, ?, ?)";
            $publishedAt = $post[1] === 'published' ? $post[2] : null;
            $db->prepare($sql)->execute([
                $workspaceId, $companyId, $post[0], $post[1], $post[2], $publishedAt, json_encode($accountIds)
            ]);
            $postId = $db->lastInsertId();
            echo "Created post: {$post[0]}\n";

            // Add analytics for published post
            if ($post[1] === 'published') {
                foreach ($accountIds as $accId) {
                    $db->prepare("INSERT INTO social_post_analytics (post_id, social_account_id, impressions, reach, likes, comments, shares, clicks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                       ->execute([$postId, $accId, rand(100, 1000), rand(50, 800), rand(10, 100), rand(0, 10), rand(0, 50), rand(0, 20)]);
                }
            }
        }
    }

    // 3. Create Templates
    $stmt = $db->query("SELECT COUNT(*) FROM social_templates WHERE workspace_id = $workspaceId");
    if ($stmt->fetchColumn() == 0) {
        $db->prepare("INSERT INTO social_templates (workspace_id, company_id, name, content) VALUES (?, ?, ?, ?)")
           ->execute([$workspaceId, $companyId, 'Weekly Promo', 'Get 20% off this week only! #sale #promo']);
        echo "Created template.\n";
    }

    // 4. Create Hashtag Groups
    $stmt = $db->query("SELECT COUNT(*) FROM hashtag_groups WHERE workspace_id = $workspaceId");
    if ($stmt->fetchColumn() == 0) {
        $db->prepare("INSERT INTO hashtag_groups (workspace_id, company_id, name, hashtags) VALUES (?, ?, ?, ?)")
           ->execute([$workspaceId, $companyId, 'Tech Tags', json_encode(['#tech', '#innovation', '#startup', '#coding'])]);
        echo "Created hashtag group.\n";
    }

    echo "Sample data population complete.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
