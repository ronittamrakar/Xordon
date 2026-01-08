<?php
/**
 * Insert test security events for demonstration
 */

require_once __DIR__ . '/backend/src/Database.php';

try {
    $pdo = \Xordon\Database::conn();
    
    echo "Inserting test security events...\n\n";
    
    $testEvents = [
        [
            'type' => 'rate_limit_exceeded',
            'severity' => 'warning',
            'ip' => '192.168.1.100',
            'metadata' => json_encode([
                'identifier' => 'user_123',
                'limit' => 100,
                'scope' => 'api',
                'url' => '/api/contacts'
            ])
        ],
        [
            'type' => 'rate_limit_exceeded',
            'severity' => 'warning',
            'ip' => '192.168.1.101',
            'metadata' => json_encode([
                'identifier' => 'user_456',
                'limit' => 100,
                'scope' => 'api',
                'url' => '/api/leads'
            ])
        ],
        [
            'type' => 'rate_limit_exceeded',
            'severity' => 'warning',
            'ip' => '192.168.1.100',
            'metadata' => json_encode([
                'identifier' => 'user_123',
                'limit' => 100,
                'scope' => 'api',
                'url' => '/api/campaigns'
            ])
        ],
        [
            'type' => 'login_fail',
            'severity' => 'warning',
            'ip' => '10.0.0.50',
            'metadata' => json_encode([
                'username' => 'admin@example.com',
                'reason' => 'invalid_password'
            ])
        ],
        [
            'type' => 'login_fail',
            'severity' => 'warning',
            'ip' => '10.0.0.50',
            'metadata' => json_encode([
                'username' => 'admin@example.com',
                'reason' => 'invalid_password'
            ])
        ],
    ];
    
    $stmt = $pdo->prepare("
        INSERT INTO security_events (type, severity, ip_address, metadata, created_at) 
        VALUES (?, ?, ?, ?, NOW() - INTERVAL FLOOR(RAND() * 24) HOUR)
    ");
    
    foreach ($testEvents as $event) {
        $stmt->execute([
            $event['type'],
            $event['severity'],
            $event['ip'],
            $event['metadata']
        ]);
    }
    
    echo "✅ Inserted " . count($testEvents) . " test security events\n\n";
    
    // Show summary
    $stmt = $pdo->query("
        SELECT 
            type,
            COUNT(*) as count,
            COUNT(DISTINCT ip_address) as unique_ips
        FROM security_events 
        GROUP BY type
    ");
    
    echo "Summary:\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "  - {$row['type']}: {$row['count']} events from {$row['unique_ips']} unique IPs\n";
    }
    
    echo "\n✅ Test data ready! Visit http://localhost:5173/admin/health and click the Security tab\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
