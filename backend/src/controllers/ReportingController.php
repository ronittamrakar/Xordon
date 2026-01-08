<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class ReportingController {
    
    // ============================================================================
    // SCHEDULED REPORTS
    // ============================================================================
    
    public static function listScheduledReports() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT * FROM scheduled_reports 
            WHERE workspace_id = ?
            ORDER BY name ASC
        ");
        $stmt->execute([$ctx->workspaceId]);
        $reports = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($reports as &$report) {
            $report['recipients'] = json_decode($report['recipients'], true);
            $report['filters'] = json_decode($report['filters'], true);
        }
        
        return Response::success($reports);
    }
    
    public static function createScheduledReport() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        // Calculate next send time
        $nextSend = self::calculateNextSendTime($data['frequency']);
        
        $stmt = $db->prepare("
            INSERT INTO scheduled_reports 
            (workspace_id, name, report_type, frequency, recipients, filters, format, next_send_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $ctx->workspaceId,
            $data['name'],
            $data['report_type'],
            $data['frequency'],
            json_encode($data['recipients']),
            json_encode($data['filters'] ?? []),
            $data['format'] ?? 'pdf',
            $nextSend
        ]);
        
        return Response::success(['report_id' => $db->lastInsertId()]);
    }
    
    public static function updateScheduledReport($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE scheduled_reports 
            SET name = ?, report_type = ?, frequency = ?, recipients = ?, 
                filters = ?, format = ?, is_active = ?
            WHERE id = ? AND workspace_id = ?
        ");
        $stmt->execute([
            $data['name'],
            $data['report_type'],
            $data['frequency'],
            json_encode($data['recipients']),
            json_encode($data['filters'] ?? []),
            $data['format'] ?? 'pdf',
            $data['is_active'] ?? true,
            $id,
            $ctx->workspaceId
        ]);
        
        return Response::success(['message' => 'Report updated']);
    }
    
    public static function deleteScheduledReport($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("DELETE FROM scheduled_reports WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        
        return Response::success(['message' => 'Report deleted']);
    }
    
    // ============================================================================
    // REPORT EXPORTS
    // ============================================================================
    
    public static function exportReport() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $reportType = $data['report_type'];
        $format = $data['format'] ?? 'csv';
        $filters = $data['filters'] ?? [];
        
        // Generate filename
        $filename = $reportType . '_' . date('Y-m-d_His') . '.' . $format;
        
        // Create export record
        $stmt = $db->prepare("
            INSERT INTO report_exports 
            (workspace_id, user_id, report_type, file_name, file_url, format, filters, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'processing')
        ");
        $stmt->execute([
            $ctx->workspaceId,
            Auth::userId(),
            $reportType,
            $filename,
            '/exports/' . $filename, // Placeholder URL
            $format,
            json_encode($filters)
        ]);
        
        $exportId = $db->lastInsertId();
        
        // In production, trigger background job to generate report
        // For now, simulate immediate completion
        self::generateReport($exportId, $reportType, $format, $filters, $ctx->workspaceId);
        
        return Response::success([
            'export_id' => $exportId,
            'status' => 'processing'
        ]);
    }
    
    public static function listExports() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $limit = (int)($_GET['limit'] ?? 50);
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT * FROM report_exports 
            WHERE workspace_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$ctx->workspaceId, $limit]);
        $exports = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($exports as &$export) {
            $export['filters'] = json_decode($export['filters'], true);
        }
        
        return Response::success($exports);
    }
    
    public static function getExportStatus($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT * FROM report_exports 
            WHERE id = ? AND workspace_id = ?
        ");
        $stmt->execute([$id, $ctx->workspaceId]);
        $export = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$export) {
            return Response::error('Export not found', 404);
        }
        
        $export['filters'] = json_decode($export['filters'], true);
        
        return Response::success($export);
    }
    
    // ============================================================================
    // HELPER FUNCTIONS
    // ============================================================================
    
    private static function calculateNextSendTime($frequency) {
        switch ($frequency) {
            case 'daily':
                return date('Y-m-d H:i:s', strtotime('+1 day'));
            case 'weekly':
                return date('Y-m-d H:i:s', strtotime('+1 week'));
            case 'monthly':
                return date('Y-m-d H:i:s', strtotime('+1 month'));
            default:
                return date('Y-m-d H:i:s', strtotime('+1 day'));
        }
    }
    
    private static function generateReport($exportId, $reportType, $format, $filters, $workspaceId) {
        $db = Database::conn();
        
        // Fetch data based on report type
        $data = self::fetchReportData($reportType, $filters, $workspaceId);
        
        // Generate file (simplified for demo)
        $fileContent = self::formatReportData($data, $format);
        $fileSize = strlen($fileContent);
        
        // Update export record
        $stmt = $db->prepare("
            UPDATE report_exports 
            SET status = 'completed', file_size = ?, expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY)
            WHERE id = ?
        ");
        $stmt->execute([$fileSize, $exportId]);
    }
    
    private static function fetchReportData($reportType, $filters, $workspaceId) {
        $db = Database::conn();
        
        switch ($reportType) {
            case 'contacts':
                $stmt = $db->prepare("SELECT * FROM contacts WHERE workspace_id = ? LIMIT 1000");
                $stmt->execute([$workspaceId]);
                return $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            case 'campaigns':
                $stmt = $db->prepare("SELECT * FROM campaigns WHERE workspace_id = ? LIMIT 1000");
                $stmt->execute([$workspaceId]);
                return $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            case 'revenue':
                $stmt = $db->prepare("
                    SELECT DATE(created_at) as date, SUM(total) as revenue 
                    FROM invoices 
                    WHERE workspace_id = ? AND status = 'paid'
                    GROUP BY DATE(created_at)
                    ORDER BY date DESC
                    LIMIT 365
                ");
                $stmt->execute([$workspaceId]);
                return $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            default:
                return [];
        }
    }
    
    private static function formatReportData($data, $format) {
        if ($format === 'csv') {
            if (empty($data)) return '';
            
            $output = '';
            $headers = array_keys($data[0]);
            $output .= implode(',', $headers) . "\n";
            
            foreach ($data as $row) {
                $output .= implode(',', array_map(function($v) {
                    return '"' . str_replace('"', '""', $v) . '"';
                }, $row)) . "\n";
            }
            
            return $output;
        }
        
        return json_encode($data);
    }
}
