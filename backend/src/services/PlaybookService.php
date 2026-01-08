<?php
/**
 * Playbook Service
 * 
 * Handles playbook management with templates, RBAC, and version history.
 * 
 * **Feature: crm-enhancements**
 * **Requirements: 7.1, 7.2, 7.3, 7.4**
 */

require_once __DIR__ . '/../Database.php';

class PlaybookService {
    private $db;
    
    public function __construct() {
        $this->db = Database::conn();
    }
    
    /**
     * Create a new playbook
     * **Requirement 7.1**: Playbook creation with templates
     */
    public function createPlaybook(int $userId, array $data): int {
        // Validate required fields
        if (empty($data['name'])) {
            throw new InvalidArgumentException('Playbook name is required');
        }
        
        // Validate templates structure
        $templates = $data['templates'] ?? [];
        $this->validateTemplates($templates);
        
        $stmt = $this->db->prepare("
            INSERT INTO playbooks (
                user_id, name, description, persona, templates, permissions, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())
        ");
        
        $stmt->execute([
            $userId,
            $data['name'],
            $data['description'] ?? null,
            $data['persona'] ?? null,
            json_encode($templates),
            json_encode($data['permissions'] ?? [])
        ]);
        
        $playbookId = (int) $this->db->lastInsertId();
        
        // Create initial version
        $this->createVersion($playbookId, $templates, $userId, 'Initial version');
        
        return $playbookId;
    }
    
    /**
     * Update a playbook with version history
     * **Requirement 7.4**: Version history tracking
     */
    public function updatePlaybook(int $playbookId, int $userId, array $data): bool {
        // Get current playbook
        $playbook = $this->getPlaybookById($playbookId);
        if (!$playbook) {
            return false;
        }
        
        // Check RBAC permissions
        if (!$this->canEditPlaybook($playbookId, $userId)) {
            throw new Exception('Permission denied');
        }
        
        // Validate templates if provided
        if (isset($data['templates'])) {
            $this->validateTemplates($data['templates']);
        }
        
        $updates = [];
        $params = [];
        
        if (isset($data['name'])) {
            $updates[] = 'name = ?';
            $params[] = $data['name'];
        }
        
        if (isset($data['description'])) {
            $updates[] = 'description = ?';
            $params[] = $data['description'];
        }
        
        if (isset($data['persona'])) {
            $updates[] = 'persona = ?';
            $params[] = $data['persona'];
        }
        
        if (isset($data['templates'])) {
            $updates[] = 'templates = ?';
            $params[] = json_encode($data['templates']);
            
            // Create new version
            $this->createVersion($playbookId, $data['templates'], $userId, $data['change_summary'] ?? null);
        }
        
        if (isset($data['permissions'])) {
            $updates[] = 'permissions = ?';
            $params[] = json_encode($data['permissions']);
        }
        
        if (isset($data['status'])) {
            $updates[] = 'status = ?';
            $params[] = $data['status'];
        }
        
        if (empty($updates)) {
            return true;
        }
        
        $updates[] = 'updated_at = NOW()';
        $params[] = $playbookId;
        
        $sql = "UPDATE playbooks SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return true;
    }
    
    /**
     * Get playbooks with RBAC filtering
     * **Requirement 7.3**: RBAC-based access control
     */
    public function getPlaybooks(int $userId, ?string $persona = null, ?string $status = null): array {
        $where = ['(p.user_id = ? OR JSON_CONTAINS(p.permissions, ?, "$.viewers") OR JSON_CONTAINS(p.permissions, ?, "$.editors"))'];
        $params = [$userId, json_encode($userId), json_encode($userId)];
        
        if ($persona) {
            $where[] = 'p.persona = ?';
            $params[] = $persona;
        }
        
        if ($status) {
            $where[] = 'p.status = ?';
            $params[] = $status;
        } else {
            $where[] = 'p.status = ?';
            $params[] = 'active';
        }
        
        $whereClause = implode(' AND ', $where);
        
        $stmt = $this->db->prepare("
            SELECT p.*, u.name as owner_name,
                   (SELECT COUNT(*) FROM playbook_versions WHERE playbook_id = p.id) as version_count
            FROM playbooks p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE {$whereClause}
            ORDER BY p.updated_at DESC
        ");
        $stmt->execute($params);
        
        $playbooks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Decode JSON fields
        foreach ($playbooks as &$playbook) {
            $playbook['templates'] = json_decode($playbook['templates'], true) ?? [];
            $playbook['permissions'] = json_decode($playbook['permissions'], true) ?? [];
        }
        
        return $playbooks;
    }
    
    /**
     * Get playbook by ID
     */
    public function getPlaybookById(int $playbookId): ?array {
        $stmt = $this->db->prepare("
            SELECT p.*, u.name as owner_name
            FROM playbooks p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        ");
        $stmt->execute([$playbookId]);
        $playbook = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($playbook) {
            $playbook['templates'] = json_decode($playbook['templates'], true) ?? [];
            $playbook['permissions'] = json_decode($playbook['permissions'], true) ?? [];
        }
        
        return $playbook ?: null;
    }
    
    /**
     * Get version history for a playbook
     * **Requirement 7.4**: Version history
     */
    public function getVersionHistory(int $playbookId): array {
        $stmt = $this->db->prepare("
            SELECT pv.*, u.name as editor_name
            FROM playbook_versions pv
            LEFT JOIN users u ON pv.edited_by = u.id
            WHERE pv.playbook_id = ?
            ORDER BY pv.version DESC
        ");
        $stmt->execute([$playbookId]);
        
        $versions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($versions as &$version) {
            $version['content'] = json_decode($version['content'], true) ?? [];
        }
        
        return $versions;
    }
    
    /**
     * Validate templates structure
     * **Requirement 7.2**: Template validation
     */
    public function validateTemplates(array $templates): bool {
        $validChannels = ['email', 'sms', 'call', 'linkedin'];
        
        foreach ($templates as $channel => $template) {
            if (!in_array($channel, $validChannels)) {
                throw new InvalidArgumentException("Invalid channel: {$channel}");
            }
            
            // Validate email template
            if ($channel === 'email') {
                if (isset($template['subject']) && strlen($template['subject']) > 500) {
                    throw new InvalidArgumentException('Email subject too long');
                }
            }
            
            // Validate SMS template
            if ($channel === 'sms') {
                if (isset($template['body']) && strlen($template['body']) > 1600) {
                    throw new InvalidArgumentException('SMS body too long');
                }
            }
            
            // Validate call script
            if ($channel === 'call') {
                if (isset($template['script']) && !is_string($template['script'])) {
                    throw new InvalidArgumentException('Call script must be a string');
                }
            }
        }
        
        return true;
    }
    
    /**
     * Check if user can edit playbook
     * **Requirement 7.3, 7.5**: RBAC enforcement
     */
    public function canEditPlaybook(int $playbookId, int $userId): bool {
        $playbook = $this->getPlaybookById($playbookId);
        
        if (!$playbook) {
            return false;
        }
        
        // Owner can always edit
        if ($playbook['user_id'] == $userId) {
            return true;
        }
        
        // Check editors list
        $permissions = $playbook['permissions'];
        if (isset($permissions['editors']) && in_array($userId, $permissions['editors'])) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if user can view playbook
     */
    public function canViewPlaybook(int $playbookId, int $userId): bool {
        $playbook = $this->getPlaybookById($playbookId);
        
        if (!$playbook) {
            return false;
        }
        
        // Owner can always view
        if ($playbook['user_id'] == $userId) {
            return true;
        }
        
        $permissions = $playbook['permissions'];
        
        // Check editors list
        if (isset($permissions['editors']) && in_array($userId, $permissions['editors'])) {
            return true;
        }
        
        // Check viewers list
        if (isset($permissions['viewers']) && in_array($userId, $permissions['viewers'])) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Create a new version
     */
    private function createVersion(int $playbookId, array $templates, int $userId, ?string $changeSummary = null): void {
        // Get current version number
        $stmt = $this->db->prepare("
            SELECT COALESCE(MAX(version), 0) + 1 as next_version
            FROM playbook_versions
            WHERE playbook_id = ?
        ");
        $stmt->execute([$playbookId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $nextVersion = $result['next_version'];
        
        $stmt = $this->db->prepare("
            INSERT INTO playbook_versions (playbook_id, version, content, change_summary, edited_by, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $playbookId,
            $nextVersion,
            json_encode($templates),
            $changeSummary,
            $userId
        ]);
    }
}
