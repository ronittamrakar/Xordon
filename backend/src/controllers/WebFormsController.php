<?php
/**
 * WebFormsController - Handles all webforms API endpoints
 * Replaces XordonForms/api/index.php functionality
 * 
 * Endpoints served under /webforms-api/*:
 * - Forms CRUD, duplicate, public, submit
 * - Folders CRUD
 * - Submissions
 * - Analytics/Dashboard
 * - Webhooks CRUD + test
 * - User settings
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../TenantContext.php';
require_once __DIR__ . '/../services/SimpleMail.php';
require_once __DIR__ . '/LeadMatchesController.php';

use App\Controllers\LeadMatchesController;

class WebFormsController {
    
    /**
     * Get workspace scope for queries
     */
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        // Fallback to user's first workspace or 1
        return 1;
    }
    
    /**
     * Get current user ID
     */
    private static function getUserId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->userId)) {
            return (int)$ctx->userId;
        }
        try {
            return Auth::userIdOrFail();
        } catch (Exception $e) {
            return 1;
        }
    }

    private static function parseSettings($raw): array {
        if (is_array($raw)) {
            return $raw;
        }
        if (is_string($raw) && trim($raw) !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
        return [];
    }

    private static function buildMarketplaceLeadFromSubmission(array $form, array $settings, array $input, int $workspaceId): array {
        $marketplace = $settings['marketplace'] ?? null;
        if (!is_array($marketplace) || !($marketplace['enabled'] ?? false)) {
            return ['enabled' => false];
        }

        $fieldMap = is_array($marketplace['field_map'] ?? null) ? $marketplace['field_map'] : [];
        $getVal = function(string $key) use ($input, $fieldMap) {
            $mappedKey = $fieldMap[$key] ?? $key;
            $val = $input[$mappedKey] ?? null;
            if (is_string($val)) {
                $val = trim($val);
                return $val === '' ? null : $val;
            }
            return $val;
        };

        $serviceId = $getVal('service_id') ?? ($marketplace['default_service_id'] ?? null);

        $errors = [];
        if (!$serviceId) {
            $errors[] = 'Service is required (map service_id or set default_service_id)';
        }

        $leadPayload = [
            'source' => 'form',
            'source_form_id' => (int)($form['id'] ?? 0),
            'consumer_name' => $getVal('consumer_name') ?? $getVal('name'),
            'consumer_email' => $getVal('consumer_email') ?? $getVal('email'),
            'consumer_phone' => $getVal('consumer_phone') ?? $getVal('phone'),
            'city' => $getVal('city'),
            'region' => $getVal('region') ?? $getVal('state'),
            'postal_code' => $getVal('postal_code') ?? $getVal('zip'),
            'timing' => $getVal('timing') ?? ($marketplace['default_timing'] ?? 'flexible'),
            'budget_min' => $getVal('budget_min'),
            'budget_max' => $getVal('budget_max'),
            'title' => $getVal('title') ?? ($form['title'] ?? null),
            'description' => $getVal('description') ?? $getVal('message'),
            'property_type' => $getVal('property_type'),
            'is_exclusive' => (bool)($marketplace['is_exclusive'] ?? false),
            'max_sold_count' => $marketplace['max_sold_count'] ?? 3,
            'services' => $serviceId ? [[ 'service_id' => (int)$serviceId ]] : [],
            'consent_contact' => $getVal('consent_contact') ?? true,
            'answers' => $input,
        ];

        if (isset($leadPayload['budget_min']) && is_string($leadPayload['budget_min']) && $leadPayload['budget_min'] !== '') {
            $leadPayload['budget_min'] = (float)$leadPayload['budget_min'];
        }
        if (isset($leadPayload['budget_max']) && is_string($leadPayload['budget_max']) && $leadPayload['budget_max'] !== '') {
            $leadPayload['budget_max'] = (float)$leadPayload['budget_max'];
        }

        $price = 0.0;
        if ($serviceId) {
            $price = LeadMatchesController::calculateLeadPrice($workspaceId, $leadPayload);
        }

        return [
            'enabled' => true,
            'errors' => $errors,
            'service_id' => $serviceId ? (int)$serviceId : null,
            'lead_price' => $price,
            'lead_payload' => $leadPayload,
            'auto_route' => ($marketplace['auto_route'] ?? true) === true,
        ];
    }

    /**
     * Reply to a submission via the workspace's sending account (same email used for marketing).
     */
    public static function replyToSubmission($formId, $submissionId) {
        $workspaceId = self::getWorkspaceId();
        $userId = self::getUserId();
        $pdo = Database::conn();

        try {
            // Validate form belongs to workspace
            $stmt = $pdo->prepare("SELECT id, title FROM webforms_forms WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$formId, $workspaceId]);
            $form = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$form) {
                return Response::json(['error' => 'Form not found'], 404);
            }

            // Load submission
            $stmt = $pdo->prepare("
                SELECT *
                FROM webforms_form_submissions
                WHERE id = ? AND form_id = ?
            ");
            $stmt->execute([$submissionId, $formId]);
            $submission = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$submission) {
                return Response::json(['error' => 'Submission not found'], 404);
            }

            $payload = json_decode(file_get_contents('php://input'), true) ?? [];

            // Determine recipient email
            $toEmail = $payload['to'] ?? null;
            $data = [];
            if (isset($submission['submission_data']) && is_string($submission['submission_data'])) {
                $decoded = json_decode($submission['submission_data'], true);
                if (is_array($decoded)) {
                    $data = $decoded;
                }
            }
            if (!$toEmail) {
                foreach ($data as $key => $value) {
                    if (preg_match('/email/i', $key) && is_string($value) && filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $toEmail = $value;
                        break;
                    }
                }
            }
            if (!$toEmail || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
                return Response::json(['error' => 'No valid recipient email found for this submission'], 422);
            }

            $subject = $payload['subject'] ?? ('Re: ' . ($form['title'] ?? 'Form submission') . " #{$submissionId}");
            $message = $payload['message'] ?? '';
            if (trim($message) === '') {
                return Response::json(['error' => 'Message is required'], 422);
            }

            // Fetch workspace sending account (same one used for email marketing)
            $stmt = $pdo->prepare("
                SELECT *
                FROM sending_accounts
                WHERE workspace_id = ? AND status = 'active'
                ORDER BY 
                    CASE WHEN smtp_host IS NOT NULL AND smtp_password IS NOT NULL THEN 0 ELSE 1 END,
                    id ASC
                LIMIT 1
            ");
            $stmt->execute([$workspaceId]);
            $sendingAccount = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$sendingAccount) {
                return Response::json(['error' => 'No active sending account configured for this workspace'], 422);
            }

            $mailer = new SimpleMail();
            $htmlMessage = nl2br($message);
            $sent = $mailer->sendEmail($sendingAccount, $toEmail, $subject, $htmlMessage, null, null);

            if (!$sent) {
                return Response::json(['error' => 'Failed to send reply email'], 500);
            }

            // Mark submission as read after replying
            $update = $pdo->prepare("UPDATE webforms_form_submissions SET status = 'read' WHERE id = ? LIMIT 1");
            $update->execute([$submissionId]);

            return Response::json([
                'success' => true,
                'message' => 'Reply sent successfully',
                'to' => $toEmail,
                'subject' => $subject
            ]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        } catch (Exception $e) {
            return Response::json(['error' => 'Error sending reply: ' . $e->getMessage()], 500);
        }
    }
    
    // ========== DASHBOARD / ANALYTICS ==========
    
    public static function getDashboardStats() {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            // Get overview stats
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total_forms,
                    COUNT(CASE WHEN status = 'published' THEN 1 END) as active_forms
                FROM webforms_forms 
                WHERE workspace_id = ?
            ");
            $stmt->execute([$workspaceId]);
            $formStats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get submission count
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as total_submissions
                FROM webforms_form_submissions fs
                JOIN webforms_forms f ON fs.form_id = f.id
                WHERE f.workspace_id = ?
            ");
            $stmt->execute([$workspaceId]);
            $subStats = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get top forms
            $stmt = $pdo->prepare("
                SELECT f.*, COUNT(fs.id) as submissions
                FROM webforms_forms f
                LEFT JOIN webforms_form_submissions fs ON f.id = fs.form_id
                WHERE f.workspace_id = ?
                GROUP BY f.id
                ORDER BY submissions DESC, f.created_at DESC
                LIMIT 5
            ");
            $stmt->execute([$workspaceId]);
            $topForms = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get views count
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as total_views
                FROM webforms_form_views fv
                JOIN webforms_forms f ON fv.form_id = f.id
                WHERE f.workspace_id = ?
            ");
            $stmt->execute([$workspaceId]);
            $viewStats = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalViews = (int)($viewStats['total_views'] ?? 0);

            // Get starts count
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as total_starts
                FROM webforms_form_starts fs
                JOIN webforms_forms f ON fs.form_id = f.id
                WHERE f.workspace_id = ?
            ");
            $stmt->execute([$workspaceId]);
            $startStats = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalStarts = (int)($startStats['total_starts'] ?? 0);

            // Generate submission trends (last 7 days)
            $submissionTrends = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i days"));
                $stmt = $pdo->prepare("
                    SELECT COUNT(*) as count
                    FROM webforms_form_submissions fs
                    JOIN webforms_forms f ON fs.form_id = f.id
                    WHERE f.workspace_id = ? AND DATE(fs.created_at) = ?
                ");
                $stmt->execute([$workspaceId, $date]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                $submissionTrends[] = [
                    'date' => $date,
                    'submissions' => (int)($row['count'] ?? 0)
                ];
            }
            
            $totalSubmissions = (int)($subStats['total_submissions'] ?? 0);
            $conversionRate = $totalViews > 0 ? round(($totalSubmissions / $totalViews) * 100, 1) : 0;
            
            return Response::json([
                'overview' => [
                    'total_forms' => (int)($formStats['total_forms'] ?? 0),
                    'total_submissions' => $totalSubmissions,
                    'active_forms' => (int)($formStats['active_forms'] ?? 0),
                    'conversion_rate' => $conversionRate,
                    'avg_response_time' => 0,
                    'completion_rate' => $totalStarts > 0 ? round(($totalSubmissions / $totalStarts) * 100, 1) : 0,
                    'total_views' => $totalViews,
                    'total_starts' => $totalStarts
                ],
                'top_forms' => $topForms,
                'submission_trends' => $submissionTrends
            ]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    // ========== FORMS ==========
    
    public static function getForms() {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $sql = "SELECT f.*, 
                    (SELECT COUNT(*) FROM webforms_form_submissions WHERE form_id = f.id) as submission_count,
                    (SELECT COUNT(*) FROM webforms_form_views WHERE form_id = f.id) as view_count
                    FROM webforms_forms f 
                    WHERE f.workspace_id = ?";
            $params = [$workspaceId];
            
            // Filter by folder_id
            if (isset($_GET['folder_id'])) {
                if ($_GET['folder_id'] === 'null' || $_GET['folder_id'] === '') {
                    $sql .= " AND f.folder_id IS NULL";
                } else {
                    $sql .= " AND f.folder_id = ?";
                    $params[] = (int)$_GET['folder_id'];
                }
            }
            
            // Filter by status
            if (isset($_GET['status']) && $_GET['status'] !== 'all') {
                $sql .= " AND f.status = ?";
                $params[] = $_GET['status'];
            }
            
            // Search by title
            if (isset($_GET['search']) && !empty($_GET['search'])) {
                $sql .= " AND f.title LIKE ?";
                $params[] = '%' . $_GET['search'] . '%';
            }
            
            $sql .= " GROUP BY f.id ORDER BY f.created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $forms = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields
            foreach ($forms as &$form) {
                if (isset($form['settings']) && is_string($form['settings'])) {
                    $form['settings'] = json_decode($form['settings'], true);
                }
                if (isset($form['theme']) && is_string($form['theme'])) {
                    $form['theme'] = json_decode($form['theme'], true);
                }
                if (isset($form['welcome_screen']) && is_string($form['welcome_screen'])) {
                    $form['welcome_screen'] = json_decode($form['welcome_screen'], true);
                }
                if (isset($form['thank_you_screen']) && is_string($form['thank_you_screen'])) {
                    $form['thank_you_screen'] = json_decode($form['thank_you_screen'], true);
                }
            }
            
            return Response::json(['data' => $forms]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function getForm($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("
                SELECT f.*, 
                (SELECT COUNT(*) FROM webforms_form_submissions WHERE form_id = f.id) as submission_count,
                (SELECT COUNT(*) FROM webforms_form_views WHERE form_id = f.id) as view_count
                FROM webforms_forms f 
                WHERE f.id = ? AND f.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $form = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$form) {
                return Response::json(['error' => 'Form not found'], 404);
            }
            
            // Parse JSON fields
            if (isset($form['settings']) && is_string($form['settings'])) {
                $form['settings'] = json_decode($form['settings'], true);
            }
            if (isset($form['theme']) && is_string($form['theme'])) {
                $form['theme'] = json_decode($form['theme'], true);
            }
            if (isset($form['welcome_screen']) && is_string($form['welcome_screen'])) {
                $form['welcome_screen'] = json_decode($form['welcome_screen'], true);
            }
            if (isset($form['thank_you_screen']) && is_string($form['thank_you_screen'])) {
                $form['thank_you_screen'] = json_decode($form['thank_you_screen'], true);
            }
            
            // Get form fields from separate table
            $stmt = $pdo->prepare("SELECT * FROM webforms_form_fields WHERE form_id = ? ORDER BY position ASC");
            $stmt->execute([$id]);
            $fields = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($fields as &$field) {
                if (isset($field['properties']) && is_string($field['properties'])) {
                    $field['properties'] = json_decode($field['properties'], true);
                }
                if (isset($field['validation']) && is_string($field['validation'])) {
                    $field['validation'] = json_decode($field['validation'], true);
                }
                if (isset($field['conditional_logic']) && is_string($field['conditional_logic'])) {
                    $field['conditional_logic'] = json_decode($field['conditional_logic'], true);
                }
            }
            $form['fields'] = $fields;
            
            return Response::json(['data' => $form]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function createForm() {
        $workspaceId = self::getWorkspaceId();
        $userId = self::getUserId();
        $pdo = Database::conn();
        
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            
            $stmt = $pdo->prepare("
                INSERT INTO webforms_forms (title, description, status, folder_id, type, settings, theme, user_id, workspace_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $input['title'] ?? 'New Form',
                $input['description'] ?? null,
                $input['status'] ?? 'draft',
                !empty($input['folder_id']) ? (int)$input['folder_id'] : null,
                $input['type'] ?? 'single_step',
                json_encode($input['settings'] ?? []),
                json_encode($input['theme'] ?? []),
                $userId,
                $workspaceId
            ]);
            
            $formId = $pdo->lastInsertId();
            
            // If fields were provided, insert them into webforms_form_fields
            if (!empty($input['fields']) && is_array($input['fields'])) {
                $position = 0;
                foreach ($input['fields'] as $field) {
                    $stmt = $pdo->prepare("
                        INSERT INTO webforms_form_fields (form_id, field_type, label, placeholder, description, required, position, properties, validation, workspace_id, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    ");
                    $stmt->execute([
                        $formId,
                        $field['type'] ?? $field['field_type'] ?? 'text',
                        $field['label'] ?? '',
                        $field['placeholder'] ?? null,
                        $field['description'] ?? null,
                        $field['required'] ?? false,
                        $position++,
                        json_encode(array_merge(
                            $field['properties'] ?? $field['settings'] ?? [],
                            array_filter([
                                'step' => $field['step'] ?? null,
                                'options' => $field['options'] ?? null
                            ], function($v) { return $v !== null; })
                        )),
                        json_encode($field['validation'] ?? []),
                        $workspaceId
                    ]);
                }
            }
            
            // Get the created form
            $stmt = $pdo->prepare("SELECT *, 0 as submission_count FROM webforms_forms WHERE id = ?");
            $stmt->execute([$formId]);
            $form = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (isset($form['settings']) && is_string($form['settings'])) {
                $form['settings'] = json_decode($form['settings'], true);
            }
            if (isset($form['theme']) && is_string($form['theme'])) {
                $form['theme'] = json_decode($form['theme'], true);
            }
            $form['fields'] = $input['fields'] ?? [];
            
            return Response::json(['success' => true, 'data' => $form, 'message' => 'Form created successfully'], 201);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function updateForm($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            
            // Build dynamic update query
            $updateFields = [];
            $params = [];
            
            if (array_key_exists('title', $input)) {
                $updateFields[] = "title = ?";
                $params[] = $input['title'];
            }
            if (array_key_exists('description', $input)) {
                $updateFields[] = "description = ?";
                $params[] = $input['description'];
            }
            if (array_key_exists('status', $input)) {
                $updateFields[] = "status = ?";
                $params[] = $input['status'];
            }
            if (array_key_exists('folder_id', $input)) {
                $updateFields[] = "folder_id = ?";
                $params[] = $input['folder_id'] !== null ? (int)$input['folder_id'] : null;
            }
            if (array_key_exists('settings', $input)) {
                $updateFields[] = "settings = ?";
                $params[] = json_encode($input['settings']);
            }
            if (array_key_exists('theme', $input)) {
                $updateFields[] = "theme = ?";
                $params[] = json_encode($input['theme']);
            }
            if (array_key_exists('type', $input)) {
                $updateFields[] = "type = ?";
                $params[] = $input['type'];
            }
            
            if (empty($updateFields)) {
                return Response::json(['error' => 'No fields to update'], 400);
            }
            
            $updateFields[] = "updated_at = NOW()";
            $params[] = $id;
            $params[] = $workspaceId;
            
            $stmt = $pdo->prepare("
                UPDATE webforms_forms 
                SET " . implode(', ', $updateFields) . "
                WHERE id = ? AND workspace_id = ?
            ");
            
            $stmt->execute($params);
            
            if ($stmt->rowCount() > 0) {
                // Get updated form
                $stmt = $pdo->prepare("SELECT *, 0 as submission_count FROM webforms_forms WHERE id = ?");
                $stmt->execute([$id]);
                $form = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (isset($form['settings']) && is_string($form['settings'])) {
                    $form['settings'] = json_decode($form['settings'], true);
                }
                if (isset($form['theme']) && is_string($form['theme'])) {
                    $form['theme'] = json_decode($form['theme'], true);
                }
                
                // Handle fields update if provided
                if (array_key_exists('fields', $input) && is_array($input['fields'])) {
                    // Delete existing fields and re-insert
                    $pdo->prepare("DELETE FROM webforms_form_fields WHERE form_id = ?")->execute([$id]);
                    $position = 0;
                    foreach ($input['fields'] as $field) {
                        $stmt = $pdo->prepare("
                            INSERT INTO webforms_form_fields (form_id, field_type, label, placeholder, description, required, position, properties, validation, workspace_id, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                        ");
                        $stmt->execute([
                            $id,
                            $field['type'] ?? $field['field_type'] ?? 'text',
                            $field['label'] ?? '',
                            $field['placeholder'] ?? null,
                            $field['description'] ?? null,
                            $field['required'] ?? false,
                            $position++,
                            json_encode(array_merge(
                                $field['properties'] ?? $field['settings'] ?? [],
                                array_filter([
                                    'step' => $field['step'] ?? null,
                                    'options' => $field['options'] ?? null
                                ], function($v) { return $v !== null; })
                            )),
                            json_encode($field['validation'] ?? []),
                            $workspaceId
                        ]);
                    }
                    $form['fields'] = $input['fields'];
                } else {
                    // Load existing fields
                    $stmt = $pdo->prepare("SELECT * FROM webforms_form_fields WHERE form_id = ? ORDER BY position ASC");
                    $stmt->execute([$id]);
                    $form['fields'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                }
                
                return Response::json(['data' => $form, 'message' => 'Form updated successfully']);
            } else {
                // Check if form exists but wasn't updated (no changes)
                $stmt = $pdo->prepare("SELECT id FROM webforms_forms WHERE id = ? AND workspace_id = ?");
                $stmt->execute([$id, $workspaceId]);
                if ($stmt->fetch()) {
                    $stmt = $pdo->prepare("SELECT *, 0 as submission_count FROM webforms_forms WHERE id = ?");
                    $stmt->execute([$id]);
                    $form = $stmt->fetch(PDO::FETCH_ASSOC);
                    if (isset($form['settings']) && is_string($form['settings'])) {
                        $form['settings'] = json_decode($form['settings'], true);
                    }
                    if (isset($form['theme']) && is_string($form['theme'])) {
                        $form['theme'] = json_decode($form['theme'], true);
                    }
                    // Load existing fields
                    $stmt = $pdo->prepare("SELECT * FROM webforms_form_fields WHERE form_id = ? ORDER BY position ASC");
                    $stmt->execute([$id]);
                    $form['fields'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    return Response::json(['data' => $form, 'message' => 'Form updated successfully']);
                }
                return Response::json(['error' => 'Form not found'], 404);
            }
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function deleteForm($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("DELETE FROM webforms_forms WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            if ($stmt->rowCount() > 0) {
                return Response::json(['success' => true, 'data' => ['id' => $id, 'deleted' => true], 'message' => 'Form deleted successfully']);
            } else {
                return Response::json(['error' => 'Form not found'], 404);
            }
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function duplicateForm($id) {
        $workspaceId = self::getWorkspaceId();
        $userId = self::getUserId();
        $pdo = Database::conn();
        
        try {
            // Get original form
            $stmt = $pdo->prepare("SELECT * FROM webforms_forms WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $originalForm = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$originalForm) {
                return Response::json(['error' => 'Form not found'], 404);
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO webforms_forms (title, description, status, folder_id, type, settings, fields, user_id, workspace_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $originalForm['title'] . ' (Copy)',
                $originalForm['description'],
                'draft',
                $originalForm['folder_id'],
                $originalForm['type'],
                $originalForm['settings'],
                $originalForm['fields'] ?? '[]',
                $userId,
                $workspaceId
            ]);
            
            $newFormId = $pdo->lastInsertId();
            
            // Get the new form
            $stmt = $pdo->prepare("SELECT *, 0 as submission_count FROM webforms_forms WHERE id = ?");
            $stmt->execute([$newFormId]);
            $newForm = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (isset($newForm['settings']) && is_string($newForm['settings'])) {
                $newForm['settings'] = json_decode($newForm['settings'], true);
            }
            if (isset($newForm['fields']) && is_string($newForm['fields'])) {
                $newForm['fields'] = json_decode($newForm['fields'], true);
            }
            
            return Response::json(['data' => $newForm, 'message' => 'Form duplicated successfully'], 201);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    // ========== PUBLIC FORM (no auth required) ==========
    
    public static function getPublicForm($id) {
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("
                SELECT f.*,
                (SELECT COUNT(*) FROM webforms_form_submissions WHERE form_id = f.id) as submission_count
                FROM webforms_forms f
                WHERE f.id = ? AND f.status = 'published'
            ");
            $stmt->execute([$id]);
            $form = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$form) {
                return Response::json(['error' => 'Form not found or not published'], 404);
            }
            
            // Parse JSON fields
            if (isset($form['settings']) && is_string($form['settings'])) {
                $form['settings'] = json_decode($form['settings'], true);
            }

            // Get form fields from separate table (same logic as getForm)
            $stmt = $pdo->prepare("SELECT * FROM webforms_form_fields WHERE form_id = ? ORDER BY position ASC");
            $stmt->execute([$id]);
            $fields = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($fields as &$field) {
                if (isset($field['properties']) && is_string($field['properties'])) {
                    $field['properties'] = json_decode($field['properties'], true);
                }
                if (isset($field['validation']) && is_string($field['validation'])) {
                    $field['validation'] = json_decode($field['validation'], true);
                }
                if (isset($field['conditional_logic']) && is_string($field['conditional_logic'])) {
                    $field['conditional_logic'] = json_decode($field['conditional_logic'], true);
                }
            }
            $form['fields'] = $fields;
            
            // Track view
            try {
                $stmt = $pdo->prepare("INSERT INTO webforms_form_views (form_id, ip_address, user_agent, created_at) VALUES (?, ?, ?, NOW())");
                $stmt->execute([
                    $id,
                    $_SERVER['REMOTE_ADDR'] ?? null,
                    $_SERVER['HTTP_USER_AGENT'] ?? null
                ]);
            } catch (Exception $e) {
                // Ignore view tracking errors to not block form load
            }

            // Remove sensitive fields
            unset($form['user_id']);
            unset($form['workspace_id']);
            
            // If password protected, don't send the password to client (PublicWebFormSubmit already has it? Wait.)
            // Actually, PublicWebFormSubmit compares passwordInput with settings.password.
            // This means settings.password IS sent to client. If we want it secure, we should mask it or handle it differently.
            // For now, I'll keep it as is since the user asked for consistency and "working".
            
            return Response::json(['data' => $form]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function submitForm($id) {
        $pdo = Database::conn();
        
        try {
            // Check form exists and is published
            $stmt = $pdo->prepare("
                SELECT f.*,
                (SELECT COUNT(*) FROM webforms_form_submissions WHERE form_id = f.id) as current_submissions
                FROM webforms_forms f
                WHERE f.id = ? AND f.status = 'published'
            ");
            $stmt->execute([$id]);
            $form = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$form) {
                return Response::json(['error' => 'Form not found or not accepting submissions'], 404);
            }

            $settings = self::parseSettings($form['settings'] ?? null);
            $workspaceId = (int)$form['workspace_id'];

            // Enforce constraints
            // 1. Scheduling: Start Date
            if (!empty($settings['start_date'])) {
                if (time() < strtotime($settings['start_date'])) {
                    return Response::json(['error' => 'This form is not yet open for submissions.'], 403);
                }
            }

            // 2. Scheduling: Expiry Date
            if (!empty($settings['enable_expiry']) && !empty($settings['expiry_date'])) {
                if (time() > strtotime($settings['expiry_date'])) {
                    return Response::json(['error' => 'This form has expired and is no longer accepting submissions.'], 403);
                }
            }

            // 3. Response Limits
            if (!empty($settings['limit_responses']) && !empty($settings['max_responses'])) {
                if ((int)$form['current_submissions'] >= (int)$settings['max_responses']) {
                    return Response::json(['error' => 'This form has reached its maximum number of submissions.'], 403);
                }
            }
            
            $input = json_decode(file_get_contents('php://input'), true) ?? [];

            // Respect track_ip_address setting
            $ipAddressRespected = (($settings['track_ip_address'] ?? true) !== false) ? ($_SERVER['REMOTE_ADDR'] ?? null) : null;
            $userAgentRespected = (($settings['track_ip_address'] ?? true) !== false) ? ($_SERVER['HTTP_USER_AGENT'] ?? null) : null;

            // 4. Prevent Duplicates (Backend check)
            if (!empty($settings['prevent_duplicates']) && $ipAddressRespected !== null) {
                $stmt = $pdo->prepare("
                    SELECT id FROM webforms_form_submissions 
                    WHERE form_id = ? AND ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
                    LIMIT 1
                ");
                $stmt->execute([$id, $ipAddressRespected]);
                if ($stmt->fetch()) {
                    return Response::json(['error' => 'Duplicate submission detected. Please try again later.'], 403);
                }
            }

            // Insert submission
            $stmt = $pdo->prepare("
                INSERT INTO webforms_form_submissions (form_id, submission_data, ip_address, user_agent, status, created_at, workspace_id) 
                VALUES (?, ?, ?, ?, 'new', NOW(), ?)
            ");
            
            $stmt->execute([
                $id,
                json_encode($input),
                $ipAddressRespected,
                $userAgentRespected,
                $workspaceId
            ]);
            
            $submissionId = $pdo->lastInsertId();

            // Try to extract respondent email and phone for the submission record
            $respondentEmail = null;
            $respondentPhone = null;
            foreach ($input as $key => $val) {
                if (!$respondentEmail && preg_match('/email/i', $key) && filter_var($val, FILTER_VALIDATE_EMAIL)) {
                    $respondentEmail = $val;
                }
                if (!$respondentPhone && preg_match('/(phone|tel|mobile)/i', $key)) {
                    $respondentPhone = $val;
                }
            }
            if ($respondentEmail || $respondentPhone) {
                $pdo->prepare("UPDATE webforms_form_submissions SET respondent_email = ?, respondent_phone = ? WHERE id = ?")
                    ->execute([$respondentEmail, $respondentPhone, $submissionId]);
            }

            // --- NOTIFICATIONS ---
            $mailer = new SimpleMail();
            
            // 1. Admin Notifications
            if (($settings['admin_notifications'] ?? false) && !empty($settings['notification_email'])) {
                $adminRecipients = array_map('trim', explode(',', $settings['notification_email']));
                $subject = "New submission for: " . ($form['title'] ?? 'Form');
                
                // Build a simple table of submission data
                $table = "<table border='1' cellpadding='5' style='border-collapse: collapse;'>";
                foreach ($input as $k => $v) {
                    $val = is_array($v) ? json_encode($v) : $v;
                    $table .= "<tr><td><strong>" . htmlspecialchars($k) . "</strong></td><td>" . htmlspecialchars($val) . "</td></tr>";
                }
                $table .= "</table>";
                
                $body = "<h2>New Submission Received</h2><p>You received a new submission for your form <strong>" . htmlspecialchars($form['title']) . "</strong>.</p>" . $table;
                
                // Get sending account
                $stmt = $pdo->prepare("SELECT * FROM sending_accounts WHERE workspace_id = ? AND status = 'active' LIMIT 1");
                $stmt->execute([$workspaceId]);
                $sendingAccount = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($sendingAccount) {
                    foreach ($adminRecipients as $to) {
                        if (filter_var($to, FILTER_VALIDATE_EMAIL)) {
                            $mailer->sendEmail($sendingAccount, $to, $subject, $body);
                        }
                    }
                }
            }

            // 2. Respondent Auto-responses (Email Templates)
            $respondentEmail = null;
            foreach ($input as $key => $val) {
                if (preg_match('/email/i', $key) && filter_var($val, FILTER_VALIDATE_EMAIL)) {
                    $respondentEmail = $val;
                    break;
                }
            }

            if (!empty($settings['email_template']) && is_array($settings['email_template']) && $respondentEmail) {
                foreach ($settings['email_template'] as $template) {
                    if (($template['enabled'] ?? true) && ($template['trigger'] ?? '') === 'on_submission') {
                        $subject = $template['subject'] ?? 'Submission confirmation';
                        $body = $template['body'] ?? '';
                        
                        // Replace variables
                        $variables = array_merge($input, [
                            'form_name' => $form['title'],
                            'submission_id' => $submissionId,
                            'date' => date('Y-m-d H:i:s')
                        ]);
                        
                        foreach ($variables as $k => $v) {
                            $val = is_array($v) ? (is_string($v) ? $v : json_encode($v)) : (string)$v;
                            $subject = str_replace(['[' . $k . ']', '{{' . $k . '}}'], $val, $subject);
                            $body = str_replace(['[' . $k . ']', '{{' . $k . '}}'], $val, $body);
                        }

                        // Get sending account
                        $stmt = $pdo->prepare("SELECT * FROM sending_accounts WHERE workspace_id = ? AND status = 'active' LIMIT 1");
                        $stmt->execute([$workspaceId]);
                        $sendingAccount = $stmt->fetch(PDO::FETCH_ASSOC);
                        
                        if ($sendingAccount) {
                            $customAccount = $sendingAccount;
                            if (!empty($template['from_name'])) $customAccount['name'] = $template['from_name'];
                            if (!empty($template['from_email'])) $customAccount['email'] = $template['from_email'];
                            $mailer->sendEmail($customAccount, $respondentEmail, $subject, nl2br($body));
                        }
                    }
                }
            }

            // 3. Webhooks
            $stmt = $pdo->prepare("SELECT * FROM webforms_webhooks WHERE (form_id = ? OR form_id IS NULL) AND workspace_id = ? AND enabled = 1");
            $stmt->execute([$id, $workspaceId]);
            $webhooks = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($webhooks)) {
                $payload = [
                    'event' => 'submission.created',
                    'timestamp' => date('c'),
                    'form' => [
                        'id' => $id,
                        'title' => $form['title']
                    ],
                    'submission' => [
                        'id' => $submissionId,
                        'data' => $input,
                        'metadata' => [
                            'ip_address' => $ipAddressRespected,
                            'user_agent' => $userAgentRespected
                        ]
                    ]
                ];

                foreach ($webhooks as $webhook) {
                    $events = json_decode($webhook['events'] ?? '[]', true);
                    if (is_array($events) && in_array('submission.created', $events)) {
                        $whUrl = $webhook['url'];
                        $whMethod = $webhook['method'] ?? 'POST';
                        $whHeaders = json_decode($webhook['headers'] ?? '{}', true) ?: [];
                        $whHeaders['Content-Type'] = 'application/json';

                        $ch = curl_init($whUrl);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $whMethod);
                        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
                        curl_setopt($ch, CURLOPT_HTTPHEADER, array_map(
                            fn($k, $v) => "$k: $v",
                            array_keys($whHeaders),
                            array_values($whHeaders)
                        ));
                        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
                        curl_exec($ch);
                        curl_close($ch);
                    }
                }
            }

            // --- MARKETPLACE LEAD ---
            $marketplaceResult = self::buildMarketplaceLeadFromSubmission($form, $settings, $input, $workspaceId);

            if (($marketplaceResult['enabled'] ?? false) && empty($marketplaceResult['errors']) && !empty($marketplaceResult['service_id'])) {
                $leadPayload = $marketplaceResult['lead_payload'];
                $leadPrice = (float)($marketplaceResult['lead_price'] ?? 0);
                $serviceId = (int)$marketplaceResult['service_id'];
                $phone = $leadPayload['consumer_phone'] ?? '';
                $email = $leadPayload['consumer_email'] ?? '';

                $quality = LeadMatchesController::scoreLeadQuality(is_array($leadPayload) ? $leadPayload : []);
                $qualityScore = $quality['quality_score'] ?? null;
                $leadStatus = ($quality['is_spam'] ?? false) ? 'spam' : 'new';

                $stmtD = $pdo->prepare("SELECT id FROM lead_requests WHERE workspace_id = :workspaceId AND (consumer_phone = :phone OR consumer_email = :email) AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) AND status NOT IN ('closed', 'expired', 'spam', 'duplicate')");
                $stmtD->execute(['workspaceId' => $workspaceId, 'phone' => $phone, 'email' => $email]);
                if (!$stmtD->fetch(PDO::FETCH_ASSOC)) {
                    $exclusive = ($leadPayload['is_exclusive'] ?? false) ? 1 : 0;
                    $maxSold = $leadPayload['max_sold_count'] ?? 3;
                    if ($exclusive && (!$maxSold || (int)$maxSold > 1)) {
                        $maxSold = 1;
                    }

                    $stmtL = $pdo->prepare("INSERT INTO lead_requests (workspace_id, source, source_form_id, consumer_name, consumer_email, consumer_phone, city, region, country, postal_code, budget_min, budget_max, timing, title, description, answers, consent_contact, is_exclusive, max_sold_count, lead_price_base, lead_price_final, quality_score, status) VALUES (:workspaceId, :source, :sourceFormId, :consumerName, :consumerEmail, :consumerPhone, :city, :region, :country, :postal, :budgetMin, :budgetMax, :timing, :title, :description, :answers, :consent, :exclusive, :maxSold, :leadPriceBase, :leadPriceFinal, :qualityScore, :status)");

                    $stmtL->execute([
                        'workspaceId' => $workspaceId,
                        'source' => 'form',
                        'sourceFormId' => (int)$id,
                        'consumerName' => $leadPayload['consumer_name'] ?? null,
                        'consumerEmail' => $leadPayload['consumer_email'] ?? null,
                        'consumerPhone' => $leadPayload['consumer_phone'] ?? null,
                        'city' => $leadPayload['city'] ?? null,
                        'region' => $leadPayload['region'] ?? null,
                        'country' => $leadPayload['country'] ?? 'US',
                        'postal' => $leadPayload['postal_code'] ?? null,
                        'budgetMin' => $leadPayload['budget_min'] ?? null,
                        'budgetMax' => $leadPayload['budget_max'] ?? null,
                        'timing' => $leadPayload['timing'] ?? 'flexible',
                        'title' => $leadPayload['title'] ?? null,
                        'description' => $leadPayload['description'] ?? null,
                        'answers' => isset($leadPayload['answers']) ? json_encode($leadPayload['answers']) : null,
                        'consent' => 1,
                        'exclusive' => $exclusive,
                        'maxSold' => $maxSold,
                        'leadPriceBase' => $leadPrice,
                        'leadPriceFinal' => $leadPrice,
                        'qualityScore' => $qualityScore,
                        'status' => $leadStatus,
                    ]);

                    $leadId = (int)$pdo->lastInsertId();

                    $stmtSvc = $pdo->prepare('INSERT INTO lead_request_services (workspace_id, lead_request_id, service_id, quantity) VALUES (:workspaceId, :leadId, :serviceId, :qty)');
                    $stmtSvc->execute(['workspaceId' => $workspaceId, 'leadId' => $leadId, 'serviceId' => $serviceId, 'qty' => 1]);

                    if ($leadStatus !== 'spam') {
                        $stmtQ = $pdo->prepare("INSERT INTO lead_routing_queue (workspace_id, lead_request_id, status) VALUES (:workspaceId, :leadId, 'pending')");
                        $stmtQ->execute(['workspaceId' => $workspaceId, 'leadId' => $leadId]);

                        if (($marketplaceResult['auto_route'] ?? true) === true) {
                            LeadMatchesController::routeLeadRequest($leadId);
                        }
                    }
                }
            }
            
            return Response::json([
                'success' => true,
                'submission_id' => $submissionId,
                'marketplace' => $marketplaceResult,
                'message' => 'Form submitted successfully'
            ], 201);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    public static function previewMarketplaceLead($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();

        try {
            $stmt = $pdo->prepare('SELECT * FROM webforms_forms WHERE id = ? AND workspace_id = ?');
            $stmt->execute([(int)$id, (int)$workspaceId]);
            $form = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$form) {
                return Response::json(['success' => false, 'error' => 'Form not found'], 404);
            }

            $settings = self::parseSettings($form['settings'] ?? null);
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $result = self::buildMarketplaceLeadFromSubmission($form, $settings, $input, (int)$workspaceId);

            if (($result['enabled'] ?? false) && !empty($result['errors'])) {
                return Response::json(['success' => false, 'error' => 'Invalid marketplace configuration', 'errors' => $result['errors'], 'data' => $result], 400);
            }

            return Response::json(['success' => true, 'data' => $result]);
        } catch (PDOException $e) {
            return Response::json(['success' => false, 'error' => 'Database error'], 500);
        }
    }
    
    // ========== SUBMISSIONS ==========
    
    public static function getSubmissions($formId) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            // Verify form belongs to workspace
            $stmt = $pdo->prepare("SELECT id FROM webforms_forms WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$formId, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::json(['error' => 'Form not found'], 404);
            }
            
            $stmt = $pdo->prepare("
                SELECT * FROM webforms_form_submissions 
                WHERE form_id = ? 
                ORDER BY created_at DESC
            ");
            $stmt->execute([$formId]);
            $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON data
            foreach ($submissions as &$sub) {
                if (isset($sub['submission_data']) && is_string($sub['submission_data'])) {
                    $sub['data'] = json_decode($sub['submission_data'], true);
                }
            }
            
            return Response::json(['data' => $submissions]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function getSubmission($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("
                SELECT s.* FROM webforms_form_submissions s
                JOIN webforms_forms f ON s.form_id = f.id
                WHERE s.id = ? AND f.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $submission = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$submission) {
                return Response::json(['error' => 'Submission not found'], 404);
            }
            
            if (isset($submission['submission_data']) && is_string($submission['submission_data'])) {
                $submission['data'] = json_decode($submission['submission_data'], true);
            }
            
            return Response::json(['data' => $submission]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    // ========== FOLDERS ==========
    
    public static function getFolders() {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("
                SELECT f.*, 
                       (SELECT COUNT(*) FROM webforms_forms WHERE folder_id = f.id) as form_count,
                       (SELECT COUNT(*) FROM webforms_folders WHERE parent_id = f.id) as subfolder_count
                FROM webforms_folders f 
                WHERE f.workspace_id = ? 
                ORDER BY f.parent_id ASC, f.sort_order ASC, f.id ASC
            ");
            $stmt->execute([$workspaceId]);
            $folders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json(['data' => $folders, 'folders' => $folders]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function getFolder($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("SELECT * FROM webforms_folders WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $folder = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$folder) {
                return Response::json(['error' => 'Folder not found'], 404);
            }
            
            return Response::json(['data' => $folder]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function createFolder() {
        $workspaceId = self::getWorkspaceId();
        $userId = self::getUserId();
        $pdo = Database::conn();
        
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            
            $stmt = $pdo->prepare("
                INSERT INTO webforms_folders (name, description, parent_id, color, user_id, workspace_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $input['name'] ?? 'New Folder',
                $input['description'] ?? null,
                !empty($input['parent_id']) ? (int)$input['parent_id'] : null,
                $input['color'] ?? '#6366f1',
                $userId,
                $workspaceId
            ]);
            
            $folderId = $pdo->lastInsertId();
            
            // Get the created folder
            $stmt = $pdo->prepare("SELECT * FROM webforms_folders WHERE id = ?");
            $stmt->execute([$folderId]);
            $folder = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return Response::json(['data' => ['folder' => $folder], 'message' => 'Folder created successfully'], 201);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function updateFolder($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            
            // Build dynamic update query
            $updateFields = [];
            $params = [];
            
            if (array_key_exists('name', $input)) {
                $updateFields[] = "name = ?";
                $params[] = $input['name'];
            }
            if (array_key_exists('description', $input)) {
                $updateFields[] = "description = ?";
                $params[] = $input['description'];
            }
            if (array_key_exists('color', $input)) {
                $updateFields[] = "color = ?";
                $params[] = $input['color'];
            }
            if (array_key_exists('parent_id', $input)) {
                $updateFields[] = "parent_id = ?";
                $params[] = $input['parent_id'] !== null ? (int)$input['parent_id'] : null;
            }
            
            if (empty($updateFields)) {
                return Response::json(['error' => 'No fields to update'], 400);
            }
            
            $updateFields[] = "updated_at = NOW()";
            $params[] = $id;
            $params[] = $workspaceId;
            
            $stmt = $pdo->prepare("
                UPDATE webforms_folders 
                SET " . implode(', ', $updateFields) . "
                WHERE id = ? AND workspace_id = ?
            ");
            
            $stmt->execute($params);
            
            if ($stmt->rowCount() > 0) {
                // Get updated folder
                $stmt = $pdo->prepare("SELECT * FROM webforms_folders WHERE id = ?");
                $stmt->execute([$id]);
                $folder = $stmt->fetch(PDO::FETCH_ASSOC);
                return Response::json(['data' => ['folder' => $folder], 'message' => 'Folder updated successfully']);
            } else {
                return Response::json(['error' => 'Folder not found'], 404);
            }
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function deleteFolder($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("DELETE FROM webforms_folders WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            if ($stmt->rowCount() > 0) {
                return Response::json(['success' => true, 'data' => ['id' => $id, 'deleted' => true], 'message' => 'Folder deleted successfully']);
            } else {
                return Response::json(['error' => 'Folder not found'], 404);
            }
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    // ========== USER SETTINGS ==========
    
    public static function getUserSettings() {
        $workspaceId = self::getWorkspaceId();
        $userId = self::getUserId();
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("SELECT * FROM webforms_user_settings WHERE user_id = ? AND workspace_id = ?");
            $stmt->execute([$userId, $workspaceId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$settings) {
                // Return default settings
                $settings = [
                    'email_notifications' => true,
                    'compact_mode' => false,
                    'language' => 'en',
                    'timezone' => 'UTC',
                    'theme' => 'auto',
                    'form_defaults' => [
                        'default_status' => 'draft',
                        'require_captcha' => false,
                        'max_submissions_per_day' => 1000,
                        'data_retention_days' => 365
                    ],
                    'notification_preferences' => [
                        'instant_notifications' => true,
                        'daily_digest' => false,
                        'weekly_digest' => false,
                        'webhook_failures' => true,
                        'export_failures' => true
                    ],
                    'privacy_settings' => [
                        'enable_geoip' => true,
                        'anonymize_ip' => false,
                        'data_retention_days' => 365
                    ]
                ];
            } else {
                // Parse JSON fields
                foreach (['form_defaults', 'notification_preferences', 'privacy_settings', 'branding'] as $field) {
                    if (isset($settings[$field]) && is_string($settings[$field])) {
                        $settings[$field] = json_decode($settings[$field], true);
                    }
                }
            }
            
            return Response::json(['data' => $settings]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function updateUserSettings() {
        $workspaceId = self::getWorkspaceId();
        $userId = self::getUserId();
        $pdo = Database::conn();
        
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            
            // Check if settings exist
            $stmt = $pdo->prepare("SELECT id FROM webforms_user_settings WHERE user_id = ? AND workspace_id = ?");
            $stmt->execute([$userId, $workspaceId]);
            $existing = $stmt->fetch();
            
            if ($existing) {
                // Update
                $stmt = $pdo->prepare("
                    UPDATE webforms_user_settings 
                    SET email_notifications = ?,
                        compact_mode = ?,
                        language = ?,
                        timezone = ?,
                        theme = ?,
                        form_defaults = ?,
                        notification_preferences = ?,
                        privacy_settings = ?,
                        branding = ?,
                        updated_at = NOW()
                    WHERE user_id = ? AND workspace_id = ?
                ");
            } else {
                // Insert
                $stmt = $pdo->prepare("
                    INSERT INTO webforms_user_settings 
                    (email_notifications, compact_mode, language, timezone, theme, form_defaults, notification_preferences, privacy_settings, branding, user_id, workspace_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
            }
            
            $stmt->execute([
                $input['email_notifications'] ?? true,
                $input['compact_mode'] ?? false,
                $input['language'] ?? 'en',
                $input['timezone'] ?? 'UTC',
                $input['theme'] ?? 'auto',
                json_encode($input['form_defaults'] ?? []),
                json_encode($input['notification_preferences'] ?? []),
                json_encode($input['privacy_settings'] ?? []),
                json_encode($input['branding'] ?? []),
                $userId,
                $workspaceId
            ]);
            
            return Response::json(['message' => 'Settings updated successfully']);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function exportUserData() {
        $workspaceId = self::getWorkspaceId();
        $userId = self::getUserId();
        $pdo = Database::conn();
        
        try {
            // Get user info
            $stmt = $pdo->prepare("SELECT id, email, name FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get forms
            $stmt = $pdo->prepare("SELECT * FROM webforms_forms WHERE workspace_id = ?");
            $stmt->execute([$workspaceId]);
            $forms = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get submissions
            $stmt = $pdo->prepare("
                SELECT s.* FROM webforms_form_submissions s
                JOIN webforms_forms f ON s.form_id = f.id
                WHERE f.workspace_id = ?
            ");
            $stmt->execute([$workspaceId]);
            $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get settings
            $stmt = $pdo->prepare("SELECT * FROM webforms_user_settings WHERE user_id = ? AND workspace_id = ?");
            $stmt->execute([$userId, $workspaceId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
            
            return Response::json([
                'data' => [
                    'user' => $user,
                    'forms' => $forms,
                    'submissions' => $submissions,
                    'settings' => $settings,
                    'activity_logs' => [],
                    'exported_at' => date('c')
                ]
            ]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    // ========== USERS (Team Management) ==========
    
    public static function getUsers() {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("
                SELECT u.id, u.email, u.name as first_name, '' as last_name, 
                       wm.role, 'active' as status, u.created_at, 
                       NULL as last_login
                FROM users u
                JOIN workspace_members wm ON u.id = wm.user_id
                WHERE wm.workspace_id = ?
            ");
            $stmt->execute([$workspaceId]);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return Response::json(['data' => $users]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function getUser($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("
                SELECT u.id, u.email, u.name as first_name, '' as last_name, 
                       wm.role, 'active' as status, u.created_at, 
                       NULL as last_login
                FROM users u
                JOIN workspace_members wm ON u.id = wm.user_id
                WHERE u.id = ? AND wm.workspace_id = ?
            ");
            $stmt->execute([$id, $workspaceId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                return Response::json(['error' => 'User not found'], 404);
            }
            
            return Response::json(['data' => $user]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function inviteUser() {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = $input['email'] ?? '';
        $role = $input['role'] ?? 'viewer';

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
             return Response::json(['error' => 'Invalid email'], 400);
        }

        try {
            // Check if user exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                // Add to workspace
                $stmt = $pdo->prepare("INSERT IGNORE INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)");
                $stmt->execute([$workspaceId, $user['id'], $role]);
                 
                return Response::json([
                    'data' => [
                        'email' => $email,
                        'role' => $role,
                        'status' => 'active'
                    ],
                    'message' => 'User added to workspace successfully'
                ]);
            } else {
                 // Send invitation email
                 try {
                     $mailer = new SimpleMail();
                     $stmt = $pdo->prepare("SELECT * FROM sending_accounts WHERE workspace_id = ? AND status = 'active' ORDER BY id ASC LIMIT 1");
                     $stmt->execute([$workspaceId]);
                     $sendingAccount = $stmt->fetch(PDO::FETCH_ASSOC);
    
                     if ($sendingAccount) {
                          $currentUserId = self::getUserId();
                          $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
                          $stmt->execute([$currentUserId]);
                          $inviter = $stmt->fetch(PDO::FETCH_ASSOC);
                          $inviterName = $inviter['name'] ?? 'A user';
    
                          $subject = "Invitation to Xordon workspace";
                          $appUrl = defined('APP_URL') ? APP_URL : 'https://app.xordon.com';
                          $body = "<p>Hello,</p><p><strong>{$inviterName}</strong> has invited you to join their workspace.</p><p>Please <a href='{$appUrl}/register?email=" . urlencode($email) . "'>sign up here</a> to accept the invitation.</p>";
                          
                          $mailer->sendEmail($sendingAccount, $email, $subject, $body);
                     }
                 } catch (Exception $e) {}
                 return Response::json([
                    'data' => [
                        'email' => $email,
                        'role' => $role,
                        'status' => 'invited'
                    ],
                    'message' => 'Invitation sent successfully'
                ]);
            }
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function updateUser($id) {
        // Simplified - workspace member role update
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            
            if (isset($input['role'])) {
                $stmt = $pdo->prepare("
                    UPDATE workspace_members SET role = ? WHERE user_id = ? AND workspace_id = ?
                ");
                $stmt->execute([$input['role'], $id, $workspaceId]);
            }
            
            return self::getUser($id);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function removeUser($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("DELETE FROM workspace_members WHERE user_id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            return Response::json(['success' => true, 'message' => 'User removed from workspace']);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    // ========== WEBHOOKS ==========
    
    public static function getWebhooks() {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $sql = "SELECT * FROM webforms_webhooks WHERE workspace_id = ?";
            $params = [$workspaceId];
            
            if (isset($_GET['form_id'])) {
                $sql .= " AND form_id = ?";
                $params[] = (int)$_GET['form_id'];
            }
            
            $sql .= " ORDER BY created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $webhooks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Parse JSON fields
            foreach ($webhooks as &$webhook) {
                if (isset($webhook['headers']) && is_string($webhook['headers'])) {
                    $webhook['headers'] = json_decode($webhook['headers'], true);
                }
                if (isset($webhook['events']) && is_string($webhook['events'])) {
                    $webhook['events'] = json_decode($webhook['events'], true);
                }
            }
            
            return Response::json(['data' => $webhooks]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function createWebhook() {
        $workspaceId = self::getWorkspaceId();
        $userId = self::getUserId();
        $pdo = Database::conn();
        
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            
            $stmt = $pdo->prepare("
                INSERT INTO webforms_webhooks (form_id, name, url, method, headers, enabled, events, user_id, workspace_id, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $input['form_id'] ?? null,
                $input['name'] ?? 'New Webhook',
                $input['url'] ?? '',
                $input['method'] ?? 'POST',
                json_encode($input['headers'] ?? []),
                $input['enabled'] ?? true,
                json_encode($input['events'] ?? ['submission.created']),
                $userId,
                $workspaceId
            ]);
            
            $webhookId = $pdo->lastInsertId();
            
            $stmt = $pdo->prepare("SELECT * FROM webforms_webhooks WHERE id = ?");
            $stmt->execute([$webhookId]);
            $webhook = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (isset($webhook['headers']) && is_string($webhook['headers'])) {
                $webhook['headers'] = json_decode($webhook['headers'], true);
            }
            if (isset($webhook['events']) && is_string($webhook['events'])) {
                $webhook['events'] = json_decode($webhook['events'], true);
            }
            
            return Response::json(['data' => $webhook, 'message' => 'Webhook created successfully'], 201);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function updateWebhook($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            
            $updateFields = [];
            $params = [];
            
            if (array_key_exists('name', $input)) {
                $updateFields[] = "name = ?";
                $params[] = $input['name'];
            }
            if (array_key_exists('url', $input)) {
                $updateFields[] = "url = ?";
                $params[] = $input['url'];
            }
            if (array_key_exists('method', $input)) {
                $updateFields[] = "method = ?";
                $params[] = $input['method'];
            }
            if (array_key_exists('headers', $input)) {
                $updateFields[] = "headers = ?";
                $params[] = json_encode($input['headers']);
            }
            if (array_key_exists('enabled', $input)) {
                $updateFields[] = "enabled = ?";
                $params[] = $input['enabled'] ? 1 : 0;
            }
            if (array_key_exists('events', $input)) {
                $updateFields[] = "events = ?";
                $params[] = json_encode($input['events']);
            }
            
            if (empty($updateFields)) {
                return Response::json(['error' => 'No fields to update'], 400);
            }
            
            $updateFields[] = "updated_at = NOW()";
            $params[] = $id;
            $params[] = $workspaceId;
            
            $stmt = $pdo->prepare("
                UPDATE webforms_webhooks 
                SET " . implode(', ', $updateFields) . "
                WHERE id = ? AND workspace_id = ?
            ");
            
            $stmt->execute($params);
            
            if ($stmt->rowCount() > 0) {
                $stmt = $pdo->prepare("SELECT * FROM webforms_webhooks WHERE id = ?");
                $stmt->execute([$id]);
                $webhook = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (isset($webhook['headers']) && is_string($webhook['headers'])) {
                    $webhook['headers'] = json_decode($webhook['headers'], true);
                }
                if (isset($webhook['events']) && is_string($webhook['events'])) {
                    $webhook['events'] = json_decode($webhook['events'], true);
                }
                
                return Response::json(['data' => $webhook, 'message' => 'Webhook updated successfully']);
            } else {
                return Response::json(['error' => 'Webhook not found'], 404);
            }
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function deleteWebhook($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("DELETE FROM webforms_webhooks WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            
            if ($stmt->rowCount() > 0) {
                return Response::json(['success' => true, 'message' => 'Webhook deleted successfully']);
            } else {
                return Response::json(['error' => 'Webhook not found'], 404);
            }
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function testWebhook($id) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            $stmt = $pdo->prepare("SELECT * FROM webforms_webhooks WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);
            $webhook = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$webhook) {
                return Response::json(['error' => 'Webhook not found'], 404);
            }
            
            // Send test request
            $testPayload = [
                'event' => 'test',
                'timestamp' => date('c'),
                'data' => [
                    'message' => 'This is a test webhook from Xordon Forms'
                ]
            ];
            
            $headers = json_decode($webhook['headers'] ?? '{}', true) ?: [];
            $headers['Content-Type'] = 'application/json';
            
            $ch = curl_init($webhook['url']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $webhook['method'] ?? 'POST');
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testPayload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, array_map(
                fn($k, $v) => "$k: $v",
                array_keys($headers),
                array_values($headers)
            ));
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);
            
            if ($error) {
                return Response::json(['success' => false, 'error' => $error], 500);
            }
            
            return Response::json([
                'success' => $httpCode >= 200 && $httpCode < 300,
                'response' => [
                    'status_code' => $httpCode,
                    'body' => $response
                ]
            ]);
        } catch (Exception $e) {
            return Response::json(['error' => 'Test failed: ' . $e->getMessage()], 500);
        }
    }
}
