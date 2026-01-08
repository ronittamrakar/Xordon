<?php

namespace Xordon\Controllers;

use Xordon\Core\Database;
use Xordon\Core\Auth;
use Xordon\Core\Response;

class DunningController {
    
    public static function listSchedules() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("SELECT * FROM dunning_schedules WHERE workspace_id = ? ORDER BY days_after_due ASC");
        $stmt->execute([$ctx->workspaceId]);
        $schedules = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($schedules);
    }
    
    public static function createSchedule() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $name = $data['name'] ?? null;
        $daysAfterDue = $data['days_after_due'] ?? null;
        
        if (!$name || $daysAfterDue === null) {
            return Response::error('Name and days_after_due required', 400);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            INSERT INTO dunning_schedules 
            (workspace_id, name, days_after_due, email_template_id, sms_template_id, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $ctx->workspaceId,
            $name,
            $daysAfterDue,
            $data['email_template_id'] ?? null,
            $data['sms_template_id'] ?? null,
            $data['is_active'] ?? true
        ]);
        
        $scheduleId = $db->lastInsertId();
        
        $stmt = $db->prepare("SELECT * FROM dunning_schedules WHERE id = ?");
        $stmt->execute([$scheduleId]);
        $schedule = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return Response::success($schedule);
    }
    
    public static function updateSchedule($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $fields = [];
        $params = [];
        
        $allowedFields = ['name', 'days_after_due', 'email_template_id', 'sms_template_id', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return Response::error('No fields to update', 400);
        }
        
        $params[] = $id;
        $params[] = $ctx->workspaceId;
        
        $sql = "UPDATE dunning_schedules SET " . implode(', ', $fields) . " WHERE id = ? AND workspace_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        $stmt = $db->prepare("SELECT * FROM dunning_schedules WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        $schedule = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        return Response::success($schedule);
    }
    
    public static function deleteSchedule($id) {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("DELETE FROM dunning_schedules WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$id, $ctx->workspaceId]);
        
        return Response::success(['deleted' => true]);
    }
    
    public static function getOverdueInvoices() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT 
                i.*,
                DATEDIFF(CURDATE(), i.due_date) as days_overdue,
                c.first_name, c.last_name, c.email, c.phone
            FROM invoices i
            LEFT JOIN contacts c ON c.id = i.contact_id
            WHERE i.workspace_id = ?
            AND i.status IN ('sent', 'partial')
            AND i.due_date < CURDATE()
            AND i.amount_due > 0
            AND (i.dunning_enabled = 1 OR i.dunning_enabled IS NULL)
            ORDER BY i.due_date ASC
        ");
        $stmt->execute([$ctx->workspaceId]);
        $invoices = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return Response::success($invoices);
    }
    
    public static function processReminders() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        // Get active dunning schedules
        $stmt = $db->prepare("SELECT * FROM dunning_schedules WHERE workspace_id = ? AND is_active = 1");
        $stmt->execute([$ctx->workspaceId]);
        $schedules = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        $sentCount = 0;
        
        // Load services
        require_once __DIR__ . '/../services/SimpleMail.php';
        require_once __DIR__ . '/../services/SMSService.php';
        
        $mailService = new \SimpleMail();
        $smsService = new \SMSService(null, (string)Auth::userId());
        
        foreach ($schedules as $schedule) {
            // Find invoices that match this schedule
            $stmt = $db->prepare("
                SELECT i.*, c.email, c.phone, c.first_name, c.last_name, c.company
                FROM invoices i
                LEFT JOIN contacts c ON c.id = i.contact_id
                WHERE i.workspace_id = ?
                AND i.status IN ('sent', 'partial')
                AND i.amount_due > 0
                AND DATEDIFF(CURDATE(), i.due_date) = ?
                AND (i.last_dunning_sent_at IS NULL OR DATE(i.last_dunning_sent_at) < CURDATE())
            ");
            $stmt->execute([$ctx->workspaceId, $schedule['days_after_due']]);
            $invoices = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            
            foreach ($invoices as $invoice) {
                $variables = self::getTemplateVars($invoice, $schedule['days_after_due']);

                // Send reminder (email/SMS based on template)
                if ($schedule['email_template_id'] && $invoice['email']) {
                    $tStmt = $db->prepare("SELECT subject, html_content FROM templates WHERE id = ?");
                    $tStmt->execute([$schedule['email_template_id']]);
                    $template = $tStmt->fetch();
                    
                    if ($template) {
                        $subject = self::replaceVars($template['subject'], $variables);
                        $body = self::replaceVars($template['html_content'], $variables);
                        
                        $saStmt = $db->prepare("SELECT * FROM sending_accounts WHERE workspace_id = ? AND status = 'active' LIMIT 1");
                        $saStmt->execute([$ctx->workspaceId]);
                        $sendingAccount = $saStmt->fetch();
                        
                        if ($sendingAccount) {
                            $mailService->sendEmail($sendingAccount, $invoice['email'], $subject, $body);
                        }
                    }
                }
                
                if ($schedule['sms_template_id'] && $invoice['phone']) {
                    $stStmt = $db->prepare("SELECT message FROM sms_templates WHERE id = ?");
                    $stStmt->execute([$schedule['sms_template_id']]);
                    $smsTemplate = $stStmt->fetch();
                    
                    if ($smsTemplate) {
                        $msg = self::replaceVars($smsTemplate['message'], $variables);
                        try {
                            $smsService->sendMessage($invoice['phone'], $msg);
                        } catch (\Exception $e) {
                            error_log("Dunning SMS failed: " . $e->getMessage());
                        }
                    }
                }
                
                // Update invoice
                $stmt = $db->prepare("
                    UPDATE invoices 
                    SET last_dunning_sent_at = NOW(), dunning_count = dunning_count + 1
                    WHERE id = ?
                ");
                $stmt->execute([$invoice['id']]);
                
                $sentCount++;
            }
        }
        
        return Response::success([
            'reminders_sent' => $sentCount,
            'schedules_processed' => count($schedules)
        ]);
    }
    
    public static function sendManualReminder($invoiceId) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            return Response::error('Unauthorized', 401);
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            SELECT i.*, c.email, c.phone, c.first_name, c.last_name, c.company
            FROM invoices i
            LEFT JOIN contacts c ON c.id = i.contact_id
            WHERE i.id = ? AND i.workspace_id = ?
        ");
        $stmt->execute([$invoiceId, $ctx->workspaceId]);
        $invoice = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$invoice) {
            return Response::error('Invoice not found', 404);
        }
        
        $channel = $data['channel'] ?? 'email';
        $message = $data['message'] ?? null;
        
        if (!$message) {
            return Response::error('Message content is required', 400);
        }

        // Process variables in manual message too
        $variables = self::getTemplateVars($invoice, (int)floor((time() - strtotime($invoice['due_date'])) / 86400));
        $processedMessage = self::replaceVars($message, $variables);

        if ($channel === 'email' && $invoice['email']) {
            require_once __DIR__ . '/../services/SimpleMail.php';
            $mailService = new \SimpleMail();
            
            $saStmt = $db->prepare("SELECT * FROM sending_accounts WHERE workspace_id = ? AND status = 'active' LIMIT 1");
            $saStmt->execute([$ctx->workspaceId]);
            $sendingAccount = $saStmt->fetch();
            
            if ($sendingAccount) {
                $mailService->sendEmail($sendingAccount, $invoice['email'], "Reminder: Invoice " . $invoice['invoice_number'], $processedMessage);
            } else {
                return Response::error('No active sending account found', 400);
            }
        } elseif ($channel === 'sms' && $invoice['phone']) {
            require_once __DIR__ . '/../services/SMSService.php';
            $smsService = new \SMSService(null, (string)Auth::userId());
            $smsService->sendMessage($invoice['phone'], $processedMessage);
        } else {
            return Response::error('Invalid channel or contact info missing', 400);
        }
        
        // Update invoice
        $stmt = $db->prepare("
            UPDATE invoices 
            SET last_dunning_sent_at = NOW(), dunning_count = dunning_count + 1
            WHERE id = ?
        ");
        $stmt->execute([$invoiceId]);
        
        return Response::success(['sent' => true]);
    }

    private static function getTemplateVars($invoice, $daysOverdue) {
        $baseUrl = $_ENV['APP_URL'] ?? 'http://localhost:5173';
        return [
            'first_name' => $invoice['first_name'] ?? 'Customer',
            'last_name' => $invoice['last_name'] ?? '',
            'name' => trim(($invoice['first_name'] ?? 'Customer') . ' ' . ($invoice['last_name'] ?? '')),
            'company' => $invoice['company'] ?? '',
            'invoice_number' => $invoice['invoice_number'],
            'amount_due' => number_format($invoice['amount_due'], 2),
            'total_amount' => number_format($invoice['total'], 2),
            'due_date' => $invoice['due_date'],
            'days_overdue' => $daysOverdue,
            'currency' => $invoice['currency'] ?? 'USD',
            'payment_url' => $baseUrl . '/checkout/' . $invoice['payment_link']
        ];
    }

    private static function replaceVars($text, $vars) {
        foreach ($vars as $k => $v) {
            $text = str_replace(['{{'.$k.'}}', '{'.$k.'}'], (string)$v, $text);
        }
        return $text;
    }
}
