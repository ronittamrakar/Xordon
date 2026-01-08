<?php
/**
 * Lead Marketplace Test Data Generator
 * Populates database with realistic test data for all marketplace features
 */

require_once __DIR__ . '/../vendor/autoload.php';

try {
    $db = new PDO('mysql:host=localhost;dbname=xordon', 'root', '');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $workspaceId = 1;
    
    echo "=== Creating Lead Marketplace Test Data ===\n\n";
    
    // Step 1: Create or get companies for providers
    echo "1. Creating service provider companies...\n";
    
    $providerCompanies = [
        ['name' => 'Elite Plumbing Services', 'user_id' => 1],
        ['name' => 'Quick Fix Electrical', 'user_id' => 1],
        ['name' => 'Green Lawn Care Pros', 'user_id' => 1],
        ['name' => 'Home Renovation Experts', 'user_id' => 1],
        ['name' => 'Spotless Cleaning Co', 'user_id' => 1],
    ];
    
    $companyIds = [];
    foreach ($providerCompanies as $pc) {
        $stmt = $db->prepare('SELECT id FROM companies WHERE workspace_id = ? AND name = ?');
        $stmt->execute([$workspaceId, $pc['name']]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            $companyIds[] = $existing['id'];
            echo "  - Found existing: {$pc['name']}\n";
        } else {
            $stmt = $db->prepare('INSERT INTO companies (workspace_id, user_id, name, status, is_client, created_at) VALUES (?, ?, ?, ?, 0, NOW())');
            $stmt->execute([$workspaceId, $pc['user_id'], $pc['name'], 'active']);
            $companyIds[] = $db->lastInsertId();
            echo "  - Created: {$pc['name']}\n";
        }
    }
    
    // Step 2: Create/update service catalog
    echo "\n2. Setting up service catalog...\n";
    
    $services = [
        ['name' => 'Plumbing', 'slug' => 'plumbing', 'parent_id' => null, 'icon' => 'wrench'],
        ['name' => 'Electrical', 'slug' => 'electrical', 'parent_id' => null, 'icon' => 'zap'],
        ['name' => 'Lawn Care', 'slug' => 'lawn-care', 'parent_id' => null, 'icon' => 'leaf'],
        ['name' => 'Home Remodeling', 'slug' => 'home-remodeling', 'parent_id' => null, 'icon' => 'home'],
        ['name' => 'Cleaning', 'slug' => 'cleaning', 'parent_id' => null, 'icon' => 'sparkles'],
        ['name' => 'HVAC', 'slug' => 'hvac', 'parent_id' => null, 'icon' => 'wind'],
        ['name' => 'Roofing', 'slug' => 'roofing', 'parent_id' => null, 'icon' => 'home'],
        ['name' => 'Painting', 'slug' => 'painting', 'parent_id' => null, 'icon' => 'paint-brush'],
    ];
    
    $serviceIds = [];
    foreach ($services as $svc) {
        $stmt = $db->prepare('SELECT id FROM service_catalog WHERE workspace_id = ? AND slug = ?');
        $stmt->execute([$workspaceId, $svc['slug']]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            $serviceIds[$svc['slug']] = $existing['id'];
            echo "  - Service exists: {$svc['name']}\n";
        } else {
            $stmt = $db->prepare('INSERT INTO service_catalog (workspace_id, parent_id, name, slug, icon, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())');
            $stmt->execute([$workspaceId, $svc['parent_id'], $svc['name'], $svc['slug'], $svc['icon']]);
            $serviceIds[$svc['slug']] = $db->lastInsertId();
            echo "  - Created service: {$svc['name']}\n";
        }
    }
    
    // Step 3: Create service providers
    echo "\n3. Creating service provider profiles...\n";
    
    $providers = [
        [
            'company_id' => $companyIds[0],
            'business_name' => 'Elite Plumbing Services',
            'contact_name' => 'John Smith',
            'contact_email' => 'john@eliteplumbing.com',
            'contact_phone' => '555-0101',
            'bio' => '25+ years of experience in residential and commercial plumbing.',
            'years_in_business' => 25,
            'license_number' => 'PL-12345',
            'status' => 'active',
            'avg_rating' => 4.8,
            'total_reviews' => 127,
        ],
        [
            'company_id' => $companyIds[1],
            'business_name' => 'Quick Fix Electrical',
            'contact_name' => 'Sarah Johnson',
            'contact_email' => 'sarah@quickfixelectric.com',
            'contact_phone' => '555-0202',
            'bio' => 'Licensed electricians available 24/7 for emergency service.',
            'years_in_business' => 15,
            'license_number' => 'EL-67890',
            'status' => 'active',
            'avg_rating' => 4.9,
            'total_reviews' => 89,
        ],
        [
            'company_id' => $companyIds[2],
            'business_name' => 'Green Lawn Care Pros',
            'contact_name' => 'Mike Green',
            'contact_email' => 'mike@greenlawncare.com',
            'contact_phone' => '555-0303',
            'bio' => 'Eco-friendly lawn care and landscaping services.',
            'years_in_business' => 10,
            'license_number' => 'LC-11111',
            'status' => 'active',
            'avg_rating' => 4.7,
            'total_reviews' => 64,
        ],
        [
            'company_id' => $companyIds[3],
            'business_name' => 'Home Renovation Experts',
            'contact_name' => 'Lisa Brown',
            'contact_email' => 'lisa@homerenovation.com',
            'contact_phone' => '555-0404',
            'bio' => 'Full-service home remodeling from kitchens to bathrooms.',
            'years_in_business' => 18,
            'license_number' => 'GC-22222',
            'status' => 'active',
            'avg_rating' => 4.6,
            'total_reviews' => 52,
        ],
        [
            'company_id' => $companyIds[4],
            'business_name' => 'Spotless Cleaning Co',
            'contact_name' => 'Amy White',
            'contact_email' => 'amy@spotlesscleaning.com',
            'contact_phone' => '555-0505',
            'bio' => 'Professional residential and commercial cleaning services.',
            'years_in_business' => 8,
            'license_number' => 'CL-33333',
            'status' => 'active',
            'avg_rating' => 4.5,
            'total_reviews' => 41,
        ],
    ];
    
    foreach ($providers as $idx => $prov) {
        $stmt = $db->prepare('SELECT id FROM service_pros WHERE workspace_id = ? AND company_id = ?');
        $stmt->execute([$workspaceId, $prov['company_id']]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existing) {
            $stmt = $db->prepare('INSERT INTO service_pros (workspace_id, company_id, business_name, contact_name, contact_email, contact_phone, bio, years_in_business, license_number, status, avg_rating, total_reviews, created_at, verified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
            $stmt->execute([
                $workspaceId, 
                $prov['company_id'], 
                $prov['business_name'], 
                $prov['contact_name'], 
                $prov['contact_email'], 
                $prov['contact_phone'], 
                $prov['bio'], 
                $prov['years_in_business'], 
                $prov['license_number'], 
                $prov['status'], 
                $prov['avg_rating'], 
                $prov['total_reviews']
            ]);
            echo "  - Created provider: {$prov['business_name']}\n";
        } else {
            echo "  - Provider exists: {$prov['business_name']}\n";
        }
    }
    
    // Step 4: Create provider preferences
    echo "\n4. Setting up provider preferences...\n";
    
    foreach ($companyIds as $companyId) {
        $stmt = $db->prepare('SELECT id FROM pro_preferences WHERE workspace_id = ? AND company_id = ?');
        $stmt->execute([$workspaceId, $companyId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existing) {
            $stmt = $db->prepare('INSERT INTO pro_preferences (workspace_id, company_id, min_budget, max_radius_km, max_leads_per_day, max_leads_per_week, notify_email, notify_sms, created_at) VALUES (?, ?, 50, 50, 10, 50, 1, 1, NOW())');
            $stmt->execute([$workspaceId, $companyId]);
            echo "  - Created preferences for company $companyId\n";
        }
    }
    
    // Step 5: Create service areas
    echo "\n5. Setting up service areas...\n";
    
    $serviceAreas = [
        ['company_id' => $companyIds[0], 'city' => 'Los Angeles', 'region' => 'CA', 'postal_code' => '90001', 'lat' => 34.0522, 'lng' => -118.2437, 'radius' => 30],
        ['company_id' => $companyIds[1], 'city' => 'Los Angeles', 'region' => 'CA', 'postal_code' => '90002', 'lat' => 34.0522, 'lng' => -118.2437, 'radius' => 25],
        ['company_id' => $companyIds[2], 'city' => 'Los Angeles', 'region' => 'CA', 'postal_code' => '90003', 'lat' => 34.0522, 'lng' => -118.2437, 'radius' => 40],
        ['company_id' => $companyIds[3], 'city' => 'Los Angeles', 'region' => 'CA', 'postal_code' => '90004', 'lat' => 34.0522, 'lng' => -118.2437, 'radius' => 35],
        ['company_id' => $companyIds[4], 'city' => 'Los Angeles', 'region' => 'CA', 'postal_code' => '90005', 'lat' => 34.0522, 'lng' => -118.2437, 'radius' => 20],
    ];
    
    foreach ($serviceAreas as $area) {
        $stmt = $db->prepare('SELECT id FROM service_areas WHERE workspace_id = ? AND company_id = ?');
        $stmt->execute([$workspaceId, $area['company_id']]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existing) {
            $stmt = $db->prepare('INSERT INTO service_areas (workspace_id, company_id, city, region, postal_code, latitude, longitude, radius_km, is_primary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())');
            $stmt->execute([
                $workspaceId, 
                $area['company_id'], 
                $area['city'], 
                $area['region'], 
                $area['postal_code'], 
                $area['lat'], 
                $area['lng'], 
                $area['radius']
            ]);
            echo "  - Created service area for company {$area['company_id']} in {$area['city']}\n";
        }
    }
    
    // Step 6: Create provider service offerings
    echo "\n6. Setting up service offerings...\n";
    
    $offerings = [
        ['company_id' => $companyIds[0], 'service_slug' => 'plumbing', 'min_price' => 75, 'max_price' => 500],
        ['company_id' => $companyIds[0], 'service_slug' => 'hvac', 'min_price' => 100, 'max_price' => 1000],
        ['company_id' => $companyIds[1], 'service_slug' => 'electrical', 'min_price' => 85, 'max_price' => 750],
        ['company_id' => $companyIds[2], 'service_slug' => 'lawn-care', 'min_price' => 50, 'max_price' => 300],
        ['company_id' => $companyIds[3], 'service_slug' => 'home-remodeling', 'min_price' => 1000, 'max_price' => 50000],
        ['company_id' => $companyIds[3], 'service_slug' => 'painting', 'min_price' => 200, 'max_price' => 2000],
        ['company_id' => $companyIds[4], 'service_slug' => 'cleaning', 'min_price' => 75, 'max_price' => 250],
    ];
    
    foreach ($offerings as $off) {
        if (isset($serviceIds[$off['service_slug']])) {
            $stmt = $db->prepare('SELECT id FROM service_pro_offerings WHERE workspace_id = ? AND company_id = ? AND service_id = ?');
            $stmt->execute([$workspaceId, $off['company_id'], $serviceIds[$off['service_slug']]]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$existing) {
                $stmt = $db->prepare('INSERT INTO service_pro_offerings (workspace_id, company_id, service_id, min_price, max_price, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())');
                $stmt->execute([
                    $workspaceId, 
                    $off['company_id'], 
                    $serviceIds[$off['service_slug']], 
                    $off['min_price'], 
                    $off['max_price']
                ]);
                echo "  - Created offering: company {$off['company_id']} offers {$off['service_slug']}\n";
            }
        }
    }
    
    // Step 7: Create wallets with initial credits
    echo "\n7. Creating provider wallets with credits...\n";
    
    foreach ($companyIds as $companyId) {
        $stmt = $db->prepare('SELECT id, balance FROM credits_wallets WHERE workspace_id = ? AND company_id = ?');
        $stmt->execute([$workspaceId, $companyId]);
        $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$wallet) {
            $initialBalance = 500.00; // Give each provider $500 in credits
            $stmt = $db->prepare('INSERT INTO credits_wallets (workspace_id, company_id, balance, lifetime_purchased, last_purchase_at, created_at) VALUES (?, ?, ?, ?, NOW(), NOW())');
            $stmt->execute([$workspaceId, $companyId, $initialBalance, $initialBalance]);
            $walletId = $db->lastInsertId();
            
            // Add initial purchase transaction
            $stmt = $db->prepare('INSERT INTO credit_transactions (workspace_id, company_id, wallet_id, type, amount, balance_before, balance_after, description, payment_status, created_at) VALUES (?, ?, ?, "purchase", ?, 0, ?, "Initial credit purchase", "completed", NOW())');
            $stmt->execute([$workspaceId, $companyId, $walletId, $initialBalance, $initialBalance]);
            
            echo "  - Created wallet for company $companyId with $$initialBalance\n";
        } else {
            echo "  - Wallet exists for company $companyId with ${$wallet['balance']}\n";
        }
    }
    
    // Step 8: Create pricing rules
    echo "\n8. Setting up pricing rules...\n";
    
    $pricingRules = [
        ['service_slug' => 'plumbing', 'base_price' => 25.00, 'priority' => 1],
        ['service_slug' => 'electrical', 'base_price' => 30.00, 'priority' => 1],
        ['service_slug' => 'lawn-care', 'base_price' => 15.00, 'priority' => 1],
        ['service_slug' => 'home-remodeling', 'base_price' => 50.00, 'priority' => 1],
        ['service_slug' => 'cleaning', 'base_price' => 20.00, 'priority' => 1],
        ['service_slug' => 'hvac', 'base_price' => 35.00, 'priority' => 1],
    ];
    
    foreach ($pricingRules as $rule) {
        if (isset($serviceIds[$rule['service_slug']])) {
            $stmt = $db->prepare('SELECT id FROM lead_pricing_rules WHERE workspace_id = ? AND service_id = ?');
            $stmt->execute([$workspaceId, $serviceIds[$rule['service_slug']]]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$existing) {
                $stmt = $db->prepare('INSERT INTO lead_pricing_rules (workspace_id, service_id, base_price, priority, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())');
                $stmt->execute([
                    $workspaceId, 
                    $serviceIds[$rule['service_slug']], 
                    $rule['base_price'], 
                    $rule['priority']
                ]);
                echo "  - Created pricing rule for {$rule['service_slug']}: \${$rule['base_price']}\n";
            }
        }
    }
    
    // Step 9: Create test lead requests
    echo "\n9. Creating test lead requests...\n";
    
    $leadRequests = [
        [
            'service_slug' => 'plumbing',
            'consumer_name' => 'David Martinez',
            'consumer_email' => 'david@example.com',
            'consumer_phone' => '555-1001',
            'city' => 'Los Angeles',
            'postal_code' => '90001',
            'title' => 'Emergency Pipe Leak',
            'description' => 'Have a burst pipe in the kitchen, need immediate help!',
            'budget_min' => 100,
            'budget_max' => 500,
            'timing' => 'asap',
            'lat' => 34.0522,
            'lng' => -118.2437,
        ],
        [
            'service_slug' => 'electrical',
            'consumer_name' => 'Jennifer Lee',
            'consumer_email' => 'jennifer@example.com',
            'consumer_phone' => '555-1002',
            'city' => 'Los Angeles',
            'postal_code' => '90002',
            'title' => 'Install Ceiling Fan',
            'description' => 'Need to install 2 ceiling fans in bedrooms',
            'budget_min' => 150,
            'budget_max' => 400,
            'timing' => 'within_week',
            'lat' => 34.0522,
            'lng' => -118.2437,
        ],
        [
            'service_slug' => 'lawn-care',
            'consumer_name' => 'Robert Taylor',
            'consumer_email' => 'robert@example.com',
            'consumer_phone' => '555-1003',
            'city' => 'Los Angeles',
            'postal_code' => '90003',
            'title' => 'Weekly Lawn Maintenance',
            'description' => 'Looking for regular lawn mowing and edging service',
            'budget_min' => 50,
            'budget_max' => 100,
            'timing' => 'flexible',
            'lat' => 34.0522,
            'lng' => -118.2437,
        ],
        [
            'service_slug' => 'home-remodeling',
            'consumer_name' => 'Emily Davis',
            'consumer_email' => 'emily@example.com',
            'consumer_phone' => '555-1004',
            'city' => 'Los Angeles',
            'postal_code' => '90004',
            'title' => 'Kitchen Remodel',
            'description' => 'Complete kitchen renovation including cabinets and countertops',
            'budget_min' => 15000,
            'budget_max' => 30000,
            'timing' => 'flexible',
            'lat' => 34.0522,
            'lng' => -118.2437,
        ],
        [
            'service_slug' => 'cleaning',
            'consumer_name' => 'Michael Wilson',
            'consumer_email' => 'michael@example.com',
            'consumer_phone' => '555-1005',
            'city' => 'Los Angeles',
            'postal_code' => '90005',
            'title' => 'Deep House Cleaning',
            'description' => 'Need deep cleaning for 3-bedroom house',
            'budget_min' => 150,
            'budget_max' => 300,
            'timing' => 'within_24h',
            'lat' => 34.0522,
            'lng' => -118.2437,
        ],
    ];
    
    foreach ($leadRequests as $lead) {
        if (isset($serviceIds[$lead['service_slug']])) {
            // Check if lead already exists
            $stmt = $db->prepare('SELECT id FROM lead_requests WHERE workspace_id = ? AND consumer_phone = ? AND title = ?');
            $stmt->execute([$workspaceId, $lead['consumer_phone'], $lead['title']]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$existing) {
                $stmt = $db->prepare('INSERT INTO lead_requests (workspace_id, source, consumer_name, consumer_email, consumer_phone, city, postal_code, latitude, longitude, budget_min, budget_max, timing, title, description, status, created_at) VALUES (?, "form", ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "new", NOW())');
                $stmt->execute([
                    $workspaceId,
                    $lead['consumer_name'],
                    $lead['consumer_email'],
                    $lead['consumer_phone'],
                    $lead['city'],
                    $lead['postal_code'],
                    $lead['lat'],
                    $lead['lng'],
                    $lead['budget_min'],
                    $lead['budget_max'],
                    $lead['timing'],
                    $lead['title'],
                    $lead['description']
                ]);
                $leadId = $db->lastInsertId();
                
                // Add service association
                $stmt = $db->prepare('INSERT INTO lead_request_services (workspace_id, lead_request_id, service_id, created_at) VALUES (?, ?, ?, NOW())');
                $stmt->execute([$workspaceId, $leadId, $serviceIds[$lead['service_slug']]]);
                
                echo "  - Created lead request: {$lead['title']} (ID: $leadId)\n";
            } else {
                echo "  - Lead request exists: {$lead['title']}\n";
            }
        }
    }
    
    echo "\n=== Test Data Creation Complete! ===\n";
    echo "\nNext steps:\n";
    echo "1. Visit http://localhost:5173/lead-marketplace/inbox to view provider inbox\n";
    echo "2. Visit http://localhost:5173/lead-marketplace/wallet to manage credits\n";
    echo "3. Visit http://localhost:5173/lead-marketplace/services to browse services\n";
    echo "4. Visit http://localhost:5173/get-quotes to submit a new lead request\n";
    echo "\nAll providers have been funded with \$500 in credits.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
