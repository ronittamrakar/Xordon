<?php
/**
 * Lead Routing Engine Test Script
 * Routes new lead requests to matching providers
 */

require_once __DIR__ . '/../vendor/autoload.php';

try {
    $db = new PDO('mysql:host=localhost;dbname=xordon', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $workspaceId = 1;
    
    echo "=== Lead Routing Engine ===\n\n";
    
    // Get all new/unrouted lead requests
    $stmt = $db->prepare("SELECT lr.*, GROUP_CONCAT(lrs.service_id) as service_ids 
        FROM lead_requests lr 
        LEFT JOIN lead_request_services lrs ON lrs.lead_request_id = lr.id AND lrs.workspace_id = lr.workspace_id
        WHERE lr.workspace_id = ? AND lr.status IN ('new', 'routing')
        GROUP BY lr.id");
    $stmt->execute([$workspaceId]);
    $leadRequests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($leadRequests) . " leads to route\n\n";
    
    foreach ($leadRequests as $lead) {
        echo "Processing Lead #{$lead['id']}: {$lead['title']}\n";
        echo "  Location: {$lead['city']}, {$lead['postal_code']}\n";
        echo "  Budget: \${$lead['budget_min']} - \${$lead['budget_max']}\n";
        
        // Update status to routing
        $db->prepare("UPDATE lead_requests SET status = 'routing' WHERE id = ?")->execute([$lead['id']]);
        
        // Get service IDs for this lead
        $serviceIds = $lead['service_ids'] ? explode(',', $lead['service_ids']) : [];
        
        if (empty($serviceIds)) {
            echo "  WARNING: No services specified for this lead\n";
            continue;
        }
        
        // Find matching providers
        // Match criteria:
        // 1. Provider offers at least one of the requested services
        // 2. Provider's service area covers the lead location
        // 3. Lead budget meets provider's minimum
        // 4. Provider is active and has credits
        
        $sql = "SELECT DISTINCT
            sp.id as pro_id,
            sp.company_id,
            sp.business_name,
            sp.avg_rating,
            cw.balance,
            sa.radius_km,
            sa.latitude as provider_lat,
            sa.longitude as provider_lng,
            (6371 * acos(cos(radians(?)) * cos(radians(sa.latitude)) * cos(radians(sa.longitude) - radians(?)) + sin(radians(?)) * sin(radians(sa.latitude)))) AS distance_km
        FROM service_pros sp
        INNER JOIN service_pro_offerings spo ON spo.company_id = sp.company_id AND spo.workspace_id = sp.workspace_id
        INNER JOIN service_areas sa ON sa.company_id = sp.company_id AND sa.workspace_id = sp.workspace_id
        INNER JOIN credits_wallets cw ON cw.company_id = sp.company_id AND cw.workspace_id = sp.workspace_id
        INNER JOIN pro_preferences pp ON pp.company_id = sp.company_id AND pp.workspace_id = sp.workspace_id
        WHERE sp.workspace_id = ?
        AND sp.status = 'active'
        AND spo.service_id IN (" . implode(',', array_fill(0, count($serviceIds), '?')) . ")
        AND spo.is_active = 1
        AND cw.balance > 0
        AND (pp.min_budget IS NULL OR pp.min_budget <= ?)
        HAVING distance_km <= sa.radius_km
        ORDER BY distance_km ASC, sp.avg_rating DESC
        LIMIT 10";
        
        $params = [
            $lead['latitude'],  // for cos(radians(?))
            $lead['longitude'], // for cos(radians(?))
            $lead['latitude'],  // for sin(radians(?))
            $workspaceId
        ];
        $params = array_merge($params, $serviceIds);
        $params[] = $lead['budget_max'] ?? 999999;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "  Found " . count($providers) . " matching providers\n";
        
        if (empty($providers)) {
            $db->prepare("UPDATE lead_requests SET status = 'partial' WHERE id = ?")->execute([$lead['id']]);
            echo "  No matches found - marked as partial\n\n";
            continue;
        }
        
        // Get pricing for this lead
        $stmt = $db->prepare("SELECT base_price FROM lead_pricing_rules WHERE workspace_id = ? AND service_id IN (" . implode(',', array_fill(0, count($serviceIds), '?')) . ") AND is_active = 1 ORDER BY priority DESC LIMIT 1");
        $stmt->execute(array_merge([$workspaceId], $serviceIds));
        $pricing = $stmt->fetch(PDO::FETCH_ASSOC);
        $leadPrice = $pricing ? $pricing['base_price'] : 25.00; // Default price
        
        echo "  Lead price: \$$leadPrice per provider\n";
        
        // Create matches for qualifying providers
        $matchCount = 0;
        $maxMatches = min(count($providers), $lead['max_sold_count'] ?? 3);
        
        foreach (array_slice($providers, 0, $maxMatches) as $provider) {
            // Check if match already exists
            $stmt = $db->prepare("SELECT id FROM lead_matches WHERE workspace_id = ? AND lead_request_id = ? AND company_id = ?");
            $stmt->execute([$workspaceId, $lead['id'], $provider['company_id']]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                echo "  - {$provider['business_name']}: Already matched\n";
                continue;
            }
            
            // Calculate match score
            $matchScore = 100;
            $matchScore -= ($provider['distance_km'] * 2); // Closer is better
            $matchScore += ($provider['avg_rating'] * 5); // Higher rating is better
            $matchScore = max(0, min(100, $matchScore));
            
            $matchReason = [
                'distance_km' => round($provider['distance_km'], 2),
                'rating' => $provider['avg_rating'],
                'balance' => $provider['balance']
            ];
            
            // Create match
            $expiresAt = date('Y-m-d H:i:s', strtotime('+72 hours'));
            $stmt = $db->prepare("INSERT INTO lead_matches (
                workspace_id, lead_request_id, company_id, pro_id,
                match_score, match_reason, distance_km, lead_price,
                status, offered_at, expires_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'offered', NOW(), ?, NOW())");
            
            $stmt->execute([
                $workspaceId,
                $lead['id'],
                $provider['company_id'],
                $provider['pro_id'],
                $matchScore,
                json_encode($matchReason),
                $provider['distance_km'],
                $leadPrice,
                $expiresAt
            ]);
            
            $matchId = $db->lastInsertId();
            $matchCount++;
            
            echo "  - Matched: {$provider['business_name']} (score: " . round($matchScore, 1) . ", distance: " . round($provider['distance_km'], 1) . "km, price: \$$leadPrice)\n";
        }
        
        // Update lead request status
        if ($matchCount > 0) {
            $db->prepare("UPDATE lead_requests SET status = 'routed', routed_at = NOW(), current_sold_count = ? WHERE id = ?")
                ->execute([$matchCount, $lead['id']]);
            echo "  ✓ Routed to $matchCount providers\n";
        } else {
            $db->prepare("UPDATE lead_requests SET status = 'partial' WHERE id = ?")->execute([$lead['id']]);
            echo "  ⚠ No matches created\n";
        }
        
        echo "\n";
    }
    
    echo "=== Routing Complete ===\n\n";
    
    // Summary
    $stmt = $db->query("SELECT status, COUNT(*) as count FROM lead_requests WHERE workspace_id = 1 GROUP BY status");
    echo "Lead Request Status:\n";
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        echo "  {$row['status']}: {$row['count']}\n";
    }
    
    echo "\n";
    $stmt = $db->query("SELECT status, COUNT(*) as count FROM lead_matches WHERE workspace_id = 1 GROUP BY status");
    echo "Lead Match Status:\n";
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        echo "  {$row['status']}: {$row['count']}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
