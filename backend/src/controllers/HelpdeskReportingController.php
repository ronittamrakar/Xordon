<?php

/**
 * HelpdeskReportingController
 * Provides metrics and export endpoints for helpdesk reporting
 */

use Xordon\Database;
use Xordon\Response;

class HelpdeskReportingController {

    // GET /helpdesk/reports/metrics?days={days}
    public static function metrics() {
        $db = getDBConnection();
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];

        $days = intval($_GET['days'] ?? 30);
        $startDate = date('Y-m-d H:i:s', strtotime("-{$days} days"));

        // Total tickets
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM tickets WHERE workspace_id = ? AND created_at >= ?");
        $stmt->execute([$workspaceId, $startDate]);
        $total = intval($stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);

        // Open tickets
        $stmt = $db->prepare("SELECT COUNT(*) as open_count FROM tickets WHERE workspace_id = ? AND created_at >= ? AND status IN ('new','open')");
        $stmt->execute([$workspaceId, $startDate]);
        $open = intval($stmt->fetch(PDO::FETCH_ASSOC)['open_count'] ?? 0);

        // Closed tickets
        $stmt = $db->prepare("SELECT COUNT(*) as closed_count FROM tickets WHERE workspace_id = ? AND created_at >= ? AND status = 'closed'");
        $stmt->execute([$workspaceId, $startDate]);
        $closed = intval($stmt->fetch(PDO::FETCH_ASSOC)['closed_count'] ?? 0);

        // Avg response time in minutes
        $stmt = $db->prepare("SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, first_response_at)) AS avg_response_minutes FROM tickets WHERE workspace_id = ? AND created_at >= ? AND first_response_at IS NOT NULL");
        $stmt->execute([$workspaceId, $startDate]);
        $avgResponse = intval($stmt->fetch(PDO::FETCH_ASSOC)['avg_response_minutes'] ?? 0);

        // Avg resolution time in minutes
        $stmt = $db->prepare("SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) AS avg_resolution_minutes FROM tickets WHERE workspace_id = ? AND created_at >= ? AND resolved_at IS NOT NULL");
        $stmt->execute([$workspaceId, $startDate]);
        $avgResolution = intval($stmt->fetch(PDO::FETCH_ASSOC)['avg_resolution_minutes'] ?? 0);

        // SLA compliance - approximate: tickets where sla_breached IS NULL or = 0
        $stmt = $db->prepare("SELECT SUM(CASE WHEN IFNULL(sla_response_breached,0) = 0 AND IFNULL(sla_resolution_breached,0) = 0 THEN 1 ELSE 0 END) AS compliant, COUNT(*) AS total_count FROM tickets WHERE workspace_id = ? AND created_at >= ?");
        $stmt->execute([$workspaceId, $startDate]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $compliant = intval($row['compliant'] ?? 0);
        $totalCount = intval($row['total_count'] ?? 0);
        $slaCompliance = $totalCount > 0 ? ($compliant / $totalCount) * 100 : 100.0;

        // Avg CSAT (from tickets.csat_score)
        $stmt = $db->prepare("SELECT AVG(csat_score) as avg_csat FROM tickets WHERE workspace_id = ? AND csat_score IS NOT NULL AND created_at >= ?");
        $stmt->execute([$workspaceId, $startDate]);
        $avgCsat = floatval($stmt->fetch(PDO::FETCH_ASSOC)['avg_csat'] ?? 0);

        // Tickets by status
        $stmt = $db->prepare("SELECT status, COUNT(*) as count FROM tickets WHERE workspace_id = ? AND created_at >= ? GROUP BY status");
        $stmt->execute([$workspaceId, $startDate]);
        $statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Tickets by priority
        $stmt = $db->prepare("SELECT priority, COUNT(*) as count FROM tickets WHERE workspace_id = ? AND created_at >= ? GROUP BY priority");
        $stmt->execute([$workspaceId, $startDate]);
        $priorities = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Tickets by team
        $stmt = $db->prepare("SELECT tt.name as team, COUNT(*) as count FROM tickets t LEFT JOIN ticket_teams tt ON t.team_id = tt.id WHERE t.workspace_id = ? AND t.created_at >= ? GROUP BY t.team_id");
        $stmt->execute([$workspaceId, $startDate]);
        $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Tickets by channel
        $stmt = $db->prepare("SELECT source_channel as channel, COUNT(*) as count FROM tickets WHERE workspace_id = ? AND created_at >= ? GROUP BY source_channel");
        $stmt->execute([$workspaceId, $startDate]);
        $channels = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Agent Performance
        $stmt = $db->prepare("
            SELECT 
                u.name as agent,
                COUNT(t.id) as tickets,
                AVG(TIMESTAMPDIFF(MINUTE, t.created_at, t.resolved_at)) as avgTime,
                AVG(t.csat_score) as csat
            FROM tickets t
            JOIN users u ON t.assigned_user_id = u.id
            WHERE t.workspace_id = ? AND t.created_at >= ? AND t.assigned_user_id IS NOT NULL
            GROUP BY t.assigned_user_id
        ");
        $stmt->execute([$workspaceId, $startDate]);
        $agents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($agents as &$agent) {
            $agent['tickets'] = intval($agent['tickets']);
            $agent['avgTime'] = floatval($agent['avgTime']);
            $agent['csat'] = $agent['csat'] !== null ? floatval($agent['csat']) : null;
        }

        // Daily volume (created vs closed)
        // Get created counts
        $stmt = $db->prepare("SELECT DATE(created_at) as date, COUNT(*) as created FROM tickets WHERE workspace_id = ? AND created_at >= ? GROUP BY DATE(created_at)");
        $stmt->execute([$workspaceId, $startDate]);
        $createdMap = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $createdMap[$row['date']] = intval($row['created']);
        }

        // Get closed counts
        $stmt = $db->prepare("SELECT DATE(closed_at) as date, COUNT(*) as closed FROM tickets WHERE workspace_id = ? AND closed_at >= ? GROUP BY DATE(closed_at)");
        $stmt->execute([$workspaceId, $startDate]);
        $closedMap = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $closedMap[$row['date']] = intval($row['closed']);
        }

        // Merge maps
        $daily = [];
        $dates = array_unique(array_merge(array_keys($createdMap), array_keys($closedMap)));
        sort($dates);
        foreach ($dates as $d) {
            $daily[] = [
                'date' => $d,
                'created' => $createdMap[$d] ?? 0,
                'closed' => $closedMap[$d] ?? 0
            ];
        }

        jsonResponse([
            'totalTickets' => $total,
            'openTickets' => $open,
            'closedTickets' => $closed,
            'avgResponseTime' => $avgResponse,
            'avgResolutionTime' => $avgResolution,
            'slaCompliance' => round($slaCompliance, 2),
            'avgCSAT' => round($avgCsat, 2),
            'ticketsByStatus' => $statuses,
            'ticketsByPriority' => $priorities,
            'ticketsByTeam' => $teams,
            'ticketsByChannel' => $channels,
            'agentPerformance' => $agents,
            'dailyVolume' => $daily,
        ]);
    }

    // GET /helpdesk/reports/export?days={days}&format=csv|pdf
    public static function export() {
        $user = requireAuth();
        $workspaceId = $user['workspace_id'];
        $days = intval($_GET['days'] ?? 30);
        $format = strtolower($_GET['format'] ?? 'csv');

        // Reuse metrics logic
        $_GET['days'] = $days;
        $metrics = self::metricsNoOutput();

        if ($format === 'csv') {
            header('Content-Type: text/csv');
            $filename = 'helpdesk-report-' . date('Y-m-d') . '.csv';
            header('Content-Disposition: attachment; filename="' . $filename . '"');

            $out = fopen('php://output', 'w');
            fputcsv($out, ['metric', 'value']);
            fputcsv($out, ['totalTickets', $metrics['totalTickets']]);
            fputcsv($out, ['openTickets', $metrics['openTickets']]);
            fputcsv($out, ['closedTickets', $metrics['closedTickets']]);
            fputcsv($out, ['avgResponseHours', $metrics['avgResponseHours']]);
            fputcsv($out, ['slaCompliance', $metrics['slaCompliance']]);
            fputcsv($out, ['avgCSAT', $metrics['avgCSAT']]);

            fclose($out);
            exit;
        }

        // For other formats return metrics JSON for now
        jsonResponse($metrics);
    }

    // Internal helper to get metrics array without sending JSON (used by export)
    private static function metricsNoOutput() {
        ob_start();
        self::metrics();
        $json = ob_get_clean();
        return json_decode($json, true);
    }
}
