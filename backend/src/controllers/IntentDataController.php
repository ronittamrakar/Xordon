<?php
/**
 * IntentDataController - REST API endpoints for intent data
 * Requirements: 5.1, 5.2, 5.4
 */

require_once __DIR__ . '/../services/IntentDataService.php';
require_once __DIR__ . '/../Auth.php';

class IntentDataController {
    private $service;
    
    public function __construct() {
        $this->service = new IntentDataService();
    }
    
    /**
     * POST /api/intent/ingest - Receive intent data from providers
     * Requirements: 5.1
     */
    public function ingest(): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['signals']) || !is_array($data['signals'])) {
                $this->jsonResponse(['error' => 'signals array is required'], 400);
                return;
            }
            
            $ingested = $this->service->ingestIntentData($data['signals']);
            
            $this->jsonResponse([
                'success' => true,
                'data' => [
                    'ingested' => $ingested,
                    'total' => count($data['signals'])
                ],
                'message' => "{$ingested} signals ingested successfully"
            ]);
            
        } catch (Exception $e) {
            error_log("IntentDataController::ingest error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to ingest intent data'], 500);
        }
    }
    
    /**
     * GET /api/contacts/{id}/intent - Get intent signals for a contact
     * Requirements: 5.2
     */
    public function getContactIntent(int $contactId): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $includeStale = isset($_GET['include_stale']) && $_GET['include_stale'] === 'true';
            $signals = $this->service->getContactIntentSignals($contactId, $includeStale);
            
            $this->jsonResponse([
                'success' => true,
                'data' => [
                    'contact_id' => $contactId,
                    'signals' => $signals,
                    'count' => count($signals)
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("IntentDataController::getContactIntent error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to get intent signals'], 500);
        }
    }
    
    /**
     * POST /api/intent/mark-stale - Mark old signals as stale
     * Requirements: 5.4
     */
    public function markStale(): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $markedStale = $this->service->markStaleSignals();
            
            $this->jsonResponse([
                'success' => true,
                'data' => ['marked_stale' => $markedStale],
                'message' => "{$markedStale} signals marked as stale"
            ]);
            
        } catch (Exception $e) {
            error_log("IntentDataController::markStale error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to mark stale signals'], 500);
        }
    }
    
    /**
     * GET /api/intent/high - Get high-strength intent signals
     * Requirements: 5.3
     */
    public function getHighIntent(): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $signals = $this->service->getHighIntentSignals();
            
            $formatted = array_map(function($signal) {
                return [
                    'id' => (int) $signal['id'],
                    'contact_id' => (int) $signal['contact_id'],
                    'contact_name' => $signal['contact_name'],
                    'contact_email' => $signal['contact_email'],
                    'topic' => $signal['topic'],
                    'strength' => $signal['strength'],
                    'source' => $signal['source'],
                    'detected_at' => $signal['detected_at']
                ];
            }, $signals);
            
            $this->jsonResponse([
                'success' => true,
                'data' => $formatted
            ]);
            
        } catch (Exception $e) {
            error_log("IntentDataController::getHighIntent error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to get high intent signals'], 500);
        }
    }
    
    /**
     * GET /api/intent/signals - Get all active signals
     */
    public function getSignals(): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;
            $signals = $this->service->getActiveSignals($limit);
            
            $formatted = array_map(function($signal) {
                return [
                    'id' => (int) $signal['id'],
                    'contact_id' => $signal['contact_id'] ? (int) $signal['contact_id'] : null,
                    'contact_name' => $signal['contact_name'],
                    'contact_email' => $signal['contact_email'],
                    'topic' => $signal['topic'],
                    'strength' => $signal['strength'],
                    'source' => $signal['source'],
                    'source_url' => $signal['source_url'],
                    'detected_at' => $signal['detected_at'],
                    'is_stale' => (bool) $signal['is_stale']
                ];
            }, $signals);
            
            $this->jsonResponse([
                'success' => true,
                'data' => $formatted
            ]);
            
        } catch (Exception $e) {
            error_log("IntentDataController::getSignals error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to get signals'], 500);
        }
    }
    
    /**
     * GET /api/intent/signals/{id} - Get a single signal
     */
    public function getSignal(int $signalId): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $signal = $this->service->getSignalById($signalId);
            
            if (!$signal) {
                $this->jsonResponse(['error' => 'Signal not found'], 404);
                return;
            }
            
            $this->jsonResponse([
                'success' => true,
                'data' => [
                    'id' => (int) $signal['id'],
                    'contact_id' => $signal['contact_id'] ? (int) $signal['contact_id'] : null,
                    'contact_name' => $signal['contact_name'],
                    'contact_email' => $signal['contact_email'],
                    'topic' => $signal['topic'],
                    'strength' => $signal['strength'],
                    'source' => $signal['source'],
                    'source_url' => $signal['source_url'],
                    'detected_at' => $signal['detected_at'],
                    'is_stale' => (bool) $signal['is_stale'],
                    'match_type' => $signal['match_type'],
                    'match_confidence' => $signal['match_confidence'] ? (float) $signal['match_confidence'] : null,
                    'metadata' => $signal['metadata'] ? json_decode($signal['metadata'], true) : null
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("IntentDataController::getSignal error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to get signal'], 500);
        }
    }
    
    /**
     * GET /api/intent/topics/{topic} - Get signals by topic
     */
    public function getByTopic(string $topic): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $signals = $this->service->getSignalsByTopic(urldecode($topic));
            
            $formatted = array_map(function($signal) {
                return [
                    'id' => (int) $signal['id'],
                    'contact_id' => $signal['contact_id'] ? (int) $signal['contact_id'] : null,
                    'contact_name' => $signal['contact_name'],
                    'topic' => $signal['topic'],
                    'strength' => $signal['strength'],
                    'detected_at' => $signal['detected_at']
                ];
            }, $signals);
            
            $this->jsonResponse([
                'success' => true,
                'data' => $formatted
            ]);
            
        } catch (Exception $e) {
            error_log("IntentDataController::getByTopic error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to get signals by topic'], 500);
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
