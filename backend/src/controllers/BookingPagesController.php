<?php
/**
 * Booking Pages Controller
 * Manages shareable booking pages with native/external scheduler support
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class BookingPagesController {
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        throw new Exception('Workspace context required. Include the X-Workspace-Id header or authenticate.');
    }

    private static function getCompanyId(): ?int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        return $ctx->activeCompanyId ?? null;
    }

    /**
     * List all booking pages
     */
    public static function index() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $companyId = $_GET['company_id'] ?? null;
            $source = $_GET['source'] ?? null;
            $activeOnly = ($_GET['active_only'] ?? 'false') === 'true';
            
            $sql = "
                SELECT bp.*,
                       c.name as company_name,
                       (SELECT COUNT(*) FROM appointments a WHERE a.booking_page_id = bp.id) as total_bookings,
                       (SELECT COUNT(*) FROM booking_leads bl WHERE bl.booking_page_id = bp.id AND bl.status = 'pending') as pending_leads
                FROM booking_pages bp
                LEFT JOIN companies c ON bp.company_id = c.id
                WHERE bp.workspace_id = ?
            ";
            $params = [$workspaceId];
            
            if ($companyId) {
                $sql .= " AND bp.company_id = ?";
                $params[] = $companyId;
            }
            
            if ($source) {
                $sql .= " AND bp.source = ?";
                $params[] = $source;
            }
            
            if ($activeOnly) {
                $sql .= " AND bp.is_active = 1";
            }
            
            $sql .= " ORDER BY bp.created_at DESC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $pages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields
            foreach ($pages as &$page) {
                $page['source_config'] = $page['source_config'] ? json_decode($page['source_config'], true) : null;
                $page['native_config'] = $page['native_config'] ? json_decode($page['native_config'], true) : null;
                $page['form_schema'] = $page['form_schema'] ? json_decode($page['form_schema'], true) : null;
                $page['branding'] = $page['branding'] ? json_decode($page['branding'], true) : null;
                $page['payment_config'] = $page['payment_config'] ? json_decode($page['payment_config'], true) : null;
            }
            
            return Response::json(['data' => $pages]);
        } catch (PDOException $e) {
            $sqlState = $e->getCode();
            if ($sqlState === '42S02') {
                return Response::error('Booking pages tables are missing in the database. Please apply backend/migrations/create_booking_pages.sql.', 400);
            }
            return Response::error('Failed to fetch booking pages: ' . $e->getMessage());
        } catch (Exception $e) {
            return Response::error('Failed to fetch booking pages: ' . $e->getMessage());
        }
    }

    /**
     * Get single booking page
     */
    public static function show($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("
                SELECT bp.*,
                       c.name as company_name
                FROM booking_pages bp
                LEFT JOIN companies c ON bp.company_id = c.id
                WHERE bp.id = ? AND bp.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $page = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$page) {
                return Response::error('Booking page not found', 404);
            }
            
            // Parse JSON fields
            $page['source_config'] = $page['source_config'] ? json_decode($page['source_config'], true) : null;
            $page['native_config'] = $page['native_config'] ? json_decode($page['native_config'], true) : null;
            $page['form_schema'] = $page['form_schema'] ? json_decode($page['form_schema'], true) : null;
            $page['branding'] = $page['branding'] ? json_decode($page['branding'], true) : null;
            $page['payment_config'] = $page['payment_config'] ? json_decode($page['payment_config'], true) : null;
            
            // Get related data for native pages
            if ($page['source'] === 'native' && $page['native_config']) {
                $serviceIds = $page['native_config']['service_ids'] ?? [];
                if (!empty($serviceIds)) {
                    $placeholders = implode(',', array_fill(0, count($serviceIds), '?'));
                    $stmt = $db->prepare("SELECT * FROM services WHERE id IN ($placeholders) AND is_active = 1");
                    $stmt->execute($serviceIds);
                    $page['services'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                }
            }
            
            return Response::json(['data' => $page]);
        } catch (PDOException $e) {
            $sqlState = $e->getCode();
            if ($sqlState === '42S02') {
                return Response::error('Booking pages tables are missing in the database. Please apply backend/migrations/create_booking_pages.sql.', 400);
            }
            return Response::error('Failed to fetch booking page: ' . $e->getMessage());
        } catch (Exception $e) {
            return Response::error('Failed to fetch booking page: ' . $e->getMessage());
        }
    }

    /**
     * Create booking page
     */
    public static function store() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['slug']) || empty($data['title']) || empty($data['source'])) {
                return Response::error('slug, title, and source are required', 400);
            }
            
            // Validate slug uniqueness
            $stmt = $db->prepare("SELECT id FROM booking_pages WHERE workspace_id = ? AND slug = ?");
            $stmt->execute([$workspaceId, $data['slug']]);
            if ($stmt->fetch()) {
                return Response::error('Slug already exists in this workspace', 409);
            }
            
            // Validate source
            if (!in_array($data['source'], ['native', 'calendly', 'acuity'])) {
                return Response::error('Invalid source. Must be native, calendly, or acuity', 400);
            }
            
            $stmt = $db->prepare("
                INSERT INTO booking_pages 
                (workspace_id, company_id, slug, title, description, source, 
                 source_config, native_config, form_schema, branding, payment_config, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $workspaceId,
                $data['company_id'] ?? self::getCompanyId(),
                $data['slug'],
                $data['title'],
                $data['description'] ?? null,
                $data['source'],
                isset($data['source_config']) ? json_encode($data['source_config']) : null,
                isset($data['native_config']) ? json_encode($data['native_config']) : null,
                isset($data['form_schema']) ? json_encode($data['form_schema']) : json_encode([
                    'fields' => [
                        ['name' => 'guest_name', 'label' => 'Name', 'type' => 'text', 'required' => true],
                        ['name' => 'guest_email', 'label' => 'Email', 'type' => 'email', 'required' => true],
                        ['name' => 'guest_phone', 'label' => 'Phone', 'type' => 'tel', 'required' => false],
                        ['name' => 'notes', 'label' => 'Notes', 'type' => 'textarea', 'required' => false]
                    ]
                ]),
                isset($data['branding']) ? json_encode($data['branding']) : null,
                isset($data['payment_config']) ? json_encode($data['payment_config']) : json_encode(['requires_payment' => false]),
                $data['is_active'] ?? true
            ]);
            
            $id = $db->lastInsertId();
            return self::show($id);
        } catch (PDOException $e) {
            $sqlState = $e->getCode();
            if ($sqlState === '42S02') {
                return Response::error('Booking pages tables are missing in the database. Please apply backend/migrations/create_booking_pages.sql.', 400);
            }
            return Response::error('Failed to create booking page: ' . $e->getMessage());
        } catch (Exception $e) {
            return Response::error('Failed to create booking page: ' . $e->getMessage());
        }
    }

    /**
     * Update booking page
     */
    public static function update($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Verify ownership
            $stmt = $db->prepare("SELECT id FROM booking_pages WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::error('Booking page not found', 404);
            }
            
            // Check slug uniqueness if changed
            if (isset($data['slug'])) {
                $stmt = $db->prepare("SELECT id FROM booking_pages WHERE workspace_id = ? AND slug = ? AND id != ?");
                $stmt->execute([$workspaceId, $data['slug'], $id]);
                if ($stmt->fetch()) {
                    return Response::error('Slug already exists in this workspace', 409);
                }
            }
            
            $fields = [];
            $params = [];
            
            $allowedFields = ['company_id', 'slug', 'title', 'description', 'source', 'is_active'];
            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            $jsonFields = ['source_config', 'native_config', 'form_schema', 'branding', 'payment_config'];
            foreach ($jsonFields as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $params[] = json_encode($data[$field]);
                }
            }
            
            if (!empty($fields)) {
                $params[] = $id;
                $params[] = $workspaceId;
                $stmt = $db->prepare("UPDATE booking_pages SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?");
                $stmt->execute($params);
            }
            
            return self::show($id);
        } catch (PDOException $e) {
            $sqlState = $e->getCode();
            if ($sqlState === '42S02') {
                return Response::error('Booking pages tables are missing in the database. Please apply backend/migrations/create_booking_pages.sql.', 400);
            }
            return Response::error('Failed to update booking page: ' . $e->getMessage());
        } catch (Exception $e) {
            return Response::error('Failed to update booking page: ' . $e->getMessage());
        }
    }

    /**
     * Delete booking page
     */
    public static function destroy($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            
            $stmt = $db->prepare("DELETE FROM booking_pages WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            if ($stmt->rowCount() === 0) {
                return Response::error('Booking page not found', 404);
            }
            
            return Response::json(['success' => true]);
        } catch (PDOException $e) {
            $sqlState = $e->getCode();
            if ($sqlState === '42S02') {
                return Response::error('Booking pages tables are missing in the database. Please apply backend/migrations/create_booking_pages.sql.', 400);
            }
            return Response::error('Failed to delete booking page: ' . $e->getMessage());
        } catch (Exception $e) {
            return Response::error('Failed to delete booking page: ' . $e->getMessage());
        }
    }

    /**
     * Get public booking page by slug (no auth required)
     */
    public static function getPublicPage($slug) {
        try {
            $db = Database::conn();
            
            $stmt = $db->prepare("
                SELECT bp.*,
                       c.name as company_name,
                       c.logo_url as company_logo,
                       w.id as workspace_id
                FROM booking_pages bp
                LEFT JOIN companies c ON bp.company_id = c.id
                LEFT JOIN workspaces w ON bp.workspace_id = w.id
                WHERE bp.slug = ? AND bp.is_active = 1
            ");
            $stmt->execute([$slug]);
            $page = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$page) {
                return Response::error('Booking page not found or inactive', 404);
            }
            
            // Parse JSON fields
            $page['source_config'] = $page['source_config'] ? json_decode($page['source_config'], true) : null;
            $page['native_config'] = $page['native_config'] ? json_decode($page['native_config'], true) : null;
            $page['form_schema'] = $page['form_schema'] ? json_decode($page['form_schema'], true) : null;
            $page['branding'] = $page['branding'] ? json_decode($page['branding'], true) : null;
            $page['payment_config'] = $page['payment_config'] ? json_decode($page['payment_config'], true) : null;
            
            // For native pages, get services and staff
            if ($page['source'] === 'native' && $page['native_config']) {
                $serviceIds = $page['native_config']['service_ids'] ?? [];
                if (!empty($serviceIds)) {
                    $placeholders = implode(',', array_fill(0, count($serviceIds), '?'));
                    $stmt = $db->prepare("
                        SELECT s.*, sc.name as category_name
                        FROM services s
                        LEFT JOIN service_categories sc ON s.category_id = sc.id
                        WHERE s.id IN ($placeholders) AND s.is_active = 1 AND s.allow_online_booking = 1
                        ORDER BY s.sort_order, s.name
                    ");
                    $stmt->execute($serviceIds);
                    $page['services'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                }
                
                // Get staff who can perform these services
                if (!empty($serviceIds)) {
                    $placeholders = implode(',', array_fill(0, count($serviceIds), '?'));
                    $stmt = $db->prepare("
                        SELECT DISTINCT sm.id, sm.first_name, sm.last_name, sm.title, sm.bio, sm.avatar_url, sm.color
                        FROM staff_members sm
                        JOIN staff_services ss ON sm.id = ss.staff_id
                        WHERE ss.service_id IN ($placeholders) 
                        AND sm.workspace_id = ? 
                        AND sm.is_active = 1 
                        AND sm.accepts_bookings = 1
                        ORDER BY sm.sort_order, sm.first_name
                    ");
                    $stmt->execute(array_merge($serviceIds, [$page['workspace_id']]));
                    $page['staff'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                }
                
                // Get booking settings
                $stmt = $db->prepare("SELECT * FROM booking_settings WHERE workspace_id = ?");
                $stmt->execute([$page['workspace_id']]);
                $settings = $stmt->fetch(PDO::FETCH_ASSOC);
                $page['booking_settings'] = $settings ?: [
                    'min_notice_hours' => 1,
                    'max_advance_days' => 60,
                    'slot_interval_minutes' => 30
                ];
            }
            
            return Response::json(['data' => $page]);
        } catch (PDOException $e) {
            $sqlState = $e->getCode();
            if ($sqlState === '42S02') {
                return Response::error('Booking pages tables are missing in the database. Please apply backend/migrations/create_booking_pages.sql.', 400);
            }
            return Response::error('Failed to load booking page: ' . $e->getMessage());
        } catch (Exception $e) {
            return Response::error('Failed to load booking page: ' . $e->getMessage());
        }
    }

    /**
     * Capture lead from external booking (calendly/acuity)
     */
    public static function captureLead($slug) {
        try {
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Get booking page
            $stmt = $db->prepare("SELECT * FROM booking_pages WHERE slug = ? AND is_active = 1");
            $stmt->execute([$slug]);
            $page = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$page) {
                return Response::error('Booking page not found', 404);
            }
            
            if ($page['source'] === 'native') {
                return Response::error('Lead capture is only for external booking sources', 400);
            }
            
            $workspaceId = $page['workspace_id'];
            $companyId = $page['company_id'];
            
            // Find or create contact
            $contactId = null;
            if (!empty($data['guest_email'])) {
                $stmt = $db->prepare("SELECT id FROM contacts WHERE workspace_id = ? AND email = ?");
                $stmt->execute([$workspaceId, $data['guest_email']]);
                $contact = $stmt->fetch(PDO::FETCH_ASSOC);
                $contactId = $contact ? $contact['id'] : null;
            }
            
            if (!$contactId && !empty($data['guest_phone'])) {
                $stmt = $db->prepare("SELECT id FROM contacts WHERE workspace_id = ? AND phone = ?");
                $stmt->execute([$workspaceId, $data['guest_phone']]);
                $contact = $stmt->fetch(PDO::FETCH_ASSOC);
                $contactId = $contact ? $contact['id'] : null;
            }
            
            if (!$contactId) {
                // Create new contact
                $nameParts = explode(' ', $data['guest_name'] ?? '', 2);
                $stmt = $db->prepare("
                    INSERT INTO contacts (workspace_id, company_id, first_name, last_name, email, phone, source)
                    VALUES (?, ?, ?, ?, ?, ?, 'booking_page')
                ");
                $stmt->execute([
                    $workspaceId,
                    $companyId,
                    $nameParts[0] ?? '',
                    $nameParts[1] ?? '',
                    $data['guest_email'] ?? null,
                    $data['guest_phone'] ?? null
                ]);
                $contactId = $db->lastInsertId();
            }
            
            // Create lead record
            $stmt = $db->prepare("
                INSERT INTO booking_leads 
                (workspace_id, company_id, booking_page_id, contact_id, 
                 guest_name, guest_email, guest_phone, form_data, 
                 external_source, external_booking_id, external_event_url, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $page['id'],
                $contactId,
                $data['guest_name'] ?? null,
                $data['guest_email'] ?? null,
                $data['guest_phone'] ?? null,
                isset($data['form_data']) ? json_encode($data['form_data']) : null,
                $page['source'],
                $data['external_booking_id'] ?? null,
                $data['external_event_url'] ?? null
            ]);
            
            $leadId = $db->lastInsertId();
            
            // Emit business event
            $stmt = $db->prepare("
                INSERT INTO business_events (workspace_id, company_id, event_type, entity_type, entity_id, payload)
                VALUES (?, ?, 'appointment.external_booked_pending', 'booking_lead', ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $companyId,
                $leadId,
                json_encode([
                    'lead_id' => $leadId,
                    'booking_page_id' => $page['id'],
                    'contact_id' => $contactId,
                    'source' => $page['source']
                ])
            ]);
            
            return Response::json([
                'success' => true,
                'data' => [
                    'lead_id' => (int)$leadId,
                    'contact_id' => (int)$contactId
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to capture lead: ' . $e->getMessage());
        }
    }

    /**
     * Webhook handler for external booking confirmations
     */
    public static function handleWebhook($source) {
        try {
            $db = Database::conn();
            $payload = file_get_contents('php://input');
            $data = json_decode($payload, true);
            
            // Log webhook for debugging
            error_log("Booking webhook received from $source: " . $payload);
            
            // TODO: Implement source-specific webhook handling
            // For now, return 200 to acknowledge receipt
            
            if ($source === 'calendly') {
                // Calendly webhook structure
                // Extract event data and match to lead by external_booking_id
                // Create appointment and update lead status
            } elseif ($source === 'acuity') {
                // Acuity webhook structure
                // Similar processing
            }
            
            return Response::json(['success' => true, 'message' => 'Webhook received']);
        } catch (Exception $e) {
            error_log("Webhook error: " . $e->getMessage());
            return Response::error('Webhook processing failed: ' . $e->getMessage());
        }
    }
}
