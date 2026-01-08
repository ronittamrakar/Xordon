<?php

namespace Xordon\Controllers;

use Auth;
use Database;
use Response;
use PDO;

/**
 * Consumer Financing Controller
 * Manages financing applications, plans, and lender integrations
 */
class ConsumerFinancingController {
    
    private static function getWorkspaceId(): int {
        return (int)(get_header('X-Workspace-Id') ?? 1);
    }
    
    // ==========================================
    // FINANCING PLANS
    // ==========================================
    
    /**
     * List available financing plans
     */
    public static function listPlans(): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        $isActive = isset($_GET['active']) ? $_GET['active'] === 'true' : null;
        
        $pdo = Database::conn();
        
        $sql = "SELECT * FROM financing_plans WHERE workspace_id = ?";
        $params = [$workspaceId];
        
        if ($isActive !== null) {
            $sql .= " AND is_active = ?";
            $params[] = $isActive ? 1 : 0;
        }
        
        $sql .= " ORDER BY min_amount ASC, term_months ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json([
            'success' => true,
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }
    
    /**
     * Get single plan
     */
    public static function getPlan(int $id): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("SELECT * FROM financing_plans WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        $plan = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$plan) {
            Response::error('Financing plan not found', 404);
            return;
        }
        
        Response::json(['success' => true, 'data' => $plan]);
    }
    
    /**
     * Create financing plan
     */
    public static function createPlan(): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        $body = get_json_body();
        
        if (empty($body['name'])) {
            Response::error('Plan name is required', 400);
            return;
        }
        
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            INSERT INTO financing_plans (
                workspace_id, name, provider, apr, term_months, min_amount, max_amount,
                is_promotional, promotional_apr, promotional_period_months, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $workspaceId,
            $body['name'],
            $body['provider'] ?? null,
            $body['apr'] ?? 0,
            $body['term_months'] ?? 12,
            $body['min_amount'] ?? 0,
            $body['max_amount'] ?? 100000,
            $body['is_promotional'] ?? false,
            $body['promotional_apr'] ?? null,
            $body['promotional_period_months'] ?? null,
            $body['is_active'] ?? true
        ]);
        
        Response::json([
            'success' => true,
            'message' => 'Financing plan created',
            'data' => ['id' => (int)$pdo->lastInsertId()]
        ], 201);
    }
    
    /**
     * Update financing plan
     */
    public static function updatePlan(int $id): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("SELECT id FROM financing_plans WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        if (!$stmt->fetch()) {
            Response::error('Plan not found', 404);
            return;
        }
        
        $updates = [];
        $params = [];
        
        $fields = [
            'name', 'provider', 'apr', 'term_months', 'min_amount', 'max_amount',
            'is_promotional', 'promotional_apr', 'promotional_period_months', 'is_active'
        ];
        
        foreach ($fields as $field) {
            if (isset($body[$field])) {
                $updates[] = "$field = ?";
                $params[] = $body[$field];
            }
        }
        
        if (empty($updates)) {
            Response::error('No valid fields to update', 400);
            return;
        }
        
        $params[] = $id;
        $sql = "UPDATE financing_plans SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        $pdo->prepare($sql)->execute($params);
        
        Response::json(['success' => true, 'message' => 'Plan updated']);
    }
    
    /**
     * Delete financing plan
     */
    public static function deletePlan(int $id): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        $pdo = Database::conn();
        
        // Check for active applications
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM financing_applications 
            WHERE plan_id = ? AND status IN ('pending', 'approved', 'funded')
        ");
        $stmt->execute([$id]);
        if ((int)$stmt->fetchColumn() > 0) {
            Response::error('Cannot delete plan with active applications', 400);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM financing_plans WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $workspaceId]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Plan not found', 404);
            return;
        }
        
        Response::json(['success' => true, 'message' => 'Plan deleted']);
    }
    
    // ==========================================
    // FINANCING APPLICATIONS
    // ==========================================
    
    /**
     * List financing applications
     */
    public static function listApplications(): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        $status = $_GET['status'] ?? null;
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        
        $pdo = Database::conn();
        
        $where = ['fa.workspace_id = ?'];
        $params = [$workspaceId];
        
        if ($status) {
            $where[] = 'fa.status = ?';
            $params[] = $status;
        }
        
        $whereClause = 'WHERE ' . implode(' AND ', $where);
        
        // Get count
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM financing_applications fa $whereClause");
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        
        // Get applications with plan and contact info
        $sql = "
            SELECT fa.*, fp.name as plan_name, fp.apr, fp.term_months,
                   c.first_name as contact_first_name, c.last_name as contact_last_name,
                   c.email as contact_email
            FROM financing_applications fa
            LEFT JOIN financing_plans fp ON fa.plan_id = fp.id
            LEFT JOIN contacts c ON fa.contact_id = c.id
            $whereClause
            ORDER BY fa.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        Response::json([
            'success' => true,
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'meta' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    /**
     * Get single application with details
     */
    public static function getApplication(int $id): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare("
            SELECT fa.*, fp.name as plan_name, fp.apr, fp.term_months, fp.provider,
                   c.first_name, c.last_name, c.email, c.phone
            FROM financing_applications fa
            LEFT JOIN financing_plans fp ON fa.plan_id = fp.id
            LEFT JOIN contacts c ON fa.contact_id = c.id
            WHERE fa.id = ? AND fa.workspace_id = ?
        ");
        $stmt->execute([$id, $workspaceId]);
        $application = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$application) {
            Response::error('Application not found', 404);
            return;
        }
        
        // Parse JSON fields
        $application['applicant_data'] = json_decode($application['applicant_data'], true);
        $application['lender_response'] = json_decode($application['lender_response'], true);
        
        Response::json(['success' => true, 'data' => $application]);
    }
    
    /**
     * Create financing application
     */
    public static function createApplication(): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        $body = get_json_body();
        
        if (empty($body['plan_id']) || empty($body['amount_requested'])) {
            Response::error('Plan and amount are required', 400);
            return;
        }
        
        $pdo = Database::conn();
        
        // Validate plan exists and amount is in range
        $stmt = $pdo->prepare("SELECT * FROM financing_plans WHERE id = ? AND workspace_id = ? AND is_active = TRUE");
        $stmt->execute([$body['plan_id'], $workspaceId]);
        $plan = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$plan) {
            Response::error('Financing plan not found or inactive', 400);
            return;
        }
        
        $amount = (float)$body['amount_requested'];
        if ($amount < (float)$plan['min_amount'] || $amount > (float)$plan['max_amount']) {
            Response::error("Amount must be between {$plan['min_amount']} and {$plan['max_amount']}", 400);
            return;
        }
        
        // Generate reference number
        $reference = 'FIN-' . strtoupper(substr(md5(uniqid()), 0, 8));
        
        $stmt = $pdo->prepare("
            INSERT INTO financing_applications (
                workspace_id, contact_id, plan_id, reference_number, amount_requested,
                status, applicant_data, created_at
            ) VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())
        ");
        
        $stmt->execute([
            $workspaceId,
            $body['contact_id'] ?? null,
            $body['plan_id'],
            $reference,
            $amount,
            json_encode($body['applicant_data'] ?? [])
        ]);
        
        Response::json([
            'success' => true,
            'message' => 'Application submitted',
            'data' => [
                'id' => (int)$pdo->lastInsertId(),
                'reference_number' => $reference
            ]
        ], 201);
    }
    
    /**
     * Update application status
     */
    public static function updateApplicationStatus(int $id): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        $body = get_json_body();
        
        if (empty($body['status'])) {
            Response::error('Status is required', 400);
            return;
        }
        
        $validStatuses = ['pending', 'under_review', 'approved', 'declined', 'funded', 'cancelled'];
        if (!in_array($body['status'], $validStatuses)) {
            Response::error('Invalid status', 400);
            return;
        }
        
        $pdo = Database::conn();
        
        $updates = ["status = ?"];
        $params = [$body['status']];
        
        // Set timestamps based on status
        if ($body['status'] === 'approved') {
            $updates[] = "approved_at = NOW()";
            if (isset($body['approved_amount'])) {
                $updates[] = "approved_amount = ?";
                $params[] = $body['approved_amount'];
            }
        } elseif ($body['status'] === 'funded') {
            $updates[] = "funded_at = NOW()";
        }
        
        if (isset($body['lender_response'])) {
            $updates[] = "lender_response = ?";
            $params[] = json_encode($body['lender_response']);
        }
        
        if (isset($body['notes'])) {
            $updates[] = "notes = ?";
            $params[] = $body['notes'];
        }
        
        $params[] = $id;
        $params[] = $workspaceId;
        
        $sql = "UPDATE financing_applications SET " . implode(', ', $updates) . ", updated_at = NOW() 
                WHERE id = ? AND workspace_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Application not found', 404);
            return;
        }
        
        Response::json(['success' => true, 'message' => 'Application status updated']);
    }
    
    // ==========================================
    // STATS & REPORTING
    // ==========================================
    
    /**
     * Get financing statistics
     */
    public static function getStats(): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = self::getWorkspaceId();
        
        $pdo = Database::conn();
        
        // Application stats
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total_applications,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'funded' THEN 1 ELSE 0 END) as funded,
                SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) as declined,
                COALESCE(SUM(approved_amount), 0) as total_approved_amount,
                COALESCE(AVG(approved_amount), 0) as avg_approved_amount
            FROM financing_applications
            WHERE workspace_id = ?
        ");
        $stmt->execute([$workspaceId]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Plan usage
        $stmt = $pdo->prepare("
            SELECT fp.name, fp.apr, COUNT(fa.id) as application_count,
                   COALESCE(SUM(fa.approved_amount), 0) as total_funded
            FROM financing_plans fp
            LEFT JOIN financing_applications fa ON fa.plan_id = fp.id AND fa.status = 'funded'
            WHERE fp.workspace_id = ?
            GROUP BY fp.id
            ORDER BY application_count DESC
        ");
        $stmt->execute([$workspaceId]);
        $planStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json([
            'success' => true,
            'data' => [
                'summary' => $stats,
                'by_plan' => $planStats
            ]
        ]);
    }
}
