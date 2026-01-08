<?php
/**
 * Payroll Controller
 * Comprehensive payroll processing, pay periods, and employee compensation
 * 
 * SCOPING: Workspace-scoped with manager-only access for most operations
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../Permissions.php';

class PayrollController {
    private static function getWorkspaceId(): int {
        return Permissions::getWorkspaceId();
    }

    private static function getUserId(): int {
        return Permissions::getUserId();
    }

    // ==================== PAY PERIODS ====================

    private static function calculateTax($amount, $type, $workspaceId, $flatRate) {
        try {
            $db = Database::conn();
            $stmt = $db->prepare("
                SELECT * FROM payroll_tax_brackets 
                WHERE workspace_id = ? AND tax_type = ? 
                ORDER BY min_income ASC
            ");
            $stmt->execute([$workspaceId, $type]);
            $brackets = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($brackets)) {
                return $amount * $flatRate;
            }

            $tax = 0;
            foreach ($brackets as $bracket) {
                $min = (float)$bracket['min_income'];
                $max = $bracket['max_income'] !== null ? (float)$bracket['max_income'] : PHP_FLOAT_MAX;
                $rate = (float)$bracket['rate'];

                if ($amount > $min) {
                    $taxableInBracket = min($amount, $max) - $min;
                    $tax += $taxableInBracket * $rate;
                }
            }

            return $tax;
        } catch (Exception $e) {
            return $amount * $flatRate;
        }
    }

    public static function getPayPeriods() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = (int)($_GET['offset'] ?? 0);

            $where = ['workspace_id = ?'];
            $params = [$workspaceId];

            if (!empty($_GET['status'])) {
                $where[] = 'status = ?';
                $params[] = $_GET['status'];
            }

            if (!empty($_GET['year'])) {
                $where[] = 'YEAR(period_start) = ?';
                $params[] = $_GET['year'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT pp.*, 
                    u1.name as processed_by_name,
                    u2.name as approved_by_name,
                    (SELECT COUNT(*) FROM payroll_records WHERE pay_period_id = pp.id) as employee_count
                FROM pay_periods pp
                LEFT JOIN users u1 ON u1.id = pp.processed_by
                LEFT JOIN users u2 ON u2.id = pp.approved_by
                WHERE $whereClause
                ORDER BY pp.period_start DESC
                LIMIT ? OFFSET ?
            ");
            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);
            $periods = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $countParams = array_slice($params, 0, -2);
            $countStmt = $db->prepare("SELECT COUNT(*) FROM pay_periods WHERE $whereClause");
            $countStmt->execute($countParams);
            $total = (int)$countStmt->fetchColumn();

            return Response::json([
                'data' => $periods,
                'meta' => ['total' => $total, 'limit' => $limit, 'offset' => $offset]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch pay periods: ' . $e->getMessage());
        }
    }

    public static function createPayPeriod() {
        try {
            Permissions::require('hr.payroll.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['period_start']) || empty($data['period_end']) || empty($data['pay_date'])) {
                return Response::error('period_start, period_end, and pay_date required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO pay_periods 
                (workspace_id, period_type, period_start, period_end, pay_date, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['period_type'] ?? 'bi-weekly',
                $data['period_start'],
                $data['period_end'],
                $data['pay_date'],
                $data['notes'] ?? null
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create pay period: ' . $e->getMessage());
        }
    }

    public static function processPayPeriod($id) {
        try {
            Permissions::require('hr.payroll.manage');
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();

            // Get pay period
            $periodStmt = $db->prepare("SELECT * FROM pay_periods WHERE id = ? AND workspace_id = ?");
            $periodStmt->execute([$id, $workspaceId]);
            $period = $periodStmt->fetch(PDO::FETCH_ASSOC);

            if (!$period) {
                return Response::error('Pay period not found', 404);
            }

            // Get HR settings for payroll
            $settingsStmt = $db->prepare("SELECT settings_value FROM module_settings WHERE workspace_id = ? AND module_key = 'hr.payroll'");
            $settingsStmt->execute([$workspaceId]);
            $settingsJson = $settingsStmt->fetchColumn();
            $settings = $settingsJson ? json_decode($settingsJson, true) : [];

            $fedRate = (float)($settings['federal_tax_rate'] ?? 0.12);
            $stateRate = (float)($settings['state_tax_rate'] ?? 0.05);
            $ssRate = (float)($settings['social_security_rate'] ?? 0.062);
            $medRate = (float)($settings['medicare_rate'] ?? 0.0145);
            $empSSRate = (float)($settings['employer_social_security_rate'] ?? 0.062);
            $empMedRate = (float)($settings['employer_medicare_rate'] ?? 0.0145);
            $empUnempRate = (float)($settings['employer_unemployment_rate'] ?? 0.006);

            // Get all active employees with compensation
            $employeesStmt = $db->prepare("
                SELECT DISTINCT u.id, u.name, ec.*
                FROM users u
                INNER JOIN employee_compensation ec ON ec.user_id = u.id
                WHERE ec.workspace_id = ? AND ec.is_active = 1
                    AND ec.effective_date <= ?
                    AND (ec.end_date IS NULL OR ec.end_date >= ?)
            ");
            $employeesStmt->execute([$workspaceId, $period['period_end'], $period['period_start']]);
            $employees = $employeesStmt->fetchAll(PDO::FETCH_ASSOC);

            $totalGrossPay = 0;
            $totalDeductions = 0;
            $totalNetPay = 0;
            $totalEmployerTaxes = 0;

            foreach ($employees as $employee) {
                // Get time entries for this period
                $timeStmt = $db->prepare("
                    SELECT SUM(duration_minutes) as total_minutes
                    FROM time_entries
                    WHERE workspace_id = ? AND user_id = ? 
                        AND start_time BETWEEN ? AND ?
                        AND status IN ('completed', 'approved')
                ");
                $timeStmt->execute([$workspaceId, $employee['user_id'], $period['period_start'], $period['period_end'] . ' 23:59:59']);
                $totalMinutes = (int)$timeStmt->fetchColumn();

                $totalHours = round($totalMinutes / 60, 2);
                
                // Calculate thresholds based on frequency
                $weeklyThreshold = (float)($settings['overtime_threshold_hours'] ?? 40);
                $periodLimit = $weeklyThreshold; // Default for weekly

                $periodType = $period['period_type'] ?? 'bi-weekly';
                switch ($periodType) {
                    case 'weekly': $periodLimit = $weeklyThreshold; break;
                    case 'bi-weekly': $periodLimit = $weeklyThreshold * 2; break;
                    case 'semi-monthly': $periodLimit = $weeklyThreshold * 2.16; break; // Approx
                    case 'monthly': $periodLimit = $weeklyThreshold * 4.33; break; // Approx
                }

                if ($totalHours > $periodLimit) {
                    $regularHours = $periodLimit;
                    $overtimeHours = $totalHours - $periodLimit;
                } else {
                    $regularHours = $totalHours;
                    $overtimeHours = 0;
                }

                // Calculate pay
                // Calculate pay
                $regularRate = $employee['hourly_rate'] ?? 0;
                $overtimeRate = $regularRate * ($employee['overtime_rate_multiplier'] ?? 1.5);

                $regularPay = 0;
                $overtimePay = 0;
                $grossPay = 0;

                if (($employee['pay_type'] ?? 'hourly') === 'salary') {
                    $salaryAmount = $employee['salary_amount'] ?? 0;
                    $periodType = $period['period_type'] ?? 'bi-weekly';
                    $divisor = 26; // Default
                    
                    switch ($periodType) {
                        case 'weekly': $divisor = 52; break;
                        case 'bi-weekly': $divisor = 26; break;
                        case 'semi-monthly': $divisor = 24; break;
                        case 'monthly': $divisor = 12; break;
                    }

                    $grossPay = $divisor > 0 ? ($salaryAmount / $divisor) : 0;
                    $regularPay = $grossPay; // Attribute all to regular pay
                } else {
                    // Hourly
                    $regularPay = $regularHours * $regularRate;
                    $overtimePay = $overtimeHours * $overtimeRate;
                    $grossPay = $regularPay + $overtimePay;
                }

                // Calculate deductions using settings or brackets
                $federalTax = self::calculateTax($grossPay, 'federal', $workspaceId, $fedRate);
                $stateTax = self::calculateTax($grossPay, 'state', $workspaceId, $stateRate);
                $socialSecurity = $grossPay * $ssRate;
                $medicare = $grossPay * $medRate;
                $healthInsurance = $employee['health_insurance_deduction'] ?? 0;
                $retirement401k = $grossPay * (($employee['retirement_401k_percent'] ?? 0) / 100);

                $totalDeduction = $federalTax + $stateTax + $socialSecurity + $medicare + $healthInsurance + $retirement401k;
                $netPay = $grossPay - $totalDeduction;

                // Employer taxes using settings
                $employerSS = $grossPay * $empSSRate;
                $employerMedicare = $grossPay * $empMedRate;
                $employerUnemployment = $grossPay * $empUnempRate;
                $employerTaxes = $employerSS + $employerMedicare + $employerUnemployment;

                // Create payroll record
                $recordStmt = $db->prepare("
                    INSERT INTO payroll_records 
                    (workspace_id, pay_period_id, user_id, regular_hours, overtime_hours,
                     regular_rate, overtime_rate, regular_pay, overtime_pay, gross_pay,
                     federal_tax, state_tax, social_security, medicare, health_insurance,
                     retirement_401k, total_deductions, net_pay,
                     employer_social_security, employer_medicare, employer_unemployment,
                     total_employer_taxes, payment_method)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        regular_hours = VALUES(regular_hours),
                        overtime_hours = VALUES(overtime_hours),
                        regular_pay = VALUES(regular_pay),
                        overtime_pay = VALUES(overtime_pay),
                        gross_pay = VALUES(gross_pay),
                        total_deductions = VALUES(total_deductions),
                        net_pay = VALUES(net_pay),
                        total_employer_taxes = VALUES(total_employer_taxes)
                ");
                $recordStmt->execute([
                    $workspaceId, $id, $employee['user_id'], $regularHours, $overtimeHours,
                    $regularRate, $overtimeRate, $regularPay, $overtimePay, $grossPay,
                    $federalTax, $stateTax, $socialSecurity, $medicare, $healthInsurance,
                    $retirement401k, $totalDeduction, $netPay,
                    $employerSS, $employerMedicare, $employerUnemployment,
                    $employerTaxes, $employee['payment_method']
                ]);

                $totalGrossPay += $grossPay;
                $totalDeductions += $totalDeduction;
                $totalNetPay += $netPay;
                $totalEmployerTaxes += $employerTaxes;
            }

            // Update pay period totals
            $updateStmt = $db->prepare("
                UPDATE pay_periods 
                SET status = 'processing',
                    total_gross_pay = ?,
                    total_deductions = ?,
                    total_net_pay = ?,
                    total_employer_taxes = ?,
                    processed_by = ?,
                    processed_at = NOW()
                WHERE id = ?
            ");
            $updateStmt->execute([
                $totalGrossPay, $totalDeductions, $totalNetPay, $totalEmployerTaxes,
                $userId, $id
            ]);

            return Response::json([
                'success' => true,
                'data' => [
                    'employees_processed' => count($employees),
                    'total_gross_pay' => $totalGrossPay,
                    'total_net_pay' => $totalNetPay
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to process pay period: ' . $e->getMessage());
        }
    }

    public static function approvePayPeriod($id) {
        try {
            Permissions::require('hr.payroll.approve');
            $workspaceId = self::getWorkspaceId();
            $userId = self::getUserId();
            $db = Database::conn();

            $stmt = $db->prepare("
                UPDATE pay_periods 
                SET status = 'approved', approved_by = ?, approved_at = NOW()
                WHERE id = ? AND workspace_id = ? AND status = 'processing'
            ");
            $stmt->execute([$userId, $id, $workspaceId]);

            if ($stmt->rowCount() === 0) {
                return Response::error('Pay period not found or not in processing status', 404);
            }

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to approve pay period: ' . $e->getMessage());
        }
    }

    // ==================== PAYROLL RECORDS ====================

    public static function getPayrollRecords() {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            $where = ['pr.workspace_id = ?'];
            $params = [$workspaceId];

            // Self-only for non-managers
            if (!empty($_GET['user_id'])) {
                if (!Permissions::isManager() && (int)$_GET['user_id'] !== $currentUserId) {
                    return Response::error('Unauthorized', 403);
                }
                $where[] = 'pr.user_id = ?';
                $params[] = (int)$_GET['user_id'];
            } elseif (!Permissions::isManager()) {
                $where[] = 'pr.user_id = ?';
                $params[] = $currentUserId;
            }

            if (!empty($_GET['pay_period_id'])) {
                $where[] = 'pr.pay_period_id = ?';
                $params[] = (int)$_GET['pay_period_id'];
            }

            if (!empty($_GET['payment_status'])) {
                $where[] = 'pr.payment_status = ?';
                $params[] = $_GET['payment_status'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT pr.*, u.name as user_name, u.email,
                    pp.period_start, pp.period_end, pp.pay_date
                FROM payroll_records pr
                LEFT JOIN users u ON u.id = pr.user_id
                LEFT JOIN pay_periods pp ON pp.id = pr.pay_period_id
                WHERE $whereClause
                ORDER BY pp.period_start DESC, u.name
            ");
            $stmt->execute($params);
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $records]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch payroll records: ' . $e->getMessage());
        }
    }

    public static function markPayrollPaid($id) {
        try {
            Permissions::require('hr.payroll.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("
                UPDATE payroll_records 
                SET payment_status = 'paid',
                    payment_date = ?,
                    payment_reference = ?
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([
                $data['payment_date'] ?? date('Y-m-d'),
                $data['payment_reference'] ?? null,
                $id,
                $workspaceId
            ]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to mark as paid: ' . $e->getMessage());
        }
    }

    // ==================== EMPLOYEE COMPENSATION ====================

    public static function getEmployeeCompensation() {
        try {
            $workspaceId = self::getWorkspaceId();
            $currentUserId = self::getUserId();
            $db = Database::conn();

            $where = ['ec.workspace_id = ?'];
            $params = [$workspaceId];

            // Self-only for non-managers
            if (!empty($_GET['user_id'])) {
                if (!Permissions::isManager() && (int)$_GET['user_id'] !== $currentUserId) {
                    return Response::error('Unauthorized', 403);
                }
                $where[] = 'ec.user_id = ?';
                $params[] = (int)$_GET['user_id'];
            } elseif (!Permissions::isManager()) {
                $where[] = 'ec.user_id = ?';
                $params[] = $currentUserId;
            }

            if (isset($_GET['is_active'])) {
                $where[] = 'ec.is_active = ?';
                $params[] = (int)$_GET['is_active'];
            }

            $whereClause = implode(' AND ', $where);

            $stmt = $db->prepare("
                SELECT ec.*, u.name as user_name, u.email
                FROM employee_compensation ec
                LEFT JOIN users u ON u.id = ec.user_id
                WHERE $whereClause
                ORDER BY u.name, ec.effective_date DESC
            ");
            $stmt->execute($params);
            $compensation = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json(['data' => $compensation]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch compensation: ' . $e->getMessage());
        }
    }

    public static function createEmployeeCompensation() {
        try {
            Permissions::require('hr.compensation.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['user_id']) || empty($data['effective_date'])) {
                return Response::error('user_id and effective_date required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO employee_compensation 
                (workspace_id, user_id, employment_type, pay_type, hourly_rate, salary_amount,
                 pay_frequency, overtime_eligible, overtime_rate_multiplier, 
                 health_insurance_deduction, retirement_401k_percent, payment_method, effective_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['user_id'],
                $data['employment_type'] ?? 'full-time',
                $data['pay_type'] ?? 'hourly',
                $data['hourly_rate'] ?? null,
                $data['salary_amount'] ?? null,
                $data['pay_frequency'] ?? 'bi-weekly',
                $data['overtime_eligible'] ?? 1,
                $data['overtime_rate_multiplier'] ?? 1.5,
                $data['health_insurance_deduction'] ?? 0,
                $data['retirement_401k_percent'] ?? 0,
                $data['payment_method'] ?? 'direct_deposit',
                $data['effective_date']
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create compensation: ' . $e->getMessage());
        }
    }

    public static function updateEmployeeCompensation($id) {
        try {
            Permissions::require('hr.compensation.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $updates = [];
            $params = [];

            $allowedFields = [
                'employment_type', 'pay_type', 'hourly_rate', 'salary_amount', 'pay_frequency',
                'overtime_eligible', 'overtime_rate_multiplier', 'health_insurance_deduction',
                'dental_insurance_deduction', 'vision_insurance_deduction', 'retirement_401k_percent',
                'payment_method', 'is_active', 'end_date'
            ];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }

            if (empty($updates)) {
                return Response::error('No fields to update', 400);
            }

            $params[] = $id;
            $params[] = $workspaceId;

            $stmt = $db->prepare("
                UPDATE employee_compensation 
                SET " . implode(', ', $updates) . "
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute($params);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update compensation: ' . $e->getMessage());
        }
    }

    // ==================== ANALYTICS ====================

    public static function getPayrollAnalytics() {
        try {
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $year = $_GET['year'] ?? date('Y');

            // YTD totals
            $ytdStmt = $db->prepare("
                SELECT 
                    COUNT(DISTINCT pr.user_id) as total_employees,
                    SUM(pr.gross_pay) as total_gross_pay,
                    SUM(pr.total_deductions) as total_deductions,
                    SUM(pr.net_pay) as total_net_pay,
                    SUM(pr.total_employer_taxes) as total_employer_taxes,
                    AVG(pr.regular_hours) as avg_hours_per_employee
                FROM payroll_records pr
                INNER JOIN pay_periods pp ON pp.id = pr.pay_period_id
                WHERE pr.workspace_id = ? AND YEAR(pp.period_start) = ?
            ");
            $ytdStmt->execute([$workspaceId, $year]);
            $ytd = $ytdStmt->fetch(PDO::FETCH_ASSOC);

            // By month
            $monthlyStmt = $db->prepare("
                SELECT 
                    DATE_FORMAT(pp.period_start, '%Y-%m') as month,
                    SUM(pr.gross_pay) as gross_pay,
                    SUM(pr.net_pay) as net_pay,
                    COUNT(DISTINCT pr.user_id) as employee_count
                FROM payroll_records pr
                INNER JOIN pay_periods pp ON pp.id = pr.pay_period_id
                WHERE pr.workspace_id = ? AND YEAR(pp.period_start) = ?
                GROUP BY month
                ORDER BY month
            ");
            $monthlyStmt->execute([$workspaceId, $year]);
            $monthly = $monthlyStmt->fetchAll(PDO::FETCH_ASSOC);

            // By employee
            $employeeStmt = $db->prepare("
                SELECT 
                    u.name,
                    SUM(pr.gross_pay) as ytd_gross,
                    SUM(pr.net_pay) as ytd_net,
                    SUM(pr.regular_hours + pr.overtime_hours) as ytd_hours
                FROM payroll_records pr
                INNER JOIN pay_periods pp ON pp.id = pr.pay_period_id
                INNER JOIN users u ON u.id = pr.user_id
                WHERE pr.workspace_id = ? AND YEAR(pp.period_start) = ?
                GROUP BY pr.user_id
                ORDER BY ytd_gross DESC
            ");
            $employeeStmt->execute([$workspaceId, $year]);
            $byEmployee = $employeeStmt->fetchAll(PDO::FETCH_ASSOC);

            return Response::json([
                'data' => [
                    'ytd' => $ytd,
                    'monthly' => $monthly,
                    'by_employee' => $byEmployee,
                    'year' => $year
                ]
            ]);
        } catch (Exception $e) {
            return Response::error('Failed to get analytics: ' . $e->getMessage());
        }
    }

    // ==================== TAX BRACKETS ====================

    public static function getTaxBrackets() {
        try {
            Permissions::require('hr.payroll.view');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $type = $_GET['type'] ?? null;

            $query = "SELECT * FROM payroll_tax_brackets WHERE workspace_id = ?";
            $params = [$workspaceId];

            if ($type) {
                $query .= " AND tax_type = ?";
                $params[] = $type;
            }

            $query .= " ORDER BY tax_type, min_income ASC";
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            
            return Response::json(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            return Response::error('Failed to fetch tax brackets: ' . $e->getMessage());
        }
    }

    public static function createTaxBracket() {
        try {
            Permissions::require('hr.payroll.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (empty($data['tax_type']) || !isset($data['min_income']) || !isset($data['rate'])) {
                return Response::error('tax_type, min_income, and rate required', 400);
            }

            $stmt = $db->prepare("
                INSERT INTO payroll_tax_brackets 
                (workspace_id, tax_type, min_income, max_income, rate)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $workspaceId,
                $data['tax_type'],
                $data['min_income'],
                $data['max_income'] ?? null,
                $data['rate']
            ]);

            return Response::json(['data' => ['id' => (int)$db->lastInsertId()]]);
        } catch (Exception $e) {
            return Response::error('Failed to create tax bracket: ' . $e->getMessage());
        }
    }

    public static function updateTaxBracket($id) {
        try {
            Permissions::require('hr.payroll.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            $stmt = $db->prepare("
                UPDATE payroll_tax_brackets 
                SET tax_type = ?, min_income = ?, max_income = ?, rate = ?
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([
                $data['tax_type'],
                $data['min_income'],
                $data['max_income'] ?? null,
                $data['rate'],
                $id,
                $workspaceId
            ]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to update tax bracket: ' . $e->getMessage());
        }
    }

    public static function deleteTaxBracket($id) {
        try {
            Permissions::require('hr.payroll.manage');
            $workspaceId = self::getWorkspaceId();
            $db = Database::conn();

            $stmt = $db->prepare("DELETE FROM payroll_tax_brackets WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$id, $workspaceId]);

            return Response::json(['success' => true]);
        } catch (Exception $e) {
            return Response::error('Failed to delete tax bracket: ' . $e->getMessage());
        }
    }
}
