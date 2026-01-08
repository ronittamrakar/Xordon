<?php
/**
 * Multi-Tenant RBAC Service
 * Extends the base RBAC with agency/subaccount hierarchy awareness
 */

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Logger.php';
require_once __DIR__ . '/RBACService.php';
require_once __DIR__ . '/SystemEmailService.php';

class MultiTenantRBACService {
    
    // Agency-level roles (keys match database values)
    const AGENCY_ROLES = [
        'owner' => [
            'level' => 100,
            'permissions' => ['*'], // Full access within agency
            'inherits' => []
        ],
        'admin' => [
            'level' => 80,
            'permissions' => [
                'agency.settings.view', 'agency.settings.edit',
                'agency.branding.view', 'agency.branding.edit',
                'agency.domains.view', 'agency.domains.manage',
                'agency.members.view', 'agency.members.invite', 'agency.members.remove',
                'subaccounts.view', 'subaccounts.create', 'subaccounts.edit', 'subaccounts.delete',
                'subaccounts.members.view', 'subaccounts.members.manage',
                'billing.view', // Can view billing info
            ],
            'inherits' => ['member']
        ],
        'member' => [
            'level' => 50,
            'permissions' => [
                'agency.view',
                'subaccounts.view', 'subaccounts.switch',
            ],
            'inherits' => []
        ]
    ];
    
    // Subaccount-level roles
    const SUBACCOUNT_ROLES = [
        'subaccount_admin' => [
            'level' => 100,
            'permissions' => ['*'], // Full access within subaccount
            'inherits' => []
        ],
        'subaccount_user' => [
            'level' => 50,
            'permissions' => [
                'contacts.view', 'contacts.create', 'contacts.edit',
                'campaigns.view', 'campaigns.create', 'campaigns.edit',
                'templates.view', 'templates.create',
                'analytics.view',
            ],
            'inherits' => []
        ],
        'subaccount_readonly' => [
            'level' => 10,
            'permissions' => [
                'contacts.view',
                'campaigns.view',
                'templates.view',
                'analytics.view',
            ],
            'inherits' => []
        ]
    ];
    
    private static ?self $instance = null;
    private PDO $pdo;
    
    private function __construct() {
        $this->pdo = Database::conn();
    }
    
    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    // ========================================
    // AGENCY MEMBERSHIP & ROLES
    // ========================================
    
    /**
     * Get user's role in an agency
     */
    public function getAgencyRole(int $userId, int $agencyId): ?array {
        $stmt = $this->pdo->prepare('
            SELECT am.role, am.status, a.name as agency_name
            FROM agency_members am
            JOIN agencies a ON a.id = am.agency_id
            WHERE am.user_id = ? AND am.agency_id = ?
        ');
        $stmt->execute([$userId, $agencyId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result || $result['status'] !== 'active') {
            return null;
        }
        
        return [
            'role' => $result['role'],
            'agency_name' => $result['agency_name'],
            'level' => self::AGENCY_ROLES[$result['role']]['level'] ?? 0,
            'permissions' => $this->getAgencyPermissions($result['role'])
        ];
    }
    
    /**
     * Get all permissions for an agency role
     */
    private function getAgencyPermissions(string $role): array {
        if (!isset(self::AGENCY_ROLES[$role])) {
            return [];
        }
        
        $roleConfig = self::AGENCY_ROLES[$role];
        $permissions = $roleConfig['permissions'];
        
        // Inherit from parent roles
        foreach ($roleConfig['inherits'] as $inheritRole) {
            if (isset(self::AGENCY_ROLES[$inheritRole])) {
                $permissions = array_merge($permissions, $this->getAgencyPermissions($inheritRole));
            }
        }
        
        return array_unique($permissions);
    }
    
    /**
     * Check if user has specific permission in agency context
     */
    public function hasAgencyPermission(int $userId, int $agencyId, string $permission): bool {
        $role = $this->getAgencyRole($userId, $agencyId);
        if (!$role) return false;
        
        $permissions = $role['permissions'];
        
        // Wildcard = full access
        if (in_array('*', $permissions)) return true;
        
        // Direct permission check
        if (in_array($permission, $permissions)) return true;
        
        // Check for partial wildcard (e.g., "agency.*" matches "agency.settings.view")
        foreach ($permissions as $p) {
            if (str_ends_with($p, '.*')) {
                $prefix = substr($p, 0, -1);
                if (str_starts_with($permission, $prefix)) return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check if user is agency owner
     */
    public function isAgencyOwner(int $userId, int $agencyId): bool {
        $role = $this->getAgencyRole($userId, $agencyId);
        return $role && $role['role'] === 'owner';
    }
    
    /**
     * Check if user is at least agency admin
     */
    public function isAgencyAdmin(int $userId, int $agencyId): bool {
        $role = $this->getAgencyRole($userId, $agencyId);
        return $role && in_array($role['role'], ['owner', 'admin']);
    }
    
    // ========================================
    // SUBACCOUNT MEMBERSHIP & ROLES
    // ========================================
    
    /**
     * Get user's role in a subaccount
     */
    public function getSubaccountRole(int $userId, int $subaccountId): ?array {
        $stmt = $this->pdo->prepare('
            SELECT sm.role, sm.status, sm.permissions as custom_permissions,
                   s.name as subaccount_name, s.agency_id
            FROM subaccount_members sm
            JOIN subaccounts s ON s.id = sm.subaccount_id
            WHERE sm.user_id = ? AND sm.subaccount_id = ?
        ');
        $stmt->execute([$userId, $subaccountId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result || $result['status'] !== 'active') {
            // Check if user has agency-level access
            return $this->getInheritedSubaccountAccess($userId, $subaccountId);
        }
        
        $customPerms = $result['custom_permissions'] ? json_decode($result['custom_permissions'], true) : [];
        
        return [
            'role' => $result['role'],
            'subaccount_name' => $result['subaccount_name'],
            'agency_id' => $result['agency_id'],
            'level' => self::SUBACCOUNT_ROLES[$result['role']]['level'] ?? 0,
            'permissions' => array_merge(
                $this->getSubaccountPermissions($result['role']),
                $customPerms
            ),
            'source' => 'direct'
        ];
    }
    
    /**
     * Get inherited access from agency membership
     */
    private function getInheritedSubaccountAccess(int $userId, int $subaccountId): ?array {
        // Get the subaccount's agency
        $stmt = $this->pdo->prepare('SELECT agency_id, name FROM subaccounts WHERE id = ?');
        $stmt->execute([$subaccountId]);
        $subaccount = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$subaccount) return null;
        
        // Check agency membership
        $agencyRole = $this->getAgencyRole($userId, $subaccount['agency_id']);
        if (!$agencyRole) return null;
        
        // Agency owners and admins get full access to all subaccounts
        if (in_array($agencyRole['role'], ['owner', 'admin'])) {
            return [
                'role' => 'admin',
                'subaccount_name' => $subaccount['name'],
                'agency_id' => $subaccount['agency_id'],
                'level' => 100,
                'permissions' => ['*'],
                'source' => 'inherited',
                'inherited_from' => 'agency_' . $agencyRole['role']
            ];
        }
        
        // Agency members can view but not edit
        if ($agencyRole['role'] === 'member') {
            return [
                'role' => 'readonly',
                'subaccount_name' => $subaccount['name'],
                'agency_id' => $subaccount['agency_id'],
                'level' => 10,
                'permissions' => self::SUBACCOUNT_ROLES['subaccount_readonly']['permissions'],
                'source' => 'inherited',
                'inherited_from' => 'agency_member'
            ];
        }
        
        return null;
    }
    
    /**
     * Get all permissions for a subaccount role
     */
    private function getSubaccountPermissions(string $role): array {
        if (!isset(self::SUBACCOUNT_ROLES[$role])) {
            return [];
        }
        
        $roleConfig = self::SUBACCOUNT_ROLES[$role];
        $permissions = $roleConfig['permissions'];
        
        foreach ($roleConfig['inherits'] as $inheritRole) {
            if (isset(self::SUBACCOUNT_ROLES[$inheritRole])) {
                $permissions = array_merge($permissions, $this->getSubaccountPermissions($inheritRole));
            }
        }
        
        return array_unique($permissions);
    }
    
    /**
     * Check if user has specific permission in subaccount context
     */
    public function hasSubaccountPermission(int $userId, int $subaccountId, string $permission): bool {
        $role = $this->getSubaccountRole($userId, $subaccountId);
        if (!$role) return false;
        
        $permissions = $role['permissions'];
        
        if (in_array('*', $permissions)) return true;
        if (in_array($permission, $permissions)) return true;
        
        foreach ($permissions as $p) {
            if (str_ends_with($p, '.*')) {
                $prefix = substr($p, 0, -1);
                if (str_starts_with($permission, $prefix)) return true;
            }
        }
        
        return false;
    }
    
    // ========================================
    // MEMBER MANAGEMENT
    // ========================================
    
    /**
     * Invite user to agency
     */
    public function inviteToAgency(int $agencyId, string $email, string $role, int $invitedBy, bool $sendEmail = true): array {
        // Validate role
        if (!in_array($role, ['admin', 'member'])) {
            throw new Exception('Invalid role. Must be admin or member.');
        }
        
        // Check inviter permissions
        if (!$this->isAgencyAdmin($invitedBy, $agencyId)) {
            throw new Exception('You do not have permission to invite members.');
        }
        
        // Find or create user
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $existingUser = $stmt->fetch();
        
        $this->pdo->beginTransaction();
        try {
            if ($existingUser) {
                $userId = $existingUser['id'];
                
                // Check if already a member
                $stmt = $this->pdo->prepare('
                    SELECT id, status FROM agency_members 
                    WHERE agency_id = ? AND user_id = ?
                ');
                $stmt->execute([$agencyId, $userId]);
                $existing = $stmt->fetch();
                
                if ($existing && $existing['status'] === 'active') {
                    throw new Exception('User is already a member of this agency.');
                }
                
                if ($existing) {
                    // Re-invite
                    $stmt = $this->pdo->prepare('
                        UPDATE agency_members 
                        SET status = "invited", role = ?, invited_by = ?, invited_at = NOW()
                        WHERE id = ?
                    ');
                    $stmt->execute([$role, $invitedBy, $existing['id']]);
                } else {
                    $stmt = $this->pdo->prepare('
                        INSERT INTO agency_members (agency_id, user_id, role, status, invited_by, invited_at)
                        VALUES (?, ?, ?, "invited", ?, NOW())
                    ');
                    $stmt->execute([$agencyId, $userId, $role, $invitedBy]);
                }
            } else {
                // Create placeholder user
                $tempPassword = bin2hex(random_bytes(16));
                $stmt = $this->pdo->prepare('
                    INSERT INTO users (email, password_hash, user_type, created_at)
                    VALUES (?, ?, "agency_user", NOW())
                ');
                $stmt->execute([$email, password_hash($tempPassword, PASSWORD_DEFAULT)]);
                $userId = (int)$this->pdo->lastInsertId();
                
                $stmt = $this->pdo->prepare('
                    INSERT INTO agency_members (agency_id, user_id, role, status, invited_by, invited_at)
                    VALUES (?, ?, ?, "invited", ?, NOW())
                ');
                $stmt->execute([$agencyId, $userId, $role, $invitedBy]);
            }
            
            // Generate invite token
            $token = bin2hex(random_bytes(32));
            $stmt = $this->pdo->prepare('
                INSERT INTO invite_tokens (user_id, agency_id, token, expires_at)
                VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
                ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)
            ');
            $stmt->execute([$userId, $agencyId, $token]);
            
            $this->pdo->commit();
            
            // Log the action
            $this->logAction('agency_invite', $invitedBy, [
                'agency_id' => $agencyId,
                'invited_user_id' => $userId,
                'invited_email' => $email,
                'role' => $role
            ]);
            
            // Get agency name for email
            $stmt = $this->pdo->prepare('SELECT name FROM agencies WHERE id = ?');
            $stmt->execute([$agencyId]);
            $agency = $stmt->fetch();
            $agencyName = $agency['name'] ?? 'Unknown Agency';
            
            // Send invitation email if requested
            $emailSent = false;
            if ($sendEmail) {
                $emailService = new SystemEmailService();
                $emailSent = $emailService->sendAgencyInvite($email, $agencyName, $role, $token);
            }
            
            return [
                'success' => true,
                'user_id' => $userId,
                'invite_token' => $token,
                'email_sent' => $emailSent,
                'message' => $emailSent ? "Invitation sent to $email" : ($sendEmail ? "Invite created but email failed" : "Invite created (email skipped)")
            ];
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Invite user to subaccount
     */
    public function inviteToSubaccount(int $subaccountId, string $email, string $role, int $invitedBy, bool $sendEmail = true): array {
        // Validate subaccount and get agency context
        $stmt = $this->pdo->prepare('SELECT name, agency_id FROM subaccounts WHERE id = ?');
        $stmt->execute([$subaccountId]);
        $subaccount = $stmt->fetch();
        if (!$subaccount) {
            throw new Exception('Subaccount not found.');
        }
        $subaccountName = $subaccount['name'];
        $agencyId = (int)$subaccount['agency_id'];

        // Validate role
        if (!in_array($role, ['admin', 'user', 'readonly'])) {
            throw new Exception('Invalid role. Must be admin, user or readonly.');
        }
        
        // Check inviter permissions (must be agency admin or subaccount admin)
        // For simplicity now: agency admin
        if (!$this->isAgencyAdmin($invitedBy, $agencyId)) {
            throw new Exception('You do not have permission to invite members to this subaccount.');
        }
        
        // Find or create user
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $existingUser = $stmt->fetch();
        
        $this->pdo->beginTransaction();
        try {
            if ($existingUser) {
                $userId = $existingUser['id'];
                
                // Check if already a member
                $stmt = $this->pdo->prepare('
                    SELECT id, status FROM subaccount_members 
                    WHERE subaccount_id = ? AND user_id = ?
                ');
                $stmt->execute([$subaccountId, $userId]);
                $existing = $stmt->fetch();
                
                if ($existing && $existing['status'] === 'active') {
                    throw new Exception('User is already a member of this subaccount.');
                }
                
                if ($existing) {
                    $stmt = $this->pdo->prepare('
                        UPDATE subaccount_members 
                        SET status = "invited", role = ?, invited_by = ?, invited_at = NOW()
                        WHERE id = ?
                    ');
                    $stmt->execute([$role, $invitedBy, $existing['id']]);
                } else {
                    $stmt = $this->pdo->prepare('
                        INSERT INTO subaccount_members (subaccount_id, user_id, role, status, invited_by, invited_at)
                        VALUES (?, ?, ?, "invited", ?, NOW())
                    ');
                    $stmt->execute([$subaccountId, $userId, $role, $invitedBy]);
                }
            } else {
                // Create placeholder user
                $tempPassword = bin2hex(random_bytes(16));
                $stmt = $this->pdo->prepare('
                    INSERT INTO users (email, password_hash, user_type, agency_id, created_at)
                    VALUES (?, ?, "subaccount_user", ?, NOW())
                ');
                $stmt->execute([$email, password_hash($tempPassword, PASSWORD_DEFAULT), $agencyId]);
                $userId = (int)$this->pdo->lastInsertId();
                
                $stmt = $this->pdo->prepare('
                    INSERT INTO subaccount_members (subaccount_id, user_id, role, status, invited_by, invited_at)
                    VALUES (?, ?, ?, "invited", ?, NOW())
                ');
                $stmt->execute([$subaccountId, $userId, $role, $invitedBy]);
            }
            
            // Generate invite token
            $token = bin2hex(random_bytes(32));
            $stmt = $this->pdo->prepare('
                INSERT INTO invite_tokens (user_id, agency_id, subaccount_id, token, expires_at)
                VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
                ON DUPLICATE KEY UPDATE token = VALUES(token), subaccount_id = VALUES(subaccount_id), expires_at = VALUES(expires_at)
            ');
            $stmt->execute([$userId, $agencyId, $subaccountId, $token]);
            
            $this->pdo->commit();
            
            // Log action
            $this->logAction('subaccount_invite', $invitedBy, [
                'subaccount_id' => $subaccountId,
                'agency_id' => $agencyId,
                'invited_email' => $email,
                'role' => $role
            ]);
            
            // Get agency name for email
            $stmt = $this->pdo->prepare('SELECT name FROM agencies WHERE id = ?');
            $stmt->execute([$agencyId]);
            $agency = $stmt->fetch();
            $agencyName = $agency['name'] ?? 'The Agency';
            
            // Send email if requested
            $emailSent = false;
            if ($sendEmail) {
                $emailService = new SystemEmailService();
                $emailSent = $emailService->sendSubaccountClientInvite($email, $subaccountName, $agencyName, $token);
            }
            
            return [
                'success' => true,
                'user_id' => $userId,
                'invite_token' => $token,
                'email_sent' => $emailSent,
                'message' => $emailSent ? "Invitation sent to $email" : ($sendEmail ? "Invite created but email failed" : "Invite created (email skipped)")
            ];
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    /**
     * Accept agency invitation
     */
    public function acceptAgencyInvite(string $token, int $userId): bool {
        $stmt = $this->pdo->prepare('
            SELECT agency_id, user_id FROM invite_tokens 
            WHERE token = ? AND expires_at > NOW()
        ');
        $stmt->execute([$token]);
        $invite = $stmt->fetch();
        
        if (!$invite || $invite['user_id'] != $userId) {
            return false;
        }
        
        $this->pdo->beginTransaction();
        try {
            // Activate membership
            $stmt = $this->pdo->prepare('
                UPDATE agency_members 
                SET status = "active", joined_at = NOW()
                WHERE agency_id = ? AND user_id = ?
            ');
            $stmt->execute([$invite['agency_id'], $userId]);
            
            // Update user's agency
            $stmt = $this->pdo->prepare('UPDATE users SET agency_id = ? WHERE id = ?');
            $stmt->execute([$invite['agency_id'], $userId]);
            
            // Delete token
            $stmt = $this->pdo->prepare('DELETE FROM invite_tokens WHERE token = ?');
            $stmt->execute([$token]);
            
            $this->pdo->commit();
            
            $this->logAction('agency_invite_accepted', $userId, [
                'agency_id' => $invite['agency_id']
            ]);
            
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    /**
     * Change member role in agency
     */
    public function changeAgencyMemberRole(int $agencyId, int $targetUserId, string $newRole, int $actorId): bool {
        // Only owner can change roles
        if (!$this->isAgencyOwner($actorId, $agencyId)) {
            throw new Exception('Only the agency owner can change member roles.');
        }
        
        // Can't change own role
        if ($targetUserId === $actorId) {
            throw new Exception('You cannot change your own role.');
        }
        
        // Validate role
        if (!in_array($newRole, ['admin', 'member'])) {
            throw new Exception('Invalid role.');
        }
        
        $stmt = $this->pdo->prepare('
            UPDATE agency_members SET role = ? WHERE agency_id = ? AND user_id = ? AND role != "owner"
        ');
        $stmt->execute([$newRole, $agencyId, $targetUserId]);
        
        $this->logAction('agency_role_change', $actorId, [
            'agency_id' => $agencyId,
            'target_user_id' => $targetUserId,
            'new_role' => $newRole
        ]);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Remove member from agency
     */
    public function removeFromAgency(int $agencyId, int $targetUserId, int $actorId): bool {
        // Admins and owners can remove (but not owners themselves)
        if (!$this->isAgencyAdmin($actorId, $agencyId)) {
            throw new Exception('You do not have permission to remove members.');
        }
        
        // Check target's role
        $targetRole = $this->getAgencyRole($targetUserId, $agencyId);
        if (!$targetRole) {
            throw new Exception('User is not a member of this agency.');
        }
        
        if ($targetRole['role'] === 'owner') {
            throw new Exception('Cannot remove the agency owner.');
        }
        
        // Admins can only remove members, not other admins
        if ($targetRole['role'] === 'admin' && !$this->isAgencyOwner($actorId, $agencyId)) {
            throw new Exception('Only the owner can remove admins.');
        }
        
        $stmt = $this->pdo->prepare('DELETE FROM agency_members WHERE agency_id = ? AND user_id = ?');
        $stmt->execute([$agencyId, $targetUserId]);
        
        $this->logAction('agency_member_removed', $actorId, [
            'agency_id' => $agencyId,
            'removed_user_id' => $targetUserId
        ]);
        
        return true;
    }
    
    // ========================================
    // SUBACCOUNT MEMBER MANAGEMENT
    // ========================================
    
    /**
     * Add user to subaccount
     */
    public function addToSubaccount(int $subaccountId, int $userId, string $role, int $addedBy, ?array $customPermissions = null): bool {
        // Get subaccount's agency
        $stmt = $this->pdo->prepare('SELECT agency_id FROM subaccounts WHERE id = ?');
        $stmt->execute([$subaccountId]);
        $subaccount = $stmt->fetch();
        
        if (!$subaccount) {
            throw new Exception('Subaccount not found.');
        }
        
        // Check permissions
        if (!$this->isAgencyAdmin($addedBy, $subaccount['agency_id'])) {
            throw new Exception('You do not have permission to manage subaccount members.');
        }
        
        // Validate role
        if (!in_array($role, ['admin', 'user', 'readonly'])) {
            throw new Exception('Invalid role.');
        }
        
        $stmt = $this->pdo->prepare('
            INSERT INTO subaccount_members (subaccount_id, user_id, role, permissions, status, invited_by, joined_at)
            VALUES (?, ?, ?, ?, "active", ?, NOW())
            ON DUPLICATE KEY UPDATE role = VALUES(role), permissions = VALUES(permissions), status = "active"
        ');
        $stmt->execute([
            $subaccountId, 
            $userId, 
            $role, 
            $customPermissions ? json_encode($customPermissions) : null,
            $addedBy
        ]);
        
        $this->logAction('subaccount_member_added', $addedBy, [
            'subaccount_id' => $subaccountId,
            'user_id' => $userId,
            'role' => $role
        ]);
        
        return true;
    }
    
    // ========================================
    // AUDIT LOGGING
    // ========================================
    
    /**
     * Log a multi-tenant action
     */
    public function logAction(string $action, int $actorId, array $details): void {
        $stmt = $this->pdo->prepare('
            INSERT INTO mt_audit_log (action, actor_id, agency_id, subaccount_id, details, ip_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([
            $action,
            $actorId,
            $details['agency_id'] ?? null,
            $details['subaccount_id'] ?? null,
            json_encode($details),
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    }
    
    /**
     * Get audit log for agency
     */
    public function getAgencyAuditLog(int $agencyId, int $limit = 100, int $offset = 0): array {
        $stmt = $this->pdo->prepare('
            SELECT al.*, u.name as actor_name, u.email as actor_email
            FROM mt_audit_log al
            LEFT JOIN users u ON u.id = al.actor_id
            WHERE al.agency_id = ?
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        ');
        $stmt->execute([$agencyId, $limit, $offset]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // ========================================
    // HELPER METHODS
    // ========================================
    
    /**
     * Get all agencies user has access to
     */
    public function getUserAgencies(int $userId): array {
        $stmt = $this->pdo->prepare('
            SELECT a.id, a.name, a.slug, a.status, am.role,
                   (SELECT COUNT(*) FROM subaccounts WHERE agency_id = a.id) as subaccount_count
            FROM agencies a
            JOIN agency_members am ON am.agency_id = a.id
            WHERE am.user_id = ? AND am.status = "active"
            ORDER BY a.name
        ');
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get all subaccounts user has access to within an agency
     */
    public function getUserSubaccounts(int $userId, int $agencyId): array {
        // If agency admin/owner, return all subaccounts
        if ($this->isAgencyAdmin($userId, $agencyId)) {
            $stmt = $this->pdo->prepare('
                SELECT id, name, slug, status, industry
                FROM subaccounts WHERE agency_id = ? ORDER BY name
            ');
            $stmt->execute([$agencyId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Otherwise, return only directly assigned subaccounts
        $stmt = $this->pdo->prepare('
            SELECT s.id, s.name, s.slug, s.status, s.industry, sm.role
            FROM subaccounts s
            JOIN subaccount_members sm ON sm.subaccount_id = s.id
            WHERE s.agency_id = ? AND sm.user_id = ? AND sm.status = "active"
            ORDER BY s.name
        ');
        $stmt->execute([$agencyId, $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
