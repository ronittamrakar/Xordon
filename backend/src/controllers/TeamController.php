<?php
/**
 * Team Management Controller
 * Handles agency/subaccount member invitations, role changes, and team administration
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/MultiTenantRBACService.php';

class TeamController {
    
    // ========================================
    // AGENCY TEAM MANAGEMENT
    // ========================================
    
    /**
     * List agency team members
     * GET /mt/agencies/:id/team
     */
    public static function listAgencyTeam(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        $role = $rbac->getAgencyRole($userId, $agencyId);
        if (!$role) {
            Response::forbidden('You do not have access to this agency');
            return;
        }
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('
            SELECT am.id, am.user_id, am.role, am.status, am.invited_at, am.joined_at,
                   u.name, u.email, u.last_login,
                   iu.name as invited_by_name
            FROM agency_members am
            JOIN users u ON u.id = am.user_id
            LEFT JOIN users iu ON iu.id = am.invited_by
            WHERE am.agency_id = ?
            ORDER BY 
                FIELD(am.role, "owner", "admin", "member"),
                am.status = "active" DESC,
                u.name ASC
        ');
        $stmt->execute([$agencyId]);
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get pending invites count
        $pendingCount = count(array_filter($members, fn($m) => $m['status'] === 'invited'));
        
        Response::json([
            'items' => $members,
            'pending_invites' => $pendingCount,
            'total' => count($members)
        ]);
    }
    
    /**
     * Invite member to agency
     * POST /mt/agencies/:id/team/invite
     */
    public static function inviteToAgency(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        if (!$rbac->isAgencyAdmin($userId, $agencyId)) {
            Response::forbidden('Only agency owners and admins can invite members');
            return;
        }
        
        $body = get_json_body();
        $email = trim($body['email'] ?? '');
        $role = $body['role'] ?? 'member';
        $sendEmail = $body['send_email'] ?? true;
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email address', 422);
            return;
        }
        
        try {
            $result = $rbac->inviteToAgency($agencyId, $email, $role, $userId, $sendEmail);
            Response::json($result, 201);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 422);
        }
    }
    
    /**
     * Accept agency invitation
     * POST /mt/invites/accept
     */
    public static function acceptInvite(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $token = $body['token'] ?? '';
        
        if (!$token) {
            Response::error('Invitation token is required', 422);
            return;
        }
        
        $rbac = MultiTenantRBACService::getInstance();
        
        try {
            $success = $rbac->acceptAgencyInvite($token, $userId);
            if ($success) {
                Response::json(['success' => true, 'message' => 'Invitation accepted']);
            } else {
                Response::error('Invalid or expired invitation', 422);
            }
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    }
    
    /**
     * Update member role
     * PUT /mt/agencies/:id/team/:memberId
     */
    public static function updateAgencyMember(int $agencyId, int $memberId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        $body = get_json_body();
        $newRole = $body['role'] ?? null;
        
        if (!$newRole) {
            Response::error('Role is required', 422);
            return;
        }
        
        // Get target user ID from member ID
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT user_id FROM agency_members WHERE id = ? AND agency_id = ?');
        $stmt->execute([$memberId, $agencyId]);
        $member = $stmt->fetch();
        
        if (!$member) {
            Response::notFound('Member not found');
            return;
        }
        
        try {
            $rbac->changeAgencyMemberRole($agencyId, $member['user_id'], $newRole, $userId);
            Response::json(['success' => true, 'message' => 'Role updated']);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 422);
        }
    }
    
    /**
     * Remove member from agency
     * DELETE /mt/agencies/:id/team/:memberId
     */
    public static function removeAgencyMember(int $agencyId, int $memberId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        // Get target user ID
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT user_id FROM agency_members WHERE id = ? AND agency_id = ?');
        $stmt->execute([$memberId, $agencyId]);
        $member = $stmt->fetch();
        
        if (!$member) {
            Response::notFound('Member not found');
            return;
        }
        
        try {
            $rbac->removeFromAgency($agencyId, $member['user_id'], $userId);
            Response::json(['success' => true, 'message' => 'Member removed']);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 422);
        }
    }
    
    /**
     * Resend invitation
     * POST /mt/agencies/:id/team/:memberId/resend
     */
    public static function resendInvite(int $agencyId, int $memberId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        if (!$rbac->isAgencyAdmin($userId, $agencyId)) {
            Response::forbidden('Only agency owners and admins can resend invitations');
            return;
        }
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('
            SELECT am.user_id, am.role, u.email, am.status 
            FROM agency_members am 
            JOIN users u ON u.id = am.user_id
            WHERE am.id = ? AND am.agency_id = ?
        ');
        $stmt->execute([$memberId, $agencyId]);
        $member = $stmt->fetch();
        
        if (!$member) {
            Response::notFound('Member not found');
            return;
        }
        
        if ($member['status'] !== 'invited') {
            Response::error('Can only resend to pending invitations', 422);
            return;
        }
        
        // Generate new token
        $token = bin2hex(random_bytes(32));
        $stmt = $pdo->prepare('
            INSERT INTO invite_tokens (user_id, agency_id, token, expires_at)
            VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
            ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)
        ');
        $stmt->execute([$member['user_id'], $agencyId, $token]);
        
        // Update invited_at timestamp
        $pdo->prepare('UPDATE agency_members SET invited_at = NOW() WHERE id = ?')->execute([$memberId]);
        
        // Get agency name for email
        $stmt = $pdo->prepare('SELECT name FROM agencies WHERE id = ?');
        $stmt->execute([$agencyId]);
        $agency = $stmt->fetch();
        $agencyName = $agency['name'] ?? 'Unknown Agency';

        // Send email
        require_once __DIR__ . '/../services/SystemEmailService.php';
        $emailService = new SystemEmailService();
        $emailSent = $emailService->sendAgencyInvite($member['email'], $agencyName, $member['role'], $token);
        
        Response::json([
            'success' => true, 
            'message' => $emailSent ? 'Invitation resent' : 'Invite token refreshed but email failed to send',
            'email_sent' => $emailSent
        ]);
    }
    
    // ========================================
    // SUBACCOUNT TEAM MANAGEMENT
    // ========================================
    
    /**
     * List subaccount team members
     * GET /mt/subaccounts/:id/team
     */
    public static function listSubaccountTeam(int $subaccountId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        $role = $rbac->getSubaccountRole($userId, $subaccountId);
        if (!$role) {
            Response::forbidden('You do not have access to this subaccount');
            return;
        }
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('
            SELECT sm.id, sm.user_id, sm.role, sm.status, sm.joined_at,
                   sm.permissions as custom_permissions,
                   u.name, u.email, u.last_login
            FROM subaccount_members sm
            JOIN users u ON u.id = sm.user_id
            WHERE sm.subaccount_id = ?
            ORDER BY FIELD(sm.role, "admin", "user", "readonly"), u.name ASC
        ');
        $stmt->execute([$subaccountId]);
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode custom permissions
        foreach ($members as &$m) {
            $m['custom_permissions'] = $m['custom_permissions'] 
                ? json_decode($m['custom_permissions'], true) 
                : [];
        }
        
        Response::json(['items' => $members, 'total' => count($members)]);
    }
    
    /**
     * Add member to subaccount
     * POST /mt/subaccounts/:id/team
     */
    public static function addSubaccountMember(int $subaccountId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        // Get subaccount's agency
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT agency_id FROM subaccounts WHERE id = ?');
        $stmt->execute([$subaccountId]);
        $subaccount = $stmt->fetch();
        
        if (!$subaccount) {
            Response::notFound('Subaccount not found');
            return;
        }
        
        if (!$rbac->isAgencyAdmin($userId, $subaccount['agency_id'])) {
            Response::forbidden('Only agency admins can add subaccount members');
            return;
        }
        
        $body = get_json_body();
        $targetUserId = (int)($body['user_id'] ?? 0);
        $role = $body['role'] ?? 'user';
        $customPermissions = $body['permissions'] ?? null;
        
        if (!$targetUserId) {
            Response::error('User ID is required', 422);
            return;
        }
        
        try {
            $rbac->addToSubaccount($subaccountId, $targetUserId, $role, $userId, $customPermissions);
            Response::json(['success' => true, 'message' => 'Member added']);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 422);
        }
    }
    
    /**
     * Update subaccount member
     * PUT /mt/subaccounts/:id/team/:memberId
     */
    public static function updateSubaccountMember(int $subaccountId, int $memberId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        // Get subaccount's agency
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT agency_id FROM subaccounts WHERE id = ?');
        $stmt->execute([$subaccountId]);
        $subaccount = $stmt->fetch();
        
        if (!$subaccount || !$rbac->isAgencyAdmin($userId, $subaccount['agency_id'])) {
            Response::forbidden('Access denied');
            return;
        }
        
        $body = get_json_body();
        $sets = [];
        $params = [];
        
        if (isset($body['role']) && in_array($body['role'], ['admin', 'user', 'readonly'])) {
            $sets[] = 'role = ?';
            $params[] = $body['role'];
        }
        
        if (array_key_exists('permissions', $body)) {
            $sets[] = 'permissions = ?';
            $params[] = $body['permissions'] ? json_encode($body['permissions']) : null;
        }
        
        if (isset($body['status']) && in_array($body['status'], ['active', 'suspended'])) {
            $sets[] = 'status = ?';
            $params[] = $body['status'];
        }
        
        if (empty($sets)) {
            Response::error('No valid fields to update', 422);
            return;
        }
        
        $params[] = $memberId;
        $params[] = $subaccountId;
        
        $pdo->prepare(
            'UPDATE subaccount_members SET ' . implode(', ', $sets) . ' WHERE id = ? AND subaccount_id = ?'
        )->execute($params);
        
        Response::json(['success' => true]);
    }
    
    /**
     * Remove member from subaccount
     * DELETE /mt/subaccounts/:id/team/:memberId
     */
    public static function removeSubaccountMember(int $subaccountId, int $memberId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        // Get subaccount's agency
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT agency_id FROM subaccounts WHERE id = ?');
        $stmt->execute([$subaccountId]);
        $subaccount = $stmt->fetch();
        
        if (!$subaccount || !$rbac->isAgencyAdmin($userId, $subaccount['agency_id'])) {
            Response::forbidden('Access denied');
            return;
        }
        
        $stmt = $pdo->prepare('DELETE FROM subaccount_members WHERE id = ? AND subaccount_id = ?');
        $stmt->execute([$memberId, $subaccountId]);
        
        Response::json(['success' => true]);
    }
    
    // ========================================
    // AUDIT LOG
    // ========================================
    
    /**
     * Get agency audit log
     * GET /mt/agencies/:id/audit
     */
    public static function getAgencyAuditLog(int $agencyId): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        if (!$rbac->isAgencyAdmin($userId, $agencyId)) {
            Response::forbidden('Only admins can view audit logs');
            return;
        }
        
        $limit = min((int)($_GET['limit'] ?? 100), 500);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $log = $rbac->getAgencyAuditLog($agencyId, $limit, $offset);
        
        Response::json(['items' => $log]);
    }
    
    // ========================================
    // PERMISSIONS CHECK
    // ========================================
    
    /**
     * Check user's permissions in current context
     * GET /mt/permissions/check
     */
    public static function checkPermissions(): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        $agencyId = (int)($_GET['agency_id'] ?? 0);
        $subaccountId = (int)($_GET['subaccount_id'] ?? 0);
        $permission = $_GET['permission'] ?? '';
        
        $result = [
            'user_id' => $userId,
            'agency_id' => $agencyId ?: null,
            'subaccount_id' => $subaccountId ?: null
        ];
        
        if ($agencyId) {
            $agencyRole = $rbac->getAgencyRole($userId, $agencyId);
            $result['agency_role'] = $agencyRole;
            
            if ($permission) {
                $result['has_permission'] = $rbac->hasAgencyPermission($userId, $agencyId, $permission);
            }
        }
        
        if ($subaccountId) {
            $subRole = $rbac->getSubaccountRole($userId, $subaccountId);
            $result['subaccount_role'] = $subRole;
            
            if ($permission) {
                $result['has_permission'] = $rbac->hasSubaccountPermission($userId, $subaccountId, $permission);
            }
        }
        
        Response::json($result);
    }
    
    /**
     * Get my access summary
     * GET /mt/permissions/me
     */
    public static function myAccess(): void {
        $userId = Auth::userIdOrFail();
        $rbac = MultiTenantRBACService::getInstance();
        
        $agencies = $rbac->getUserAgencies($userId);
        
        // For each agency, get subaccounts
        foreach ($agencies as &$agency) {
            $agency['subaccounts'] = $rbac->getUserSubaccounts($userId, $agency['id']);
        }
        
        Response::json([
            'user_id' => $userId,
            'agencies' => $agencies
        ]);
    }
}
