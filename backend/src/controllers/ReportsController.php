<?php
/**
 * ReportsController - Handles advanced reporting and analytics
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ReportsController {
    
    public static function getReports(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $type = $_GET['type'] ?? null;
        $sql = 'SELECT * FROM report_definitions WHERE user_id = ?';
        $params = [$userId];
        
        if ($type) {
            $sql .= ' AND report_type = ?';
            $params[] = $type;
        }
        $sql .= ' ORDER BY created_at DESC';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($reports as &$report) {
            $report['metrics'] = json_decode($report['metrics'], true);
            $report['dimensions'] = json_decode($report['dimensions'], true);
            $report['filters'] = json_decode($report['filters'], true);
        }
        
        Response::json(['items' => $reports]);
    }
    
    public static function getReport(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM report_definitions WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$report) {
            Response::notFound('Report not found');
            return;
        }
        
        $report['metrics'] = json_decode($report['metrics'], true);
        $report['dimensions'] = json_decode($report['dimensions'], true);
        $report['filters'] = json_decode($report['filters'], true);
        
        Response::json($report);
    }
    
    public static function createReport(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        if (empty($body['name']) || empty($body['report_type'])) {
            Response::validationError('Report name and type are required');
            return;
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO report_definitions (user_id, name, description, report_type, metrics, dimensions, 
                filters, sort_by, sort_direction, chart_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $userId, $body['name'], $body['description'] ?? null, $body['report_type'],
            json_encode($body['metrics'] ?? []), json_encode($body['dimensions'] ?? []),
            json_encode($body['filters'] ?? []), $body['sort_by'] ?? null,
            $body['sort_direction'] ?? 'desc', $body['chart_type'] ?? 'table'
        ]);
        
        Response::json(['id' => $pdo->lastInsertId(), 'message' => 'Report created'], 201);
    }
    
    public static function updateReport(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT id FROM report_definitions WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            Response::notFound('Report not found');
            return;
        }
        
        $updates = [];
        $params = [];
        foreach (['name', 'description', 'report_type', 'sort_by', 'sort_direction', 'chart_type'] as $f) {
            if (isset($body[$f])) { $updates[] = "$f = ?"; $params[] = $body[$f]; }
        }
        foreach (['metrics', 'dimensions', 'filters'] as $f) {
            if (isset($body[$f])) { $updates[] = "$f = ?"; $params[] = json_encode($body[$f]); }
        }
        
        if ($updates) {
            $params[] = $id;
            $stmt = $pdo->prepare('UPDATE report_definitions SET ' . implode(', ', $updates) . ' WHERE id = ?');
            $stmt->execute($params);
        }
        
        Response::json(['message' => 'Report updated']);
    }
    
    public static function deleteReport(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('DELETE FROM report_definitions WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        
        Response::json(['message' => $stmt->rowCount() ? 'Report deleted' : 'Not found']);
    }
    
    public static function runReport(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM report_definitions WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$report) {
            Response::notFound('Report not found');
            return;
        }
        
        $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
        $to = $_GET['to'] ?? date('Y-m-d');
        
        $data = self::executeReport($report['report_type'], $userId, $from, $to, $pdo);
        
        $stmt = $pdo->prepare('UPDATE report_definitions SET last_run_at = NOW() WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json(['report' => $report, 'data' => $data]);
    }
    
    private static function executeReport($type, $userId, $from, $to, $pdo): array {
        switch ($type) {
            case 'email':
                $stmt = $pdo->prepare('SELECT DATE(created_at) as date, SUM(sent) as sent, SUM(opens) as opens, SUM(clicks) as clicks FROM campaigns WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ? GROUP BY DATE(created_at)');
                $stmt->execute([$userId, $from, $to]);
                return ['daily' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
            case 'sms':
                $stmt = $pdo->prepare('SELECT DATE(created_at) as date, SUM(total_recipients) as sent, SUM(delivered) as delivered FROM sms_campaigns WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ? GROUP BY DATE(created_at)');
                $stmt->execute([$userId, $from, $to]);
                return ['daily' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
            case 'revenue':
                $stmt = $pdo->prepare('SELECT DATE(paid_at) as date, SUM(amount) as revenue, COUNT(*) as count FROM payments WHERE user_id = ? AND status = ? AND DATE(paid_at) BETWEEN ? AND ? GROUP BY DATE(paid_at)');
                $stmt->execute([$userId, 'completed', $from, $to]);
                return ['daily' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
            case 'contacts':
                $stmt = $pdo->prepare('SELECT DATE(created_at) as date, COUNT(*) as new_contacts FROM contacts WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ? GROUP BY DATE(created_at)');
                $stmt->execute([$userId, $from, $to]);
                return ['daily' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
            case 'appointments':
                $stmt = $pdo->prepare('SELECT DATE(scheduled_at) as date, COUNT(*) as total, SUM(status="completed") as completed FROM appointments WHERE user_id = ? AND DATE(scheduled_at) BETWEEN ? AND ? GROUP BY DATE(scheduled_at)');
                $stmt->execute([$userId, $from, $to]);
                return ['daily' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
            default:
                return [];
        }
    }
    
    public static function getDashboards(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM dashboards WHERE user_id = ? ORDER BY is_default DESC, created_at DESC');
        $stmt->execute([$userId]);
        
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    public static function getDashboard(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM dashboards WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $userId]);
        $dashboard = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$dashboard) {
            Response::notFound('Dashboard not found');
            return;
        }
        
        $stmt = $pdo->prepare('SELECT * FROM dashboard_widgets WHERE dashboard_id = ? ORDER BY position_y, position_x');
        $stmt->execute([$id]);
        $dashboard['widgets'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::json($dashboard);
    }
    
    public static function createDashboard(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('INSERT INTO dashboards (user_id, name, description, is_default) VALUES (?, ?, ?, ?)');
        $stmt->execute([$userId, $body['name'] ?? 'New Dashboard', $body['description'] ?? null, $body['is_default'] ?? false]);
        
        Response::json(['id' => $pdo->lastInsertId(), 'message' => 'Dashboard created'], 201);
    }
    
    public static function getGoals(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY end_date DESC');
        $stmt->execute([$userId]);
        
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    public static function createGoal(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('INSERT INTO goals (user_id, name, metric_type, target_value, period_type, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$userId, $body['name'], $body['metric_type'], $body['target_value'], $body['period_type'] ?? 'monthly', $body['start_date'], $body['end_date']]);
        
        Response::json(['id' => $pdo->lastInsertId(), 'message' => 'Goal created'], 201);
    }
    
    public static function getOverviewStats(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Revenue
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE user_id = ? AND status = ? AND MONTH(paid_at) = MONTH(NOW())');
        $stmt->execute([$userId, 'completed']);
        $monthlyRevenue = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Contacts
        $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM contacts WHERE user_id = ?');
        $stmt->execute([$userId]);
        $totalContacts = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Appointments this week
        $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM appointments WHERE user_id = ? AND YEARWEEK(scheduled_at) = YEARWEEK(NOW())');
        $stmt->execute([$userId]);
        $weeklyAppointments = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Emails sent this month
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(sent), 0) as total FROM campaigns WHERE user_id = ? AND MONTH(created_at) = MONTH(NOW())');
        $stmt->execute([$userId]);
        $emailsSent = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        Response::json([
            'monthly_revenue' => (float) $monthlyRevenue,
            'total_contacts' => (int) $totalContacts,
            'weekly_appointments' => (int) $weeklyAppointments,
            'emails_sent' => (int) $emailsSent
        ]);
    }
}
