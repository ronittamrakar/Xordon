<?php

namespace Xordon\Controllers;

use Database;
use Auth;
use Response;

class AIFeaturesController {
    
    // ============================================================================
    // CONTENT GENERATION
    // ============================================================================
    
    public static function generateContent() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $contentType = $data['content_type'] ?? $data['channel'] ?? 'email';
        $action = $data['action'] ?? 'generate';
        $prompt = $data['prompt'] ?? '';
        $context = $data['context'] ?? [];
        $systemPrompt = $data['systemPrompt'] ?? '';
        
        // Handle Chat Simulation
        if ($action === 'simulate' || $contentType === 'chat') {
            $generatedContent = self::mockChatResponse($prompt, $systemPrompt);
        } else {
            // In production, this would call OpenAI API
            // For now, return mock generated content
            $generatedContent = self::mockGenerateContent($contentType, $prompt, $context);
        }
        
        // Save to history
        $db = Database::conn();
        $stmt = $db->prepare("
            INSERT INTO ai_content_generations 
            (workspace_id, user_id, content_type, prompt, generated_content, model, tokens_used)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $ctx->workspaceId,
            Auth::userId(),
            $contentType,
            $prompt,
            $generatedContent,
            'gpt-4',
            strlen($generatedContent) / 4 // Rough token estimate
        ]);
        
        Response::json([
            'success' => true,
            'provider' => 'mock',
            'model' => 'gpt-4',
            'output' => $generatedContent, // Matches AiGenerateResult
            'content' => $generatedContent, // Backward compatibility
            'generation_id' => $db->lastInsertId()
        ]);
        return;
    }
    
    public static function listGenerations() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $contentType = $_GET['content_type'] ?? null;
        $limit = (int)($_GET['limit'] ?? 50);
        
        $db = Database::conn();
        
        $sql = "SELECT * FROM ai_content_generations WHERE workspace_id = ?";
        $params = [$ctx->workspaceId];
        
        if ($contentType) {
            $sql .= " AND content_type = ?";
            $params[] = $contentType;
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $generations = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        Response::json(['success' => true, 'data' => $generations]);
        return;
    }
    
    public static function rateGeneration($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE ai_content_generations 
            SET quality_rating = ?, was_used = ?
            WHERE id = ? AND workspace_id = ?
        ");
        $stmt->execute([
            $data['rating'] ?? null,
            $data['was_used'] ?? false,
            $id,
            $ctx->workspaceId
        ]);
        
        Response::json(['success' => true, 'message' => 'Rating saved']);
        return;
    }
    
    // ============================================================================
    // SENTIMENT ANALYSIS
    // ============================================================================
    
    public static function analyzeSentiment() {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $entityType = $data['entity_type'];
        $entityId = $data['entity_id'];
        $content = $data['content'];
        
        // In production, this would call sentiment analysis API
        $analysis = self::mockAnalyzeSentiment($content);
        
        // Save analysis
        $db = Database::conn();
        $stmt = $db->prepare("
            INSERT INTO ai_sentiment_analysis 
            (workspace_id, entity_type, entity_id, content, sentiment, sentiment_score, emotions, keywords)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $ctx->workspaceId,
            $entityType,
            $entityId,
            $content,
            $analysis['sentiment'],
            $analysis['score'],
            json_encode($analysis['emotions']),
            json_encode($analysis['keywords'])
        ]);
        
        Response::json(['success' => true, 'data' => $analysis]);
        return;
    }
    
    public static function getSentimentAnalysis() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $entityType = $_GET['entity_type'] ?? null;
        $entityId = $_GET['entity_id'] ?? null;
        
        $db = Database::conn();
        
        $sql = "SELECT * FROM ai_sentiment_analysis WHERE workspace_id = ?";
        $params = [$ctx->workspaceId];
        
        if ($entityType) {
            $sql .= " AND entity_type = ?";
            $params[] = $entityType;
        }
        
        if ($entityId) {
            $sql .= " AND entity_id = ?";
            $params[] = $entityId;
        }
        
        $sql .= " ORDER BY analyzed_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $analyses = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($analyses as &$analysis) {
            $analysis['emotions'] = json_decode($analysis['emotions'], true);
            $analysis['keywords'] = json_decode($analysis['keywords'], true);
        }
        
        Response::json(['success' => true, 'data' => $analyses]);
        return;
    }
    
    // ============================================================================
    // RECOMMENDATIONS
    // ============================================================================
    
    public static function getRecommendations() {
        $ctx = $GLOBALS['tenantContext'] ?? null;
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $type = $_GET['type'] ?? null;
        $status = $_GET['status'] ?? 'pending';
        
        $db = Database::conn();
        
        $sql = "SELECT * FROM ai_recommendations WHERE workspace_id = ?";
        $params = [$ctx->workspaceId];
        
        if ($type) {
            $sql .= " AND recommendation_type = ?";
            $params[] = $type;
        }
        
        if ($status) {
            $sql .= " AND status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY confidence_score DESC, created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $recommendations = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($recommendations as &$rec) {
            $rec['data'] = json_decode($rec['data'], true);
        }
        
        Response::json(['success' => true, 'data' => $recommendations]);
        return;
    }
    
    public static function updateRecommendationStatus($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $ctx = $GLOBALS['tenantContext'] ?? null;
        
        if (!$ctx || !isset($ctx->workspaceId)) {
            Response::error('Unauthorized', 401);
            return;
        }
        
        $db = Database::conn();
        
        $stmt = $db->prepare("
            UPDATE ai_recommendations 
            SET status = ?
            WHERE id = ? AND workspace_id = ?
        ");
        $stmt->execute([
            $data['status'],
            $id,
            $ctx->workspaceId
        ]);
        
        Response::json(['success' => true, 'message' => 'Recommendation updated']);
        return;
    }
    
    // ============================================================================
    // MOCK FUNCTIONS (Replace with real AI API calls in production)
    // ============================================================================
    
    private static function mockChatResponse($prompt, $systemPrompt) {
        $responses = [
            "I understand you're interested in that. Could you tell me more?",
            "That's a great question! Based on my training, I can tell you...",
            "I'm here to help with exactly that kind of inquiry.",
            "Let me check the details for you...",
            "Thanks for reaching out! How else can I assist you today?",
            "Could you clarify what you mean by that?",
        ];
        
        $response = $responses[array_rand($responses)];
        
        // Simple logic to make it feel a bit responsive
        if (stripos($prompt, 'price') !== false || stripos($prompt, 'cost') !== false) {
            $response = "Our pricing varies based on your specific needs. Would you like to schedule a consultation?";
        } elseif (stripos($prompt, 'hello') !== false || stripos($prompt, 'hi') !== false) {
            $response = "Hello! How can I help you today?";
        } elseif (stripos($prompt, 'help') !== false) {
            $response = "I'm here to help! What specific issue are you facing?";
        }
        
        return $response . " (Simulated)";
    }

    private static function mockGenerateContent($type, $prompt, $context) {
        $templates = [
            'email' => "Subject: {$prompt}\n\nDear valued customer,\n\nThank you for your interest. Based on your needs, we'd like to share some exciting opportunities with you.\n\nBest regards,\nYour Team",
            'sms' => "Hi! {$prompt} - Reply YES to learn more or STOP to unsubscribe.",
            'social' => "🎉 {$prompt} Check out our latest updates! #business #growth",
            'subject_line' => "🔥 {$prompt} - Limited Time Offer Inside!",
        ];
        
        return $templates[$type] ?? "Generated content for: {$prompt}";
    }
    
    private static function mockAnalyzeSentiment($content) {
        $length = strlen($content);
        $positiveWords = ['great', 'excellent', 'amazing', 'love', 'best', 'wonderful'];
        $negativeWords = ['bad', 'terrible', 'worst', 'hate', 'awful', 'poor'];
        
        $positiveCount = 0;
        $negativeCount = 0;
        
        foreach ($positiveWords as $word) {
            if (stripos($content, $word) !== false) $positiveCount++;
        }
        
        foreach ($negativeWords as $word) {
            if (stripos($content, $word) !== false) $negativeCount++;
        }
        
        if ($positiveCount > $negativeCount) {
            $sentiment = 'positive';
            $score = 0.7 + ($positiveCount * 0.1);
        } elseif ($negativeCount > $positiveCount) {
            $sentiment = 'negative';
            $score = 0.3 - ($negativeCount * 0.1);
        } else {
            $sentiment = 'neutral';
            $score = 0.5;
        }
        
        $score = max(0, min(1, $score));
        
        return [
            'sentiment' => $sentiment,
            'score' => $score,
            'emotions' => ['joy' => 0.3, 'trust' => 0.4, 'anticipation' => 0.3],
            'keywords' => ['service', 'quality', 'experience']
        ];
    }
}
