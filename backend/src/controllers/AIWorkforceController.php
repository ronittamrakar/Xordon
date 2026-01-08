<?php
namespace Xordon\Controllers;

use Xordon\Database;
use Exception;

/**
 * AI Workforce Controller
 * Manages AI employees, capabilities, workflows, and task queue
 */
class AIWorkforceController {
    
    /**
     * Get all AI employees for a workspace
     */
    public function getEmployees() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT e.*, a.name as agent_name
                FROM ai_employees e
                LEFT JOIN ai_agents a ON e.agent_id = a.id
                WHERE e.workspace_id = ? 
                ORDER BY e.created_at DESC";
        
        $employees = Database::select($sql, [$workspaceId]);
        
        // Decode JSON fields
        foreach ($employees as &$employee) {
            $employee['capabilities'] = json_decode($employee['capabilities'] ?? '[]', true);
            $employee['personality_config'] = json_decode($employee['personality_config'] ?? '{}', true);
            $employee['performance_metrics'] = json_decode($employee['performance_metrics'] ?? '{}', true);
        }
        
        return $employees; // Return direct array for frontend consistency
    }
    
    /**
     * Create a new AI employee (Promote Agent)
     */
    public function createEmployee() {
        $workspaceId = $_SESSION['workspace_id'] ?? $GLOBALS['tenantContext']['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $body = file_get_contents('php://input');
        $raw = json_decode($body, true);
        $data = $raw['data'] ?? $raw; // Handle nested or flat data
        
        $sql = "INSERT INTO ai_employees (
            workspace_id, agent_id, role, employee_type, autonomy_level,
            supervisor_id, capabilities, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $workspaceId,
                $data['agent_id'],
                $data['role'] ?? 'specialist',
                $data['employee_type'] ?? 'specialized',
                $data['autonomy_level'] ?? 'assisted',
                $data['supervisor_id'] ?? null,
                json_encode($data['capabilities'] ?? []),
                $raw['status'] ?? 'active',
                $_SESSION['user_id'] ?? null
            ]);
            
            $id = Database::conn()->lastInsertId();
            return ['success' => true, 'id' => $id];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Update an AI employee
     */
    public function updateEmployee($id) {
        $workspaceId = $_SESSION['workspace_id'] ?? $GLOBALS['tenantContext']['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $body = file_get_contents('php://input');
        $raw = json_decode($body, true);
        $data = $raw['data'] ?? $raw;
        
        $sql = "UPDATE ai_employees SET 
            role = ?, employee_type = ?, autonomy_level = ?, 
            supervisor_id = ?, capabilities = ?, status = ?
            WHERE id = ? AND workspace_id = ?";
        
        try {
            Database::execute($sql, [
                $data['role'] ?? 'specialist',
                $data['employee_type'] ?? 'specialized',
                $data['autonomy_level'] ?? 'assisted',
                $data['supervisor_id'] ?? null,
                json_encode($data['capabilities'] ?? []),
                $raw['status'] ?? 'active',
                $id,
                $workspaceId
            ]);
            
            return ['success' => true];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Delete an AI employee
     */
    public function deleteEmployee($id) {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "DELETE FROM ai_employees WHERE id = ? AND workspace_id = ?";
        
        try {
            Database::execute($sql, [$id, $workspaceId]);
            return ['success' => true];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get all available AI capabilities
     */
    public function getCapabilities() {
        $sql = "SELECT * FROM ai_capabilities WHERE is_active = 1 ORDER BY category, name";
        $capabilities = Database::select($sql);
        
        // Decode JSON fields
        foreach ($capabilities as &$capability) {
            $capability['config_schema'] = json_decode($capability['config_schema'] ?? '{}', true);
            $capability['required_integrations'] = json_decode($capability['required_integrations'] ?? '[]', true);
        }
        
        return ['capabilities' => $capabilities];
    }
    
    /**
     * Get all workflows for a workspace
     */
    public function getWorkflows() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT w.*, e.name as employee_name 
                FROM ai_workflows w
                LEFT JOIN ai_employees e ON w.assigned_employee_id = e.id
                WHERE w.workspace_id = ? 
                ORDER BY w.created_at DESC";
        
        $workflows = Database::select($sql, [$workspaceId]);
        
        // Decode JSON fields
        foreach ($workflows as &$workflow) {
            $workflow['trigger_config'] = json_decode($workflow['trigger_config'] ?? '{}', true);
            $workflow['steps'] = json_decode($workflow['steps'] ?? '[]', true);
        }
        
        return ['workflows' => $workflows];
    }
    
    /**
     * Create a new workflow
     */
    public function createWorkflow() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO ai_workflows (
            workspace_id, name, description, trigger_config, steps,
            status, assigned_employee_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $workspaceId,
                $data['name'],
                $data['description'] ?? null,
                json_encode($data['trigger_config'] ?? []),
                json_encode($data['steps'] ?? []),
                $data['status'] ?? 'draft',
                $data['assigned_employee_id'] ?? null,
                $_SESSION['user_id'] ?? null
            ]);
            
            $id = Database::conn()->lastInsertId();
            return ['success' => true, 'id' => $id];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Execute a workflow
     */
    public function executeWorkflow($id) {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Get workflow
        $workflow = Database::first(
            "SELECT * FROM ai_workflows WHERE id = ? AND workspace_id = ?",
            [$id, $workspaceId]
        );
        
        if (!$workflow) {
            return ['error' => 'Workflow not found'];
        }
        
        // Create execution record
        $sql = "INSERT INTO ai_workflow_executions (
            workflow_id, ai_employee_id, status, input_data, started_at
        ) VALUES (?, ?, ?, ?, NOW())";
        
        try {
            Database::execute($sql, [
                $id,
                $workflow['assigned_employee_id'],
                'running',
                json_encode($data['input_data'] ?? [])
            ]);
            
            $executionId = Database::conn()->lastInsertId();
            
            // TODO: Implement actual workflow execution logic here
            // For now, just mark as completed
            Database::execute(
                "UPDATE ai_workflow_executions SET status = 'completed', completed_at = NOW() WHERE id = ?",
                [$executionId]
            );
            
            return ['success' => true, 'execution_id' => $executionId];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Get task queue
     */
    public function getTaskQueue() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $sql = "SELECT t.*, e.name as employee_name
                FROM ai_task_queue t
                LEFT JOIN ai_employees e ON t.ai_employee_id = e.id
                WHERE t.workspace_id = ?
                ORDER BY t.priority DESC, t.created_at ASC
                LIMIT 100";
        
        $tasks = Database::select($sql, [$workspaceId]);
        
        // Decode JSON fields
        foreach ($tasks as &$task) {
            $task['payload'] = json_decode($task['payload'] ?? '{}', true);
            $task['result'] = json_decode($task['result'] ?? '{}', true);
        }
        
        return ['tasks' => $tasks];
    }
    
    /**
     * Add task to queue
     */
    public function addTask() {
        $workspaceId = $_SESSION['workspace_id'] ?? null;
        if (!$workspaceId) {
            return ['error' => 'No workspace selected'];
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $sql = "INSERT INTO ai_task_queue (
            workspace_id, ai_employee_id, task_type, priority,
            payload, scheduled_at
        ) VALUES (?, ?, ?, ?, ?, ?)";
        
        try {
            Database::execute($sql, [
                $workspaceId,
                $data['ai_employee_id'] ?? null,
                $data['task_type'],
                $data['priority'] ?? 0,
                json_encode($data['payload'] ?? []),
                $data['scheduled_at'] ?? null
            ]);
            
            $id = Database::conn()->lastInsertId();
            return ['success' => true, 'id' => $id];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
}
