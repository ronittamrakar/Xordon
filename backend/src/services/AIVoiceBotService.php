<?php
namespace Xordon\Services;

use Xordon\Database;
use Xordon\Logger;
use PDO;

/**
 * AIVoiceBotService - Handles real-time voice interactions using AI
 */
class AIVoiceBotService {
    
    /**
     * Process an AI turn in a voice conversation
     */
    public static function handleTurn(int $agentId, string $userInput, string $callSid, array $history = []): array {
        $pdo = Database::conn();
        
        // Fetch agent configuration
        $stmt = $pdo->prepare("SELECT * FROM ai_agents WHERE id = ?");
        $stmt->execute([$agentId]);
        $agent = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$agent) {
            return [
                'response' => "I'm sorry, I'm having trouble connecting to my brain right now.",
                'next_action' => 'hangup'
            ];
        }
        
        $prompt = $agent['prompt'] ?? "You are a helpful assistant.";
        $model = $agent['model'] ?? 'gpt-3.5-turbo';
        
        // Prepare OpenAI request
        $messages = [
            ['role' => 'system', 'content' => $prompt]
        ];
        
        // Add history
        foreach ($history as $turn) {
            $messages[] = ['role' => 'user', 'content' => $turn['user']];
            $messages[] = ['role' => 'assistant', 'content' => $turn['bot']];
        }
        
        // Add current input
        $messages[] = ['role' => 'user', 'content' => $userInput];
        
        try {
            $openAI = new OpenAIService();
            // We use a custom method for voice interaction to get cleaner responses
            $aiResponse = self::callOpenAI($messages, $model);
            
            // Log the turn
            self::logTurn($callSid, $agentId, $userInput, $aiResponse);
            
            return [
                'response' => $aiResponse,
                'next_action' => 'gather'
            ];
        } catch (\Exception $e) {
            Logger::error("AI Voice Bot Error: " . $e->getMessage());
            return [
                'response' => "I'm having some technical difficulties. Let me transfer you to a human.",
                'next_action' => 'transfer'
            ];
        }
    }
    
    /**
     * Helper to call OpenAI with specific settings for voice
     */
    private static function callOpenAI(array $messages, string $model): string {
        $apiKey = getenv('OPENAI_API_KEY');
        if (!$apiKey) {
            return "Developer note: OpenAI API key is missing. Please check your configuration.";
        }
        
        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'model' => $model,
            'messages' => $messages,
            'max_tokens' => 150,
            'temperature' => 0.7
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $data = json_decode($response, true);
        return $data['choices'][0]['message']['content'] ?? "I didn't quite catch that. Could you repeat it?";
    }
    
    /**
     * Log a conversation turn for context and analytics
     */
    private static function logTurn(string $callSid, int $agentId, string $userText, string $botText): void {
        $pdo = Database::conn();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO ai_chat_logs (call_sid, agent_id, user_text, bot_text, created_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$callSid, $agentId, $userText, $botText]);
        } catch (\Exception $e) {
            // Silently fail logging if table doesn't exist yet
        }
    }
    
    /**
     * Generate TwiML/SWML for the AI loop
     */
    public static function generateLoopXml(string $response, int $agentId, string $callSid): string {
        $callbackUrl = "/api/phone/ai-callback?agentId=$agentId";
        
        $xml = '<?xml version="1.0" encoding="UTF-8"?><Response>';
        $xml .= '<Gather input="speech" action="' . $callbackUrl . '" timeout="3" hints="sales, support, billing, cancel">';
        $xml .= '<Say>' . htmlspecialchars($response) . '</Say>';
        $xml .= '</Gather>';
        $xml .= '<Redirect>' . $callbackUrl . '?status=no-input</Redirect>';
        $xml .= '</Response>';
        
        return $xml;
    }
}
