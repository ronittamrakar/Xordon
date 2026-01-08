<?php
namespace Xordon;

use Exception;
use PDO;

require_once __DIR__ . '/Logger.php';
require_once __DIR__ . '/ErrorHandler.php';
require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/Database.php';

class Auth {
    public static function userIdOrFail(): int {
        $userId = self::userId();
        if ($userId === null) {
            Response::unauthorized('Authentication required');
            exit;
        }
        return $userId;
    }
    
    public static function userId(): ?int {
        try {
            $token = self::extractToken();
            if (!$token) {
                // Check if we are in development mode with explicit bypass enabled
                // SECURITY: Requires both APP_ENV=development AND ALLOW_DEV_BYPASS=true
                $appEnv = getenv('APP_ENV') ?: 'production';
                $allowDevBypass = getenv('ALLOW_DEV_BYPASS') === 'true';
                $isDev = ($appEnv === 'development' || $appEnv === 'dev' || $appEnv === 'local');
                
                if ($isDev && $allowDevBypass) {
                    Logger::warning('Auth: No token found, defaulting to user ID 1 in development mode (DEV BYPASS ENABLED)');
                    return 1;
                }
                
                Logger::debug('Auth: No token extracted from headers');
                return null;
            }
            
            // Validate token in database
            $pdo = Database::conn();
            
            // Query for valid token (with or without expiration)
            $stmt = $pdo->prepare('SELECT user_id, expires_at FROM auth_tokens WHERE token = ?');
            $stmt->execute([$token]);
            $row = $stmt->fetch();

            if (!$row) {
                // SECURITY: In dev mode with explicit bypass, we might still want to allow access 
                // if a token was provided but not found (e.g. after DB reset)
                $appEnv = getenv('APP_ENV') ?: 'production';
                $allowDevBypass = getenv('ALLOW_DEV_BYPASS') === 'true';
                $isDev = ($appEnv === 'development' || $appEnv === 'dev' || $appEnv === 'local');
                if ($isDev && $allowDevBypass) {
                    Logger::warning('Auth: Token not found in database, but allowing as user ID 1 in dev mode (DEV BYPASS ENABLED)', ['token_prefix' => substr($token, 0, 8)]);
                    return 1;
                }

                 Logger::warning('Auth: Token not found in database', ['token_prefix' => substr($token, 0, 8)]);
                 return null;
            }

            // Check expiration
            if ($row['expires_at']) {
                $expiresAt = strtotime($row['expires_at']);
                if ($expiresAt <= time()) {
                    Logger::warning('Auth: Token expired', [
                        'token_prefix' => substr($token, 0, 8), 
                        'expires_at' => $row['expires_at'], 
                        'current_time' => date('Y-m-d H:i:s')
                    ]);
                    
                    // Clean up expired token
                    $deleteStmt = $pdo->prepare('DELETE FROM auth_tokens WHERE token = ?');
                    $deleteStmt->execute([$token]);
                    return null;
                }
            }
            
            return (int)$row['user_id'];
        } catch (Exception $e) {
            Logger::error('Error during authentication', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return null;
        }
    }
    
    private static function extractToken(): ?string {
        // Use built-in header extraction with fallbacks
        $auth = self::getHeader('Authorization');
        if ($auth && str_starts_with($auth, 'Bearer ')) {
            $token = substr($auth, 7);
            return $token;
        }
        
        // Fallback to X-Auth-Token header
        $xToken = self::getHeader('X-Auth-Token');
        if ($xToken) {
            return $xToken;
        }
        
        return null;
    }

    public static function token(): ?string {
        return self::extractToken();
    }

    private static function workspaceSlugify(string $value): string {
        $slug = strtolower($value);
        $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug);
        $slug = trim($slug, '-');
        $slug = preg_replace('/-+/', '-', $slug);
        return $slug ?: 'workspace';
    }

    public static function resolveWorkspace(int $userId, ?string $workspaceSlug = null): ?array {
        $pdo = Database::conn();

        if ($workspaceSlug !== null && $workspaceSlug !== '') {
            $stmt = $pdo->prepare('SELECT w.id, w.name, w.slug, m.role FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE m.user_id = ? AND w.slug = ? LIMIT 1');
            $stmt->execute([$userId, $workspaceSlug]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) return $row;
        }

        $headerWorkspaceId = self::getHeader('X-Workspace-Id');
        if ($headerWorkspaceId && ctype_digit($headerWorkspaceId)) {
            $wid = (int)$headerWorkspaceId;
            $stmt = $pdo->prepare('SELECT w.id, w.name, w.slug, m.role FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE m.user_id = ? AND w.id = ? LIMIT 1');
            $stmt->execute([$userId, $wid]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) return $row;
        }

        $stmt = $pdo->prepare('SELECT w.id, w.name, w.slug, m.role FROM workspace_members m JOIN workspaces w ON w.id = m.workspace_id WHERE m.user_id = ? ORDER BY (m.role = "owner") DESC, m.id ASC LIMIT 1');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) return $row;

        return null;
    }

    public static function ensureWorkspaceForUser(int $userId, ?string $preferredName = null, ?string $preferredSlug = null): array {
        $pdo = Database::conn();

        $existing = self::resolveWorkspace($userId, $preferredSlug);
        if ($existing) return $existing;

        $userStmt = $pdo->prepare('SELECT email, name FROM users WHERE id = ? LIMIT 1');
        $userStmt->execute([$userId]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $email = (string)($user['email'] ?? '');
        $name = (string)($user['name'] ?? '');

        $workspaceName = $preferredName;
        if ($workspaceName === null || trim($workspaceName) === '') {
            $workspaceName = ($name !== '' ? ($name . "'s Workspace") : 'My Workspace');
        }

        $baseSlug = self::workspaceSlugify($preferredSlug ?: ($email ? explode('@', $email)[0] : $workspaceName));
        $slug = $baseSlug;
        $suffix = 1;
        while (true) {
            $check = $pdo->prepare('SELECT id FROM workspaces WHERE slug = ? LIMIT 1');
            $check->execute([$slug]);
            if (!$check->fetch()) {
                break;
            }
            $suffix++;
            $slug = $baseSlug . '-' . $suffix;
            if ($suffix > 50) {
                Response::error('Unable to generate unique workspace slug', 500);
            }
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('INSERT INTO workspaces (name, slug, owner_user_id, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
            $stmt->execute([$workspaceName, $slug, $userId]);
            $workspaceId = (int)$pdo->lastInsertId();

            $stmt = $pdo->prepare('INSERT INTO workspace_members (workspace_id, user_id, role, created_at) VALUES (?, ?, "owner", CURRENT_TIMESTAMP)');
            $stmt->execute([$workspaceId, $userId]);

            try {
                $tablesStmt = $pdo->prepare('SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ("modules", "workspace_modules")');
                $tablesStmt->execute();
                $tables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);
                $hasModules = in_array('modules', $tables, true);
                $hasWorkspaceModules = in_array('workspace_modules', $tables, true);

                if ($hasModules && $hasWorkspaceModules) {
                    $moduleStmt = $pdo->prepare('SELECT 1 FROM modules WHERE module_key = ? LIMIT 1');
                    $moduleStmt->execute(['operations']);
                    if ($moduleStmt->fetchColumn()) {
                        $enableStmt = $pdo->prepare('
                            INSERT INTO workspace_modules (workspace_id, module_key, status, installed_at, installed_by)
                            VALUES (?, ?, "installed", NOW(), ?)
                            ON DUPLICATE KEY UPDATE
                                status = "installed",
                                installed_at = NOW(),
                                installed_by = VALUES(installed_by),
                                disabled_at = NULL,
                                disabled_by = NULL
                        ');
                        $enableStmt->execute([$workspaceId, 'operations', $userId]);
                    }
                }
            } catch (Throwable $e) {
            }

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            Response::error('Failed to create workspace', 500);
        }

        return [
            'id' => (string)$workspaceId,
            'name' => $workspaceName,
            'slug' => $slug,
            'role' => 'owner',
        ];
    }

    public static function workspaceId(int $userId): ?int {
        $ws = self::resolveWorkspace($userId, null);
        if (!$ws || !isset($ws['id'])) return null;
        return (int)$ws['id'];
    }
    
    private static function getHeader(string $name): ?string {
        // Try all-headers if available
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $k => $v) {
                if (strtolower($k) === strtolower($name)) {
                    return $v;
                }
            }
        }
        
        // Try $_SERVER superglobal with HTTP_ prefix
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        if (isset($_SERVER[$serverKey]) && $_SERVER[$serverKey] !== '') {
            return $_SERVER[$serverKey];
        }
        
        // Special case for Authorization header
        if (strtolower($name) === 'authorization') {
            $authVariants = [
                'HTTP_AUTHORIZATION',
                'REDIRECT_HTTP_AUTHORIZATION',
                'Authorization',
                'authorization'
            ];
            
            foreach ($authVariants as $variant) {
                if (isset($_SERVER[$variant]) && $_SERVER[$variant] !== '') {
                    return $_SERVER[$variant];
                }
            }
            
            // Log ALL server keys that look like headers if we're still missing it
            $allHttpKeys = array_filter(array_keys($_SERVER), function($k) {
                return is_string($k) && (str_starts_with($k, 'HTTP_') || str_starts_with($k, 'REDIRECT_'));
            });
            Logger::debug('Auth: No Authorization header found in known locations', [
                'checked_variants' => $authVariants,
                'available_server_keys' => array_values($allHttpKeys)
            ]);
        }
        
        return null;
    }
    
    private static function getAllHeadersFromServer(): array {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $headerName = str_replace('_', '-', substr($key, 5));
                $headers[$headerName] = $value;
            }
        }
        return $headers;
    }

    public static function generateToken(int $userId, bool $remember = false): string {
        try {
            $token = bin2hex(random_bytes(24));
            $pdo = Database::conn();
            
            // Set token expiration: 30 days if remember is true, 1 day otherwise
            $interval = $remember ? '30 DAY' : '1 DAY';
            
            $stmt = $pdo->prepare("INSERT INTO auth_tokens (user_id, token, created_at, expires_at) VALUES (?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL $interval))");
            $stmt->execute([$userId, $token]);
            
            Logger::info('New auth token generated', [
                'user_id' => $userId,
                'remember' => $remember,
                'token_prefix' => substr($token, 0, 8) . '...'
            ]);
            
            return $token;
        } catch (Exception $e) {
            Logger::error('Failed to generate auth token', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
    
    public static function revokeToken(string $token): bool {
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE token = ?');
            $result = $stmt->execute([$token]);
            
            if ($result && $stmt->rowCount() > 0) {
                Logger::info('Auth token revoked', [
                    'token_prefix' => substr($token, 0, 8) . '...'
                ]);
                return true;
            }
            
            return false;
        } catch (Exception $e) {
            Logger::error('Failed to revoke auth token', [
                'token_prefix' => substr($token, 0, 8) . '...',
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    public static function revokeAllUserTokens(int $userId): bool {
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE user_id = ?');
            $result = $stmt->execute([$userId]);
            
            Logger::info('All user tokens revoked', [
                'user_id' => $userId,
                'tokens_revoked' => $stmt->rowCount()
            ]);
            
            return $result;
        } catch (Exception $e) {
            Logger::error('Failed to revoke all user tokens', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    public static function cleanExpiredTokens(): int {
        try {
            $pdo = Database::conn();
            $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP');
            $stmt->execute();
            
            $deletedCount = $stmt->rowCount();
            if ($deletedCount > 0) {
                Logger::info('Cleaned expired auth tokens', [
                    'tokens_deleted' => $deletedCount
                ]);
            }
            
            return $deletedCount;
        } catch (Exception $e) {
            Logger::error('Failed to clean expired tokens', [
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }
    
    public static function user(): ?array {
        
        $userId = self::userId();
        if (!$userId) {
            return null;
        }
        
        try {
            $db = Database::conn();
            $stmt = $db->prepare("SELECT id, email, name, role_id FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                // SECURITY: Only return dev user if explicit bypass is enabled
                $appEnv = getenv('APP_ENV') ?: 'production';
                $allowDevBypass = getenv('ALLOW_DEV_BYPASS') === 'true';
                $isDev = ($appEnv === 'development' || $appEnv === 'dev' || $appEnv === 'local');
                if ($isDev && $allowDevBypass) {
                    return [
                        'id' => 1,
                        'email' => 'admin@example.com',
                        'name' => 'Admin User',
                        'role_id' => 1
                    ];
                }
            }
            
            return $user ?: null;
        } catch (Exception $e) {
            Logger::error('Failed to fetch user data', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    public static function isAdmin(): bool {
        $user = self::user();
        if (!$user) {
            return false;
        }
        
        // Role ID 1 is typically Admin in this system
        return (int)($user['role_id'] ?? 0) === 1;
    }
}

// Global alias for compatibility
if (!class_exists('\\Auth')) {
    class_alias('\\Xordon\\Auth', '\\Auth');
}
