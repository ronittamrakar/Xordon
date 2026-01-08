<?php
/**
 * ConversationIntelligenceController - REST API endpoints for call analysis
 * Requirements: 4.1, 4.2, 4.4
 */

require_once __DIR__ . '/../services/ConversationIntelligenceService.php';
require_once __DIR__ . '/../Auth.php';

class ConversationIntelligenceController {
    private $service;
    
    public function __construct() {
        $this->service = new ConversationIntelligenceService();
    }
    
    /**
     * POST /api/calls/{id}/transcribe - Start transcription for a call
     * Requirements: 4.1
     */
    public function transcribe(int $callId): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $transcriptionId = $this->service->transcribeCall($callId);
            
            $this->jsonResponse([
                'success' => true,
                'data' => [
                    'transcription_id' => $transcriptionId,
                    'call_id' => $callId
                ],
                'message' => 'Transcription started'
            ]);
            
        } catch (Exception $e) {
            error_log("ConversationIntelligenceController::transcribe error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to start transcription'], 500);
        }
    }
    
    /**
     * GET /api/calls/{id}/analysis - Get analysis for a call
     * Requirements: 4.2
     */
    public function getAnalysis(int $callId): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $analysis = $this->service->getCallAnalysis($callId);
            
            if (!$analysis) {
                $this->jsonResponse(['error' => 'Analysis not found for this call'], 404);
                return;
            }
            
            $this->jsonResponse([
                'success' => true,
                'data' => [
                    'call_id' => $callId,
                    'transcription_id' => (int) $analysis['id'],
                    'status' => $analysis['status'],
                    'text' => $analysis['text'],
                    'speakers' => $analysis['speakers'] ? json_decode($analysis['speakers'], true) : null,
                    'duration_seconds' => (int) ($analysis['duration_seconds'] ?? 0),
                    'word_count' => (int) ($analysis['word_count'] ?? 0),
                    'sentiment_score' => $analysis['sentiment_score'] !== null ? (float) $analysis['sentiment_score'] : null,
                    'intent_score' => $analysis['intent_score'] !== null ? (int) $analysis['intent_score'] : null,
                    'key_phrases' => $analysis['key_phrases'] ? json_decode($analysis['key_phrases'], true) : [],
                    'objections' => $analysis['objections'] ? json_decode($analysis['objections'], true) : [],
                    'buying_signals' => $analysis['buying_signals'] ? json_decode($analysis['buying_signals'], true) : [],
                    'talk_ratio' => $analysis['talk_ratio'] !== null ? (float) $analysis['talk_ratio'] : null
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("ConversationIntelligenceController::getAnalysis error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to get analysis'], 500);
        }
    }
    
    /**
     * GET /api/calls/{id}/signals - Get extracted signals for a call
     * Requirements: 4.4
     */
    public function getSignals(int $callId): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $analysis = $this->service->getCallAnalysis($callId);
            
            if (!$analysis) {
                $this->jsonResponse(['error' => 'Analysis not found for this call'], 404);
                return;
            }
            
            $this->jsonResponse([
                'success' => true,
                'data' => [
                    'call_id' => $callId,
                    'objections' => $analysis['objections'] ? json_decode($analysis['objections'], true) : [],
                    'buying_signals' => $analysis['buying_signals'] ? json_decode($analysis['buying_signals'], true) : [],
                    'key_phrases' => $analysis['key_phrases'] ? json_decode($analysis['key_phrases'], true) : [],
                    'intent_score' => $analysis['intent_score'] !== null ? (int) $analysis['intent_score'] : null,
                    'sentiment_score' => $analysis['sentiment_score'] !== null ? (float) $analysis['sentiment_score'] : null
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("ConversationIntelligenceController::getSignals error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to get signals'], 500);
        }
    }
    
    /**
     * POST /api/calls/{id}/analyze - Analyze an existing transcription
     */
    public function analyze(int $callId): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            // First ensure transcription exists
            $transcriptionId = $this->service->transcribeCall($callId);
            
            // Then analyze
            $analysis = $this->service->analyzeTranscription($transcriptionId);
            
            $this->jsonResponse([
                'success' => true,
                'data' => $analysis,
                'message' => 'Analysis completed'
            ]);
            
        } catch (RuntimeException $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            error_log("ConversationIntelligenceController::analyze error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to analyze call'], 500);
        }
    }
    
    /**
     * GET /api/transcriptions/{id} - Get transcription by ID
     */
    public function getTranscription(int $transcriptionId): void {
        try {
            $userId = Auth::userId();
            if (!$userId) {
                $this->jsonResponse(['error' => 'Unauthorized'], 401);
                return;
            }
            
            $transcription = $this->service->getTranscription($transcriptionId);
            
            if (!$transcription) {
                $this->jsonResponse(['error' => 'Transcription not found'], 404);
                return;
            }
            
            $this->jsonResponse([
                'success' => true,
                'data' => [
                    'id' => (int) $transcription['id'],
                    'call_id' => (int) $transcription['call_id'],
                    'status' => $transcription['status'],
                    'text' => $transcription['text'],
                    'speakers' => $transcription['speakers'] ? json_decode($transcription['speakers'], true) : null,
                    'duration_seconds' => (int) ($transcription['duration_seconds'] ?? 0),
                    'word_count' => (int) ($transcription['word_count'] ?? 0),
                    'failure_reason' => $transcription['failure_reason'],
                    'created_at' => $transcription['created_at'],
                    'completed_at' => $transcription['completed_at']
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("ConversationIntelligenceController::getTranscription error: " . $e->getMessage());
            $this->jsonResponse(['error' => 'Failed to get transcription'], 500);
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
