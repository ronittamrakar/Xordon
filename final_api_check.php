<?php
/**
 * Final API Status Check
 */

$baseUrl = 'http://localhost:8001/api';
$authHeader = 'Authorization: Bearer dev-token-bypass';

$endpoints = [
    // Core
    ['GET', '/health', 'Health Check'],
    ['GET', '/auth/me', 'Authentication'],
    ['GET', '/workspaces', 'Workspaces'],
    
    // CRM
    ['GET', '/contacts', 'Contacts'],
    ['GET', '/companies', 'Companies'],
    ['GET', '/deals', 'Deals'],
    ['GET', '/leads', 'Leads'],
    
    // Marketing
    ['GET', '/campaigns', 'Campaigns'],
    ['GET', '/automations', 'Automations'],
    
    // Forms  
    ['GET', '/webforms-api/forms', 'Web Forms'],
    
    // Helpdesk
    ['GET', '/tickets', 'Tickets'],
    ['GET', '/ticket-stages', 'Ticket Stages'],
    ['GET', '/ticket-types', 'Ticket Types'],
    
    // Projects
    ['GET', '/projects', 'Projects'],
    ['GET', '/tasks', 'Tasks'],
    
    // Files
    ['GET', '/files', 'Files'],
    ['GET', '/folders', 'Folders'],
    
    // Scheduling
    ['GET', '/appointments', 'Appointments'],
    ['GET', '/calendars', 'Calendars'],
    
    // Websites
    ['GET', '/websites', 'Websites'],
    ['GET', '/proposals', 'Proposals'],
    
    // Finance
    ['GET', '/invoices', 'Invoices'],
    
    // Phone
    ['GET', '/phone-numbers', 'Phone Numbers'],
    ['GET', '/call-logs', 'Call Logs'],
    
    // AI
    ['GET', '/ai/agents', 'AI Agents'],
];

echo "=== API ENDPOINT STATUS ===\n\n";

$working = 0;
$broken = 0;

foreach ($endpoints as $ep) {
    list($method, $path, $name) = $ep;
    
    $ch = curl_init($baseUrl . $path);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [$authHeader]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 200 && $httpCode < 400) {
        echo "✓ $name ($path): HTTP $httpCode\n";
        $working++;
    } else {
        echo "✗ $name ($path): HTTP $httpCode\n";
        $broken++;
        
        // Show error if available
        if ($response) {
            $data = json_decode($response, true);
            if (isset($data['error']) || isset($data['message'])) {
                echo "  Error: " . ($data['message'] ?? $data['error']) . "\n";
            }
        }
    }
}

echo "\n=== SUMMARY ===\n";
echo "Working: $working\n";
echo "Broken: $broken\n";
echo "Total: " . ($working + $broken) . "\n";

$percentage = $working / ($working + $broken) * 100;
echo "\nHealth: " . round($percentage, 1) . "%\n";

if ($percentage >= 90) {
    echo "Status: ✅ EXCELLENT\n";
} elseif ($percentage >= 70) {
    echo "Status: ⚠️ GOOD\n";
} elseif ($percentage >= 50) {
    echo "Status: ⚠️ FAIR\n";
} else {
    echo "Status: ❌ NEEDS ATTENTION\n";
}
