<?php
/**
 * ProviderDocumentsController
 * 
 * Handles provider document uploads, verification workflow, and admin approval.
 * Supports license documents, insurance certificates, portfolio photos, certifications.
 */

namespace App\Controllers;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Auth.php';

use \Xordon\Database;
use Auth;

class ProviderDocumentsController
{
    private const ALLOWED_DOCUMENT_TYPES = ['license', 'insurance', 'certification', 'portfolio', 'background_check', 'identity', 'other'];
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private static function getWorkspaceIdOrFail(): int
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $workspaceId = $ctx->workspaceId ?? null;
        
        if ($workspaceId) return (int)$workspaceId;
        
        $appEnv = \Config::get('APP_ENV', 'development');
        if ($appEnv !== 'production') return 1;
        
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Workspace required']);
        exit;
    }

    private static function getCompanyIdOrFail(): int
    {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $companyId = $ctx->activeCompanyId ?? null;
        
        if ($companyId) return (int)$companyId;
        
        $appEnv = \Config::get('APP_ENV', 'development');
        if ($appEnv !== 'production') {
            $workspaceId = self::getWorkspaceIdOrFail();
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT id FROM companies WHERE workspace_id = ? LIMIT 1');
            $stmt->execute([$workspaceId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            return $row ? (int)$row['id'] : 1;
        }
        
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Company required']);
        exit;
    }

    // ==================== PROVIDER DOCUMENT MANAGEMENT ====================

    /**
     * GET /lead-marketplace/documents
     * Provider lists their documents
     */
    public static function getMyDocuments(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $companyId = self::getCompanyIdOrFail();
        $pdo = Database::conn();

        $type = $_GET['type'] ?? null;
        $status = $_GET['status'] ?? null;

        $sql = '
            SELECT d.*,
                   u.email as uploaded_by_email,
                   ru.email as reviewed_by_email
            FROM provider_documents d
            LEFT JOIN users u ON d.uploaded_by = u.id
            LEFT JOIN users ru ON d.reviewed_by = ru.id
            WHERE d.company_id = ? AND d.workspace_id = ?
        ';
        $params = [$companyId, $workspaceId];

        if ($type) {
            $sql .= ' AND d.document_type = ?';
            $params[] = $type;
        }

        if ($status) {
            $sql .= ' AND d.status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY d.created_at DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $documents = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Get verification status summary
        $stmt = $pdo->prepare('
            SELECT document_type, status, COUNT(*) as count
            FROM provider_documents
            WHERE company_id = ? AND workspace_id = ?
            GROUP BY document_type, status
        ');
        $stmt->execute([$companyId, $workspaceId]);
        $summary = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $documents,
            'summary' => $summary
        ]);
    }

    /**
     * POST /lead-marketplace/documents
     * Provider uploads a document
     */
    public static function uploadDocument(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $companyId = self::getCompanyIdOrFail();
        $userId = Auth::userId() ?? 0;
        $pdo = Database::conn();

        // Handle multipart/form-data
        $documentType = $_POST['document_type'] ?? 'other';
        $name = trim($_POST['name'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $expiresAt = $_POST['expires_at'] ?? null;

        // Validate document type
        if (!in_array($documentType, self::ALLOWED_DOCUMENT_TYPES)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Invalid document type']);
            return;
        }

        // Check for file upload
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(422);
            $errorMsg = 'No file uploaded';
            if (isset($_FILES['file'])) {
                $errorMsg = match($_FILES['file']['error']) {
                    UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'File too large',
                    UPLOAD_ERR_PARTIAL => 'File upload incomplete',
                    UPLOAD_ERR_NO_FILE => 'No file selected',
                    default => 'Upload error'
                };
            }
            echo json_encode(['success' => false, 'error' => $errorMsg]);
            return;
        }

        $file = $_FILES['file'];

        // Validate file size
        if ($file['size'] > self::MAX_FILE_SIZE) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'File exceeds maximum size of 10MB']);
            return;
        }

        // Validate MIME type
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Invalid file type. Allowed: JPG, PNG, GIF, WebP, PDF, DOC, DOCX']);
            return;
        }

        // Generate storage path
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'bin';
        $filename = sprintf('%d_%d_%s_%s.%s',
            $workspaceId,
            $companyId,
            $documentType,
            bin2hex(random_bytes(8)),
            $extension
        );
        
        $uploadDir = __DIR__ . '/../../storage/provider-documents/' . $workspaceId;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filePath = $uploadDir . '/' . $filename;
        $relativeUrl = '/storage/provider-documents/' . $workspaceId . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save file']);
            return;
        }

        // Store in database
        $stmt = $pdo->prepare('
            INSERT INTO provider_documents (
                workspace_id, company_id, document_type, name, description,
                file_url, file_name, file_size, mime_type,
                status, expires_at, uploaded_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $workspaceId,
            $companyId,
            $documentType,
            $name ?: $file['name'],
            $description,
            $relativeUrl,
            $file['name'],
            $file['size'],
            $mimeType,
            'pending', // Requires admin review
            $expiresAt,
            $userId
        ]);

        $documentId = (int)$pdo->lastInsertId();

        // Update provider status to indicate pending verification
        self::updateProviderVerificationStatus($pdo, $companyId, $workspaceId);

        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $documentId,
                'document_type' => $documentType,
                'file_url' => $relativeUrl,
                'status' => 'pending'
            ],
            'message' => 'Document uploaded and pending review'
        ], 201);
    }

    /**
     * DELETE /lead-marketplace/documents/{id}
     * Provider deletes their own pending/rejected document
     */
    public static function deleteDocument(int $id): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $companyId = self::getCompanyIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('SELECT * FROM provider_documents WHERE id = ? AND company_id = ? AND workspace_id = ?');
        $stmt->execute([$id, $companyId, $workspaceId]);
        $doc = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$doc) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Document not found']);
            return;
        }

        // Only allow deletion of pending/rejected docs
        if ($doc['status'] === 'approved') {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Cannot delete approved documents']);
            return;
        }

        // Delete file from storage
        $filePath = __DIR__ . '/../../' . ltrim($doc['file_url'], '/');
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        $stmt = $pdo->prepare('DELETE FROM provider_documents WHERE id = ?');
        $stmt->execute([$id]);

        echo json_encode(['success' => true, 'message' => 'Document deleted']);
    }

    // ==================== ADMIN VERIFICATION WORKFLOW ====================

    /**
     * GET /lead-marketplace/admin/documents
     * Admin views all documents with filters
     */
    public static function adminGetDocuments(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();

        $status = $_GET['status'] ?? 'pending';
        $type = $_GET['type'] ?? null;
        $companyId = $_GET['company_id'] ?? null;
        $limit = min((int)($_GET['limit'] ?? 50), 200);
        $offset = max((int)($_GET['offset'] ?? 0), 0);

        $sql = '
            SELECT d.*,
                   sp.business_name as provider_name,
                   sp.contact_email as provider_email,
                   u.email as uploaded_by_email
            FROM provider_documents d
            LEFT JOIN service_pros sp ON d.company_id = sp.company_id AND sp.workspace_id = d.workspace_id
            LEFT JOIN users u ON d.uploaded_by = u.id
            WHERE d.workspace_id = ?
        ';
        $params = [$workspaceId];

        if ($status && $status !== 'all') {
            $sql .= ' AND d.status = ?';
            $params[] = $status;
        }

        if ($type) {
            $sql .= ' AND d.document_type = ?';
            $params[] = $type;
        }

        if ($companyId) {
            $sql .= ' AND d.company_id = ?';
            $params[] = $companyId;
        }

        $sql .= ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $documents = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Get counts per status
        $stmt = $pdo->prepare('
            SELECT status, COUNT(*) as count
            FROM provider_documents
            WHERE workspace_id = ?
            GROUP BY status
        ');
        $stmt->execute([$workspaceId]);
        $counts = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $counts[$row['status']] = (int)$row['count'];
        }

        echo json_encode([
            'success' => true,
            'data' => $documents,
            'counts' => $counts
        ]);
    }

    /**
     * PUT /lead-marketplace/admin/documents/{id}
     * Admin approves/rejects a document
     */
    public static function adminUpdateDocument(int $id): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $userId = Auth::userId() ?? 0;
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $status = $body['status'] ?? null;
        $reviewNotes = trim($body['review_notes'] ?? '');

        if (!$status || !in_array($status, ['approved', 'rejected', 'expired'])) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Invalid status']);
            return;
        }

        $stmt = $pdo->prepare('SELECT * FROM provider_documents WHERE id = ? AND workspace_id = ?');
        $stmt->execute([$id, $workspaceId]);
        $doc = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$doc) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Document not found']);
            return;
        }

        $stmt = $pdo->prepare('
            UPDATE provider_documents SET
                status = ?,
                review_notes = ?,
                reviewed_by = ?,
                reviewed_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
        ');
        $stmt->execute([$status, $reviewNotes, $userId, $id]);

        // Update provider verification flags based on approved documents
        self::updateProviderVerificationStatus($pdo, $doc['company_id'], $workspaceId);

        echo json_encode(['success' => true, 'message' => 'Document ' . $status]);
    }

    /**
     * GET /lead-marketplace/admin/providers/pending
     * Admin views providers pending approval
     */
    public static function adminGetPendingProviders(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('
            SELECT sp.*,
                   (SELECT COUNT(*) FROM provider_documents d WHERE d.company_id = sp.company_id AND d.workspace_id = sp.workspace_id AND d.status = ?) as pending_docs,
                   (SELECT COUNT(*) FROM provider_documents d WHERE d.company_id = sp.company_id AND d.workspace_id = sp.workspace_id AND d.status = ?) as approved_docs,
                   (SELECT GROUP_CONCAT(d.document_type) FROM provider_documents d WHERE d.company_id = sp.company_id AND d.workspace_id = sp.workspace_id AND d.status = ?) as approved_doc_types
            FROM service_pros sp
            WHERE sp.workspace_id = ? AND sp.status = ?
            ORDER BY sp.created_at ASC
        ');
        $stmt->execute(['pending', 'approved', 'approved', $workspaceId, 'pending']);
        $providers = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $providers]);
    }

    /**
     * PUT /lead-marketplace/admin/providers/{id}/approve
     * Admin approves a provider (sets status to active)
     */
    public static function adminApproveProvider(int $proId): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $pdo = Database::conn();
        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $stmt = $pdo->prepare('SELECT * FROM service_pros WHERE id = ? AND workspace_id = ?');
        $stmt->execute([$proId, $workspaceId]);
        $pro = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$pro) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Provider not found']);
            return;
        }

        $status = $body['status'] ?? 'active';
        $notes = trim($body['notes'] ?? '');

        if (!in_array($status, ['active', 'suspended', 'rejected'])) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Invalid status']);
            return;
        }

        $stmt = $pdo->prepare('
            UPDATE service_pros SET
                status = ?,
                verified_at = CASE WHEN ? = ? THEN NOW() ELSE verified_at END,
                updated_at = NOW()
            WHERE id = ?
        ');
        $stmt->execute([$status, $status, 'active', $proId]);

        // Log the approval
        $stmt = $pdo->prepare('
            INSERT INTO lead_activity_log (workspace_id, lead_request_id, company_id, activity_type, description, meta, created_by, created_at)
            VALUES (?, 0, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $workspaceId,
            $pro['company_id'],
            'provider_' . $status,
            'Provider status changed to ' . $status . ($notes ? ': ' . $notes : ''),
            json_encode(['pro_id' => $proId, 'notes' => $notes]),
            Auth::userId() ?? 0
        ]);

        echo json_encode(['success' => true, 'message' => 'Provider ' . $status]);
    }

    // ==================== VERIFICATION STATUS HELPERS ====================

    /**
     * Update provider's verification flags based on approved documents
     */
    private static function updateProviderVerificationStatus(\PDO $pdo, int $companyId, int $workspaceId): void
    {
        // Check for approved license
        $stmt = $pdo->prepare('
            SELECT document_type FROM provider_documents
            WHERE company_id = ? AND workspace_id = ? AND status = ?
        ');
        $stmt->execute([$companyId, $workspaceId, 'approved']);
        $approvedTypes = $stmt->fetchAll(\PDO::FETCH_COLUMN);

        $licenseVerified = in_array('license', $approvedTypes) ? 1 : 0;
        $insuranceVerified = in_array('insurance', $approvedTypes) ? 1 : 0;
        $backgroundChecked = in_array('background_check', $approvedTypes) ? 1 : 0;

        $stmt = $pdo->prepare('
            UPDATE service_pros SET
                insurance_verified = ?,
                background_checked = ?,
                updated_at = NOW()
            WHERE company_id = ? AND workspace_id = ?
        ');
        $stmt->execute([$insuranceVerified, $backgroundChecked, $companyId, $workspaceId]);

        // Update license_number verification status (could add a license_verified column)
    }

    /**
     * GET /lead-marketplace/verification-status
     * Provider checks their verification progress
     */
    public static function getVerificationStatus(): void
    {
        $workspaceId = self::getWorkspaceIdOrFail();
        $companyId = self::getCompanyIdOrFail();
        $pdo = Database::conn();

        // Get provider info
        $stmt = $pdo->prepare('
            SELECT status, insurance_verified, background_checked, license_number, verified_at
            FROM service_pros
            WHERE company_id = ? AND workspace_id = ?
        ');
        $stmt->execute([$companyId, $workspaceId]);
        $pro = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$pro) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Provider not found']);
            return;
        }

        // Get document status by type
        $stmt = $pdo->prepare('
            SELECT document_type, status, COUNT(*) as count
            FROM provider_documents
            WHERE company_id = ? AND workspace_id = ?
            GROUP BY document_type, status
        ');
        $stmt->execute([$companyId, $workspaceId]);
        $docStatus = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $type = $row['document_type'];
            if (!isset($docStatus[$type])) {
                $docStatus[$type] = ['pending' => 0, 'approved' => 0, 'rejected' => 0];
            }
            $docStatus[$type][$row['status']] = (int)$row['count'];
        }

        // Calculate verification progress
        $requiredDocs = ['license', 'insurance'];
        $completedDocs = 0;
        foreach ($requiredDocs as $doc) {
            if (isset($docStatus[$doc]) && $docStatus[$doc]['approved'] > 0) {
                $completedDocs++;
            }
        }

        $verificationProgress = count($requiredDocs) > 0
            ? round(($completedDocs / count($requiredDocs)) * 100)
            : 0;

        echo json_encode([
            'success' => true,
            'data' => [
                'provider_status' => $pro['status'],
                'verified_at' => $pro['verified_at'],
                'insurance_verified' => (bool)$pro['insurance_verified'],
                'background_checked' => (bool)$pro['background_checked'],
                'has_license' => !empty($pro['license_number']),
                'documents' => $docStatus,
                'verification_progress' => $verificationProgress,
                'required_documents' => $requiredDocs,
                'missing_documents' => array_filter($requiredDocs, fn($d) => 
                    !isset($docStatus[$d]) || $docStatus[$d]['approved'] === 0
                )
            ]
        ]);
    }
}
