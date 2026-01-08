<?php
namespace Xordon\Controllers;

use Xordon\Database;
use Xordon\Response;
use AiService;
use PDO;
use Exception;

require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../Response.php';
require_once __DIR__ . '/../services/AiService.php';

class ReviewResponseAIController {
    
    /**
     * Generate an AI response for a specific review
     */
    public static function generateResponse($reviewId) {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            // Fetch review details
            $stmt = $db->prepare("SELECT * FROM reviews WHERE id = ? AND workspace_id = ?");
            $stmt->execute([$reviewId, $workspaceId]);
            $review = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$review) {
                return Response::json(['error' => 'Review not found'], 404);
            }
            
            $reviewText = $review['review_text'] ?? '';
            $rating = $review['rating'] ?? 5;
            $platform = $review['platform'] ?? 'Google';
            
            // Initialize AI Service
            $aiService = new AiService($db);
            
            // Construct prompt
            $prompt = sprintf(
                "Write a professional, empathetic, and concise reply to the following customer review on %s.\n\nRating: %d/5 stars\nReview text: \"%s\"\n\nThe reply should be optimized for %s and address any specific feedback mentioned.",
                $platform,
                $rating,
                $reviewText,
                $platform
            );
            
            // Add instructions for positive/negative reviews
            if ($rating >= 4) {
                $prompt .= "\n\nMake it appreciative and encouraging.";
            } else {
                $prompt .= "\n\nMake it professional, apologetic where appropriate, and offer to resolve any issues offline.";
            }
            
            $payload = [
                'channel' => 'reviews',
                'prompt' => $prompt,
                'action' => 'generation',
                'temperature' => 0.7
            ];
            
            $result = $aiService->generate($_SESSION['user_id'] ?? 1, $payload);
            
            return Response::json([
                'success' => true,
                'response' => $result['output'],
                'model' => $result['model'],
                'review_id' => $reviewId
            ]);
            
        } catch (Exception $e) {
            return Response::json(['error' => 'Failed to generate AI response', 'message' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Post the generated response back to the platform (mocked/internal)
     */
    public static function postResponse($reviewId) {
        try {
            $db = Database::conn();
            $workspaceId = $_SESSION['workspace_id'] ?? 1;
            
            $input = json_decode(file_get_contents('php://input'), true);
            $responseContent = $input['response_content'] ?? '';
            
            if (empty($responseContent)) {
                return Response::json(['error' => 'Response content is required'], 400);
            }
            
            // Save the response to the database
            $stmt = $db->prepare("
                UPDATE reviews 
                SET reply_text = ?, 
                    reply_date = NOW(), 
                    replied = TRUE,
                    updated_at = NOW()
                WHERE id = ? AND workspace_id = ?
            ");
            $stmt->execute([$responseContent, $reviewId, $workspaceId]);
            
            // In a real scenario, this would trigger ReviewIntegrationService to post to Google/FB
            // require_once __DIR__ . '/../services/ReviewIntegrationService.php';
            // ... logic to call ReviewIntegrationService::replyToGoogleReview(...) ...
            
            return Response::json(['success' => true, 'message' => 'Response saved and scheduled for posting']);
            
        } catch (Exception $e) {
            return Response::json(['error' => 'Failed to post reply', 'message' => $e->getMessage()], 500);
        }
    }
}
