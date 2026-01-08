<?php
/**
 * Multi-Tenant Controller
 * Handles agencies (organizations), subaccounts, and hierarchy management
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class MultiTenantController {
    
    private static function slugify(string $value): string {
        $slug = strtolower($value);
        $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug);
        return preg_replace('/-+/', '-', trim($slug, '-')) ?: 'item';
    }
    
    // ========== AGENCIES ==========
    
    public static function listAgencies(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('
            SELECT a.id, a.name, a.slug, a.status, a.max_subaccounts, a.created_at, am.role,
                   (SELECT COUNT(*) FROM subaccounts WHERE agency_id = a.id) as subaccount_count,
                   (SELECT COUNT(*) FROM agency_members WHERE agency_id = a.id) as member_count
            FROM agencies a
            JOIN agency_members am ON am.agency_id = a.id
            WHERE am.user_id = ? AND am.status = "active"
            ORDER BY a.name ASC
        ');
        $stmt->execute([$userId]);
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    public static function getCurrentAgency(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT agency_id FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user || !$user['agency_id']) {
            Response::json(null);
            return;
        }
        
        $stmt = $pdo->prepare('
            SELECT a.*, ab.logo_url, ab.primary_color, ab.secondary_color, ab.company_name,
                   (SELECT COUNT(*) FROM subaccounts WHERE agency_id = a.id) as subaccount_count
            FROM agencies a
            LEFT JOIN agency_branding ab ON ab.agency_id = a.id
            WHERE a.id = ?
        ');
        $stmt->execute([$user['agency_id']]);
        Response::json($stmt->fetch(PDO::FETCH_ASSOC) ?: null);
    }
    
    public static function getAgency(int $id): void {
        $userId = Auth::userIdOrFail();
        if (!self::hasAgencyAccess($userId, $id) && !self::hasAnySubaccountAccessInAgency($userId, $id)) {
            Response::forbidden('Access denied');
            return;
        }
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('
            SELECT a.*, ab.logo_url, ab.primary_color, ab.secondary_color, ab.company_name
            FROM agencies a
            LEFT JOIN agency_branding ab ON ab.agency_id = a.id
            WHERE a.id = ?
        ');
        $stmt->execute([$id]);
        Response::json($stmt->fetch(PDO::FETCH_ASSOC) ?: null);
    }
    
    public static function createAgency(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $body = get_json_body();
        
        $name = trim($body['name'] ?? '');
        if (!$name) {
            Response::error('Name is required', 422);
            return;
        }
        
        $slug = self::slugify($body['slug'] ?? $name);
        $check = $pdo->prepare('SELECT id FROM agencies WHERE slug = ?');
        $check->execute([$slug]);
        $i = 1;
        while ($check->fetch()) {
            $slug = self::slugify($body['slug'] ?? $name) . '-' . $i++;
            $check->execute([$slug]);
        }
        
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('INSERT INTO agencies (name, slug, owner_user_id, status) VALUES (?, ?, ?, "trial")');
            $stmt->execute([$name, $slug, $userId]);
            $agencyId = (int)$pdo->lastInsertId();
            
            $pdo->prepare('INSERT INTO agency_members (agency_id, user_id, role, status, joined_at) VALUES (?, ?, "owner", "active", NOW())')->execute([$agencyId, $userId]);
            $pdo->prepare('UPDATE users SET agency_id = ?, user_type = "agency_user" WHERE id = ?')->execute([$agencyId, $userId]);
            $pdo->prepare('INSERT INTO agency_branding (agency_id, company_name) VALUES (?, ?)')->execute([$agencyId, $name]);
            
            $pdo->commit();
            Response::json(['id' => $agencyId, 'name' => $name, 'slug' => $slug], 201);
        } catch (Throwable $e) {
            $pdo->rollBack();
            Response::error('Failed: ' . $e->getMessage(), 500);
        }
    }
    
    public static function updateAgency(int $id): void {
        $userId = Auth::userIdOrFail();
        if (!self::hasAgencyAccess($userId, $id, ['owner', 'admin'])) {
            Response::forbidden('Access denied');
            return;
        }
        
        $body = get_json_body();
        $pdo = Database::conn();
        $sets = []; $params = [];
        
        foreach (['name', 'max_subaccounts', 'max_users', 'max_contacts_per_subaccount', 'organization_type', 'custom_subaccount_label'] as $f) {
            if (isset($body[$f])) { $sets[] = "$f = ?"; $params[] = $body[$f]; }
        }
        if (empty($sets)) { Response::error('Nothing to update', 422); return; }
        
        $params[] = $id;
        $pdo->prepare('UPDATE agencies SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
        self::getAgency($id);
    }
    
    // ========== AGENCY BRANDING ==========
    
    public static function getAgencyBranding(int $id): void {
        $userId = Auth::userIdOrFail();
        if (!self::hasAgencyAccess($userId, $id) && !self::hasAnySubaccountAccessInAgency($userId, $id)) { 
            Response::forbidden('Access denied'); 
            return; 
        }
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT * FROM agency_branding WHERE agency_id = ?');
        $stmt->execute([$id]);
        Response::json($stmt->fetch(PDO::FETCH_ASSOC) ?: ['agency_id' => $id, 'primary_color' => '#3B82F6']);
    }
    
    public static function updateAgencyBranding(int $id): void {
        $userId = Auth::userIdOrFail();
        if (!self::hasAgencyAccess($userId, $id, ['owner', 'admin'])) { Response::forbidden('Access denied'); return; }
        
        $pdo = Database::conn();
        $body = get_json_body();
        $fields = ['logo_url', 'favicon_url', 'primary_color', 'secondary_color', 'accent_color', 'company_name', 'support_email', 'support_phone', 'login_page_title', 'login_page_description', 'login_background_url', 'email_from_name', 'email_from_address', 'email_footer_text', 'custom_css', 'font_family'];
        
        $sets = []; $params = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $body)) { $sets[] = "$f = ?"; $params[] = $body[$f]; }
        }
        
        if (!empty($sets)) {
            $params[] = $id;
            $pdo->prepare('UPDATE agency_branding SET ' . implode(', ', $sets) . ' WHERE agency_id = ?')->execute($params);
        }
        self::getAgencyBranding($id);
    }
    
    // ========== AGENCY MEMBERS ==========
    
    public static function getAgencyMembers(int $id): void {
        $userId = Auth::userIdOrFail();
        if (!self::hasAgencyAccess($userId, $id)) { Response::forbidden('Access denied'); return; }
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('
            SELECT am.id, am.user_id, am.role, am.status, am.joined_at, u.name, u.email
            FROM agency_members am JOIN users u ON u.id = am.user_id
            WHERE am.agency_id = ? ORDER BY FIELD(am.role, "owner", "admin", "member"), u.name
        ');
        $stmt->execute([$id]);
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    // ========== SUBACCOUNTS ==========
    
    public static function listSubaccounts(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        if (!self::hasAgencyAccess($userId, $agencyId)) { Response::forbidden('Access denied'); return; }
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('
            SELECT s.*, 
                   (SELECT COUNT(*) FROM subaccount_members WHERE subaccount_id = s.id) as member_count
            FROM subaccounts s
            WHERE s.agency_id = ?
            ORDER BY s.name ASC
        ');
        $stmt->execute([$agencyId]);
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    
    public static function getSubaccount(int $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT * FROM subaccounts WHERE id = ?');
        $stmt->execute([$id]);
        $sub = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$sub) { Response::notFound('Subaccount not found'); return; }
        if (!self::hasAgencyAccess($userId, $sub['agency_id'])) { Response::forbidden('Access denied'); return; }
        
        Response::json($sub);
    }
    
    public static function createSubaccount(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        if (!self::hasAgencyAccess($userId, $agencyId, ['owner', 'admin'])) { Response::forbidden('Access denied'); return; }
        
        $pdo = Database::conn();
        $body = get_json_body();
        
        $name = trim($body['name'] ?? '');
        if (!$name) { Response::error('Name is required', 422); return; }
        
        // Check limit
        $stmt = $pdo->prepare('SELECT max_subaccounts, (SELECT COUNT(*) FROM subaccounts WHERE agency_id = ?) as current FROM agencies WHERE id = ?');
        $stmt->execute([$agencyId, $agencyId]);
        $agency = $stmt->fetch();
        if ($agency && $agency['max_subaccounts'] > 0 && $agency['current'] >= $agency['max_subaccounts']) {
            Response::error('Subaccount limit reached', 422);
            return;
        }
        
        $slug = self::slugify($body['slug'] ?? $name);
        $check = $pdo->prepare('SELECT id FROM subaccounts WHERE agency_id = ? AND slug = ?');
        $check->execute([$agencyId, $slug]);
        $i = 1;
        while ($check->fetch()) {
            $slug = self::slugify($body['slug'] ?? $name) . '-' . $i++;
            $check->execute([$agencyId, $slug]);
        }
        
        $stmt = $pdo->prepare('
            INSERT INTO subaccounts (agency_id, name, slug, industry, timezone, email, phone, website, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $agencyId, $name, $slug,
            $body['industry'] ?? null,
            $body['timezone'] ?? 'UTC',
            $body['email'] ?? null,
            $body['phone'] ?? null,
            $body['website'] ?? null,
            $userId
        ]);
        
        $subId = (int)$pdo->lastInsertId();
        
        // Add creator as admin
        $pdo->prepare('INSERT INTO subaccount_members (subaccount_id, user_id, role, status, joined_at) VALUES (?, ?, "admin", "active", NOW())')->execute([$subId, $userId]);
        
        Response::json(['id' => $subId, 'name' => $name, 'slug' => $slug], 201);
    }
    
    public static function updateSubaccount(int $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT agency_id FROM subaccounts WHERE id = ?');
        $stmt->execute([$id]);
        $sub = $stmt->fetch();
        if (!$sub) { Response::notFound('Subaccount not found'); return; }
        if (!self::hasAgencyAccess($userId, $sub['agency_id'], ['owner', 'admin'])) { Response::forbidden('Access denied'); return; }
        
        $body = get_json_body();
        $sets = []; $params = [];
        foreach (['name', 'industry', 'timezone', 'email', 'phone', 'website', 'status', 'logo_url'] as $f) {
            if (array_key_exists($f, $body)) { $sets[] = "$f = ?"; $params[] = $body[$f]; }
        }
        if (empty($sets)) { Response::error('Nothing to update', 422); return; }
        
        $params[] = $id;
        $pdo->prepare('UPDATE subaccounts SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
        self::getSubaccount($id);
    }
    
    public static function deleteSubaccount(int $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT agency_id FROM subaccounts WHERE id = ?');
        $stmt->execute([$id]);
        $sub = $stmt->fetch();
        if (!$sub) { Response::notFound('Subaccount not found'); return; }
        if (!self::hasAgencyAccess($userId, $sub['agency_id'], ['owner'])) { Response::forbidden('Only agency owner can delete subaccounts'); return; }
        
        $pdo->prepare('DELETE FROM subaccounts WHERE id = ?')->execute([$id]);
        Response::json(['success' => true]);
    }
    
    // ========== SUBACCOUNT MEMBERS ==========
    
    public static function getSubaccountMembers(int $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT agency_id FROM subaccounts WHERE id = ?');
        $stmt->execute([$id]);
        $sub = $stmt->fetch();
        if (!$sub || !self::hasAgencyAccess($userId, $sub['agency_id'])) { Response::forbidden('Access denied'); return; }
        
        $stmt = $pdo->prepare('
            SELECT sm.id, sm.user_id, sm.role, sm.status, u.name, u.email
            FROM subaccount_members sm JOIN users u ON u.id = sm.user_id
            WHERE sm.subaccount_id = ? ORDER BY sm.role DESC, u.name
        ');
        $stmt->execute([$id]);
        Response::json(['items' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    public static function inviteSubaccountMember(int $id): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        
        $email = $body['email'] ?? '';
        $role = $body['role'] ?? 'user';
        
        if (!$email) { Response::error('Email is required', 422); return; }
        
        try {
            $rbac = MultiTenantRBACService::getInstance();
            $result = $rbac->inviteToSubaccount($id, $email, $role, $userId);
            Response::json($result);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }
    
    // ========== CONTEXT SWITCHING ==========
    
    public static function switchSubaccount(int $subaccountId): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        // Verify access: Either agency member OR subaccount member
        $stmt = $pdo->prepare('
            SELECT s.id, s.agency_id, s.name FROM subaccounts s
            LEFT JOIN agency_members am ON am.agency_id = s.agency_id AND am.user_id = ? AND am.status = "active"
            LEFT JOIN subaccount_members sm ON sm.subaccount_id = s.id AND sm.user_id = ? AND sm.status = "active"
            WHERE s.id = ? AND (am.user_id IS NOT NULL OR sm.user_id IS NOT NULL)
        ');
        $stmt->execute([$userId, $userId, $subaccountId]);
        $sub = $stmt->fetch();
        
        if (!$sub) { Response::forbidden('You do not have access to this subaccount'); return; }
        
        // Update user current subaccount
        $pdo->prepare('UPDATE users SET current_subaccount_id = ? WHERE id = ?')->execute([$subaccountId, $userId]);
        
        Response::json(['success' => true, 'subaccount' => $sub]);
    }
    
    public static function getCurrentSubaccount(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT current_subaccount_id FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user || !$user['current_subaccount_id']) {
            Response::json(null);
            return;
        }
        
        $stmt = $pdo->prepare('SELECT * FROM subaccounts WHERE id = ?');
        $stmt->execute([$user['current_subaccount_id']]);
        Response::json($stmt->fetch(PDO::FETCH_ASSOC) ?: null);
    }
    
    // ========== SUBACCOUNT SETTINGS & FEATURES ==========

    public static function getSubaccountSettings(int $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT agency_id FROM subaccounts WHERE id = ?');
        $stmt->execute([$id]);
        $sub = $stmt->fetch();
        if (!$sub) { Response::notFound('Subaccount not found'); return; }
        
        if (!self::hasAgencyAccess($userId, $sub['agency_id']) && !self::isSubaccountMember($userId, $id)) {
            Response::forbidden('Access denied');
            return;
        }

        $stmt = $pdo->prepare('SELECT * FROM subaccount_settings WHERE subaccount_id = ?');
        $stmt->execute([$id]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$settings) {
            $settings = [
                'subaccount_id' => $id,
                'features' => [
                    'crm' => true,
                    'email' => true,
                    'sms' => false,
                    'calls' => false,
                    'automations' => true,
                    'reporting' => true,
                    'ai' => false
                ],
                'limits' => ['contacts' => 1000, 'emails_per_month' => 5000],
            ];
        } else {
            foreach (['features', 'limits', 'integrations', 'notifications'] as $f) {
                if (isset($settings[$f])) {
                    $settings[$f] = json_decode($settings[$f] ?? '{}', true);
                }
            }
        }

        Response::json($settings);
    }

    public static function updateSubaccountSettings(int $id): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT agency_id FROM subaccounts WHERE id = ?');
        $stmt->execute([$id]);
        $sub = $stmt->fetch();
        if (!$sub) { Response::notFound('Subaccount not found'); return; }
        
        if (!self::hasAgencyAccess($userId, $sub['agency_id'], ['owner', 'admin'])) {
            Response::forbidden('Access denied');
            return;
        }

        $body = get_json_body();
        $fields = ['features', 'limits', 'integrations', 'notifications'];
        $updateValues = [];
        
        foreach ($fields as $f) {
            if (isset($body[$f])) {
                $updateValues[$f] = is_array($body[$f]) ? json_encode($body[$f]) : $body[$f];
            }
        }
        
        if (empty($updateValues)) { Response::error('No data provided', 422); return; }

        $cols = array_keys($updateValues);
        $placeholders = array_fill(0, count($cols), '?');
        $updates = array_map(fn($c) => "$c = VALUES($c)", $cols);
        
        $sql = "INSERT INTO subaccount_settings (subaccount_id, " . implode(', ', $cols) . ") 
                VALUES (?, " . implode(', ', $placeholders) . ") 
                ON DUPLICATE KEY UPDATE " . implode(', ', $updates);
        
        $params = array_merge([$id], array_values($updateValues));
        $pdo->prepare($sql)->execute($params);

        self::getSubaccountSettings($id);
    }

    // ========== HELPERS ==========
    
    private static function isSubaccountMember(int $userId, int $subaccountId): bool {
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT 1 FROM subaccount_members WHERE subaccount_id = ? AND user_id = ? AND status = "active"');
        $stmt->execute([$subaccountId, $userId]);
        return (bool)$stmt->fetch();
    }

    private static function hasAgencyAccess(int $userId, int $agencyId, array $roles = []): bool {
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT role FROM agency_members WHERE agency_id = ? AND user_id = ? AND status = "active"');
        $stmt->execute([$agencyId, $userId]);
        $m = $stmt->fetch();
        if (!$m) return false;
        return empty($roles) || in_array($m['role'], $roles);
    }

    private static function hasAnySubaccountAccessInAgency(int $userId, int $agencyId): bool {
        $pdo = Database::conn();
        $stmt = $pdo->prepare('
            SELECT 1 FROM subaccount_members sm
            JOIN subaccounts s ON s.id = sm.subaccount_id
            WHERE s.agency_id = ? AND sm.user_id = ? AND sm.status = "active"
            LIMIT 1
        ');
        $stmt->execute([$agencyId, $userId]);
        return (bool)$stmt->fetch();
    }
}
