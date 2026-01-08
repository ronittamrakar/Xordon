<?php
/**
 * Google Business Profile Controller
 * Comprehensive GMB/GBP management including connection, locations, posts, reviews, Q&A, insights
 * 
 * SCOPING: Company-scoped (requires active company)
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class GMBController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    private static function getCompanyId(): int {
        return Permissions::requireActiveCompany();
    }

    // ==================== API HELPERS ====================

    /**
     * Make a request to the Google API
     */
    private function makeGoogleApiRequest($method, $url, $connection, $data = null) {
        // Check if token needs refresh
        if (strtotime($connection['token_expires_at']) < time() + 300) {
            $connection = $this->refreshAccessToken($connection);
            if (!$connection) {
                throw new Exception("Failed to refresh access token");
            }
        }

        // Check if this is a simulated connection
        if (strpos($connection['access_token'], 'simulated_') === 0) {
            return $this->handleSimulatedRequest($method, $url, $data);
        }

        $headers = [
            'Authorization: Bearer ' . $connection['access_token'],
            'Content-Type: application/json'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } elseif ($method === 'DELETE') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 400) {
            $error = json_decode($response, true);
            throw new Exception("Google API Error ($httpCode): " . ($error['error']['message'] ?? $response));
        }

        return json_decode($response, true);
    }

    private function refreshAccessToken($connection) {
        $clientId = getenv('GOOGLE_CLIENT_ID');
        $clientSecret = getenv('GOOGLE_CLIENT_SECRET');
        
        if (strpos($connection['access_token'], 'simulated_') === 0) {
            // Update simulated token
            $db = Database::conn();
            $stmt = $db->prepare("UPDATE gmb_connections SET token_expires_at = ?, updated_at = NOW() WHERE id = ?");
            $expiration = date('Y-m-d H:i:s', time() + 3600);
            $stmt->execute([$expiration, $connection['id']]);
            $connection['token_expires_at'] = $expiration;
            return $connection;
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'refresh_token' => $connection['refresh_token'],
            'grant_type' => 'refresh_token'
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $data = json_decode($response, true);
        curl_close($ch);

        if (isset($data['access_token'])) {
            $db = Database::conn();
            $expiresIn = $data['expires_in'] ?? 3600;
            $expiration = date('Y-m-d H:i:s', time() + $expiresIn);
            
            $stmt = $db->prepare("UPDATE gmb_connections SET access_token = ?, token_expires_at = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$data['access_token'], $expiration, $connection['id']]);
            
            $connection['access_token'] = $data['access_token'];
            $connection['token_expires_at'] = $expiration;
            return $connection;
        }

        return null;
    }

    private function handleSimulatedRequest($method, $url, $data) {
        // Very basic simulation for development
        if (strpos($url, 'accounts') !== false && $method === 'GET') {
            return ['accounts' => [['name' => 'accounts/123', 'accountName' => 'Test Account']]];
        }
        if (strpos($url, 'locations') !== false && $method === 'GET') {
            // Mock location response structure from Google API
            return ['locations' => [[
                'name' => 'accounts/123/locations/456',
                'title' => 'Simulated Business',
                'storefrontAddress' => [
                    'addressLines' => ['123 Test St'],
                    'locality' => 'Test City',
                    'administrativeArea' => 'TS',
                    'postalCode' => '12345',
                    'regionCode' => 'US'
                ],
                'phoneNumbers' => ['primaryPhone' => '+15555555555'],
                'categories' => ['primaryCategory' => ['displayName' => 'Test Category']]
            ]]]; 
        }
        return ['success' => true];
    }

    // ==================== CONNECTION ====================

    public function getConnection() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT * FROM gmb_connections WHERE workspace_id = ? AND (company_id = ? OR company_id IS NULL) ORDER BY company_id DESC LIMIT 1");
            $stmt->execute([$workspaceId, $companyId]);
            $connection = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($connection) {
                unset($connection['access_token'], $connection['refresh_token']);
            }
            
            return Response::json(['data' => $connection ?: null]);
        } catch (Exception $e) {
            return Response::error('Failed to get connection: ' . $e->getMessage());
        }
    }

    public function getOAuthUrl() {
        try {
            $clientId = getenv('GOOGLE_CLIENT_ID') ?: '';
            $redirectUri = getenv('GOOGLE_REDIRECT_URI') ?: (getenv('APP_URL') . '/api/gmb/oauth-callback');
            
            $scopes = [
                'https://www.googleapis.com/auth/business.manage',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
            ];
            
            $state = base64_encode(json_encode([
                'workspace_id' => self::getWorkspaceId(),
                'company_id' => self::getCompanyId(),
                'timestamp' => time(),
            ]));

            // SIMULATION MODE: If in dev/local and no valid client ID, bypass Google
            $isDev = getenv('APP_ENV') === 'local' || getenv('APP_ENV') === 'development';
            $isInvalidClient = empty($clientId) || strpos($clientId, 'your_google_client_id') !== false;

            if ($isDev && $isInvalidClient) {
                $mockCode = 'simulated_auth_code_' . bin2hex(random_bytes(8));
                $callbackUrl = $redirectUri . '?' . http_build_query([
                    'code' => $mockCode,
                    'state' => $state
                ]);
                return Response::json(['data' => ['url' => $callbackUrl]]);
            }
            
            $url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
                'client_id' => $clientId,
                'redirect_uri' => $redirectUri,
                'response_type' => 'code',
                'scope' => implode(' ', $scopes),
                'access_type' => 'offline',
                'prompt' => 'consent',
                'state' => $state,
            ]);
            
            return Response::json(['data' => ['url' => $url]]);
        } catch (Exception $e) {
            return Response::error('Failed to generate OAuth URL: ' . $e->getMessage());
        }
    }

    public function handleOAuthCallback() {
        try {
            $code = $_POST['code'] ?? $_GET['code'] ?? '';
            $state = $_POST['state'] ?? $_GET['state'] ?? '';
            
            if (empty($code)) {
                $this->returnAuthError("Authorization code missing");
            }
            
            $stateData = json_decode(base64_decode($state), true);
            $workspaceId = $stateData['workspace_id'] ?? self::getWorkspaceId();
            $companyId = $stateData['company_id'] ?? self::getCompanyId();
            
            $clientId = getenv('GOOGLE_CLIENT_ID');
            $clientSecret = getenv('GOOGLE_CLIENT_SECRET');
            $redirectUri = getenv('GOOGLE_REDIRECT_URI') ?: (getenv('APP_URL') . '/api/gmb/oauth-callback');

            // Exchange code for token
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://oauth2.googleapis.com/token');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
                'code' => $code,
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'redirect_uri' => $redirectUri,
                'grant_type' => 'authorization_code'
            ]));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $response = curl_exec($ch);
            $tokenData = json_decode($response, true);
            curl_close($ch);

            if (isset($tokenData['error']) || strpos($code, 'simulated_') === 0) {
                // Fallback for simulation if configured
                $isDev = getenv('APP_ENV') === 'local' || getenv('APP_ENV') === 'development';
                $isInvalidClient = empty($clientId) || strpos($clientId, 'your_google_client_id') !== false;

                if ($isDev && ($isInvalidClient || strpos($code, 'simulated_') === 0)) {
                    $tokenData = [
                        'access_token' => 'simulated_access_token_' . bin2hex(random_bytes(16)),
                        'refresh_token' => 'simulated_refresh_token_' . bin2hex(random_bytes(16)),
                        'expires_in' => 3600,
                    ];
                } else {
                    $this->returnAuthError("Token exchange failed: " . ($tokenData['error_description'] ?? $tokenData['error'] ?? 'Unknown error'));
                }
            }

            // Get User Info
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://www.googleapis.com/oauth2/v2/userinfo');
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $tokenData['access_token']]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            $userResponse = curl_exec($ch);
            $userInfo = json_decode($userResponse, true);
            curl_close($ch);

            // If simulation
            if (strpos($tokenData['access_token'], 'simulated_') === 0) {
                 $userInfo = [
                    'id' => 'google_' . bin2hex(random_bytes(8)),
                    'email' => 'user@example.com',
                    'name' => 'Business Owner',
                    'picture' => null,
                ];
            }

            $db = Database::conn();
            
            $checkStmt = $db->prepare("SELECT id FROM gmb_connections WHERE workspace_id = ? AND company_id = ?");
            $checkStmt->execute([$workspaceId, $companyId]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            $expiresAt = date('Y-m-d H:i:s', time() + ($tokenData['expires_in'] ?? 3600));

            if ($existing) {
                $stmt = $db->prepare("UPDATE gmb_connections SET access_token = ?, refresh_token = ?, token_expires_at = ?, google_account_id = ?, google_email = ?, google_name = ?, status = 'connected', connected_at = NOW(), updated_at = NOW() WHERE id = ?");
                $stmt->execute([
                    $tokenData['access_token'],
                    $tokenData['refresh_token'] ?? $existing['refresh_token'] ?? null,
                    $expiresAt,
                    $userInfo['id'],
                    $userInfo['email'],
                    $userInfo['name'],
                    $existing['id']
                ]);
            } else {
                $stmt = $db->prepare("INSERT INTO gmb_connections (workspace_id, company_id, access_token, refresh_token, token_expires_at, google_account_id, google_email, google_name, status, connected_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'connected', NOW(), NOW(), NOW())");
                $stmt->execute([
                    $workspaceId,
                    $companyId,
                    $tokenData['access_token'],
                    $tokenData['refresh_token'] ?? null,
                    $expiresAt,
                    $userInfo['id'],
                    $userInfo['email'],
                    $userInfo['name']
                ]);
            }
            
            $this->returnAuthSuccess();

        } catch (Exception $e) {
            $this->returnAuthError($e->getMessage());
        }
    }

    private function returnAuthSuccess() {
        header('Content-Type: text/html');
        echo '<!DOCTYPE html><html><body><script>
            if (window.opener) {
                window.opener.postMessage({ type: "gmb-oauth-success" }, "*");
            }
            window.close();
        </script><p>Authorization Successful. You can close this window.</p></body></html>';
        exit;
    }

    private function returnAuthError($msg) {
        header('Content-Type: text/html');
        echo '<!DOCTYPE html><html><body><script>
            if (window.opener) {
                window.opener.postMessage({ type: "gmb-oauth-error", error: "' . addslashes($msg) . '" }, "*");
            }
            window.close();
        </script><p>Authorization failed: ' . htmlspecialchars($msg) . '</p></body></html>';
        exit;
    }

    public function disconnect() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            
            $stmt = $db->prepare("UPDATE gmb_connections SET status = 'disconnected', access_token = NULL, refresh_token = NULL, updated_at = NOW() WHERE workspace_id = ? AND company_id = ?");
            $stmt->execute([$workspaceId, $companyId]);
            
            return Response::json(['data' => ['success' => true]]);
        } catch (Exception $e) {
            return Response::error('Failed to disconnect: ' . $e->getMessage());
        }
    }

    // ==================== LOCATIONS ====================

    public function getLocations() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT * FROM gmb_locations WHERE workspace_id = ? AND (company_id = ? OR company_id IS NULL) ORDER BY business_name");
            $stmt->execute([$workspaceId, $companyId]);
            $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json(['data' => $locations ?: []]);
        } catch (Exception $e) {
            return Response::error('Failed to get locations: ' . $e->getMessage());
        }
    }

    public function syncLocations() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            
            $connStmt = $db->prepare("SELECT * FROM gmb_connections WHERE workspace_id = ? AND (company_id = ? OR company_id IS NULL) AND status = 'connected'");
            $connStmt->execute([$workspaceId, $companyId]);
            $connection = $connStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$connection) {
                return Response::error('No active GMB connection found', 400);
            }

            // 1. Get Accounts (Account Management API)
            $accountsRes = $this->makeGoogleApiRequest('GET', 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts', $connection);
            $accounts = $accountsRes['accounts'] ?? [];
            if (empty($accounts)) {
                // If no accounts, maybe creating a mock one if simulated
                if (strpos($connection['access_token'], 'simulated_') === 0) {
                     // Keep existing mock logic
                     $this->simulateConnect();
                     return Response::json(['data' => ['success' => true, 'count' => 1, 'message' => 'Simulated sync']]);
                }
                return Response::json(['data' => ['success' => true, 'count' => 0]]);
            }

            $totalSynced = 0;

            foreach ($accounts as $account) {
                // 2. Get Locations for Account (Business Information API)
                $accountName = $account['name'];
                $locationsRes = $this->makeGoogleApiRequest(
                    'GET', 
                    "https://mybusinessbusinessinformation.googleapis.com/v1/{$accountName}/locations?readMask=name,title,storeCode,latlng,phoneNumbers,categories,profile,metadata,serviceArea", 
                    $connection
                );
                
                $locations = $locationsRes['locations'] ?? [];

                foreach ($locations as $loc) {
                    $googleId = $loc['name']; // accounts/x/locations/y
                    $title = $loc['title'] ?? 'Untitled';
                    
                    // Upsert Location
                    $upsertStmt = $db->prepare("
                        INSERT INTO gmb_locations 
                        (workspace_id, company_id, connection_id, google_location_id, business_name, 
                         address_line_1, city, state, postal_code, country, 
                         primary_phone, primary_category_name, verification_status, sync_status, last_sync_at, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', NOW(), NOW(), NOW())
                        ON DUPLICATE KEY UPDATE 
                        business_name = VALUES(business_name),
                        address_line_1 = VALUES(address_line_1),
                        primary_phone = VALUES(primary_phone),
                        sync_status = 'synced',
                        last_sync_at = NOW(),
                        updated_at = NOW()
                    "); // Simplified fields for brevity, normally map all fields
                    
                    $address = $loc['storefrontAddress'] ?? [];
                    
                    $upsertStmt->execute([
                        $workspaceId,
                        $companyId,
                        $connection['id'],
                        $googleId,
                        $title,
                        $address['addressLines'][0] ?? null,
                        $address['locality'] ?? null,
                        $address['administrativeArea'] ?? null,
                        $address['postalCode'] ?? null, 
                        $address['regionCode'] ?? 'US',
                        $loc['phoneNumbers']['primaryPhone'] ?? null,
                        $loc['categories']['primaryCategory']['displayName'] ?? null,
                        'verified', // Approx map
                    ]);
                    $totalSynced++;
                    
                    // Sync Reviews for this location automatically
                    $this->syncReviewsForLocation($googleId, $connection);
                }
            }
            
            // Update connection last sync
            $updateStmt = $db->prepare("UPDATE gmb_connections SET last_sync_at = NOW(), updated_at = NOW() WHERE id = ?");
            $updateStmt->execute([$connection['id']]);
            
            return Response::json(['data' => ['success' => true, 'count' => $totalSynced]]);
        } catch (Exception $e) {
            return Response::error('Failed to sync locations: ' . $e->getMessage());
        }
    }

    public function updateLocation($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $db = Database::conn();
            
            $stmt = $db->prepare("SELECT l.*, c.access_token, c.refresh_token, c.token_expires_at, c.id as connection_id FROM gmb_locations l JOIN gmb_connections c ON l.connection_id = c.id WHERE l.id = ? AND l.workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $location = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$location) return Response::error('Location not found', 404);
            
            
            // Construct Google Update Mask & Data
            $googleData = [];
            $readMask = [];
            
            if (isset($data['business_name'])) {
                $googleData['title'] = $data['business_name'];
                $readMask[] = 'title';
            }
            if (isset($data['primary_phone'])) {
                $googleData['phoneNumbers'] = ['primaryPhone' => $data['primary_phone']];
                $readMask[] = 'phoneNumbers';
            }
            // Add more mappings as needed...

            if (!empty($googleData)) {
                 $connection = [
                    'id' => $location['connection_id'],
                    'access_token' => $location['access_token'],
                    'refresh_token' => $location['refresh_token'],
                    'token_expires_at' => $location['token_expires_at']
                 ];
                 
                 // PATCH https://mybusinessbusinessinformation.googleapis.com/v1/{name}?updateMask=...
                 $mask = implode(',', $readMask);
                 $this->makeGoogleApiRequest(
                     'PATCH', 
                     "https://mybusinessbusinessinformation.googleapis.com/v1/{$location['google_location_id']}?updateMask={$mask}",
                     $connection,
                     $googleData
                 );
            }
            
            // Update DB
            $allowedFields = ['business_name', 'address_line_1', 'address_line_2', 'city', 'state', 'postal_code', 'country', 'primary_phone', 'website_url', 'description'];
            $updates = [];
            $params = [];
            
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (!empty($updates)) {
                $updates[] = "updated_at = NOW()";
                $params[] = $id;
                $params[] = $workspaceId;
                
                $stmt = $db->prepare("UPDATE gmb_locations SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ?");
                $stmt->execute($params);
            }
            
            return Response::json(['data' => ['success' => true]]);
        } catch (Exception $e) {
            return Response::error('Failed to update location: ' . $e->getMessage());
        }
    }

    // ==================== REVIEWS ====================

    private function syncReviewsForLocation($googleLocationId, $connection) {
        $db = Database::conn();
        try {
            // V4 standard: https://mybusiness.googleapis.com/v4/{name}/reviews
            $reviewsRes = $this->makeGoogleApiRequest('GET', "https://mybusiness.googleapis.com/v4/{$googleLocationId}/reviews", $connection);
            $reviews = $reviewsRes['reviews'] ?? [];
            if (empty($reviews)) return 0;

            // Get local location ID
            $locStmt = $db->prepare("SELECT id, workspace_id FROM gmb_locations WHERE google_location_id = ?");
            $locStmt->execute([$googleLocationId]);
            $localLoc = $locStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$localLoc) return 0;
            
            $count = 0;

            foreach ($reviews as $review) {
                $upsert = $db->prepare("
                    INSERT INTO gmb_reviews
                    (workspace_id, location_id, google_review_id, reviewer_display_name, reviewer_profile_photo_url, star_rating, comment, reply_text, review_date, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE
                    comment = VALUES(comment),
                    reply_text = VALUES(reply_text),
                    star_rating = VALUES(star_rating),
                    updated_at = NOW()
                ");
                
                $starRating = match($review['starRating'] ?? '') {
                    'ONE' => 1, 'TWO' => 2, 'THREE' => 3, 'FOUR' => 4, 'FIVE' => 5, default => 0
                };
                
                $upsert->execute([
                    $localLoc['workspace_id'],
                    $localLoc['id'],
                    $review['reviewId'],
                    $review['reviewer']['displayName'] ?? 'Anonymous',
                    $review['reviewer']['profilePhotoUrl'] ?? null,
                    $starRating,
                    $review['comment'] ?? null,
                    $review['reviewReply']['comment'] ?? null,
                    $review['createTime'] ?? date('Y-m-d H:i:s')
                ]);
                $count++;
            }
            return $count;
        } catch (Exception $e) {
            return 0;
        }
    }

    public function syncReviews() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $locationId = $data['location_id'] ?? null;
            $db = Database::conn();

            // Get connection
            $connStmt = $db->prepare("SELECT * FROM gmb_connections WHERE workspace_id = ? AND status = 'connected'");
            $connStmt->execute([$workspaceId]);
            $connection = $connStmt->fetch(PDO::FETCH_ASSOC);

            if (!$connection) return Response::error('No active connection', 400);

            $locations = [];
            if ($locationId) {
                $stmt = $db->prepare("SELECT google_location_id FROM gmb_locations WHERE id = ?");
                $stmt->execute([$locationId]);
                $loc = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($loc) $locations[] = $loc;
            } else {
                 $stmt = $db->prepare("SELECT google_location_id FROM gmb_locations WHERE workspace_id = ? AND connection_id = ?");
                 $stmt->execute([$workspaceId, $connection['id']]);
                 $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            $total = 0;
            foreach ($locations as $loc) {
                $total += $this->syncReviewsForLocation($loc['google_location_id'], $connection);
            }

            return Response::json(['data' => ['success' => true, 'count' => $total]]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    public function getReviews() {
        try {
            $workspaceId = self::getWorkspaceId();
            $locationId = $_GET['location_id'] ?? null;
            $db = Database::conn();
            
            $sql = "SELECT * FROM gmb_reviews WHERE workspace_id = ?";
            $params = [$workspaceId];
            
            if ($locationId) {
                $sql .= " AND location_id = ?";
                $params[] = $locationId;
            }
            
            $sql .= " ORDER BY review_date DESC";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }
    
    public function replyToReview($id) {
         try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            if (empty($data['reply_text'])) return Response::error('Reply text required', 400);

            $db = Database::conn();
            $stmt = $db->prepare("SELECT r.*, l.google_location_id, c.access_token, c.refresh_token, c.token_expires_at, c.id as connection_id FROM gmb_reviews r JOIN gmb_locations l ON r.location_id = l.id JOIN gmb_connections c ON l.connection_id = c.id WHERE r.id = ? AND r.workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $review = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$review) return Response::error('Review not found', 404);

            $connection = [
                'id' => $review['connection_id'],
                'access_token' => $review['access_token'],
                'refresh_token' => $review['refresh_token'],
                'token_expires_at' => $review['token_expires_at']
            ];

            // PUT https://mybusiness.googleapis.com/v4/{name}/reply
            // name is like accounts/x/locations/y/reviews/z
            $reviewName = $review['google_location_id'] . '/reviews/' . $review['google_review_id'];
            
            $this->makeGoogleApiRequest('PUT', "https://mybusiness.googleapis.com/v4/{$reviewName}/reply", $connection, [
                'comment' => $data['reply_text']
            ]);

            $updateStmt = $db->prepare("UPDATE gmb_reviews SET reply_text = ?, replied_at = NOW(), status = 'responded', updated_at = NOW() WHERE id = ?");
            $updateStmt->execute([$data['reply_text'], $id]);

            return Response::json(['data' => ['success' => true]]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    // ==================== POSTS ====================

    public function createPost() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            
            if (empty($data['location_id']) || empty($data['summary'])) {
                return Response::error('Location ID and summary are required', 400);
            }
            
            $db = Database::conn();
            
            // Get Location & Connection
            $locStmt = $db->prepare("SELECT l.*, c.access_token, c.refresh_token, c.token_expires_at, c.id as connection_id FROM gmb_locations l JOIN gmb_connections c ON l.connection_id = c.id WHERE l.id = ? AND l.workspace_id = ?");
            $locStmt->execute([$data['location_id'], $workspaceId]);
            $location = $locStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$location) return Response::error('Location not found', 404);

            $connection = [
                'id' => $location['connection_id'],
                'access_token' => $location['access_token'],
                'refresh_token' => $location['refresh_token'],
                'token_expires_at' => $location['token_expires_at']
            ];

            // Prepare Google Payload
            $postBody = [
                'languageCode' => 'en-US',
                'summary' => $data['summary'],
                'topicType' => 'STANDARD'
            ];
            
            if (!empty($data['action_type']) && !empty($data['action_url'])) {
                $postBody['callToAction'] = [
                    'actionType' => strtoupper($data['action_type']),
                    'url' => $data['action_url']
                ];
            }
            
            if (!empty($data['media_url'])) {
                 $postBody['media'] = [
                     [
                         'mediaFormat' => 'PHOTO',
                         'sourceUrl' => $data['media_url']
                     ]
                 ];
            }

            // POST https://mybusiness.googleapis.com/v4/{parent}/localPosts
            $response = $this->makeGoogleApiRequest(
                'POST', 
                "https://mybusiness.googleapis.com/v4/{$location['google_location_id']}/localPosts", 
                $connection, 
                $postBody
            );

            // Save to DB
            $stmt = $db->prepare("INSERT INTO gmb_posts (workspace_id, location_id, google_post_id, post_type, summary, media_url, action_type, action_url, status, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', NOW(), NOW(), NOW())");
            $stmt->execute([
                $workspaceId,
                $data['location_id'],
                $response['name'] ?? null, // accounts/x/locations/y/localPosts/z
                $data['post_type'] ?? 'standard',
                $data['summary'],
                $data['media_url'] ?? null,
                $data['action_type'] ?? null,
                $data['action_url'] ?? null
            ]);
            
            return Response::json(['data' => ['success' => true, 'id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create post: ' . $e->getMessage());
        }
    }
    
    public function getPosts() {
        try {
            $workspaceId = self::getWorkspaceId();
            $locationId = $_GET['location_id'] ?? null;
            $db = Database::conn();
            $sql = "SELECT * FROM gmb_posts WHERE workspace_id = ?";
            $params = [$workspaceId];
            if ($locationId) {
                $sql .= " AND location_id = ?";
                $params[] = $locationId;
            }
            $sql .= " ORDER BY created_at DESC";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    public function syncPosts() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $locationId = $data['location_id'] ?? null;
            $db = Database::conn();

            $connStmt = $db->prepare("SELECT * FROM gmb_connections WHERE workspace_id = ? AND status = 'connected'");
            $connStmt->execute([$workspaceId]);
            $connection = $connStmt->fetch(PDO::FETCH_ASSOC);

            if (!$connection) return Response::error('No active connection', 400);

            $locations = [];
            if ($locationId) {
                $stmt = $db->prepare("SELECT id, google_location_id FROM gmb_locations WHERE id = ?");
                $stmt->execute([$locationId]);
                $loc = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($loc) $locations[] = $loc;
            } else {
                 $stmt = $db->prepare("SELECT id, google_location_id FROM gmb_locations WHERE workspace_id = ? AND connection_id = ?");
                 $stmt->execute([$workspaceId, $connection['id']]);
                 $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            $total = 0;
            foreach ($locations as $loc) {
                 // V4: https://mybusiness.googleapis.com/v4/{name}/localPosts
                 try {
                     $res = $this->makeGoogleApiRequest('GET', "https://mybusiness.googleapis.com/v4/{$loc['google_location_id']}/localPosts", $connection);
                     $posts = $res['localPosts'] ?? [];
                     
                     foreach ($posts as $post) {
                         $stmt = $db->prepare("
                             INSERT INTO gmb_posts
                             (workspace_id, location_id, google_post_id, post_type, summary, media_url, action_type, action_url, status, updated_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                             ON DUPLICATE KEY UPDATE 
                             summary = VALUES(summary),
                             media_url = VALUES(media_url),
                             status = VALUES(status),
                             updated_at = NOW()
                         ");
                         
                         $mediaUrl = $post['media'][0]['sourceUrl'] ?? null;
                         $actionType = $post['callToAction']['actionType'] ?? null;
                         $actionUrl = $post['callToAction']['url'] ?? null;
                         
                         $stmt->execute([
                             $workspaceId,
                             $loc['id'],
                             $post['name'],
                             'standard', // Simplify mapping
                             $post['summary'] ?? '',
                             $mediaUrl,
                             $actionType,
                             $actionUrl,
                             'published'
                         ]);
                         $total++;
                     }
                 } catch (Exception $e) {}
            }
            return Response::json(['data' => ['success' => true, 'count' => $total]]);
        } catch (Exception $e) { return Response::error($e->getMessage()); }
    }

    // ==================== Q&A ====================
    
    public function getQuestions() {
        try {
            $workspaceId = self::getWorkspaceId();
            $locationId = $_GET['location_id'] ?? null;
            $db = Database::conn();
            $sql = "SELECT q.*, l.business_name as location_name FROM gmb_questions q JOIN gmb_locations l ON q.location_id = l.id WHERE l.workspace_id = ?";
            $params = [$workspaceId];
            if ($locationId) {
                 $sql .= " AND q.location_id = ?";
                 $params[] = $locationId;
            }
            $sql .= " ORDER BY q.question_date DESC";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }

    public function syncQuestions() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $locationId = $data['location_id'] ?? null;
            $db = Database::conn();

            $connStmt = $db->prepare("SELECT * FROM gmb_connections WHERE workspace_id = ? AND status = 'connected'");
            $connStmt->execute([$workspaceId]);
            $connection = $connStmt->fetch(PDO::FETCH_ASSOC);

            if (!$connection) return Response::error('No active connection', 400);

            $locations = [];
            if ($locationId) {
                $stmt = $db->prepare("SELECT id, google_location_id FROM gmb_locations WHERE id = ?");
                $stmt->execute([$locationId]);
                $loc = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($loc) $locations[] = $loc;
            } else {
                 $stmt = $db->prepare("SELECT id, google_location_id FROM gmb_locations WHERE workspace_id = ? AND connection_id = ?");
                 $stmt->execute([$workspaceId, $connection['id']]);
                 $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            $total = 0;
            foreach ($locations as $loc) {
                 try {
                     $res = $this->makeGoogleApiRequest('GET', "https://mybusiness.googleapis.com/v4/{$loc['google_location_id']}/questions", $connection);
                     $questions = $res['questions'] ?? [];
                     
                     foreach ($questions as $q) {
                         $stmt = $db->prepare("
                             INSERT INTO gmb_questions
                             (workspace_id, location_id, google_question_id, author_display_name, author_profile_photo_url, question_text, status, question_date, updated_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                             ON DUPLICATE KEY UPDATE 
                             question_text = VALUES(question_text),
                             status = VALUES(status),
                             updated_at = NOW()
                         ");
                         
                         $stmt->execute([
                             $workspaceId,
                             $loc['id'],
                             $q['name'],
                             $q['author']['displayName'] ?? 'Anonymous',
                             $q['author']['profilePhotoUrl'] ?? null,
                             $q['text'] ?? '',
                             ($q['upvoteCount'] ?? 0) > 0 ? 'active' : 'new',
                             $q['createTime'] ?? date('Y-m-d H:i:s')
                         ]);
                         $total++;
                     }
                 } catch (Exception $e) {}
            }
            return Response::json(['data' => ['success' => true, 'count' => $total]]);
        } catch (Exception $e) { return Response::error($e->getMessage()); }
    }

    // ==================== PHOTOS ====================

    public function getPhotos() {
        try {
            $workspaceId = self::getWorkspaceId();
            $locationId = $_GET['location_id'] ?? null;
            $db = Database::conn();
            $sql = "SELECT * FROM gmb_photos WHERE workspace_id = ?";
            $params = [$workspaceId];
            if ($locationId) {
                $sql .= " AND location_id = ?";
                $params[] = $locationId;
            }
            $sql .= " ORDER BY created_at DESC";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) { return Response::error($e->getMessage()); }
    }

    public function syncPhotos() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $locationId = $data['location_id'] ?? null;
            $db = Database::conn();

            $connStmt = $db->prepare("SELECT * FROM gmb_connections WHERE workspace_id = ? AND status = 'connected'");
            $connStmt->execute([$workspaceId]);
            $connection = $connStmt->fetch(PDO::FETCH_ASSOC);

            if (!$connection) return Response::error('No active connection', 400);

            $locations = [];
            if ($locationId) {
                $stmt = $db->prepare("SELECT id, google_location_id FROM gmb_locations WHERE id = ?");
                $stmt->execute([$locationId]);
                $loc = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($loc) $locations[] = $loc;
            } else {
                 $stmt = $db->prepare("SELECT id, google_location_id FROM gmb_locations WHERE workspace_id = ? AND connection_id = ?");
                 $stmt->execute([$workspaceId, $connection['id']]);
                 $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }

            $total = 0;
            foreach ($locations as $loc) {
                 try {
                     $res = $this->makeGoogleApiRequest('GET', "https://mybusiness.googleapis.com/v4/{$loc['google_location_id']}/media", $connection);
                     $media = $res['mediaItems'] ?? [];
                     
                     foreach ($media as $item) {
                         $stmt = $db->prepare("
                             INSERT INTO gmb_photos
                             (workspace_id, location_id, google_photo_id, source_url, thumbnail_url, category, status, created_at)
                             VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())
                             ON DUPLICATE KEY UPDATE 
                             source_url = VALUES(source_url),
                             thumbnail_url = VALUES(thumbnail_url),
                             updated_at = NOW()
                         ");
                         
                         $stmt->execute([
                             $workspaceId,
                             $loc['id'],
                             $item['name'],
                             $item['googleSourceUrl'] ?? $item['googleSourceUrl'] ?? null,
                             $item['thumbnailUrl'] ?? null,
                             $item['locationAssociation']['category'] ?? 'ADDITIONAL'
                         ]);
                         $total++;
                     }
                 } catch (Exception $e) {}
            }
            return Response::json(['data' => ['success' => true, 'count' => $total]]);
        } catch (Exception $e) { return Response::error($e->getMessage()); }
    }

    // ==================== INSIGHTS ====================

    public function getInsights() {
        try {
            $workspaceId = self::getWorkspaceId();
            $locationId = $_GET['location_id'] ?? null;
            $db = Database::conn();
            $sql = "SELECT * FROM gmb_insights WHERE workspace_id = ?";
            $params = [$workspaceId];
            if ($locationId) {
                $sql .= " AND location_id = ?";
                $params[] = $locationId;
            }
            $sql .= " ORDER BY date DESC LIMIT 30";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) { return Response::error($e->getMessage()); }
    }

    public function syncInsights() {
        return Response::json(['data' => ['success' => true]]);
    }

    // ==================== SETTINGS ====================

    public function getSettings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $stmt = $db->prepare("SELECT * FROM gmb_settings WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$settings) {
                 $settings = [
                    'workspace_id' => $workspaceId,
                    'auto_sync_enabled' => true,
                    'sync_interval_minutes' => 60,
                ];
            }
            return Response::json(['data' => $settings]);
        } catch (Exception $e) {
            return Response::error('Failed to get settings: ' . $e->getMessage());
        }
    }
    
    public function updateSettings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $db = Database::conn();
            
            $check = $db->prepare("SELECT id FROM gmb_settings WHERE workspace_id = ?");
            $check->execute([$workspaceId]);
            $existing = $check->fetch();
            
            if ($existing) {
                $updates = [];
                $params = [];
                foreach ($data as $key => $value) {
                    $updates[] = "$key = ?";
                    $params[] = $value;
                }
                $params[] = $workspaceId;
                $stmt = $db->prepare("UPDATE gmb_settings SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE workspace_id = ?");
                $stmt->execute($params);
            } else {
                $keys = array_keys($data);
                $placeholders = array_fill(0, count($keys), '?');
                $stmt = $db->prepare("INSERT INTO gmb_settings (workspace_id, " . implode(', ', $keys) . ", created_at, updated_at) VALUES (?, " . implode(', ', $placeholders) . ", NOW(), NOW())");
                $params = array_values($data);
                array_unshift($params, $workspaceId);
                $stmt->execute($params);
            }
            
            return Response::json(['data' => ['success' => true]]);
        } catch (Exception $e) {
            return Response::error($e->getMessage());
        }
    }
    
    public function simulateConnect() {
         return $this->handleSimulatedConnect();
    }
    
    private function handleSimulatedConnect() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $mockEmail = 'demo@example.com';
            $ids = $db->prepare("SELECT id FROM gmb_connections WHERE workspace_id = ?"); 
            $ids->execute([$workspaceId]); 
            if (!$ids->fetch()) {
                 $stmt = $db->prepare("INSERT INTO gmb_connections (workspace_id, company_id, access_token, refresh_token, token_expires_at, google_email, status, connected_at, last_sync_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'connected', NOW(), NOW(), NOW(), NOW())"); 
                 $stmt->execute([$workspaceId, $companyId, 'simulated_access_token', 'simulated_refresh', date('Y-m-d H:i:s', time()+99999), $mockEmail]);
            }
            return Response::json(['data' => ['success' => true]]);
        } catch (Exception $e) { return Response::error($e->getMessage()); }
    }
}

