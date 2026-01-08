<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class AgencyController {
    
    // Get all client accounts for the agency
    public static function getClients(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT ca.*, 
                   (SELECT COUNT(*) FROM contacts WHERE client_id = ca.id) as contact_count,
                   (SELECT COUNT(*) FROM campaigns WHERE client_id = ca.id) as campaign_count
            FROM client_accounts ca 
            WHERE ca.agency_user_id = ? 
            ORDER BY ca.name ASC
        ');
        $stmt->execute([$userId]);
        $clients = $stmt->fetchAll();
        
        Response::json(['items' => $clients]);
    }
    
    // Get single client
    public static function getClient(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM client_accounts WHERE id = ? AND agency_user_id = ?');
        $stmt->execute([$id, $userId]);
        $client = $stmt->fetch();
        
        if (!$client) {
            Response::error('Client not found', 404);
            return;
        }
        
        Response::json($client);
    }
    
    // Create client account
    public static function createClient(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        $name = trim($body['name'] ?? '');
        $slug = trim($body['slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]/', '-', $name)));
        
        if (!$name) {
            Response::error('Client name is required', 422);
            return;
        }
        
        $pdo = Database::conn();
        
        // Check for duplicate slug
        $stmt = $pdo->prepare('SELECT id FROM client_accounts WHERE agency_user_id = ? AND slug = ?');
        $stmt->execute([$userId, $slug]);
        if ($stmt->fetch()) {
            Response::error('A client with this slug already exists', 422);
            return;
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO client_accounts (agency_user_id, name, slug, logo_url, primary_color, domain, industry, website, contact_email, contact_phone, notes, status, settings, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $userId,
            $name,
            $slug,
            $body['logo_url'] ?? null,
            $body['primary_color'] ?? '#FF6B00',
            $body['domain'] ?? null,
            $body['industry'] ?? null,
            $body['website'] ?? null,
            $body['contact_email'] ?? null,
            $body['contact_phone'] ?? null,
            $body['notes'] ?? null,
            $body['status'] ?? 'active',
            json_encode($body['settings'] ?? [])
        ]);
        
        $id = (int)$pdo->lastInsertId();
        
        $stmt = $pdo->prepare('SELECT * FROM client_accounts WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($stmt->fetch(), 201);
    }
    
    // Update client
    public static function updateClient(string $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Verify ownership
        $stmt = $pdo->prepare('SELECT * FROM client_accounts WHERE id = ? AND agency_user_id = ?');
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            Response::error('Client not found', 404);
            return;
        }
        
        $stmt = $pdo->prepare('
            UPDATE client_accounts SET
                name = COALESCE(?, name),
                logo_url = COALESCE(?, logo_url),
                primary_color = COALESCE(?, primary_color),
                domain = COALESCE(?, domain),
                industry = COALESCE(?, industry),
                website = COALESCE(?, website),
                contact_email = COALESCE(?, contact_email),
                contact_phone = COALESCE(?, contact_phone),
                notes = COALESCE(?, notes),
                status = COALESCE(?, status),
                settings = COALESCE(?, settings),
                updated_at = NOW()
            WHERE id = ? AND agency_user_id = ?
        ');
        $stmt->execute([
            $body['name'] ?? null,
            $body['logo_url'] ?? null,
            $body['primary_color'] ?? null,
            $body['domain'] ?? null,
            $body['industry'] ?? null,
            $body['website'] ?? null,
            $body['contact_email'] ?? null,
            $body['contact_phone'] ?? null,
            $body['notes'] ?? null,
            $body['status'] ?? null,
            isset($body['settings']) ? json_encode($body['settings']) : null,
            $id,
            $userId
        ]);
        
        $stmt = $pdo->prepare('SELECT * FROM client_accounts WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($stmt->fetch());
    }
    
    // Delete client
    public static function deleteClient(string $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('DELETE FROM client_accounts WHERE id = ? AND agency_user_id = ?');
        $stmt->execute([$id, $userId]);
        
        if ($stmt->rowCount() === 0) {
            Response::error('Client not found', 404);
            return;
        }
        
        Response::json(['success' => true]);
    }
    
    // Get cross-client analytics
    public static function getCrossClientAnalytics(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Get all clients with their stats
        $stmt = $pdo->prepare('
            SELECT 
                ca.id,
                ca.name,
                ca.status,
                (SELECT COUNT(*) FROM contacts WHERE client_id = ca.id) as total_contacts,
                (SELECT COUNT(*) FROM campaigns WHERE client_id = ca.id) as total_campaigns,
                (SELECT COUNT(*) FROM campaigns WHERE client_id = ca.id AND status = "active") as active_campaigns
            FROM client_accounts ca
            WHERE ca.agency_user_id = ?
            ORDER BY ca.name
        ');
        $stmt->execute([$userId]);
        $clients = $stmt->fetchAll();
        
        // Calculate totals
        $totals = [
            'total_clients' => count($clients),
            'active_clients' => count(array_filter($clients, fn($c) => $c['status'] === 'active')),
            'total_contacts' => array_sum(array_column($clients, 'total_contacts')),
            'total_campaigns' => array_sum(array_column($clients, 'total_campaigns')),
            'active_campaigns' => array_sum(array_column($clients, 'active_campaigns'))
        ];
        
        Response::json([
            'clients' => $clients,
            'totals' => $totals
        ]);
    }
    
    // Get agency reports
    public static function getReports(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM agency_reports WHERE agency_user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$userId]);
        
        Response::json(['items' => $stmt->fetchAll()]);
    }
    
    // Create report
    public static function createReport(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            INSERT INTO agency_reports (agency_user_id, report_type, name, filters, columns, schedule, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $userId,
            $body['report_type'] ?? 'overview',
            $body['name'] ?? 'Untitled Report',
            json_encode($body['filters'] ?? []),
            json_encode($body['columns'] ?? []),
            $body['schedule'] ?? 'none'
        ]);
        
        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM agency_reports WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json($stmt->fetch(), 201);
    }
}
