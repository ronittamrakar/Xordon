<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';
require_once __DIR__ . '/../services/RBACService.php';
require_once __DIR__ . '/../LoginRateLimiter.php';
require_once __DIR__ . '/../InputValidator.php';

class AuthController {
    public static function signup(): void {
        $body = get_json_body();
        
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $firstName = trim($body['firstName'] ?? $body['first_name'] ?? '');
        $lastName = trim($body['lastName'] ?? $body['last_name'] ?? '');
        $tenantName = trim($body['tenantName'] ?? $body['tenant_name'] ?? '');
        
        // Use firstName as name if no lastName provided, otherwise combine them
        $name = $firstName;
        if ($lastName) {
            $name = $firstName . ' ' . $lastName;
        }
        
        // Intentionally do not log passwords or raw request bodies
        
        if (!$email || !$password || !$name) {
            Response::error('Missing fields', 422);
        }
        $pdo = Database::conn();
        // Check existing
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) Response::error('User already exists', 409);
        // Create
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
        $stmt->execute([$email, $hash, $name]);
        $userId = (int)$pdo->lastInsertId();
        $token = Auth::generateToken($userId);
        
        // Generate tenant subdomain from tenant name or email
        $subdomain = preg_replace('/[^a-z0-9-]/', '', strtolower($tenantName ?: explode('@', $email)[0]));

        // Create initial workspace for the new user
        $workspace = Auth::ensureWorkspaceForUser(
            $userId,
            $tenantName ?: ($name . "'s Workspace"),
            $subdomain ?: null
        );
        
        Response::json([
            'user' => ['id' => $userId, 'email' => $email, 'name' => $name], 
            'token' => $token,
            'tenant' => [
                'id' => (string)$workspace['id'],
                'name' => $workspace['name'],
                'subdomain' => $workspace['slug']
            ]
        ], 201);
    }

    public static function login(): void {
        $body = get_json_body();
        
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $tenantSubdomain = trim($body['tenantSubdomain'] ?? $body['tenant_subdomain'] ?? 'default');
        // Intentionally do not log passwords or raw request bodies
        
        if (!$email || !$password) {
            Response::error('Missing fields', 422);
        }
        
        // Validate email format
        $emailValidation = InputValidator::validateEmail($email);
        if (!$emailValidation['valid']) {
            Response::error('Invalid email format', 422);
        }
        $email = $emailValidation['sanitized'];
        
        // Check rate limiting (brute-force protection)
        $rateLimitCheck = LoginRateLimiter::checkAttempt($email);
        if (!$rateLimitCheck['allowed']) {
            Response::error($rateLimitCheck['reason'], 429);
        }
        
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT id, password_hash, name FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        
        if (!$row) {
            // Record failed attempt even for non-existent users (prevents user enumeration)
            LoginRateLimiter::recordFailedAttempt($email);
            Response::error('Invalid credentials', 401);
        }
        
        $isValidPassword = password_verify($password, $row['password_hash']);
        
        if (!$isValidPassword) {
            // Record failed attempt
            LoginRateLimiter::recordFailedAttempt($email);
            Response::error('Invalid credentials', 401);
        }
        
        // Successful login - clear failed attempts
        LoginRateLimiter::recordSuccessfulLogin($email);
        
        $rememberMe = (bool)($body['remember_me'] ?? $body['rememberMe'] ?? false);
        $token = Auth::generateToken((int)$row['id'], $rememberMe);

        // Resolve workspace for this user (by slug if provided)
        $workspace = Auth::resolveWorkspace((int)$row['id'], $tenantSubdomain);
        if (!$workspace) {
            $workspace = Auth::ensureWorkspaceForUser((int)$row['id'], null, $tenantSubdomain ?: null);
        }
        
        // Get role and permissions for the user
        $rbac = RBACService::getInstance();
        $role = $rbac->getUserRole((int)$row['id']);
        $permissions = $rbac->getUserPermissions((int)$row['id']);
        $isAdmin = $rbac->isAdmin((int)$row['id']);
        
        // Return user and tenant data to match frontend expectations
        Response::json([
            'user' => [
                'id' => (int)$row['id'], 
                'email' => $email, 
                'name' => $row['name'],
                'role' => $role,
                'permissions' => $permissions,
                'is_admin' => $isAdmin
            ], 
            'token' => $token,
            'tenant' => [
                'id' => (string)$workspace['id'],
                'name' => $workspace['name'],
                'subdomain' => $workspace['slug']
            ]
        ]);
    }

    public static function me(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT id, email, name, role_id FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch();
        if (!$row) Response::error('Not found', 404);
        
        // Get role and permissions for the user
        $rbac = RBACService::getInstance();
        $role = $rbac->getUserRole($userId);
        $permissions = $rbac->getUserPermissions($userId);
        $isAdmin = $rbac->isAdmin($userId);

        $workspace = Auth::resolveWorkspace($userId, null);
        if (!$workspace) {
            $workspace = Auth::ensureWorkspaceForUser($userId);
        }
        
        // Return both user and tenant data to match frontend expectations
        Response::json([
            'user' => [
                'id' => (int)$row['id'], 
                'email' => $row['email'], 
                'name' => $row['name'],
                'role_id' => $row['role_id'],
                'role' => $role,
                'permissions' => $permissions,
                'is_admin' => $isAdmin
            ],
            'tenant' => [
                'id' => (string)$workspace['id'],
                'name' => $workspace['name'],
                'subdomain' => $workspace['slug']
            ]
        ]);
    }

    public static function logout(): void {
        $token = Auth::token();
        if ($token) {
            Auth::revokeToken($token);
        }
        Response::json(['ok' => true]);
    }

    public static function devToken(): void {
        // Only allow in development mode (or from localhost for local dev setups)
        $env = getenv('APP_ENV') ?: '';
        $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '';
        $isLocal = ($remoteAddr === '127.0.0.1' || $remoteAddr === '::1');
        $isDev = ($env === 'development' || $env === 'dev');
        if (!$isDev && !$isLocal) {
            Response::error('Not available in production', 403);
        }

        $pdo = Database::conn();
        
        // Check if test user exists, create if not
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute(['test@example.com']);
        $user = $stmt->fetch();
        
        if (!$user) {
            // Create test user
            $stmt = $pdo->prepare('INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
            $stmt->execute(['test@example.com', password_hash('password', PASSWORD_DEFAULT), 'Test User']);
            $userId = (int)$pdo->lastInsertId();
        } else {
            $userId = (int)$user['id'];
        }
        
        // Generate token
        $token = Auth::generateToken($userId);

        // Ensure a workspace exists for the test user
        Auth::ensureWorkspaceForUser($userId, 'Development Workspace', 'dev');
        
        // Save token to file for fallback
        $tokenFile = __DIR__ . '/../../test-auth-token.txt';
        file_put_contents($tokenFile, $token);
        
        Response::json(['success' => true, 'token' => $token]);
    }

    /**
     * Verify an invitation token
     */
    public static function verifyInvite(): void {
        $token = $_GET['token'] ?? '';
        if (!$token) {
            Response::error('Token required', 400);
            return;
        }

        $pdo = Database::conn();
        $stmt = $pdo->prepare('
            SELECT it.user_id, it.agency_id, it.subaccount_id, it.expires_at,
                   u.email, u.name, u.password_hash,
                   a.name as agency_name,
                   am.role as agency_role
            FROM invite_tokens it
            JOIN users u ON u.id = it.user_id
            LEFT JOIN agencies a ON a.id = it.agency_id
            LEFT JOIN agency_members am ON am.user_id = it.user_id AND am.agency_id = it.agency_id
            WHERE it.token = ?
        ');
        $stmt->execute([$token]);
        $invite = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$invite) {
            Response::json(['valid' => false, 'message' => 'Invalid invitation token.']);
            return;
        }

        if (strtotime($invite['expires_at']) < time()) {
            Response::json(['valid' => false, 'message' => 'This invitation has expired.']);
            return;
        }

        // Check if user needs to set up password (temp passwords start with hash prefix)
        $requiresSignup = empty($invite['name']) || $invite['password_hash'] === null;

        Response::json([
            'valid' => true,
            'email' => $invite['email'],
            'agency_name' => $invite['agency_name'],
            'role' => $invite['agency_role'] ?? 'member',
            'requires_signup' => $requiresSignup
        ]);
    }

    /**
     * Accept an invitation and activate the account
     */
    public static function acceptInvite(): void {
        $body = get_json_body();
        $token = $body['token'] ?? '';
        $name = trim($body['name'] ?? '');
        $password = $body['password'] ?? '';

        if (!$token) {
            Response::error('Token required', 400);
            return;
        }

        $pdo = Database::conn();
        
        // Get invite details
        $stmt = $pdo->prepare('
            SELECT it.user_id, it.agency_id, it.subaccount_id, it.expires_at,
                   u.email, u.name as existing_name, u.password_hash
            FROM invite_tokens it
            JOIN users u ON u.id = it.user_id
            WHERE it.token = ?
        ');
        $stmt->execute([$token]);
        $invite = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$invite) {
            Response::error('Invalid invitation token', 400);
            return;
        }

        if (strtotime($invite['expires_at']) < time()) {
            Response::error('This invitation has expired', 400);
            return;
        }

        $userId = (int)$invite['user_id'];
        $requiresSignup = empty($invite['existing_name']);

        // If new user, require name and password
        if ($requiresSignup) {
            if (!$name || strlen($password) < 8) {
                Response::error('Name and password (8+ chars) required for new accounts', 422);
                return;
            }

            // Update user with name and password
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare('UPDATE users SET name = ?, password_hash = ? WHERE id = ?');
            $stmt->execute([$name, $hash, $userId]);
        }

        // Activate agency membership
        if ($invite['agency_id']) {
            $stmt = $pdo->prepare('
                UPDATE agency_members SET status = "active", joined_at = NOW()
                WHERE user_id = ? AND agency_id = ?
            ');
            $stmt->execute([$userId, $invite['agency_id']]);

            // Set user's agency_id
            $stmt = $pdo->prepare('UPDATE users SET agency_id = ? WHERE id = ?');
            $stmt->execute([$invite['agency_id'], $userId]);
        }

        // Activate subaccount membership if applicable
        if ($invite['subaccount_id']) {
            $stmt = $pdo->prepare('
                UPDATE subaccount_members SET status = "active", joined_at = NOW()
                WHERE user_id = ? AND subaccount_id = ?
            ');
            $stmt->execute([$userId, $invite['subaccount_id']]);

            // Set user's current subaccount context
            $stmt = $pdo->prepare('UPDATE users SET current_subaccount_id = ? WHERE id = ?');
            $stmt->execute([$invite['subaccount_id'], $userId]);
        }

        // Delete used token
        $stmt = $pdo->prepare('DELETE FROM invite_tokens WHERE token = ?');
        $stmt->execute([$token]);

        // Generate auth token for automatic login
        $authToken = Auth::generateToken($userId);

        Response::json([
            'success' => true,
            'token' => $authToken,
            'user' => [
                'id' => $userId,
                'email' => $invite['email'],
                'name' => $name ?: $invite['existing_name']
            ]
        ]);
    }
    public static function allowedCompanies(): void {
    $userId = Auth::userIdOrFail();
    $pdo = Database::conn();
    
    $companies = [];
    $accountType = 'individual';
    $activeCompanyId = null;
    $workspaceId = null;
    
    try {
        // Check for agency association
        $stmt = $pdo->prepare('SELECT agency_id FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        // If user is part of an agency
        if ($user && !empty($user['agency_id'])) {
             $accountType = 'agency';
             $stmt = $pdo->prepare('SELECT id, name, logo_url, domain, status FROM agencies WHERE id = ?');
             $stmt->execute([$user['agency_id']]);
             $agency = $stmt->fetch(PDO::FETCH_ASSOC);
             if ($agency) {
                 $companies[] = [
                    'id' => (string)$agency['id'],
                    'name' => $agency['name'],
                    'domain' => $agency['domain'] ?? null,
                    'logoUrl' => $agency['logo_url'] ?? null,
                    'status' => $agency['status'] ?? 'active',
                    'isClient' => false,
                    'userRole' => 'owner'
                 ];
                 $activeCompanyId = (string)$agency['id'];
             }
        }
    } catch (Exception $e) {
        // If table/column missing, ignore agency check
    }
    
    // Also get workspace (always provide as fallback)
    $workspace = Auth::resolveWorkspace($userId, null);
    if (!$workspace) {
        $workspace = Auth::ensureWorkspaceForUser($userId);
    }
    $workspaceId = (string)$workspace['id'];
    
    // If no agency companies, add workspace as fallback
    if (empty($companies)) {
        $companies[] = [
            'id' => (string)$workspace['id'],
            'name' => $workspace['name'],
            'domain' => null,
            'logoUrl' => null,
            'status' => 'active',
            'isClient' => false,
            'userRole' => 'admin'
        ];
        $activeCompanyId = (string)$workspace['id'];
    }
    
    // Get active company details
    $activeCompany = null;
    if ($activeCompanyId && !empty($companies)) {
        foreach ($companies as $c) {
            if ($c['id'] === $activeCompanyId) {
                $activeCompany = $c;
                break;
            }
        }
        if (!$activeCompany) {
            $activeCompany = $companies[0] ?? null;
        }
    }
    
    Response::json([
        'companies' => $companies, 
        'activeCompanyId' => $activeCompanyId,
        'activeCompany' => $activeCompany,
        'workspaceId' => $workspaceId,
        'accountType' => $accountType
    ]);
}
}