<?php
/**
 * Campaign Flows API
 * Handles CRUD operations for visual campaign flow builder
 */

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/Auth.php';
require_once __DIR__ . '/../../src/SecurityHeaders.php';

header('Content-Type: application/json');
SecurityHeaders::applyCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../src/Database.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['path']) ? trim($_GET['path'], '/') : '';
$pathParts = $path ? explode('/', $path) : [];

$userId = Auth::userIdOrFail();

try {
    $pdo = Database::conn();
    
    // Ensure flows table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS campaign_flows (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            status ENUM('draft', 'active', 'paused') DEFAULT 'draft',
            nodes JSON,
            automation_id VARCHAR(100) DEFAULT NULL,
            flow_type ENUM('campaign', 'automation') DEFAULT 'campaign',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            user_id INT DEFAULT 1,
            INDEX idx_status (status),
            INDEX idx_user (user_id),
            INDEX idx_automation (automation_id),
            INDEX idx_flow_type (flow_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    
    // Add automation_id column if it doesn't exist (for existing tables)
    try {
        $pdo->exec("ALTER TABLE campaign_flows ADD COLUMN automation_id VARCHAR(100) DEFAULT NULL AFTER nodes");
    } catch (PDOException $e) {
        // Column already exists, ignore
    }
    try {
        $pdo->exec("ALTER TABLE campaign_flows ADD COLUMN flow_type ENUM('campaign', 'automation') DEFAULT 'campaign' AFTER automation_id");
    } catch (PDOException $e) {
        // Column already exists, ignore
    }
    try {
        $pdo->exec("ALTER TABLE campaign_flows ADD INDEX idx_automation (automation_id)");
    } catch (PDOException $e) {
        // Index already exists, ignore
    }
    try {
        $pdo->exec("ALTER TABLE campaign_flows ADD INDEX idx_flow_type (flow_type)");
    } catch (PDOException $e) {
        // Index already exists, ignore
    }

    // Ensure flow_stats table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS flow_stats (
            id INT AUTO_INCREMENT PRIMARY KEY,
            flow_id INT NOT NULL,
            total_contacts INT DEFAULT 0,
            emails_sent INT DEFAULT 0,
            sms_sent INT DEFAULT 0,
            conversions INT DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (flow_id) REFERENCES campaign_flows(id) ON DELETE CASCADE,
            UNIQUE KEY unique_flow (flow_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Ensure flow_contacts table exists (tracks contacts in flows)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS flow_contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            flow_id INT NOT NULL,
            contact_id INT NOT NULL,
            current_node_id VARCHAR(100),
            status ENUM('active', 'completed', 'paused', 'exited') DEFAULT 'active',
            entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            FOREIGN KEY (flow_id) REFERENCES campaign_flows(id) ON DELETE CASCADE,
            INDEX idx_flow_contact (flow_id, contact_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Ensure flow_logs table exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS flow_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            flow_id INT NOT NULL,
            contact_id INT,
            node_id VARCHAR(100),
            action_type VARCHAR(50),
            status ENUM('success', 'failed', 'skipped') DEFAULT 'success',
            details JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (flow_id) REFERENCES campaign_flows(id) ON DELETE CASCADE,
            INDEX idx_flow (flow_id),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    switch ($method) {
        case 'GET':
            if (empty($pathParts)) {
                // List all flows
                $stmt = $pdo->prepare("
                    SELECT 
                        f.*,
                        COALESCE(s.total_contacts, 0) as total_contacts,
                        COALESCE(s.emails_sent, 0) as emails_sent,
                        COALESCE(s.sms_sent, 0) as sms_sent,
                        COALESCE(s.conversions, 0) as conversions,
                        JSON_LENGTH(f.nodes) as nodes_count
                    FROM campaign_flows f
                    LEFT JOIN flow_stats s ON f.id = s.flow_id
                    WHERE f.user_id = ?
                    ORDER BY f.updated_at DESC
                ");
                $stmt->execute([$userId]);
                $flows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Format response
                $formattedFlows = array_map(function($flow) {
                    $nodes = json_decode($flow['nodes'] ?? '[]', true);
                    return [
                        'id' => (int)$flow['id'],
                        'name' => $flow['name'],
                        'description' => $flow['description'],
                        'status' => $flow['status'],
                        'automation_id' => $flow['automation_id'] ?? null,
                        'recipe_id' => isset($flow['recipe_id']) ? (int)$flow['recipe_id'] : null,
                        'flow_type' => $flow['flow_type'] ?? 'campaign',
                        'nodes_count' => is_array($nodes) ? count($nodes) : 0,
                        'created_at' => $flow['created_at'],
                        'updated_at' => $flow['updated_at'],
                        'stats' => [
                            'total_contacts' => (int)$flow['total_contacts'],
                            'emails_sent' => (int)$flow['emails_sent'],
                            'sms_sent' => (int)$flow['sms_sent'],
                            'conversions' => (int)$flow['conversions'],
                            'conversion_rate' => $flow['total_contacts'] > 0 
                                ? round(($flow['conversions'] / $flow['total_contacts']) * 100, 1) 
                                : 0
                        ]
                    ];
                }, $flows);
                
                echo json_encode(['success' => true, 'flows' => $formattedFlows]);
            } elseif (count($pathParts) === 1 && is_numeric($pathParts[0])) {
                // Get single flow
                $flowId = (int)$pathParts[0];
                $stmt = $pdo->prepare("
                    SELECT 
                        f.*,
                        COALESCE(s.total_contacts, 0) as total_contacts,
                        COALESCE(s.emails_sent, 0) as emails_sent,
                        COALESCE(s.sms_sent, 0) as sms_sent,
                        COALESCE(s.conversions, 0) as conversions
                    FROM campaign_flows f
                    LEFT JOIN flow_stats s ON f.id = s.flow_id
                    WHERE f.id = ? AND f.user_id = ?
                ");
                $stmt->execute([$flowId, $userId]);
                $flow = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$flow) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Flow not found']);
                    exit;
                }
                
                $nodes = json_decode($flow['nodes'] ?? '[]', true);
                
                echo json_encode([
                    'success' => true,
                    'flow' => [
                        'id' => (int)$flow['id'],
                        'name' => $flow['name'],
                        'description' => $flow['description'],
                        'status' => $flow['status'],
                        'automation_id' => $flow['automation_id'] ?? null,
                        'recipe_id' => isset($flow['recipe_id']) ? (int)$flow['recipe_id'] : null,
                        'flow_type' => $flow['flow_type'] ?? 'campaign',
                        'nodes' => $nodes,
                        'created_at' => $flow['created_at'],
                        'updated_at' => $flow['updated_at'],
                        'stats' => [
                            'total_contacts' => (int)$flow['total_contacts'],
                            'emails_sent' => (int)$flow['emails_sent'],
                            'sms_sent' => (int)$flow['sms_sent'],
                            'conversions' => (int)$flow['conversions'],
                            'conversion_rate' => $flow['total_contacts'] > 0 
                                ? round(($flow['conversions'] / $flow['total_contacts']) * 100, 1) 
                                : 0
                        ]
                    ]
                ]);
            } elseif (count($pathParts) === 2 && $pathParts[1] === 'logs') {
                // Get flow logs
                $flowId = (int)$pathParts[0];
                $check = $pdo->prepare('SELECT 1 FROM campaign_flows WHERE id = ? AND user_id = ?');
                $check->execute([$flowId, $userId]);
                if (!$check->fetch()) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Flow not found']);
                    exit;
                }
                $stmt = $pdo->prepare("
                    SELECT * FROM flow_logs 
                    WHERE flow_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT 100
                ");
                $stmt->execute([$flowId]);
                $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'logs' => $logs]);
            } elseif (count($pathParts) === 2 && $pathParts[1] === 'contacts') {
                // Get contacts in flow
                $flowId = (int)$pathParts[0];
                $check = $pdo->prepare('SELECT 1 FROM campaign_flows WHERE id = ? AND user_id = ?');
                $check->execute([$flowId, $userId]);
                if (!$check->fetch()) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Flow not found']);
                    exit;
                }
                $stmt = $pdo->prepare("
                    SELECT fc.*, c.email, c.first_name, c.last_name, c.phone
                    FROM flow_contacts fc
                    LEFT JOIN contacts c ON fc.contact_id = c.id
                    WHERE fc.flow_id = ?
                    ORDER BY fc.entered_at DESC
                    LIMIT 100
                ");
                $stmt->execute([$flowId]);
                $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'contacts' => $contacts]);
            } elseif (count($pathParts) === 2 && $pathParts[0] === 'by-automation') {
                // Get flow by automation_id
                $automationId = $pathParts[1];
                $stmt = $pdo->prepare("
                    SELECT 
                        f.*,
                        COALESCE(s.total_contacts, 0) as total_contacts,
                        COALESCE(s.emails_sent, 0) as emails_sent,
                        COALESCE(s.sms_sent, 0) as sms_sent,
                        COALESCE(s.conversions, 0) as conversions
                    FROM campaign_flows f
                    LEFT JOIN flow_stats s ON f.id = s.flow_id
                    WHERE f.automation_id = ? AND f.user_id = ?
                ");
                $stmt->execute([$automationId, $userId]);
                $flow = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$flow) {
                    echo json_encode(['success' => true, 'flow' => null]);
                    exit;
                }
                
                $nodes = json_decode($flow['nodes'] ?? '[]', true);
                
                echo json_encode([
                    'success' => true,
                    'flow' => [
                        'id' => (int)$flow['id'],
                        'name' => $flow['name'],
                        'description' => $flow['description'],
                        'status' => $flow['status'],
                        'automation_id' => $flow['automation_id'] ?? null,
                        'flow_type' => $flow['flow_type'] ?? 'campaign',
                        'nodes' => $nodes,
                        'created_at' => $flow['created_at'],
                        'updated_at' => $flow['updated_at'],
                        'stats' => [
                            'total_contacts' => (int)$flow['total_contacts'],
                            'emails_sent' => (int)$flow['emails_sent'],
                            'sms_sent' => (int)$flow['sms_sent'],
                            'conversions' => (int)$flow['conversions'],
                            'conversion_rate' => $flow['total_contacts'] > 0 
                                ? round(($flow['conversions'] / $flow['total_contacts']) * 100, 1) 
                                : 0
                        ]
                    ]
                ]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (count($pathParts) === 2 && $pathParts[1] === 'duplicate') {
                // Duplicate flow
                $flowId = (int)$pathParts[0];
                $stmt = $pdo->prepare("SELECT * FROM campaign_flows WHERE id = ? AND user_id = ?");
                $stmt->execute([$flowId, $userId]);
                $original = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$original) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Flow not found']);
                    exit;
                }
                
                $stmt = $pdo->prepare("
                    INSERT INTO campaign_flows (name, description, status, nodes, user_id)
                    VALUES (?, ?, 'draft', ?, ?)
                ");
                $stmt->execute([
                    $original['name'] . ' (Copy)',
                    $original['description'],
                    $original['nodes'],
                    $userId
                ]);
                
                $newId = $pdo->lastInsertId();
                
                // Create stats record
                $pdo->prepare("INSERT INTO flow_stats (flow_id) VALUES (?)")->execute([$newId]);
                
                // Get the new flow
                $stmt = $pdo->prepare("SELECT * FROM campaign_flows WHERE id = ?");
                $stmt->execute([$newId]);
                $newFlow = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'flow' => [
                        'id' => (int)$newFlow['id'],
                        'name' => $newFlow['name'],
                        'description' => $newFlow['description'],
                        'status' => $newFlow['status'],
                        'nodes_count' => count(json_decode($newFlow['nodes'] ?? '[]', true)),
                        'created_at' => $newFlow['created_at'],
                        'updated_at' => $newFlow['updated_at'],
                        'stats' => [
                            'total_contacts' => 0,
                            'emails_sent' => 0,
                            'sms_sent' => 0,
                            'conversions' => 0,
                            'conversion_rate' => 0
                        ]
                    ]
                ]);
            } else {
                // Create new flow
                $name = $data['name'] ?? 'Untitled Flow';
                $description = $data['description'] ?? '';
                $status = $data['status'] ?? 'draft';
                $nodes = json_encode($data['nodes'] ?? []);
                $automationId = $data['automation_id'] ?? null;
                $flowType = $data['flow_type'] ?? 'campaign';
                
                $stmt = $pdo->prepare("
                    INSERT INTO campaign_flows (name, description, status, nodes, automation_id, flow_type, user_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([$name, $description, $status, $nodes, $automationId, $flowType, $userId]);
                
                $flowId = $pdo->lastInsertId();
                
                // Create stats record
                $pdo->prepare("INSERT INTO flow_stats (flow_id) VALUES (?)")->execute([$flowId]);
                
                echo json_encode([
                    'success' => true,
                    'flow' => [
                        'id' => (int)$flowId,
                        'name' => $name,
                        'description' => $description,
                        'status' => $status,
                        'automation_id' => $automationId,
                        'flow_type' => $flowType,
                        'nodes' => $data['nodes'] ?? []
                    ]
                ]);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (count($pathParts) >= 1) {
                $flowId = (int)$pathParts[0];
                
                if (count($pathParts) === 2 && $pathParts[1] === 'status') {
                    // Update status only
                    $status = $data['status'] ?? 'draft';
                    $stmt = $pdo->prepare("UPDATE campaign_flows SET status = ? WHERE id = ? AND user_id = ?");
                    $stmt->execute([$status, $flowId, $userId]);
                    
                    echo json_encode(['success' => true, 'status' => $status]);
                } else {
                    // Update full flow
                    $name = $data['name'] ?? 'Untitled Flow';
                    $description = $data['description'] ?? '';
                    $status = $data['status'] ?? 'draft';
                    $nodes = json_encode($data['nodes'] ?? []);
                    $automationId = $data['automation_id'] ?? null;
                    $flowType = $data['flow_type'] ?? 'campaign';
                    
                    $stmt = $pdo->prepare("
                        UPDATE campaign_flows 
                        SET name = ?, description = ?, status = ?, nodes = ?, automation_id = ?, flow_type = ?
                        WHERE id = ? AND user_id = ?
                    ");
                    $stmt->execute([$name, $description, $status, $nodes, $automationId, $flowType, $flowId, $userId]);
                    
                    echo json_encode([
                        'success' => true,
                        'flow' => [
                            'id' => $flowId,
                            'name' => $name,
                            'description' => $description,
                            'status' => $status,
                            'automation_id' => $automationId,
                            'flow_type' => $flowType,
                            'nodes' => $data['nodes'] ?? []
                        ]
                    ]);
                }
            }
            break;

        case 'DELETE':
            if (count($pathParts) === 1) {
                $flowId = (int)$pathParts[0];
                
                // Delete flow (cascades to stats, contacts, logs)
                $stmt = $pdo->prepare("DELETE FROM campaign_flows WHERE id = ? AND user_id = ?");
                $stmt->execute([$flowId, $userId]);
                
                echo json_encode(['success' => true]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
