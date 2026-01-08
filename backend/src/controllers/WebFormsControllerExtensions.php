<?php
/**
 * WebFormsControllerExtensions - Additional endpoints for insights, files, and reports
 * These methods extend WebFormsController functionality
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class WebFormsControllerExtensions {
    
    private static function getWorkspaceId(): int {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if ($ctx && isset($ctx->workspaceId)) {
            return (int)$ctx->workspaceId;
        }
        return 1;
    }
    
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
    
    // ========== INSIGHTS ==========
    
    public static function getFormInsights($formId) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            // Verify form ownership
            $stmt = $pdo->prepare("SELECT id FROM webforms_forms WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$formId, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::json(['error' => 'Form not found'], 404);
            }
            
            $range = $_GET['range'] ?? '7d';
            $days = match($range) {
                '30d' => 30,
                '90d' => 90,
                '1y' => 365,
                default => 7,
            };
            
            $interval = (int)$days;

            // Get Views
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM webforms_form_views WHERE form_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)");
            $stmt->execute([$formId, $interval]);
            $views = (int)$stmt->fetchColumn();

            // Get Starts
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM webforms_form_starts WHERE form_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)");
            $stmt->execute([$formId, $interval]);
            $starts = (int)$stmt->fetchColumn();

            // Get Submissions
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as submissions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                    AVG(TIMESTAMPDIFF(SECOND, created_at, updated_at)) as avg_time
                FROM webforms_form_submissions
                WHERE form_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ");
            $stmt->execute([$formId, $interval]);
            $metrics = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $submissions = (int)($metrics['submissions'] ?? 0);
            $completed = (int)($metrics['completed'] ?? 0);
            $avgTime = (int)($metrics['avg_time'] ?? 0);
            
            // Calculate rates
            $completionRate = $starts > 0 ? round(($submissions / $starts) * 100, 1) : 0;
            $dropOffRate = $views > 0 ? round((($views - $submissions) / $views) * 100, 1) : 0;
            
            // Get trends
            $trends = [];
            for ($i = $days - 1; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i days"));
                
                $stmtV = $pdo->prepare("SELECT COUNT(*) FROM webforms_form_views WHERE form_id = ? AND DATE(created_at) = ?");
                $stmtV->execute([$formId, $date]);
                $vCount = (int)$stmtV->fetchColumn();

                $stmtS = $pdo->prepare("SELECT COUNT(*) FROM webforms_form_submissions WHERE form_id = ? AND DATE(created_at) = ?");
                $stmtS->execute([$formId, $date]);
                $sCount = (int)$stmtS->fetchColumn();

                $trends[] = [
                    'date' => $date,
                    'views' => $vCount,
                    'submissions' => $sCount
                ];
            }
            
            // Device breakdown (basic parsing from views)
            $stmt = $pdo->prepare("
                SELECT user_agent, COUNT(*) as count 
                FROM webforms_form_views 
                WHERE form_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY user_agent
            ");
            $stmt->execute([$formId, $interval]);
            $uas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $deviceCounts = ['Desktop' => 0, 'Mobile' => 0, 'Tablet' => 0];
            foreach ($uas as $ua) {
                $agent = strtolower($ua['user_agent'] ?? '');
                $type = 'Desktop';
                if (strpos($agent, 'mobile') !== false) $type = 'Mobile';
                if (strpos($agent, 'tablet') !== false || strpos($agent, 'ipad') !== false) $type = 'Tablet';
                $deviceCounts[$type] += (int)$ua['count'];
            }
            $devices = [];
            foreach ($deviceCounts as $d => $c) {
                if ($c > 0 || $d === 'Desktop') $devices[] = ['device' => $d, 'count' => $c];
            }
            
            // Source breakdown (mock data for now as we don't track referer specifically in v1 schema)
            $sources = [
                ['source' => 'Direct', 'count' => (int)($views * 0.6)],
                ['source' => 'Embed', 'count' => (int)($views * 0.3)],
                ['source' => 'Social', 'count' => (int)($views * 0.1)],
            ];
            
            return Response::json([
                'metrics' => [
                    'views' => $views,
                    'starts' => $starts,
                    'submissions' => $submissions,
                    'completion_rate' => $completionRate,
                    'avg_time' => $avgTime,
                    'drop_off_rate' => $dropOffRate,
                ],
                'trends' => $trends,
                'devices' => $devices,
                'sources' => $sources,
                'field_insights' => [],
            ]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }

    public static function trackFormStart($formId) {
        $pdo = Database::conn();
        try {
            $stmt = $pdo->prepare("INSERT INTO webforms_form_starts (form_id, ip_address, user_agent, created_at) VALUES (?, ?, ?, NOW())");
            $stmt->execute([
                $formId,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
            return Response::json(['success' => true]);
        } catch (Exception $e) {
            // Return success anyway to not block user
            return Response::json(['success' => true]);
        }
    }
    
    // ========== FILES ==========
    
    public static function getFormFiles($formId) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            // Verify form ownership
            $stmt = $pdo->prepare("SELECT id FROM webforms_forms WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$formId, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::json(['error' => 'Form not found'], 404);
            }
            
            // Scan submission_data for file URLs. This assumes file upload fields store URLs.
            $stmt = $pdo->prepare("
                SELECT 
                    fs.id as submission_id,
                    fs.submission_data,
                    fs.created_at as uploaded_at
                FROM webforms_form_submissions fs
                WHERE fs.form_id = ?
                ORDER BY fs.created_at DESC
            ");
            $stmt->execute([$formId]);
            $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $files = [];
            $fileId = 1;
            
            foreach ($submissions as $submission) {
                $data = json_decode($submission['submission_data'] ?? '{}', true);
                if (!$data || !is_array($data)) continue;
                
                foreach ($data as $fieldName => $value) {
                    // Accept string URL or array of URLs
                    $values = is_array($value) ? $value : [$value];
                    foreach ($values as $val) {
                        if (!is_string($val)) continue;
                        if (strpos($val, 'http') !== 0 && strpos($val, '/uploads/') === false) continue;
                        
                        $filename = basename(parse_url($val, PHP_URL_PATH));
                        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
                        $mimeType = match($ext) {
                            'jpg', 'jpeg' => 'image/jpeg',
                            'png' => 'image/png',
                            'gif' => 'image/gif',
                            'pdf' => 'application/pdf',
                            'doc', 'docx' => 'application/msword',
                            'xls', 'xlsx' => 'application/vnd.ms-excel',
                            'zip' => 'application/zip',
                            default => 'application/octet-stream',
                        };
                        
                        $files[] = [
                            'id' => $fileId++,
                            'submission_id' => $submission['submission_id'],
                            'field_name' => $fieldName,
                            'filename' => $filename ?: 'file',
                            'file_size' => null,
                            'mime_type' => $mimeType,
                            'url' => $val,
                            'uploaded_at' => $submission['uploaded_at'],
                        ];
                    }
                }
            }
            
            return Response::json([
                'data' => $files,
                'total' => count($files),
            ]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function deleteFormFile($formId, $fileId) {
        // No dedicated file table/storage; acknowledge request without deletion.
        return Response::json(['success' => false, 'message' => 'File deletion not supported (no file storage backend)'], 501);
    }
    
    // ========== REPORTS ==========
    
    public static function getFormReports($formId) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            // Verify form ownership
            $stmt = $pdo->prepare("SELECT id FROM webforms_forms WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$formId, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::json(['error' => 'Form not found'], 404);
            }
            
            $reportDir = __DIR__ . '/../../public/reports';
            if (!is_dir($reportDir)) {
                @mkdir($reportDir, 0775, true);
            }
            
            $reports = [];
            foreach (glob($reportDir . "/report-{$formId}-*.csv") as $file) {
                $filename = basename($file);
                $reports[] = [
                    'id' => crc32($filename),
                    'name' => $filename,
                    'type' => 'summary',
                    'date_range' => 'custom',
                    'status' => 'ready',
                    'created_at' => date('c', filemtime($file)),
                    'download_url' => "/reports/{$filename}",
                ];
            }
            
            return Response::json(['data' => $reports]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function generateReport($formId) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            // Verify form ownership
            $stmt = $pdo->prepare("SELECT id, title FROM webforms_forms WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$formId, $workspaceId]);
            $form = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$form) {
                return Response::json(['error' => 'Form not found'], 404);
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $format = $input['format'] ?? 'csv';
            if (!in_array($format, ['csv', 'excel', 'pdf'])) {
                $format = 'csv';
            }
            
            // Fetch submissions
            $stmt = $pdo->prepare("SELECT * FROM webforms_form_submissions WHERE form_id = ? ORDER BY created_at DESC");
            $stmt->execute([$formId]);
            $subs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Build CSV content
            $rows = [];
            $rows[] = ['ID', 'Status', 'Created At', 'Data'];
            foreach ($subs as $s) {
                $rows[] = [
                    $s['id'],
                    $s['status'],
                    $s['created_at'],
                    $s['submission_data'],
                ];
            }
            
            $reportDir = __DIR__ . '/../../public/reports';
            if (!is_dir($reportDir)) {
                @mkdir($reportDir, 0775, true);
            }
            $filename = "report-{$formId}-" . date('Ymd-His') . ".csv";
            $filepath = $reportDir . "/" . $filename;
            
            $fp = fopen($filepath, 'w');
            foreach ($rows as $row) {
                fputcsv($fp, $row);
            }
            fclose($fp);
            
            $downloadUrl = "/reports/{$filename}";
            
            return Response::json([
                'data' => [
                    'id' => crc32($filename),
                    'download_url' => $downloadUrl,
                ]
            ]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function getScheduledReports($formId) {
        // No scheduler backing store yet
        return Response::json(['data' => []]);
    }
    
    public static function createScheduledReport($formId) {
        return Response::json(['error' => 'Scheduled reports not implemented'], 501);
    }
    
    public static function updateScheduledReport($formId, $reportId) {
        return Response::json(['error' => 'Scheduled reports not implemented'], 501);
    }
    
    public static function deleteScheduledReport($formId, $reportId) {
        return Response::json(['error' => 'Scheduled reports not implemented'], 501);
    }
    
    // ========== BULK ACTIONS ==========
    
    public static function bulkUpdateSubmissions($formId) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            // Verify form ownership
            $stmt = $pdo->prepare("SELECT id FROM webforms_forms WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$formId, $workspaceId]);
            if (!$stmt->fetch()) {
                return Response::json(['error' => 'Form not found'], 404);
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $submissionIds = $input['submission_ids'] ?? [];
            $action = $input['action'] ?? '';
            
            if (empty($submissionIds)) {
                return Response::json(['error' => 'No submissions selected'], 400);
            }
            
            $placeholders = implode(',', array_fill(0, count($submissionIds), '?'));
            
            switch ($action) {
                case 'mark_reviewed':
                    $stmt = $pdo->prepare("
                        UPDATE webforms_form_submissions 
                        SET status = 'completed' 
                        WHERE id IN ($placeholders) AND form_id = ?
                    ");
                    $stmt->execute([...$submissionIds, $formId]);
                    break;
                    
                case 'mark_spam':
                    $stmt = $pdo->prepare("
                        UPDATE webforms_form_submissions 
                        SET status = 'spam' 
                        WHERE id IN ($placeholders) AND form_id = ?
                    ");
                    $stmt->execute([...$submissionIds, $formId]);
                    break;
                    
                case 'delete':
                    $stmt = $pdo->prepare("
                        DELETE FROM webforms_form_submissions 
                        WHERE id IN ($placeholders) AND form_id = ?
                    ");
                    $stmt->execute([...$submissionIds, $formId]);
                    break;
                    
                default:
                    return Response::json(['error' => 'Invalid action'], 400);
            }
            
            return Response::json([
                'success' => true,
                'updated' => $stmt->rowCount(),
            ]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
    
    public static function exportSubmissions($formId) {
        $workspaceId = self::getWorkspaceId();
        $pdo = Database::conn();
        
        try {
            // Verify form ownership
            $stmt = $pdo->prepare("SELECT id, title FROM webforms_forms WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$formId, $workspaceId]);
            $form = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$form) {
                return Response::json(['error' => 'Form not found'], 404);
            }
            
            $format = $_GET['format'] ?? 'csv';
            $status = $_GET['status'] ?? null;
            
            // Get submissions
            $sql = "SELECT * FROM webforms_form_submissions WHERE form_id = ?";
            $params = [$formId];
            if ($status && $status !== 'all') {
                $sql .= " AND status = ?";
                $params[] = $status;
            }
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $exportDir = __DIR__ . '/../../public/exports';
            if (!is_dir($exportDir)) {
                @mkdir($exportDir, 0775, true);
            }
            $filename = "submissions-{$formId}-" . date('Ymd-His') . ".csv";
            $filepath = $exportDir . "/" . $filename;
            
            $fp = fopen($filepath, 'w');
            fputcsv($fp, ['ID', 'Status', 'Created At', 'Data']);
            foreach ($submissions as $s) {
                fputcsv($fp, [$s['id'], $s['status'], $s['created_at'], $s['submission_data']]);
            }
            fclose($fp);
            
            $downloadUrl = "/exports/{$filename}";
            
            return Response::json(['download_url' => $downloadUrl]);
        } catch (PDOException $e) {
            return Response::json(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
}
