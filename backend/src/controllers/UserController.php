<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';

class UserController {
    
    /**
     * Get current user profile
     */
    public static function getProfile(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT id, email, name, created_at, last_login, role_id FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            Response::notFound('User not found');
            return;
        }
        
        // Get notification preferences
        $stmt = $pdo->prepare('SELECT preferences FROM user_preferences WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $prefs = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $notificationSettings = self::getDefaultNotifications();
        if ($prefs && $prefs['preferences']) {
            $decoded = json_decode($prefs['preferences'], true);
            if ($decoded && isset($decoded['notifications'])) {
                $notificationSettings = array_merge($notificationSettings, $decoded['notifications']);
            }
        }
        
        $user['notificationSettings'] = $notificationSettings;
        
        // Get role and permissions
        $rbac = RBACService::getInstance();
        $role = $rbac->getUserRole($userId);
        $user['role'] = $role;
        $user['permissions'] = $rbac->getUserPermissions($userId);
        $user['is_admin'] = $rbac->isAdmin($userId);
        
        Response::json($user);
    }
    
    /**
     * Update user profile
     */
    public static function updateProfile(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        $updates = [];
        $params = [];
        
        // Update name
        if (isset($body['name'])) {
            $updates[] = 'name = ?';
            $params[] = trim($body['name']);
        }
        
        // Update email
        if (isset($body['email'])) {
            $email = trim($body['email']);
            
            // Validate email
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Response::validationError('Invalid email address', ['email' => 'Invalid email format']);
                return;
            }
            
            // Check if email is already taken by another user
            $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1');
            $stmt->execute([$email, $userId]);
            if ($stmt->fetch()) {
                Response::validationError('Email already in use', ['email' => 'This email is already registered']);
                return;
            }
            
            $updates[] = 'email = ?';
            $params[] = $email;
        }
        
        if (empty($updates)) {
            Response::validationError('No fields to update', ['error' => 'Provide name or email to update']);
            return;
        }
        
        // Update user
        $params[] = $userId;
        $sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Return updated user
        self::getProfile();
    }
    
    /**
     * Get notification preferences
     */
    public static function getNotificationPreferences(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        
        $stmt = $pdo->prepare('SELECT preferences FROM user_preferences WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $notificationSettings = self::getDefaultNotifications();
        
        if ($row && $row['preferences']) {
            $decoded = json_decode($row['preferences'], true);
            if ($decoded && isset($decoded['notifications'])) {
                $notificationSettings = array_merge($notificationSettings, $decoded['notifications']);
            }
        }
        
        Response::json($notificationSettings);
    }
    
    /**
     * Update notification preferences
     */
    public static function updateNotificationPreferences(): void {
        $userId = Auth::userIdOrFail();
        $body = get_json_body();
        $pdo = Database::conn();
        
        // Get current preferences
        $stmt = $pdo->prepare('SELECT preferences FROM user_preferences WHERE user_id = ? LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $currentPrefs = [];
        if ($row && $row['preferences']) {
            $currentPrefs = json_decode($row['preferences'], true) ?: [];
        }
        
        // Update notification settings
        $notifications = $currentPrefs['notifications'] ?? self::getDefaultNotifications();
        
        $validFields = [
            'notifyCampaignUpdates',
            'notifyDailySummary',
            'notifySmsReplies',
            'notifyCallReplies',
            'notifyFormSubmissions'
        ];
        
        foreach ($validFields as $field) {
            if (array_key_exists($field, $body)) {
                $notifications[$field] = (bool)$body[$field];
            }
        }
        
        $currentPrefs['notifications'] = $notifications;
        $json = json_encode($currentPrefs);
        
        // Insert or update
        if (!$row) {
            $stmt = $pdo->prepare('INSERT INTO user_preferences (user_id, preferences, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
            $stmt->execute([$userId, $json]);
        } else {
            $stmt = $pdo->prepare('UPDATE user_preferences SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
            $stmt->execute([$json, $userId]);
        }
        
        Response::json($notifications);
    }
    
    /**
     * Get default notification settings
     */
    private static function getDefaultNotifications(): array {
        return [
            'notifyCampaignUpdates' => true,
            'notifyDailySummary' => false,
            'notifySmsReplies' => true,
            'notifyCallReplies' => true,
            'notifyFormSubmissions' => true
        ];
    }
    
    /**
     * Assign role to a user
     * PUT /users/:id/role
     */
    public static function assignRole(int $targetUserId): void {
        $actorId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->isAdmin($actorId) && !$rbac->hasPermission($actorId, 'users.assign_role')) {
            Response::forbidden('You do not have permission to assign roles');
            return;
        }
        
        $body = get_json_body();
        
        // Allow null role_id to remove role
        if (!array_key_exists('role_id', $body)) {
            Response::validationError('Role ID is required', ['role_id' => 'Required']);
            return;
        }
        
        $roleId = $body['role_id'];
        
        try {
            if ($roleId === null) {
                // Remove role from user
                $pdo = Database::conn();
                $stmt = $pdo->prepare('UPDATE users SET role_id = NULL WHERE id = ?');
                $stmt->execute([$targetUserId]);
            } else {
                $rbac->setUserRole($targetUserId, (int)$roleId, $actorId);
            }
            
            // Get updated user info
            $pdo = Database::conn();
            $stmt = $pdo->prepare('SELECT id, email, name, role_id FROM users WHERE id = ?');
            $stmt->execute([$targetUserId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                $user['role'] = $rbac->getUserRole($targetUserId);
                $user['permissions'] = $rbac->getUserPermissions($targetUserId);
            }
            
            Response::json(['success' => true, 'data' => $user]);
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Get all users (admin only)
     * GET /users
     */
    public static function getAllUsers(): void {
        $userId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->isAdmin($userId) && !$rbac->hasPermission($userId, 'users.view')) {
            Response::forbidden('You do not have permission to view users');
            return;
        }
        
        $pdo = Database::conn();
        
        // Get query parameters for filtering
        $roleId = $_GET['role_id'] ?? null;
        $search = $_GET['search'] ?? null;
        
        $where = ['1=1'];
        $params = [];
        
        if ($roleId) {
            $where[] = 'u.role_id = ?';
            $params[] = $roleId;
        }
        
        if ($search) {
            $where[] = '(u.name LIKE ? OR u.email LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        $sql = '
            SELECT u.id, u.email, u.name, u.role_id, u.created_at, u.last_login,
                   r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY u.created_at DESC
        ';
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add role details to each user
        foreach ($users as &$user) {
            if ($user['role_id']) {
                $user['role'] = $rbac->getRoleById((int)$user['role_id']);
            } else {
                $user['role'] = null;
            }
        }
        
        Response::json(['success' => true, 'data' => $users]);
    }

    /**
     * Update a user
     */
    public static function updateUser(int $id): void {
        $actorId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->isAdmin($actorId) && !$rbac->hasPermission($actorId, 'users.edit')) {
            Response::forbidden('You do not have permission to edit users');
            return;
        }
        
        $pdo = Database::conn();
        
        // Check if user exists
        $stmt = $pdo->prepare('SELECT id, email FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            Response::notFound('User not found');
            return;
        }
        
        $body = get_json_body();
        $name = trim($body['name'] ?? '');
        $email = trim($body['email'] ?? '');
        $roleId = $body['role_id'] ?? null;
        
        // Validate required fields
        if (!$name || !$email) {
            Response::error('Name and email are required', 422);
            return;
        }
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email format', 422);
            return;
        }
        
        // Check if email is already taken by another user
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        $stmt->execute([$email, $id]);
        if ($stmt->fetch()) {
            Response::error('Email is already taken by another user', 422);
            return;
        }
        
        // Validate role if provided
        if ($roleId !== null) {
            $stmt = $pdo->prepare('SELECT id FROM roles WHERE id = ?');
            $stmt->execute([$roleId]);
            if (!$stmt->fetch()) {
                Response::error('Invalid role ID', 422);
                return;
            }
        }
        
        // Update user
        $stmt = $pdo->prepare('UPDATE users SET name = ?, email = ?, role_id = ? WHERE id = ?');
        $stmt->execute([$name, $email, $roleId, $id]);
        
        // Get updated user with role details
        $stmt = $pdo->prepare('
            SELECT u.id, u.email, u.name, u.role_id, u.created_at, u.last_login,
                   r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        ');
        $stmt->execute([$id]);
        $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Add full role details if role exists
        if ($updatedUser && $updatedUser['role_id']) {
            $updatedUser['role'] = $rbac->getRoleById((int)$updatedUser['role_id']);
        }
        
        Response::json(['success' => true, 'data' => $updatedUser]);
    }

    /**
     * Create a new user
     * POST /users
     */
    public static function createUser(): void {
        $actorId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->isAdmin($actorId) && !$rbac->hasPermission($actorId, 'users.create')) {
            Response::forbidden('You do not have permission to create users');
            return;
        }
        
        $pdo = Database::conn();
        $body = get_json_body();
        
        $name = trim($body['name'] ?? '');
        $email = trim($body['email'] ?? '');
        $roleId = $body['role_id'] ?? null;
        
        // Validate required fields
        if (!$name || !$email) {
            Response::error('Name and email are required', 422);
            return;
        }
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email format', 422);
            return;
        }
        
        // Check if email is already taken
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            Response::error('Email is already registered', 422);
            return;
        }
        
        // Validate role if provided
        if ($roleId !== null) {
            $stmt = $pdo->prepare('SELECT id FROM roles WHERE id = ?');
            $stmt->execute([$roleId]);
            if (!$stmt->fetch()) {
                Response::error('Invalid role ID', 422);
                return;
            }
        }
        
        // Generate a random password (user will need to reset it)
        $tempPassword = bin2hex(random_bytes(16));
        $hashedPassword = password_hash($tempPassword, PASSWORD_DEFAULT);
        
        // Create user
        $stmt = $pdo->prepare('
            INSERT INTO users (name, email, password_hash, role_id, created_at) 
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ');
        $stmt->execute([$name, $email, $hashedPassword, $roleId]);
        $userId = (int)$pdo->lastInsertId();
        
        // Get created user with role details
        $stmt = $pdo->prepare('
            SELECT u.id, u.email, u.name, u.role_id, u.created_at,
                   r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ?
        ');
        $stmt->execute([$userId]);
        $newUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Add full role details if role exists
        if ($newUser && $newUser['role_id']) {
            $newUser['role'] = $rbac->getRoleById((int)$newUser['role_id']);
        }
        
        // Log the action
        $rbac->logRBACAction('user_created', $actorId, [
            'target_type' => 'user',
            'target_id' => $userId,
            'new_value' => ['name' => $name, 'email' => $email, 'role_id' => $roleId]
        ]);
        
        Response::json(['success' => true, 'data' => $newUser], 201);
    }

    /**
     * Send invitation email to user
     * POST /users/:id/invite
     */
    public static function sendInvitation(int $userId): void {
        $actorId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->isAdmin($actorId) && !$rbac->hasPermission($actorId, 'users.create')) {
            Response::forbidden('You do not have permission to send invitations');
            return;
        }
        
        $pdo = Database::conn();
        
        // Check if user exists
        $stmt = $pdo->prepare('SELECT id, email, name FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            Response::notFound('User not found');
            return;
        }
        
        // Generate password reset token
        $resetToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // Store reset token
        $stmt = $pdo->prepare('
            INSERT INTO password_resets (email, token, expires_at, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE token = ?, expires_at = ?, created_at = CURRENT_TIMESTAMP
        ');
        $stmt->execute([$user['email'], $resetToken, $expiresAt, $resetToken, $expiresAt]);
        
        // Send invitation email with password reset link
        require_once __DIR__ . '/../services/EmailService.php';
        $emailService = new \Xordon\Services\EmailService();
        $sent = $emailService->sendPasswordReset($user['email'], $resetToken, $user['name']);
        
        if ($sent) {
            Response::json([
                'success' => true, 
                'message' => 'Invitation sent to ' . $user['email']
            ]);
        } else {
            Response::error('Failed to send invitation email', 500);
        }
    }

    /**
     * Delete a user
     */
    public static function deleteUser(int $id): void {
        $actorId = Auth::userIdOrFail();
        $rbac = RBACService::getInstance();
        
        // Check permission
        if (!$rbac->isAdmin($actorId) && !$rbac->hasPermission($actorId, 'users.delete')) {
            Response::forbidden('You do not have permission to delete users');
            return;
        }
        
        // Prevent self-deletion
        if ($id === $actorId) {
            Response::error('You cannot delete your own account', 400);
            return;
        }
        
        $pdo = Database::conn();
        
        // Check if user exists
        $stmt = $pdo->prepare('SELECT id, name FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            Response::notFound('User not found');
            return;
        }
        
        // Delete the user
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);
        
        Response::json(['success' => true, 'message' => 'User deleted successfully']);
    }
}
