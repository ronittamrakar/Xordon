<?php
/**
 * Pipeline Controller
 * 
 * REST API endpoints for pipeline management and forecasting.
 * 
 * **Feature: crm-enhancements**
 * **Requirements: 6.1, 6.2, 6.4**
 */

require_once __DIR__ . '/../services/PipelineForecastingService.php';

class PipelineController {
    private $service;
    
    public function __construct() {
        $this->service = new PipelineForecastingService();
    }
    
    /**
     * GET /api/pipeline - Get pipeline view with deals grouped by stage
     */
    public function getPipeline(): void {
        try {
            $userId = $this->getUserId();
            
            $filters = [
                'rep_id' => $_GET['rep_id'] ?? null,
                'campaign_id' => $_GET['campaign_id'] ?? null,
                'date_from' => $_GET['date_from'] ?? null,
                'date_to' => $_GET['date_to'] ?? null,
                'status' => $_GET['status'] ?? null
            ];
            
            $pipeline = $this->service->getDealsByStage($userId, array_filter($filters));
            
            $this->jsonResponse(['success' => true, 'data' => $pipeline]);
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage());
        }
    }
    
    /**
     * GET /api/pipeline/forecast - Get revenue forecast
     */
    public function getForecast(): void {
        try {
            $userId = $this->getUserId();
            
            $filters = [
                'date_from' => $_GET['date_from'] ?? null,
                'date_to' => $_GET['date_to'] ?? null
            ];
            
            $forecast = $this->service->calculateForecast($userId, array_filter($filters));
            
            $this->jsonResponse(['success' => true, 'data' => $forecast]);
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage());
        }
    }
    
    /**
     * GET /api/pipeline/velocity - Get deal velocity metrics
     */
    public function getVelocity(): void {
        try {
            $userId = $this->getUserId();
            
            $filters = [
                'date_from' => $_GET['date_from'] ?? null,
                'date_to' => $_GET['date_to'] ?? null
            ];
            
            $velocity = $this->service->calculateVelocity($userId, array_filter($filters));
            
            $this->jsonResponse(['success' => true, 'data' => $velocity]);
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage());
        }
    }
    
    /**
     * POST /api/pipeline/deals - Create a new deal
     */
    public function createDeal(): void {
        try {
            $userId = $this->getUserId();
            $data = $this->getJsonBody();
            
            if (empty($data['name'])) {
                throw new InvalidArgumentException('Deal name is required');
            }
            
            $dealId = $this->service->createDeal($userId, $data);
            $deal = $this->service->getDealById($dealId);
            
            $this->jsonResponse(['success' => true, 'data' => $deal], 201);
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage());
        }
    }
    
    /**
     * PUT /api/pipeline/deals/{id}/stage - Update deal stage
     */
    public function updateDealStage(int $dealId): void {
        try {
            $userId = $this->getUserId();
            $data = $this->getJsonBody();
            
            if (empty($data['stage'])) {
                throw new InvalidArgumentException('Stage is required');
            }
            
            $success = $this->service->updateDealStage($dealId, $data['stage'], $userId);
            
            if (!$success) {
                throw new Exception('Deal not found');
            }
            
            $deal = $this->service->getDealById($dealId);
            
            $this->jsonResponse(['success' => true, 'data' => $deal]);
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage());
        }
    }
    
    /**
     * PUT /api/pipeline/probabilities - Update stage probabilities
     */
    public function updateProbabilities(): void {
        try {
            $userId = $this->getUserId();
            $data = $this->getJsonBody();
            
            if (empty($data['probabilities']) || !is_array($data['probabilities'])) {
                throw new InvalidArgumentException('Probabilities object is required');
            }
            
            $this->service->updateStageProbabilities($userId, $data['probabilities']);
            
            $this->jsonResponse(['success' => true, 'message' => 'Probabilities updated']);
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage());
        }
    }
    
    /**
     * GET /api/pipeline/deals/{id} - Get deal by ID
     */
    public function getDeal(int $dealId): void {
        try {
            $deal = $this->service->getDealById($dealId);
            
            if (!$deal) {
                $this->errorResponse('Deal not found', 404);
                return;
            }
            
            $this->jsonResponse(['success' => true, 'data' => $deal]);
        } catch (Exception $e) {
            $this->errorResponse($e->getMessage());
        }
    }
    
    private function getUserId(): int {
        // Get user ID from auth context
        global $userId;
        if (!$userId) {
            throw new Exception('Unauthorized', 401);
        }
        return (int) $userId;
    }
    
    private function getJsonBody(): array {
        $json = file_get_contents('php://input');
        return json_decode($json, true) ?? [];
    }
    
    private function jsonResponse(array $data, int $code = 200): void {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode($data);
    }
    
    private function errorResponse(string $message, int $code = 400): void {
        $this->jsonResponse(['success' => false, 'error' => $message], $code);
    }
}
