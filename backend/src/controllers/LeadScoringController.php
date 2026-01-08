<?php
/**
 * Lead Scoring Controller
 * 
 * REST API endpoints for lead scoring
 * Requirements: 1.1, 1.3
 */

require_once __DIR__ . '/../services/LeadScoringService.php';

class LeadScoringController {
    private $leadScoringService;
    private $pdo;
    
    public function __construct() {
        $this->pdo = Database::conn();
        $this->leadScoringService = new LeadScoringService($this->pdo);
    }
    
    /**
     * GET /api/leads/scores - Get top leads by score
     */
    public function getTopLeads(): void {
        try {
            $userId = Auth::userId();
            $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 20;
            
            $leads = $this->leadScoringService->getTopLeads($limit, $userId);
            
            Response::json([
                'success' => true,
                'data' => $leads,
                'count' => count($leads)
            ]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * GET /api/leads/{id}/score - Get lead score for a contact
     */
    public function getScore(int $contactId): void {
        try {
            $score = $this->leadScoringService->getLatestScore($contactId);
            
            if (!$score) {
                Response::json(['success' => false, 'error' => 'No score found for this contact'], 404);
                return;
            }
            
            Response::json(['success' => true, 'data' => $score]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * POST /api/leads/{id}/calculate-score - Recalculate score for a contact
     */
    public function calculateScore(int $contactId): void {
        try {
            $score = $this->leadScoringService->calculateScore($contactId);
            
            Response::json([
                'success' => true,
                'message' => 'Score calculated successfully',
                'data' => $score
            ]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * GET /api/leads/{id}/score-history - Get score history for a contact
     */
    public function getScoreHistory(int $contactId): void {
        try {
            $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 30;
            $history = $this->leadScoringService->getScoreHistory($contactId, $limit);
            
            Response::json([
                'success' => true,
                'data' => $history,
                'count' => count($history)
            ]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * GET /api/leads/{id}/score-changes - Get score changes for a contact
     */
    public function getScoreChanges(int $contactId): void {
        try {
            $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 20;
            $changes = $this->leadScoringService->getScoreChanges($contactId, $limit);
            
            Response::json([
                'success' => true,
                'data' => $changes,
                'count' => count($changes)
            ]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * GET /api/lead-scoring/weights - Get current weights
     */
    public function getWeights(): void {
        try {
            $userId = Auth::userId();
            $weights = $this->leadScoringService->getWeightsForUser($userId);
            $defaults = $this->leadScoringService->getDefaultWeights();
            
            Response::json([
                'success' => true,
                'data' => [
                    'weights' => $weights,
                    'defaults' => $defaults
                ]
            ]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * PUT /api/lead-scoring/weights - Update weights
     */
    public function updateWeights(): void {
        try {
            $userId = Auth::userId();
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data)) {
                Response::json(['success' => false, 'error' => 'No weights provided'], 400);
                return;
            }
            
            $this->leadScoringService->updateWeights($userId, $data);
            
            Response::json([
                'success' => true,
                'message' => 'Weights updated successfully',
                'data' => $this->leadScoringService->getWeightsForUser($userId)
            ]);
        } catch (InvalidArgumentException $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * POST /api/lead-scoring/recalculate-all - Recalculate all scores for user
     */
    public function recalculateAll(): void {
        try {
            $userId = Auth::userId();
            $count = $this->leadScoringService->recalculateAllScores($userId);
            
            Response::json([
                'success' => true,
                'message' => "Recalculated scores for $count contacts"
            ]);
        } catch (Exception $e) {
            Response::json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
