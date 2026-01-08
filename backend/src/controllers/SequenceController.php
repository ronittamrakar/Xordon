<?php
/**
 * SequenceController - REST API endpoints for multi-channel sequences
 * Requirements: 2.1, 2.3, 2.4
 */

require_once __DIR__ . '/../services/SequenceService.php';
require_once __DIR__ . '/../Auth.php';

class SequenceController {
    private $service;
    
    public function __construct() {
        $this->service = new SequenceService();
    }
    
    /**
     * GET /api/sequences - List all sequences for the authenticated user
     * Requirements: 2.1
     */
    public function index(): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $status = $_GET['status'] ?? null;
            $sequences = $this->service->getSequences($userId, $status);
            
            // Format response
            $formatted = array_map(function($seq) {
                return [
                    'id' => (int) $seq['id'],
                    'name' => $seq['name'],
                    'description' => $seq['description'],
                    'steps' => json_decode($seq['steps'], true),
                    'conditions' => $seq['conditions'] ? json_decode($seq['conditions'], true) : null,
                    'status' => $seq['status'],
                    'created_at' => $seq['created_at'],
                    'updated_at' => $seq['updated_at']
                ];
            }, $sequences);
            
            $this->jsonResponse(['success' => true, 'data' => $formatted]);
            
        } catch (Exception $e) {
            error_log("SequenceController::index error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to fetch sequences'], 500);
        }
    }
    
    /**
     * GET /api/sequences/{id} - Get a single sequence
     * Requirements: 2.1
     */
    public function show(int $id): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $sequence = $this->service->getSequenceById($id);
            
            if (!$sequence || $sequence['user_id'] != $userId) {
                $this->jsonResponse(['error' => 'Sequence not found'], 404);
                return;
            }
            
            $formatted = [
                'id' => (int) $sequence['id'],
                'name' => $sequence['name'],
                'description' => $sequence['description'],
                'steps' => json_decode($sequence['steps'], true),
                'conditions' => $sequence['conditions'] ? json_decode($sequence['conditions'], true) : null,
                'status' => $sequence['status'],
                'created_at' => $sequence['created_at'],
                'updated_at' => $sequence['updated_at']
            ];
            
            $this->jsonResponse(['success' => true, 'data' => $formatted]);
            
        } catch (Exception $e) {
            error_log("SequenceController::show error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to fetch sequence'], 500);
        }
    }
    
    /**
     * POST /api/sequences - Create a new sequence
     * Requirements: 2.1, 2.4
     */
    public function store(): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                $this->jsonResponse(['error' => 'Invalid JSON'], 400);
                return;
            }
            
            // Validate required fields
            if (empty($data['name'])) {
                $this->jsonResponse(['error' => 'Name is required'], 400);
                return;
            }
            
            if (empty($data['steps']) || !is_array($data['steps'])) {
                $this->jsonResponse(['error' => 'Steps array is required'], 400);
                return;
            }
            
            $sequenceId = $this->service->createSequence(
                $userId,
                $data['name'],
                $data['steps'],
                $data['conditions'] ?? null,
                $data['description'] ?? null
            );
            
            $this->jsonResponse([
                'success' => true,
                'data' => ['id' => $sequenceId],
                'message' => 'Sequence created successfully'
            ], 201);
            
        } catch (InvalidArgumentException $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            error_log("SequenceController::store error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to create sequence'], 500);
        }
    }
    
    /**
     * PUT /api/sequences/{id} - Update a sequence
     * Requirements: 2.1
     */
    public function update(int $id): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                $this->jsonResponse(['error' => 'Invalid JSON'], 400);
                return;
            }
            
            $this->service->updateSequence($id, $userId, $data);
            
            $this->jsonResponse([
                'success' => true,
                'message' => 'Sequence updated successfully'
            ]);
            
        } catch (RuntimeException $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 404);
        } catch (InvalidArgumentException $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            error_log("SequenceController::update error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to update sequence'], 500);
        }
    }
    
    /**
     * DELETE /api/sequences/{id} - Delete a sequence
     * Requirements: 2.1
     */
    public function destroy(int $id): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $this->service->deleteSequence($id, $userId);
            
            $this->jsonResponse([
                'success' => true,
                'message' => 'Sequence deleted successfully'
            ]);
            
        } catch (Exception $e) {
            error_log("SequenceController::destroy error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to delete sequence'], 500);
        }
    }
    
    /**
     * POST /api/sequences/{id}/execute - Execute next step for a contact
     * Requirements: 2.1, 2.3
     */
    public function execute(int $id): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['contact_id'])) {
                $this->jsonResponse(['error' => 'contact_id is required'], 400);
                return;
            }
            
            // Verify sequence ownership
            $sequence = $this->service->getSequenceById($id);
            if (!$sequence || $sequence['user_id'] != $userId) {
                $this->jsonResponse(['error' => 'Sequence not found'], 404);
                return;
            }
            
            $result = $this->service->executeStep($id, (int) $data['contact_id']);
            
            $this->jsonResponse([
                'success' => true,
                'data' => $result
            ]);
            
        } catch (RuntimeException $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            error_log("SequenceController::execute error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to execute sequence step'], 500);
        }
    }
    
    /**
     * GET /api/sequences/{id}/status - Get execution status for a contact
     * Requirements: 2.1, 2.3
     */
    public function status(int $id): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $contactId = $_GET['contact_id'] ?? null;
            if (!$contactId) {
                $this->jsonResponse(['error' => 'contact_id query parameter is required'], 400);
                return;
            }
            
            // Verify sequence ownership
            $sequence = $this->service->getSequenceById($id);
            if (!$sequence || $sequence['user_id'] != $userId) {
                $this->jsonResponse(['error' => 'Sequence not found'], 404);
                return;
            }
            
            $status = $this->service->getExecutionStatus($id, (int) $contactId);
            
            if (!$status) {
                $this->jsonResponse(['error' => 'No execution found for this contact'], 404);
                return;
            }
            
            $this->jsonResponse([
                'success' => true,
                'data' => [
                    'sequence_id' => (int) $status['sequence_id'],
                    'sequence_name' => $status['sequence_name'],
                    'contact_id' => (int) $status['contact_id'],
                    'current_step' => (int) $status['current_step'],
                    'total_steps' => count(json_decode($status['steps'], true)),
                    'status' => $status['status'],
                    'started_at' => $status['started_at'],
                    'completed_at' => $status['completed_at'],
                    'step_logs' => array_map(function($log) {
                        return [
                            'step_index' => (int) $log['step_index'],
                            'step_type' => $log['step_type'],
                            'status' => $log['status'],
                            'executed_at' => $log['executed_at'],
                            'metadata' => $log['metadata'] ? json_decode($log['metadata'], true) : null
                        ];
                    }, $status['step_logs'])
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("SequenceController::status error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to get execution status'], 500);
        }
    }
    
    /**
     * POST /api/sequences/{id}/pause - Pause execution for a contact
     */
    public function pause(int $id): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['contact_id'])) {
                $this->jsonResponse(['error' => 'contact_id is required'], 400);
                return;
            }
            
            $this->service->pauseExecution($id, (int) $data['contact_id']);
            
            $this->jsonResponse([
                'success' => true,
                'message' => 'Sequence execution paused'
            ]);
            
        } catch (Exception $e) {
            error_log("SequenceController::pause error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to pause execution'], 500);
        }
    }
    
    /**
     * POST /api/sequences/{id}/resume - Resume execution for a contact
     */
    public function resume(int $id): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['contact_id'])) {
                $this->jsonResponse(['error' => 'contact_id is required'], 400);
                return;
            }
            
            $this->service->resumeExecution($id, (int) $data['contact_id']);
            
            $this->jsonResponse([
                'success' => true,
                'message' => 'Sequence execution resumed'
            ]);
            
        } catch (Exception $e) {
            error_log("SequenceController::resume error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to resume execution'], 500);
        }
    }
    
    /**
     * Send JSON response
     */
    private function jsonResponse(array $data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
    }
}
