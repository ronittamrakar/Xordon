<?php
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../Auth.php';

class WorkspacesController {
    private static function slugify(string $value): string {
        $slug = strtolower($value);
        $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug);
        $slug = trim($slug, '-');
        $slug = preg_replace('/-+/', '-', $slug);
        return $slug ?: 'workspace';
    }

    public static function index(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();

        $stmt = $pdo->prepare('SELECT w.id, w.name, w.slug, m.role, w.created_at FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE m.user_id = ? ORDER BY (m.role = "owner") DESC, w.id ASC');
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();

        $items = array_map(function ($r) {
            return [
                'id' => (string)$r['id'],
                'name' => $r['name'],
                'slug' => $r['slug'],
                'role' => $r['role'],
                'created_at' => $r['created_at'] ?? null,
            ];
        }, $rows);

        Response::json(['items' => $items]);
    }

    public static function current(): void {
        $userId = Auth::userIdOrFail();
        $workspaceId = Auth::workspaceId($userId);
        if (!$workspaceId) {
            Response::error('Workspace not found', 404);
        }

        $pdo = Database::conn();
        $stmt = $pdo->prepare('SELECT w.id, w.name, w.slug FROM workspaces w JOIN workspace_members m ON m.workspace_id = w.id WHERE m.user_id = ? AND w.id = ? LIMIT 1');
        $stmt->execute([$userId, $workspaceId]);
        $row = $stmt->fetch();
        if (!$row) {
            Response::error('Workspace not found', 404);
        }

        Response::json([
            'id' => (string)$row['id'],
            'name' => $row['name'],
            'slug' => $row['slug'],
        ]);
    }

    public static function create(): void {
        $userId = Auth::userIdOrFail();
        $pdo = Database::conn();

        $body = get_json_body();
        $name = trim((string)($body['name'] ?? ''));
        $slugInput = trim((string)($body['slug'] ?? ''));

        if ($name === '') {
            Response::error('Missing name', 422);
        }

        $baseSlug = self::slugify($slugInput ?: $name);
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
            $stmt->execute([$name, $slug, $userId]);
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

        Response::json([
            'id' => (string)$workspaceId,
            'name' => $name,
            'slug' => $slug,
        ], 201);
    }

    public static function update(string $id): void {
        $userId = Auth::userIdOrFail();
        if (!ctype_digit($id)) {
            Response::error('Invalid workspace id', 422);
        }
        $workspaceId = (int)$id;

        $pdo = Database::conn();

        $memberStmt = $pdo->prepare('SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1');
        $memberStmt->execute([$workspaceId, $userId]);
        $member = $memberStmt->fetch();
        if (!$member || !in_array($member['role'], ['owner', 'admin'], true)) {
            Response::forbidden('Not allowed');
        }

        $body = get_json_body();
        $name = array_key_exists('name', $body) ? trim((string)$body['name']) : null;
        $slugInput = array_key_exists('slug', $body) ? trim((string)$body['slug']) : null;

        $updates = [];
        $params = [];

        if ($name !== null) {
            if ($name === '') {
                Response::error('Invalid name', 422);
            }
            $updates[] = 'name = ?';
            $params[] = $name;
        }

        if ($slugInput !== null) {
            $baseSlug = self::slugify($slugInput);
            $slug = $baseSlug;
            $suffix = 1;
            while (true) {
                $check = $pdo->prepare('SELECT id FROM workspaces WHERE slug = ? AND id <> ? LIMIT 1');
                $check->execute([$slug, $workspaceId]);
                if (!$check->fetch()) {
                    break;
                }
                $suffix++;
                $slug = $baseSlug . '-' . $suffix;
                if ($suffix > 50) {
                    Response::error('Unable to generate unique workspace slug', 500);
                }
            }
            $updates[] = 'slug = ?';
            $params[] = $slug;
        }

        if (empty($updates)) {
            Response::error('No changes', 422);
        }

        $params[] = $workspaceId;
        $stmt = $pdo->prepare('UPDATE workspaces SET ' . implode(', ', $updates) . ', updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute($params);

        $stmt = $pdo->prepare('SELECT id, name, slug FROM workspaces WHERE id = ?');
        $stmt->execute([$workspaceId]);
        $row = $stmt->fetch();
        if (!$row) {
            Response::error('Workspace not found', 404);
        }

        Response::json([
            'id' => (string)$row['id'],
            'name' => $row['name'],
            'slug' => $row['slug'],
        ]);
    }
}
