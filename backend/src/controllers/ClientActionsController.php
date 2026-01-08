<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class ClientActionsController {
    
    /**
     * Generate VCard for client download
     */
    public static function downloadVCard(string $companyId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Get company details
        $stmt = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
        $stmt->execute([$companyId]);
        $company = $stmt->fetch();
        
        if (!$company) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        // Get primary contact
        $contactStmt = $pdo->prepare("
            SELECT * FROM recipients 
            WHERE company_id = ? 
            ORDER BY created_at ASC 
            LIMIT 1
        ");
        $contactStmt->execute([$companyId]);
        $contact = $contactStmt->fetch();
        
        // Generate VCard
        $vcard = "BEGIN:VCARD\r\n";
        $vcard .= "VERSION:3.0\r\n";
        $vcard .= "FN:" . $company['name'] . "\r\n";
        $vcard .= "ORG:" . $company['name'] . "\r\n";
        
        if ($company['email']) {
            $vcard .= "EMAIL;TYPE=WORK:" . $company['email'] . "\r\n";
        }
        
        if ($company['phone']) {
            $vcard .= "TEL;TYPE=WORK:" . $company['phone'] . "\r\n";
        }
        
        if ($company['website']) {
            $vcard .= "URL:" . $company['website'] . "\r\n";
        }
        
        if ($company['address'] || $company['city'] || $company['state']) {
            $vcard .= "ADR;TYPE=WORK:;;" . 
                      ($company['address'] ?? '') . ";" . 
                      ($company['city'] ?? '') . ";" . 
                      ($company['state'] ?? '') . ";" . 
                      ($company['postal_code'] ?? '') . ";" . 
                      ($company['country'] ?? '') . "\r\n";
        }
        
        if ($contact) {
            $vcard .= "NOTE:Primary Contact: " . ($contact['first_name'] ?? '') . " " . ($contact['last_name'] ?? '') . "\r\n";
        }
        
        $vcard .= "END:VCARD\r\n";
        
        header('Content-Type: text/vcard; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . preg_replace('/[^a-z0-9]/i', '_', $company['name']) . '.vcf"');
        echo $vcard;
        exit;
    }
    
    /**
     * Send login email to client
     */
    public static function sendLoginEmail(string $companyId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Get company and primary contact
        $stmt = $pdo->prepare("SELECT * FROM companies WHERE id = ?");
        $stmt->execute([$companyId]);
        $company = $stmt->fetch();
        
        if (!$company) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        $contactStmt = $pdo->prepare("
            SELECT * FROM recipients 
            WHERE company_id = ? AND email IS NOT NULL 
            ORDER BY created_at ASC 
            LIMIT 1
        ");
        $contactStmt->execute([$companyId]);
        $contact = $contactStmt->fetch();
        
        if (!$contact || !$contact['email']) {
            Response::json(['error' => 'No contact email found'], 400);
            return;
        }
        
        // Generate magic link token
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        $tokenStmt = $pdo->prepare("
            INSERT INTO client_portal_sessions (
                workspace_id, company_id, contact_id, session_token, 
                admin_user_id, expires_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $tokenStmt->execute([
            $company['workspace_id'],
            $companyId,
            $contact['id'],
            $token,
            $userId,
            $expiresAt
        ]);
        
        // In production, send actual email here
        $loginUrl = "https://app.xordon.com/client-portal/login?token=" . $token;
        
        Response::json([
            'message' => 'Login email sent successfully',
            'loginUrl' => $loginUrl,
            'expiresAt' => $expiresAt
        ]);
    }
    
    /**
     * Create admin session to log in as client
     */
    public static function loginAsClient(string $companyId): void {
        $userId = Auth::userIdOrFail();
        $ctx = $GLOBALS['tenantContext'] ?? null;
        $pdo = Database::conn();
        
        // Only admins/owners can do this
        if (!$ctx || !in_array($ctx->workspaceRole, ['owner', 'admin'])) {
            Response::forbidden('Only workspace owners/admins can log in as clients');
            return;
        }
        
        // Get company
        $stmt = $pdo->prepare("SELECT * FROM companies WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$companyId, $ctx->workspaceId]);
        $company = $stmt->fetch();
        
        if (!$company) {
            Response::json(['error' => 'Company not found'], 404);
            return;
        }
        
        // Generate session token
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+8 hours'));
        
        $tokenStmt = $pdo->prepare("
            INSERT INTO client_portal_sessions (
                workspace_id, company_id, session_token, 
                admin_user_id, ip_address, user_agent, expires_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $tokenStmt->execute([
            $ctx->workspaceId,
            $companyId,
            $token,
            $userId,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            $expiresAt
        ]);
        
        Response::json([
            'sessionToken' => $token,
            'portalUrl' => "/client-portal?session=" . $token,
            'expiresAt' => $expiresAt
        ]);
    }
    
    /**
     * Get client overview stats
     */
    public static function getOverview(string $companyId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Get requests count
        $requestsStmt = $pdo->prepare("
            SELECT status, COUNT(*) as count 
            FROM work_requests 
            WHERE company_id = ? 
            GROUP BY status
        ");
        $requestsStmt->execute([$companyId]);
        $requests = $requestsStmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Get quotes count
        $quotesStmt = $pdo->prepare("
            SELECT status, COUNT(*) as count 
            FROM quotes 
            WHERE company_id = ? 
            GROUP BY status
        ");
        $quotesStmt->execute([$companyId]);
        $quotes = $quotesStmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Get jobs count
        $jobsStmt = $pdo->prepare("
            SELECT status, COUNT(*) as count 
            FROM jobs 
            WHERE company_id = ? 
            GROUP BY status
        ");
        $jobsStmt->execute([$companyId]);
        $jobs = $jobsStmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Get invoices
        $invoicesStmt = $pdo->prepare("
            SELECT status, COUNT(*) as count, SUM(total_amount) as total 
            FROM invoices 
            WHERE company_id = ? 
            GROUP BY status
        ");
        $invoicesStmt->execute([$companyId]);
        $invoices = $invoicesStmt->fetchAll();
        
        Response::json([
            'requests' => $requests,
            'quotes' => $quotes,
            'jobs' => $jobs,
            'invoices' => $invoices,
        ]);
    }
}
