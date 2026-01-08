<?php
/**
 * Report Generation Background Worker
 * Processes queued report exports and generates PDF/CSV/Excel files
 * 
 * Usage:
 *   php report_generation_worker.php          # Run once
 *   php report_generation_worker.php --daemon # Run continuously
 */

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/Database.php';

// Configuration
$isDaemon = in_array('--daemon', $argv);
$sleepSeconds = 10;
$batchSize = 10;
$exportDir = __DIR__ . '/../storage/exports';

echo "Report Generation Worker Started\n";
echo "Mode: " . ($isDaemon ? "Daemon" : "One-shot") . "\n";
echo "Export Directory: $exportDir\n\n";

// Create export directory if it doesn't exist
if (!is_dir($exportDir)) {
    mkdir($exportDir, 0755, true);
    echo "Created export directory\n";
}

// Load environment
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($key, $value) = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($value));
    }
}

do {
    try {
        $db = Database::conn();
        
        // Get pending exports
        $stmt = $db->prepare("
            SELECT * FROM report_exports
            WHERE status = 'processing'
            ORDER BY created_at ASC
            LIMIT ?
        ");
        $stmt->execute([$batchSize]);
        $exports = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($exports)) {
            if (!$isDaemon) {
                echo "No pending exports. Exiting.\n";
                break;
            }
            echo "[" . date('Y-m-d H:i:s') . "] No pending exports. Sleeping...\n";
            sleep($sleepSeconds);
            continue;
        }
        
        echo "[" . date('Y-m-d H:i:s') . "] Processing " . count($exports) . " exports...\n";
        
        foreach ($exports as $export) {
            try {
                echo "  Processing export #{$export['id']}: {$export['report_type']} ({$export['format']})\n";
                
                // Fetch report data
                $filters = json_decode($export['filters'], true) ?? [];
                $data = fetchReportData($db, $export['workspace_id'], $export['report_type'], $filters);
                
                // Generate file based on format
                $filePath = $exportDir . '/' . $export['file_name'];
                
                switch ($export['format']) {
                    case 'pdf':
                        generatePDF($data, $export['report_type'], $filePath);
                        break;
                    case 'excel':
                        generateExcel($data, $export['report_type'], $filePath);
                        break;
                    case 'csv':
                    default:
                        generateCSV($data, $filePath);
                        break;
                }
                
                $fileSize = filesize($filePath);
                $fileUrl = '/exports/' . $export['file_name'];
                
                // Update export record
                $updateStmt = $db->prepare("
                    UPDATE report_exports 
                    SET status = 'completed', 
                        file_url = ?, 
                        file_size = ?,
                        expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY)
                    WHERE id = ?
                ");
                $updateStmt->execute([$fileUrl, $fileSize, $export['id']]);
                
                echo "  ✓ Generated {$export['format']} report: " . formatBytes($fileSize) . "\n";
                
            } catch (Exception $e) {
                echo "  ✗ Error generating export #{$export['id']}: " . $e->getMessage() . "\n";
                
                // Mark as failed
                $updateStmt = $db->prepare("
                    UPDATE report_exports 
                    SET status = 'failed'
                    WHERE id = ?
                ");
                $updateStmt->execute([$export['id']]);
            }
        }
        
        echo "\n";
        
    } catch (Exception $e) {
        echo "Worker Error: " . $e->getMessage() . "\n";
        sleep($sleepSeconds);
    }
    
    if ($isDaemon) {
        sleep($sleepSeconds);
    }
    
} while ($isDaemon);

echo "Report Generation Worker Stopped\n";

/**
 * Fetch report data from database
 */
function fetchReportData($db, $workspaceId, $reportType, $filters) {
    $startDate = $filters['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
    $endDate = $filters['end_date'] ?? date('Y-m-d');
    
    switch ($reportType) {
        case 'contacts':
            $stmt = $db->prepare("
                SELECT id, first_name, last_name, email, phone, 
                       company, created_at, status
                FROM contacts 
                WHERE workspace_id = ? AND created_at BETWEEN ? AND ?
                ORDER BY created_at DESC
                LIMIT 10000
            ");
            $stmt->execute([$workspaceId, $startDate, $endDate]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        case 'campaigns':
            $stmt = $db->prepare("
                SELECT id, name, type, status, 
                       sent_count, opened_count, clicked_count,
                       created_at, sent_at
                FROM campaigns 
                WHERE workspace_id = ? AND created_at BETWEEN ? AND ?
                ORDER BY created_at DESC
                LIMIT 1000
            ");
            $stmt->execute([$workspaceId, $startDate, $endDate]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        case 'revenue':
            $stmt = $db->prepare("
                SELECT DATE(created_at) as date, 
                       COUNT(*) as invoice_count,
                       SUM(total) as total_revenue,
                       SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid_revenue
                FROM invoices 
                WHERE workspace_id = ? AND created_at BETWEEN ? AND ?
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            ");
            $stmt->execute([$workspaceId, $startDate, $endDate]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        default:
            return [];
    }
}

/**
 * Generate CSV file
 */
function generateCSV($data, $filePath) {
    if (empty($data)) {
        throw new Exception('No data to export');
    }
    
    $fp = fopen($filePath, 'w');
    
    // Write headers
    fputcsv($fp, array_keys($data[0]));
    
    // Write data
    foreach ($data as $row) {
        fputcsv($fp, $row);
    }
    
    fclose($fp);
}

/**
 * Generate Excel file
 */
function generateExcel($data, $reportType, $filePath) {
    // Check if PhpSpreadsheet is available
    if (!class_exists('PhpOffice\PhpSpreadsheet\Spreadsheet')) {
        // Fallback to CSV if Excel library not available
        generateCSV($data, str_replace('.xlsx', '.csv', $filePath));
        return;
    }
    
    $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    
    // Set title
    $sheet->setTitle(ucfirst($reportType));
    
    if (empty($data)) {
        $sheet->setCellValue('A1', 'No data available');
    } else {
        // Write headers
        $headers = array_keys($data[0]);
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', ucfirst(str_replace('_', ' ', $header)));
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $col++;
        }
        
        // Write data
        $row = 2;
        foreach ($data as $dataRow) {
            $col = 'A';
            foreach ($dataRow as $value) {
                $sheet->setCellValue($col . $row, $value);
                $col++;
            }
            $row++;
        }
        
        // Auto-size columns
        foreach (range('A', $col) as $columnID) {
            $sheet->getColumnDimension($columnID)->setAutoSize(true);
        }
    }
    
    $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
    $writer->save($filePath);
}

/**
 * Generate PDF file
 */
function generatePDF($data, $reportType, $filePath) {
    // Check if TCPDF is available
    if (!class_exists('TCPDF')) {
        // Fallback to CSV if PDF library not available
        generateCSV($data, str_replace('.pdf', '.csv', $filePath));
        return;
    }
    
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
    
    // Set document information
    $pdf->SetCreator('Xordon');
    $pdf->SetAuthor('Xordon');
    $pdf->SetTitle(ucfirst($reportType) . ' Report');
    
    // Remove default header/footer
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    
    // Add page
    $pdf->AddPage();
    
    // Set font
    $pdf->SetFont('helvetica', '', 10);
    
    // Title
    $pdf->SetFont('helvetica', 'B', 16);
    $pdf->Cell(0, 10, ucfirst($reportType) . ' Report', 0, 1, 'C');
    $pdf->Ln(5);
    
    $pdf->SetFont('helvetica', '', 9);
    $pdf->Cell(0, 5, 'Generated: ' . date('Y-m-d H:i:s'), 0, 1, 'C');
    $pdf->Ln(10);
    
    if (empty($data)) {
        $pdf->Cell(0, 10, 'No data available', 0, 1, 'C');
    } else {
        // Create HTML table
        $html = '<table border="1" cellpadding="4">';
        
        // Headers
        $html .= '<tr style="background-color:#f0f0f0;font-weight:bold;">';
        foreach (array_keys($data[0]) as $header) {
            $html .= '<th>' . htmlspecialchars(ucfirst(str_replace('_', ' ', $header))) . '</th>';
        }
        $html .= '</tr>';
        
        // Data rows (limit to first 100 for PDF)
        foreach (array_slice($data, 0, 100) as $row) {
            $html .= '<tr>';
            foreach ($row as $value) {
                $html .= '<td>' . htmlspecialchars($value ?? '') . '</td>';
            }
            $html .= '</tr>';
        }
        
        $html .= '</table>';
        
        if (count($data) > 100) {
            $html .= '<p><i>Showing first 100 of ' . count($data) . ' records</i></p>';
        }
        
        $pdf->writeHTML($html, true, false, true, false, '');
    }
    
    $pdf->Output($filePath, 'F');
}

/**
 * Format bytes to human readable
 */
function formatBytes($bytes) {
    if ($bytes < 1024) return $bytes . ' B';
    if ($bytes < 1048576) return round($bytes / 1024, 2) . ' KB';
    return round($bytes / 1048576, 2) . ' MB';
}
