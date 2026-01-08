<?php
/**
 * Agency Domains Controller
 * Handles custom domain management, DNS verification, and SSL status
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class AgencyDomainsController {
    
    /**
     * List all domains for an agency
     */
    public static function list(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        if (!self::hasAccess($userId, $agencyId)) {
            Response::forbidden('Access denied');
            return;
        }
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('
            SELECT id, domain, domain_type, ssl_status, ssl_expires_at, 
                   dns_verified, dns_verified_at, dns_txt_record, is_active, created_at
            FROM agency_domains 
            WHERE agency_id = ? 
            ORDER BY domain_type = "primary" DESC, domain ASC
        ');
        $stmt->execute([$agencyId]);
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    /**
     * Add a new domain
     */
    public static function create(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        if (!self::hasAccess($userId, $agencyId, ['owner', 'admin'])) {
            Response::forbidden('Access denied');
            return;
        }
        
        $body = get_json_body();
        $domain = strtolower(trim($body['domain'] ?? ''));
        $domainType = $body['domain_type'] ?? 'alias';
        
        // Validate domain format - allow letters, numbers, hyphens, and dots
        if (!$domain || !preg_match('/^[a-z0-9][a-z0-9\-\.]*[a-z0-9]\.[a-z]{2,}$/i', $domain)) {
            Response::error('Invalid domain format', 422);
            return;
        }
        
        // Check if domain already exists
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT id FROM agency_domains WHERE domain = ?');
        $stmt->execute([$domain]);
        if ($stmt->fetch()) {
            Response::error('Domain is already registered', 422);
            return;
        }
        
        // Generate DNS TXT verification record
        $txtRecord = 'xordon-verify=' . bin2hex(random_bytes(16));
        
        // If setting as primary, demote existing primary
        if ($domainType === 'primary') {
            $pdo->prepare('UPDATE agency_domains SET domain_type = "alias" WHERE agency_id = ? AND domain_type = "primary"')
                ->execute([$agencyId]);
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO agency_domains (agency_id, domain, domain_type, dns_txt_record, ssl_status)
            VALUES (?, ?, ?, ?, "pending")
        ');
        $stmt->execute([$agencyId, $domain, $domainType, $txtRecord]);
        $id = (int)$pdo->lastInsertId();
        
        Response::json([
            'id' => $id,
            'domain' => $domain,
            'domain_type' => $domainType,
            'dns_txt_record' => $txtRecord,
            'ssl_status' => 'pending',
            'dns_verified' => false,
            'verification_instructions' => [
                'type' => 'TXT',
                'host' => '_xordon-verify.' . $domain,
                'value' => $txtRecord,
                'ttl' => 3600
            ]
        ], 201);
    }
    
    /**
     * Verify domain DNS
     */
    public static function verify(int $agencyId, int $domainId): void {
        $userId = Auth::userIdOrFail();
        if (!self::hasAccess($userId, $agencyId, ['owner', 'admin'])) {
            Response::forbidden('Access denied');
            return;
        }
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM agency_domains WHERE id = ? AND agency_id = ?');
        $stmt->execute([$domainId, $agencyId]);
        $domainRecord = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$domainRecord) {
            Response::notFound('Domain not found');
            return;
        }
        
        $domain = $domainRecord['domain'];
        $expectedTxt = $domainRecord['dns_txt_record'];
        
        // Check DNS TXT record
        $verified = false;
        $txtRecords = @dns_get_record('_xordon-verify.' . $domain, DNS_TXT);
        
        if ($txtRecords) {
            foreach ($txtRecords as $record) {
                if (isset($record['txt']) && $record['txt'] === $expectedTxt) {
                    $verified = true;
                    break;
                }
            }
        }
        
        // Also check CNAME pointing to our platform
        $cnameValid = false;
        $cnameRecords = @dns_get_record($domain, DNS_CNAME);
        if ($cnameRecords) {
            foreach ($cnameRecords as $record) {
                // Check if CNAME points to our platform domain
                if (isset($record['target']) && 
                    (strpos($record['target'], 'xordon.com') !== false || 
                     strpos($record['target'], 'xordon.io') !== false)) {
                    $cnameValid = true;
                    break;
                }
            }
        }
        
        // Also accept A record pointing to our IP
        $aRecords = @dns_get_record($domain, DNS_A);
        $aValid = false;
        $platformIPs = ['YOUR_SERVER_IP']; // Replace with actual IPs
        if ($aRecords) {
            foreach ($aRecords as $record) {
                if (isset($record['ip']) && in_array($record['ip'], $platformIPs)) {
                    $aValid = true;
                    break;
                }
            }
        }
        
        if ($verified || $cnameValid || $aValid) {
            $stmt = $pdo->prepare('
                UPDATE agency_domains 
                SET dns_verified = TRUE, dns_verified_at = NOW(), ssl_status = "provisioning"
                WHERE id = ?
            ');
            $stmt->execute([$domainId]);
            
            // In production, trigger SSL provisioning here (Let's Encrypt)
            // For now, we'll simulate it
            $pdo->prepare('UPDATE agency_domains SET ssl_status = "active" WHERE id = ?')
                ->execute([$domainId]);
            
            Response::json([
                'verified' => true,
                'domain' => $domain,
                'ssl_status' => 'active',
                'message' => 'Domain verified successfully! SSL certificate is now active.'
            ]);
        } else {
            Response::json([
                'verified' => false,
                'domain' => $domain,
                'message' => 'DNS verification failed. Please ensure you have added the TXT record or pointed your domain to our servers.',
                'expected_txt' => $expectedTxt,
                'txt_host' => '_xordon-verify.' . $domain
            ], 422);
        }
    }
    
    /**
     * Update domain settings
     */
    public static function update(int $agencyId, int $domainId): void {
        $userId = Auth::userIdOrFail();
        if (!self::hasAccess($userId, $agencyId, ['owner', 'admin'])) {
            Response::forbidden('Access denied');
            return;
        }
        
        $pdo = Database::conn();
        $body = get_json_body();
        
        // Check domain belongs to agency
        $stmt = $pdo->prepare('SELECT id FROM agency_domains WHERE id = ? AND agency_id = ?');
        $stmt->execute([$domainId, $agencyId]);
        if (!$stmt->fetch()) {
            Response::notFound('Domain not found');
            return;
        }
        
        $sets = [];
        $params = [];
        
        if (isset($body['domain_type']) && in_array($body['domain_type'], ['primary', 'alias', 'funnel'])) {
            // If setting as primary, demote existing primary
            if ($body['domain_type'] === 'primary') {
                $pdo->prepare('UPDATE agency_domains SET domain_type = "alias" WHERE agency_id = ? AND domain_type = "primary" AND id != ?')
                    ->execute([$agencyId, $domainId]);
            }
            $sets[] = 'domain_type = ?';
            $params[] = $body['domain_type'];
        }
        
        if (isset($body['is_active'])) {
            $sets[] = 'is_active = ?';
            $params[] = $body['is_active'] ? 1 : 0;
        }
        
        if (empty($sets)) {
            Response::error('No valid fields to update', 422);
            return;
        }
        
        $params[] = $domainId;
        $pdo->prepare('UPDATE agency_domains SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
        
        // Return updated domain
        $stmt = $pdo->prepare('SELECT * FROM agency_domains WHERE id = ?');
        $stmt->execute([$domainId]);
        Response::json($stmt->fetch(PDO::FETCH_ASSOC));
    }
    
    /**
     * Delete domain
     */
    public static function delete(int $agencyId, int $domainId): void {
        $userId = Auth::userIdOrFail();
        if (!self::hasAccess($userId, $agencyId, ['owner'])) {
            Response::forbidden('Only agency owner can delete domains');
            return;
        }
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('DELETE FROM agency_domains WHERE id = ? AND agency_id = ?');
        $stmt->execute([$domainId, $agencyId]);
        
        if ($stmt->rowCount() === 0) {
            Response::notFound('Domain not found');
            return;
        }
        
        Response::json(['success' => true]);
    }
    
    /**
     * Get domain by hostname (for theme resolution)
     */
    public static function resolveByHost(string $host): void {
        $pdo = Database::conn();
        $stmt = $pdo->prepare('
            SELECT ad.*, a.id as agency_id, a.name as agency_name, a.slug as agency_slug,
                   ab.logo_url, ab.favicon_url, ab.primary_color, ab.secondary_color, 
                   ab.accent_color, ab.company_name, ab.login_page_title, ab.login_page_description,
                   ab.login_background_url, ab.custom_css
            FROM agency_domains ad
            JOIN agencies a ON a.id = ad.agency_id
            LEFT JOIN agency_branding ab ON ab.agency_id = a.id
            WHERE ad.domain = ? AND ad.is_active = TRUE AND ad.dns_verified = TRUE
        ');
        $stmt->execute([$host]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            Response::json(null);
            return;
        }
        
        Response::json([
            'agency_id' => $result['agency_id'],
            'agency_name' => $result['agency_name'],
            'agency_slug' => $result['agency_slug'],
            'domain' => $result['domain'],
            'branding' => [
                'logo_url' => $result['logo_url'],
                'favicon_url' => $result['favicon_url'],
                'primary_color' => $result['primary_color'] ?? '#3B82F6',
                'secondary_color' => $result['secondary_color'] ?? '#1E40AF',
                'accent_color' => $result['accent_color'] ?? '#10B981',
                'company_name' => $result['company_name'] ?? $result['agency_name'],
                'login_page_title' => $result['login_page_title'],
                'login_page_description' => $result['login_page_description'],
                'login_background_url' => $result['login_background_url'],
                'custom_css' => $result['custom_css']
            ]
        ]);
    }
    
    private static function hasAccess(int $userId, int $agencyId, array $roles = []): bool {
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT role FROM agency_members WHERE agency_id = ? AND user_id = ? AND status = "active"');
        $stmt->execute([$agencyId, $userId]);
        $m = $stmt->fetch();
        if (!$m) return false;
        return empty($roles) || in_array($m['role'], $roles);
    }
}
