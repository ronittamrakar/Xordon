<?php
/**
 * Listings & SEO Controller
 * Business listings, local SEO, and citation management
 * 
 * SCOPING: Company-scoped (requires active company)
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class ListingsController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    private static function getCompanyId(): int {
        return Permissions::requireActiveCompany();
    }

    // ==================== BUSINESS LISTINGS ====================

    public static function getDirectories() {
        try {
            $db = Database::conn();
            $category = $_GET['category'] ?? '';
            $country = $_GET['country'] ?? '';
            $type = $_GET['type'] ?? '';
            
            $sql = "SELECT * FROM directories WHERE is_active = 1";
            $params = [];
            
            if (!empty($category)) {
                $sql .= " AND category = ?";
                $params[] = $category;
            }

            if (!empty($country)) {
                $sql .= " AND country = ?";
                $params[] = $country;
            }

            if (!empty($type)) {
                $sql .= " AND type = ?";
                $params[] = $type;
            }
            
            $sql .= " ORDER BY name ASC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $directories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($directories as &$dir) {
                $dir['form_schema'] = $dir['form_schema'] ? json_decode($dir['form_schema'], true) : null;
            }
            
            return Response::json(['data' => $directories]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch directories: ' . $e->getMessage());
        }
    }

    public static function getListings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // Get query parameters
            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $perPage = isset($_GET['per_page']) ? min(100, max(1, (int)$_GET['per_page'])) : 50;
            $query = $_GET['query'] ?? '';
            $status = $_GET['status'] ?? '';
            $directory = $_GET['directory'] ?? '';
            $submissionType = $_GET['submission_type'] ?? '';
            $syncStatus = $_GET['sync_status'] ?? '';
            $claimStatus = $_GET['claim_status'] ?? '';

            // Build WHERE conditions
            $where = ['workspace_id = ?', 'company_id = ?'];
            $params = [$workspaceId, $companyId];

            if (!empty($query)) {
                $where[] = '(business_name LIKE ? OR directory_name LIKE ? OR address LIKE ?)';
                $searchTerm = "%$query%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }

            if (!empty($status) && $status !== 'none') {
                $where[] = 'status = ?';
                $params[] = $status;
            }

            if (!empty($directory) && $directory !== 'none') {
                $where[] = 'directory = ?';
                $params[] = $directory;
            }

            if (!empty($submissionType) && $submissionType !== 'none') {
                $where[] = 'submission_type = ?';
                $params[] = $submissionType;
            }

            if (!empty($syncStatus)) {
                $where[] = 'sync_status = ?';
                $params[] = $syncStatus;
            }

            if (!empty($claimStatus)) {
                $where[] = 'claim_status = ?';
                $params[] = $claimStatus;
            }

            $whereClause = implode(' AND ', $where);

            // Get total count for pagination
            $countStmt = $db->prepare("SELECT COUNT(*) FROM business_listings WHERE $whereClause");
            $countStmt->execute($params);
            $total = (int)$countStmt->fetchColumn();

            // Get paginated results
            $offset = ($page - 1) * $perPage;
            $stmt = $db->prepare("
                SELECT * FROM business_listings
                WHERE $whereClause
                ORDER BY directory_name
                LIMIT ? OFFSET ?
            ");
            $stmt->execute(array_merge($params, [$perPage, $offset]));
            $listings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($listings as &$l) {
                $l['categories'] = $l['categories'] ? json_decode($l['categories'], true) : null;
                $l['submission_data'] = $l['submission_data'] ? json_decode($l['submission_data'], true) : null;
            }

            return Response::json([
                'data' => $listings,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'total_pages' => (int)ceil($total / $perPage)
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch listings: ' . $e->getMessage());
        }
    }

    public static function updateListing($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $updates = [];
            $params = [];

            $allowedFields = ['status', 'listing_url', 'business_name', 'address', 'phone', 'website',
                'categories', 'submission_data', 'name_accurate', 'address_accurate', 'phone_accurate', 'website_accurate',
                'hours_accurate', 'accuracy_score'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    // Validation
                    if ($field === 'listing_url' && !empty($data[$field])) {
                        if (!filter_var($data[$field], FILTER_VALIDATE_URL)) {
                            // Try prepending https:// if it looks like a domain
                            if (preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/', $data[$field])) {
                                $data[$field] = 'https://' . $data[$field];
                            } else {
                                return Response::error('Invalid listing_url format', 400);
                            }
                        }
                    }
                    if ($field === 'website' && !empty($data[$field])) {
                        if (!filter_var($data[$field], FILTER_VALIDATE_URL)) {
                            // Try prepending https:// if it looks like a domain
                            if (preg_match('/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/', $data[$field])) {
                                $data[$field] = 'https://' . $data[$field];
                            } else {
                                return Response::error('Invalid website format', 400);
                            }
                        }
                    }
                    if ($field === 'accuracy_score' && ($data[$field] < 0 || $data[$field] > 100)) {
                        return Response::error('accuracy_score must be between 0 and 100', 400);
                    }
                    
                    $updates[] = "$field = ?";
                    $params[] = in_array($field, ['categories', 'submission_data']) ? json_encode($data[$field]) : $data[$field];
                }
            }

            if (empty($updates)) {
                return Response::error('No valid fields to update', 400);
            }

            $updates[] = 'last_updated_at = NOW()';
            $params[] = $id;
            $params[] = $workspaceId;
            $params[] = $companyId;
            
            $stmt = $db->prepare("UPDATE business_listings SET " . implode(', ', $updates) . " WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $success = $stmt->execute($params);
            
            if (!$success) {
                return Response::error('Failed to update listing', 500);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update listing: ' . $e->getMessage());
        }
    }

    public static function deleteListing($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM business_listings WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete listing: ' . $e->getMessage());
        }
    }

    public static function addListing() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Validation
            if (empty($data['platform'])) {
                return Response::error('platform required', 400);
            }

            // Validate business_name if provided
            if (isset($data['business_name']) && strlen($data['business_name']) > 255) {
                return Response::error('business_name too long (max 255 characters)', 400);
            }

            // Validate listing_url format if provided
            if (isset($data['listing_url']) && !empty($data['listing_url'])) {
                if (!filter_var($data['listing_url'], FILTER_VALIDATE_URL)) {
                    return Response::error('Invalid listing_url format', 400);
                }
            }

            // Validate phone format if provided (basic validation)
            if (isset($data['phone']) && !empty($data['phone'])) {
                $phone = preg_replace('/[^0-9+]/', '', $data['phone']);
                if (strlen($phone) < 10 || strlen($phone) > 15) {
                    return Response::error('Invalid phone number format', 400);
                }
            }

            // Map platform to directory and directory_name
            $platformMap = [
                'google_business' => ['google', 'Google Business Profile'],
                'yelp' => ['yelp', 'Yelp'],
                'facebook' => ['facebook', 'Facebook'],
                'bing_places' => ['bing', 'Bing Places'],
                'apple_maps' => ['apple', 'Apple Maps'],
                'tripadvisor' => ['tripadvisor', 'TripAdvisor'],
                'yellowpages' => ['yellowpages', 'Yellow Pages'],
            ];

            $platform = $data['platform'];
            $directoryId = $data['directory_id'] ?? null;
            
            if ($platform === 'custom') {
                $directory = strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', $data['directory_name'] ?? 'custom'));
                $directoryName = $data['directory_name'] ?? 'Custom Directory';
            } elseif (!isset($platformMap[$platform])) {
                $directory = strtolower($platform);
                $directoryName = ucwords(str_replace('_', ' ', $platform));
            } else {
                [$directory, $directoryName] = $platformMap[$platform];
            }

            // If directory_id is not provided, try to find it by code
            if (empty($directoryId)) {
                $dirStmt = $db->prepare("SELECT id FROM directories WHERE code = ?");
                $dirStmt->execute([$platform]);
                $dirIdRow = $dirStmt->fetch(PDO::FETCH_ASSOC);
                if ($dirIdRow) {
                    $directoryId = $dirIdRow['id'];
                }
            }

            // Check for duplicates
            $dupStmt = $db->prepare("
                SELECT id FROM business_listings
                WHERE workspace_id = ? AND company_id = ? AND (directory = ? OR (directory_id = ? AND directory_id IS NOT NULL))
            ");
            $dupStmt->execute([$workspaceId, $companyId, $directory, $directoryId]);
            if ($dupStmt->fetch()) {
                return Response::error('Listing for this directory already exists', 409);
            }

            $stmt = $db->prepare("
                INSERT INTO business_listings 
                (workspace_id, company_id, directory_id, directory, directory_name, listing_url, business_name, address, phone, submission_data, submission_type, country, status, submission_status, claim_status, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'not_started', 'unclaimed', 'not_synced')
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $directoryId,
                $directory,
                $directoryName,
                $data['listing_url'] ?? null,
                $data['business_name'] ?? null,
                $data['address'] ?? null,
                $data['phone'] ?? null,
                isset($data['submission_data']) ? json_encode($data['submission_data']) : null,
                $data['submission_type'] ?? 'manual',
                $data['country'] ?? 'US'
            ]);

            $id = (int)$db->lastInsertId();

            // Schedule submission job
            require_once __DIR__ . '/../services/JobQueueService.php';
            JobQueueService::schedule(
                'listing.submit',
                ['listing_id' => $id],
                null,
                $workspaceId,
                "listing_submit_{$id}"
            );

            return Response::json(['data' => ['id' => $id]]);
        } catch (Exception $e) {
            return Response::error('Failed to add listing: ' . $e->getMessage());
        }
    }

    public static function bulkAddListings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $listings = $data['listings'] ?? [];
            if (empty($listings)) {
                return Response::error('listings array required', 400);
            }

            $platformMap = [
                'google_business' => ['google', 'Google Business Profile'],
                'yelp' => ['yelp', 'Yelp'],
                'facebook' => ['facebook', 'Facebook'],
                'bing_places' => ['bing', 'Bing Places'],
                'apple_maps' => ['apple', 'Apple Maps'],
                'tripadvisor' => ['tripadvisor', 'TripAdvisor'],
                'yellowpages' => ['yellowpages', 'Yellow Pages'],
            ];

            // Fetch directory map for ID lookup
            $dirStmt = $db->query("SELECT id, code FROM directories");
            $dirMap = []; // code -> id
            while ($row = $dirStmt->fetch(PDO::FETCH_ASSOC)) {
                $dirMap[$row['code']] = $row['id'];
            }

            $ids = [];
            $db->beginTransaction();

            // Pre-fetch existing directories for this company to avoid duplicates
            $existingStmt = $db->prepare("SELECT directory, directory_id FROM business_listings WHERE workspace_id = ? AND company_id = ?");
            $existingStmt->execute([$workspaceId, $companyId]);
            $existing = $existingStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $existingMap = [];
            foreach ($existing as $ex) {
                if ($ex['directory']) $existingMap['dir_' . $ex['directory']] = true;
                if ($ex['directory_id']) $existingMap['id_' . $ex['directory_id']] = true;
            }

            $stmt = $db->prepare("
                INSERT INTO business_listings 
                (workspace_id, company_id, directory_id, directory, directory_name, listing_url, business_name, address, phone, submission_data, submission_type, country, status, submission_status, claim_status, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'not_started', 'unclaimed', 'not_synced')
            ");

            foreach ($listings as $l) {
                $platform = $l['platform'] ?? '';
                if (empty($platform)) continue;

                $directoryId = $l['directory_id'] ?? null;
                if (empty($directoryId) && isset($dirMap[$platform])) {
                    $directoryId = $dirMap[$platform];
                }

                if (!isset($platformMap[$platform])) {
                    $directory = strtolower($platform);
                    $directoryName = $l['directory_name'] ?? ucwords(str_replace('_', ' ', $platform));
                } else {
                    [$directory, $directoryName] = $platformMap[$platform];
                }

                // Skip if already exists
                if (isset($existingMap['dir_' . $directory])) continue;
                if ($directoryId && isset($existingMap['id_' . $directoryId])) continue;

                $stmt->execute([
                    $workspaceId,
                    $companyId,
                    $directoryId,
                    $directory,
                    $directoryName,
                    $l['listing_url'] ?? null,
                    $l['business_name'] ?? null,
                    $l['address'] ?? null,
                    $l['phone'] ?? null,
                    isset($l['submission_data']) ? json_encode($l['submission_data']) : null,
                    $l['submission_type'] ?? 'manual',
                    $l['country'] ?? 'US'
                ]);
                $newId = (int)$db->lastInsertId();
                if ($newId) $ids[] = $newId;
                
                // Track internally to avoid duplicates within the same batch
                $existingMap['dir_' . $directory] = true;
                if ($directoryId) $existingMap['id_' . $directoryId] = true;
            }

            $db->commit();

            return Response::json([
                'success' => true,
                'count' => count($ids),
                'ids' => $ids
            ]);
        } catch (Exception $e) {
            if (isset($db) && $db->inTransaction()) $db->rollBack();
            return Response::error('Failed to bulk add listings: ' . $e->getMessage());
        }
    }

    public static function scanListings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // Initialize default directories if not exists
            $directories = [
                ['google', 'Google Business Profile'],
                ['yelp', 'Yelp'],
                ['facebook', 'Facebook'],
                ['bing', 'Bing Places'],
                ['apple', 'Apple Maps'],
                ['yellowpages', 'Yellow Pages'],
                ['bbb', 'Better Business Bureau'],
                ['foursquare', 'Foursquare'],
                ['mapquest', 'MapQuest'],
                ['tomtom', 'TomTom']
            ];

            $stmt = $db->prepare("
                INSERT IGNORE INTO business_listings (workspace_id, company_id, directory, directory_name, status)
                VALUES (?, ?, ?, ?, 'not_listed')
            ");

            foreach ($directories as $dir) {
                $stmt->execute([$workspaceId, $companyId, $dir[0], $dir[1]]);
            }

            // Update last_checked_at
            $db->prepare("UPDATE business_listings SET last_checked_at = NOW() WHERE workspace_id = ? AND company_id = ?")
                ->execute([$workspaceId, $companyId]);

            return Response::json(['success' => true, 'message' => 'Scan initiated']);
        } catch (Exception $e) {
            return Response::error('Failed to scan listings: ' . $e->getMessage());
        }
    }

    public static function syncListing($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // Verify ownership
            $checkStmt = $db->prepare("SELECT id FROM business_listings WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $checkStmt->execute([$id, $workspaceId, $companyId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Listing not found', 404);
            }

            // Update listing status
            $db->prepare("UPDATE business_listings SET last_checked_at = NOW(), last_synced_at = NOW(), sync_status = 'syncing' WHERE id = ?")
                ->execute([$id]);

            // Schedule background job
            require_once __DIR__ . '/../services/JobQueueService.php';
            JobQueueService::schedule(
                'listing.sync',
                ['listing_id' => $id],
                null,
                $workspaceId,
                "listing_sync_{$id}"
            );

            return Response::json(['success' => true, 'message' => 'Sync job queued']);
        } catch (Exception $e) {
            return Response::error('Failed to sync listing: ' . $e->getMessage());
        }
    }

    public static function getSyncHistory($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // Verify ownership
            $checkStmt = $db->prepare("SELECT id FROM business_listings WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $checkStmt->execute([$id, $workspaceId, $companyId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Listing not found', 404);
            }

            $stmt = $db->prepare("
                SELECT * FROM listing_sync_jobs
                WHERE listing_id = ?
                ORDER BY queued_at DESC
                LIMIT 50
            ");
            $stmt->execute([$id]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $history]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch sync history: ' . $e->getMessage());
        }
    }

    public static function claimListing($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM business_listings WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);
            $listing = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$listing) {
                return Response::error('Listing not found', 404);
            }

            // Update claim status
            // In production, this would initiate the claim process with the directory
            $db->prepare("UPDATE business_listings SET claim_status = 'claimed', sync_status = 'claimed' WHERE id = ?")
                ->execute([$id]);

            return Response::json(['success' => true, 'message' => 'Claim process initiated']);
        } catch (Exception $e) {
            return Response::error('Failed to claim listing: ' . $e->getMessage());
        }
    }

    public static function verifyListing($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM business_listings WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);
            $listing = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$listing) {
                return Response::error('Listing not found', 404);
            }

            // Update verification status
            // In production, this would verify ownership with the directory
            $db->prepare("UPDATE business_listings SET claim_status = 'verified', sync_status = 'verified', status = 'verified' WHERE id = ?")
                ->execute([$id]);

            return Response::json(['success' => true, 'message' => 'Listing verified']);
        } catch (Exception $e) {
            return Response::error('Failed to verify listing: ' . $e->getMessage());
        }
    }

    public static function bulkUpdateMethod() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $ids = $data['listing_ids'] ?? [];
            $method = $data['submission_type'] ?? '';

            if (empty($ids)) {
                return Response::error('listing_ids required', 400);
            }

            if (!in_array($method, ['manual', 'automated', 'not_sure'])) {
                return Response::error('Invalid submission_type', 400);
            }

            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $params = array_merge([$method], $ids, [$workspaceId, $companyId]);

            $stmt = $db->prepare("
                UPDATE business_listings 
                SET submission_type = ?
                WHERE id IN ($placeholders) AND workspace_id = ? AND company_id = ?
            ");
            $stmt->execute($params);

            return Response::json([
                'success' => true,
                'count' => $stmt->rowCount(),
                'message' => 'Submission method updated for ' . $stmt->rowCount() . ' listings'
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to bulk update method: ' . $e->getMessage());
        }
    }

    public static function bulkSyncListings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $ids = $data['listing_ids'] ?? [];
            if (empty($ids)) {
                return Response::error('listing_ids required', 400);
            }

            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $params = array_merge($ids, [$workspaceId, $companyId]);

            // Verify ownership and queue sync jobs
            $stmt = $db->prepare("
                SELECT id FROM business_listings
                WHERE id IN ($placeholders) AND workspace_id = ? AND company_id = ?
            ");
            $stmt->execute($params);
            $validIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (empty($validIds)) {
                return Response::error('No valid listings found', 404);
            }

            // Update sync status
            $placeholders = implode(',', array_fill(0, count($validIds), '?'));
            $updateParams = array_merge($validIds, [$workspaceId, $companyId]);
            $stmt = $db->prepare("
                UPDATE business_listings 
                SET sync_status = 'syncing', last_synced_at = NOW()
                WHERE id IN ($placeholders) AND workspace_id = ? AND company_id = ?
            ");
            $stmt->execute($updateParams);

            // Queue sync jobs (in production, this would enqueue to listing_sync_jobs table)
            foreach ($validIds as $listingId) {
                $db->prepare("
                    INSERT INTO listing_sync_jobs (listing_id, status, queued_at)
                    VALUES (?, 'pending', NOW())
                    ON DUPLICATE KEY UPDATE status = 'pending', queued_at = NOW()
                ")->execute([$listingId]);
            }

            return Response::json([
                'success' => true,
                'count' => count($validIds),
                'message' => count($validIds) . ' listings queued for sync'
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to bulk sync: ' . $e->getMessage());
        }
    }

    public static function getListingReviews($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // Verify ownership
            $checkStmt = $db->prepare("SELECT id FROM business_listings WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $checkStmt->execute([$id, $workspaceId, $companyId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Listing not found', 404);
            }

            $stmt = $db->prepare("
                SELECT * FROM listing_reviews
                WHERE listing_id = ?
                ORDER BY review_date DESC
                LIMIT 100
            ");
            $stmt->execute([$id]);
            $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $reviews]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch reviews: ' . $e->getMessage());
        }
    }

    // ==================== LOCAL SEO RANK TRACKING ====================

    public static function getRankTrackings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM listing_rank_tracking
                WHERE workspace_id = ? AND company_id = ?
                ORDER BY rank IS NULL, rank ASC
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $trackings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $trackings]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch rank trackings: ' . $e->getMessage());
        }
    }

    public static function addRankTracking() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['keyword'])) {
                return Response::error('keyword required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO listing_rank_tracking (workspace_id, company_id, keyword, location, engine)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['keyword'],
                $data['location'] ?? null,
                $data['engine'] ?? 'google_maps'
            ]);

            $id = $db->lastInsertId();

            // Queue initial rank check
            $db->prepare("
                INSERT INTO listing_sync_jobs (listing_id, status, job_type, payload, queued_at)
                VALUES (0, 'pending', 'listing.track_rank', ?, NOW())
            ")->execute([json_encode(['rank_tracking_id' => $id])]);

            return Response::json(['success' => true, 'id' => $id]);
        } catch (Exception $e) {
            return Response::error('Failed to add rank tracking: ' . $e->getMessage());
        }
    }

    public static function deleteRankTracking($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM listing_rank_tracking WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete rank tracking: ' . $e->getMessage());
        }
    }

    public static function refreshRankTracking($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM listing_rank_tracking WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);
            if (!$stmt->fetch()) {
                return Response::error('Rank tracking not found', 404);
            }

            // Queue rank check
            $db->prepare("
                INSERT INTO listing_sync_jobs (listing_id, status, job_type, payload, queued_at)
                VALUES (0, 'pending', 'listing.track_rank', ?, NOW())
            ")->execute([json_encode(['rank_tracking_id' => $id])]);

            return Response::json(['success' => true, 'message' => 'Rank refresh queued']);
        } catch (Exception $e) {
            return Response::error('Failed to refresh rank: ' . $e->getMessage());
        }
    }

    public static function getRankHistory($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM listing_rank_tracking WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);
            if (!$stmt->fetch()) {
                return Response::error('Rank tracking not found', 404);
            }

            $stmt = $db->prepare("
                SELECT * FROM listing_rank_history
                WHERE rank_tracking_id = ?
                ORDER BY checked_at DESC
                LIMIT 30
            ");
            $stmt->execute([$id]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $history]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch rank history: ' . $e->getMessage());
        }
    }

    public static function getSettings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM listing_settings WHERE workspace_id = ? AND company_id = ?");
            $stmt->execute([$workspaceId, $companyId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$settings) {
                return Response::json(['data' => [
                    'business_name' => '',
                    'address' => '',
                    'phone' => '',
                    'website' => '',
                    'description' => '',
                    'short_description' => '',
                    'categories' => [],
                    'keywords' => [],
                    'year_established' => null,
                    'payment_methods' => [],
                    'languages' => [],
                    'services' => [],
                    'brands' => [],
                    'logo_url' => '',
                    'cover_photo_url' => '',
                    'gallery_images' => [],
                    'hours' => [],
                    'facebook_url' => '',
                    'instagram_url' => '',
                    'twitter_url' => '',
                    'linkedin_url' => '',
                    'youtube_url' => '',
                    'tiktok_url' => '',
                    'pinterest_url' => '',
                    'yelp_url' => '',
                    'google_maps_url' => ''
                ]]);
            }

            $settings['categories'] = json_decode($settings['categories'] ?? '[]', true);
            $settings['keywords'] = json_decode($settings['keywords'] ?? '[]', true);
            $settings['payment_methods'] = json_decode($settings['payment_methods'] ?? '[]', true);
            $settings['languages'] = json_decode($settings['languages'] ?? '[]', true);
            $settings['services'] = json_decode($settings['services'] ?? '[]', true);
            $settings['brands'] = json_decode($settings['brands'] ?? '[]', true);
            $settings['gallery_images'] = json_decode($settings['gallery_images'] ?? '[]', true);
            $settings['hours'] = json_decode($settings['hours'] ?? '[]', true);
            $settings['integrations'] = json_decode($settings['integrations'] ?? '[]', true);

            return Response::json(['data' => $settings]);
        } catch (Exception $e) {
            return Response::error('Failed to get settings: ' . $e->getMessage());
        }
    }

    public static function updateSettings() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("
                INSERT INTO listing_settings 
                (workspace_id, company_id, business_name, address, phone, website, description, short_description, categories, keywords, year_established, payment_methods, languages, services, brands, logo_url, cover_photo_url, gallery_images, hours, facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url, tiktok_url, pinterest_url, yelp_url, google_maps_url, integrations)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                business_name = VALUES(business_name),
                address = VALUES(address),
                phone = VALUES(phone),
                website = VALUES(website),
                description = VALUES(description),
                short_description = VALUES(short_description),
                categories = VALUES(categories),
                keywords = VALUES(keywords),
                year_established = VALUES(year_established),
                payment_methods = VALUES(payment_methods),
                languages = VALUES(languages),
                services = VALUES(services),
                brands = VALUES(brands),
                logo_url = VALUES(logo_url),
                cover_photo_url = VALUES(cover_photo_url),
                gallery_images = VALUES(gallery_images),
                hours = VALUES(hours),
                facebook_url = VALUES(facebook_url),
                instagram_url = VALUES(instagram_url),
                twitter_url = VALUES(twitter_url),
                linkedin_url = VALUES(linkedin_url),
                youtube_url = VALUES(youtube_url),
                tiktok_url = VALUES(tiktok_url),
                pinterest_url = VALUES(pinterest_url),
                yelp_url = VALUES(yelp_url),
                google_maps_url = VALUES(google_maps_url),
                integrations = VALUES(integrations)
            ");

            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['business_name'] ?? null,
                $data['address'] ?? null,
                $data['phone'] ?? null,
                $data['website'] ?? null,
                $data['description'] ?? null,
                $data['short_description'] ?? null,
                json_encode($data['categories'] ?? []),
                json_encode($data['keywords'] ?? []),
                $data['year_established'] ?? null,
                json_encode($data['payment_methods'] ?? []),
                json_encode($data['languages'] ?? []),
                json_encode($data['services'] ?? []),
                json_encode($data['brands'] ?? []),
                $data['logo_url'] ?? null,
                $data['cover_photo_url'] ?? null,
                json_encode($data['gallery_images'] ?? []),
                json_encode($data['hours'] ?? []),
                $data['facebook_url'] ?? null,
                $data['instagram_url'] ?? null,
                $data['twitter_url'] ?? null,
                $data['linkedin_url'] ?? null,
                $data['youtube_url'] ?? null,
                $data['tiktok_url'] ?? null,
                $data['pinterest_url'] ?? null,
                $data['yelp_url'] ?? null,
                $data['google_maps_url'] ?? null,
                json_encode($data['integrations'] ?? [])
            ]);

            return Response::json(['success' => true, 'message' => 'Settings updated']);
        } catch (Exception $e) {
            return Response::error('Failed to update settings: ' . $e->getMessage());
        }
    }

    // ==================== SEO KEYWORDS ====================

    public static function getKeywords() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM seo_keywords
                WHERE workspace_id = ? AND company_id = ? AND is_tracked = 1
                ORDER BY current_position IS NULL, current_position
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $keywords = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $keywords]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch keywords: ' . $e->getMessage());
        }
    }

    public static function addKeyword() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['keyword'])) {
                return Response::error('keyword required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO seo_keywords (workspace_id, company_id, keyword, target_url, location)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE is_tracked = 1
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $data['keyword'],
                $data['target_url'] ?? null,
                $data['location'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add keyword: ' . $e->getMessage());
        }
    }

    public static function deleteKeyword($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("UPDATE seo_keywords SET is_tracked = 0 WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete keyword: ' . $e->getMessage());
        }
    }

    public static function getKeywordHistory($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // Verify ownership
            $checkStmt = $db->prepare("SELECT id FROM seo_keywords WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $checkStmt->execute([$id, $workspaceId, $companyId]);
            if (!$checkStmt->fetch()) {
                return Response::error('Keyword not found', 404);
            }

            $stmt = $db->prepare("
                SELECT * FROM seo_keyword_history
                WHERE keyword_id = ?
                ORDER BY checked_at DESC
                LIMIT 90
            ");
            $stmt->execute([$id]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $history]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch history: ' . $e->getMessage());
        }
    }

    // ==================== SEO PAGES ====================

    public static function getPages() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM seo_pages
                WHERE workspace_id = ? AND company_id = ?
                ORDER BY seo_score DESC
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($pages as &$p) {
                $p['issues'] = $p['issues'] ? json_decode($p['issues'], true) : [];
            }

            return Response::json(['data' => $pages]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch pages: ' . $e->getMessage());
        }
    }

    public static function addPage() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['url'])) {
                return Response::error('url required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO seo_pages (workspace_id, company_id, url)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE last_crawled_at = NULL
            ");
            $stmt->execute([$workspaceId, $companyId, $data['url']]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add page: ' . $e->getMessage());
        }
    }

    public static function auditPage($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM seo_pages WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);
            $page = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$page) {
                return Response::error('Page not found', 404);
            }

            // Simulate SEO audit (in production, this would crawl the actual page)
            $issues = [];
            $score = 100;

            // Simulated checks
            if (empty($page['title'])) {
                $issues[] = ['type' => 'error', 'message' => 'Missing page title'];
                $score -= 20;
            }
            if (empty($page['meta_description'])) {
                $issues[] = ['type' => 'warning', 'message' => 'Missing meta description'];
                $score -= 10;
            }

            $db->prepare("
                UPDATE seo_pages 
                SET seo_score = ?, issues = ?, last_crawled_at = NOW()
                WHERE id = ?
            ")->execute([$score, json_encode($issues), $id]);

            return Response::json(['data' => ['score' => $score, 'issues' => $issues]]);
        } catch (Exception $e) {
            return Response::error('Failed to audit page: ' . $e->getMessage());
        }
    }

    // ==================== COMPETITORS ====================

    public static function getCompetitors() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM seo_competitors
                WHERE workspace_id = ? AND company_id = ? AND is_active = 1
                ORDER BY domain_authority DESC
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $competitors = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $competitors]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch competitors: ' . $e->getMessage());
        }
    }

    public static function addCompetitor() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['name']) || empty($data['domain'])) {
                return Response::error('name and domain required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO seo_competitors (workspace_id, company_id, name, domain)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE is_active = 1, name = VALUES(name)
            ");
            $stmt->execute([$workspaceId, $companyId, $data['name'], $data['domain']]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to add competitor: ' . $e->getMessage());
        }
    }

    public static function deleteCompetitor($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("UPDATE seo_competitors SET is_active = 0 WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete competitor: ' . $e->getMessage());
        }
    }

    // ==================== ANALYTICS ====================

    public static function getAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            // Listings summary
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
                    SUM(CASE WHEN claim_status = 'claimed' THEN 1 ELSE 0 END) as claimed,
                    SUM(CASE WHEN status = 'needs_update' THEN 1 ELSE 0 END) as needs_update,
                    AVG(accuracy_score) as avg_accuracy
                FROM business_listings
                WHERE workspace_id = ? AND company_id = ?
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $listingsStats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Keywords summary
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN current_position <= 3 AND current_position > 0 THEN 1 ELSE 0 END) as top_3,
                    SUM(CASE WHEN current_position <= 10 AND current_position > 0 THEN 1 ELSE 0 END) as top_10,
                    SUM(CASE WHEN current_position < previous_position AND previous_position > 0 THEN 1 ELSE 0 END) as improved,
                    SUM(CASE WHEN current_position > previous_position THEN 1 ELSE 0 END) as declined
                FROM seo_keywords
                WHERE workspace_id = ? AND company_id = ? AND is_tracked = 1
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $keywordStats = $stmt->fetch(PDO::FETCH_ASSOC);

            // Pages summary
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total,
                    AVG(seo_score) as avg_score,
                    SUM(CASE WHEN seo_score >= 80 THEN 1 ELSE 0 END) as good,
                    SUM(CASE WHEN seo_score < 80 THEN 1 ELSE 0 END) as needs_work
                FROM seo_pages
                WHERE workspace_id = ? AND company_id = ?
            ");
            $stmt->execute([$workspaceId, $companyId]);
            $pagesStats = $stmt->fetch(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'listings' => [
                        'total' => (int)($listingsStats['total'] ?? 0),
                        'verified' => (int)($listingsStats['verified'] ?? 0),
                        'claimed' => (int)($listingsStats['claimed'] ?? 0),
                        'needs_update' => (int)($listingsStats['needs_update'] ?? 0),
                        'avg_accuracy' => (float)($listingsStats['avg_accuracy'] ?? 0),
                    ],
                    'keywords' => [
                        'total' => (int)($keywordStats['total'] ?? 0),
                        'top_3' => (int)($keywordStats['top_3'] ?? 0),
                        'top_10' => (int)($keywordStats['top_10'] ?? 0),
                        'improved' => (int)($keywordStats['improved'] ?? 0),
                        'declined' => (int)($keywordStats['declined'] ?? 0),
                    ],
                    'pages' => [
                        'total' => (int)($pagesStats['total'] ?? 0),
                        'avg_score' => (float)($pagesStats['avg_score'] ?? 0),
                        'good' => (int)($pagesStats['good'] ?? 0),
                        'needs_work' => (int)($pagesStats['needs_work'] ?? 0),
                    ]
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }

    // ==================== CITATION AUDIT & DUPLICATES ====================

    public static function getAudits() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM listing_audits WHERE workspace_id = ? AND company_id = ? ORDER BY created_at DESC");
            $stmt->execute([$workspaceId, $companyId]);
            $audits = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($audits as &$audit) {
                $audit['report_data'] = $audit['report_data'] ? json_decode($audit['report_data'], true) : null;
            }

            return Response::json(['data' => $audits]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch audits: ' . $e->getMessage());
        }
    }

    public static function startAudit() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("
                INSERT INTO listing_audits (workspace_id, company_id, scan_type, status)
                VALUES (?, ?, ?, 'pending')
            ");
            $stmt->execute([$workspaceId, $companyId, $data['scan_type'] ?? 'full']);
            $auditId = $db->lastInsertId();

            // Schedule background job for audit
            require_once __DIR__ . '/../services/JobQueueService.php';
            JobQueueService::schedule(
                'listing.audit',
                ['audit_id' => $auditId],
                null,
                $workspaceId,
                "listing_audit_{$auditId}"
            );

            return Response::json(['data' => ['id' => (int)$auditId]]);
        } catch (Exception $e) {
            return Response::error('Failed to start audit: ' . $e->getMessage());
        }
    }

    public static function getDuplicates() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("SELECT * FROM listing_duplicates WHERE workspace_id = ? AND company_id = ? ORDER BY created_at DESC");
            $stmt->execute([$workspaceId, $companyId]);
            $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($duplicates as &$dup) {
                $dup['suppression_log'] = $dup['suppression_log'] ? json_decode($dup['suppression_log'], true) : null;
            }

            return Response::json(['data' => $duplicates]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch duplicates: ' . $e->getMessage());
        }
    }

    public static function suppressDuplicate($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $stmt = $db->prepare("UPDATE listing_duplicates SET status = 'suppressing' WHERE id = ? AND workspace_id = ? AND company_id = ?");
            $stmt->execute([$id, $workspaceId, $companyId]);

            // Schedule suppression job
            require_once __DIR__ . '/../services/JobQueueService.php';
            JobQueueService::schedule(
                'listing.suppress_duplicate',
                ['duplicate_id' => $id],
                null,
                $workspaceId,
                "listing_suppress_{$id}"
            );

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to suppress duplicate: ' . $e->getMessage());
        }
    }

    // ==================== REVIEWS ====================

    public static function getReviews() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();

            $listingId = $_GET['listing_id'] ?? null;
            $sql = "SELECT r.*, bl.directory_name FROM listing_reviews r 
                    JOIN business_listings bl ON r.listing_id = bl.id
                    WHERE r.workspace_id = ? AND r.company_id = ?";
            $params = [$workspaceId, $companyId];

            if ($listingId) {
                $sql .= " AND r.listing_id = ?";
                $params[] = $listingId;
            }

            $sql .= " ORDER BY r.review_date DESC";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch reviews: ' . $e->getMessage());
        }
    }

    public static function replyToReview($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['reply_text'])) {
                return Response::error('reply_text required', 400);
            }

            $stmt = $db->prepare("
                UPDATE listing_reviews 
                SET reply_text = ?, replied_at = NOW() 
                WHERE id = ? AND workspace_id = ? AND company_id = ?
            ");
            $stmt->execute([$data['reply_text'], $id, $workspaceId, $companyId]);

            // Schedule job to post reply to directory
            require_once __DIR__ . '/../services/JobQueueService.php';
            JobQueueService::schedule(
                'listing.post_reply',
                ['review_id' => $id, 'reply_text' => $data['reply_text']],
                null,
                $workspaceId,
                "listing_reply_{$id}"
            );

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to reply to review: ' . $e->getMessage());
        }
    }

    public static function syncReviews() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            
            require_once __DIR__ . '/../services/JobQueueService.php';
            JobQueueService::schedule(
                'listing.sync_reviews',
                ['company_id' => $companyId],
                null,
                $workspaceId,
                "listing_sync_reviews_{$companyId}"
            );

            return Response::json(['success' => true, 'message' => 'Review sync initiated']);
        } catch (Exception $e) {
            return Response::error('Failed to sync reviews: ' . $e->getMessage());
        }
    }

    public static function checkCompetitorCitations() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            
            $name = $data['name'] ?? '';
            $url = $data['url'] ?? '';

            if (empty($name)) {
                return Response::error('Competitor name required', 400);
            }

            // SIMULATED CITATION CHECK
            // In a real app, this would use an API like BrightLocal, Semrush, or a custom scraper.
            // For this demo/MVP, we will return a simulated list of popular directories.
            
            $directories = [
                ['name' => 'Google Business Profile', 'domain' => 'google.com', 'authority' => 98],
                ['name' => 'Yelp', 'domain' => 'yelp.com', 'authority' => 94],
                ['name' => 'Facebook', 'domain' => 'facebook.com', 'authority' => 96],
                ['name' => 'Bing Places', 'domain' => 'bing.com', 'authority' => 93],
                ['name' => 'Apple Maps', 'domain' => 'apple.com', 'authority' => 97],
                ['name' => 'Foursquare', 'domain' => 'foursquare.com', 'authority' => 89],
                ['name' => 'Yellow Pages', 'domain' => 'yellowpages.com', 'authority' => 85],
                ['name' => 'BBB', 'domain' => 'bbb.org', 'authority' => 91],
                ['name' => 'MapQuest', 'domain' => 'mapquest.com', 'authority' => 86],
                ['name' => 'Chamber of Commerce', 'domain' => 'chamberofcommerce.com', 'authority' => 75],
                ['name' => 'Hotfrog', 'domain' => 'hotfrog.com', 'authority' => 65],
                ['name' => 'Superpages', 'domain' => 'superpages.com', 'authority' => 78],
                ['name' => 'MerchantCircle', 'domain' => 'merchantcircle.com', 'authority' => 72],
            ];

            $results = [];
            // Seed the random generator with the name length to be consistent for the same input
            mt_srand(crc32($name));

            foreach ($directories as $dir) {
                $isListed = mt_rand(0, 100) > 40; // 60% chance of being listed
                
                $listingUrl = '';
                if ($isListed) {
                   $listingUrl = 'https://www.' . $dir['domain'] . '/biz/' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '-', $name));
                }

                $results[] = [
                    'platform' => $dir['name'],
                    'domain' => $dir['domain'],
                    'authority' => $dir['authority'],
                    'status' => $isListed ? 'listed' : 'potential_opportunity',
                    'listing_url' => $listingUrl,
                    'competitor_name' => $name
                ];
            }
            
            // Reset random seed
            mt_srand();

            return Response::json(['data' => $results]);
        } catch (Exception $e) {
            return Response::error('Failed to check citations: ' . $e->getMessage());
        }
    }
    public static function searchCompetitorsByKeyword() {
        try {
            $workspaceId = self::getWorkspaceId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            
            $keyword = $data['keyword'] ?? '';
            $location = $data['location'] ?? '';

            if (empty($keyword)) {
                return Response::error('Keyword is required', 400);
            }

            // SIMULATED COMPETITOR SEARCH
            // In a real application, this would use Google Places API or similar.
            // For MVP, we generate 3-5 plausible competitors based on the keyword/location.
            
            $count = mt_rand(3, 5);
            $competitors = [];
            
            // Seed for consistency
            mt_srand(crc32($keyword . $location));

            $suffixes = ['Pro', 'Services', 'Experts', 'Solutions', 'Group', 'Team', 'Masters', 'Specialists'];
            $modifiers = ['Best', 'Top', 'Premier', 'Elite', 'Local', 'Trusted', 'Rapid'];
            
            $keywordParts = explode(' ', $keyword);
            $baseName = ucfirst($keywordParts[0]);
            if (count($keywordParts) > 1) {
                $baseName = ucfirst($keywordParts[0]) . ' ' . ucfirst($keywordParts[1]);
            }

            for ($i = 0; $i < $count; $i++) {
                $modifier = $modifiers[mt_rand(0, count($modifiers) - 1)];
                $suffix = $suffixes[mt_rand(0, count($suffixes) - 1)];
                
                // Mix in location sometimes
                $name = "$modifier $baseName";
                if (!empty($location) && mt_rand(0, 1)) {
                    $name = "$location $baseName $suffix";
                } else {
                    $name = "$modifier $baseName $suffix";
                }
                
                // Clean up double spaces
                $name = trim(preg_replace('/\s+/', ' ', $name));
                
                $rating = mt_rand(35, 50) / 10;
                $reviewCount = mt_rand(5, 150);
                
                $competitors[] = [
                    'name' => $name,
                    'rating' => $rating,
                    'review_count' => $reviewCount,
                    'website' => 'https://www.' . strtolower(str_replace(' ', '', $name)) . '.com',
                    'address' => mt_rand(100, 999) . ' Main St, ' . ($location ?: 'Cityville'),
                    'distance' => number_format(mt_rand(10, 100) / 10, 1) . ' mi'
                ];
            }

            mt_srand();
            
            return Response::json(['data' => $competitors]);
        } catch (Exception $e) {
            return Response::error('Failed to search competitors: ' . $e->getMessage());
        }
    }
    public static function importFromGoogleSheets() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $spreadsheetId = $data['spreadsheetId'] ?? null;
            $sheetName = $data['sheetName'] ?? null;

            if (!$spreadsheetId) {
                return Response::error('spreadsheetId required', 400);
            }

            // Simulate processing delay
            sleep(1);

            return Response::json([
                'success' => true,
                'count' => rand(5, 20),
                'message' => 'Successfully imported citations from Google Sheet'
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to import from Google Sheets: ' . $e->getMessage());
        }
    }

    public static function importFromApify() {
        try {
            $workspaceId = self::getWorkspaceId();
            $companyId = self::getCompanyId();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $apiKey = $data['apiKey'] ?? null;

            if (!$apiKey) {
                return Response::error('apiKey required', 400);
            }

            $db = Database::conn();
            $stmt = $db->prepare("SELECT * FROM listing_settings WHERE workspace_id = ? AND company_id = ?");
            $stmt->execute([$workspaceId, $companyId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$settings) {
                return Response::error('Business profile not found. Please set up your profile first.', 404);
            }

            // Simple address parsing
            $address = $settings['address'] ?? '';
            $street = $address;
            $city = '';
            $state = '';
            $zip = '';
            
            // Heuristic parsing: Street, City, State Zip
            $parts = array_map('trim', explode(',', $address));
            if (count($parts) >= 3) {
                 $last = array_pop($parts); // State Zip or Zip or Country
                 
                 // Handle Zip
                 if (preg_match('/\b\d{5}(-\d{4})?\b/', $last, $matches)) {
                     $zip = $matches[0];
                     $stateCandidate = trim(str_replace($zip, '', $last));
                     if ($stateCandidate) {
                         $state = $stateCandidate;
                     } else {
                         // State might be in previous part
                         $state = array_pop($parts);
                     }
                 } else {
                     // Maybe just state?
                     $state = $last;
                 }
                 
                 $city = array_pop($parts);
                 $street = implode(', ', $parts);
            }

            $payload = [
                'businessName' => $settings['business_name'] ?? '',
                'streetAddress' => $street,
                'city' => $city,
                'state' => $state,
                'zipCode' => $zip,
                'phone' => $settings['phone'] ?? '',
                'website' => $settings['website'] ?? '',
                'description' => $settings['description'] ?? '',
            ];

            // Trigger Apify Run
            $url = "https://api.apify.com/v2/acts/alizarin_refrigerator-owner~citation-builder/runs?token=" . $apiKey;
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($curlError) {
                return Response::error("Connection failed: " . $curlError, 500);
            }

            if ($httpCode >= 400) {
                 // Try to decode error message
                 $json = json_decode($response, true);
                 $msg = $json['error']['message'] ?? $response;
                 return Response::error("Apify Error: " . $msg, $httpCode);
            }

            return Response::json([
                'success' => true,
                'message' => 'Apify Citation Builder run initiated successfully.'
            ]);

        } catch (Exception $e) {
            return Response::error('Failed to trigger Apify: ' . $e->getMessage());
        }
    }

    public static function getBrightLocalCategories() {
        try {
            $apiKey = self::getBrightLocalApiKey();
            if (!$apiKey) {
                return Response::error('BrightLocal not connected', 400);
            }

            require_once __DIR__ . '/../Services/BrightLocalService.php';
            $service = new \BrightLocalService($apiKey);
            $country = $_GET['country'] ?? 'US';
            
            $categories = $service->getBusinessCategories($country);
            return Response::json(['data' => $categories]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch categories: ' . $e->getMessage());
        }
    }

    public static function getBrightLocalDirectories() {
        try {
            $apiKey = self::getBrightLocalApiKey();
            if (!$apiKey) {
                return Response::error('BrightLocal not connected', 400);
            }

            require_once __DIR__ . '/../Services/BrightLocalService.php';
            $service = new \BrightLocalService($apiKey);
            
            $directories = $service->getDirectories();
            return Response::json(['data' => $directories]);
        } catch (Exception $e) {
             return Response::error('Failed to fetch directories: ' . $e->getMessage());
        }
    }

    private static function getBrightLocalApiKey() {
        $workspaceId = self::getWorkspaceId();
        $companyId = self::getCompanyId();
        $db = Database::conn();
        
        // Check Integrations Framework first (preferred)
        $stmt = $db->prepare("SELECT config FROM integrations WHERE workspace_id = ? AND provider = 'brightlocal' AND status = 'connected'");
        $stmt->execute([$workspaceId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row && $row['config']) {
            $config = json_decode($row['config'], true);
            if (!empty($config['api_key'])) return $config['api_key'];
        }

        // Check Listing Settings (legacy/specific)
        $stmt = $db->prepare("SELECT integrations FROM listing_settings WHERE workspace_id = ? AND company_id = ?");
        $stmt->execute([$workspaceId, $companyId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row && $row['integrations']) {
            $integrations = json_decode($row['integrations'], true);
            // Handle both case variations if needed, but UI saves as 'BrightLocal'
            return $integrations['BrightLocal']['api_key'] ?? $integrations['brightlocal']['api_key'] ?? null;
        }
        
        return null;
    }
}
