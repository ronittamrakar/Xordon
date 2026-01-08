<?php
require_once __DIR__ . '/../../src/auth_check.php';
require_once __DIR__ . '/../../src/db.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db = getDbConnection();
$userId = $_SESSION['user_id'];
$workspaceId = $_SESSION['workspace_id'] ?? null;

if (!$workspaceId) {
    http_response_code(400);
    echo json_encode(['error' => 'No workspace selected']);
    exit;
}

switch ($method) {
    case 'GET':
        // Get all budgets
        $stmt = $db->prepare("
            SELECT * FROM ad_budgets 
            WHERE workspace_id = ? 
            ORDER BY created_at DESC
        ");
        $stmt->execute([$workspaceId]);
        $budgets = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format numeric values
        foreach ($budgets as &$budget) {
            $budget['total_budget'] = (float) $budget['total_budget'];
            $budget['spent'] = (float) ($budget['spent'] ?? 0);
            $budget['remaining'] = (float) ($budget['total_budget'] - ($budget['spent'] ?? 0));
        }
        
        echo json_encode($budgets);
        break;

    case 'POST':
        // Create new budget
        $data = json_decode(file_get_contents('php://input'), true);
        
        $name = $data['name'] ?? null;
        $totalBudget = $data['total_budget'] ?? null;
        $startDate = $data['start_date'] ?? null;
        $endDate = $data['end_date'] ?? null;
        $campaignIds = $data['campaign_ids'] ?? [];
        
        if (!$name || !$totalBudget || !$startDate || !$endDate) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }
        
        $stmt = $db->prepare("
            INSERT INTO ad_budgets 
            (workspace_id, name, total_budget, start_date, end_date, spent, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 0, 'active', NOW(), NOW())
        ");
        $stmt->execute([
            $workspaceId,
            $name,
            (float) $totalBudget,
            $startDate,
            $endDate
        ]);
        
        $budgetId = $db->lastInsertId();
        
        // Associate campaigns with budget
        if (!empty($campaignIds)) {
            $stmt = $db->prepare("
                UPDATE ad_campaigns 
                SET budget_id = ?, updated_at = NOW()
                WHERE id = ? AND account_id IN (
                    SELECT id FROM ad_accounts WHERE workspace_id = ?
                )
            ");
            foreach ($campaignIds as $campaignId) {
                $stmt->execute([$budgetId, $campaignId, $workspaceId]);
            }
        }
        
        echo json_encode([
            'id' => $budgetId,
            'message' => 'Budget created successfully'
        ]);
        break;

    case 'PUT':
        // Update budget
        $pathParts = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
        $budgetId = end($pathParts);
        
        if (!is_numeric($budgetId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid budget ID']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Verify budget belongs to workspace
        $stmt = $db->prepare("SELECT id FROM ad_budgets WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$budgetId, $workspaceId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Budget not found']);
            exit;
        }
        
        // Build update query
        $updates = [];
        $params = [];
        
        if (isset($data['name'])) {
            $updates[] = "name = ?";
            $params[] = $data['name'];
        }
        
        if (isset($data['total_budget'])) {
            $updates[] = "total_budget = ?";
            $params[] = (float) $data['total_budget'];
        }
        
        if (isset($data['start_date'])) {
            $updates[] = "start_date = ?";
            $params[] = $data['start_date'];
        }
        
        if (isset($data['end_date'])) {
            $updates[] = "end_date = ?";
            $params[] = $data['end_date'];
        }
        
        if (isset($data['status'])) {
            $updates[] = "status = ?";
            $params[] = $data['status'];
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }
        
        $updates[] = "updated_at = NOW()";
        $params[] = $budgetId;
        
        $sql = "UPDATE ad_budgets SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode(['message' => 'Budget updated successfully']);
        break;

    case 'DELETE':
        // Delete budget
        $pathParts = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
        $budgetId = end($pathParts);
        
        if (!is_numeric($budgetId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid budget ID']);
            exit;
        }
        
        // Verify budget belongs to workspace
        $stmt = $db->prepare("SELECT id FROM ad_budgets WHERE id = ? AND workspace_id = ?");
        $stmt->execute([$budgetId, $workspaceId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Budget not found']);
            exit;
        }
        
        // Remove budget association from campaigns
        $stmt = $db->prepare("UPDATE ad_campaigns SET budget_id = NULL WHERE budget_id = ?");
        $stmt->execute([$budgetId]);
        
        // Delete budget
        $stmt = $db->prepare("DELETE FROM ad_budgets WHERE id = ?");
        $stmt->execute([$budgetId]);
        
        echo json_encode(['message' => 'Budget deleted successfully']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
