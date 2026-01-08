<?php
/**
 * Expenses & Commission Controller
 * Employee expenses, reimbursements, and commission tracking
 * 
 * SCOPING: Workspace-scoped with self-only defaults
 * - Members see only their own data
 * - Managers/Admins can view all + approve
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class ExpensesController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    private static function getUserId(): int {
        return Permissions::getUserId();
    }

    /**
     * Filter user_id for HR data access
     * Members can only see their own data; managers+ can see all
     */
    private static function filterUserId(?int $requestedUserId = null): int {
        return Permissions::filterUserIdParam($requestedUserId);
    }

    private static function generateReportNumber(PDO $db, int $workspaceId): string {
        $stmt = $db->prepare("SELECT COUNT(*) + 1 FROM expense_reports WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        $num = $stmt->fetchColumn();
        return 'EXP-' . str_pad($num, 5, '0', STR_PAD_LEFT);
    }

    // ==================== EXPENSE CATEGORIES ====================

    public static function getCategories() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM expense_categories
                WHERE workspace_id = ? AND is_active = 1
                ORDER BY sort_order, name
            ");
            $stmt->execute([$workspaceId]);
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $categories]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch categories: ' . $e->getMessage());
        }
    }

    public static function createCategory() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Only admins+ can manage categories
            Permissions::require('hr.expenses.manage_categories');

            if (empty($data['name'])) {
                return Response::error('name required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO expense_categories 
                (workspace_id, name, description, requires_receipt, max_amount, requires_approval, gl_code, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['description'] ?? null,
                $data['requires_receipt'] ?? 1,
                $data['max_amount'] ?? null,
                $data['requires_approval'] ?? 1,
                $data['gl_code'] ?? null,
                $data['sort_order'] ?? 0
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create category: ' . $e->getMessage());
        }
    }

    // ==================== EXPENSES ====================

    public static function getExpenses() {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $where = ['e.workspace_id = ?'];
            $params = [$workspaceId];

            // Self-only default for non-managers
            if (!empty($_GET['user_id'])) {
                $filteredUserId = self::filterUserId((int)$_GET['user_id']);
                $where[] = 'e.user_id = ?';
                $params[] = $filteredUserId;
            } elseif (!Permissions::isManager()) {
                $where[] = 'e.user_id = ?';
                $params[] = $currentUserId;
            }

            if (!empty($_GET['status'])) {
                $where[] = 'e.status = ?';
                $params[] = $_GET['status'];
            }

            if (!empty($_GET['report_id'])) {
                $where[] = 'e.expense_report_id = ?';
                $params[] = (int)$_GET['report_id'];
            }

            if (!empty($_GET['from'])) {
                $where[] = 'e.expense_date >= ?';
                $params[] = $_GET['from'];
            }

            if (!empty($_GET['to'])) {
                $where[] = 'e.expense_date <= ?';
                $params[] = $_GET['to'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT e.*, u.name as user_name, ec.name as category_name
                FROM expenses e
                LEFT JOIN users u ON u.id = e.user_id
                LEFT JOIN expense_categories ec ON ec.id = e.category_id
                WHERE $whereClause
                ORDER BY e.expense_date DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $countParams = array_slice($params, 0, -2);
            $countStmt = $db->prepare("SELECT COUNT(*) FROM expenses e WHERE $whereClause");
            $countStmt->execute($countParams);
            $total = (int)$countStmt->fetchColumn();

            return Response::json([
                'data' => $expenses,
                'meta' => ['total' => $total, 'limit' => $limit, 'offset' => $offset]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch expenses: ' . $e->getMessage());
        }
    }

    public static function createExpense() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['description']) || empty($data['amount']) || empty($data['expense_date'])) {
                return Response::error('description, amount, and expense_date required', 400);
            }

            // Calculate mileage amount if applicable
            $amount = $data['amount'];
            if (!empty($data['is_mileage']) && !empty($data['miles'])) {
                $mileageRate = $data['mileage_rate'] ?? 0.67; // IRS rate
                $amount = $data['miles'] * $mileageRate;
            }

            $stmt = $db->prepare("
                INSERT INTO expenses 
                (workspace_id, user_id, expense_report_id, category_id, category_name, description, merchant,
                 expense_date, amount, currency, receipt_url, receipt_file_id, job_id, contact_id,
                 is_mileage, miles, mileage_rate, is_billable, billed_to_contact_id, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $userId,
                $data['expense_report_id'] ?? null,
                $data['category_id'] ?? null,
                $data['category_name'] ?? null,
                $data['description'],
                $data['merchant'] ?? null,
                $data['expense_date'],
                $amount,
                $data['currency'] ?? 'USD',
                $data['receipt_url'] ?? null,
                $data['receipt_file_id'] ?? null,
                $data['job_id'] ?? null,
                $data['contact_id'] ?? null,
                $data['is_mileage'] ?? 0,
                $data['miles'] ?? null,
                $data['mileage_rate'] ?? null,
                $data['is_billable'] ?? 0,
                $data['billed_to_contact_id'] ?? null,
                $data['notes'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create expense: ' . $e->getMessage());
        }
    }

    public static function approveExpense($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Only managers+ can approve
            Permissions::require('hr.expenses.approve');

            $action = $data['action'] ?? 'approve';

            if ($action === 'approve') {
                $stmt = $db->prepare("
                    UPDATE expenses SET status = 'approved', approved_by = ?, approved_at = NOW()
                    WHERE id = ? AND workspace_id = ? AND status = 'pending'
                ");
                $stmt->execute([$userId, $id, $workspaceId]);
            } else {
                $stmt = $db->prepare("
                    UPDATE expenses SET status = 'rejected', approved_by = ?, approved_at = NOW(), rejection_reason = ?
                    WHERE id = ? AND workspace_id = ? AND status = 'pending'
                ");
                $stmt->execute([$userId, $data['reason'] ?? null, $id, $workspaceId]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to approve expense: ' . $e->getMessage());
        }
    }

    // ==================== EXPENSE REPORTS ====================

    public static function getExpenseReports() {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            $where = ['er.workspace_id = ?'];
            $params = [$workspaceId];

            // Self-only default for non-managers
            if (!empty($_GET['user_id'])) {
                $filteredUserId = self::filterUserId((int)$_GET['user_id']);
                $where[] = 'er.user_id = ?';
                $params[] = $filteredUserId;
            } elseif (!Permissions::isManager()) {
                $where[] = 'er.user_id = ?';
                $params[] = $currentUserId;
            }

            if (!empty($_GET['status'])) {
                $where[] = 'er.status = ?';
                $params[] = $_GET['status'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT er.*, u.name as user_name,
                    (SELECT COUNT(*) FROM expenses e WHERE e.expense_report_id = er.id) as expense_count
                FROM expense_reports er
                LEFT JOIN users u ON u.id = er.user_id
                WHERE $whereClause
                ORDER BY er.created_at DESC
            ");
            $stmt->execute($params);
            $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $reports]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch expense reports: ' . $e->getMessage());
        }
    }

    public static function getExpenseReport($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            // Build query with self-only restriction for non-managers
            $sql = "
                SELECT er.*, u.name as user_name
                FROM expense_reports er
                LEFT JOIN users u ON u.id = er.user_id
                WHERE er.id = ? AND er.workspace_id = ?
            ";
            $params = [$id, $workspaceId];

            if (!Permissions::isManager()) {
                $sql .= " AND er.user_id = ?";
                $params[] = $currentUserId;
            }

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $report = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$report) {
                return Response::error('Report not found', 404);
            }

            // Get expenses
            $expensesStmt = $db->prepare("
                SELECT e.*, ec.name as category_name
                FROM expenses e
                LEFT JOIN expense_categories ec ON ec.id = e.category_id
                WHERE e.expense_report_id = ?
                ORDER BY e.expense_date
            ");
            $expensesStmt->execute([$id]);
            $report['expenses'] = $expensesStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $report]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch expense report: ' . $e->getMessage());
        }
    }

    public static function createExpenseReport() {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['title'])) {
                return Response::error('title required', 400);
            }

            $reportNumber = self::generateReportNumber($db, $workspaceId);

            $stmt = $db->prepare("
                INSERT INTO expense_reports 
                (workspace_id, user_id, report_number, title, description, period_start, period_end, currency)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $userId,
                $reportNumber,
                $data['title'],
                $data['description'] ?? null,
                $data['period_start'] ?? null,
                $data['period_end'] ?? null,
                $data['currency'] ?? 'USD'
            ]);

            $reportId = $db->lastInsertId();

            // Attach existing expenses if provided
            if (!empty($data['expense_ids'])) {
                $updateStmt = $db->prepare("UPDATE expenses SET expense_report_id = ? WHERE id = ? AND user_id = ?");
                foreach ($data['expense_ids'] as $expenseId) {
                    $updateStmt->execute([$reportId, $expenseId, $userId]);
                }
                self::recalculateReportTotals($db, $reportId);
            }

            return Response::json(['data' => ['id' => (int)$reportId, 'report_number' => $reportNumber]]);
        } catch (Exception $e) {
            return Response::error('Failed to create expense report: ' . $e->getMessage());
        }
    }

    public static function submitExpenseReport($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();

            // Recalculate totals
            self::recalculateReportTotals($db, $id);

            $stmt = $db->prepare("
                UPDATE expense_reports SET status = 'submitted', submitted_at = NOW()
                WHERE id = ? AND workspace_id = ? AND user_id = ? AND status = 'draft'
            ");
            $stmt->execute([$id, $workspaceId, $userId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to submit expense report: ' . $e->getMessage());
        }
    }

    public static function approveExpenseReport($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Only managers+ can approve
            Permissions::require('hr.expenses.approve');

            $action = $data['action'] ?? 'approve';

            if ($action === 'approve') {
                $stmt = $db->prepare("
                    UPDATE expense_reports 
                    SET status = 'approved', approved_by = ?, approved_at = NOW(), approved_amount = total_amount
                    WHERE id = ? AND workspace_id = ? AND status IN ('submitted', 'under_review')
                ");
                $stmt->execute([$userId, $id, $workspaceId]);

                // Approve all expenses in report
                $db->prepare("UPDATE expenses SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE expense_report_id = ?")
                    ->execute([$userId, $id]);
            } else {
                $stmt = $db->prepare("
                    UPDATE expense_reports 
                    SET status = 'rejected', approved_by = ?, approved_at = NOW(), rejection_reason = ?
                    WHERE id = ? AND workspace_id = ? AND status IN ('submitted', 'under_review')
                ");
                $stmt->execute([$userId, $data['reason'] ?? null, $id, $workspaceId]);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to approve expense report: ' . $e->getMessage());
        }
    }

    private static function recalculateReportTotals(PDO $db, int $reportId) {
        $stmt = $db->prepare("
            SELECT SUM(amount) as total FROM expenses WHERE expense_report_id = ?
        ");
        $stmt->execute([$reportId]);
        $total = $stmt->fetchColumn() ?? 0;

        $db->prepare("UPDATE expense_reports SET total_amount = ? WHERE id = ?")
            ->execute([$total, $reportId]);
    }

    // ==================== COMMISSION PLANS ====================

    public static function getCommissionPlans() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("
                SELECT * FROM commission_plans
                WHERE workspace_id = ? AND is_active = 1
                ORDER BY name
            ");
            $stmt->execute([$workspaceId]);
            $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($plans as &$p) {
                $p['tiers'] = $p['tiers'] ? json_decode($p['tiers'], true) : null;
            }

            return Response::json(['data' => $plans]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch commission plans: ' . $e->getMessage());
        }
    }

    public static function createCommissionPlan() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            // Only admins+ can manage commission plans
            Permissions::require('hr.commissions.manage_plans');

            if (empty($data['name'])) {
                return Response::error('name required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO commission_plans 
                (workspace_id, name, description, plan_type, base_rate, tiers, flat_amount,
                 applies_to, calculation_period, minimum_threshold)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['name'],
                $data['description'] ?? null,
                $data['plan_type'] ?? 'percentage',
                $data['base_rate'] ?? null,
                !empty($data['tiers']) ? json_encode($data['tiers']) : null,
                $data['flat_amount'] ?? null,
                $data['applies_to'] ?? 'revenue',
                $data['calculation_period'] ?? 'monthly',
                $data['minimum_threshold'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create commission plan: ' . $e->getMessage());
        }
    }

    // ==================== COMMISSIONS ====================

    public static function getCommissions() {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            $where = ['c.workspace_id = ?'];
            $params = [$workspaceId];

            // Self-only default for non-managers
            if (!empty($_GET['user_id'])) {
                $filteredUserId = self::filterUserId((int)$_GET['user_id']);
                $where[] = 'c.user_id = ?';
                $params[] = $filteredUserId;
            } elseif (!Permissions::isManager()) {
                $where[] = 'c.user_id = ?';
                $params[] = $currentUserId;
            }

            if (!empty($_GET['status'])) {
                $where[] = 'c.status = ?';
                $params[] = $_GET['status'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT c.*, u.name as user_name, cp.name as plan_name
                FROM commissions c
                LEFT JOIN users u ON u.id = c.user_id
                LEFT JOIN commission_plans cp ON cp.id = c.commission_plan_id
                WHERE $whereClause
                ORDER BY c.period_start DESC
            ");
            $stmt->execute($params);
            $commissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $commissions]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch commissions: ' . $e->getMessage());
        }
    }

    public static function createCommission() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['user_id']) || empty($data['base_amount']) || empty($data['commission_amount'])) {
                return Response::error('user_id, base_amount, and commission_amount required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO commissions 
                (workspace_id, user_id, commission_plan_id, period_start, period_end,
                 source_type, source_id, source_description, base_amount, commission_rate, commission_amount, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['user_id'],
                $data['commission_plan_id'] ?? null,
                $data['period_start'] ?? date('Y-m-01'),
                $data['period_end'] ?? date('Y-m-t'),
                $data['source_type'] ?? null,
                $data['source_id'] ?? null,
                $data['source_description'] ?? null,
                $data['base_amount'],
                $data['commission_rate'] ?? null,
                $data['commission_amount'],
                $data['notes'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create commission: ' . $e->getMessage());
        }
    }

    public static function calculateCommissionForPlan() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['plan_id']) || !isset($data['base_amount'])) {
                return Response::error('plan_id and base_amount required', 400);
            }

            $stmt = $db->prepare("SELECT * FROM commission_plans WHERE id = ? AND workspace_id = ?");
            $stmt->execute([(int)$data['plan_id'], $workspaceId]);
            $plan = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$plan) {
                return Response::error('Commission plan not found', 404);
            }

            $baseAmount = (float)$data['base_amount'];
            $commissionAmount = 0;
            $rate = 0;

            if ($plan['plan_type'] === 'percentage') {
                $rate = (float)$plan['base_rate'];
                $commissionAmount = $baseAmount * ($rate / 100);
            } elseif ($plan['plan_type'] === 'flat') {
                $commissionAmount = (float)$plan['flat_amount'];
            } elseif ($plan['plan_type'] === 'tiered') {
                $tiers = json_decode($plan['tiers'], true) ?? [];
                foreach ($tiers as $tier) {
                    if ($baseAmount >= $tier['min'] && ($tier['max'] === null || $baseAmount <= $tier['max'])) {
                        $rate = (float)$tier['rate'];
                        $commissionAmount = $baseAmount * ($rate / 100);
                        break;
                    }
                }
            }

            return Response::json([
                'data' => [
                    'base_amount' => $baseAmount,
                    'commission_amount' => $commissionAmount,
                    'commission_rate' => $rate,
                    'plan_type' => $plan['plan_type']
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to calculate commission: ' . $e->getMessage());
        }
    }

    public static function approveCommission($id) {
        try {
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();

            // Only managers+ can approve
            Permissions::require('hr.commissions.approve');

            $stmt = $db->prepare("
                UPDATE commissions SET status = 'approved', approved_by = ?, approved_at = NOW()
                WHERE id = ? AND workspace_id = ? AND status = 'pending'
            ");
            $stmt->execute([$userId, $id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to approve commission: ' . $e->getMessage());
        }
    }

    // ==================== ANALYTICS ====================

    public static function getAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
            $to = $_GET['to'] ?? date('Y-m-d');

            // Expenses summary
            $expensesSummary = $db->prepare("
                SELECT 
                    COUNT(*) as total_expenses,
                    SUM(amount) as total_amount,
                    SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_amount,
                    SUM(CASE WHEN status = 'reimbursed' THEN amount ELSE 0 END) as reimbursed_amount
                FROM expenses
                WHERE workspace_id = ? AND expense_date BETWEEN ? AND ?
            ");
            $expensesSummary->execute([$workspaceId, $from, $to]);
            $expenses = $expensesSummary->fetch(PDO::FETCH_ASSOC);

            // By category
            $byCategoryStmt = $db->prepare("
                SELECT ec.name, SUM(e.amount) as amount, COUNT(*) as count
                FROM expenses e
                LEFT JOIN expense_categories ec ON ec.id = e.category_id
                WHERE e.workspace_id = ? AND e.expense_date BETWEEN ? AND ?
                GROUP BY e.category_id
                ORDER BY amount DESC
            ");
            $byCategoryStmt->execute([$workspaceId, $from, $to]);
            $byCategory = $byCategoryStmt->fetchAll(PDO::FETCH_ASSOC);

            // Commissions summary
            $commissionsSummary = $db->prepare("
                SELECT 
                    COUNT(*) as total_commissions,
                    SUM(commission_amount) as total_amount,
                    SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as paid_amount
                FROM commissions
                WHERE workspace_id = ? AND period_start BETWEEN ? AND ?
            ");
            $commissionsSummary->execute([$workspaceId, $from, $to]);
            $commissions = $commissionsSummary->fetch(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'expenses' => $expenses,
                    'by_category' => $byCategory,
                    'commissions' => $commissions,
                    'period' => ['from' => $from, 'to' => $to]
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }

    public static function getChartData() {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
            $to = $_GET['to'] ?? date('Y-m-d');
            $groupBy = $_GET['groupBy'] ?? 'day';

            // Determine date format based on grouping
            $dateFormat = match($groupBy) {
                'week' => '%Y-%u',
                'month' => '%Y-%m',
                default => '%Y-%m-%d'
            };

            // Build where clause with self-only restriction for non-managers
            $where = ['workspace_id = ?', 'expense_date BETWEEN ? AND ?'];
            $params = [$workspaceId, $from, $to];

            if (!Permissions::isManager()) {
                $where[] = 'user_id = ?';
                $params[] = $currentUserId;
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT 
                    DATE_FORMAT(expense_date, '$dateFormat') as date,
                    SUM(amount) as amount
                FROM expenses
                WHERE $whereClause
                GROUP BY DATE_FORMAT(expense_date, '$dateFormat')
                ORDER BY expense_date
            ");
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Convert week format back to date if needed
            if ($groupBy === 'week') {
                foreach ($data as &$row) {
                    list($year, $week) = explode('-', $row['date']);
                    $dto = new DateTime();
                    $dto->setISODate($year, $week);
                    $row['date'] = $dto->format('Y-m-d');
                }
            } elseif ($groupBy === 'month') {
                foreach ($data as &$row) {
                    $row['date'] = $row['date'] . '-01';
                }
            }

            return Response::json(['data' => $data]);
        } catch (Exception $e) {
            return Response::error('Failed to get chart data: ' . $e->getMessage());
        }
    }
}
